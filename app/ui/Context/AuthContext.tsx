'use client'

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import {
    User,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    sendPasswordResetEmail,
    UserCredential
} from 'firebase/auth';
import { auth, db } from '../../Services/firebase/config';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { getUserProfile } from '../../Services/firebase/firestore';

interface AuthContextType {
    currentUser: User | null;
    loading: boolean;
    profileComplete: boolean;
    profileLoading: boolean;
    register: (email: string, password: string) => Promise<void>;
    login: (email: string, password: string) => Promise<UserCredential>;
    logout: () => Promise<void>;
    resetPassword: (email: string) => Promise<void>;
    refreshProfileStatus: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [profileComplete, setProfileComplete] = useState(false);
    const [profileLoading, setProfileLoading] = useState(true);

    const checkingProfileRef = useRef(false);

    const checkProfileCompletion = useCallback(async (user: User | null) => {
        if (!user || checkingProfileRef.current) {
            if (!user) {
                setProfileComplete(false);
                setProfileLoading(false);
            }
            return;
        }

        try {
            checkingProfileRef.current = true;
            setProfileLoading(true);

            console.log('Checking profile completion for:', user.uid);

            const profile = await getUserProfile(user.uid);
            const isComplete = !!profile && !!profile.name && !!profile.email;

            console.log('Profile check result:', {
                profileExists: !!profile,
                hasName: !!profile?.name,
                hasEmail: !!profile?.email,
                isComplete
            });

            setProfileComplete(isComplete);
        } catch (error) {
            console.error('Error checking profile completion:', error);
            setProfileComplete(false);
        } finally {
            setProfileLoading(false);
            checkingProfileRef.current = false;
        }
    }, []);

    // Refresh profile status (for use after profile creation/update)
    const refreshProfileStatus = useCallback(async () => {
        if (currentUser) {
            console.log('Manually refreshing profile status');
            await checkProfileCompletion(currentUser);
        }
    }, [currentUser, checkProfileCompletion]);

    // Auth state listener
    useEffect(() => {
        console.log('Setting up auth state listener');

        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            console.log('Auth state changed:', !!user);

            setCurrentUser(user);
            setLoading(false);

            if (user) {
                // Check profile completion for authenticated users
                await checkProfileCompletion(user);
            } else {
                // Clear profile state for unauthenticated users
                setProfileComplete(false);
                setProfileLoading(false);
            }
        });

        return () => {
            console.log('Cleaning up auth state listener');
            unsubscribe();
        };
    }, [checkProfileCompletion]);

    const register = async (email: string, password: string) => {
        console.log('Registering new user');

        const userCredential = await createUserWithEmailAndPassword(auth, email, password);

        // Create initial user document in Firestore
        await setDoc(doc(db, 'users', userCredential.user.uid), {
            email,
            createdAt: serverTimestamp(),
            isProfileComplete: false
        });

        // Profile is not complete for new users
        setProfileComplete(false);
    };

    const login = (email: string, password: string) => {
        console.log('Logging in user');
        return signInWithEmailAndPassword(auth, email, password);
    };

    const logout = async () => {
        console.log('Logging out user');

        // Clear state immediately
        setProfileComplete(false);
        setProfileLoading(false);

        return signOut(auth);
    };

    const resetPassword = (email: string) => {
        console.log('Resetting password for:', email);
        return sendPasswordResetEmail(auth, email);
    };

    const value = {
        currentUser,
        loading,
        profileComplete,
        profileLoading,
        register,
        login,
        logout,
        resetPassword,
        refreshProfileStatus
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};