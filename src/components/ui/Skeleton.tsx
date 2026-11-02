import React from 'react';

export const Skeleton: React.FC<{ className?: string }> = ({ className = '' }) => {
  return <div className={`animate-pulse bg-[#E5E8EC] rounded-md ${className}`} />;
};

export const PostCardSkeleton: React.FC = () => {
  return (
    <div className="bg-white rounded-xl border border-[#E5E8EC] overflow-hidden flex flex-col">
      <Skeleton className="w-full aspect-video rounded-none" />
      <div className="p-4 flex flex-col gap-3 flex-1 justify-between">
        <div className="space-y-2">
          <Skeleton className="w-24 h-4" />
          <Skeleton className="w-full h-5" />
          <Skeleton className="w-3/4 h-5" />
          <Skeleton className="w-full h-3 mt-2" />
          <Skeleton className="w-5/6 h-3" />
        </div>
        <div className="pt-2 border-t border-[#E5E8EC] flex items-center justify-between">
          <Skeleton className="w-16 h-3" />
          <Skeleton className="w-28 h-8 rounded-lg" />
        </div>
      </div>
    </div>
  );
};
