import React from 'react';
import { SearchResult } from './interface';

const WikiInfoBox = ({ data, meta, openGraph, title, description, infobox }: SearchResult) => (
    <div className="w-40vw border rounded-lg mx-8 mr-16 overflow-hidden h-fit mb-10">
        <div className="bg-gray-200  p-4">
            <div className="rounded-lg overflow-hidden flex flex-col w-fit mx-auto">
                <img
                    src={
                        data?.image?.url ||
                        data?.logo?.url ||
                        openGraph.image ||
                        meta?.['twitter:image']
                    }
                    alt={title}
                    className="h-40"
                />
            </div>
        </div>
        <div className="p-4 border-b">
            <h1 className="text-3xl">{data?.name || title}</h1>
            {data?.headline && <span className="text-sm text-gray-500">{data?.headline}</span>}
        </div>
        {infobox?.[0]?.[0] && <div className="p-4 border-b text-sm">{infobox?.[0]?.[0]}</div>}
        <div className="p-4">
            <p className="line-clamp-6 text-sm">{description}</p>
        </div>
        {infobox && (
            <div className="text-sm m-4 w-fit">
                {infobox
                    .filter(
                        (row, index, arr) => !!row?.[1] || (!row?.[1] && !!arr?.[index + 1]?.[1]),
                    )
                    .slice(1)
                    .map((row) => (
                        <div>
                            <strong
                                className={`text-sm ${
                                    row?.[1] ? 'font-semibold' : 'font-extrabold mt-4 inline-block'
                                }`}>
                                {row?.[0]}:{' '}
                            </strong>
                            <span className="text-sm">{row?.[1]?.replace('\n', ' ')}</span>
                        </div>
                    ))}
            </div>
        )}
    </div>
);
export default WikiInfoBox;
