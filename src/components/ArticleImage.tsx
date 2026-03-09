import React from 'react';
import Image from 'next/image';

const IMAGE_COUNTS: Record<string, number> = {
    agriculture: 20,
    disaster: 15,
    economy: 23,
    environment: 20,
    ethics: 15,
    geography: 20,
    governance: 20,
    history: 20,
    ir: 20,
    polity: 20,
    science: 20,
    security: 20,
    social: 20,
};

interface ArticleImageProps {
    category: string;
    id: string;
    alt: string;
    className?: string;
}

export default function ArticleImage({ category, id, alt, className }: ArticleImageProps) {
    const safeCategory = category && category.toLowerCase();
    const cat = IMAGE_COUNTS[safeCategory] ? safeCategory : 'social'; // Fallback to social if not found
    const count = IMAGE_COUNTS[cat];

    // Deterministic hash based on ID so the image doesn't change on re-renders
    let hash = 0;
    if (id) {
        for (let i = 0; i < id.length; i++) {
            hash = id.charCodeAt(i) + ((hash << 5) - hash);
        }
    }

    const index = (Math.abs(hash) % count) + 1; // 1 to count
    const imageNumber = index.toString().padStart(2, '0');
    const imageSrc = `/images/bank/${cat}/${cat}-${imageNumber}.jpg`;

    return (
        <div className={`relative flex-shrink-0 bg-gray-100 dark:bg-gray-800 overflow-hidden ${className || ''}`}>
            <Image
                src={imageSrc}
                alt={alt || `${cat} image`}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                className="object-cover transition-transform duration-700 hover:scale-105"
            />
        </div>
    );
}
