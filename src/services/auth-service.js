// src/services/auth-service.js
// Hexagonal Architecture: This is the Auth Port (interface)
// The adapter is Firebase Auth implementation

import { auth } from '../config/firebase.js';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from 'firebase/auth';

/**
 * Authenticates a user with email and password.
 * @param {string} email - User's email
 * @param {string} password - User's password
 * @returns {Promise<UserCredential>} Firebase user credential
 */
export async function login(email, password) {
  if (!email || !password) {
    throw new Error('Email and password are required');
  }

  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential;
  } catch (error) {
    console.error('Login error:', error);

    if (error.code === 'auth/user-not-found') {
      throw new Error('No account found with this email address. Please check your email or sign up.');
    } else if (error.code === 'auth/wrong-password') {
      throw new Error('Incorrect password. Please try again.');
    } else if (error.code === 'auth/invalid-email') {
      throw new Error('Invalid email address format.');
    } else if (error.code === 'auth/user-disabled') {
      throw new Error('This account has been disabled. Please contact support.');
    } else if (error.code === 'auth/too-many-requests') {
      throw new Error('Too many failed login attempts. Please try again later.');
    } else if (error.code === 'auth/network-request-failed') {
      throw new Error('Network error. Please check your connection and try again.');
    } else {
      throw new Error(`Login failed: ${error.message}`);
    }
  }
}

/**
 * Registers a new user with email and password.
 * @param {string} email - User's email
 * @param {string} password - User's password
 * @returns {Promise<UserCredential>} Firebase user credential
 */
export async function register(email, password) {
  if (!email || !password) {
    throw new Error('Email and password are required');
  }

  if (password.length < 6) {
    throw new Error('Password must be at least 6 characters long');
  }

  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    return userCredential;
  } catch (error) {
    console.error('Registration error:', error);

    if (error.code === 'auth/email-already-in-use') {
      throw new Error('An account with this email already exists. Please try logging in instead.');
    } else if (error.code === 'auth/invalid-email') {
      throw new Error('Invalid email address format.');
    } else if (error.code === 'auth/weak-password') {
      throw new Error('Password is too weak. Please choose a stronger password.');
    } else if (error.code === 'auth/network-request-failed') {
      throw new Error('Network error. Please check your connection and try again.');
    } else {
      throw new Error(`Registration failed: ${error.message}`);
    }
  }
}

/**
 * Signs out the current user.
 * @returns {Promise<void>}
 */
export async function logout() {
  try {
    await signOut(auth);
  } catch (error) {
    console.error('Logout error:', error);

    if (error.code === 'auth/network-request-failed') {
      throw new Error('Network error during logout. You may still be logged in.');
    } else {
      throw new Error(`Logout failed: ${error.message}`);
    }
  }
}

/**
 * Listens for authentication state changes.
 * @param {function} callback - Callback function that receives the user object or null
 * @returns {function} Unsubscribe function
 */
export function onAuthStateChange(callback) {
  return onAuthStateChanged(auth, callback);
}

/**
 * Gets the current authenticated user.
 * @returns {User|null} Current user or null if not authenticated
 */
export function getCurrentUser() {
  return auth.currentUser;
}