import { db } from './config';
import {
    collection,
    doc,
    getDoc,
    getDocs,
    setDoc,
    updateDoc,
    addDoc,
    query,
    where,
    orderBy,
    deleteDoc,
    serverTimestamp
} from 'firebase/firestore';
import { UserProfile, Job } from '../../types';

// User Profile Functions
export const createUserProfile = async (profile: Omit<UserProfile, 'createdAt' | 'updatedAt'>) => {
    const userProfileRef = doc(db, 'profiles', profile.uid);
    await setDoc(userProfileRef, {
        ...profile,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
    });
};

export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
    try {
        const userProfileRef = doc(db, 'profiles', uid);
        const userProfileSnap = await getDoc(userProfileRef);

        if (userProfileSnap.exists()) {
            const data = userProfileSnap.data();
            return {
                uid: data.uid || uid,
                name: data.name || '',
                email: data.email || '',
                phone: data.phone || '',
                location: data.location || '',
                summary: data.summary || '',
                education: data.education || [],
                workExperience: data.workExperience || [],
                projects: data.projects || [],
                skills: data.skills || [],
                extracurriculars: data.extracurriculars || [],
                additionalInfo: data.additionalInfo || '',
                createdAt: data.createdAt?.toDate() || new Date(),
                updatedAt: data.updatedAt?.toDate() || new Date()
            };
        }
        return null;
    } catch (error) {
        console.error('Error fetching user profile:', error);
        return null;
    }
};

export const updateUserProfile = async (profile: Partial<UserProfile> & { uid: string }) => {
    const userProfileRef = doc(db, 'profiles', profile.uid);
    await updateDoc(userProfileRef, {
        ...profile,
        updatedAt: serverTimestamp()
    });
};

// Job Functions
export const createJob = async (job: Omit<Job, 'id' | 'createdAt' | 'updatedAt'>) => {
    const jobRef = collection(db, 'jobs');
    return addDoc(jobRef, {
        ...job,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
    });
};

export const getJobs = async (userId: string): Promise<Job[]> => {
    try {
        const jobsQuery = query(
            collection(db, 'jobs'),
            where('userId', '==', userId),
            orderBy('updatedAt', 'desc')
        );

        const jobsSnap = await getDocs(jobsQuery);
        return jobsSnap.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate() || new Date(),
            updatedAt: doc.data().updatedAt?.toDate() || new Date()
        } as Job));
    } catch (error) {
        console.error('Error fetching jobs:', error);
        return [];
    }
};

export const getJob = async (jobId: string): Promise<Job | null> => {
    const jobRef = doc(db, 'jobs', jobId);
    const jobSnap = await getDoc(jobRef);

    if (jobSnap.exists()) {
        const data = jobSnap.data();
        return {
            id: jobSnap.id,
            ...data,
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate() || new Date()
        } as Job;
    }

    return null;
};

export const updateJob = async (job: Partial<Job> & { id: string }) => {
    const jobRef = doc(db, 'jobs', job.id);
    await updateDoc(jobRef, {
        ...job,
        updatedAt: serverTimestamp()
    });
};

export const deleteJob = async (jobId: string) => {
    const jobRef = doc(db, 'jobs', jobId);
    await deleteDoc(jobRef);
};