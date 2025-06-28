'use client'

import React from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../Context/AuthContext';
import { useEffect } from 'react';
import { LoadingPage } from './Loading';

interface PrivateRouteProps {
    children: React.ReactNode;
}

export default function PrivateRoute({ children }: PrivateRouteProps) {
    const { currentUser, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && !currentUser) {
            router.push('/login');
        }
    }, [currentUser, loading, router]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-700">
                <LoadingPage text="Authenticating..." />
            </div>
        );
    }


    return currentUser ? <>{children}</> : null;
}