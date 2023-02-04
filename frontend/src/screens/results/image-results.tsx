import { capitalCase } from 'change-case';
import React from 'react';
import { Image } from './interface';

const ImageResults = ({ images }: { images: Image[] }) => (
    <div className="flex flex-wrap w-screen pl-6 pt-6">
        {images.map((image) => {
            let name: string | string[] = new URL(image.src).hostname.split('.');
            name = name?.[name.length - 2];
            return (
                <div className="mr-6 mb-6">
                    <div className="rounded-lg overflow-hidden bg-gray-200 max-w-20vw">
                        <img src={image.src} alt={image.alt} className="h-40" />
                    </div>
                    <div>
                        <span className="text-xs text-gray-500">{capitalCase(name)}</span>
                        <span className="text-xs block line-clamp-1 w-auto max-w-20vw">
                            {image.alt || image.title}
                        </span>
                    </div>
                </div>
            );
        })}
    </div>
);
export default ImageResults;
