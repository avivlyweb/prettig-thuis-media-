/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';

interface FooterProps {
    isLanding: boolean;
}

const Footer: React.FC<FooterProps> = ({ isLanding }) => {
    if (isLanding) {
        return (
            <footer className="w-full bg-transparent p-4 mt-16 text-neutral-500 text-sm text-center">
                 <p>Een <span className="font-bold text-neutral-600">Prettig Thuis</span> concept door Jesse Aarden & Aviv Hidrian</p>
                 <p className="mt-1">Mede mogelijk gemaakt door het Smarth Health and Vitality Lab</p>
            </footer>
        );
    }

    return (
        <footer className="fixed bottom-0 left-0 right-0 bg-transparent p-2 z-10 text-neutral-500 text-xs">
            <div className="max-w-screen-xl mx-auto flex justify-center items-center">
                <p>Een <span className="font-bold text-neutral-600">Prettig Thuis</span> concept door Jesse Aarden & Aviv Hidrian</p>
            </div>
        </footer>
    );
};

export default Footer;