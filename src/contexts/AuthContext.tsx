'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@/types';
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile,
  User as FirebaseUser
} from 'firebase/auth';
import { auth, googleProvider } from '@/lib/firebase';
import { mockUsers } from '@/data/mockData';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signUp: (email: string, password: string, displayName: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Convert Firebase User to our User type
  const convertFirebaseUser = (firebaseUser: FirebaseUser): User => {
    // Check if user is in mockUsers (admin check)
    const existingUser = mockUsers.find(u => u.email === firebaseUser.email);
    
    return {
      id: firebaseUser.uid,
      email: firebaseUser.email || '',
      displayName: firebaseUser.displayName || 'User',
      role: existingUser?.role || 'user', // Default to 'user', unless found in mockUsers
      avatar: firebaseUser.photoURL || undefined,
      createdAt: new Date(firebaseUser.metadata.creationTime || Date.now()),
    };
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        const convertedUser = convertFirebaseUser(firebaseUser);
        setUser(convertedUser);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      const convertedUser = convertFirebaseUser(result.user);
      setUser(convertedUser);
    } catch (error: any) {
      console.error('Sign in error:', error);
      throw new Error(error.message || 'Failed to sign in');
    } finally {
      setLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const convertedUser = convertFirebaseUser(result.user);
      setUser(convertedUser);
    } catch (error: any) {
      console.error('Google sign in error:', error);
      throw new Error(error.message || 'Failed to sign in with Google');
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, displayName: string) => {
    setLoading(true);
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      
      // Update profile with display name
      await updateProfile(result.user, {
        displayName: displayName
      });

      const convertedUser = convertFirebaseUser({
        ...result.user,
        displayName
      } as FirebaseUser);
      
      setUser(convertedUser);
    } catch (error: any) {
      console.error('Sign up error:', error);
      throw new Error(error.message || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      setUser(null);
    } catch (error: any) {
      console.error('Sign out error:', error);
      throw new Error(error.message || 'Failed to sign out');
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      signIn, 
      signInWithGoogle,
      signUp, 
      signOut 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 