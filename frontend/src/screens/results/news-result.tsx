import { capitalCase } from 'change-case';
import moment from 'moment';
import React from 'react';
import { SearchResult } from './interface';

const NewsResult = (props: SearchResult) => {
    const { title, highlights, description, data } = props;
    return (
        <div className="mb-8 group">
            <div className="flex flex-row justify-between">
                <div className="flex-col flex ">
                    <span className="text-sm w-fit line-clamp-1 cursor-pointer">
                        <span className="text-xs text-gray-500 flex flex-row items-center">
                            {data?.publisher?.logo?.url && (
                                <img
                                    src={data?.publisher?.logo?.url}
                                    alt={data?.publisher?.name || ''}
                                    className="h-2.5 mr-1.5"
                                />
                            )}
                            {capitalCase(data?.publisher?.name || '')}
                        </span>
                    </span>
                    <span className=" group-hover:underline w-fit max-w-screen-sm py-1 text-xl text-blue-800 cursor-pointer line-clamp-2">
                        {title}
                    </span>
                    <p
                        className="text-sm text-gray-600 line-clamp-2"
                        // eslint-disable-next-line react/no-danger
                        dangerouslySetInnerHTML={{
                            __html:
                                highlights?.description?.join?.('... ') ||
                                highlights?.headings?.join('... ') ||
                                highlights?.paragraph?.join('... ') ||
                                description,
                        }}
                    />
                    <div className="text-sm text-gray-500 mt-2">
                        {moment(data?.datePublished).format('DD-MMM-YYYY')}
                    </div>
                </div>
                {data?.image?.url && (
                    <img
                        src={data.image.url}
                        className="h-20 w-20 ml-2 rounded-md mt-4"
                        alt={data.image.alt}
                    />
                )}
            </div>
        </div>
    );
};

export default NewsResult;
