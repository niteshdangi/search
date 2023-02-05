import React from 'react';
import ImageResults from './image-results';
import { Image, SearchResponse, SearchResult } from './interface';
import Result from './result';

const ResultsView = ({
    results,
    tab,
    query,
    data,
}: {
    results: SearchResult[];
    tab: string;
    query: string;
    // eslint-disable-next-line react/require-default-props
    data?: SearchResponse;
}) => {
    if (tab.toLowerCase() === 'images')
        return (
            <ImageResults
                images={results as unknown as Image[]}
                query={query}
                data={data as unknown as SearchResponse<Image>}
            />
        );
    return (
        <div className="w-45vw overflow-hidden ml-40 pl-4">
            {results.map((result) => (
                <Result {...result} />
            ))}
        </div>
    );
};
export default ResultsView;
