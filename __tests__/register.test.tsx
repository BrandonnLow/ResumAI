import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import Register from '../app/register/page';
import { useAuth } from '../app/ui/Context/AuthContext';

const mockPush = jest.fn();
const mockRegister = jest.fn();

jest.mock('next/navigation', () => ({
    useRouter: () => ({
        push: mockPush,
    }),
}));

jest.mock('react-hot-toast');
jest.mock('../app/ui/Context/AuthContext');

const mockUseAuth = useAuth as jest.Mock;
const mockToast = toast as jest.Mocked<typeof toast>;

describe('Register Component', () => {
    const user = userEvent.setup();

    beforeEach(() => {
        jest.clearAllMocks();

        // Setup auth mock
        mockUseAuth.mockReturnValue({
            register: mockRegister,
        });

        // Setup toast mocks
        mockToast.success = jest.fn();
        mockToast.error = jest.fn();
    });

    it('renders registration form correctly', () => {
        render(<Register />);

        expect(screen.getByText('Create your account')).toBeInTheDocument();
        expect(screen.getByText('Join resumAI and start practicing for your interviews')).toBeInTheDocument();
        expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /sign up/i })).toBeInTheDocument();
        expect(screen.getByText(/already have an account/i)).toBeInTheDocument();
    });

    it('shows password mismatch error', async () => {
        render(<Register />);

        const emailInput = screen.getByLabelText(/email address/i);
        const passwordInput = screen.getByLabelText(/^password$/i);
        const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
        const submitButton = screen.getByRole('button', { name: /sign up/i });

        await user.type(emailInput, 'test@example.com');
        await user.type(passwordInput, 'password123');
        await user.type(confirmPasswordInput, 'password456');
        await user.click(submitButton);

        expect(mockToast.error).toHaveBeenCalledWith('Passwords do not match');
        expect(mockRegister).not.toHaveBeenCalled();
    });

    it('successfully registers user and redirects', async () => {
        mockRegister.mockResolvedValueOnce(undefined);

        render(<Register />);

        const emailInput = screen.getByLabelText(/email address/i);
        const passwordInput = screen.getByLabelText(/^password$/i);
        const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
        const submitButton = screen.getByRole('button', { name: /sign up/i });

        await user.type(emailInput, 'test@example.com');
        await user.type(passwordInput, 'password123');
        await user.type(confirmPasswordInput, 'password123');
        await user.click(submitButton);

        await waitFor(() => {
            expect(mockRegister).toHaveBeenCalledWith('test@example.com', 'password123');
        });

        await waitFor(() => {
            expect(mockToast.success).toHaveBeenCalledWith('Account created successfully!');
            expect(mockPush).toHaveBeenCalledWith('/profile/setup');
        });
    });

    it('handles registration error', async () => {
        const errorMessage = 'Email already in use';
        mockRegister.mockRejectedValueOnce(new Error(errorMessage));

        render(<Register />);

        const emailInput = screen.getByLabelText(/email address/i);
        const passwordInput = screen.getByLabelText(/^password$/i);
        const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
        const submitButton = screen.getByRole('button', { name: /sign up/i });

        await user.type(emailInput, 'test@example.com');
        await user.type(passwordInput, 'password123');
        await user.type(confirmPasswordInput, 'password123');
        await user.click(submitButton);

        await waitFor(() => {
            expect(mockToast.error).toHaveBeenCalledWith('Failed to create account. Please try again.');
        });
    });

    it('shows loading state during registration', async () => {
        mockRegister.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

        render(<Register />);

        const emailInput = screen.getByLabelText(/email address/i);
        const passwordInput = screen.getByLabelText(/^password$/i);
        const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
        const submitButton = screen.getByRole('button', { name: /sign up/i });

        await user.type(emailInput, 'test@example.com');
        await user.type(passwordInput, 'password123');
        await user.type(confirmPasswordInput, 'password123');
        await user.click(submitButton);

        expect(screen.getByText('Creating account...')).toBeInTheDocument();
        expect(submitButton).toBeDisabled();
    });

    it('validates required fields', () => {
        render(<Register />);

        const emailInput = screen.getByLabelText(/email address/i);
        const passwordInput = screen.getByLabelText(/^password$/i);
        const confirmPasswordInput = screen.getByLabelText(/confirm password/i);

        // Check that fields are marked as required
        expect(emailInput).toBeRequired();
        expect(passwordInput).toBeRequired();
        expect(confirmPasswordInput).toBeRequired();
    });

    it('shows password requirements', () => {
        render(<Register />);

        expect(screen.getByText('Password must be at least 6 characters long')).toBeInTheDocument();
    });

    it('has link to login page', () => {
        render(<Register />);

        const loginLink = screen.getByRole('link', { name: /sign in/i });
        expect(loginLink).toHaveAttribute('href', '/login');
    });
});