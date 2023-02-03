import {
  QueryDslQueryContainer,
  SearchHighlight,
  Sort,
} from '@elastic/elasticsearch/lib/api/types';

export class SearchQueries {
  searchQuery(
    query: string,
    from = 0,
    size = 10,
    data_type?: string,
    history?: string[],
  ): {
    query: QueryDslQueryContainer;
    sort: Sort;
    highlight: SearchHighlight;
    from: number;
    size: number;
  } {
    let filters = [];
    if (data_type) {
      filters = [
        {
          term: {
            'data.type': data_type,
          },
        },
      ];
    }
    return {
      query: {
        bool: {
          must: [
            {
              multi_match: {
                query,
                fields: ['title^2', 'description^1'],
                type: 'best_fields',
                tie_breaker: 0.3,
                minimum_should_match: '30%',
                fuzziness: 2,
              },
            },
          ],
          filter: filters,
          should: [
            {
              match_phrase: {
                title: {
                  query,
                  boost: 3,
                },
              },
            },
            {
              match: {
                description: {
                  query,
                  fuzziness: 'auto',
                },
              },
            },
            {
              multi_match: {
                query,
                type: 'best_fields',
                tie_breaker: 0.3,
                minimum_should_match: '30%',
                fuzziness: 2,
              },
            },
            ...(history?.length
              ? [
                  {
                    more_like_this: {
                      fields: ['title', 'description'],
                      like: history.map((item) => ({
                        _index: 'data',
                        _id: item,
                      })),
                      min_term_freq: 1,
                      min_doc_freq: 1,
                    },
                  },
                ]
              : []),
          ],
        },
      },
      sort: [
        {
          _score: {
            order: 'desc',
          },
        },
      ],
      highlight: {
        fields: {
          title: {},
          description: {},
          headings: {},
          paragraph: {},
        },
        pre_tags: ['<strong>'],
        post_tags: ['</strong>'],
      },
      from,
      size,
    };
  }

  pastHistory(query?: string): {
    query: QueryDslQueryContainer;
    sort: Sort;
  } {
    return {
      query: {
        bool: {
          must: [
            ...(query
              ? [
                  {
                    match: {
                      query: {
                        query,
                        fuzziness: 2,
                      },
                    },
                  },
                ]
              : []),
            {
              range: {
                timestamp: {
                  gte: new Date().setDate(new Date().getDate() - 1),
                },
              },
            },
          ],
        },
      },
      sort: [
        {
          _score: {
            order: 'desc',
          },
        },
        {
          timestamp: {
            order: 'desc',
          },
        },
      ],
    };
  }
}
