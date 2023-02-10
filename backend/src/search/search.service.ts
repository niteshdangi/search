import {
  AggregationsAggregate,
  SearchResponse,
} from '@elastic/elasticsearch/lib/api/types';
import { Injectable } from '@nestjs/common';
import { ElasticsearchService } from '@nestjs/elasticsearch';
import * as moment from 'moment';
import {
  CrawlerData,
  Image,
  SearchHistory,
  SearchResultItem,
} from './dto/search.dto';
import { SearchQueries } from './search.queries';

@Injectable()
export class SearchService {
  constructor(
    private readonly esService: ElasticsearchService,
    private readonly queryService: SearchQueries,
  ) {
    // this.addToCrawler('https://www.imdb.com/title/tt4154796/', true).then(
    //   (res) => console.log(res),
    // );
  }
  async search(query: string, tab?: string, size?: number) {
    const startTime = moment();
    query = query.trim();
    const pastResult = await this.getHistoryForSearch(query);
    const { results, response } = await this.getResults(
      query,
      tab,
      pastResult,
      size,
    );

    const { tabs, suggestionType } = await this.getTabsForSearch(
      query,
      pastResult,
    );
    const infobox =
      tab === 'all'
        ? await this.getMainInfo(query, results as SearchResultItem[])
        : undefined;

    const { results: suggestions = [] } =
      tab === 'all' && suggestionType
        ? await this.getSuggestionResults(query, pastResult, suggestionType)
        : {};

    this.esService.index({
      index: 'search_history',
      document: {
        user: 'nitesh',
        query: query,
        timestamp: new Date(),
        results: results.map((item) => item.url),
      },
    });

    return {
      results,
      infobox,
      suggestions,
      suggestionType,
      tabs,
      scrollId: response._scroll_id,
      total: {
        ...(typeof response.hits.total === 'object'
          ? {
              ...response.hits.total,
              time: moment().diff(startTime, 'milliseconds') / 1000,
            }
          : {
              value: response.hits.total,
              time: moment().diff(startTime, 'milliseconds') / 1000,
            }),
      },
    };
  }
  async searchScroll(scroll_id: string) {
    const resultsSet = new Set<SearchResultItem | Image>();
    const response = await this.esService.scroll<CrawlerData>({
      scroll_id,
      scroll: '1d',
    });
    const hits = response.hits.hits;
    hits.map((item) => {
      resultsSet.add({
        ...item._source,
        highlights: item?.highlight || undefined,
      });
    });
    const results = Array.from(resultsSet);
    return {
      results,
      scrollId: response._scroll_id,
    };
  }
  async getMainInfo(query: string, results: SearchResultItem[]) {
    const info = await this.esService.search<SearchResultItem>({
      index: 'data',
      query: this.queryService.getExactMatchSchemaQuery(query, [
        'TVSeries',
        'Movie',
        'Article',
        'MovieCustom',
      ]),
    });
    console.log(info.hits.hits.length + '', '<<');

    if (info.hits.hits.length > 0) {
      const custom = info.hits.hits.filter((a) =>
        (a._source?.data?.type as unknown as string)?.includes?.('Custom'),
      )?.[0]?._source;
      return custom || info.hits.hits[0]?._source;
    }
    if (results?.[0]?.infobox) return results?.[0]?.infobox;
    if (
      results?.filter?.((r) =>
        (r.data?.type as unknown as string)?.includes?.('Custom'),
      )?.length
    ) {
      return results?.filter?.((r) =>
        (r.data?.type as unknown as string)?.includes?.('Custom'),
      )?.[0];
    }
    if (results?.[0]?.data) return results?.[0]?.data;
    return undefined;
  }

  async getSuggestionResults(
    query: string,
    pastResult: string[],
    suggestionType: string,
  ) {
    return this.getResults(
      query,
      suggestionType,
      pastResult,
      suggestionType === 'images' ? 12 : suggestionType === 'videos' ? 3 : 6,
    );
  }

  async getResults(
    query: string,
    tab: string,
    pastResult: string[],
    size = 10,
  ) {
    const resultsSet = new Set<SearchResultItem | Image>();
    let response: SearchResponse<
      CrawlerData | Image,
      Record<string, AggregationsAggregate>
    >;

    if (tab.toLowerCase() === 'images') {
      response = await this.esService.search<Image>({
        index: 'images',
        body: this.queryService.searchImageQuery(query, pastResult),
        track_total_hits: true,
        from: 0,
        size,
        scroll: '1d',
      });
    } else if (tab.toLowerCase() === 'news') {
      response = await this.esService.search<CrawlerData>({
        index: 'data',
        body: this.queryService.getNewsQuery(query, 0, size, pastResult, false),
        track_total_hits: true,
        scroll: '1d',
      });
    } else if (tab.toLowerCase() === 'videos') {
      response = await this.esService.search<CrawlerData>({
        index: 'data',
        body: this.queryService.getVideosQuery(
          query,
          0,
          size,
          pastResult,
          false,
        ),
        track_total_hits: true,
        scroll: '1d',
      });
    } else {
      response = await this.esService.search<CrawlerData>({
        index: 'data',
        body: this.queryService.searchQuery(query, 0, size, null, pastResult),
        track_total_hits: true,
        scroll: '1d',
      });
    }
    const hits = response.hits.hits;
    hits.map((item) => {
      resultsSet.add({
        ...item._source,
        highlights: item?.highlight || undefined,
      });
    });
    const results = Array.from(resultsSet);
    return { results, response };
  }

