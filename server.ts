import express, { Request, Response } from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import type { TelegramPost, TelegramMetadataPreviewResult, CatalogStats, PostStatus } from './src/types/post';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(cors());
app.use(express.json());

// In-memory data store seeded with high-quality movie & film catalog entries
let postsStore: TelegramPost[] = [
  {
    id: 'post-1',
    sourceUrl: 'https://t.me/filmmakers_vault/1042',
    channelUsername: 'filmmakers_vault',
    channelTitle: "Filmmaker's Vault",
    messageId: 1042,
    title: 'Dune: Part Two (2024) - Teaser Sinematografi & Sound Design 4K',
    description: 'Analisis visual komposisi framing Denis Villeneuve dan sound landscape Hans Zimmer untuk adegan gurun Arrakis.',
    thumbnailUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=1200&q=80',
    publishedAtSource: '2024-03-12T14:30:00Z',
    metadataSource: 'telegram-preview',
    status: 'published',
    viewsCount: 14200,
    createdAt: new Date(Date.now() - 86400000 * 12).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 10).toISOString(),
    createdBy: 'admin@filmove.app',
    updatedBy: 'admin@filmove.app',
  },
  {
    id: 'post-2',
    sourceUrl: 'https://t.me/cinema_archives/518',
    channelUsername: 'cinema_archives',
    channelTitle: 'Cinema Archives',
    messageId: 518,
    title: 'Interstellar: 10th Anniversary IMAX Film Reel Breakdown',
    description: 'Cuplikan arsip 70mm IMAX Christopher Nolan dengan detail proses rekaman model miniatur Gargantua.',
    thumbnailUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=80',
    publishedAtSource: '2024-05-18T09:15:00Z',
    metadataSource: 'telegram-preview',
    status: 'published',
    viewsCount: 28900,
    createdAt: new Date(Date.now() - 86400000 * 9).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 9).toISOString(),
    createdBy: 'admin@filmove.app',
    updatedBy: 'admin@filmove.app',
  },
  {
    id: 'post-3',
    sourceUrl: 'https://t.me/ghibli_aesthetic/305',
    channelUsername: 'ghibli_aesthetic',
    channelTitle: 'Studio Ghibli Aesthetic',
    messageId: 305,
    title: 'Spirited Away (Sen to Chihiro) - Color Palette & Background Art Restored',
    description: 'Restorasi warna lukisan tangan Kazuo Oga untuk pemandangan pemandian air panas dan kereta di atas air.',
    thumbnailUrl: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=1200&q=80',
    publishedAtSource: '2024-06-01T11:00:00Z',
    metadataSource: 'mixed',
    status: 'published',
    viewsCount: 9400,
    createdAt: new Date(Date.now() - 86400000 * 7).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 6).toISOString(),
    createdBy: 'admin@filmove.app',
    updatedBy: 'admin@filmove.app',
  },
  {
    id: 'post-4',
    sourceUrl: 'https://t.me/scifi_trailers/884',
    channelUsername: 'scifi_trailers',
    channelTitle: 'Sci-Fi Film Network',
    messageId: 884,
    title: 'Blade Runner 2049 - Visual Lighting and Practical Rain Sequences',
    description: 'Dokumentasi pencahayaan neon Roger Deakins di studio Budapest untuk adegan ikonik K dan Joi.',
    thumbnailUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80',
    publishedAtSource: '2024-07-20T18:45:00Z',
    metadataSource: 'telegram-preview',
    status: 'published',
    viewsCount: 16500,
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 4).toISOString(),
    createdBy: 'admin@filmove.app',
    updatedBy: 'admin@filmove.app',
  },
  {
    id: 'post-5',
    sourceUrl: 'https://t.me/indie_film_club/129',
    channelUsername: 'indie_film_club',
    channelTitle: 'Indie Film Club',
    messageId: 129,
    title: 'Past Lives (2023) - 35mm New York & Seoul Long Takes',
    description: 'Kajian sinematik sutradara Celine Song mengenai konsep In-Yun dan pergerakan kamera statis.',
    thumbnailUrl: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=1200&q=80',
    publishedAtSource: '2024-08-14T10:10:00Z',
    metadataSource: 'manual',
    status: 'published',
    viewsCount: 5200,
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    createdBy: 'admin@filmove.app',
    updatedBy: 'admin@filmove.app',
  },
  {
    id: 'post-6',
    sourceUrl: 'https://t.me/animation_vault/411',
    channelUsername: 'animation_vault',
    channelTitle: 'Animation Vault',
    messageId: 411,
    title: 'Spider-Man: Across the Spider-Verse - Multi-Style Animation Pipeline',
    description: 'Bedah proses perpaduan render cel-shading, komik retro Ben-Day dots, dan cat air gaya Gwen Stacy.',
    thumbnailUrl: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&w=1200&q=80',
    publishedAtSource: '2024-09-02T16:20:00Z',
    metadataSource: 'telegram-preview',
    status: 'draft',
    viewsCount: 3100,
    createdAt: new Date(Date.now() - 86400000 * 1).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 1).toISOString(),
    createdBy: 'admin@filmove.app',
    updatedBy: 'admin@filmove.app',
  }
];

