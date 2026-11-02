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

// Delete all initial dummy posts from Firestore if any exist
export async function purgeAllDummyPosts(): Promise<void> {
  const dummyIds = ['post-1', 'post-2', 'post-3', 'post-4', 'post-5', 'post-6'];
  for (const id of dummyIds) {
    try {
      const docRef = doc(db, POSTS_PATH, id);
      await deleteDoc(docRef);
    } catch {
      // quiet if already deleted or doesn't exist
    }
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
