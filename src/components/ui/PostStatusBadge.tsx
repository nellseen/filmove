import React from 'react';
import type { PostStatus } from '../../types/post';

interface PostStatusBadgeProps {
  status: PostStatus;
  className?: string;
}

export const PostStatusBadge: React.FC<PostStatusBadgeProps> = ({ status, className = '' }) => {
  const config = {
    published: {
      label: 'Dipublikasikan',
      bg: 'bg-emerald-50 text-[#15803D] border-emerald-200',
      dot: 'bg-[#15803D]',
    },
    draft: {
      label: 'Draf',
      bg: 'bg-amber-50 text-[#A16207] border-amber-200',
      dot: 'bg-[#A16207]',
    },
    archived: {
      label: 'Diarsipkan',
      bg: 'bg-gray-100 text-[#68707A] border-gray-200',
      dot: 'bg-[#68707A]',
    },
  }[status];

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-medium border ${config.bg} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  );
};
