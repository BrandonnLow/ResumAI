import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import toast from 'react-hot-toast';
import Profile from '../app/profile/page';
import { getUserProfile, updateUserProfile } from '../app/Services/firebase/firestore';
import { beautifyProfile } from '../app/Services/openai/functions';

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
    getUserProfile: jest.fn(),
    updateUserProfile: jest.fn(),
}));

jest.mock('../app/Services/openai/functions', () => ({
    beautifyProfile: jest.fn(),
}));

// Mock the AuthContext
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

jest.mock('../app/ui/components/Loading', () => ({
    LoadingPage: ({ text }: { text: string }) => <div data-testid="loading">{text}</div>,
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
const mockGetUserProfile = getUserProfile as jest.Mock;
const mockUpdateUserProfile = updateUserProfile as jest.Mock;
const mockBeautifyProfile = beautifyProfile as jest.Mock;
const mockToast = toast as jest.Mocked<typeof toast>;

// Mock data
const mockUserProfile = {
    uid: 'test-user-id',
    name: 'John Doe',
    email: 'john@example.com',
    phone: '+1234567890',
    location: 'New York, NY',
    summary: 'Software Engineer with 5 years experience',
    education: [
        {
            id: 'edu1',
            institution: 'University of Technology',
            degree: 'Bachelor',
            field: 'Computer Science',
            startDate: '2018-09-01',
            endDate: '2022-05-01',
            gpa: '3.8'
        }
    ],
    workExperience: [
        {
            id: 'work1',
            company: 'Tech Corp',
            position: 'Software Engineer',
            startDate: '2022-06-01',
            endDate: '2024-01-01',
            description: ['Developed web applications', 'Led team of 3 developers']
        }
    ],
    projects: [],
    skills: [
        {
            id: 'skill1',
            name: 'JavaScript',
            level: 'Advanced'
        }
    ],
    extracurriculars: [],
    additionalInfo: 'Additional information about the user',
    createdAt: new Date(),
    updatedAt: new Date()
};

describe('Profile Component', () => {
    const user = userEvent.setup();

    beforeEach(() => {
        jest.clearAllMocks();
        // Reset all mock functions
        mockGetUserProfile.mockReset();
        mockUpdateUserProfile.mockReset();
        mockBeautifyProfile.mockReset();

        // Reset toast mocks
        mockToast.success.mockReset();
        mockToast.error.mockReset();
        mockToast.loading.mockReset();
        mockToast.dismiss.mockReset();
    });

    it('renders loading state initially', () => {
        mockGetUserProfile.mockReturnValue(new Promise(() => { }));

        render(<Profile />);

        expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('renders profile data when loaded', async () => {
        mockGetUserProfile.mockResolvedValue(mockUserProfile);

        render(<Profile />);

        await waitFor(() => {
            expect(screen.getByText('Your Profile')).toBeInTheDocument();
        }, { timeout: 3000 });

        expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument();
        expect(screen.getByDisplayValue('john@example.com')).toBeInTheDocument();
    });

    it('redirects to setup if no profile exists', async () => {
        mockGetUserProfile.mockResolvedValue(null);

        render(<Profile />);

        await waitFor(() => {
            expect(mockPush).toHaveBeenCalledWith('/profile/setup');
        }, { timeout: 3000 });
    });

    it('updates profile successfully', async () => {
        mockGetUserProfile.mockResolvedValue(mockUserProfile);
        mockUpdateUserProfile.mockResolvedValue(undefined);

        render(<Profile />);

        await waitFor(() => {
            expect(screen.getByText('Your Profile')).toBeInTheDocument();
        }, { timeout: 3000 });

        await waitFor(() => {
            expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument();
        });

        const nameInput = screen.getByDisplayValue('John Doe');
        await user.clear(nameInput);
        await user.type(nameInput, 'Jane Doe');

        const saveButton = await waitFor(() => {
            const buttons = screen.getAllByRole('button');
            return buttons.find(button =>
                button.textContent?.toLowerCase().includes('save')
            );
        });

        if (saveButton) {
            await user.click(saveButton);

            await waitFor(() => {
                expect(mockUpdateUserProfile).toHaveBeenCalled();
                expect(mockToast.success).toHaveBeenCalledWith('Profile updated successfully!');
            });
        }
    });

    it('beautifies profile with AI', async () => {
        mockGetUserProfile.mockResolvedValue(mockUserProfile);
        const enhancedProfile = {
            ...mockUserProfile,
            summary: 'Enhanced summary'
        };
        mockBeautifyProfile.mockResolvedValue(enhancedProfile);

        render(<Profile />);

        // Wait for the component to load completely
        await waitFor(() => {
            expect(screen.getByText('Enhance My Profile with AI')).toBeInTheDocument();
        }, { timeout: 3000 });

        const beautifyButton = await waitFor(() =>
            screen.getByRole('button', { name: /enhance with ai magic/i })
        );

        await user.click(beautifyButton);

        await waitFor(() => {
            expect(mockBeautifyProfile).toHaveBeenCalled();
        });
    });

    it('displays education section', async () => {
        mockGetUserProfile.mockResolvedValue(mockUserProfile);

        render(<Profile />);

        await waitFor(() => {
            expect(screen.getByText('Education')).toBeInTheDocument();
        }, { timeout: 3000 });

        expect(screen.getByText('Bachelor in Computer Science')).toBeInTheDocument();
        expect(screen.getByText('University of Technology')).toBeInTheDocument();
    });

    it('displays work experience section', async () => {
        mockGetUserProfile.mockResolvedValue(mockUserProfile);

        render(<Profile />);

        await waitFor(() => {
            expect(screen.getByText('Work Experience')).toBeInTheDocument();
        }, { timeout: 3000 });

        expect(screen.getByText('Software Engineer')).toBeInTheDocument();
        expect(screen.getByText('Tech Corp')).toBeInTheDocument();
    });

    it('displays skills section', async () => {
        mockGetUserProfile.mockResolvedValue(mockUserProfile);

        render(<Profile />);

        await waitFor(() => {
            expect(screen.getByText('Skills')).toBeInTheDocument();
        }, { timeout: 3000 });

        expect(screen.getByText('JavaScript')).toBeInTheDocument();
    });

    it('handles profile loading error gracefully', async () => {
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => { });

        mockGetUserProfile.mockRejectedValue(new Error('Failed to load profile'));

        render(<Profile />);

        await waitFor(() => {
            expect(mockToast.error).toHaveBeenCalledWith('Failed to load your profile. Please try again.');
        }, { timeout: 3000 });

        consoleSpy.mockRestore();
    });

    it('shows empty state for sections without data', async () => {
        const profileWithoutData = {
            ...mockUserProfile,
            education: [],
            workExperience: [],
            projects: [],
            skills: []
        };

        mockGetUserProfile.mockResolvedValue(profileWithoutData);

        render(<Profile />);

        await waitFor(() => {
            expect(screen.getByText('Education')).toBeInTheDocument();
        }, { timeout: 3000 });

        expect(screen.getByText('No education information added yet.')).toBeInTheDocument();
        expect(screen.getByText('No work experience added yet.')).toBeInTheDocument();
        expect(screen.getByText('No projects added yet.')).toBeInTheDocument();
        expect(screen.getByText('No skills added yet.')).toBeInTheDocument();
    });
});