  async getHistoryForSearch(query?: string, size = 3) {
    const ids = new Set<string>();
    const data = await this.esService.search<SearchHistory>({
      index: 'search_history',
      body: this.queryService.pastHistory(query),
      size,
    });
    data.hits.hits.some((hit) => {
      if (hit._source.results?.[0] && ids.size < 3)
        ids.add(hit._source.results?.[0]);
      if (hit._source.results?.[1] && ids.size < 3)
        ids.add(hit._source.results?.[1]);
      return ids.size >= 3;
    });
    return Array.from(ids);
  }

  async getTabsForSearch(query: string, history: string[], skip = '') {
    const tabs = ['All'];
    let suggestionType = '';
    const counts = {};
    if (skip !== 'news') {
      const news = await this.esService.count({
        index: 'data',
        ...this.queryService.getNewsQuery(query, 0, 10, history, true),
      });
      counts['news'] = news.count;
      if (news.count > 0) {
        tabs.push('News');
        if (news.count >= 2) {
          suggestionType = (await this.checkMultiStringIncludes(query, [
            'news',
          ]))
            ? 'news'
            : '';
        }
      }
    } else {
      tabs.push('News');
    }
    if (skip !== 'images') {
      const images = await this.esService.count({
        index: 'images',
        ...this.queryService.searchImageQuery(query, history),
      });
      counts['images'] = images.count;
      if (images.count > 0) {
        tabs.push('Images');
        if (images.count > 9) {
          suggestionType = (await this.checkMultiStringIncludes(query, [
            'img',
            'image',
            'pics',
            'picture',
          ]))
            ? 'images'
            : suggestionType;
        }
      }
    } else {
      tabs.push('Images');
    }
    if (skip !== 'videos') {
      const videos = await this.esService.count({
        index: 'data',
        ...this.queryService.getVideosQuery(query, 0, 10, history, true),
      });
      counts['videos'] = videos.count;
      if (videos.count > 0) {
        tabs.push('Videos');
        if (videos.count > 1) {
          suggestionType = (await this.checkMultiStringIncludes(query, [
            'video',
            'song',
          ]))
            ? 'videos'
            : suggestionType;
        }
      }
    } else {
      tabs.push('Videos');
    }
    if (!suggestionType) {
      const similarQueries: any = await this.esService.search<SearchHistory>({
        index: 'search_history',
        body: this.queryService.similarQueries('snowy mountains'),
      });
      const queries =
        similarQueries.aggregations.deduplicate_by_query.buckets.map(
          (hit) => hit.key,
        );

      if (
        (await this.checkMultiStringIncludes(queries, ['news'])) &&
        (counts?.['news'] || 0) >= 2
      ) {
        suggestionType = 'news';
      }
      if (
        (await this.checkMultiStringIncludes(queries, [
          'img',
          'image',
          'pics',
          'picture',
        ])) &&
        (counts?.['images'] || 0) >= 2
      ) {
        suggestionType = 'images';
      }
      if (
        (await this.checkMultiStringIncludes(queries, ['video', 'song'])) &&
        (counts?.['videos'] || 0) >= 2
      ) {
        suggestionType = 'videos';
      }
    }

    return { tabs, suggestionType };
  }

  async checkMultiStringIncludes(query: string | string[], intents: string[]) {
    if (typeof query === 'object') {
      intents.filter(
        (intent) => query.filter((q) => q.includes(intent))?.length > 0,
      )?.length;
    }
    return intents.filter((intent) => query.includes(intent))?.length > 0;
  }

  async addToCrawler(query: string, addAgain = false) {
    const url = query?.startsWith('http')
      ? query
      : 'https://google.com/search?q=' + query;
    const exists = await this.esService.exists({
      index: 'crawler_status',
      id: url,
    });
    if (exists && !addAgain) {
      const status = await this.esService.get({
        index: 'crawler_status',
        id: url,
      });
      return status;
    }
    this.esService.index({
      index: 'crawler_queue',
      document: {
        url: url,
      },
    });
    return {
      status: 'QUEUE',
      url: url,
    };
  }
}
