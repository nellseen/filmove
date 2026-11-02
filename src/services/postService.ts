import { 
  collection, 
  doc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot,
  query,
  where,
  orderBy
} from 'firebase/firestore';
import { 
  signInWithPopup, 
  signOut as firebaseSignOut, 
  onAuthStateChanged, 
  User 
} from 'firebase/auth';
import { db, auth, googleProvider } from '../lib/firebase';
import { handleFirestoreError, OperationType } from '../lib/firestoreErrors';
import type { TelegramPost } from '../types/post';

const POSTS_PATH = 'posts';

// Initial seed posts to populate Firestore on fresh initialization
export const initialSeedPosts: TelegramPost[] = [
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
  }
];

// Seed initial posts to Firestore if empty
export async function seedFirestoreIfEmpty() {
  try {
    const postsCol = collection(db, POSTS_PATH);
    const snap = await getDocs(postsCol);
    if (snap.empty) {
      console.log('[Firestore] Seeding initial posts to database...');
      for (const item of initialSeedPosts) {
        await setDoc(doc(db, POSTS_PATH, item.id), item);
      }
      console.log('[Firestore] Seeding complete.');
    }
  } catch (error) {
    console.warn('[Firestore] Note on seeding:', error);
  }
}

// Subscribe to real-time posts
export function subscribeToPosts(
  onData: (posts: TelegramPost[]) => void,
  isAdmin: boolean = false
) {
  try {
    const postsCol = collection(db, POSTS_PATH);
    const q = isAdmin
      ? postsCol
      : query(postsCol, where('status', '==', 'published'));

    return onSnapshot(
      q,
      (snapshot) => {
        const items: TelegramPost[] = [];
        snapshot.forEach((docSnap) => {
          items.push(docSnap.data() as TelegramPost);
        });
        // Sort descending by updatedAt
        items.sort(
          (a, b) =>
            new Date(b.updatedAt || b.createdAt).getTime() -
            new Date(a.updatedAt || a.createdAt).getTime()
        );
        onData(items);
      },
      (error) => {
        console.warn('[Firestore] onSnapshot error:', error);
        handleFirestoreError(error, OperationType.LIST, POSTS_PATH);
      }
    );
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, POSTS_PATH);
  }
}

// Create or update post in Firestore
export async function savePostToFirestore(post: TelegramPost): Promise<void> {
  try {
    const docRef = doc(db, POSTS_PATH, post.id);
    await setDoc(docRef, post);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${POSTS_PATH}/${post.id}`);
  }
}

// Update partial fields
export async function updatePostInFirestore(
  postId: string,
  partial: Partial<TelegramPost>
): Promise<void> {
  try {
    const docRef = doc(db, POSTS_PATH, postId);
    await updateDoc(docRef, {
      ...partial,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${POSTS_PATH}/${postId}`);
  }
}

// Delete post from Firestore
export async function deletePostFromFirestore(postId: string): Promise<void> {
  try {
    const docRef = doc(db, POSTS_PATH, postId);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${POSTS_PATH}/${postId}`);
  }
}

// Authentication helpers
export async function signInWithGoogle(): Promise<User> {
  const result = await signInWithPopup(auth, googleProvider);
  return result.user;
}

export async function signOutAdmin(): Promise<void> {
  await firebaseSignOut(auth);
}

export function subscribeToAuthState(onUserChanged: (user: User | null) => void) {
  return onAuthStateChanged(auth, onUserChanged);
}
