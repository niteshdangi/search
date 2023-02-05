export interface SearchHistory {
  user: string;
  query: string;
  timestamp: string;
  results: string[];
}
export interface BreadCrumb {
  position: number;
  item: string;
  name: string;
}
export interface Link {
  name: string;
  link: string;
}
export interface Image {
  alt: string;
  src: string;
  title: string;
  url?: string;
  icon?: string;
}

export interface CrawlerData {
  url: string;
  meta: Record<string, string>;
  title: string;
  openGraph: Record<string, string>;
  jsonSchema: Record<string, object>;
  description: string;
  breadcrumbs: BreadCrumb[];
  headings: Record<'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6', string>;
  paragraph: string[];
  infobox: Record<string, string>[];
}

export interface SearchResultItem extends CrawlerData {
  highlights: Record<string, string[]>;
}
