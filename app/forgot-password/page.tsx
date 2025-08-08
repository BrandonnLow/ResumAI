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
    const [sent, setSent] = useState(false);
    const { resetPassword } = useAuth();
    const router = useRouter();

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!email.trim() || !email.includes('@')) {
            toast.error('Enter a valid email');
            return;
        }

        setLoading(true);

        try {
            await resetPassword(email);
            setSent(true);
            toast.success('Check your email!');
        } catch (error: any) {
            const msg = error.code === 'auth/user-not-found'
                ? 'Email not found'
                : 'Something went wrong';
            toast.error(msg);
        }

        setLoading(false);
    };

    const resend = async () => {
        if (!email.trim()) {
            toast.error('Enter email first');
            return;
        }

        setLoading(true);
        try {
            await resetPassword(email);
            toast.success('Sent again!');
        } catch (error) {
            toast.error('Failed to resend');
        }
        setLoading(false);
    };

    const reset = () => {
        setSent(false);
        setEmail('');
    };

    return (
        <PageWrapper background="dark" className="min-h-screen flex items-center justify-center">
            <div className="max-w-md w-full bg-gray-800 p-10 rounded-xl shadow-lg border border-gray-600">
                <div className="text-center">
                    <div className="h-20 w-20 mx-auto rounded-full bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                        </svg>
                    </div>
                    <h2 className="mt-6 text-3xl font-bold text-white">
                        Reset Password
                    </h2>
                    <p className="mt-2 text-sm text-gray-400">
                        {sent ? "We've sent you the link" : "Enter your email to get a reset link"}
                    </p>
                </div>

                {!sent ? (
                    <form onSubmit={onSubmit} className="mt-8 space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-300">
                                Email
                            </label>
                            <div className="mt-1 relative">
                                <input
                                    type="email"
                                    required
                                    className="w-full pl-10 pr-3 py-3 border border-gray-600 rounded-md text-white placeholder-gray-400 bg-gray-700 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="your@email.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    disabled={loading}
                                />
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                                    </svg>
                                </div>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading || !email.trim()}
                            className="w-full py-3 px-4 text-sm font-medium rounded-md text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 transition-all hover:scale-105 duration-200"
                        >
                            {loading ? 'Sending...' : 'Send Reset Link'}
                        </button>
                    </form>
                ) : (
                    <div className="mt-8 text-center space-y-6">
                        <div className="w-16 h-16 mx-auto bg-green-900/20 border border-green-600/30 rounded-full flex items-center justify-center">
                            <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                        </div>

                        <div>
                            <p className="text-gray-300 text-sm mb-2">
                                Reset link sent to <strong>{email}</strong>
                            </p>
                            <p className="text-gray-400 text-xs">
                                Check spam if you don't see it
                            </p>
                        </div>

                        <div className="space-y-3">
                            <button
                                onClick={resend}
                                disabled={loading}
                                className="w-full py-2 px-4 border border-gray-600 text-sm rounded-md text-gray-300 bg-gray-700 hover:bg-gray-600 focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                            >
                                {loading ? 'Sending...' : 'Send Again'}
                            </button>

                            <button
                                onClick={reset}
                                className="w-full py-2 px-4 text-sm text-blue-400 hover:text-blue-300"
                            >
                                Different Email
                            </button>
                        </div>
                    </div>
                )}

                <div className="mt-6 text-center">
                    <p className="text-sm text-gray-400">
                        Remember it?{' '}
                        <Link href="/login" className="text-blue-400 hover:text-blue-300">
                            Sign in
                        </Link>
                    </p>
                </div>
            </div>
        </PageWrapper>
    );
}