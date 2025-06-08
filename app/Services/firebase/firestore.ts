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
import { UserProfile, Job, Answer, PracticeSession, QuestionCategory, Question, JobStatus } from '../../types';


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

// Practice Session Functions
export const createPracticeSession = async (
    userId: string,
    categories: QuestionCategory[],
    jobId?: string
): Promise<string> => {
    const sessionRef = collection(db, 'practice_sessions');
    const newSession = await addDoc(sessionRef, {
        userId,
        jobId: jobId || null,
        categories,
        questions: [],
        currentQuestionIndex: 0,
        createdAt: serverTimestamp()
    });

    return newSession.id;
};

export const getPracticeSession = async (sessionId: string): Promise<PracticeSession | null> => {
    const sessionRef = doc(db, 'practice_sessions', sessionId);
    const sessionSnap = await getDoc(sessionRef);

    if (sessionSnap.exists()) {
        const data = sessionSnap.data();
        return {
            id: sessionSnap.id,
            ...data,
            questions: data.questions || [],
            currentQuestionIndex: data.currentQuestionIndex || 0,
            createdAt: data.createdAt?.toDate() || new Date()
        } as PracticeSession;
    }

    return null;
};

export const updatePracticeSession = async (
    sessionId: string,
    questions: Question[],
    currentQuestionIndex: number
) => {
    const sessionRef = doc(db, 'practice_sessions', sessionId);
    await updateDoc(sessionRef, {
        questions,
        currentQuestionIndex
    });
};

// Answer Functions

export const saveAnswer = async (answer: Omit<Answer, 'id' | 'createdAt' | 'updatedAt'>) => {
    // Validate required fields
    if (!answer.userId) throw new Error('userId is required');
    if (!answer.questionId) throw new Error('questionId is required');
    if (!answer.questionText) throw new Error('questionText is required');
    if (!answer.answerText) throw new Error('answerText is required');
    if (!answer.category) throw new Error('category is required');

    const cleanAnswer: any = {
        userId: answer.userId,
        questionId: answer.questionId,
        questionText: answer.questionText,
        answerText: answer.answerText,
        category: answer.category,
        feedback: answer.feedback || '',
        tags: Array.isArray(answer.tags) && answer.tags.length > 0 ? answer.tags : ['interview'],
        isFavorite: answer.isFavorite ?? false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
    };

    // Only add jobId if it exists
    if (answer.jobId) {
        cleanAnswer.jobId = answer.jobId;
    }

    const answersRef = collection(db, 'answers');
    return addDoc(answersRef, cleanAnswer);
};

export const getAnswers = async (userId: string): Promise<Answer[]> => {
    try {
        const answersQuery = query(
            collection(db, 'answers'),
            where('userId', '==', userId),
            orderBy('updatedAt', 'desc')
        );

        const answersSnap = await getDocs(answersQuery);
        return answersSnap.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate() || new Date(),
            updatedAt: doc.data().updatedAt?.toDate() || new Date()
        } as Answer));
    } catch (error) {
        console.error('Error fetching answers:', error);
        return [];
    }
};

export const updateAnswer = async (answer: Partial<Answer> & { id: string }) => {
    const answerRef = doc(db, 'answers', answer.id);
    await updateDoc(answerRef, {
        ...answer,
        updatedAt: serverTimestamp()
    });
};

export const deleteAnswer = async (answerId: string) => {
    const answerRef = doc(db, 'answers', answerId);
    await deleteDoc(answerRef);
};

export const getAnswersByJob = async (userId: string, jobId: string): Promise<Answer[]> => {
    const answersQuery = query(
        collection(db, 'answers'),
        where('userId', '==', userId),
        where('jobId', '==', jobId),
        orderBy('updatedAt', 'desc')
    );

    const answersSnap = await getDocs(answersQuery);
    return answersSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date()
    } as Answer));
};

export const updateJobStatus = async (jobId: string, status: JobStatus) => {
    if (!jobId) {
        throw new Error('Job ID is required');
    }

    if (!status) {
        throw new Error('Status is required');
    }

    const jobRef = doc(db, 'jobs', jobId);
    await updateDoc(jobRef, {
        status,
        updatedAt: serverTimestamp()
    });
};