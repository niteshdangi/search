import { Controller, Get, Query } from '@nestjs/common';
import { SearchService } from './search.service';

@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get()
  search(
    @Query('query') query: string,
    @Query('tab') tab = 'all',
    @Query('size') size = 10,
    @Query('scrollId') scrollId?: string,
  ) {
    if (scrollId) {
      return this.searchService.searchScroll(scrollId);
    }
    return this.searchService.search(query, tab, size);
  }
}