// Helper: validate and normalize Telegram post URL
function parseAndValidateTelegramUrl(rawUrl: string): { channel: string; messageId: number; normalizedUrl: string } | null {
  if (!rawUrl || typeof rawUrl !== 'string') return null;
  const trimmed = rawUrl.trim();

  // Must start with http:// or https://
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(trimmed);
  } catch {
    return null;
  }

  // Strictly check hostname
  const host = parsedUrl.hostname.toLowerCase();
  if (host !== 't.me' && host !== 'www.t.me') {
    return null;
  }

  // Reject invite links and special paths
  const pathname = parsedUrl.pathname;
  if (pathname.includes('/+') || pathname.includes('/joinchat') || pathname.startsWith('/c/')) {
    return null;
  }

  // Pattern: /<channel_username>/<message_id>
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
async function fetchTelegramMetadata(channel: string, messageId: number, canonicalUrl: string): Promise<TelegramMetadataPreviewResult> {
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

    // Check if post exists or has content
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

    // Extract channel title
    let channelTitle: string | null = null;
    const authorMatch = html.match(/class="[^"]*tgme_widget_message_owner_name[^"]*"[^>]*>([\s\S]*?)<\/div>/i);
    if (authorMatch && authorMatch[1]) {
      channelTitle = authorMatch[1].replace(/<[^>]+>/g, '').trim();
    }

    // Extract text / caption / title
    let rawText: string | null = null;
    const textMatch = html.match(/class="[^"]*tgme_widget_message_text[^"]*"[^>]*>([\s\S]*?)<\/div>/i);
    if (textMatch && textMatch[1]) {
      rawText = textMatch[1]
        .replace(/<br\s*[\/]?>/gi, '\n')
        .replace(/<[^>]+>/g, '')
        .trim();
    }

    // Extract image / thumbnail
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

    // Extract datetime
    let publishedAtSource: string | null = null;
    const timeMatch = html.match(/<time[^>]*datetime="([^"]+)"/i);
    if (timeMatch && timeMatch[1]) {
      publishedAtSource = timeMatch[1];
    }

    // Derive a clean title from the first line of the message or channel name
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

// ----------------------------------------------------
// REST API v1
// ----------------------------------------------------

// GET /api/v1/posts
app.get('/api/v1/posts', (req: Request, res: Response) => {
  const { status, search, channel, page = '1', limit = '12' } = req.query;
  const p = Math.max(1, parseInt(page as string, 10) || 1);
  const l = Math.max(1, Math.min(50, parseInt(limit as string, 10) || 12));

  let filtered = [...postsStore];

  // Status filter (default to published for public viewers unless specified by admin)
  if (status && typeof status === 'string' && status !== 'all') {
    filtered = filtered.filter(item => item.status === status);
  } else if (!status) {
    filtered = filtered.filter(item => item.status === 'published');
  }

  // Channel filter
  if (channel && typeof channel === 'string' && channel.trim() !== '') {
    filtered = filtered.filter(item => item.channelUsername.toLowerCase() === channel.toLowerCase());
  }

  // Search filter
  if (search && typeof search === 'string' && search.trim() !== '') {
    const q = search.toLowerCase().trim();
    filtered = filtered.filter(item => 
      item.title.toLowerCase().includes(q) ||
      (item.description && item.description.toLowerCase().includes(q)) ||
      item.channelUsername.toLowerCase().includes(q) ||
      (item.channelTitle && item.channelTitle.toLowerCase().includes(q))
    );
  }

  // Sort by updatedAt descending
  filtered.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

  const total = filtered.length;
  const totalPages = Math.ceil(total / l) || 1;
  const startIndex = (p - 1) * l;
  const items = filtered.slice(startIndex, startIndex + l);

  // Collect distinct channels
  const channels = Array.from(new Set(postsStore.map(p => p.channelUsername)));

  res.json({
    data: items,
    pagination: {
      total,
      page: p,
      limit: l,
      totalPages,
      hasNext: p < totalPages,
      hasPrev: p > 1,
    },
    channels,
  });
});

// GET /api/v1/posts/:id
app.get('/api/v1/posts/:id', (req: Request, res: Response) => {
  const post = postsStore.find(p => p.id === req.params.id);
  if (!post) {
    res.status(404).json({ error: 'Postingan tidak ditemukan' });
    return;
  }
  res.json({ data: post });
});

// GET /api/v1/stats
app.get('/api/v1/stats', (_req: Request, res: Response) => {
  const totalPosts = postsStore.length;
  const publishedPosts = postsStore.filter(p => p.status === 'published').length;
  const draftPosts = postsStore.filter(p => p.status === 'draft').length;
  const archivedPosts = postsStore.filter(p => p.status === 'archived').length;
  const uniqueChannels = new Set(postsStore.map(p => p.channelUsername)).size;

  const stats: CatalogStats = {
    totalPosts,
    publishedPosts,
    draftPosts,
    archivedPosts,
    uniqueChannels,
  };

  res.json({ data: stats });
});

