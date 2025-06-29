import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import toast from 'react-hot-toast';
import PracticeSession from '../app/practice/session/[sessionId]/page';
import {
    getPracticeSession,
    getUserProfile,
    getJob,
    saveAnswer
} from '../app/Services/firebase/firestore';
import {
    generateQuestions,
    getAnswerFeedback,
    suggestTags
} from '../app/Services/openai/functions';

const mockPush = jest.fn();
const mockBack = jest.fn();

jest.mock('next/navigation', () => ({
    useParams: () => ({ sessionId: 'test-session-id' }),
    useRouter: () => ({
        push: mockPush,
        back: mockBack,
    }),
}));

jest.mock('react-hot-toast', () => ({
    success: jest.fn(),
    error: jest.fn(),
    loading: jest.fn(),
    dismiss: jest.fn(),
    __esModule: true,
    default: {
        success: jest.fn(),
        error: jest.fn(),
        loading: jest.fn(),
        dismiss: jest.fn(),
    }
}));

jest.mock('../app/Services/firebase/firestore', () => ({
    getPracticeSession: jest.fn(),
    getUserProfile: jest.fn(),
    getJob: jest.fn(),
    saveAnswer: jest.fn(),
}));

jest.mock('../app/Services/openai/functions', () => ({
    generateQuestions: jest.fn(),
    getAnswerFeedback: jest.fn(),
    suggestTags: jest.fn(),
}));

jest.mock('firebase/firestore', () => ({
    doc: jest.fn(() => ({ id: 'mock-doc' })),
    updateDoc: jest.fn(),
    serverTimestamp: jest.fn(() => ({ seconds: Date.now() / 1000 })),
}));

jest.mock('../app/Services/firebase/config', () => ({
    db: {},
}));

jest.mock('../app/ui/Context/AuthContext', () => ({
    useAuth: () => ({
        currentUser: { uid: 'test-user-id', email: 'john@example.com' },
    }),
}));

// Mock wrapper components
jest.mock('../app/ui/components/PrivateRoute', () => {
    return function MockPrivateRoute({ children }: { children: React.ReactNode }) {
        return <div data-testid="private-route">{children}</div>;
    };
});

jest.mock('../app/ui/components/ProfileCheck', () => {
    return function MockProfileCheck({ children }: { children: React.ReactNode }) {
        return <div data-testid="profile-check">{children}</div>;
    };
});

jest.mock('../app/ui/components/Loading', () => ({
    LoadingPage: ({ text }: { text: string }) => <div data-testid="loading">{text}</div>,
    __esModule: true,
    default: ({ variant, text }: { variant?: string; text?: string }) =>
        <div data-testid="loading-component">{text || 'Loading...'}</div>,
}));

// Mock theme functions
jest.mock('../app/ui/styles/theme', () => ({
    getCardClasses: () => 'bg-gray-800 border border-gray-600 rounded-lg shadow-sm',
    getInputClasses: () => 'bg-gray-700 border-gray-600 text-white focus:ring-blue-500 focus:border-blue-500',
    getButtonClasses: (variant: string) => variant === 'secondary'
        ? 'bg-gray-600 text-white hover:bg-gray-700'
        : 'bg-blue-600 text-white hover:bg-blue-700'
}));

// Cast mocked functions
const mockGetPracticeSession = getPracticeSession as jest.Mock;
const mockGetUserProfile = getUserProfile as jest.Mock;
const mockGetJob = getJob as jest.Mock;
const mockSaveAnswer = saveAnswer as jest.Mock;
const mockGenerateQuestions = generateQuestions as jest.Mock;
const mockGetAnswerFeedback = getAnswerFeedback as jest.Mock;
const mockSuggestTags = suggestTags as jest.Mock;
const mockToast = toast as jest.Mocked<typeof toast>;

// Mock data
const mockUserProfile = {
    uid: 'test-user-id',
    name: 'John Doe',
    email: 'john@example.com',
    skills: [{ id: '1', name: 'JavaScript' }]
};

const mockJob = {
    id: 'job1',
    title: 'Software Engineer',
    company: 'Tech Corp',
    description: 'Looking for a skilled developer'
};

