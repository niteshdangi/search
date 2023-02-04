import { Controller, Get, Query } from '@nestjs/common';
import { SearchService } from './search.service';

@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get()
  search(@Query('query') query: string, @Query('tab') tab: string) {
    if (tab.toLowerCase() === 'images') {
      return this.searchService.searchImages(query);
    }
    return this.searchService.search(query);
  }
}
