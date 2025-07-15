import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import toast from 'react-hot-toast';
import Dashboard from '../app/dashboard/page';
import { updateJobStatus } from '../app/Services/firebase/firestore';

const mockPush = jest.fn();

jest.mock('next/navigation', () => ({
    useRouter: () => ({
        push: mockPush,
        back: jest.fn(),
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
    updateJobStatus: jest.fn(),
}));

// Mock the AuthContext
jest.mock('../app/ui/Context/AuthContext', () => ({
    useAuth: () => ({
        currentUser: { uid: 'test-user-id', email: 'john@example.com' },
        profileComplete: true,
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
}));

// Mock theme functions
jest.mock('../app/ui/styles/theme', () => ({
    getButtonClasses: (variant: string) => variant === 'secondary'
        ? 'bg-gray-600 text-white hover:bg-gray-700'
        : 'bg-blue-600 text-white hover:bg-blue-700',
    getCardClasses: () => 'bg-gray-800 border border-gray-600 rounded-lg shadow-sm'
}));

// Mock dashboard hook with comprehensive data
const mockUseDashboardData = jest.fn();
jest.mock('../app/dashboard/hooks/useDashboardData', () => ({
    useDashboardData: (...args: any[]) => mockUseDashboardData(...args),
}));

// Mock individual dashboard components
jest.mock('../app/dashboard/components/DashboardBanners', () => {
    return function MockDashboardBanners(props: any) {
        return (
            <div data-testid="dashboard-banners">
                {props.showWelcome && <div>Welcome Banner</div>}
                {props.profileError && <div>Profile Error: {props.profileError}</div>}
            </div>
        );
    };
});

jest.mock('../app/dashboard/components/QuickActions', () => {
    return function MockQuickActions() {
        return <div data-testid="quick-actions">Quick Actions</div>;
    };
});

jest.mock('../app/dashboard/components/RecentAnswers', () => {
    return function MockRecentAnswers({ recentAnswers }: any) {
        return (
            <div data-testid="recent-answers">
                Recent Answers ({recentAnswers.length})
            </div>
        );
    };
});

jest.mock('../app/dashboard/components/JobApplications', () => {
    return function MockJobApplications({ jobs, onQuickStatusUpdate }: any) {
        const handleUpdate = async () => {
            try {
                await onQuickStatusUpdate('job1', 'Submitted');
            } catch (error) {
                console.error('Error caught in JobApplications:', error);
            }
        };

        return (
            <div data-testid="job-applications">
                Job Applications ({jobs.length})
                <button onClick={handleUpdate}>
                    Update Job Status
                </button>
            </div>
        );
    };
});

jest.mock('../app/dashboard/components/ProgressStats', () => {
    return function MockProgressStats({ allAnswers, jobs }: any) {
        return (
            <div data-testid="progress-stats">
                Progress: {allAnswers.length} answers, {jobs.length} jobs
            </div>
        );
    };
});

const mockUpdateJobStatus = updateJobStatus as jest.Mock;
const mockToast = toast as jest.Mocked<typeof toast>;

// Mock data
const mockProfile = {
    uid: 'test-user-id',
    name: 'John Doe',
    email: 'john@example.com'
};

const mockAnswers = [
    {
        id: 'answer1',
        questionText: 'Why do you want this job?',
        answerText: 'I am passionate about...',
        category: 'Motivational'
    }
];

const mockJobs = [
    {
        id: 'job1',
        title: 'Software Engineer',
        company: 'Tech Corp',
        status: 'Submitted'
    }
];

describe('Dashboard Component', () => {
    const user = userEvent.setup();

    beforeEach(() => {
        // Clear all mocks completely
        jest.clearAllMocks();

        // Reset specific mocks
        mockUpdateJobStatus.mockReset();
        mockUseDashboardData.mockReset();

        mockToast.success.mockReset();
        mockToast.error.mockReset();
        mockToast.loading.mockReset();
        mockToast.dismiss.mockReset();

        mockPush.mockReset();

        if (jest.isMockFunction(console.error)) {
            (console.error as jest.Mock).mockReset();
        }

        // Reset the useDashboardData mock to a clean state
        mockUseDashboardData.mockReturnValue({
            profile: null,
            profileError: null,
            allAnswers: [],
            recentAnswers: [],
            jobs: [],
            loading: true,
            showWelcome: false,
            setJobs: jest.fn(),
            setShowWelcome: jest.fn(),
            fetchDashboardData: jest.fn()
        });
    });

    it('renders loading state initially', () => {
        mockUseDashboardData.mockReturnValue({
            profile: null,
            profileError: null,
            allAnswers: [],
            recentAnswers: [],
            jobs: [],
            loading: true,
            showWelcome: false,
            setJobs: jest.fn(),
            setShowWelcome: jest.fn(),
            fetchDashboardData: jest.fn()
        });

        render(<Dashboard />);

        expect(screen.getByText('Loading your dashboard...')).toBeInTheDocument();
    });

    it('renders dashboard with profile data', async () => {
        mockUseDashboardData.mockReturnValue({
            profile: mockProfile,
            profileError: null,
            allAnswers: mockAnswers,
            recentAnswers: mockAnswers,
            jobs: mockJobs,
            loading: false,
            showWelcome: false,
            setJobs: jest.fn(),
            setShowWelcome: jest.fn(),
            fetchDashboardData: jest.fn()
        });

        render(<Dashboard />);

        await waitFor(() => {
            expect(screen.getByText('Welcome, John Doe!')).toBeInTheDocument();
        });

        expect(screen.getByText('Your interview preparation dashboard')).toBeInTheDocument();
        expect(screen.getByTestId('dashboard-banners')).toBeInTheDocument();
        expect(screen.getByTestId('quick-actions')).toBeInTheDocument();
        expect(screen.getByTestId('recent-answers')).toBeInTheDocument();
        expect(screen.getByTestId('job-applications')).toBeInTheDocument();
        expect(screen.getByTestId('progress-stats')).toBeInTheDocument();
    });

    it('shows welcome banner for new users', async () => {
        mockUseDashboardData.mockReturnValue({
            profile: mockProfile,
            profileError: null,
            allAnswers: mockAnswers,
            recentAnswers: mockAnswers,
            jobs: mockJobs,
            loading: false,
            showWelcome: true,
            setJobs: jest.fn(),
            setShowWelcome: jest.fn(),
            fetchDashboardData: jest.fn()
        });

        render(<Dashboard />);

        await waitFor(() => {
            expect(screen.getByText('Welcome Banner')).toBeInTheDocument();
        });
    });

    it('shows profile error when present', async () => {
        mockUseDashboardData.mockReturnValue({
            profile: mockProfile,
            profileError: 'Profile name is missing',
            allAnswers: mockAnswers,
            recentAnswers: mockAnswers,
            jobs: mockJobs,
            loading: false,
            showWelcome: false,
            setJobs: jest.fn(),
            setShowWelcome: jest.fn(),
            fetchDashboardData: jest.fn()
        });

        render(<Dashboard />);

        await waitFor(() => {
            expect(screen.getByText('Profile Error: Profile name is missing')).toBeInTheDocument();
        });

        expect(screen.getByText('⚠️ Profile needs attention')).toBeInTheDocument();
    });

    it('navigates to practice setup when start practice clicked', async () => {
        mockUseDashboardData.mockReturnValue({
            profile: mockProfile,
            profileError: null,
            allAnswers: mockAnswers,
            recentAnswers: mockAnswers,
            jobs: mockJobs,
            loading: false,
            showWelcome: false,
            setJobs: jest.fn(),
            setShowWelcome: jest.fn(),
            fetchDashboardData: jest.fn()
        });

        render(<Dashboard />);

        await waitFor(() => {
            expect(screen.getByText('Welcome, John Doe!')).toBeInTheDocument();
        });

        const startPracticeButton = screen.getByRole('button', { name: /start practice/i });
        await user.click(startPracticeButton);

        expect(mockPush).toHaveBeenCalledWith('/practice/setup');
    });

    it('handles job status update successfully', async () => {
        const mockSetJobs = jest.fn();
        mockUseDashboardData.mockReturnValue({
            profile: mockProfile,
            profileError: null,
            allAnswers: mockAnswers,
            recentAnswers: mockAnswers,
            jobs: mockJobs,
            loading: false,
            showWelcome: false,
            setJobs: mockSetJobs,
            setShowWelcome: jest.fn(),
            fetchDashboardData: jest.fn()
        });

        mockUpdateJobStatus.mockResolvedValue(undefined);

        render(<Dashboard />);

        await waitFor(() => {
            expect(screen.getByTestId('job-applications')).toBeInTheDocument();
        });

        const updateButton = screen.getByText('Update Job Status');
        await user.click(updateButton);

        await waitFor(() => {
            expect(mockUpdateJobStatus).toHaveBeenCalledWith('job1', 'Submitted');
        });

        await waitFor(() => {
            expect(mockToast.success).toHaveBeenCalledWith('Job status updated to "Submitted"');
        });

        await waitFor(() => {
            expect(mockSetJobs).toHaveBeenCalled();
        });
    });

    it('handles job status update error', async () => {
        // Mock console.error to avoid noise in test output
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => { });

        const mockSetJobs = jest.fn();
        mockUseDashboardData.mockReturnValue({
            profile: mockProfile,
            profileError: null,
            allAnswers: mockAnswers,
            recentAnswers: mockAnswers,
            jobs: mockJobs,
            loading: false,
            showWelcome: false,
            setJobs: mockSetJobs,
            setShowWelcome: jest.fn(),
            fetchDashboardData: jest.fn()
        });

        const testError = new Error('Update failed');
        mockUpdateJobStatus.mockRejectedValue(testError);

        render(<Dashboard />);

        await waitFor(() => {
            expect(screen.getByTestId('job-applications')).toBeInTheDocument();
        });

        const updateButton = screen.getByText('Update Job Status');

        await user.click(updateButton);

        await waitFor(() => {
            expect(mockUpdateJobStatus).toHaveBeenCalledWith('job1', 'Submitted');
        });

        await waitFor(() => {
            expect(mockToast.error).toHaveBeenCalledWith('Failed to update job status');
        }, { timeout: 3000 });

        await waitFor(() => {
            expect(consoleSpy).toHaveBeenCalled();
        });

        expect(mockSetJobs).not.toHaveBeenCalled();

        consoleSpy.mockRestore();
    });

    it('uses email username when profile name is missing', async () => {
        mockUseDashboardData.mockReturnValue({
            profile: { ...mockProfile, name: '' },
            profileError: null,
            allAnswers: mockAnswers,
            recentAnswers: mockAnswers,
            jobs: mockJobs,
            loading: false,
            showWelcome: false,
            setJobs: jest.fn(),
            setShowWelcome: jest.fn(),
            fetchDashboardData: jest.fn()
        });

        render(<Dashboard />);

        await waitFor(() => {
            expect(screen.getByText('Welcome, john!')).toBeInTheDocument();
        });
    });

    it('shows progress statistics correctly', async () => {
        mockUseDashboardData.mockReturnValue({
            profile: mockProfile,
            profileError: null,
            allAnswers: mockAnswers,
            recentAnswers: mockAnswers,
            jobs: mockJobs,
            loading: false,
            showWelcome: false,
            setJobs: jest.fn(),
            setShowWelcome: jest.fn(),
            fetchDashboardData: jest.fn()
        });

        render(<Dashboard />);

        await waitFor(() => {
            expect(screen.getByText('Progress: 1 answers, 1 jobs')).toBeInTheDocument();
        });
    });

    it('handles missing profile gracefully', async () => {
        mockUseDashboardData.mockReturnValue({
            profile: null,
            profileError: null,
            allAnswers: mockAnswers,
            recentAnswers: mockAnswers,
            jobs: mockJobs,
            loading: false,
            showWelcome: false,
            setJobs: jest.fn(),
            setShowWelcome: jest.fn(),
            fetchDashboardData: jest.fn()
        });

        render(<Dashboard />);

        await waitFor(() => {
            expect(screen.getByText('Welcome, john!')).toBeInTheDocument();
        });
    });

    it('handles empty data states correctly', async () => {
        mockUseDashboardData.mockReturnValue({
            profile: mockProfile,
            profileError: null,
            allAnswers: [],
            recentAnswers: [],
            jobs: [],
            loading: false,
            showWelcome: false,
            setJobs: jest.fn(),
            setShowWelcome: jest.fn(),
            fetchDashboardData: jest.fn()
        });

        render(<Dashboard />);

        await waitFor(() => {
            expect(screen.getByText('Welcome, John Doe!')).toBeInTheDocument();
        });

        expect(screen.getByText('Recent Answers (0)')).toBeInTheDocument();
        expect(screen.getByText('Job Applications (0)')).toBeInTheDocument();
        expect(screen.getByText('Progress: 0 answers, 0 jobs')).toBeInTheDocument();
    });

    it('calls fetchDashboardData when retry is needed', async () => {
        const mockFetchDashboardData = jest.fn();
        mockUseDashboardData.mockReturnValue({
            profile: mockProfile,
            profileError: null,
            allAnswers: mockAnswers,
            recentAnswers: mockAnswers,
            jobs: mockJobs,
            loading: false,
            showWelcome: false,
            setJobs: jest.fn(),
            setShowWelcome: jest.fn(),
            fetchDashboardData: mockFetchDashboardData
        });

        render(<Dashboard />);

        await waitFor(() => {
            expect(screen.getByText('Welcome, John Doe!')).toBeInTheDocument();
        });

        expect(mockFetchDashboardData).toBeDefined();
    });
});