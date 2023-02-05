import React, { useMemo } from 'react';
import { chunk, cloneDeep } from 'lodash';
import moment from 'moment';
import {
    ImageColorIcon,
    ImageIcon,
    NewsIcon,
    RightArrow,
    VideoIcon,
} from '../../assets/image-icon';
import { Image, SearchResult } from './interface';
import VideoResult from './video-result';

const SuggestionResults = ({
    suggestionType,
    suggestions,
    query,
    goToTab,
}: {
    suggestionType: string;
    suggestions: SearchResult[];
    query: string;
    goToTab: (tab: string) => void;
}) => {
    if (suggestionType === 'images') {
        return (
            <div className="w-45vw overflow-hidden ml-40 pl-4">
                <h1 className="text-xl group flex items-center hover:text-blue-800 cursor-pointer transition-all w-fit">
                    <ImageIcon className="group-hover:hidden h-5 w-5 inline-block mr-2" />
                    <ImageColorIcon className="hidden group-hover:inline-block h-5 w-5 mr-2" />
                    Images for {query}
                </h1>
                <div className="flex flex-wrap w-full rounded-2xl overflow-hidden mt-4">
                    {(suggestions as unknown as Image[]).map((img) => (
                        <div
                            className="w-1-4-1 h-28 bg-cover mr-0.5 mb-0.5"
                            style={{ backgroundImage: `url(${img.src})` }}
                        />
                    ))}
                </div>
                <div className="mt-4 mb-10 flex items-center justify-center relative">
                    <div className="absolute w-full h-px bg-gray-200" />
                    <button
                        type="button"
                        onClick={() => goToTab('images')}
                        className="z-10 hover:bg-gray-300 flex flex-row items-center w-1/2 justify-center bg-gray-200 rounded-full text-sm py-2 text-gray-800">
                        View All <RightArrow className="inline-block w-5 ml-2 fill-gray-600" />
                    </button>
                </div>
            </div>
        );
    }
    if (suggestionType === 'videos') {
        return (
            <div className="w-45vw overflow-hidden ml-40 pl-4">
                <h1 className="text-xl flex items-center w-fit">
                    <VideoIcon className="h-5 w-5 inline-block mr-2" />
                    Videos
                </h1>
                <div className="w-full mt-4 pt-4 border-t mb-10 border-gray-200">
                    {suggestions.map((video) => (
                        <VideoResult {...video} isSmall />
                    ))}
                    <div className="mt-4 mb-10 flex items-center justify-center relative">
                        <div className="absolute w-full h-px bg-gray-200" />
                        <button
                            type="button"
                            onClick={() => goToTab('videos')}
                            className="z-10 hover:bg-gray-300 flex flex-row items-center w-1/2 justify-center bg-gray-200 rounded-full text-sm py-2 text-gray-800">
                            View All <RightArrow className="inline-block w-5 ml-2 fill-gray-600" />
                        </button>
                    </div>
                </div>
            </div>
        );
    }
    if (suggestionType === 'news') {
        const suggestions_copy = useMemo(() => chunk(cloneDeep(suggestions), 2), [suggestions]);

        return (
            <div className="w-45vw overflow-hidden ml-40 pl-4">
                <h1 className="text-xl flex items-center w-fit">
                    <NewsIcon className="h-5 w-5 inline-block mr-2" />
                    Top Stories
                </h1>
                <div className="w-full mt-4 border-t mb-10 border-gray-200">
                    <div className="pb-4" />
                    {suggestions_copy
                        .filter((s) => s.length === 2)
                        .map((suggestion, inx, arr) => (
                            <div className="flex flex-row px-1 space-x-6">
                                <NewsResult
                                    {...suggestion[0]}
                                    hideBorder={inx + 1 === arr.length}
                                    leftBorder
                                />
                                <NewsResult
                                    {...suggestion[1]}
                                    hideBorder={inx + 1 === arr.length}
                                />
                            </div>
                        ))}
                    <div className="mt-4 mb-10 flex items-center justify-center relative">
                        <div className="absolute w-full h-px bg-gray-200" />
                        <button
                            type="button"
                            onClick={() => goToTab('news')}
                            className="z-10 hover:bg-gray-300 flex flex-row items-center w-1/2 justify-center bg-gray-200 rounded-full text-sm py-2 text-gray-800">
                            More news <RightArrow className="inline-block w-5 ml-2 fill-gray-600" />
                        </button>
                    </div>
                </div>
            </div>
        );
    }
    return <></>;
};

export default SuggestionResults;
interface NewsProps extends SearchResult {
    hideBorder: boolean;
    // eslint-disable-next-line react/require-default-props
    leftBorder?: boolean;
}
const NewsResult = ({ title, data, hideBorder, leftBorder = false }: NewsProps) => (
    <div className={`pb-2 group w-1/2 relative ${hideBorder ? '' : 'mb-2 border-b'}`}>
        {leftBorder && (
            <div
                className={`absolute  w-px bg-gray-200 -right-3 -top-2 ${
                    hideBorder ? 'h-full' : 'h-full-1'
                }`}
            />
        )}
        <div className="flex flex-row justify-between">
            <div className="flex-col flex ">
                <span className="text-sm w-fit line-clamp-1 cursor-pointer">
                    {data?.publisher?.logo?.url && (
                        <img
                            src={data?.publisher?.logo?.url}
                            alt={data?.publisher?.name || ''}
                            className="h-3.5"
                        />
                    )}
                </span>
                <span className=" group-hover:underline w-fit max-w-screen-sm py-1 text-sm text-blue-800 cursor-pointer line-clamp-3">
                    {title}
                </span>
            </div>
            {data?.image?.url && (
                <img
                    src={data.image.url}
                    className="h-20 w-20 ml-2 rounded-md"
                    alt={data.image.alt}
                />
            )}
        </div>

        <div className="text-xs text-gray-500 mt-2">
            {moment(data?.datePublished).format('DD-MMM-YYYY')}
        </div>
    </div>
);
