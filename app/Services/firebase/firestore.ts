import { db, storage } from './config';
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
    serverTimestamp,
    Timestamp
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import {
    UserProfile,
    Answer,
    Job,
    Question,
    PracticeSession,
    QuestionCategory,
    WeeklyGoal,
    GoalStats,
    WeeklyProgress
} from '../../types';
import { JobStatus } from '../../types';

// User Profile Functions
export const createUserProfile = async (profile: Omit<UserProfile, 'createdAt' | 'updatedAt'>) => {
    const userProfileRef = doc(db, 'profiles', profile.uid);
    await setDoc(userProfileRef, {
        ...profile,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
    });

    // Update the isProfileComplete flag in the users collection
    const userRef = doc(db, 'users', profile.uid);
    await updateDoc(userRef, {
        isProfileComplete: true
    });
};

export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
    try {
        if (!uid) {
            return null;
        }

        const userProfileRef = doc(db, 'profiles', uid);
        const userProfileSnap = await getDoc(userProfileRef);

        if (userProfileSnap.exists()) {
            const rawData = userProfileSnap.data();
            console.log('Profile document found:', rawData);

            // Ensure the data has the expected structure and handle any missing fields
            const profile: UserProfile = {
                uid: rawData.uid || uid,
                name: rawData.name || '',
                email: rawData.email || '',
                phone: rawData.phone || '',
                location: rawData.location || '',
                summary: rawData.summary || '',
                education: Array.isArray(rawData.education) ? rawData.education : [],
                workExperience: Array.isArray(rawData.workExperience) ? rawData.workExperience : [],
                projects: Array.isArray(rawData.projects) ? rawData.projects : [],
                skills: Array.isArray(rawData.skills) ? rawData.skills : [],
                extracurriculars: Array.isArray(rawData.extracurriculars) ? rawData.extracurriculars : [],
                additionalInfo: rawData.additionalInfo || '',
                createdAt: rawData.createdAt || new Date(),
                updatedAt: rawData.updatedAt || new Date()
            };

            console.log('Formatted profile object:', {
                uid: profile.uid,
                name: profile.name,
                email: profile.email,
                hasEducation: profile.education.length > 0,
                hasWorkExperience: profile.workExperience.length > 0,
                hasSkills: profile.skills.length > 0
            });

            return profile;
        } else {
            console.log('No profile document found for UID:', uid);
            return null;
        }
    } catch (error) {
        console.error('Error fetching user profile:', error);
        // Don't throw the error, return null instead
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

// File Upload Functions
export const uploadResume = async (uid: string, file: File): Promise<string> => {
    const fileRef = ref(storage, `resumes/${uid}/${file.name}`);
    await uploadBytes(fileRef, file);
    return getDownloadURL(fileRef);
};

export const uploadCoverLetter = async (uid: string, file: File, jobId: string): Promise<string> => {
    const fileRef = ref(storage, `coverLetters/${uid}/${jobId}/${file.name}`);
    await uploadBytes(fileRef, file);
    return getDownloadURL(fileRef);
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
        console.log('getJobs called for userId:', userId);

        const jobsQuery = query(
            collection(db, 'jobs'),
            where('userId', '==', userId),
            orderBy('updatedAt', 'desc')
        );

        const jobsSnap = await getDocs(jobsQuery);
        const jobs = jobsSnap.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as Job));

        console.log('Jobs found:', jobs.length);
        return jobs;
    } catch (error) {
        console.error('Error fetching jobs:', error);
        return [];
    }
};

