import React, { useState } from 'react';
import type { TelegramMetadataPreviewResult } from '../../types/post';
import { Field } from '../ui/Field';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';
import { Button } from '../ui/Button';
import { Thumbnail } from '../ui/Thumbnail';
import { Sparkles, AlertCircle, CheckCircle, ExternalLink } from 'lucide-react';

interface MetadataPreviewProps {
  preview: TelegramMetadataPreviewResult;
  onSave: (payload: {
    sourceUrl: string;
    title: string;
    description: string | null;
    thumbnailUrl: string | null;
    channelUsername: string;
    channelTitle: string;
    messageId: number;
    status: 'draft' | 'published';
  }) => Promise<void>;
  onCancel: () => void;
  isSaving: boolean;
}

export const MetadataPreview: React.FC<MetadataPreviewProps> = ({
  preview,
  onSave,
  onCancel,
  isSaving,
}) => {
  const [title, setTitle] = useState(preview.title || '');
  const [description, setDescription] = useState(preview.description || '');
  const [thumbnailUrl, setThumbnailUrl] = useState(preview.thumbnailUrl || '');
  const [channelTitle, setChannelTitle] = useState(preview.channelTitle || preview.channelUsername);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async (status: 'draft' | 'published') => {
    if (!title.trim()) {
      setError('Judul postingan wajib diisi sebelum menyimpan atau mempublikasikan.');
      return;
    }
    setError(null);

    await onSave({
      sourceUrl: preview.sourceUrl,
      title: title.trim(),
      description: description.trim() || null,
      thumbnailUrl: thumbnailUrl.trim() || null,
      channelUsername: preview.channelUsername,
      channelTitle: channelTitle.trim() || preview.channelUsername,
      messageId: preview.messageId,
      status,
    });
  };

  const isComplete = preview.extractionStatus === 'complete';
  const isPartial = preview.extractionStatus === 'partial';

  return (
    <div className="bg-white rounded-xl border border-[#E5E8EC] p-6 space-y-6">
      {/* Status banner */}
      <div
        className={`p-3.5 rounded-lg border text-xs flex items-start gap-2.5 ${
          isComplete
            ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
            : isPartial
            ? 'bg-amber-50 border-amber-200 text-amber-900'
            : 'bg-blue-50 border-blue-200 text-blue-900'
        }`}
      >
        {isComplete ? (
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
        ) : isPartial ? (
          <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        ) : (
          <AlertCircle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
        )}
        <div className="flex-1">
          <p className="font-medium">
            {isComplete
              ? 'Pratinjau Berhasil Diekstrak'
              : isPartial
              ? 'Pratinjau Sebagian Berhasil Diekstrak'
              : 'Metadata Ekstraksi Tidak Tersedia'}
          </p>
          <p className="mt-0.5 opacity-90 leading-relaxed">
            {preview.message ||
              'Anda dapat meninjau dan mengubah data di bawah ini sebelum mempublikasikan.'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Editable Form Fields */}
        <div className="lg:col-span-7 space-y-4">
          <Field label="URL Asal Telegram (Read-only)">
            <Input value={preview.sourceUrl} readOnly disabled className="bg-[#F1F3F5] font-mono text-xs" />
          </Field>

          <Field
            label="Judul Postingan"
            required
            error={error || undefined}
            helperText="Judul ringkas yang akan ditampilkan pada kartu publik"
          >
            <Input
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (error) setError(null);
              }}
              placeholder="Contoh: Dune: Part Two - Official Trailer"
            />
          </Field>

          <Field
            label="Keterangan / Sinopsis"
            helperText="Deskripsi singkat konten postingan (opsional)"
          >
            <Textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Deskripsi singkat atau ringkasan cerita..."
            />
          </Field>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Nama Tampilan Saluran">
              <Input
                value={channelTitle}
                onChange={(e) => setChannelTitle(e.target.value)}
                placeholder="Nama Saluran"
              />
            </Field>

            <Field label="Username Saluran">
              <Input value={`@${preview.channelUsername}`} readOnly disabled className="bg-[#F1F3F5] text-xs font-mono" />
            </Field>
          </div>

          <Field
            label="URL Gambar Mini (Thumbnail)"
            helperText="Hanya tautan gambar HTTPS publik. Kosongkan untuk menggunakan placeholder default."
          >
            <Input
              value={thumbnailUrl}
              onChange={(e) => setThumbnailUrl(e.target.value)}
              placeholder="https://example.com/thumbnail.jpg"
            />
          </Field>
        </div>

        {/* Right Column: Live Card Preview */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#17191C] uppercase tracking-wider">
              Pratinjau Kartu Publik
            </span>
            <span className="text-[11px] text-[#68707A]">Tampilan Pengunjung</span>
          </div>

          <div className="border border-[#E5E8EC] rounded-xl overflow-hidden bg-white shadow-2xs">
            <Thumbnail src={thumbnailUrl || null} alt={title || 'Pratinjau'} aspectRatio="16:9" />
            <div className="p-4 space-y-2">
              <div className="flex items-center gap-1.5 text-[11px] text-[#68707A]">
                <span className="font-semibold text-[#17191C]">
                  {channelTitle || preview.channelUsername}
                </span>
                <span>•</span>
                <span>Baru saja</span>
              </div>
              <h4 className="text-sm font-semibold text-[#17191C] line-clamp-2">
                {title || 'Judul Postingan Belum Diisi'}
              </h4>
              <p className="text-xs text-[#68707A] line-clamp-2 leading-relaxed">
                {description || 'Belum ada deskripsi yang ditambahkan untuk postingan ini.'}
              </p>
              <div className="pt-2 border-t border-[#E5E8EC] flex items-center justify-end">
                <div className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#2563EB] text-white text-xs font-medium rounded-lg opacity-90">
                  <span>Tonton Sekarang</span>
                  <ExternalLink className="w-3 h-3" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="pt-4 border-t border-[#E5E8EC] flex flex-wrap items-center justify-between gap-3">
        <Button variant="ghost" size="sm" onClick={onCancel} disabled={isSaving}>
          Batal & Reset
        </Button>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="md"
            onClick={() => handleSave('draft')}
            isLoading={isSaving}
          >
            Simpan sebagai Draf
          </Button>
          <Button
            variant="primary"
            size="md"
            onClick={() => handleSave('published')}
            isLoading={isSaving}
          >
            Publikasikan ke Katalog
          </Button>
        </div>
      </div>
    </div>
  );
};
