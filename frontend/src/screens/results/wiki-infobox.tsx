import moment from 'moment';
import React from 'react';
import { SearchResult } from './interface';
import { durationToTime } from './video-result';

const WikiInfoBox = ({ data, meta, openGraph, title, description, infobox, url }: SearchResult) => {
    const videoObj = data?.video || data?.trailer;
    const isMovieCustom = data?.type === 'MovieCustom';
    if (!(title || data?.name)) return <></>;
    return (
        <div
            className={`w-40vw  mx-8 mr-16 overflow-hidden h-fit mb-10 ${
                isMovieCustom ? 'border-l' : 'rounded-lg border'
            }`}>
            {isMovieCustom ? (
                <div className="text-lg m-4">About</div>
            ) : (
                <>
                    <div className="bg-gray-200  p-4">
                        <div className="rounded-lg overflow-hidden flex flex-col w-fit mx-auto">
                            <img
                                src={
                                    data?.image?.url ||
                                    data?.logo?.url ||
                                    openGraph?.image ||
                                    meta?.['twitter:image']
                                }
                                alt={title}
                                className="h-40"
                            />
                        </div>
                    </div>
                    <div className="p-4 border-b">
                        <h1 className="text-3xl">{data?.name || title}</h1>
                        {data?.headline && (
                            <span className="text-sm text-gray-500">{data?.headline}</span>
                        )}
                    </div>
                    {infobox?.[0]?.[0] && (
                        <div className="p-4 border-b text-sm">{infobox?.[0]?.[0]}</div>
                    )}
                </>
            )}
            {videoObj?.['@type'] === 'VideoObject' && (
                <div className="m-4 flex flex-row group">
                    <div
                        style={{
                            backgroundImage: `url(${
                                videoObj?.thumbnail?.url || videoObj?.thumbnailUrl
                            })`,
                        }}
                        className="w-20 rounded-lg bg-cover bg-no-repeat flex items-center justify-center cursor-pointer h-10">
                        <span className="fill-white opacity-90 w-6 h-6 block z-10 absolute">
                            <svg
                                focusable="false"
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24">
                                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z" />
                            </svg>
                        </span>
                    </div>
                    <div className="text-sm ml-2 group-hover:underline">
                        <span className="block text-blue-700 line-clamp-1 cursor-pointer">
                            {videoObj?.name?.replaceAll?.('&quot;', '"')}
                        </span>
                        {videoObj?.duration && <span>{durationToTime(videoObj?.duration)}</span>}
                    </div>
                </div>
            )}
            {isMovieCustom && data?.aggregateRating?.ratingValue && (
                <>
                    <div className="flex flex-row justify-around relative text-center text-sm my-1 mt-2">
                        <div>
                            <span className="block">
                                {data?.aggregateRating?.ratingValue}/
                                {data?.aggregateRating?.bestRating}
                            </span>
                            <a href={url} className="text-blue-700">
                                IMBd
                            </a>
                        </div>
                        <div className="h-full w-px bg-gray-200 absolute" />
                        <div>
                            <span className="block">{data?.aggregateRating?.ratingCount}</span>
                            <span className="text-blue-700">Reviews</span>
                        </div>
                    </div>
                </>
            )}
            <div className="p-4">
                <p className="line-clamp-6 text-sm">{description}</p>
            </div>
            {data?.mainEntity?.['@type'] === 'Person' && (
                <div className="p-4 border-t w-full">
                    {!!data?.mainEntity?.jobTitle?.length && (
                        <div className="text-sm mb-1">
                            <div>
                                <strong className="text-sm font-semibold">Work: </strong>
                                <span className="text-sm">
                                    {data?.mainEntity?.jobTitle?.join(', ')}
                                </span>
                            </div>
                        </div>
                    )}
                    {!!data?.mainEntity?.birthDate && (
                        <div className="text-sm">
                            <div>
                                <strong className="text-sm font-semibold">Age: </strong>
                                <span className="text-sm">
                                    {moment().diff(moment(data?.mainEntity?.birthDate), 'years')}{' '}
                                    years old (
                                    {moment(data?.mainEntity?.birthDate).format('DD MMM YYYY')})
                                </span>
                            </div>
                        </div>
                    )}
                </div>
            )}
            {isMovieCustom && (
                <div className="m-4">
                    {data?.details?.map?.((detail) => (
                        <div>
                            <strong className="text-sm font-semibold">{detail?.title}: </strong>
                            {detail?.data?.map?.((detailData) => (
                                <a
                                    href={detailData?.url || ''}
                                    className="text-sm text-blue-700 ml-1 hover:underline">
                                    {detailData?.text}
                                </a>
                            ))}
                        </div>
                    ))}
                    {data?.boxoffice?.map?.((detail) => (
                        <div>
                            <strong className="text-sm font-semibold">{detail?.title}: </strong>
                            {detail?.data?.map?.((detailData) => (
                                <span className="text-sm text-gray-700 ml-1">{detailData}</span>
                            ))}
                        </div>
                    ))}
                    {data?.review?.name && (
                        <div className="mt-4 pt-4 border-t">
                            <div className="text-xl">Audience reviews</div>
                            <div className="mt-4 flex flex-row justify-start">
                                <div className="w-8 h-8 block rounded-full bg-gray-400" />
                                <div className="ml-3 mt-1 w-4/5">
                                    <div className="text-gray-700 text-xs">
                                        {data?.review?.reviewRating?.ratingValue}/
                                        {data?.review?.reviewRating?.bestRating}
                                    </div>
                                    <p
                                        // eslint-disable-next-line react/no-danger
                                        dangerouslySetInnerHTML={{
                                            __html: data?.review?.reviewBody,
                                        }}
                                        className="text-sm line-clamp-4"
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                    {data?.similar?.length && (
                        <div className="mt-4 pt-4 border-t">
                            <div className="text-xl">People also search for</div>
                            <div className="flex flex-row w-45vw overflow-scroll mt-4 mb-4">
                                {data?.similar?.map?.((similar) => (
                                    <div className="mr-2 group cursor-pointer">
                                        <div
                                            style={{
                                                backgroundImage: `url(${similar?.image?.src})`,
                                                width: '80px',
                                                height: '120px',
                                            }}
                                            className="bg-cover rounded-lg"
                                        />
                                        <div className="line-clamp-3 text-sm mt-1 group-hover:underline">
                                            {similar?.title}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
            {infobox && (
                <div className="text-sm m-4 w-fit">
                    {infobox
                        .filter(
                            (row, index, arr) =>
                                !!row?.[1] || (!row?.[1] && !!arr?.[index + 1]?.[1]),
                        )
                        .slice(1)
                        .map((row) => (
                            <div>
                                <strong
                                    className={`text-sm ${
                                        row?.[1]
                                            ? 'font-semibold'
                                            : 'font-extrabold mt-4 inline-block'
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
};
export default WikiInfoBox;
