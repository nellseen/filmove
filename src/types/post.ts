export type PostStatus = 'draft' | 'published' | 'archived';

export type MetadataSource = 'telegram-preview' | 'manual' | 'mixed';

export interface TelegramPost {
  id: string;
  sourceUrl: string;
  channelUsername: string;
  channelTitle?: string;
  messageId: number;
  title: string;
  description: string | null;
  thumbnailUrl: string | null;
  publishedAtSource: string | null;
  metadataSource: MetadataSource;
  status: PostStatus;
  viewsCount?: number;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
}

export interface TelegramMetadataPreviewResult {
  sourceUrl: string;
  channelUsername: string;
  channelTitle: string | null;
  messageId: number;
  title: string | null;
  description: string | null;
  thumbnailUrl: string | null;
  publishedAtSource: string | null;
  extractionStatus: 'complete' | 'partial' | 'unavailable';
  metadataSource: MetadataSource;
  message?: string;
}

export interface CatalogStats {
  totalPosts: number;
  publishedPosts: number;
  draftPosts: number;
  archivedPosts: number;
  uniqueChannels: number;
}