export const getJob = async (jobId: string): Promise<Job | null> => {
    const jobRef = doc(db, 'jobs', jobId);
    const jobSnap = await getDoc(jobRef);

    if (jobSnap.exists()) {
        return {
            id: jobSnap.id,
            ...jobSnap.data()
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

// Answer Functions
export const saveAnswer = async (answer: Omit<Answer, 'id' | 'createdAt' | 'updatedAt'>) => {
    // Validate required fields
    if (!answer.userId) throw new Error('userId is required');
    if (!answer.questionId) throw new Error('questionId is required');
    if (!answer.questionText) throw new Error('questionText is required');
    if (!answer.answerText) throw new Error('answerText is required');
    if (!answer.category) throw new Error('category is required');

    // Create a clean answer object
    const cleanAnswer: any = {
        userId: answer.userId,
        questionId: answer.questionId,
        questionText: answer.questionText,
        answerText: answer.answerText,
        category: answer.category,
        feedback: answer.feedback || '',  // Default to empty string
        tags: Array.isArray(answer.tags) && answer.tags.length > 0 ? answer.tags : ['interview'],
        isFavorite: answer.isFavorite ?? false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
    };

    if (answer.jobId) {
        cleanAnswer.jobId = answer.jobId;
    }

    const answersRef = collection(db, 'answers');
    const result = await addDoc(answersRef, cleanAnswer);

    // Update weekly goal progress after saving answer
    try {
        await updateWeeklyGoalProgress(answer.userId);
    } catch (error) {
        console.error('Error updating weekly goal progress:', error);
    }

    return result;
};

export const getAnswers = async (userId: string): Promise<Answer[]> => {
    try {
        console.log('getAnswers called for userId:', userId);

        const answersQuery = query(
            collection(db, 'answers'),
            where('userId', '==', userId),
            orderBy('updatedAt', 'desc')
        );

        const answersSnap = await getDocs(answersQuery);
        const answers = answersSnap.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as Answer));

        console.log('Answers found:', answers.length);
        return answers;
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

// Answer Functions
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
        ...doc.data()
    } as Answer));
};

// Practice Session Functions
export const createPracticeSession = async (
    userId: string,
    categories: QuestionCategory[],
    jobId?: string
): Promise<string> => {
    if (!userId) {
        throw new Error('User ID is required');
    }

    if (!Array.isArray(categories) || categories.length === 0) {
        throw new Error('At least one question category is required');
    }

    const sessionRef = collection(db, 'practice_sessions');
    const newSession = await addDoc(sessionRef, {
        userId,
        jobId: jobId || null, // Ensure we store null, not undefined
        categories,
        questions: [], // Initialize with empty array
        currentQuestionIndex: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
    });

    return newSession.id;
};

export const getPracticeSession = async (sessionId: string): Promise<PracticeSession | null> => {
    if (!sessionId) {
        console.error('Session ID is required');
        return null;
    }

    const sessionRef = doc(db, 'practice_sessions', sessionId);
    const sessionSnap = await getDoc(sessionRef);

    if (sessionSnap.exists()) {
        const data = sessionSnap.data();
        // Ensure questions is always an array
        const questions = Array.isArray(data.questions) ? data.questions : [];
        // Ensure currentQuestionIndex is a valid number
        const currentQuestionIndex = Number.isInteger(data.currentQuestionIndex) ?
            data.currentQuestionIndex : 0;

        return {
            id: sessionSnap.id,
            ...data,
            questions,
            currentQuestionIndex
        } as PracticeSession;
    }

    return null;
};

