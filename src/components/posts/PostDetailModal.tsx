import React from 'react';
import type { TelegramPost } from '../../types/post';
import { Dialog } from '../ui/Dialog';
import { Thumbnail } from '../ui/Thumbnail';
import { Button } from '../ui/Button';
import { PostStatusBadge } from '../ui/PostStatusBadge';
import { ExternalLink, Calendar, Send, Copy, Check } from 'lucide-react';

interface PostDetailModalProps {
  post: TelegramPost | null;
  isOpen: boolean;
  onClose: () => void;
  isAdmin?: boolean;
}

export const PostDetailModal: React.FC<PostDetailModalProps> = ({
  post,
  isOpen,
  onClose,
  isAdmin,
}) => {
  const [copied, setCopied] = React.useState(false);

  if (!post) return null;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(post.sourceUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formattedDate = post.publishedAtSource
    ? new Date(post.publishedAtSource).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : null;

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title="Detail Postingan Telegram" maxWidth="lg">
      <div className="flex flex-col gap-5">
        {/* 16:9 Media Preview */}
        <div className="rounded-lg overflow-hidden border border-[#E5E8EC]">
          <Thumbnail src={post.thumbnailUrl} alt={post.title} aspectRatio="16:9" />
        </div>

        {/* Metadata Badges */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-[#F1F3F5] text-[#17191C]">
              <Send className="w-3.5 h-3.5 text-[#2563EB]" />
              @{post.channelUsername}
            </span>
            {isAdmin && <PostStatusBadge status={post.status} />}
          </div>
          {formattedDate && (
            <span className="text-xs text-[#68707A] flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              {formattedDate}
            </span>
          )}
        </div>

        {/* Title */}
        <div>
          <h2 className="text-base font-bold text-[#17191C] leading-snug">
            {post.title}
          </h2>
          {post.channelTitle && (
            <p className="text-xs text-[#68707A] mt-0.5">
              Diposting oleh {post.channelTitle}
            </p>
          )}
        </div>

        {/* Description / Caption */}
        {post.description && (
          <div className="p-3.5 bg-[#F7F8FA] rounded-lg border border-[#E5E8EC]">
            <h4 className="text-xs font-semibold text-[#68707A] uppercase tracking-wider mb-1.5">
              Keterangan
            </h4>
            <p className="text-xs text-[#17191C] leading-relaxed whitespace-pre-wrap">
              {post.description}
            </p>
          </div>
        )}

        {/* Source URL Display */}
        <div className="flex items-center justify-between gap-2 p-2.5 bg-[#F1F3F5] rounded-lg text-xs">
          <span className="font-mono text-[#68707A] truncate">
            {post.sourceUrl}
          </span>
          <button
            type="button"
            onClick={handleCopyLink}
            className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-[#17191C] hover:bg-white rounded transition-colors cursor-pointer shrink-0"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-[#15803D]" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Tersalin' : 'Salin'}</span>
          </button>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#E5E8EC]">
          <Button variant="outline" size="sm" onClick={onClose}>
            Tutup
          </Button>
          <a
            href={post.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-medium rounded-lg transition-colors shadow-2xs cursor-pointer"
          >
            <span>Tonton Sekarang di Telegram</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </Dialog>
  );
};
