import { capitalCase } from 'change-case';
import moment from 'moment';
import React, { useState } from 'react';
import { BackIcon, OpenIcon } from '../../assets/image-icon';
import { SearchResult } from './interface';

export const durationToTime = (duration: string, isString = false) => {
    const words = duration.split('');
    let prevDesg = '';
    let hour = 0;
    let min: string | number = 0;
    let second: string | number = 0;
    words.forEach((desg) => {
        if (desg === 'H') {
            hour = Number(duration.split('H')?.[0]?.split(prevDesg)?.[1]);
            prevDesg = 'H';
        } else if (desg === 'M') {
            min = Number(duration.split('M')?.[0]?.split(prevDesg)?.[1]);
            prevDesg = 'M';
        } else if (desg === 'S') {
            second = Number(duration.split('S')?.[0]?.split(prevDesg)?.[1]);
            prevDesg = 'S';
        } else if (['P', 'Y', 'M', 'W', 'D', 'T', 'H', 'M', 'S'].includes(desg)) {
            prevDesg = desg;
        }
    });
    if (second > 59) {
        const tempMins = Math.floor(second / 60);
        min += tempMins;
        second -= tempMins * 60;
    }

    if (min > 59) {
        const tempHrs = Math.floor(min / 60);
        hour += tempHrs;
        min -= tempHrs * 60;
    }

    if (isString) {
        let str = '';
        if (hour > 0) str += `${hour}h `;
        if (min > 0) str += `${min}m `;
        if (second > 0) str += `${second}s `;
        return str;
    }
    if (second < 10) {
        second = `0${second}`;
    }
    if (min < 10 && hour > 0) {
        min = `0${min}`;
    }
    return `${hour ? `${hour}:` : ''}${min || '00'}:${second}`;
};

interface IProps extends SearchResult {
    // eslint-disable-next-line react/require-default-props
    isSmall?: boolean;
}