export const updatePracticeSession = async (
    sessionId: string,
    questions: Question[],
    currentQuestionIndex: number
) => {
    // Validate inputs
    if (!sessionId) {
        console.error('Session ID is required for updating a practice session');
        throw new Error('Session ID is required');
    }

    if (!Array.isArray(questions)) {
        console.error('Questions must be an array');
        throw new Error('Questions must be an array');
    }

    // Ensure currentQuestionIndex is a valid number
    const validIndex = Number.isInteger(currentQuestionIndex) ? currentQuestionIndex : 0;

    // Clean questions to remove any undefined values
    const cleanQuestions = questions.map(q => {
        const cleanQuestion: any = {
            id: q.id || `q-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            text: q.text || 'Interview question',
            category: q.category || 'Behavioral',
            jobSpecific: q.jobSpecific ?? false
        };

        // Only add jobId if it exists, otherwise don't include it
        if (q.jobId) {
            cleanQuestion.jobId = q.jobId;
        }

        return cleanQuestion;
    });

    const sessionRef = doc(db, 'practice_sessions', sessionId);

    // Include updatedAt timestamp
    await updateDoc(sessionRef, {
        questions: cleanQuestions,
        currentQuestionIndex: validIndex,
        updatedAt: serverTimestamp()
    });
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

// Goals Functions

// Helper function to get the start of the week (Monday)
export const getWeekStart = (date: Date = new Date()): Date => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
    const monday = new Date(d.setDate(diff));
    monday.setHours(0, 0, 0, 0);
    return monday;
};

// Helper function to get the end of the week (Sunday)
export const getWeekEnd = (date: Date = new Date()): Date => {
    const weekStart = getWeekStart(date);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);
    return weekEnd;
};

// Create or update weekly goal
export const createOrUpdateWeeklyGoal = async (
    userId: string,
    targetQuestions: number,
    weekStart?: Date
): Promise<string> => {
    if (!userId) {
        throw new Error('User ID is required');
    }

    if (targetQuestions < 1) {
        throw new Error('Target questions must be at least 1');
    }

    const currentWeekStart = weekStart || getWeekStart();
    const currentWeekEnd = getWeekEnd(currentWeekStart);
    const weekStartISO = currentWeekStart.toISOString();
    const weekEndISO = currentWeekEnd.toISOString();

    // Check if goal already exists for this week
    const existingGoal = await getCurrentWeekGoal(userId, currentWeekStart);

    if (existingGoal) {
        // Update existing goal
        const goalRef = doc(db, 'weekly_goals', existingGoal.id);
        await updateDoc(goalRef, {
            targetQuestions,
            updatedAt: serverTimestamp()
        });
        return existingGoal.id;
    } else {
        // Create new goal
        const goalsRef = collection(db, 'weekly_goals');
        const newGoal = await addDoc(goalsRef, {
            userId,
            weekStartDate: weekStartISO,
            weekEndDate: weekEndISO,
            targetQuestions,
            currentProgress: 0,
            isCompleted: false,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        });
        return newGoal.id;
    }
};

// Get current week's goal
export const getCurrentWeekGoal = async (userId: string, weekStart?: Date): Promise<WeeklyGoal | null> => {
    try {
        const currentWeekStart = weekStart || getWeekStart();
        const weekStartISO = currentWeekStart.toISOString();

        const goalsQuery = query(
            collection(db, 'weekly_goals'),
            where('userId', '==', userId),
            where('weekStartDate', '==', weekStartISO)
        );

        const goalsSnap = await getDocs(goalsQuery);

        if (!goalsSnap.empty) {
            const doc = goalsSnap.docs[0];
            return {
                id: doc.id,
                ...doc.data()
            } as WeeklyGoal;
        }

        return null;
    } catch (error) {
        console.error('Error fetching current week goal:', error);
        return null;
    }
};

// Get all weekly goals for a user
export const getUserWeeklyGoals = async (userId: string): Promise<WeeklyGoal[]> => {
    try {
        const goalsQuery = query(
            collection(db, 'weekly_goals'),
            where('userId', '==', userId),
            orderBy('weekStartDate', 'desc')
        );

        const goalsSnap = await getDocs(goalsQuery);
        return goalsSnap.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as WeeklyGoal));
    } catch (error) {
        console.error('Error fetching user weekly goals:', error);
        return [];
    }
};

// Update goal progress based on answers count for the week
export const updateWeeklyGoalProgress = async (userId: string, weekStart?: Date): Promise<void> => {
    try {
        const currentWeekStart = weekStart || getWeekStart();
        const currentWeekEnd = getWeekEnd(currentWeekStart);

        // Get current week's goal
        const currentGoal = await getCurrentWeekGoal(userId, currentWeekStart);
        if (!currentGoal) return;

        // Count answers for this week
        const weeklyAnswersCount = await getAnswersCountForWeek(userId, currentWeekStart, currentWeekEnd);

        // Update goal progress
        const goalRef = doc(db, 'weekly_goals', currentGoal.id);
        const isCompleted = weeklyAnswersCount >= currentGoal.targetQuestions;

        const updateData: any = {
            currentProgress: weeklyAnswersCount,
            isCompleted,
            updatedAt: serverTimestamp()
        };

        // If just completed, add completion date
        if (isCompleted && !currentGoal.isCompleted) {
            updateData.completedDate = serverTimestamp();
        }

        await updateDoc(goalRef, updateData);
    } catch (error) {
        console.error('Error updating weekly goal progress:', error);
    }
};

// Get answers count for a specific week
export const getAnswersCountForWeek = async (
    userId: string,
    weekStart: Date,
    weekEnd: Date
): Promise<number> => {
    try {
        console.log('Getting answers count for week:', {
            userId,
            weekStart: weekStart.toISOString(),
            weekEnd: weekEnd.toISOString()
        });

        // Convert JavaScript dates to Firestore Timestamps for proper comparison
        const weekStartTimestamp = Timestamp.fromDate(weekStart);
        const weekEndTimestamp = Timestamp.fromDate(weekEnd);

        const answersQuery = query(
            collection(db, 'answers'),
            where('userId', '==', userId),
            where('createdAt', '>=', weekStartTimestamp),
            where('createdAt', '<=', weekEndTimestamp)
        );

        const answersSnap = await getDocs(answersQuery);
        const count = answersSnap.size;

        console.log(`Found ${count} answers for week ${weekStart.toISOString().split('T')[0]}`);

        return count;
    } catch (error) {
        console.error('Error getting answers count for week:', error);
        return 0;
    }
};

// Get goal statistics
export const getGoalStats = async (userId: string): Promise<GoalStats> => {
    try {
        const goals = await getUserWeeklyGoals(userId);
        const currentWeekGoal = await getCurrentWeekGoal(userId);

        // Calculate stats
        const completedGoals = goals.filter(goal => goal.isCompleted);
        const totalWeeksCompleted = completedGoals.length;

        // Calculate weekly streak (consecutive weeks from current)
        let weeklyStreak = 0;
        const sortedGoals = goals.sort((a, b) => new Date(b.weekStartDate).getTime() - new Date(a.weekStartDate).getTime());

        for (const goal of sortedGoals) {
            if (goal.isCompleted) {
                weeklyStreak++;
            } else {
                break;
            }
        }

        // Calculate average completion rate
        const averageCompletion = goals.length > 0 ?
            (completedGoals.reduce((sum, goal) => sum + (goal.currentProgress / goal.targetQuestions), 0) / goals.length) * 100 : 0;

        // Find best week
        const bestWeek = goals.length > 0 ?
            Math.max(...goals.map(goal => goal.currentProgress)) : 0;

        return {
            currentWeekProgress: currentWeekGoal?.currentProgress || 0,
            currentWeekTarget: currentWeekGoal?.targetQuestions || 0,
            weeklyStreak,
            totalWeeksCompleted,
            averageCompletion: Math.round(averageCompletion),
            bestWeek
        };
    } catch (error) {
        console.error('Error getting goal stats:', error);
        return {
            currentWeekProgress: 0,
            currentWeekTarget: 0,
            weeklyStreak: 0,
            totalWeeksCompleted: 0,
            averageCompletion: 0,
            bestWeek: 0
        };
    }
};

// Get weekly progress data for charts
export const getWeeklyProgressData = async (userId: string, weeksBack: number = 12): Promise<WeeklyProgress[]> => {
    try {
        console.log('Getting weekly progress data for:', { userId, weeksBack });

        const progressData: WeeklyProgress[] = [];
        const currentDate = new Date();

        // Start from the current week and go back
        for (let i = weeksBack - 1; i >= 0; i--) {
            const weekStart = new Date(currentDate);
            weekStart.setDate(currentDate.getDate() - (i * 7));

            // Adjust to Monday (start of week)
            const dayOfWeek = weekStart.getDay();
            const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Sunday = 0, so 6 days back to Monday
            weekStart.setDate(weekStart.getDate() - daysToMonday);
            weekStart.setHours(0, 0, 0, 0);

            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekStart.getDate() + 6);
            weekEnd.setHours(23, 59, 59, 999);

            console.log(`Processing week ${i}: ${weekStart.toISOString()} to ${weekEnd.toISOString()}`);

            const count = await getAnswersCountForWeek(userId, weekStart, weekEnd);

            progressData.push({
                date: weekStart.toISOString().split('T')[0], // YYYY-MM-DD format
                count
            });
        }

        console.log('Final progress data:', progressData);
        return progressData;
    } catch (error) {
        console.error('Error getting weekly progress data:', error);
        return [];
    }
};
