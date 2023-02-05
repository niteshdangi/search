/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { capitalCase } from 'change-case';
import { concat } from 'lodash';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useInfiniteQuery, useQueryClient } from 'react-query';
import apiClient from '../../apis';
import apis from '../../apis/apis';
import { Image, SearchResponse } from './interface';

interface IProps extends Image {
    reportWidth: (inx: number, width: number) => void;
    index: number;
    width: number;
}
const ImageEl = (image: IProps) => {
    let name: string | string[];
    try {
        name = new URL(image?.url || image?.src || '')?.hostname?.split?.('.');
        name = name?.[name.length - 2];
    } catch (e) {
        name = '';
    }
    return (
        <a href={image.url} className="group">
            <div className="mr-6 mb-6 h-52">
                <div className="group-hover:shadow-md group-hover:shadow-gray-400 transition-all rounded-lg overflow-hidden bg-gray-200 max-w-20vw">
                    {image.width ? (
                        <div
                            className="h-40 bg-cover"
                            style={{
                                backgroundImage: `url(${image.src})`,
                                width: image.width - 24,
                            }}
                        />
                    ) : (
                        <img
                            src={image.src}
                            alt={image.alt}
                            className="h-40 inline-block  blur-lg"
                            onLoad={(e: any) => {
                                setTimeout(
                                    () => image.reportWidth(image.index, e.target.width + 24),
                                    100,
                                );
                            }}
                            onError={() => {
                                image.reportWidth(image.index, 200);
                            }}
                        />
                    )}
                </div>
                <div
                    className={`mt-2 w-min inline-block img-${image.src?.replace?.(
                        /([^A-Za-z])/g,
                        '',
                    )}`}
                    style={{ width: image.width - 24 }}>
                    <span className="text-xs text-gray-500 flex flex-row items-center">
                        {image?.icon && (
                            <img src={image.icon} alt={name} className="h-2.5 mr-1.5" />
                        )}
                        {capitalCase(name || '')}
                    </span>
                    <span className="text-xs block line-clamp-1 w-auto">
                        {image.alt || image.title}
                    </span>
                </div>
            </div>
        </a>
    );
};
function createRows(images: IProps[], screenWidth: number) {
    const rows = [];
    let currentRow = [];
    let currentWidth = 0;
    const imagesMoved = [];

    for (let i = 0; i < images.length; i++) {
        const image = images[i];
        if (imagesMoved.findIndex((img) => img.src === image.src) !== -1) {
            // eslint-disable-next-line no-continue
            continue;
        }

        if (currentWidth + image.width > screenWidth) {
            let found = false;

            for (let j = i; j < images.length; j++) {
                const nextImage = images[j];
                if (
                    imagesMoved.findIndex((img) => img.src === nextImage.src) !== -1 ||
                    rows.findIndex(
                        (img) => img.findIndex((im) => im.src === nextImage.src) !== -1,
                    ) !== -1
                ) {
                    // eslint-disable-next-line no-continue
                    continue;
                }
                if (currentWidth + nextImage.width <= screenWidth) {
                    currentRow.push(nextImage);
                    imagesMoved.push(nextImage);
                    currentWidth += nextImage.width;
                    found = true;
                    break;
                }
            }
            const scaleFactor = screenWidth / currentWidth;
            for (let j = 0; j < currentRow.length; j++) {
                currentRow[j].width *= scaleFactor;
            }
            rows.push(currentRow);
            currentRow = [];
            currentWidth = 0;
            currentRow.push(image);
            currentWidth += image.width;
        } else {
            currentWidth += image.width;
            currentRow.push(image);
        }
    }

    return { rows, currentRow };
}

const ImageResults = ({
    images,
    query,
    data,
}: {
    images: Image[];
    query: string;
    // eslint-disable-next-line react/require-default-props
    data?: SearchResponse<Image>;
}) => {
    const [allImages, setAllImages] = useState(images);
    const widths = useRef<IProps[]>(images as IProps[]);
    const [fittedImages, setFittedImages] = useState<IProps[][]>([]);
    const reportWidth = (inx: number, width: number) => {
        widths.current[inx] = { ...widths.current[inx], width };
        if (widths.current.filter((w) => !!w.width)?.length === allImages.length) {
            const { rows, currentRow } = createRows(widths.current, window.innerWidth - 24);
            setFittedImages((r) => [...r, ...rows]);
            setAllImages([]);
            widths.current = currentRow;
        }
    };
    const { fetchNextPage, data: infiniteData } = useInfiniteQuery(
        ['images', query, data?.scrollId],
        ({ pageParam }) =>
            apiClient.get<SearchResponse<Image>>(apis.search, {
                params: {
                    scrollId: pageParam || data?.scrollId,
                },
            }),
        {
            refetchOnMount: false,
            refetchOnWindowFocus: false,
            enabled: false,
            onSuccess(_data) {
                const page: IProps[] = _data.pages[_data.pages.length - 1]?.data
                    ?.results as unknown as IProps[];
                setAllImages([...widths.current, ...page]);
                widths.current = [...widths.current, ...page];
            },
            getNextPageParam: (prev) => prev.data.scrollId,
        },
    );
    const isMore = useMemo(
        () =>
            images.length +
                (infiniteData?.pages?.flatMap?.((r: any) => r.data.results) || [])?.length <
            (data?.total?.value || 0),
        [data, infiniteData],
    );
    useEffect(() => {
        if (!isMore) {
            setAllImages(widths.current);
        }
    }, [isMore]);
    return (
        <div className="flex flex-wrap w-screen pl-6 pt-6">
            {fittedImages.map((page) =>
                page.map((image, inx) => <ImageEl key={image.src} {...image} />),
            )}
            {allImages.map((image, inx) => (
                <ImageEl
                    // eslint-disable-next-line react/no-array-index-key
                    key={image.src + inx}
                    {...image}
                    reportWidth={reportWidth}
                    index={inx}
                    width={0}
                />
            ))}
            {isMore && (
                <button
                    onClick={() => {
                        fetchNextPage();
                    }}
                    type="button">
                    Load More
                </button>
            )}
        </div>
    );
};
export default ImageResults;
