import React, { RefObject, useRef } from 'react';
import { useQuery } from 'react-query';
import { useSearchParams } from 'react-router-dom';
import apiClient from '../../apis';
import apis from '../../apis/apis';
import googleLogo from '../../assets/google.png';
import { SearchResponse, SearchResult } from './interface';
import ResultsView from './result-view';
import WikiInfoBox from './wiki-infobox';

const SearchResults = () => {
    const inputRef = useRef<HTMLInputElement>();
    const [searchParams, setSearchParams] = useSearchParams({
        query: '',
        tab: 'All',
    });
    const query = searchParams.get('query') || '';
    const tab = searchParams.get('tab') || '';
    const {
        data: { data, data: { results = [], infobox = {} as SearchResult, tabs = [] } = {} } = {},
    } = useQuery(
        ['search', query, tab],
        () =>
            apiClient.get<SearchResponse>(apis.search, {
                params: {
                    query,
                    tab,
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
    return (
        <div>
            <div className="px-5 pt-8 border-b ">
                <div className="flex flex-row  items-center ">
                    <img src={googleLogo} alt="google logo" className="w-24 mr-10" />
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            onSubmit();
                        }}
                        className="w-1/2">
                        <input
                            ref={inputRef as RefObject<HTMLInputElement>}
                            type="text"
                            className="w-full p-2 px-6 rounded-full shadow-gray-300 shadow-sm border border-gray-100 transition-all focus:shadow-md"
                            placeholder="Search..."
                            defaultValue={query || ''}
                        />
                    </form>
                </div>
                {tabs?.length ? (
                    <div className="ml-40 pt-6">
                        {tabs.map((item) => (
                            <button
                                className={`px-1 pb-2 -mb-px inline-block border-blue-600 mr-4 text-sm cursor-pointer transition-all ${
                                    tab?.toLowerCase?.() === item.toLowerCase()
                                        ? 'border-b-4 text-blue-600'
                                        : 'text-gray-600 hover:text-gray-800'
                                }`}
                                onClick={() => onTabClick(item)}
                                type="button">
                                {item}
                            </button>
                        ))}
                    </div>
                ) : (
                    <div className="pb-8" />
                )}
            </div>
            <div className="">
                {data?.total && tab.toLowerCase() !== 'images' && (
                    <div className="text-sm text-gray-500 mt-2 mb-6 ml-40 pl-4">
                        About {data?.total.value} results ({data.total.time} seconds)
                    </div>
                )}
                <div className="flex flex-row justify-between w-auto">
                    <div className="w-45vw">
                        {results?.length > 0 ? <ResultsView results={results} tab={tab} /> : <></>}
                    </div>
                    {!!infobox?.url && tab.toLowerCase() === 'all' && <WikiInfoBox {...infobox} />}
                </div>
            </div>
        </div>
    );
};
export default SearchResults;
