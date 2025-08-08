'use client'

import { useState, useEffect, useRef, useCallback } from 'react';
import { getUserProfile, getAnswers, getJobs } from '../../Services/firebase/firestore';
import { UserProfile, Answer, Job } from '../../types';
import toast from 'react-hot-toast';

export function useDashboardData(currentUser: any, profileComplete: boolean) {
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [profileError, setProfileError] = useState<string | null>(null);
    const [allAnswers, setAllAnswers] = useState<Answer[]>([]);
    const [recentAnswers, setRecentAnswers] = useState<Answer[]>([]);
    const [jobs, setJobs] = useState<Job[]>([]);
    const [loading, setLoading] = useState(true);
    const [showWelcome, setShowWelcome] = useState(false);

    const isFetching = useRef(false);
    const mounted = useRef(true);

    useEffect(() => {
        return () => {
            mounted.current = false;
        };
    }, []);

    const fetchDashboardData = useCallback(async () => {
        if (!currentUser || isFetching.current) return;

        try {
            isFetching.current = true;
            setLoading(true);
            setProfileError(null);

            const [userProfile, userAnswers, userJobs] = await Promise.all([
                getUserProfile(currentUser.uid),
                getAnswers(currentUser.uid),
                getJobs(currentUser.uid)
            ]);

            if (!userProfile) {
                setProfileError('Profile not found');
            } else {
                setProfile(userProfile);
                if (!userProfile.name?.trim()) {
                    setProfileError('Profile name is missing');
                }
            }

            setAllAnswers(userAnswers);
            setRecentAnswers(userAnswers.slice(0, 5));
            setJobs(userJobs);

            const welcomeKey = `welcome_shown_${currentUser.uid}`;
            if (profileComplete && !localStorage.getItem(welcomeKey) && userProfile) {
                setShowWelcome(true);
                localStorage.setItem(welcomeKey, 'true');
            }

        } catch (error) {
            console.error('Dashboard fetch failed:', error);
            setProfileError('Failed to load profile data');
            toast.error('Failed to load dashboard data. Please try again.');
        } finally {
            setLoading(false);
            isFetching.current = false;
        }
    }, [currentUser, profileComplete]);

    useEffect(() => {
        if (currentUser && mounted.current) {
            fetchDashboardData();
        }
    }, [currentUser, fetchDashboardData]);

    useEffect(() => {
        if (!loading) return;

        const fallbackTimeout = setTimeout(() => {
            if (loading && !isFetching.current) {
                setLoading(false);
            }
        }, 10000);

        return () => clearTimeout(fallbackTimeout);
    }, [loading]);

    return {
        profile,
        profileError,
        allAnswers,
        recentAnswers,
        jobs,
        loading,
        showWelcome,
        setJobs,
        setShowWelcome,
        fetchDashboardData
    };
}