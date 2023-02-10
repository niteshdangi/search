import React from 'react';
import { SearchResult } from './interface';
import NewsResult from './news-result';
import VideoResult from './video-result';

const Result = (props: SearchResult) => {
    if (props?.data?.type === 'VideoObject') {
        return <VideoResult {...props} />;
    }
    if (['NewsArticle', 'ReportageNewsArticle'].includes(props?.data?.type || '')) {
        return <NewsResult {...props} />;
    }
    const { url, title, highlights, description, data } = props;
    const breadcrumbUrl = (url.endsWith('/') ? url.slice(0, -1) : url)
        .replaceAll('/', ' › ')
        .replaceAll(' ›  › ', '//');
    return (
        <div className="mb-8">
            <div className="flex flex-row justify-between">
                <div className="flex-col flex ">
                    <a href={url} className="peer group text-sm w-fit line-clamp-1 cursor-pointer">
                        {breadcrumbUrl.split(' ')[0]}
                        {breadcrumbUrl.split(' ')?.[1] && (
                            <span className="peer text-sm w-fit cursor-pointer text-gray-500">
                                {` ${breadcrumbUrl.split(' ').slice(1).join(' ')}`}
                            </span>
                        )}
                    </a>
                    <a
                        href={url}
                        className="hover:underline group peer-hover:underline w-fit max-w-screen-sm py-1 text-lg text-blue-800 cursor-pointer line-clamp-1">
                        {title}
                    </a>
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
        </div>
    );
};

export default Result;