// POST /api/v1/admin/telegram/preview
app.post('/api/v1/admin/telegram/preview', async (req: Request, res: Response) => {
  const { url } = req.body;
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
});

// POST /api/v1/admin/posts
app.post('/api/v1/admin/posts', (req: Request, res: Response) => {
  const { sourceUrl, title, description, thumbnailUrl, channelUsername, channelTitle, messageId, status = 'draft', metadataSource = 'manual' } = req.body;

  if (!sourceUrl || !title || typeof title !== 'string' || title.trim() === '') {
    res.status(400).json({ error: 'URL Telegram dan Judul postingan wajib diisi sebelum menyimpan' });
    return;
  }

  const parsed = parseAndValidateTelegramUrl(sourceUrl);
  if (!parsed) {
    res.status(400).json({ error: 'URL Telegram tidak valid' });
    return;
  }

  const newPost: TelegramPost = {
    id: `post-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
    sourceUrl: parsed.normalizedUrl,
    channelUsername: channelUsername || parsed.channel,
    channelTitle: channelTitle || channelUsername || parsed.channel,
    messageId: messageId || parsed.messageId,
    title: title.trim(),
    description: description ? description.trim() : null,
    thumbnailUrl: thumbnailUrl && typeof thumbnailUrl === 'string' && thumbnailUrl.trim().startsWith('http') ? thumbnailUrl.trim() : null,
    publishedAtSource: new Date().toISOString(),
    metadataSource: metadataSource as any,
    status: (status === 'published' ? 'published' : 'draft') as PostStatus,
    viewsCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: 'admin@filmove.app',
    updatedBy: 'admin@filmove.app',
  };

  postsStore.unshift(newPost);
  res.status(201).json({ data: newPost, message: 'Postingan berhasil disimpan' });
});

// PATCH /api/v1/admin/posts/:id
app.patch('/api/v1/admin/posts/:id', (req: Request, res: Response) => {
  const postIndex = postsStore.findIndex(p => p.id === req.params.id);
  if (postIndex === -1) {
    res.status(404).json({ error: 'Postingan tidak ditemukan' });
    return;
  }

  const current = postsStore[postIndex];
  const { title, description, thumbnailUrl, channelTitle, status } = req.body;

  if (title !== undefined && (!title || typeof title !== 'string' || title.trim() === '')) {
    res.status(400).json({ error: 'Judul tidak boleh kosong' });
    return;
  }

  const updated: TelegramPost = {
    ...current,
    title: title !== undefined ? title.trim() : current.title,
    description: description !== undefined ? (description ? description.trim() : null) : current.description,
    thumbnailUrl: thumbnailUrl !== undefined ? (thumbnailUrl ? thumbnailUrl.trim() : null) : current.thumbnailUrl,
    channelTitle: channelTitle !== undefined ? channelTitle.trim() : current.channelTitle,
    status: status !== undefined ? status : current.status,
    metadataSource: 'mixed',
    updatedAt: new Date().toISOString(),
  };

  postsStore[postIndex] = updated;
  res.json({ data: updated, message: 'Postingan berhasil diperbarui' });
});

// POST /api/v1/admin/posts/:id/publish
app.post('/api/v1/admin/posts/:id/publish', (req: Request, res: Response) => {
  const post = postsStore.find(p => p.id === req.params.id);
  if (!post) {
    res.status(404).json({ error: 'Postingan tidak ditemukan' });
    return;
  }
  if (!post.title || post.title.trim() === '') {
    res.status(400).json({ error: 'Postingan memerlukan judul sebelum dipublikasikan' });
    return;
  }

  post.status = 'published';
  post.updatedAt = new Date().toISOString();
  res.json({ data: post, message: 'Postingan berhasil dipublikasikan ke katalog' });
});

// POST /api/v1/admin/posts/:id/unpublish
app.post('/api/v1/admin/posts/:id/unpublish', (req: Request, res: Response) => {
  const post = postsStore.find(p => p.id === req.params.id);
  if (!post) {
    res.status(404).json({ error: 'Postingan tidak ditemukan' });
    return;
  }

  post.status = 'draft';
  post.updatedAt = new Date().toISOString();
  res.json({ data: post, message: 'Status diubah menjadi draf' });
});

// DELETE /api/v1/admin/posts/:id
app.delete('/api/v1/admin/posts/:id', (req: Request, res: Response) => {
  const postIndex = postsStore.findIndex(p => p.id === req.params.id);
  if (postIndex === -1) {
    res.status(404).json({ error: 'Postingan tidak ditemukan' });
    return;
  }

  const removed = postsStore.splice(postIndex, 1)[0];
  res.json({ data: removed, message: 'Postingan berhasil dihapus' });
});

// ----------------------------------------------------
// Frontend Mounting via Vite
// ----------------------------------------------------
async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Serve static files in production
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Filmove server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
