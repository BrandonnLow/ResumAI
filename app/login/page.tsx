'use client'

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../ui/Context/AuthContext';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import PageWrapper from '../ui/components/PageWrapper';

export default function Login() {
    const [email, setEmail] = useState('');
    const [pwd, setPwd] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { login } = useAuth();
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!email.trim() || !pwd.trim()) {
            toast.error('Please fill in all fields');
            return;
        }

        setIsLoading(true);

        try {
            await login(email, pwd);
            toast.success('Welcome back!');
            router.push('/dashboard');
        } catch (err: any) {
            console.error('Login failed:', err);

            let msg = 'Login failed. Please try again.';

            if (err.code === 'auth/invalid-credential') {
                msg = 'Invalid email or password.';
            } else if (err.code === 'auth/user-not-found') {
                msg = 'No account found with this email.';
            } else if (err.code === 'auth/wrong-password') {
                msg = 'Incorrect password.';
            } else if (err.code === 'auth/too-many-requests') {
                msg = 'Too many attempts. Try again later.';
            }

            toast.error(msg);
        }
        setIsLoading(false);
    };

    return (
        <PageWrapper background="dark" className="min-h-screen flex items-center justify-center">
            <div className="max-w-md w-full bg-gray-800 p-10 rounded-xl shadow-lg border border-gray-600">
                <div>
                    <div className="flex justify-center">
                        <div className="h-20 w-20 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                        </div>
                    </div>
                    <h2 className="mt-6 text-center text-3xl font-extrabold text-white">
                        Welcome Back
                    </h2>
                    <p className="mt-2 text-center text-sm text-gray-400">
                        Sign in to access your interview prep dashboard
                    </p>
                </div>

                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    <div className="space-y-10">
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                                </svg>
                            </div>
                            <input
                                id="email"
                                type="email"
                                autoComplete="email"
                                required
                                className="peer focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 pr-3 py-3 border border-gray-600 rounded-md text-white bg-gray-700 placeholder-transparent"
                                placeholder="Email address"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                            <label htmlFor="email" className="absolute left-10 -top-2.5 text-gray-300 text-sm transition-all peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 peer-placeholder-shown:top-3 peer-focus:-top-2.5 peer-focus:text-sm peer-focus:text-blue-400 bg-gray-800 px-1">
                                Email address
                            </label>
                        </div>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                            </div>
                            <input
                                id="password"
                                type="password"
                                autoComplete="current-password"
                                required
                                className="peer focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 pr-3 py-3 border border-gray-600 rounded-md text-white bg-gray-700 placeholder-transparent"
                                placeholder="Password"
                                value={pwd}
                                onChange={(e) => setPwd(e.target.value)}
                            />
                            <label htmlFor="password" className="absolute left-10 -top-2.5 text-gray-300 text-sm transition-all peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 peer-placeholder-shown:top-3 peer-focus:-top-2.5 peer-focus:text-sm peer-focus:text-blue-400 bg-gray-800 px-1">
                                Password
                            </label>
                        </div>
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="flex items-center">
                            <input
                                id="remember"
                                type="checkbox"
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-600 rounded bg-gray-700"
                            />
                            <label htmlFor="remember" className="ml-2 block text-sm text-gray-300">
                                Remember me
                            </label>
                        </div>
                        <div className="text-sm">
                            <Link href="/forgot-password" className="font-medium text-blue-400 hover:text-blue-300">
                                Forgot password?
                            </Link>
                        </div>
                    </div>

                    <div>
                        <button
                            type="submit"
                            disabled={isLoading || !email.trim() || !pwd.trim()}
                            className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transform transition-all hover:scale-105 duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                        >
                            {isLoading ? (
                                <div className="flex items-center">
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Signing in...
                                </div>
                            ) : (
                                'Sign in'
                            )}
                        </button>
                    </div>

                    <div className="text-center">
                        <p className="text-sm text-gray-400">
                            Don't have an account?{' '}
                            <Link href="/register" className="font-medium text-blue-400 hover:text-blue-300">
                                Sign up
                            </Link>
                        </p>
                    </div>
                </form>
            </div>
        </PageWrapper>
    );
}