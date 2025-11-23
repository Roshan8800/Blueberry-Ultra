// src/services/data-service.js
// Hexagonal Architecture: This is the Data Port (interface)
// The adapter is Firestore implementation

import { db } from '../config/firebase.js';
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  collection,
  query,
  where,
  getDocs,
  orderBy,
  limit
} from 'firebase/firestore';

/**
 * Adds a video to user's favorites.
 * @param {string} userId - User ID
 * @param {string} videoId - Video ID
 * @returns {Promise<void>}
 */
export async function addToFavorites(userId, videoId) {
  if (!userId || !videoId) {
    throw new Error('User ID and Video ID are required');
  }

  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      favorites: arrayUnion(videoId)
    });
  } catch (error) {
    console.error('Error adding to favorites:', error);

    if (error.code === 'permission-denied') {
      throw new Error('You do not have permission to modify favorites. Please log in again.');
    } else if (error.code === 'not-found') {
      throw new Error('User profile not found. Please try logging in again.');
    } else if (error.code === 'unavailable') {
      throw new Error('Service temporarily unavailable. Please check your connection and try again.');
    } else {
      throw new Error(`Failed to add video to favorites: ${error.message}`);
    }
  }
}

/**
 * Removes a video from user's favorites.
 * @param {string} userId - User ID
 * @param {string} videoId - Video ID
 * @returns {Promise<void>}
 */
export async function removeFromFavorites(userId, videoId) {
  if (!userId || !videoId) {
    throw new Error('User ID and Video ID are required');
  }

  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      favorites: arrayRemove(videoId)
    });
  } catch (error) {
    console.error('Error removing from favorites:', error);

    if (error.code === 'permission-denied') {
      throw new Error('You do not have permission to modify favorites. Please log in again.');
    } else if (error.code === 'not-found') {
      throw new Error('User profile not found. Please try logging in again.');
    } else if (error.code === 'unavailable') {
      throw new Error('Service temporarily unavailable. Please check your connection and try again.');
    } else {
      throw new Error(`Failed to remove video from favorites: ${error.message}`);
    }
  }
}

/**
 * Gets user's favorites.
 * @param {string} userId - User ID
 * @returns {Promise<Array>} Array of video IDs
 */
export async function getFavorites(userId) {
  if (!userId) {
    throw new Error('User ID is required');
  }

  try {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
      return userSnap.data().favorites || [];
    }
    return [];
  } catch (error) {
    console.error('Error getting favorites:', error);

    if (error.code === 'permission-denied') {
      throw new Error('You do not have permission to access favorites. Please log in again.');
    } else if (error.code === 'unavailable') {
      throw new Error('Service temporarily unavailable. Please check your connection and try again.');
    } else {
      throw new Error(`Failed to get favorites: ${error.message}`);
    }
  }
}

/**
 * Adds a video to user's watch history.
 * @param {string} userId - User ID
 * @param {string} videoId - Video ID
 * @param {Date} timestamp - Watch timestamp
 * @returns {Promise<void>}
 */
export async function addToWatchHistory(userId, videoId, timestamp = new Date()) {
  if (!userId || !videoId) {
    throw new Error('User ID and Video ID are required');
  }

  try {
    const historyRef = doc(collection(db, 'users', userId, 'watchHistory'), videoId);
    await setDoc(historyRef, {
      videoId,
      timestamp: timestamp.toISOString(),
      watchedAt: new Date()
    });
  } catch (error) {
    console.error('Error adding to watch history:', error);

    if (error.code === 'permission-denied') {
      throw new Error('You do not have permission to modify watch history. Please log 