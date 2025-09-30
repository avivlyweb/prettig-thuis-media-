/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useEffect } from 'react';
import { cn } from '../lib/utils';

type ImageStatus = 'pending' | 'done' | 'error';

interface PolaroidCardProps {
    imageUrl?: string;
    caption: string;
    status: ImageStatus;
    error?: string;
    isActivityStrip?: boolean;
}

const LoadingSpinner = () => (
    <div className="flex items-center justify-center h-full">
        <svg className="animate-spin h-12 w-12 text-neutral-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
    </div>
);

const ErrorDisplay = () => (
    <div className="flex flex-col items-center justify-center h-full text-center p-4">
         <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-red-500 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="text-lg text-red-600">Sorry, something went wrong.</p>
    </div>
);

const Placeholder = ({ isActivityStrip }: { isActivityStrip?: boolean }) => (
     <div className={`flex flex-col items-center justify-center h-full text-neutral-500 ${!isActivityStrip && 'group-hover:text-neutral-600'} transition-colors duration-300`}>
        <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        <span className="font-permanent-marker text-xl">Upload a Photo</span>
    </div>
);

const PolaroidCard: React.FC<PolaroidCardProps> = ({ imageUrl, caption, status, isActivityStrip }) => {
    const [isDeveloped, setIsDeveloped] = useState(false);
    const [isImageLoaded, setIsImageLoaded] = useState(false);

    useEffect(() => {
        if (status === 'pending' || (status === 'done' && imageUrl)) {
            setIsDeveloped(false);
            setIsImageLoaded(false);
        }
    }, [imageUrl, status]);

    useEffect(() => {
        if (isImageLoaded) {
            const timer = setTimeout(() => setIsDeveloped(true), 200);
            return () => clearTimeout(timer);
        }
    }, [isImageLoaded]);

    const cardClasses = cn(
        "bg-white p-4 flex flex-col items-center justify-start rounded-md shadow-xl relative",
        isActivityStrip ? 'w-full aspect-[2/1] pb-20' : 'aspect-[3/4] w-80 max-w-full pb-16'
    );

    return (
        <div className={cardClasses}>
            <div className="w-full bg-gray-200 shadow-inner flex-grow relative overflow-hidden rounded-sm">
                {status === 'pending' && <LoadingSpinner />}
                {status === 'error' && <ErrorDisplay />}
                {status === 'done' && imageUrl && (
                    <>
                        <div className={`absolute inset-0 z-10 bg-[#5d544c] transition-opacity duration-[3500ms] ease-out ${isDeveloped ? 'opacity-0' : 'opacity-100'}`} aria-hidden="true" />
                        <img key={imageUrl} src={imageUrl} alt={caption} onLoad={() => setIsImageLoaded(true)} className={`w-full h-full object-cover transition-all duration-[4000ms] ease-in-out ${isDeveloped ? 'opacity-100 filter-none' : 'opacity-80 filter sepia(1) contrast(0.8) brightness(0.8)'}`} style={{ opacity: isImageLoaded ? undefined : 0 }} />
                    </>
                )}
                {status === 'done' && !imageUrl && <Placeholder isActivityStrip={isActivityStrip} />}
            </div>
            <div className="absolute bottom-4 left-4 right-4 text-center px-2">
                <p className={cn("font-permanent-marker text-3xl truncate", status === 'done' && imageUrl ? 'text-black' : 'text-gray-500')}>
                    {caption}
                </p>
            </div>
        </div>
    );
};

export default PolaroidCard;
