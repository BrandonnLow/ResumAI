'use client'

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
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

    const checkProfileCompletion = useCallback(async (user: User | null) => {
        if (!user) {
            setProfileComplete(false);
            return;
        }

        try {
            const profile = await getUserProfile(user.uid);
            setProfileComplete(!!profile && !!profile.name && !!profile.email);
        } catch (error) {
            console.error('Error checking profile completion:', error);
            setProfileComplete(false);
        }
    }, []);

    const refreshProfileStatus = useCallback(async () => {
        if (currentUser) {
            await checkProfileCompletion(currentUser);
        }
    }, [currentUser, checkProfileCompletion]);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            setCurrentUser(user);
            setLoading(false);

            if (user) {
                await checkProfileCompletion(user);
            } else {
                setProfileComplete(false);
            }
        });

        return unsubscribe;
    }, [checkProfileCompletion]);

    const register = async (email: string, password: string) => {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);

        // Create initial user document
        await setDoc(doc(db, 'users', userCredential.user.uid), {
            email,
            createdAt: serverTimestamp(),
            isProfileComplete: false
        });

        setProfileComplete(false);
    };

    const login = (email: string, password: string) => {
        return signInWithEmailAndPassword(auth, email, password);
    };

    const logout = async () => {
        setProfileComplete(false);
        return signOut(auth);
    };

    const resetPassword = (email: string) => {
        return sendPasswordResetEmail(auth, email);
    };

    const value = {
        currentUser,
        loading,
        profileComplete,
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