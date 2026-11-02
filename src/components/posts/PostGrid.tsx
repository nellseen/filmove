import React from 'react';
import type { TelegramPost } from '../../types/post';
import { PostCard } from './PostCard';
import { PostCardSkeleton } from '../ui/Skeleton';

interface PostGridProps {
  posts: TelegramPost[];
  isLoading?: boolean;
  onOpenDetail: (post: TelegramPost) => void;
  isAdmin?: boolean;
  onEdit?: (post: TelegramPost) => void;
}

export const PostGrid: React.FC<PostGridProps> = ({
  posts,
  isLoading,
  onOpenDetail,
  isAdmin,
  onEdit,
}) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {Array.from({ length: 6 }).map((_, i) => (
          <PostCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      {posts.map((post) => (
        <PostCard
          key={post.id}
          post={post}
          onOpenDetail={onOpenDetail}
          isAdmin={isAdmin}
          onEdit={onEdit}
        />
      ))}
    </div>
  );
};
