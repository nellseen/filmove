import React, { useState } from 'react';
import { Film } from 'lucide-react';

interface ThumbnailProps {
  src?: string | null;
  alt: string;
  className?: string;
  aspectRatio?: '16:9' | '4:3' | '1:1';
}

export const Thumbnail: React.FC<ThumbnailProps> = ({
  src,
  alt,
  className = '',
  aspectRatio = '16:9',
}) => {
  const [hasError, setHasError] = useState(false);

  const ratioClass = {
    '16:9': 'aspect-video',
    '4:3': 'aspect-4/3',
    '1:1': 'aspect-square',
  }[aspectRatio];

  if (!src || hasError) {
    return (
      <div
        className={`w-full ${ratioClass} bg-[#F1F3F5] border-b border-[#E5E8EC] flex flex-col items-center justify-center text-[#68707A] select-none ${className}`}
        aria-label="Tidak ada gambar mini tersedia"
      >
        <Film className="w-8 h-8 stroke-1 text-[#68707A] opacity-60 mb-1" />
        <span className="text-xs font-medium tracking-wide opacity-70">Pratinjau Telegram</span>
      </div>
    );
  }

  return (
    <div className={`w-full ${ratioClass} bg-[#F1F3F5] relative overflow-hidden ${className}`}>
      <img
        src={src}
        alt={alt}
        loading="lazy"
        referrerPolicy="no-referrer"
        onError={() => setHasError(true)}
        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-102"
      />
    </div>
  );
};
