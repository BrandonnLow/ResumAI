'use client'

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../ui/Context/AuthContext';
import { useRouter } from 'next/navigation';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const { login } = useAuth();
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            setError('');
            setLoading(true);
            await login(email, password);
            router.push('/dashboard');
        } catch (error) {
            setError('Failed to log in');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-700">
            <div className="max-w-md w-full bg-gray-800 p-8 rounded-lg shadow-lg">
                <h2 className="text-2xl font-bold text-white text-center mb-6">
                    Sign In
                </h2>

                {error && (
                    <div className="bg-red-500 text-white p-3 rounded mb-4">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-white text-sm font-bold mb-2">
                            Email
                        </label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full p-3 border rounded bg-gray-700 text-white border-gray-600"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-white text-sm font-bold mb-2">
                            Password
                        </label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full p-3 border rounded bg-gray-700 text-white border-gray-600"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-blue-600 text-white p-3 rounded hover:bg-blue-700 disabled:opacity-50"
                    >
                        {loading ? 'Signing In...' : 'Sign In'}
                    </button>
                </form>

                <div className="text-center mt-4">
                    <Link href="/forgot-password" className="text-blue-400 hover:text-blue-300">
                        Forgot Password?
                    </Link>
                </div>

                <div className="text-center mt-4 text-white">
                    Don't have an account?{' '}
                    <Link href="/register" className="text-blue-400 hover:text-blue-300">
                        Sign Up
                    </Link>
                </div>
            </div>
        </div>
    );
}