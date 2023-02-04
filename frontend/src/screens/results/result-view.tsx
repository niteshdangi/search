import React from 'react';
import ImageResults from './image-results';
import { Image, SearchResult } from './interface';
import Result from './result';

const ResultsView = ({ results, tab }: { results: SearchResult[]; tab: string }) => {
    if (tab.toLowerCase() === 'all')
        return (
            <div className="ml-40 pl-4">
                {results.map((result) => (
                    <Result {...result} />
                ))}
            </div>
        );
    if (tab.toLowerCase() === 'images')
        return <ImageResults images={results as unknown as Image[]} />;
    return <></>;
};
export default ResultsView;
