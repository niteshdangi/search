import moment from 'moment';
import React, { RefObject, useMemo, useRef, useState } from 'react';
import { useInfiniteQuery } from 'react-query';
import apiClient from '../../apis';
import apis from '../../apis/apis';
import googleLogo from '../../assets/google.png';
import { RightArrow } from '../../assets/image-icon';

interface IQueue {
    url: string;
    start_time: string;
    status: 'DONE' | 'QUEUE' | 'FAILED' | 'PROCESS' | 'FETCHING' | 'WAITING';
}
const Crawler = () => {
    const [tab, setTab] = useState('WAITING');
    const [loading, setLoading] = useState(false);
    const inputRef = useRef<HTMLInputElement>();
    const {
        data: { pages = [] } = {},
        fetchNextPage,
        isFetchingNextPage,
        refetch,
    } = useInfiniteQuery(
        ['crawler', tab],
        ({ pageParam }) =>
            apiClient.get(apis.crawler, {
                params: {
                    status: tab,
                    pageParam,
                },
            }),
        {
            getNextPageParam: (prev) => prev.data.scrollId,
        },
    );

    const data: IQueue[] = useMemo(() => pages.flatMap((page) => page.data.results), [pages]);

    const addToCrawler = async () => {
        if (inputRef.current?.value && inputRef.current?.value?.length > 3) {
            setLoading(true);
            await apiClient.post(apis.crawler, { query: inputRef.current?.value });
            inputRef.current.value = '';
            setTab('WAITING');
            setTimeout(refetch, 10);
            setLoading(false);
        }
    };
    return (
        <div>
            <div className="px-5 pt-8 border-b">
                <div className="flex flex-row  items-center">
                    <img src={googleLogo} alt="google logo" className="w-24 mr-10" />
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            addToCrawler();
                        }}
                        className="w-1/2">
                        <input
                            ref={inputRef as RefObject<HTMLInputElement>}
                            disabled={loading}
                            type="text"
                            className="w-full p-2 px-6 rounded-full shadow-gray-300 shadow-sm border border-gray-100 transition-all focus:shadow-md"
                            placeholder="Enter query or URL (with http) to crawl"
                        />
                    </form>
                </div>
                <div className="ml-40 pt-6">
                    {['WAITING', 'QUEUE', 'FETCHING', 'PROCESS', 'DONE', 'FAILED'].map((item) => (
                        <button
                            className={`px-1 pb-2 -mb-px border-blue-600 mr-4 text-sm cursor-pointer transition-all inline-flex flex-row items-center ${
                                tab?.toLowerCase?.() === item.toLowerCase()
                                    ? 'border-b-4 text-blue-600'
                                    : 'text-gray-600 hover:text-gray-800'
                            }`}
                            onClick={() => setTab(item)}
                            type="button">
                            {item}
                        </button>
                    ))}
                </div>
            </div>
            <div className="text-sm text-gray-500 mt-2 mb-6 ml-40 pl-4">
                About {pages?.[0]?.data?.total.value} results
            </div>
            {data?.map?.((queue: IQueue) => (
                <div
                    key={queue.start_time}
                    className="flex flex-row items-center mx-40 py-4 transition-all border-b border-gray-200 px-4 hover:bg-gray-50">
                    <div className="bg-gray-200  rounded-full h-10 w-10 flex items-center justify-center mr-4">
                        {queue.status === 'DONE' && (
                            <img
                                alt="Done icon"
                                className="h-6 w-6"
                                srcSet="https://img.icons8.com/fluency/2x/checkmark.png 2x, https://img.icons8.com/fluency/1x/checkmark.png 1x"
                                src="https://img.icons8.com/fluency/1x/checkmark.png"
                            />
                        )}
                        {queue?.status === 'FAILED' && (
                            <img
                                alt="Error icon"
                                className="h-6 w-6"
                                srcSet="https://img.icons8.com/fluency/512/error.png 2x, https://img.icons8.com/fluency/256/error.png 1x"
                                src="https://img.icons8.com/fluency/512/error.png"
                            />
                        )}
                        {(queue?.status === 'QUEUE' || queue?.status === 'WAITING') && (
                            <img
                                className="h-6 w-6"
                                srcSet="https://img.icons8.com/external-tal-revivo-solid-tal-revivo/2x/external-queue-for-production-time-isolated-on-white-background-company-solid-tal-revivo.png 2x, https://img.icons8.com/external-tal-revivo-solid-tal-revivo/1x/external-queue-for-production-time-isolated-on-white-background-company-solid-tal-revivo.png 1x"
                                src="https://img.icons8.com/external-tal-revivo-solid-tal-revivo/1x/external-queue-for-production-time-isolated-on-white-background-company-solid-tal-revivo.png"
                                alt="Queue for production time isolated on white background icon"
                            />
                        )}
                        {(queue?.status === 'PROCESS' || queue?.status === 'FETCHING') && (
                            <img
                                srcSet="https://img.icons8.com/external-flaticons-lineal-color-flat-icons/2x/external-data-processing-data-analytics-flaticons-lineal-color-flat-icons-3.png 2x, https://img.icons8.com/external-flaticons-lineal-color-flat-icons/1x/external-data-processing-data-analytics-flaticons-lineal-color-flat-icons-3.png 1x"
                                src="https://img.icons8.com/external-flaticons-lineal-color-flat-icons/1x/external-data-processing-data-analytics-flaticons-lineal-color-flat-icons-3.png"
                                alt="Data Processing icon"
                                className="h-6 w-6 animate-spin"
                            />
                        )}
                    </div>
                    <div className="flex flex-1 flex-col w-1/2 overflow-hidden">
                        <div className="flex flex-1 w-fit text-sm text-gray-600">{queue.url}</div>
                        <div className="text-gray-700 text-xs">
                            {moment(queue.start_time).format('DD MMM YYYY \\a\\t hh:mm A')} |{' '}
                            {queue.status}
                        </div>
                    </div>
                </div>
            ))}

            {data?.length < pages?.[0]?.data?.total?.value && (
                <div className="flex items-center justify-center my-10">
                    <button
                        type="button"
                        onClick={() => fetchNextPage()}
                        disabled={isFetchingNextPage}
                        className="flex self-center z-10 hover:bg-gray-300 flex-row items-center w-1/2 justify-center bg-gray-200 rounded-full text-sm py-2 text-gray-800">
                        {isFetchingNextPage ? 'Fetching...' : 'Fetch More'}{' '}
                        <RightArrow className="inline-block w-5 ml-2 fill-gray-600 rotate-90" />
                    </button>
                </div>
            )}
        </div>
    );
};

export default Crawler;
