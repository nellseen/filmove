import React, { useState } from 'react';
import type { TelegramPost, PostStatus } from '../../types/post';
import { Field } from '../ui/Field';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';
import { Button } from '../ui/Button';
import { 
  Layers, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  ExternalLink, 
  ArrowRight,
  ShieldCheck,
  List,
  Hash,
  Loader2,
  StopCircle
} from 'lucide-react';

interface BulkImportItemStatus {
  url: string;
  channel: string;
  messageId: number;
  status: 'pending' | 'processing' | 'success-full' | 'success-fallback' | 'error';
  title?: string;
  errorMessage?: string;
}

interface BulkImportViewProps {
  onSavePost: (payload: {
    sourceUrl: string;
    title: string;
    description: string | null;
    thumbnailUrl: string | null;
    channelUsername: string;
    channelTitle: string;
    messageId: number;
    status: 'draft' | 'published';
  }) => Promise<void>;
  onNavigateToPosts: () => void;
  onNavigateToPublic: () => void;
  adminEmail: string;
}

export const BulkImportView: React.FC<BulkImportViewProps> = ({
  onSavePost,
  onNavigateToPosts,
  onNavigateToPublic,
  adminEmail,
}) => {
  const [importMode, setImportMode] = useState<'urls' | 'range'>('urls');
  const [rawTextUrls, setRawTextUrls] = useState<string>('');
  const [channelInput, setChannelInput] = useState<string>('');
  const [startId, setStartId] = useState<number>(600);
  const [endId, setEndId] = useState<number>(605);
  const [targetStatus, setTargetStatus] = useState<'draft' | 'published'>('published');

  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [shouldStop, setShouldStop] = useState<boolean>(false);
  const [progressItems, setProgressItems] = useState<BulkImportItemStatus[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [completed, setCompleted] = useState<boolean>(false);

  // Parse URLs helper
  const extractUrlsFromText = (text: string): { channel: string; messageId: number; url: string }[] => {
    const lines = text.split(/[\r\n,\s]+/).map((s) => s.trim()).filter(Boolean);
    const results: { channel: string; messageId: number; url: string }[] = [];
    const seen = new Set<string>();

    for (const line of lines) {
      try {
        const parsed = new URL(line);
        if (parsed.hostname.toLowerCase() === 't.me' || parsed.hostname.toLowerCase() === 'www.t.me') {
          const match = parsed.pathname.match(/^\/([a-zA-Z0-9_]{3,})\/([0-9]+)\/?$/);
          if (match) {
            const canonical = `https://t.me/${match[1]}/${match[2]}`;
            if (!seen.has(canonical)) {
              seen.add(canonical);
              results.push({
                channel: match[1],
                messageId: parseInt(match[2], 10),
                url: canonical,
              });
            }
          }
        }
      } catch {
        // quiet
      }
    }
    return results;
  };

  // Generate URLs from range
  const generateUrlsFromRange = (): { channel: string; messageId: number; url: string }[] => {
    const cleanCh = channelInput.replace(/^@/, '').trim();
    if (!cleanCh || startId <= 0 || endId < startId) return [];
    const maxItems = 30; // Protect from huge loops
    const actualEnd = Math.min(endId, startId + maxItems - 1);
    const results: { channel: string; messageId: number; url: string }[] = [];

    for (let id = startId; id <= actualEnd; id++) {
      results.push({
        channel: cleanCh,
        messageId: id,
        url: `https://t.me/${cleanCh}/${id}`,
      });
    }
    return results;
  };

  const parsedItems = importMode === 'urls' ? extractUrlsFromText(rawTextUrls) : generateUrlsFromRange();

  // Execute bulk import with dual fallback
  const startBulkImport = async () => {
    if (parsedItems.length === 0) return;

    setIsRunning(true);
    setShouldStop(false);
    setCompleted(false);

    const initialQueue: BulkImportItemStatus[] = parsedItems.map((item) => ({
      url: item.url,
      channel: item.channel,
      messageId: item.messageId,
      status: 'pending',
    }));
    setProgressItems(initialQueue);

    for (let i = 0; i < initialQueue.length; i++) {
      if (shouldStop) break;
      setCurrentIndex(i);

      // Mark processing
      setProgressItems((prev) =>
        prev.map((item, idx) => (idx === i ? { ...item, status: 'processing' } : item))
      );

      const target = initialQueue[i];
      let extractedTitle = `@${target.channel} - Post #${target.messageId}`;
      let extractedDesc: string | null = null;
      let extractedThumb: string | null = null;
      let channelTitle = target.channel;
      let wasFullExtraction = false;

      // 1. Try Primary Extraction via Telegram Preview API
      try {
        const res = await fetch('/api/v1/admin/telegram/preview', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: target.url }),
        });

        if (res.ok) {
          const json = await res.json();
          if (json.data && json.data.title) {
            extractedTitle = json.data.title;
            extractedDesc = json.data.description || null;
            extractedThumb = json.data.thumbnailUrl || null;
            channelTitle = json.data.channelTitle || target.channel;
            wasFullExtraction = json.data.extractionStatus === 'complete' || Boolean(json.data.thumbnailUrl);
          }
        }
      } catch (err) {
        console.warn(`[BulkImport] Extraction fallback for ${target.url}:`, err);
      }

      // 2. Save via Storage Engine (Firestore & Sync)
      try {
        await onSavePost({
          sourceUrl: target.url,
          title: extractedTitle,
          description: extractedDesc,
          thumbnailUrl: extractedThumb,
          channelUsername: target.channel,
          channelTitle,
          messageId: target.messageId,
          status: targetStatus,
        });

        setProgressItems((prev) =>
          prev.map((item, idx) =>
            idx === i
              ? {
                  ...item,
                  status: wasFullExtraction ? 'success-full' : 'success-fallback',
                  title: extractedTitle,
                }
              : item
          )
        );
      } catch (saveError: any) {
        setProgressItems((prev) =>
          prev.map((item, idx) =>
            idx === i
              ? {
                  ...item,
                  status: 'error',
                  errorMessage: saveError?.message || 'Gagal menyimpan',
                }
              : item
          )
        );
      }

      // Short delay between items to be gentle with network
      await new Promise((r) => setTimeout(r, 350));
    }

    setIsRunning(false);
    setCompleted(true);
  };

  const successCount = progressItems.filter(
    (p) => p.status === 'success-full' || p.status === 'success-fallback'
  ).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="pb-4 border-b border-[#E5E8EC]">
        <div className="flex flex-wrap items-center gap-2 mb-1.5">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-50 text-[#2563EB] text-xs font-semibold">
            <Layers className="w-3.5 h-3.5" />
            <span>Dual-Fallback Bulk Importer</span>
          </div>
          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-emerald-50 text-[#15803D] text-[11px] font-medium border border-emerald-200">
            <ShieldCheck className="w-3 h-3" />
            <span>Auto-Resilience Active</span>
          </div>
        </div>
        <h2 className="text-xl font-bold text-[#17191C]">Impor Massal Tautan Telegram</h2>
        <p className="text-xs text-[#68707A] mt-0.5 max-w-2xl leading-relaxed">
          Tambahkan banyak postingan sekaligus. Sistem akan otomatis mencoba mengekstrak metadata dari Telegram,
          dan jika link tertentu gagal/timeout, sistem <strong>otomatis menggunakan fallback</strong> tanpa membatalkan proses impor.
        </p>
      </div>

      {!completed && !isRunning ? (
        <div className="bg-white rounded-xl border border-[#E5E8EC] p-6 space-y-6 max-w-2xl">
          {/* Mode Selector */}
          <div className="flex items-center gap-2 border-b border-[#E5E8EC] pb-4">
            <button
              type="button"
              onClick={() => setImportMode('urls')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                importMode === 'urls'
                  ? 'bg-[#2563EB] text-white shadow-xs'
                  : 'bg-[#F1F3F5] text-[#68707A] hover:text-[#17191C]'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>Daftar Banyak Tautan (Paste URL)</span>
            </button>
            <button
              type="button"
              onClick={() => setImportMode('range')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                importMode === 'range'
                  ? 'bg-[#2563EB] text-white shadow-xs'
                  : 'bg-[#F1F3F5] text-[#68707A] hover:text-[#17191C]'
              }`}
            >
              <Hash className="w-3.5 h-3.5" />
              <span>Rentang ID Pesan Saluran</span>
            </button>
          </div>

          {/* Mode 1: Paste URLs */}
          {importMode === 'urls' ? (
            <Field
              label="Daftar URL Postingan Telegram (Satu per baris)"
              required
              helperText="Paste link publik Telegram. Format: https://t.me/<saluran>/<id_pesan>"
            >
              <Textarea
                rows={6}
                value={rawTextUrls}
                onChange={(e) => setRawTextUrls(e.target.value)}
                placeholder={`https://t.me/lagiviralnih1/608\nhttps://t.me/lagiviralnih1/609\nhttps://t.me/filmmakers_vault/1042`}
                className="font-mono text-xs"
              />
            </Field>
          ) : (
            /* Mode 2: Channel Range */
            <div className="space-y-4">
              <Field
                label="Nama / Username Saluran"
                required
                helperText="Nama channel publik Telegram tanpa spasi (contoh: lagiviralnih1)"
              >
                <Input
                  value={channelInput}
                  onChange={(e) => setChannelInput(e.target.value)}
                  placeholder="lagiviralnih1"
                  leftElement={<span className="text-xs font-semibold text-[#68707A]">@</span>}
                />
              </Field>

              <div className="grid grid-cols-2 gap-4">
                <Field label="ID Pesan Mulai" required>
                  <Input
                    type="number"
                    value={startId}
                    onChange={(e) => setStartId(parseInt(e.target.value, 10) || 1)}
                    min={1}
                  />
                </Field>
                <Field label="ID Pesan Selesai" required helperText="Maksimal 30 postingan per batch">
                  <Input
                    type="number"
                    value={endId}
                    onChange={(e) => setEndId(parseInt(e.target.value, 10) || 1)}
                    min={startId}
                  />
                </Field>
              </div>
            </div>
          )}

          {/* Setting: Target Status */}
          <div className="pt-2 border-t border-[#E5E8EC] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <span className="text-xs font-semibold text-[#17191C]">Status Publikasi Default:</span>
              <p className="text-[11px] text-[#68707A]">Pilih apakah konten langsung tampil ke publik atau jadi draf</p>
            </div>
            <select
              value={targetStatus}
              onChange={(e) => setTargetStatus(e.target.value as 'draft' | 'published')}
              className="h-9 px-3 bg-white border border-[#E5E8EC] rounded-lg text-xs font-medium text-[#17191C] focus:ring-1 focus:ring-[#2563EB]"
            >
              <option value="published">Dipublikasikan Langsung</option>
              <option value="draft">Simpan sebagai Draf</option>
            </select>
          </div>

          {/* Summary & Start Button */}
          <div className="pt-4 border-t border-[#E5E8EC] flex items-center justify-between">
            <span className="text-xs text-[#68707A]">
              Terdeteksi:{' '}
              <strong className="text-[#17191C] font-semibold">{parsedItems.length}</strong> tautan valid
            </span>
            <Button
              variant="primary"
              size="md"
              disabled={parsedItems.length === 0}
              onClick={startBulkImport}
              leftIcon={<Layers className="w-4 h-4" />}
            >
              Mulai Impor ({parsedItems.length} Postingan)
            </Button>
          </div>
        </div>
      ) : (
        /* Progress & Live Results Log */
        <div className="bg-white rounded-xl border border-[#E5E8EC] p-6 space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-[#E5E8EC]">
            <div>
              <h3 className="text-sm font-semibold text-[#17191C]">
                {completed ? 'Impor Massal Selesai' : 'Sedang Memproses Impor Massal...'}
              </h3>
              <p className="text-xs text-[#68707A] mt-0.5">
                {successCount} dari {progressItems.length} postingan berhasil disimpan ke Cloud Firestore.
              </p>
            </div>
            {isRunning && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShouldStop(true)}
                leftIcon={<StopCircle className="w-3.5 h-3.5 text-[#DC2626]" />}
              >
                Hentikan
              </Button>
            )}
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-[#F1F3F5] rounded-full h-2 overflow-hidden">
            <div
              className="bg-[#2563EB] h-2 transition-all duration-300"
              style={{
                width: `${Math.round(((currentIndex + (completed ? 1 : 0)) / Math.max(1, progressItems.length)) * 100)}%`,
              }}
            />
          </div>

          {/* Live Table of Processed Items */}
          <div className="border border-[#E5E8EC] rounded-lg overflow-hidden max-h-80 overflow-y-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F7F8FA] border-b border-[#E5E8EC] text-[#68707A] font-semibold text-[11px]">
                <tr>
                  <th className="px-3.5 py-2.5">No</th>
                  <th className="px-3.5 py-2.5">Tautan Telegram</th>
                  <th className="px-3.5 py-2.5">Hasil / Judul</th>
                  <th className="px-3.5 py-2.5 text-right">Status Fallback</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E8EC]">
                {progressItems.map((item, idx) => (
                  <tr key={item.url} className="hover:bg-[#F7F8FA]/60">
                    <td className="px-3.5 py-2 font-mono text-[11px] text-[#68707A]">{idx + 1}</td>
                    <td className="px-3.5 py-2 font-mono text-[11px] max-w-[200px] truncate text-[#17191C]">
                      {item.url}
                    </td>
                    <td className="px-3.5 py-2 max-w-xs truncate font-medium text-[#17191C]">
                      {item.title || item.url}
                    </td>
                    <td className="px-3.5 py-2 text-right whitespace-nowrap">
                      {item.status === 'processing' && (
                        <span className="inline-flex items-center gap-1 text-[11px] text-[#2563EB]">
                          <Loader2 className="w-3 h-3 animate-spin" />
                          <span>Memproses...</span>
                        </span>
                      )}
                      {item.status === 'success-full' && (
                        <span className="inline-flex items-center gap-1 text-[11px] text-[#15803D] font-medium bg-emerald-50 px-2 py-0.5 rounded">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Ekstraksi Penuh</span>
                        </span>
                      )}
                      {item.status === 'success-fallback' && (
                        <span className="inline-flex items-center gap-1 text-[11px] text-[#A16207] font-medium bg-amber-50 px-2 py-0.5 rounded">
                          <Sparkles className="w-3 h-3" />
                          <span>Fallback Otomatis</span>
                        </span>
                      )}
                      {item.status === 'error' && (
                        <span className="inline-flex items-center gap-1 text-[11px] text-[#DC2626] font-medium bg-red-50 px-2 py-0.5 rounded">
                          <AlertCircle className="w-3 h-3" />
                          <span>Gagal</span>
                        </span>
                      )}
                      {item.status === 'pending' && (
                        <span className="text-[11px] text-[#68707A]">Menunggu...</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Done actions */}
          {completed && (
            <div className="pt-3 border-t border-[#E5E8EC] flex flex-wrap items-center justify-between gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setCompleted(false);
                  setProgressItems([]);
                  setRawTextUrls('');
                }}
              >
                Impor Lagi
              </Button>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={onNavigateToPosts}>
                  Kelola Postingan
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={onNavigateToPublic}
                  rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                >
                  Lihat di Halaman Publik
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
