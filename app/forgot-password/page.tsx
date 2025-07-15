'use client'

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../ui/Context/AuthContext';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import PageWrapper from '../ui/components/PageWrapper';

export default function ForgotPassword() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [emailSent, setEmailSent] = useState(false);
    const { resetPassword } = useAuth();
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!email.trim()) {
            toast.error('Please enter your email address');
            return;
        }

        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            toast.error('Please enter a valid email address');
            return;
        }

        try {
            setMessage('');
            setLoading(true);
            await resetPassword(email);
            setMessage('Check your email for password reset instructions');
            setEmailSent(true);
            toast.success('Password reset email sent successfully!');
        } catch (error: any) {
            console.error('Reset password error:', error);

            // Handle specific Firebase errors
            let errorMessage = 'Failed to send reset email. Please try again.';

            if (error.code === 'auth/user-not-found') {
                errorMessage = 'No account found with this email address.';
            } else if (error.code === 'auth/invalid-email') {
                errorMessage = 'Invalid email address.';
            } else if (error.code === 'auth/too-many-requests') {
                errorMessage = 'Too many requests. Please wait a moment and try again.';
            }

            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleResendEmail = async () => {
        if (!email.trim()) {
            toast.error('Please enter your email address first');
            return;
        }

        try {
            setLoading(true);
            await resetPassword(email);
            toast.success('Password reset email sent again!');
        } catch (error: any) {
            console.error('Resend email error:', error);
            toast.error('Failed to resend email. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <PageWrapper background="dark" className="min-h-screen flex items-center justify-center">
            <div className="max-w-md w-full space-y-8 bg-gray-800 p-10 rounded-xl shadow-lg transform transition-all border border-gray-600">
                <div>
                    <div className="flex justify-center">
                        <div className="h-20 w-20 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                            </svg>
                        </div>
                    </div>
                    <h2 className="mt-6 text-center text-3xl font-extrabold text-white">
                        Reset your password
                    </h2>
                    <p className="mt-2 text-center text-sm text-gray-400">
                        {emailSent
                            ? 'We\'ve sent you a password reset link'
                            : 'Enter your email address and we\'ll send you a link to reset your password'
                        }
                    </p>
                </div>

                {message && (
                    <div className="rounded-md bg-green-900/20 p-4 border border-green-600/30">
                        <div className="flex">
                            <div className="flex-shrink-0">
                                <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <div className="ml-3">
                                <p className="text-sm font-medium text-green-200">{message}</p>
                            </div>
                        </div>
                    </div>
                )}

                {!emailSent ? (
                    <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                        <div>
                            <label htmlFor="email-address" className="block text-sm font-medium text-gray-300">
                                Email address
                            </label>
                            <div className="mt-1 relative rounded-md shadow-sm">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                                    </svg>
                                </div>
                                <input
                                    id="email-address"
                                    name="email"
                                    type="email"
                                    autoComplete="email"
                                    required
                                    className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 pr-3 py-3 border border-gray-600 rounded-md text-white placeholder-gray-400 bg-gray-700"
                                    placeholder="Email address"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    disabled={loading}
                                />
                            </div>
                        </div>

                        <div>
                            <button
                                type="submit"
                                disabled={loading || !email.trim()}
                                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transform transition-all hover:scale-105 duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                            >
                                {loading ? (
                                    <div className="flex items-center">
                                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Sending...
                                    </div>
                                ) : (
                                    'Send Reset Email'
                                )}
                            </button>
                        </div>
                    </form>
                ) : (
                    <div className="mt-8 space-y-6">
                        <div className="text-center">
                            <div className="w-16 h-16 mx-auto bg-green-900/20 border border-green-600/30 rounded-full flex items-center justify-center mb-4">
                                <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                            </div>
                            <p className="text-gray-300 text-sm mb-4">
                                If an account with <strong>{email}</strong> exists, you'll receive a password reset email shortly.
                            </p>
                            <p className="text-gray-400 text-xs mb-6">
                                Don't see the email? Check your spam folder or wait a few minutes.
                            </p>
                        </div>

                        <div className="space-y-3">
                            <button
                                onClick={handleResendEmail}
                                disabled={loading}
                                className="w-full flex justify-center py-2 px-4 border border-gray-600 text-sm font-medium rounded-md text-gray-300 bg-gray-700 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                            >
                                {loading ? 'Sending...' : 'Resend Email'}
                            </button>

                            <button
                                onClick={() => {
                                    setEmailSent(false);
                                    setMessage('');
                                    setEmail('');
                                }}
                                className="w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-blue-400 bg-transparent hover:text-blue-300 focus:outline-none"
                            >
                                Try Different Email
                            </button>
                        </div>
                    </div>
                )}

                <div className="text-center">
                    <p className="text-sm text-gray-400">
                        Remember your password?{' '}
                        <Link href="/login" className="font-medium text-blue-400 hover:text-blue-300 transition-colors">
                            Sign in
                        </Link>
                    </p>
                </div>
            </div>
        </PageWrapper>
    );
}