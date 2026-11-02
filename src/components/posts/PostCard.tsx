import React from 'react';
import type { TelegramPost } from '../../types/post';
import { Thumbnail } from '../ui/Thumbnail';
import { ExternalLink, Calendar, Eye } from 'lucide-react';

interface PostCardProps {
  post: TelegramPost;
  onOpenDetail?: (post: TelegramPost) => void;
  isAdmin?: boolean;
  onEdit?: (post: TelegramPost) => void;
}

export const PostCard: React.FC<PostCardProps> = ({
  post,
  onOpenDetail,
  isAdmin,
  onEdit,
}) => {
  const formattedDate = post.publishedAtSource
    ? new Date(post.publishedAtSource).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : null;

  return (
    <article className="group bg-white rounded-xl border border-[#E5E8EC] overflow-hidden flex flex-col transition-all duration-200 hover:border-gray-300 hover:shadow-xs">
      {/* 16:9 Thumbnail Area */}
      <div
        className="cursor-pointer relative overflow-hidden"
        onClick={() => onOpenDetail?.(post)}
      >
        <Thumbnail src={post.thumbnailUrl} alt={post.title} aspectRatio="16:9" />
        
        {/* Channel username badge over thumbnail */}
        <div className="absolute top-2.5 left-2.5 bg-black/75 backdrop-blur-xs text-white text-[11px] font-medium px-2 py-0.5 rounded-md flex items-center gap-1">
          <span>@{post.channelUsername}</span>
        </div>
      </div>

      {/* Card Content */}
      <div className="p-4 flex flex-col flex-1 justify-between gap-3">
        <div className="space-y-1.5">
          {/* Metadata Row */}
          <div className="flex items-center gap-2 text-[11px] text-[#68707A]">
            <span className="font-medium text-[#17191C] truncate max-w-[150px]">
              {post.channelTitle || post.channelUsername}
            </span>
            {formattedDate && (
              <>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3 stroke-1" />
                  {formattedDate}
                </span>
              </>
            )}
          </div>

          {/* Title - clamped to 2 lines */}
          <h3
            onClick={() => onOpenDetail?.(post)}
            className="text-sm font-semibold text-[#17191C] leading-snug line-clamp-2 cursor-pointer group-hover:text-[#2563EB] transition-colors"
            title={post.title}
          >
            {post.title}
          </h3>

          {/* Description - clamped to 2 lines */}
          {post.description && (
            <p className="text-xs text-[#68707A] line-clamp-2 leading-relaxed">
              {post.description}
            </p>
          )}
        </div>

        {/* Action Row */}
        <div className="pt-3 border-t border-[#E5E8EC] flex items-center justify-between gap-2">
          {/* Detail Link / Admin Actions */}
          <div className="flex items-center gap-1">
            {isAdmin && onEdit && (
              <button
                type="button"
                onClick={() => onEdit(post)}
                className="text-xs text-[#68707A] hover:text-[#17191C] font-medium px-2 py-1 rounded hover:bg-[#F1F3F5] transition-colors cursor-pointer"
              >
                Ubah
              </button>
            )}
            <button
              type="button"
              onClick={() => onOpenDetail?.(post)}
              className="text-xs text-[#68707A] hover:text-[#17191C] font-medium px-2 py-1 rounded hover:bg-[#F1F3F5] transition-colors cursor-pointer"
            >
              Detail
            </button>
          </div>

          {/* Primary Action: Tonton Sekarang (Opens Exact Telegram Post) */}
          <a
            href={post.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-medium rounded-lg transition-colors shadow-2xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]"
          >
            <span>Tonton Sekarang</span>
            <ExternalLink className="w-3.5 h-3.5 stroke-1.5" />
          </a>
        </div>
      </div>
    </article>
  );
};