const VideoResult = ({ data, title, url, highlights, description, isSmall = false }: IProps) => {
    const [fullVideo, setFullVideo] = useState(false);
    let breadcrumbUrl: string | string[] = (url.endsWith('/') ? url.slice(0, -1) : url).split('//');
    breadcrumbUrl =
        breadcrumbUrl?.length === 1
            ? breadcrumbUrl?.join?.('//').replaceAll('/', ' › ')
            : breadcrumbUrl.slice(1).join('//').replaceAll('/', ' › ').replaceAll(' ›  › ', '//');
    let name: string | string[] = new URL(url)?.hostname?.split?.('.');
    name = name?.[name.length - 2];
    const [playVideo, setPlayVideo] = useState(false);
    return (
        <div className="mb-8">
            <div className="">
                {!isSmall && (
                    <a href={url} className="peer group text-sm w-fit line-clamp-1 cursor-pointer">
                        {breadcrumbUrl.split(' ')[0]}
                        {breadcrumbUrl.split(' ')?.[1] && (
                            <span className="peer text-sm w-fit cursor-pointer text-gray-500">
                                {` ${breadcrumbUrl.split(' ').slice(1).join(' ').split('?')?.[0]}`}
                            </span>
                        )}
                    </a>
                )}
                {!isSmall && (
                    <a
                        href={url}
                        className="hover:underline group peer-hover:underline w-fit max-w-screen-sm py-1 text-xl text-blue-800 cursor-pointer line-clamp-1">
                        {data?.name || title}
                    </a>
                )}
                <div
                    className="flex flex-row mt-2"
                    onMouseEnter={() => setPlayVideo(true)}
                    onMouseLeave={() => setPlayVideo(false)}>
                    <button
                        type="button"
                        onClick={() => setFullVideo(true)}
                        className={`pr-6 relative ${isSmall ? 'w-1/4' : 'w-1/3'}`}>
                        <div
                            style={{
                                backgroundImage: `url(${
                                    data?.thumbnail?.url || data?.thumbnailUrl
                                })`,
                            }}
                            className={`w-full rounded-xl bg-cover bg-no-repeat flex items-center justify-center cursor-pointer ${
                                isSmall ? 'h-20 ' : 'h-24 '
                            }`}>
                            <span className="fill-white opacity-90 w-9 h-9 block z-10 absolute">
                                <svg
                                    focusable="false"
                                    xmlns="http://www.w3.org/2000/svg"
                                    viewBox="0 0 24 24">
                                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z" />
                                </svg>
                            </span>
                            {data?.duration && (
                                <span className="absolute bottom-1.5 z-10 left-1.5 text-xs text-white bg-black bg-opacity-60 px-2 rounded-full">
                                    {durationToTime(data?.duration)}
                                </span>
                            )}
                            {data?.embedUrl && playVideo && (
                                <>
                                    <div className="block z-10 h-24 w-full absolute" />
                                    <iframe
                                        className={`w-full z-0 rounded-xl relative ${
                                            isSmall ? 'h-20 ' : 'h-24 '
                                        }`}
                                        src={`${
                                            data?.embedUrl?.includes('?')
                                                ? `${data?.embedUrl}&`
                                                : `${data?.embedUrl}?`
                                        }autoplay=1&loop=1&controls=0&rel=0&modestbranding=1&disablekb=1&mute=1`}
                                        title={title}
                                    />
                                </>
                            )}
                        </div>
                    </button>
                    <div className="w-2/3 ">
                        {isSmall ? (
                            <a
                                href={url}
                                className="hover:underline group peer-hover:underline w-fit max-w-screen-sm py-1 text-md text-blue-800 cursor-pointer line-clamp-1">
                                {data?.name || title}
                            </a>
                        ) : (
                            <p
                                className="text-sm line-clamp-2 h-10"
                                // eslint-disable-next-line react/no-danger
                                dangerouslySetInnerHTML={{
                                    __html:
                                        highlights?.description?.join?.('... ') ||
                                        highlights?.headings?.join('... ') ||
                                        highlights?.paragraph?.join('... ') ||
                                        data?.description ||
                                        description,
                                }}
                            />
                        )}
                        <div className="text-sm text-gray-500 mt-2">
                            <span className="text-gray-700">
                                {data?.publisher?.name || capitalCase(name || '')}
                            </span>{' '}
                            {data?.author?.name ? '·' : ''} <span>{data?.author?.name}</span>{' '}
                            {isSmall ? '' : '·'}{' '}
                            {!isSmall && (
                                <span>{moment(data?.uploadDate).format('DD-MMM-YYYY')}</span>
                            )}
                        </div>
                        {isSmall && (
                            <span className="text-sm text-gray-500 mt-2">
                                {moment(data?.uploadDate).format('DD-MMM-YYYY')}
                            </span>
                        )}
                    </div>
                </div>
            </div>
            {fullVideo && (
                <div className="fixed z-50 bg-white w-screen h-screen top-0 left-0 pt-11 px-48">
                    <BackIcon
                        className="fixed w-6 h-6 block top-13 left-14 fill-gray-600 cursor-pointer z-50"
                        onClick={() => setFullVideo(false)}
                    />
                    <div className="flex flex-row justify-between items-start">
                        <a href="url" className="w-3/4 group">
                            <span className="text-3xl line-clamp-1 group-hover:underline">
                                {data?.name || title}
                            </span>
                            <div className="text-md text-gray-500 mt-2">
                                <span className="text-gray-700">
                                    {data?.publisher?.name || capitalCase(name || '')}
                                </span>{' '}
                                {data?.author?.name ? '·' : ''} <span>{data?.author?.name}</span>{' '}
                                {data?.uploadDate ? '·' : '·'}{' '}
                                <span>{moment(data?.uploadDate).format('DD-MMM-YYYY')}</span>
                            </div>
                        </a>
                        <div>
                            <a
                                href={url}
                                className="text-gray-600 bg-gray-100 p-3 px-6 rounded-full flex flex-row items-center">
                                {data?.publisher?.name || capitalCase(name || '')}
                                <OpenIcon className="w-5 h-5 fill-gray-600 inline-block ml-3" />
                            </a>
                        </div>
                    </div>
                    {data?.embedUrl ? (
                        <iframe
                            className="w-full z-0 rounded-xl relative h-screen-video mt-4"
                            src={`${
                                data?.embedUrl?.includes('?')
                                    ? `${data?.embedUrl}&`
                                    : `${data?.embedUrl}?`
                            }autoplay=1`}
                            title={title}
                        />
                    ) : (
                        // eslint-disable-next-line jsx-a11y/media-has-caption
                        <video>
                            <source src={data?.contentUrl} />
                        </video>
                    )}
                </div>
            )}
        </div>
    );
};
export default VideoResult;
