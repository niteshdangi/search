import React, { HTMLProps, RefObject, useRef } from 'react';
import { useQuery } from 'react-query';
import { Link, useSearchParams } from 'react-router-dom';
import apiClient from '../../apis';
import apis from '../../apis/apis';
import googleLogo from '../../assets/google.png';
import {
    ImageColorIcon,
    ImageIcon,
    NewsColorIcon,
    NewsIcon,
    SearchColorIcon,
    SearchIcon,
    VideoColorIcon,
    VideoIcon,
} from '../../assets/image-icon';
import { SearchResponse, SearchResult } from './interface';
import ResultsView from './result-view';
import SuggestionResults from './suggestions';
import { durationToTime } from './video-result';
import WikiInfoBox from './wiki-infobox';

const tabIconMaps: Record<string, (props: HTMLProps<HTMLSpanElement>) => JSX.Element> = {
    all: SearchIcon,
    allActive: SearchColorIcon,
    images: ImageIcon,
    imagesActive: ImageColorIcon,
    videos: VideoIcon,
    videosActive: VideoColorIcon,
    news: NewsIcon,
    newsActive: NewsColorIcon,
};

const SearchResults = () => {
    const inputRef = useRef<HTMLInputElement>();
    const [searchParams, setSearchParams] = useSearchParams({
        query: '',
        tab: 'All',
    });
    const query = searchParams.get('query') || '';
    const tab = searchParams.get('tab') || '';
    const {
        data: {
            data,
            data: {
                results = [],
                infobox = {} as SearchResult,
                tabs = [],
                suggestionType = '',
                suggestions = [],
            } = {},
        } = {},
    } = useQuery(
        ['search', query, tab],
        () =>
            apiClient.get<SearchResponse>(apis.search, {
                params: {
                    query,
                    tab,
                    size: tab === 'images' ? 50 : 10,
                },
            }),
        {
            enabled: (query?.length || 0) > 3,
            refetchOnMount: false,
            refetchOnWindowFocus: false,
        },
    );
    const onSubmit = () => {
        if (inputRef.current?.value && inputRef.current?.value?.length > 3)
            setSearchParams({ tab, query: inputRef.current?.value });
    };

    const onTabClick = (item: string) => {
        setSearchParams({ query, tab: item.toLowerCase() });
    };
    const isMovieCustom = data?.infobox?.data?.type === 'MovieCustom';

    return (
        <div>
            <div className={`px-5 pt-8 ${isMovieCustom ? '' : ' border-b'}`}>
                <div className="flex flex-row  items-center justify-between">
                    <div className="flex flex-row  items-center w-3/5">
                        <img src={googleLogo} alt="google logo" className="w-24 mr-10" />
                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                onSubmit();
                            }}
                            className="w-full">
                            <input
                                ref={inputRef as RefObject<HTMLInputElement>}
                                type="text"
                                className="w-full p-2 px-6 rounded-full shadow-gray-300 shadow-sm border border-gray-100 transition-all focus:shadow-md"
                                placeholder="Search..."
                                defaultValue={query || ''}
                            />
                        </form>
                    </div>
                    <Link to="/crawler" className="mr-5 text-gray-600 text-sm">
                        View Crawler
                    </Link>
                </div>
                {tabs?.length ? (
                    <div className="ml-40 pt-6">
                        {tabs.map((item) => {
                            const Icon =
                                tabIconMaps?.[
                                    item.toLowerCase() +
                                        (tab?.toLowerCase?.() === item.toLowerCase()
                                            ? 'Active'
                                            : '')
                                ];
                            return (
                                <button
                                    className={`px-1 pb-2 -mb-px border-blue-600 mr-4 text-sm cursor-pointer transition-all inline-flex flex-row items-center ${
                                        tab?.toLowerCase?.() === item.toLowerCase()
                                            ? 'border-b-4 text-blue-600'
                                            : 'text-gray-600 hover:text-gray-800'
                                    }`}
                                    onClick={() => onTabClick(item)}
                                    type="button">
                                    {Icon && <Icon className="inline-block h-4 w-4 mr-1" />}
                                    {item}
                                </button>
                            );
                        })}
                    </div>
                ) : (
                    <div className="pb-8" />
                )}
                {isMovieCustom && (
                    <div className=" border-b pb-4 mb-6">
                        <div className="text-sm text-gray-500 mt-3 mb-6 ml-40">
                            About {data?.total.value} results ({data.total.time} seconds)
                        </div>
                        <div className="ml-40 flex flex-row justify-between">
                            <div className="flex flex-row ">
                                <div
                                    style={{ backgroundImage: `url(${infobox?.data?.image?.url})` }}
                                    className="bg-cover h-14 w-9 rounded-md mr-4"
                                />
                                <div>
                                    <h1 className="text-3xl">{infobox?.data?.name}</h1>
                                    {infobox?.data?.metadata?.map?.((meta) => (
                                        <a href={meta?.url || ''} className="text-sm text-gray-600">
                                            {meta?.content}
                                            {' ‧ '}
                                        </a>
                                    ))}
                                    <span className="text-sm text-gray-600">
                                        {durationToTime(infobox?.data?.duration || '', true)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
            <div className="">
                {!isMovieCustom && !!data?.total && tab.toLowerCase() !== 'images' && (
                    <div className="text-sm text-gray-500 mt-2 mb-6 ml-40 pl-4">
                        About {data?.total.value} results ({data.total.time} seconds)
                    </div>
                )}
                <div className="flex flex-row justify-between w-auto">
                    <div className="">
                        {isMovieCustom && !!infobox?.data?.cast?.length && (
                            <div className="ml-40 pl-5 mb-10">
                                <h2 className="text-gray-800 text-2xl mb-4">Cast</h2>
                                <div className="flex flex-row w-45vw overflow-scroll">
                                    {infobox?.data?.cast?.map?.((cast) => (
                                        <div className="mr-2 group cursor-pointer">
                                            <div
                                                style={{
                                                    backgroundImage: `url(${cast?.image?.src})`,
                                                    width: '100px',
                                                    height: '100px',
                                                }}
                                                className="bg-cover rounded-lg"
                                            />
                                            <div className="line-clamp-2 text-sm mt-1 group-hover:underline">
                                                {cast?.name}
                                            </div>
                                            <div className="line-clamp-2 text-xs text-gray-600 group-hover:underline">
                                                {cast?.role}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                        {suggestionType && !!suggestions?.length && (
                            <SuggestionResults
                                suggestionType={suggestionType}
                                suggestions={suggestions}
                                query={query}
                                goToTab={onTabClick}
                            />
                        )}
                        {results?.length > 0 ? (
                            <ResultsView results={results} tab={tab} query={query} data={data} />
                        ) : (
                            <div className="px-40 py-10">{query ? 'No Result' : ''}</div>
                        )}
                    </div>
                    {!!infobox?.url && tab.toLowerCase() === 'all' && <WikiInfoBox {...infobox} />}
                </div>
            </div>
        </div>
    );
};
export default SearchResults;
