import { 
  collection, 
  doc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot,
  query,
  where,
  writeBatch,
  runTransaction,
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

export class DuplicatePostError extends Error {
  constructor() {
    super('Postingan dengan tautan ini sudah ada.');
    this.name = 'DuplicatePostError';
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
    await runTransaction(db, async (transaction) => {
      const existing = await transaction.get(docRef);
      if (existing.exists()) throw new DuplicatePostError();
      transaction.set(docRef, post);
    });
  } catch (error) {
    if (error instanceof DuplicatePostError) throw error;
    handleFirestoreError(error, OperationType.WRITE, `${POSTS_PATH}/${post.id}`);
  }
}

export async function deletePostsFromFirestore(postIds: string[]): Promise<void> {
  try {
    for (let offset = 0; offset < postIds.length; offset += 500) {
      const batch = writeBatch(db);
      postIds.slice(offset, offset + 500).forEach((id) => batch.delete(doc(db, POSTS_PATH, id)));
      await batch.commit();
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, POSTS_PATH);
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
