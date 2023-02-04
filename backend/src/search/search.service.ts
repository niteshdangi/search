import { HttpException, Injectable } from '@nestjs/common';
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
    // this.esService.index({
    //   index: 'crawler_queue',
    //   document: {
    //     url: 'https://en.wikipedia.org/wiki/Jaat',
    //   },
    // });
  }

  async search(query: string) {
    const startTime = moment();
    query = query.trim();
    const resultsSet = new Set<SearchResultItem>();
    const pastResult = await this.getHistoryForSearch(query);
    const response = await this.esService.search<CrawlerData>({
      index: 'data',
      body: this.queryService.searchQuery(query, 0, 10, null, pastResult),
      track_total_hits: true,
    });

    const hits = response.hits.hits;
    hits.map((item) => {
      resultsSet.add({ ...item._source, highlights: item.highlight });
    });
    const results = Array.from(resultsSet);

    const infobox = results
      .slice(0, 3)
      .filter((item) => !!item.infobox?.length)?.[0];
    const tabs = await this.getTabsForSearch(query, pastResult);

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
      tabs,
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
  async searchImages(query: string) {
    const startTime = moment();
    query = query.trim();
    const resultsSet = new Set<Image>();
    const pastResult = await this.getHistoryForSearch(query);
    const response = await this.esService.search<Image>({
      index: 'images',
      body: this.queryService.searchImageQuery(query, pastResult),
      track_total_hits: true,
      from: 0,
      size: 50,
    });

    const hits = response.hits.hits;
    hits.map((item) => {
      resultsSet.add(item._source);
    });
    const results = Array.from(resultsSet);
    const tabs = await this.getTabsForSearch(query, pastResult, 'image');

    this.esService.index({
      index: 'search_history',
      document: {
        user: 'nitesh',
        query: query,
        timestamp: new Date(),
        results: [],
      },
    });

    return {
      results,
      tabs,
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
    if (skip !== 'news') {
      const news = await this.esService.count({
        index: 'data',
        ...this.queryService.getNewsQuery(query, 0, 10, history, true),
      });
      if (news.count > 0) {
        tabs.push('News');
      }
    }
    if (skip !== 'images') {
      const images = await this.esService.count({
        index: 'images',
        ...this.queryService.searchImageQuery(query, history),
      });

      if (images.count > 0) {
        tabs.push('Images');
      }
    }
    if (skip !== 'videos') {
      const videos = await this.esService.count({
        index: 'videos',
        ...this.queryService.searchImageQuery(query, history),
      });

      if (videos.count > 0) {
        tabs.push('Videos');
      }
    }
    return tabs;
  }

  async addToCrawler(query: string) {
    const url = 'https://google.com/search?q=' + query;
    const exists = await this.esService.exists({
      index: 'crawler_status',
      id: url,
    });
    if (exists) {
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
