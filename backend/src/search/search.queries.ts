import {
  AggregationsAggregationContainer,
  QueryDslQueryContainer,
  SearchHighlight,
  Sort,
} from '@elastic/elasticsearch/lib/api/types';

export class SearchQueries {
  searchQuery(
    query: string,
    from = 0,
    size = 10,
    data_type?: string[],
    history?: string[],
    onlyQuery = false,
    filters: QueryDslQueryContainer[] = [],
  ): {
    query: QueryDslQueryContainer;
    sort?: Sort;
    highlight?: SearchHighlight;
    from?: number;
    size?: number;
  } {
    const dataTypeQuery: QueryDslQueryContainer[] = filters;
    if (data_type) {
      dataTypeQuery.push({
        bool: {
          should: data_type.map((dt) => ({
            multi_match: {
              query: dt,
              fields: ['data.type'],
            },
          })),

          minimum_should_match: 1,
        },
      });
    }
    return {
      query: {
        bool: {
          must: [
            {
              bool: {
                should: [
                  {
                    multi_match: {
                      query,
                      fields: ['title^5'],
                      fuzziness: 1,
                      boost: 5,
                    },
                  },
                  {
                    multi_match: {
                      query,
                      fields: [
                        'url^3',
                        'infobox^3',
                        'title^3',
                        'description^1',
                        'data.type^4',
                      ],
                      type: 'best_fields',
                      tie_breaker: 0.3,
                      minimum_should_match: '30%',
                      fuzziness: 1,
                      boost: 3,
                    },
                  },
                ],
                minimum_should_match: 1,
              },
            },
            ...(dataTypeQuery || []),
          ],
          should: [
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
                      boost: 0,
                    },
                  },
                ]
              : []),
          ],
        },
      },
      ...(onlyQuery
        ? {}
        : {
            sort: [
              {
                _score: {
                  order: 'desc',
                },
              },
            ],
            highlight: {
              fields: {
                description: {
                  number_of_fragments: 4,
                  boundary_max_scan: 40,
                },
                headings: {
                  number_of_fragments: 10,
                  boundary_max_scan: 40,
                },
                paragraph: {
                  number_of_fragments: 20,
                  boundary_max_scan: 40,
                },
              },
              pre_tags: ['<strong>'],
              post_tags: ['</strong>'],
            },
            from,
            size,
          }),
    };
  }
  searchImageQuery(
    query: string,
    history?: string[],
  ): {
    query: QueryDslQueryContainer;
  } {
    return {
      query: {
        bool: {
          must: [
            {
              bool: {
                should: [
                  {
                    multi_match: {
                      query,
                      fields: ['alt^5'],
                      fuzziness: 1,
                      boost: 5,
                    },
                  },
                  {
                    multi_match: {
                      query,
                      fields: ['src^3', 'alt^3', 'title^3'],
                      type: 'best_fields',
                      tie_breaker: 0.3,
                      minimum_should_match: '30%',
                      fuzziness: 1,
                      boost: 3,
                    },
                  },
                ],
                minimum_should_match: 1,
              },
            },
          ],
          should: [
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
                      boost: 0,
                    },
                  },
                ]
              : []),
          ],
        },
      },
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
                        fuzziness: 1,
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
  getNewsQuery(
    query: string,
    from = 0,
    size = 10,
    history: string[],
    onlyQuery = false,
  ) {
    return this.searchQuery(
      query,
      from,
      size,
      ['NewsArticle', 'ReportageNewsArticle'],
      history,
      onlyQuery,
    );
  }

  getVideosQuery(
    query: string,
    from = 0,
    size = 10,
    history: string[],
    onlyQuery = false,
  ) {
    return this.searchQuery(
      query,
      from,
      size,
      ['VideoObject'],
      history,
      onlyQuery,
    );
  }

  similarQueries(query: string): {
    query: QueryDslQueryContainer;
    sort: Sort;
    aggs: Record<string, AggregationsAggregationContainer>;
  } {
    return {
      query: {
        bool: {
          must: [
            {
              multi_match: {
                query,
                fields: ['query^5', '*'],
                fuzziness: 'auto',
              },
            },
          ],
          must_not: [
            {
              match: {
                query,
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
      ],
      aggs: {
        deduplicate_by_query: {
          terms: {
            field: 'query',
            size: 10000,
          },
          aggs: {
            deduplicate_top_hit: {
              top_hits: {
                size: 1,
              },
            },
          },
        },
      },
    };
  }
  getExactMatchSchemaQuery(
    query: string,
    types: string[],
  ): QueryDslQueryContainer {
    return {
      bool: {
        must: [
          {
            multi_match: {
              query,
              fields: ['data.name^3', 'data.description^1', 'data.headline^2'],
              fuzziness: 1,
            },
          },
          {
            bool: {
              should: types.map((type) => ({
                multi_match: {
                  query: type,
                  fields: ['data.type'],
                },
              })),
              minimum_should_match: 1,
            },
          },
        ],
      },
    };
  }
}
