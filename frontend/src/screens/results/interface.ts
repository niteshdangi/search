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
}

export interface SearchResult {
    url: string;
    meta: Record<string, string>;
    title: string;
    openGraph: Record<string, string>;
    data?: {
        image?: {
            url: string;
            alt: string;
        };
        logo?: {
            url: string;
            alt: string;
        };
        type: string;
        name?: string;
        headline?: string;
    };
    description: string;
    breadcrumbs: BreadCrumb[];
    headings: Record<'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6', string>;
    paragraph: string[];
    highlights: Record<'description' | 'headings' | 'paragraph', string[]>;
    infobox: Record<string, string>[];
}
export interface SearchResponse {
    results: SearchResult[];
    infobox: SearchResult;
    total: {
        value: number;
        time: number;
    };
    tabs: string[];
}
