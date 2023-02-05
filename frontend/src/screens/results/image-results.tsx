import { capitalCase } from 'change-case';
import React, { useState } from 'react';
import { Image } from './interface';

const ImageEl = (image: Image) => {
    const [width, setWidth] = useState(0);
    let name: string | string[] = new URL(image?.url || image?.src || '')?.hostname?.split?.('.');
    name = name?.[name.length - 2];
    return (
        <a href={image.url} className="group">
            <div className="mr-6 mb-6 h-52">
                <div className="group-hover:shadow-md group-hover:shadow-gray-400 transition-all rounded-lg overflow-hidden bg-gray-200 max-w-20vw">
                    <img
                        src={image.src}
                        alt={image.alt}
                        className="h-40 inline-block"
                        onLoad={(e: any) => {
                            if (!width) setTimeout(() => setWidth(e.target.width), 50);
                        }}
                    />
                </div>
                <div
                    className={`mt-2 inline-block img-${image.src.replace(/([^A-Za-z])/g, '')}`}
                    style={{ width }}>
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

const ImageResults = ({ images }: { images: Image[] }) => (
    <div className="flex flex-wrap w-screen pl-6 pt-6">
        {images.map((image) => (
            <ImageEl {...image} />
        ))}
    </div>
);
export default ImageResults;
