import React from 'react';
import { SearchResult } from './interface';

const Result = ({ url, title, highlights, description, data }: SearchResult) => {
    const breadcrumbUrl = (url.endsWith('/') ? url.slice(0, -1) : url)
        .replaceAll('/', ' › ')
        .replaceAll(' ›  › ', '//');
    return (
        <div className="mb-8">
            <div className="flex flex-row justify-between">
                <div className="flex-col flex  w-auto">
                    <span className="peer group text-sm w-fit cursor-pointer max-w-screen-sm text-ellipsis whitespace-nowrap overflow-hidden">
                        {breadcrumbUrl.split(' ')[0]}
                        {breadcrumbUrl.split(' ')?.[1] && (
                            <span className="peer text-sm w-fit cursor-pointer text-gray-500">
                                {` ${breadcrumbUrl.split(' ').slice(1).join(' ')}`}
                            </span>
                        )}
                    </span>
                    <span className="hover:underline group peer-hover:underline w-fit max-w-screen-sm py-1 text-lg text-blue-800 cursor-pointer text-ellipsis whitespace-nowrap overflow-hidden">
                        {title}
                    </span>
                    <p
                        className="text-sm line-clamp-3"
                        // eslint-disable-next-line react/no-danger
                        dangerouslySetInnerHTML={{
                            __html:
                                highlights?.description?.join?.('... ') ||
                                highlights?.headings?.join('... ') ||
                                highlights?.paragraph?.join('... ') ||
                                description,
                        }}
                    />
                </div>
                {data?.image?.url && (
                    <img
                        src={data.image.url}
                        className="h-20 ml-2 rounded-md mt-4 bg-center bg-cover bg-no-repeat group-hover:scale-105 hover:scale-105 transition-all"
                        alt={data.image.alt}
                    />
                )}
            </div>
            {/* {JSON.stringify(data)}
            ================={'\n'}
            {JSON.stringify(meta)}
            ================={'\n'}
            {JSON.stringify(openGraph)} */}
        </div>
    );
};

export default Result;
