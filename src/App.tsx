import React, { useState, useEffect } from 'react';
import type { TelegramPost, TelegramMetadataPreviewResult, CatalogStats, PostStatus } from './types/post';
import { AppHeader } from './components/layout/AppHeader';
import { AdminSidebar, AdminTab } from './components/layout/AdminSidebar';
import { PostGrid } from './components/posts/PostGrid';
import { PostDetailModal } from './components/posts/PostDetailModal';
import { MetadataPreview } from './components/posts/MetadataPreview';
import { Thumbnail } from './components/ui/Thumbnail';
import { PostStatusBadge } from './components/ui/PostStatusBadge';
import { Button } from './components/ui/Button';
import { Input } from './components/ui/Input';
import { Textarea } from './components/ui/Textarea';
import { Field } from './components/ui/Field';
import { Dialog } from './components/ui/Dialog';
import { ConfirmDialog } from './components/ui/ConfirmDialog';
import { EmptyState } from './components/ui/EmptyState';
import { ToastContainer, ToastMessage } from './components/ui/Toast';
import { testFirestoreConnection } from './lib/firebase';
import { 
  subscribeToPosts, 
  savePostToFirestore, 
  updatePostInFirestore, 
  deletePostFromFirestore,
  purgeAllDummyPosts,
  signInWithGoogle,
  signOutAdmin,
  subscribeToAuthState
} from './services/postService';
import type { User } from 'firebase/auth';
import { 
  Search, 
  Plus, 
  ExternalLink, 
  Trash2, 
  Edit3, 
  CheckCircle, 
  EyeOff, 
  Filter,
  Sparkles,
  Database,
  Lock,
  AlertTriangle
} from 'lucide-react';

// Strictly allow only this email address to access admin mode
const AUTHORIZED_ADMIN_EMAIL = 'cristiandwihariantoro@gmail.com';

export function App() {
  // Navigation & Authentication state
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState<boolean>(false);
  const [isAdminView, setIsAdminView] = useState<boolean>(false);
  const [adminTab, setAdminTab] = useState<AdminTab>('overview');

  // Posts & Catalog State
  const [posts, setPosts] = useState<TelegramPost[]>([]);
  const [channels, setChannels] = useState<string[]>([]);
  const [stats, setStats] = useState<CatalogStats | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isFirestoreConnected, setIsFirestoreConnected] = useState<boolean>(false);

  // Filters & Pagination for Public Catalog
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedChannel, setSelectedChannel] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 12;

  // Modals & Overlays
  const [selectedPost, setSelectedPost] = useState<TelegramPost | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState<boolean>(false);
  const [editingPost, setEditingPost] = useState<TelegramPost | null>(null);
  const [isLoginOpen, setIsLoginOpen] = useState<boolean>(false);
  const [deleteCandidate, setDeleteCandidate] = useState<TelegramPost | null>(null);

  // Add Link State
  const [rawUrlInput, setRawUrlInput] = useState<string>('');
  const [isFetchingPreview, setIsFetchingPreview] = useState<boolean>(false);
  const [previewResult, setPreviewResult] = useState<TelegramMetadataPreviewResult | null>(null);
  const [urlError, setUrlError] = useState<string | null>(null);
  const [isSavingPost, setIsSavingPost] = useState<boolean>(false);

  // Google Login State
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isGoogleLoading, setIsGoogleLoading] = useState<boolean>(false);

  // Admin Posts Management filters
  const [adminStatusFilter, setAdminStatusFilter] = useState<string>('all');
  const [adminSearch, setAdminSearch] = useState<string>('');

  // Toast feedback
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (type: 'success' | 'error' | 'info', message: string) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // 1. Initial connection test and strict auth subscription
  useEffect(() => {
    testFirestoreConnection().then(() => {
      setIsFirestoreConnected(true);
      purgeAllDummyPosts();
    });

    const unsubscribeAuth = subscribeToAuthState(async (user) => {
      if (user) {
        const userEmail = user.email?.toLowerCase().trim();
        if (userEmail === AUTHORIZED_ADMIN_EMAIL.toLowerCase()) {
          setFirebaseUser(user);
          setIsAdminLoggedIn(true);
        } else {
          // Reject any other email account
          await signOutAdmin();
          setFirebaseUser(null);
          setIsAdminLoggedIn(false);
          setIsAdminView(false);
        }
      } else {
        setFirebaseUser(null);
        setIsAdminLoggedIn(false);
        setIsAdminView(false);
      }
    });

    return () => {
      unsubscribeAuth();
    };
  }, []);

