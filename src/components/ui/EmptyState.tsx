import React from 'react';
import { Film, Search, Plus } from 'lucide-react';
import { Button } from './Button';

interface EmptyStateProps {
  type?: 'no-results' | 'no-posts' | 'admin-empty';
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  type = 'no-posts',
  title,
  description,
  actionLabel,
  onAction,
}) => {
  const defaults = {
    'no-results': {
      icon: Search,
      title: 'Tidak Ada Hasil yang Cocok',
      description: 'Coba ubah kata kunci pencarian atau bersihkan filter saluran.',
    },
    'no-posts': {
      icon: Film,
      title: 'Koleksi Belum Memiliki Postingan',
      description: 'Belum ada postingan Telegram yang dipublikasikan ke katalog publik.',
    },
    'admin-empty': {
      icon: Plus,
      title: 'Belum Ada Postingan Telegram',
      description: 'Mulai dengan menambahkan link postingan Telegram publik pertama Anda.',
    },
  }[type];

  const IconComponent = defaults.icon;

  return (
    <div className="flex flex-col items-center justify-center p-12 text-center bg-white rounded-xl border border-[#E5E8EC] max-w-lg mx-auto">
      <div className="w-12 h-12 rounded-xl bg-[#F1F3F5] text-[#68707A] flex items-center justify-center mb-4">
        <IconComponent className="w-6 h-6 stroke-1.5" />
      </div>
      <h3 className="text-base font-semibold text-[#17191C] mb-1">
        {title || defaults.title}
      </h3>
      <p className="text-xs text-[#68707A] max-w-sm leading-relaxed mb-5">
        {description || defaults.description}
      </p>
      {actionLabel && onAction && (
        <Button size="sm" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
};
