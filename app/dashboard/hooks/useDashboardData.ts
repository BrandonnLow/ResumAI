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

    // Track if we're currently fetching to prevent duplicate requests
    const fetchingRef = useRef(false);
    const mountedRef = useRef(true);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            mountedRef.current = false;
        };
    }, []);

    // Memoized function to prevent recreation on every render
    const fetchDashboardData = useCallback(async () => {
        // Prevent multiple simultaneous fetches
        if (!currentUser || fetchingRef.current) {
            console.log('Skipping fetch - no user or already fetching');
            return;
        }

        try {
            fetchingRef.current = true;
            setLoading(true);
            setProfileError(null);

            console.log('Starting dashboard data fetch for user:', currentUser.uid);

            // Fetch all data in parallel
            const [userProfile, userAnswers, userJobs] = await Promise.all([
                getUserProfile(currentUser.uid),
                getAnswers(currentUser.uid),
                getJobs(currentUser.uid)
            ]);

            console.log('Data fetched successfully:', {
                profile: !!userProfile,
                profileName: userProfile?.name || 'N/A',
                answersCount: userAnswers.length,
                jobsCount: userJobs.length
            });

            // Handle profile
            if (!userProfile) {
                console.error('No profile found for user:', currentUser.uid);
                setProfileError('Profile not found');
            } else {
                setProfile(userProfile);
                if (!userProfile.name || userProfile.name.trim() === '') {
                    setProfileError('Profile name is missing');
                }
            }

            // Set answers
            setAllAnswers(userAnswers);
            setRecentAnswers(userAnswers.slice(0, 5));

            // Set jobs
            setJobs(userJobs);

            // Check for welcome message
            const hasShownWelcome = localStorage.getItem(`welcome_shown_${currentUser.uid}`);
            if (profileComplete && !hasShownWelcome && userProfile) {
                setShowWelcome(true);
                localStorage.setItem(`welcome_shown_${currentUser.uid}`, 'true');
            }

            console.log('Dashboard data updated successfully');

        } catch (error) {
            console.error('Error fetching dashboard data:', error);
            setProfileError('Failed to load profile data');
            toast.error('Failed to load dashboard data. Please try again.');
        } finally {
            // Always set loading to false
            setLoading(false);
            fetchingRef.current = false;
            console.log('Dashboard fetch completed, loading set to false');
        }
    }, [currentUser, profileComplete]);

    // Main data fetching effect
    useEffect(() => {
        if (currentUser && mountedRef.current) {
            console.log('useEffect triggered for dashboard data fetch');
            fetchDashboardData();
        }
    }, [currentUser, fetchDashboardData]);

    // Ensure loading doesn't stay true forever
    useEffect(() => {
        const timeout = setTimeout(() => {
            if (loading && !fetchingRef.current) {
                console.log('Fallback: Setting loading to false after timeout');
                setLoading(false);
            }
        }, 10000); // 10 second timeout

        return () => clearTimeout(timeout);
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