// Helper to ensure all post arrays maintain strictly unique keys
function deduplicatePosts(items: TelegramPost[]): TelegramPost[] {
  const map = new Map<string, TelegramPost>();
  for (const item of items) {
    if (item && item.id && !map.has(item.id)) {
      map.set(item.id, item);
    }
  }
  return Array.from(map.values());
}

  // 2. Real-time Firestore subscription
  useEffect(() => {
    setIsLoading(true);
    let unsubscribeFirestore: (() => void) | undefined;

    try {
      unsubscribeFirestore = subscribeToPosts((firestorePosts) => {
        const unique = deduplicatePosts(firestorePosts || []);
        setPosts(unique);
        const uniqueCh = Array.from(new Set(unique.map((p) => p.channelUsername)));
        setChannels(uniqueCh);
        setIsLoading(false);
        updateComputedStats(unique);
      }, isAdminView);
    } catch (err) {
      console.warn('[Firestore] error:', err);
      fetchFromApi();
    }

    return () => {
      if (unsubscribeFirestore) unsubscribeFirestore();
    };
  }, [isAdminView]);

  const updateComputedStats = (postList: TelegramPost[]) => {
    const uniqueList = deduplicatePosts(postList);
    const totalPosts = uniqueList.length;
    const publishedPosts = uniqueList.filter((p) => p.status === 'published').length;
    const draftPosts = uniqueList.filter((p) => p.status === 'draft').length;
    const archivedPosts = uniqueList.filter((p) => p.status === 'archived').length;
    const uniqueChannels = new Set(uniqueList.map((p) => p.channelUsername)).size;
    setStats({ totalPosts, publishedPosts, draftPosts, archivedPosts, uniqueChannels });
  };

  // Fallback API fetch
  const fetchFromApi = async () => {
    try {
      const res = await fetch('/api/v1/posts?status=all');
      if (res.ok) {
        const json = await res.json();
        const unique = deduplicatePosts(json.data || []);
        setPosts(unique);
        if (json.channels) setChannels(json.channels);
        updateComputedStats(unique);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  // Strictly deduplicated list of posts
  const uniquePosts = React.useMemo(() => deduplicatePosts(posts), [posts]);

  // Filtered posts based on active tab and query
  const displayedPosts = React.useMemo(() => {
    return uniquePosts.filter((post) => {
      if (!isAdminView && post.status !== 'published') return false;
      if (isAdminView && adminStatusFilter !== 'all' && post.status !== adminStatusFilter) return false;

      const query = (isAdminView ? adminSearch : searchQuery).toLowerCase().trim();
      if (query) {
        const matchesTitle = post.title.toLowerCase().includes(query);
        const matchesDesc = post.description?.toLowerCase().includes(query);
        const matchesChannel = post.channelUsername.toLowerCase().includes(query);
        if (!matchesTitle && !matchesDesc && !matchesChannel) return false;
      }

      if (!isAdminView && selectedChannel && post.channelUsername.toLowerCase() !== selectedChannel.toLowerCase()) {
        return false;
      }

      return true;
    });
  }, [uniquePosts, isAdminView, adminStatusFilter, adminSearch, searchQuery, selectedChannel]);

  // Pagination calculation
  const totalPages = Math.ceil(displayedPosts.length / itemsPerPage) || 1;
  const paginatedPosts = displayedPosts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Mandatory Google Login with Strict Email Verification
  const handleGoogleLogin = async () => {
    try {
      setLoginError(null);
      setIsGoogleLoading(true);
      const user = await signInWithGoogle();
      const userEmail = user.email?.toLowerCase().trim();

      // STRICT VALIDATION: Only AUTHORIZED_ADMIN_EMAIL can access admin mode
      if (userEmail === AUTHORIZED_ADMIN_EMAIL.toLowerCase()) {
        setFirebaseUser(user);
        setIsAdminLoggedIn(true);
        setIsLoginOpen(false);
        setIsAdminView(true);
        addToast('success', `Selamat datang! Masuk sebagai Admin: ${user.email}`);
      } else {
        // Sign out unauthorized user immediately
        await signOutAdmin();
        setFirebaseUser(null);
        setIsAdminLoggedIn(false);
        setIsAdminView(false);
        setLoginError(`Akses ditolak: Akun ${user.email} tidak memiliki izin administrator. Hanya email ${AUTHORIZED_ADMIN_EMAIL} yang berhak mengakses mode admin.`);
        addToast('error', `Akses ditolak: ${user.email} bukan administrator terdaftar.`);
      }
    } catch (err: any) {
      console.error(err);
      if (err.code !== 'auth/popup-closed-by-user') {
        setLoginError(err.message || 'Gagal masuk dengan Google.');
      }
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOutAdmin();
    } catch (e) {
      // quiet
    }
    setFirebaseUser(null);
    setIsAdminLoggedIn(false);
    setIsAdminView(false);
    addToast('info', 'Anda telah keluar dari sesi Admin.');
  };

// Client-side parser for resilient instant extraction & fallback
function parseTelegramUrlClient(rawUrl: string): { channel: string; messageId: number; normalizedUrl: string } | null {
  if (!rawUrl || typeof rawUrl !== 'string') return null;
  const trimmed = rawUrl.trim();
  try {
    const parsed = new URL(trimmed);
    const host = parsed.hostname.toLowerCase();
    if (host !== 't.me' && host !== 'www.t.me') return null;
    const match = parsed.pathname.match(/^\/([a-zA-Z0-9_]{3,})\/([0-9]+)\/?$/);
    if (!match) return null;
    const channel = match[1];
    const messageId = parseInt(match[2], 10);
    if (!channel || isNaN(messageId) || messageId <= 0) return null;
    return { channel, messageId, normalizedUrl: `https://t.me/${channel}/${messageId}` };
  } catch {
    return null;
  }
}

  // Handle Telegram URL Preview Fetch
  const handleFetchPreview = async (urlToFetch?: string) => {
    const targetUrl = (urlToFetch || rawUrlInput).trim();
    if (!targetUrl) {
      setUrlError('Masukkan URL postingan Telegram publik.');
      return;
    }

    const parsedClient = parseTelegramUrlClient(targetUrl);
    if (!parsedClient) {
      setUrlError('Format URL tidak valid. Gunakan format postingan publik: https://t.me/<nama_channel>/<id_pesan>');
      return;
    }

    setUrlError(null);
    setIsFetchingPreview(true);

    try {
      let resData: any = null;
      try {
        const res = await fetch('/api/v1/admin/telegram/preview', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: parsedClient.normalizedUrl }),
        });
        if (res.ok) {
          resData = await res.json();
        }
      } catch (e) {
        console.warn('API preview fetch failed, using resilient fallback:', e);
      }

      if (resData?.data) {
        setPreviewResult(resData.data);
      } else {
        // Resilient fallback: Never block admin! Advance to Step 2 so admin can fill in metadata manually
        setPreviewResult({
          sourceUrl: parsedClient.normalizedUrl,
          channelUsername: parsedClient.channel,
          channelTitle: parsedClient.channel,
          messageId: parsedClient.messageId,
          title: `@${parsedClient.channel} - Post #${parsedClient.messageId}`,
          description: null,
          thumbnailUrl: null,
          publishedAtSource: new Date().toISOString(),
          extractionStatus: 'unavailable',
          metadataSource: 'manual',
          message: 'Metadata otomatis tidak dapat dimuat dari Telegram. Silakan lengkapi Judul dan Sinopsis secara manual.',
        });
        addToast('info', 'Metadata otomatis tidak dapat dimuat. Anda dapat melengkapi informasi secara manual.');
      }
    } catch {
      // Fallback
      setPreviewResult({
        sourceUrl: parsedClient.normalizedUrl,
        channelUsername: parsedClient.channel,
        channelTitle: parsedClient.channel,
        messageId: parsedClient.messageId,
        title: `@${parsedClient.channel} - Post #${parsedClient.messageId}`,
        description: null,
        thumbnailUrl: null,
        publishedAtSource: new Date().toISOString(),
        extractionStatus: 'unavailable',
        metadataSource: 'manual',
        message: 'Silakan isi judul dan keterangan secara manual.',
      });
    } finally {
      setIsFetchingPreview(false);
    }
  };

  // Handle Save Post to Firestore & Server API
  const handleSavePost = async (payload: {
    sourceUrl: string;
    title: string;
    description: string | null;
    thumbnailUrl: string | null;
    channelUsername: string;
    channelTitle: string;
    messageId: number;
    status: 'draft' | 'published';
  }) => {
    try {
      setIsSavingPost(true);
      const newPost: TelegramPost = {
        id: `post-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        sourceUrl: payload.sourceUrl,
        channelUsername: payload.channelUsername,
        channelTitle: payload.channelTitle || payload.channelUsername,
        messageId: payload.messageId,
        title: payload.title,
        description: payload.description,
        thumbnailUrl: payload.thumbnailUrl,
        publishedAtSource: new Date().toISOString(),
        metadataSource: 'mixed',
        status: payload.status,
        viewsCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: firebaseUser?.email || AUTHORIZED_ADMIN_EMAIL,
        updatedBy: firebaseUser?.email || AUTHORIZED_ADMIN_EMAIL,
      };

      // 1. Save directly to Firestore
      await savePostToFirestore(newPost);

      // 2. Also keep backend in sync
      try {
        await fetch('/api/v1/admin/posts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...payload, id: newPost.id }),
        });
      } catch (err) {
        // quiet fallback
      }

      // Update state with deduplication to prevent duplicate key warning
      setPosts((prev) => deduplicatePosts([newPost, ...prev]));

      addToast(
        'success',
        payload.status === 'published'
          ? 'Postingan berhasil dipublikasikan ke Firestore & Katalog!'
          : 'Postingan berhasil disimpan sebagai draf di Firestore.'
      );

      setPreviewResult(null);
      setRawUrlInput('');
      setAdminTab('posts');
    } catch (err) {
      console.error(err);
      addToast('error', 'Terjadi kesalahan sistem saat menyimpan postingan ke Firestore.');
    } finally {
      setIsSavingPost(false);
    }
  };

  // Toggle publish status in Firestore
  const handleTogglePublish = async (post: TelegramPost) => {
    const nextStatus: PostStatus = post.status === 'published' ? 'draft' : 'published';
    try {
      await updatePostInFirestore(post.id, { status: nextStatus });
      setPosts((prev) =>
        prev.map((p) => (p.id === post.id ? { ...p, status: nextStatus } : p))
      );
      addToast(
        'success',
        nextStatus === 'published'
          ? 'Postingan berhasil dipublikasikan di Firestore.'
          : 'Status diubah menjadi draf.'
      );
    } catch {
      addToast('error', 'Gagal memperbarui status publikasi di Firestore.');
    }
  };

  // Update existing post in Firestore
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPost) return;

    try {
      await updatePostInFirestore(editingPost.id, {
        title: editingPost.title,
        description: editingPost.description,
        thumbnailUrl: editingPost.thumbnailUrl,
        channelTitle: editingPost.channelTitle,
        status: editingPost.status,
      });

      setPosts((prev) =>
        prev.map((p) => (p.id === editingPost.id ? { ...p, ...editingPost } : p))
      );
      addToast('success', 'Perubahan postingan disimpan ke Firestore.');
      setEditingPost(null);
    } catch {
      addToast('error', 'Gagal menyimpan perubahan ke Firestore.');
    }
  };

  // Delete post from Firestore
  const handleConfirmDelete = async () => {
    if (!deleteCandidate) return;
    try {
      await deletePostFromFirestore(deleteCandidate.id);
      setPosts((prev) => prev.filter((p) => p.id !== deleteCandidate.id));
      addToast('success', 'Postingan dihapus dari Firestore.');
      setDeleteCandidate(null);
    } catch {
      addToast('error', 'Gagal menghapus postingan.');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F7F8FA]">
      <AppHeader
        isAdminLoggedIn={isAdminLoggedIn}
        isAdminView={isAdminView}
        adminEmail={firebaseUser?.email || (isAdminLoggedIn ? AUTHORIZED_ADMIN_EMAIL : null)}
        adminPhoto={firebaseUser?.photoURL}
        onToggleAdminView={(view) => {
          setIsAdminView(view);
          setCurrentPage(1);
        }}
        onOpenLoginModal={() => {
          setLoginError(null);
          setIsLoginOpen(true);
        }}
        onLogout={handleLogout}
        onNavigateToAddLink={() => {
          setIsAdminView(true);
          setAdminTab('add-link');
        }}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8">
        {!isAdminView ? (
          /* =========================================================================
             PUBLIC VISITOR EXPERIENCE
             ========================================================================= */
          <div className="space-y-8">
            {/* Hero / Intro */}
            <div className="border-b border-[#E5E8EC] pb-6">
              <div className="flex flex-wrap items-center gap-2 mb-2.5">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-50 text-[#2563EB] text-xs font-semibold">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Katalog Link Telegram Publik</span>
                </div>
                {isFirestoreConnected && (
                  <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-emerald-50 text-[#15803D] text-[11px] font-medium border border-emerald-200">
                    <Database className="w-3 h-3" />
                    <span>Firestore Real-time Terhubung</span>
                  </div>
                )}
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-[#17191C] tracking-tight">
                Koleksi Sinema & Video Pilihan
              </h1>
              <p className="text-sm text-[#68707A] mt-1.5 max-w-2xl leading-relaxed">
                Temukan trailer sinematik, arsip film, dan pembahasan video publik. Klik{' '}
                <strong className="text-[#17191C] font-semibold">Tonton Sekarang</strong> untuk
                membuka postingan asli secara langsung di Telegram.
              </p>
            </div>

            {/* Filter and Search Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="w-full sm:max-w-md">
                <Input
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  placeholder="Cari judul film, sutradara, atau saluran..."
                  leftElement={<Search className="w-4 h-4" />}
                />
              </div>

              {channels.length > 0 && (
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-[#68707A]" />
                  <select
                    value={selectedChannel}
                    onChange={(e) => {
                      setSelectedChannel(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="h-10 px-3 bg-white border border-[#E5E8EC] rounded-lg text-xs font-medium text-[#17191C] focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
                  >
                    <option value="">Semua Saluran ({channels.length})</option>
                    {channels.map((ch) => (
                      <option key={ch} value={ch}>
                        @{ch}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Post Cards Grid */}
            {paginatedPosts.length > 0 ? (
              <PostGrid
                posts={paginatedPosts}
                isLoading={isLoading}
                onOpenDetail={(post) => {
                  setSelectedPost(post);
                  setIsDetailOpen(true);
                }}
              />
            ) : !isLoading ? (
              <EmptyState
                type={searchQuery || selectedChannel ? 'no-results' : 'no-posts'}
                actionLabel={searchQuery || selectedChannel ? 'Bersihkan Pencarian' : undefined}
                onAction={() => {
                  setSearchQuery('');
                  setSelectedChannel('');
                }}
              />
            ) : (
              <PostGrid posts={[]} isLoading={true} onOpenDetail={() => {}} />
            )}

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 pt-6 border-t border-[#E5E8EC]">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage <= 1 || isLoading}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                >
                  Sebelumnya
                </Button>
                <span className="text-xs text-[#68707A] px-3 font-medium">
                  Halaman {currentPage} dari {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage >= totalPages || isLoading}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                >
                  Selanjutnya
                </Button>
              </div>
            )}
          </div>
        ) : (
          /* =========================================================================
             ADMIN EXPERIENCE (STRICTLY AUTHORIZED ONLY)
             ========================================================================= */
          <div className="flex flex-col md:flex-row gap-6">
            <AdminSidebar
              currentTab={adminTab}
              onSelectTab={setAdminTab}
              counts={{
                total: stats?.totalPosts || posts.length,
                drafts: stats?.draftPosts || posts.filter((p) => p.status === 'draft').length,
              }}
            />

            <div className="flex-1 space-y-6">
              {/* TAB 1: OVERVIEW */}
              {adminTab === 'overview' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between pb-4 border-b border-[#E5E8EC]">
                    <div>
                      <h2 className="text-xl font-bold text-[#17191C]">Ringkasan Katalog</h2>
                      <p className="text-xs text-[#68707A] mt-0.5">
                        Administrator aktif: <strong className="text-[#2563EB]">{firebaseUser?.email || AUTHORIZED_ADMIN_EMAIL}</strong>
                      </p>
                    </div>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => setAdminTab('add-link')}
                      leftIcon={<Plus className="w-3.5 h-3.5" />}
                    >
                      Tambah Link
                    </Button>
                  </div>

                  {/* Summary metric cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="bg-white p-4 rounded-xl border border-[#E5E8EC]">
                      <span className="text-xs text-[#68707A] font-medium">Total Postingan</span>
                      <p className="text-2xl font-bold text-[#17191C] mt-1">{stats?.totalPosts ?? posts.length}</p>
                    </div>
                    <div className="bg-white p-4 rounded-xl border border-[#E5E8EC]">
                      <span className="text-xs text-[#15803D] font-medium">Dipublikasikan</span>
                      <p className="text-2xl font-bold text-[#15803D] mt-1">
                        {stats?.publishedPosts ?? posts.filter((p) => p.status === 'published').length}
                      </p>
                    </div>
                    <div className="bg-white p-4 rounded-xl border border-[#E5E8EC]">
                      <span className="text-xs text-[#A16207] font-medium">Draf</span>
                      <p className="text-2xl font-bold text-[#A16207] mt-1">
                        {stats?.draftPosts ?? posts.filter((p) => p.status === 'draft').length}
                      </p>
                    </div>
                    <div className="bg-white p-4 rounded-xl border border-[#E5E8EC]">
                      <span className="text-xs text-[#68707A] font-medium">Saluran Aktif</span>
                      <p className="text-2xl font-bold text-[#17191C] mt-1">{stats?.uniqueChannels ?? channels.length}</p>
                    </div>
                  </div>

                  {/* Security & Firestore status box */}
                  <div className="p-4 bg-white rounded-xl border border-[#E5E8EC] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-emerald-50 text-[#15803D]">
                        <Database className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-xs font-semibold text-[#17191C]">Cloud Firestore Aman (Zero-Trust ABAC)</h4>
                        <p className="text-[11px] text-[#68707A]">
                          Izin mutasi dibatasi khusus untuk: <code className="text-[#2563EB] font-mono">{AUTHORIZED_ADMIN_EMAIL}</code>
                        </p>
                      </div>
                    </div>
                    <span className="text-[11px] bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-md font-semibold">
                      Keamanan Aktif
                    </span>
                  </div>

                  {/* Recent Posts List */}
                  <div className="bg-white rounded-xl border border-[#E5E8EC] overflow-hidden">
                    <div className="px-5 py-3.5 border-b border-[#E5E8EC] flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-[#17191C]">Postingan Terbaru</h3>
                      <button
                        onClick={() => setAdminTab('posts')}
                        className="text-xs text-[#2563EB] font-medium hover:underline cursor-pointer"
                      >
                        Lihat Semua ({uniquePosts.length})
                      </button>
                    </div>
                    <div className="divide-y divide-[#E5E8EC]">
                      {uniquePosts.slice(0, 4).map((post) => (
                        <div key={post.id} className="p-4 flex items-center justify-between gap-4">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-16 h-10 rounded overflow-hidden shrink-0 border border-[#E5E8EC]">
                              <Thumbnail src={post.thumbnailUrl} alt={post.title} aspectRatio="16:9" />
                            </div>
                            <div className="min-w-0">
                              <h4 className="text-xs font-semibold text-[#17191C] truncate">{post.title}</h4>
                              <p className="text-[11px] text-[#68707A] truncate">@{post.channelUsername}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <PostStatusBadge status={post.status} />
                            <a
                              href={post.sourceUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 text-[#68707A] hover:text-[#17191C] rounded"
                              title="Buka di Telegram"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: MANAGE POSTS */}
              {adminTab === 'posts' && (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-[#E5E8EC]">
                    <div>
                      <h2 className="text-xl font-bold text-[#17191C]">Kelola Postingan</h2>
                      <p className="text-xs text-[#68707A] mt-0.5">
                        Daftar lengkap konten di Firestore, pengaturan status, edit, dan penghapusan
                      </p>
                    </div>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => setAdminTab('add-link')}
                      leftIcon={<Plus className="w-3.5 h-3.5" />}
                    >
                      Tambah Link
                    </Button>
                  </div>

                  {/* Filter & Search Bar */}
                  <div className="flex flex-col sm:flex-row items-center gap-3">
                    <div className="flex-1 w-full">
                      <Input
                        value={adminSearch}
                        onChange={(e) => setAdminSearch(e.target.value)}
                        placeholder="Cari dalam postingan admin..."
                        leftElement={<Search className="w-4 h-4" />}
                      />
                    </div>
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <select
                        value={adminStatusFilter}
                        onChange={(e) => setAdminStatusFilter(e.target.value)}
                        className="h-10 px-3 bg-white border border-[#E5E8EC] rounded-lg text-xs font-medium text-[#17191C] focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
                      >
                        <option value="all">Semua Status</option>
                        <option value="published">Hanya Dipublikasikan</option>
                        <option value="draft">Hanya Draf</option>
                        <option value="archived">Diarsipkan</option>
                      </select>
                    </div>
                  </div>

                  {/* Posts Table */}
                  <div className="bg-white rounded-xl border border-[#E5E8EC] overflow-hidden">
                    {displayedPosts.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-[#F7F8FA] border-b border-[#E5E8EC] text-[#68707A] font-semibold uppercase tracking-wider text-[11px]">
                            <tr>
                              <th className="px-4 py-3">Thumbnail & Judul</th>
                              <th className="px-4 py-3">Saluran</th>
                              <th className="px-4 py-3">Status</th>
                              <th className="px-4 py-3">Sumber Metadata</th>
                              <th className="px-4 py-3 text-right">Aksi</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#E5E8EC]">
                            {displayedPosts.map((post) => (
                              <tr key={post.id} className="hover:bg-[#F7F8FA]/60 transition-colors">
                                <td className="px-4 py-3 max-w-xs">
                                  <div className="flex items-center gap-3">
                                    <div className="w-16 h-10 rounded overflow-hidden shrink-0 border border-[#E5E8EC]">
                                      <Thumbnail src={post.thumbnailUrl} alt={post.title} aspectRatio="16:9" />
                                    </div>
                                    <div className="min-w-0">
                                      <p className="font-semibold text-[#17191C] line-clamp-1" title={post.title}>
                                        {post.title}
                                      </p>
                                      <p className="text-[11px] text-[#68707A] line-clamp-1 mt-0.5">
                                        {post.description || 'Tidak ada deskripsi'}
                                      </p>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap">
                                  <span className="font-medium text-[#17191C]">@{post.channelUsername}</span>
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap">
                                  <PostStatusBadge status={post.status} />
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap">
                                  <span className="text-[11px] text-[#68707A] bg-[#F1F3F5] px-2 py-0.5 rounded">
                                    {post.metadataSource}
                                  </span>
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-right">
                                  <div className="flex items-center justify-end gap-1">
                                    {/* Toggle Publish */}
                                    <button
                                      type="button"
                                      onClick={() => handleTogglePublish(post)}
                                      className={`p-1.5 rounded transition-colors cursor-pointer ${
                                        post.status === 'published'
                                          ? 'text-[#A16207] hover:bg-amber-50'
                                          : 'text-[#15803D] hover:bg-emerald-50'
                                      }`}
                                      title={post.status === 'published' ? 'Ubah ke Draf' : 'Publikasikan'}
                                    >
                                      {post.status === 'published' ? (
                                        <EyeOff className="w-3.5 h-3.5" />
                                      ) : (
                                        <CheckCircle className="w-3.5 h-3.5" />
                                      )}
                                    </button>

                                    {/* Edit */}
                                    <button
                                      type="button"
                                      onClick={() => setEditingPost(post)}
                                      className="p-1.5 text-[#68707A] hover:text-[#17191C] hover:bg-[#F1F3F5] rounded transition-colors cursor-pointer"
                                      title="Ubah Postingan"
                                    >
                                      <Edit3 className="w-3.5 h-3.5" />
                                    </button>

                                    {/* Open Telegram */}
                                    <a
                                      href={post.sourceUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="p-1.5 text-[#68707A] hover:text-[#2563EB] hover:bg-blue-50 rounded transition-colors"
                                      title="Buka di Telegram Asli"
                                    >
                                      <ExternalLink className="w-3.5 h-3.5" />
                                    </a>

                                    {/* Delete */}
                                    <button
                                      type="button"
                                      onClick={() => setDeleteCandidate(post)}
                                      className="p-1.5 text-[#DC2626] hover:bg-red-50 rounded transition-colors cursor-pointer"
                                      title="Hapus Postingan"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="p-8 text-center text-[#68707A]">
                        Tidak ada postingan yang sesuai dengan filter.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 3: ADD TELEGRAM LINK */}
              {adminTab === 'add-link' && (
                <div className="space-y-6">
                  <div className="pb-4 border-b border-[#E5E8EC]">
                    <h2 className="text-xl font-bold text-[#17191C]">Tambah Tautan Telegram Baru</h2>
                    <p className="text-xs text-[#68707A] mt-0.5">
                      Gunakan tautan dari postingan channel Telegram publik untuk mengekstrak pratinjau dan simpan ke Firestore.
                    </p>
                  </div>

                  {/* Step 1: Input URL Form */}
                  {!previewResult ? (
                    <div className="bg-white rounded-xl border border-[#E5E8EC] p-6 space-y-5 max-w-2xl">
                      <div className="space-y-1">
                        <h3 className="text-sm font-semibold text-[#17191C]">
                          Langkah 1: Masukkan URL Postingan
                        </h3>
                        <p className="text-xs text-[#68707A]">
                          Format yang didukung: <code className="bg-[#F1F3F5] px-1.5 py-0.5 rounded font-mono">https://t.me/&lt;nama_channel&gt;/&lt;id_pesan&gt;</code>
                        </p>
                      </div>

                      <Field
                        label="URL Postingan Telegram Publik"
                        required
                        error={urlError || undefined}
                        helperText="Hanya channel publik yang didukung. Tautan privat invite t.me/+ atau joinchat tidak dapat diakses."
                      >
                        <div className="flex flex-col sm:flex-row gap-2">
                          <Input
                            value={rawUrlInput}
                            onChange={(e) => {
                              setRawUrlInput(e.target.value);
                              if (urlError) setUrlError(null);
                            }}
                            placeholder="https://t.me/filmmakers_vault/1042"
                            className="font-mono text-xs"
                          />
                          <Button
                            variant="primary"
                            size="md"
                            onClick={() => handleFetchPreview()}
                            isLoading={isFetchingPreview}
                            className="shrink-0"
                          >
                            Ambil Preview
                          </Button>
                        </div>
                      </Field>

                      {/* Quick Sample Links */}
                      <div className="pt-3 border-t border-[#E5E8EC] space-y-2">
                        <span className="text-[11px] font-semibold text-[#68707A] uppercase tracking-wider">
                          Contoh Tautan Siap Uji:
                        </span>
                        <div className="flex flex-wrap gap-2">
                          {[
                            { label: 'Dune Part Two Trailer', url: 'https://t.me/filmmakers_vault/1042' },
                            { label: 'Oppenheimer IMAX Reel', url: 'https://t.me/cinema_archives/518' },
                            { label: 'Studio Ghibli Archive', url: 'https://t.me/ghibli_aesthetic/305' },
                          ].map((ex) => (
                            <button
                              key={ex.url}
                              type="button"
                              onClick={() => {
                                setRawUrlInput(ex.url);
                                handleFetchPreview(ex.url);
                              }}
                              className="text-xs px-2.5 py-1 rounded bg-[#F1F3F5] hover:bg-[#E5E8EC] text-[#17191C] transition-colors cursor-pointer"
                            >
                              + {ex.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* Step 2 & 3: Metadata Preview & Editable Fields */
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-semibold text-[#17191C]">
                          Langkah 2: Tinjau dan Sesuaikan Metadata
                        </h3>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setPreviewResult(null)}
                        >
                          Ganti URL
                        </Button>
                      </div>

                      <MetadataPreview
                        preview={previewResult}
                        onSave={handleSavePost}
                        onCancel={() => {
                          setPreviewResult(null);
                          setRawUrlInput('');
                        }}
                        isSaving={isSavingPost}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-[#E5E8EC] bg-white py-6 mt-12 text-center text-xs text-[#68707A]">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>
            Filmove © {new Date().getFullYear()} — Katalog link Telegram publik dengan Cloud Firestore.
          </p>
          <div className="flex items-center gap-4">
            <span className="text-[#17191C] font-medium">Content-First Architecture</span>
            <span>•</span>
            <button
              onClick={() => {
                if (isAdminLoggedIn) {
                  setIsAdminView(!isAdminView);
                } else {
                  setLoginError(null);
                  setIsLoginOpen(true);
                }
              }}
              className="text-[#2563EB] hover:underline cursor-pointer"
            >
              {isAdminLoggedIn ? (isAdminView ? 'Mode Pengunjung' : 'Mode Admin') : 'Masuk Admin'}
            </button>
          </div>
        </div>
      </footer>

      {/* Post Detail Modal */}
      <PostDetailModal
        post={selectedPost}
        isOpen={isDetailOpen}
        onClose={() => {
          setIsDetailOpen(false);
          setSelectedPost(null);
        }}
        isAdmin={isAdminLoggedIn}
      />

      {/* Mandatory Google Admin Sign-In Modal */}
      <Dialog
        isOpen={isLoginOpen}
        onClose={() => {
          setIsLoginOpen(false);
          setLoginError(null);
        }}
        title="Masuk ke Panel Admin"
        description="Akses khusus administrator terdaftar menggunakan akun Google Firebase."
        maxWidth="sm"
      >
        <div className="space-y-4">
          <div className="p-3.5 bg-blue-50/70 border border-blue-100 rounded-xl text-xs space-y-1.5">
            <div className="flex items-center gap-1.5 font-semibold text-[#2563EB]">
              <Lock className="w-3.5 h-3.5" />
              <span>Otorisasi Khusus Administrator</span>
            </div>
            <p className="text-[#17191C] leading-relaxed">
              Login wajib menggunakan akun Google. Hanya email terdaftar berikut yang diizinkan mengelola postingan:
            </p>
            <p className="font-mono text-xs font-semibold text-[#2563EB] bg-white px-2 py-1 rounded border border-blue-200 inline-block">
              {AUTHORIZED_ADMIN_EMAIL}
            </p>
          </div>

          {loginError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-[#DC2626] flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <p className="leading-relaxed">{loginError}</p>
            </div>
          )}

          {/* Exclusive Google Sign In Button */}
          <Button
            type="button"
            variant="primary"
            size="lg"
            onClick={handleGoogleLogin}
            isLoading={isGoogleLoading}
            className="w-full flex items-center justify-center gap-2.5 shadow-sm"
          >
            <svg className="w-4 h-4 bg-white rounded-full p-0.5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Masuk dengan Google</span>
          </Button>

          <div className="pt-2 border-t border-[#E5E8EC] flex justify-end">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsLoginOpen(false)}
            >
              Tutup
            </Button>
          </div>
        </div>
      </Dialog>

      {/* Edit Post Modal */}
      {editingPost && (
        <Dialog
          isOpen={true}
          onClose={() => setEditingPost(null)}
          title="Ubah Postingan"
          maxWidth="lg"
        >
          <form onSubmit={handleSaveEdit} className="space-y-4">
            <Field label="Judul Postingan" required>
              <Input
                value={editingPost.title}
                onChange={(e) => setEditingPost({ ...editingPost, title: e.target.value })}
              />
            </Field>

            <Field label="Keterangan / Sinopsis">
              <Textarea
                rows={3}
                value={editingPost.description || ''}
                onChange={(e) => setEditingPost({ ...editingPost, description: e.target.value })}
              />
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Nama Saluran">
                <Input
                  value={editingPost.channelTitle || ''}
                  onChange={(e) => setEditingPost({ ...editingPost, channelTitle: e.target.value })}
                />
              </Field>

              <Field label="Status Publikasi">
                <select
                  value={editingPost.status}
                  onChange={(e) => setEditingPost({ ...editingPost, status: e.target.value as PostStatus })}
                  className="h-10 px-3 bg-white border border-[#E5E8EC] rounded-lg text-xs font-medium text-[#17191C] focus:outline-none focus:ring-1 focus:ring-[#2563EB] w-full"
                >
                  <option value="published">Dipublikasikan</option>
                  <option value="draft">Draf</option>
                  <option value="archived">Diarsipkan</option>
                </select>
              </Field>
            </div>

            <Field label="URL Thumbnail">
              <Input
                value={editingPost.thumbnailUrl || ''}
                onChange={(e) => setEditingPost({ ...editingPost, thumbnailUrl: e.target.value })}
                placeholder="https://images.unsplash.com/..."
              />
            </Field>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E5E8EC]">
              <Button type="button" variant="outline" size="sm" onClick={() => setEditingPost(null)}>
                Batal
              </Button>
              <Button type="submit" variant="primary" size="sm">
                Simpan Perubahan
              </Button>
            </div>
          </form>
        </Dialog>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(deleteCandidate)}
        onClose={() => setDeleteCandidate(null)}
        onConfirm={handleConfirmDelete}
        title="Hapus Postingan dari Firestore"
        message={`Apakah Anda yakin ingin menghapus postingan "${deleteCandidate?.title}"? Data akan dihapus secara permanen dari database.`}
        confirmLabel="Ya, Hapus"
        cancelLabel="Batal"
        isDestructive={true}
      />

      {/* Floating Toast Notification Container */}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </div>
  );
}
