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
    alt?: string;
    src: string;
    title?: string;
    url?: string;
    icon?: string;
}
export interface JsonLDSchema {
    image?: {
        url: string;
        alt: string;
    };
    logo?: {
        url: string;
        alt: string;
    };
    contentUrl?: string;
    embedUrl?: string;
    type: string;
    name?: string;
    headline?: string;
    '@context'?: string;
    '@type'?: string;
    mainEntityOfPage?: string;
    duration?: string;
    keywords?: string;
    datePublished: string;
    thumbnail?: {
        '@type': 'ImageObject';
        url: string;
        height: number;
        width: number;
    };
    author?: { '@type': string; name: string };
    publisher?: {
        '@type': string;
        name: string;
        url: string;
        logo: {
            '@type': string;
            url: string;
            width: number;
            height: number;
        };
    };
    dateModified?: string;
    description?: string;
    thumbnailUrl?: string;
    uploadDate?: string;
    interactionCount?: string;
    mainEntity?: object;
}
export interface SearchResult {
    url: string;
    meta: Record<string, string>;
    title: string;
    openGraph: Record<string, string>;
    data?: JsonLDSchema;
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
    suggestionType: string;
    suggestions: SearchResult[];
    total: {
        value: number;
        time: number;
    };
    tabs: string[];
}
