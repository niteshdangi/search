import { HttpException, Injectable } from '@nestjs/common';
import { ElasticsearchService } from '@nestjs/elasticsearch';
import { CrawlerData, SearchHistory } from './dto/search.dto';
import { SearchQueries } from './search.queries';

@Injectable()
export class SearchService {
  constructor(
    private readonly esService: ElasticsearchService,
    private readonly queryService: SearchQueries,
  ) {}

  async search(query: string) {
    const actualQuery = query;
    if (!query) {
      query = actualQuery;
    }
    const resultsSet = new Set<CrawlerData>();
    const pastResult = await this.getHistoryForSearch(query);
    const response = await this.esService.search<CrawlerData>({
      index: 'data',
      body: this.queryService.searchQuery(query, 0, 10, null, pastResult),
    });
    const hits = response.hits.hits;
    hits.map((item) => {
      resultsSet.add(item._source);
    });
    const results = Array.from(resultsSet);

    this.esService.index({
      index: 'search_history',
      document: {
        user: 'nitesh',
        query: actualQuery,
        timestamp: new Date(),
        results: results.map((item) => item.url),
      },
    });

    return {
      results,
      total: response.hits.total,
    };
  }

  async getHistoryForSearch(query?: string, size = 3, loadMore = true) {
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
    if (ids.size < 2 && loadMore) {
      (await this.getHistoryForSearch(null, 3 - ids.size, false)).map(
        (item) => {
          ids.add(item);
        },
      );
    }
    console.log(ids);

    return Array.from(ids);
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
      throw new HttpException(
        {
          status: status._source,
        },
        404,
      );
    }
    this.esService.index({
      index: 'crawler_queue',
      document: {
        url: url,
      },
    });
    throw new HttpException(
      {
        status: {
          status: 'QUEUE',
          url: url,
        },
      },
      404,
    );
  }
}
