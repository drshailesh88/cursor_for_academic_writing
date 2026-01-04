// Firestore operations for comments and suggestions
'use client';

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  onSnapshot,
  Unsubscribe,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { COLLECTIONS } from '@/lib/firebase/schema';
import type { Comment, CommentReply, CreateCommentData, UpdateCommentData } from './types';

// Add a comment to a document
export async function addComment(
  data: CreateCommentData
): Promise<string> {
  try {
    const commentRef = doc(
      collection(db, COLLECTIONS.DOCUMENTS, data.documentId, 'comments')
    );

    const now = Date.now();
    const comment: Omit<Comment, 'id'> = {
      documentId: data.documentId,
      userId: data.userId,
      userName: data.userName,
      userAvatar: data.userAvatar,
      selectionStart: data.selectionStart,
      selectionEnd: data.selectionEnd,
      selectedText: data.selectedText,
      content: data.content,
      type: data.type,
      suggestedText: data.suggestedText,
      resolved: false,
      createdAt: now,
      updatedAt: now,
      replies: [],
    };

    await setDoc(commentRef, comment);
    return commentRef.id;
  } catch (error) {
    console.error('Error adding comment:', error);
    throw error;
  }
}

// Get all comments for a document
export async function getComments(documentId: string): Promise<Comment[]> {
  try {
    const commentsRef = collection(db, COLLECTIONS.DOCUMENTS, documentId, 'comments');
    const q = query(commentsRef, orderBy('createdAt', 'asc'));
    const querySnapshot = await getDocs(q);

    const comments: Comment[] = [];
    querySnapshot.forEach((doc) => {
      comments.push({
        id: doc.id,
        ...doc.data(),
      } as Comment);
    });

    return comments;
  } catch (error) {
    console.error('Error getting comments:', error);
    return [];
  }
}

// Update a comment
export async function updateComment(
  documentId: string,
  commentId: string,
  updates: UpdateCommentData
): Promise<void> {
  try {
    const commentRef = doc(db, COLLECTIONS.DOCUMENTS, documentId, 'comments', commentId);
    await updateDoc(commentRef, {
      ...updates,
      updatedAt: Date.now(),
    });
  } catch (error) {
    console.error('Error updating comment:', error);
    throw error;
  }
}

// Delete a comment
export async function deleteComment(
  documentId: string,
  commentId: string
): Promise<void> {
  try {
    const commentRef = doc(db, COLLECTIONS.DOCUMENTS, documentId, 'comments', commentId);
    await deleteDoc(commentRef);
  } catch (error) {
    console.error('Error deleting comment:', error);
    throw error;
  }
}

// Resolve a comment
export async function resolveComment(
  documentId: string,
  commentId: string
): Promise<void> {
  try {
    await updateComment(documentId, commentId, { resolved: true });
  } catch (error) {
    console.error('Error resolving comment:', error);
    throw error;
  }
}

// Add a reply to a comment
export async function addReply(
  documentId: string,
  commentId: string,
  reply: Omit<CommentReply, 'id' | 'createdAt'>
): Promise<void> {
  try {
    const commentRef = doc(db, COLLECTIONS.DOCUMENTS, documentId, 'comments', commentId);
    const commentSnap = await getDoc(commentRef);

    if (!commentSnap.exists) {
      throw new Error('Comment not found');
    }

    const comment = commentSnap.data() as Comment;
    const newReply: CommentReply = {
      id: `reply_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...reply,
      createdAt: Date.now(),
    };

    await updateDoc(commentRef, {
      replies: [...(comment.replies || []), newReply],
      updatedAt: Date.now(),
    });
  } catch (error) {
    console.error('Error adding reply:', error);
    throw error;
  }
}

// Subscribe to real-time comment updates
export function subscribeToComments(
  documentId: string,
  callback: (comments: Comment[]) => void
): Unsubscribe {
  const commentsRef = collection(db, COLLECTIONS.DOCUMENTS, documentId, 'comments');
  const q = query(commentsRef, orderBy('createdAt', 'asc'));

  return onSnapshot(q, (snapshot) => {
    const comments: Comment[] = [];
    snapshot.forEach((doc) => {
      comments.push({
        id: doc.id,
        ...doc.data(),
      } as Comment);
    });
    callback(comments);
  }, (error) => {
    console.error('Error subscribing to comments:', error);
  });
}