const mockSessionWithQuestions = {
    id: 'test-session-id',
    userId: 'test-user-id',
    categories: ['Behavioral', 'Technical'],
    questions: [
        {
            id: 'q1',
            text: 'Tell me about a challenging project you worked on.',
            category: 'Behavioral',
            jobSpecific: false
        },
        {
            id: 'q2',
            text: 'How do you handle technical debt?',
            category: 'Technical',
            jobSpecific: false
        }
    ],
    currentQuestionIndex: 0,
    createdAt: new Date()
};

const mockSessionWithoutQuestions = {
    id: 'test-session-id',
    userId: 'test-user-id',
    categories: ['Behavioral', 'Technical'],
    questions: [],
    currentQuestionIndex: 0,
    createdAt: new Date()
};

describe('Practice Session Component', () => {
    const user = userEvent.setup();

    beforeEach(() => {
        jest.clearAllMocks();

        mockGetPracticeSession.mockReset();
        mockGetUserProfile.mockReset();
        mockGetJob.mockReset();
        mockSaveAnswer.mockReset();
        mockGenerateQuestions.mockReset();
        mockGetAnswerFeedback.mockReset();
        mockSuggestTags.mockReset();

        // Reset toast mocks
        mockToast.success.mockReset();
        mockToast.error.mockReset();
        mockToast.loading.mockReset();
        mockToast.dismiss.mockReset();

        // Reset router mocks
        mockPush.mockReset();
        mockBack.mockReset();

        jest.spyOn(console, 'log').mockImplementation(() => { });
        jest.spyOn(console, 'error').mockImplementation(() => { });
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('renders loading state initially', () => {
        mockGetPracticeSession.mockImplementation(() => new Promise(() => { }));

        render(<PracticeSession />);

        expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('generates questions when session has no questions', async () => {
        mockGetPracticeSession.mockResolvedValue(mockSessionWithoutQuestions);
        mockGetUserProfile.mockResolvedValue(mockUserProfile);
        mockGenerateQuestions.mockResolvedValue([
            { text: 'Generated question 1', category: 'Behavioral' },
            { text: 'Generated question 2', category: 'Technical' }
        ]);

        render(<PracticeSession />);

        await waitFor(() => {
            expect(mockGenerateQuestions).toHaveBeenCalledWith(
                mockUserProfile,
                ['Behavioral', 'Technical'],
                5,
                undefined
            );
        }, { timeout: 5000 });

        await waitFor(() => {
            expect(mockToast.success).toHaveBeenCalledWith('Questions generated for: Behavioral, Technical');
        }, { timeout: 5000 });

        await waitFor(() => {
            expect(screen.getByText('Practice Session')).toBeInTheDocument();
        }, { timeout: 5000 });
    }, 15000);

    it('displays practice session with questions', async () => {
        mockGetPracticeSession.mockResolvedValue(mockSessionWithQuestions);
        mockGetUserProfile.mockResolvedValue(mockUserProfile);

        render(<PracticeSession />);

        await waitFor(() => {
            expect(screen.getByText('Practice Session')).toBeInTheDocument();
        });

        expect(screen.getByText('Question 1 of 2')).toBeInTheDocument();

        expect(screen.getByText('Categories:')).toBeInTheDocument();
        expect(screen.getByText('Behavioral, Technical')).toBeInTheDocument();

        expect(screen.getByText('Tell me about a challenging project you worked on.')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Type your answer here...')).toBeInTheDocument();
    });

    it('displays job-specific practice session', async () => {
        const sessionWithJob = { ...mockSessionWithQuestions, jobId: 'job1' };
        mockGetPracticeSession.mockResolvedValue(sessionWithJob);
        mockGetUserProfile.mockResolvedValue(mockUserProfile);
        mockGetJob.mockResolvedValue(mockJob);

        render(<PracticeSession />);

        await waitFor(() => {
            expect(screen.getByText('Practice Session')).toBeInTheDocument();
        });

        expect(screen.getByText((content, element) => {
            return element?.textContent === 'Preparing for: Software Engineer at Tech Corp';
        })).toBeInTheDocument();
    });

    it('generates questions for new session', async () => {
        mockGetPracticeSession.mockResolvedValue(mockSessionWithoutQuestions);
        mockGetUserProfile.mockResolvedValue(mockUserProfile);
        mockGenerateQuestions.mockResolvedValue([
            { text: 'Generated question 1...', category: 'Behavioral' },
            { text: 'Generated question 2...', category: 'Technical' }
        ]);

        render(<PracticeSession />);

        await waitFor(() => {
            expect(mockGenerateQuestions).toHaveBeenCalledWith(
                mockUserProfile,
                ['Behavioral', 'Technical'],
                5,
                undefined
            );
        });

        await waitFor(() => {
            expect(mockToast.success).toHaveBeenCalledWith('Questions generated for: Behavioral, Technical');
        });
    });

    it('gets AI feedback for answer', async () => {
        mockGetPracticeSession.mockResolvedValue(mockSessionWithQuestions);
        mockGetUserProfile.mockResolvedValue(mockUserProfile);
        mockGetAnswerFeedback.mockResolvedValue('Great answer! Consider adding more specific examples.');
        mockSuggestTags.mockResolvedValue(['teamwork', 'problem-solving']);

        render(<PracticeSession />);

        await waitFor(() => {
            expect(screen.getByText('Tell me about a challenging project you worked on.')).toBeInTheDocument();
        });

        const answerTextarea = await waitFor(() => {
            return screen.getByPlaceholderText('Type your answer here...');
        });

        fireEvent.change(answerTextarea, {
            target: { value: 'I worked on a complex project where...' }
        });

        expect(answerTextarea).toHaveValue('I worked on a complex project where...');

        const getFeedbackButton = await waitFor(() => {
            const button = screen.getByRole('button', { name: /get ai feedback/i });
            expect(button).not.toBeDisabled();
            return button;
        });

        await user.click(getFeedbackButton);

        await waitFor(() => {
            expect(mockGetAnswerFeedback).toHaveBeenCalledWith(
                'Tell me about a challenging project you worked on.',
                'I worked on a complex project where...',
                mockUserProfile,
                undefined
            );
        });

        await waitFor(() => {
            expect(screen.getByText('Great answer! Consider adding more specific examples.')).toBeInTheDocument();
        });
    });

    it('saves answer successfully', async () => {
        mockGetPracticeSession.mockResolvedValue(mockSessionWithQuestions);
        mockGetUserProfile.mockResolvedValue(mockUserProfile);
        mockGetAnswerFeedback.mockResolvedValue('Good answer!');
        mockSuggestTags.mockResolvedValue(['teamwork']);
        mockSaveAnswer.mockResolvedValue(undefined);

        render(<PracticeSession />);

        await waitFor(() => {
            expect(screen.getByText('Tell me about a challenging project you worked on.')).toBeInTheDocument();
        });

        const answerTextarea = await waitFor(() => {
            return screen.getByPlaceholderText('Type your answer here...');
        });

        fireEvent.change(answerTextarea, {
            target: { value: 'My answer to the question' }
        });

        expect(answerTextarea).toHaveValue('My answer to the question');

        const getFeedbackButton = await waitFor(() => {
            const button = screen.getByRole('button', { name: /get ai feedback/i });
            expect(button).not.toBeDisabled();
            return button;
        });

        await user.click(getFeedbackButton);

        await waitFor(() => {
            expect(screen.getByText('Good answer!')).toBeInTheDocument();
        });

        const saveButton = await waitFor(() => {
            return screen.getByRole('button', { name: /save answer/i });
        });

        await user.click(saveButton);

        await waitFor(() => {
            expect(mockSaveAnswer).toHaveBeenCalledWith({
                userId: 'test-user-id',
                questionId: 'q1',
                questionText: 'Tell me about a challenging project you worked on.',
                answerText: 'My answer to the question',
                category: 'Behavioral',
                feedback: 'Good answer!',
                tags: ['teamwork'],
                isFavorite: false
            });
        });

        await waitFor(() => {
            expect(mockToast.success).toHaveBeenCalledWith('Answer saved successfully!');
        });
    });

    it('moves to next question', async () => {
        mockGetPracticeSession.mockResolvedValue(mockSessionWithQuestions);
        mockGetUserProfile.mockResolvedValue(mockUserProfile);
        mockGetAnswerFeedback.mockResolvedValue('Good answer!');
        mockSuggestTags.mockResolvedValue(['technical']);
        mockSaveAnswer.mockResolvedValue(undefined);

        render(<PracticeSession />);

        await waitFor(() => {
            expect(screen.getByText('Tell me about a challenging project you worked on.')).toBeInTheDocument();
        });

        const answerTextarea = await waitFor(() => {
            return screen.getByPlaceholderText('Type your answer here...');
        });

        fireEvent.change(answerTextarea, {
            target: { value: 'My answer' }
        });

        expect(answerTextarea).toHaveValue('My answer');

        const getFeedbackButton = await waitFor(() => {
            const button = screen.getByRole('button', { name: /get ai feedback/i });
            expect(button).not.toBeDisabled();
            return button;
        });

        await user.click(getFeedbackButton);

        await waitFor(() => {
            expect(screen.getByText('Good answer!')).toBeInTheDocument();
        });

        const saveButton = await waitFor(() => {
            return screen.getByRole('button', { name: /save answer/i });
        });

        await user.click(saveButton);

        const nextButton = await waitFor(() => {
            return screen.getByRole('button', { name: /next question/i });
        });

        await user.click(nextButton);

        await waitFor(() => {
            expect(screen.getByText('How do you handle technical debt?')).toBeInTheDocument();
        });
    });

    it('completes session when on last question', async () => {
        const sessionOnLastQuestion = {
            ...mockSessionWithQuestions,
            currentQuestionIndex: 1
        };

        mockGetPracticeSession.mockResolvedValue(sessionOnLastQuestion);
        mockGetUserProfile.mockResolvedValue(mockUserProfile);
        mockGetAnswerFeedback.mockResolvedValue('Excellent!');
        mockSuggestTags.mockResolvedValue(['architecture']);
        mockSaveAnswer.mockResolvedValue(undefined);

        render(<PracticeSession />);

        await waitFor(() => {
            expect(screen.getByText('How do you handle technical debt?')).toBeInTheDocument();
        });

        const answerTextarea = await waitFor(() => {
            return screen.getByPlaceholderText('Type your answer here...');
        });

        fireEvent.change(answerTextarea, {
            target: { value: 'I prioritize technical debt...' }
        });

        expect(answerTextarea).toHaveValue('I prioritize technical debt...');

        const getFeedbackButton = await waitFor(() => {
            const button = screen.getByRole('button', { name: /get ai feedback/i });
            expect(button).not.toBeDisabled();
            return button;
        });

        await user.click(getFeedbackButton);

        await waitFor(() => {
            expect(screen.getByText('Excellent!')).toBeInTheDocument();
        });

        const saveButton = await waitFor(() => {
            return screen.getByRole('button', { name: /save answer/i });
        });

        await user.click(saveButton);

        const completeButton = await waitFor(() => {
            return screen.getByRole('button', { name: /complete session/i });
        });

        await user.click(completeButton);

        await waitFor(() => {
            expect(mockToast.success).toHaveBeenCalledWith('You have completed all questions!');
            expect(mockPush).toHaveBeenCalledWith('/dashboard');
        });
    });

    it('handles session not found error', async () => {
        mockGetPracticeSession.mockResolvedValue(null);

        render(<PracticeSession />);

        await waitFor(() => {
            expect(mockToast.error).toHaveBeenCalledWith('Practice session not found');
            expect(mockPush).toHaveBeenCalledWith('/practice/setup');
        });
    });

    it('handles unauthorized session access', async () => {
        const unauthorizedSession = {
            ...mockSessionWithQuestions,
            userId: 'different-user-id'
        };

        mockGetPracticeSession.mockResolvedValue(unauthorizedSession);

        render(<PracticeSession />);

        await waitFor(() => {
            expect(mockToast.error).toHaveBeenCalledWith('You do not have access to this session');
            expect(mockPush).toHaveBeenCalledWith('/practice/setup');
        });
    });

    it('handles question generation error', async () => {
        mockGetPracticeSession.mockResolvedValue(mockSessionWithoutQuestions);
        mockGetUserProfile.mockResolvedValue(mockUserProfile);
        mockGenerateQuestions.mockRejectedValue(new Error('Failed to generate questions'));

        render(<PracticeSession />);

        await waitFor(() => {
            expect(mockToast.error).toHaveBeenCalledWith('Failed to generate questions. Please try again.');
        });
    });

    it('allows skipping questions', async () => {
        mockGetPracticeSession.mockResolvedValue(mockSessionWithQuestions);
        mockGetUserProfile.mockResolvedValue(mockUserProfile);

        render(<PracticeSession />);

        await waitFor(() => {
            expect(screen.getByText('Tell me about a challenging project you worked on.')).toBeInTheDocument();
        });

        const skipButton = screen.getByRole('button', { name: /skip question/i });
        await user.click(skipButton);

        await waitFor(() => {
            expect(screen.getByText('How do you handle technical debt?')).toBeInTheDocument();
        });
    });

    it('confirms exit when clicking exit session', async () => {
        mockGetPracticeSession.mockResolvedValue(mockSessionWithQuestions);
        mockGetUserProfile.mockResolvedValue(mockUserProfile);

        const originalConfirm = window.confirm;
        window.confirm = jest.fn(() => true);

        render(<PracticeSession />);

        await waitFor(() => {
            expect(screen.getByText('Tell me about a challenging project you worked on.')).toBeInTheDocument();
        });

        const exitButtons = screen.getAllByRole('button', { name: /exit session/i });
        expect(exitButtons).toHaveLength(2);

        const headerExitButton = exitButtons[0];
        await user.click(headerExitButton);

        expect(window.confirm).toHaveBeenCalledWith(
            'Are you sure you want to exit? Your progress on this question will be lost if not saved.'
        );
        expect(mockPush).toHaveBeenCalledWith('/dashboard');

        window.confirm = originalConfirm;
    });

    it('handles empty session data gracefully', async () => {
        const emptySession = {
            id: 'test-session-id',
            userId: 'test-user-id',
            categories: [],
            questions: [],
            currentQuestionIndex: 0,
            createdAt: new Date()
        };

        mockGetPracticeSession.mockResolvedValue(emptySession);
        mockGetUserProfile.mockResolvedValue(mockUserProfile);

        render(<PracticeSession />);

        await waitFor(() => {
            expect(mockToast.error).toHaveBeenCalledWith('Invalid session: No question categories found');
            expect(mockPush).toHaveBeenCalledWith('/practice/setup');
        });
    });

    it('handles missing user profile error', async () => {
        mockGetPracticeSession.mockResolvedValue(mockSessionWithQuestions);
        mockGetUserProfile.mockResolvedValue(null);

        render(<PracticeSession />);

        await waitFor(() => {
            expect(mockToast.error).toHaveBeenCalledWith('User profile not found');
            expect(mockPush).toHaveBeenCalledWith('/profile/setup');
        });
    });

    it('handles custom tag addition', async () => {
        mockGetPracticeSession.mockResolvedValue(mockSessionWithQuestions);
        mockGetUserProfile.mockResolvedValue(mockUserProfile);
        mockGetAnswerFeedback.mockResolvedValue('Good answer!');
        mockSuggestTags.mockResolvedValue(['teamwork']);

        render(<PracticeSession />);

        await waitFor(() => {
            expect(screen.getByText('Tell me about a challenging project you worked on.')).toBeInTheDocument();
        });

        // Type answer
        const answerTextarea = await waitFor(() => {
            return screen.getByPlaceholderText('Type your answer here...');
        });

        fireEvent.change(answerTextarea, {
            target: { value: 'My answer' }
        });

        // Get feedback - wait for button to be available
        const getFeedbackButton = await waitFor(() => {
            const button = screen.getByRole('button', { name: /get ai feedback/i });
            expect(button).not.toBeDisabled();
            return button;
        });

        await user.click(getFeedbackButton);

        await waitFor(() => {
            expect(screen.getByText('Good answer!')).toBeInTheDocument();
        });

        await waitFor(() => {
            expect(screen.getByText('Tags')).toBeInTheDocument();
        });

        await waitFor(() => {
            expect(screen.getByText(/Selected tags:\s*1/)).toBeInTheDocument();
        });

        const customTagInput = await waitFor(() => {
            return screen.getByPlaceholderText('Add custom tag');
        });

        fireEvent.change(customTagInput, {
            target: { value: 'leadership' }
        });

        const addTagButton = await waitFor(() => {
            return screen.getByRole('button', { name: /add/i });
        });

        await user.click(addTagButton);

        await waitFor(() => {
            expect(screen.getByText(/Selected tags:\s*2/)).toBeInTheDocument();
        });

        await waitFor(() => {
            const elements = screen.getAllByText((content, element) => {
                if (!element) return false;
                const text = element.textContent || '';
                return element.tagName === 'P' &&
                    text.includes('Selected tags:') &&
                    text.includes('teamwork') &&
                    text.includes('leadership');
            });
            expect(elements.length).toBeGreaterThan(0);
        });

        await waitFor(() => {
            const leadershipButton = screen.getByRole('button', { name: /leadership/ });
            expect(leadershipButton).toBeInTheDocument();
        });
    });
});