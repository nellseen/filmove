import express, { Request, Response } from 'express';
import cors from 'cors';
import type { TelegramMetadataPreviewResult } from './types/post';

const apiApp = express();

apiApp.use(cors());
apiApp.use(express.json());

// Helper: validate and normalize Telegram post URL
export function parseAndValidateTelegramUrl(rawUrl: string): { channel: string; messageId: number; normalizedUrl: string } | null {
  if (!rawUrl || typeof rawUrl !== 'string') return null;
  const trimmed = rawUrl.trim();

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(trimmed);
  } catch {
    return null;
  }

  const host = parsedUrl.hostname.toLowerCase();
  if (host !== 't.me' && host !== 'www.t.me') {
    return null;
  }

  const pathname = parsedUrl.pathname;
  if (pathname.includes('/+') || pathname.includes('/joinchat') || pathname.startsWith('/c/')) {
    return null;
  }

  const match = pathname.match(/^\/([a-zA-Z0-9_]{3,})\/([0-9]+)\/?$/);
  if (!match) {
    return null;
  }

  const channel = match[1];
  const messageId = parseInt(match[2], 10);
  if (!channel || isNaN(messageId) || messageId <= 0) {
    return null;
  }

  return {
    channel,
    messageId,
    normalizedUrl: `https://t.me/${channel}/${messageId}`,
  };
}

// Telegram Metadata Provider
export async function fetchTelegramMetadata(channel: string, messageId: number, canonicalUrl: string): Promise<TelegramMetadataPreviewResult> {
  const embedUrl = `https://t.me/${channel}/${messageId}?embed=1`;
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const response = await fetch(embedUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml',
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return {
        sourceUrl: canonicalUrl,
        channelUsername: channel,
        channelTitle: channel,
        messageId,
        title: null,
        description: null,
        thumbnailUrl: null,
        publishedAtSource: null,
        extractionStatus: 'unavailable',
        metadataSource: 'manual',
        message: `HTTP ${response.status} dari Telegram. Silakan lengkapi judul dan deskripsi secara manual.`,
      };
    }

    const html = await response.text();

    if (html.includes('tgme_widget_message_error') || html.includes('Post not found')) {
      return {
        sourceUrl: canonicalUrl,
        channelUsername: channel,
        channelTitle: channel,
        messageId,
        title: null,
        description: null,
        thumbnailUrl: null,
        publishedAtSource: null,
        extractionStatus: 'unavailable',
        metadataSource: 'manual',
        message: 'Postingan tidak ditemukan di channel Telegram publik atau channel bersifat privat.',
      };
    }

    let channelTitle: string | null = null;
    const authorMatch = html.match(/class="[^"]*tgme_widget_message_owner_name[^"]*"[^>]*>([\s\S]*?)<\/div>/i);
    if (authorMatch && authorMatch[1]) {
      channelTitle = authorMatch[1].replace(/<[^>]+>/g, '').trim();
    }

    let rawText: string | null = null;
    const textMatch = html.match(/class="[^"]*tgme_widget_message_text[^"]*"[^>]*>([\s\S]*?)<\/div>/i);
    if (textMatch && textMatch[1]) {
      rawText = textMatch[1]
        .replace(/<br\s*[\/]?>/gi, '\n')
        .replace(/<[^>]+>/g, '')
        .trim();
    }

    let thumbnailUrl: string | null = null;
    const photoMatch = html.match(/tgme_widget_message_photo_wrap[^"]*"[^>]*style="[^"]*background-image:url\('([^']+)'\)/i);
    if (photoMatch && photoMatch[1]) {
      thumbnailUrl = photoMatch[1];
    } else {
      const videoThumbMatch = html.match(/tgme_widget_message_video_thumb[^"]*"[^>]*style="[^"]*background-image:url\('([^']+)'\)/i);
      if (videoThumbMatch && videoThumbMatch[1]) {
        thumbnailUrl = videoThumbMatch[1];
      }
    }

    let publishedAtSource: string | null = null;
    const timeMatch = html.match(/<time[^>]*datetime="([^"]+)"/i);
    if (timeMatch && timeMatch[1]) {
      publishedAtSource = timeMatch[1];
    }

    let title: string | null = null;
    let description: string | null = null;

    if (rawText) {
      const lines = rawText.split('\n').map(l => l.trim()).filter(Boolean);
      if (lines.length > 0) {
        title = lines[0].slice(0, 140);
        if (lines.length > 1) {
          description = lines.slice(1).join('\n').slice(0, 500);
        }
      }
    }

    const hasTitle = Boolean(title);
    const hasThumb = Boolean(thumbnailUrl);

    let status: 'complete' | 'partial' | 'unavailable' = 'partial';
    if (hasTitle && hasThumb) {
      status = 'complete';
    } else if (!hasTitle && !hasThumb && !rawText) {
      status = 'unavailable';
    }

    return {
      sourceUrl: canonicalUrl,
      channelUsername: channel,
      channelTitle: channelTitle || channel,
      messageId,
      title: title || `${channelTitle || channel} - Post #${messageId}`,
      description: description || null,
      thumbnailUrl: thumbnailUrl || null,
      publishedAtSource: publishedAtSource || new Date().toISOString(),
      extractionStatus: status,
      metadataSource: 'telegram-preview',
      message: status === 'complete' 
        ? 'Metadata berhasil diambil dari Telegram.' 
        : 'Metadata terambil sebagian. Anda dapat melengkapi informasi di bawah sebelum mempublikasikan.',
    };
  } catch (error: any) {
    return {
      sourceUrl: canonicalUrl,
      channelUsername: channel,
      channelTitle: channel,
      messageId,
      title: null,
      description: null,
      thumbnailUrl: null,
      publishedAtSource: null,
      extractionStatus: 'unavailable',
      metadataSource: 'manual',
      message: 'Koneksi ke preview Telegram timeout atau tidak dapat diakses. Anda dapat mengisi data secara manual.',
    };
  }
}

// Telegram preview endpoint. Catalog writes use Firestore Security Rules directly.
// POST /api/v1/admin/telegram/preview
const handlePreviewRequest = async (req: Request, res: Response) => {
  const { url } = req.body || {};
  if (!url || typeof url !== 'string') {
    res.status(400).json({ error: 'URL Telegram wajib diisi' });
    return;
  }

  const parsed = parseAndValidateTelegramUrl(url);
  if (!parsed) {
    res.status(400).json({
      error: 'Format URL tidak valid. Gunakan format postingan publik: https://t.me/<nama_channel>/<id_pesan>',
    });
    return;
  }

  const preview = await fetchTelegramMetadata(parsed.channel, parsed.messageId, parsed.normalizedUrl);
  res.json({ data: preview });
};

apiApp.post('/api/v1/admin/telegram/preview', handlePreviewRequest);
apiApp.post('/api/telegram/preview', handlePreviewRequest);
apiApp.post('/api/preview', handlePreviewRequest);
apiApp.post('/preview', handlePreviewRequest);

export default apiApp;
