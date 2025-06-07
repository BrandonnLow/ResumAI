'use client'

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../ui/Context/AuthContext';

export default function ForgotPassword() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const { resetPassword } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            setMessage('');
            setError('');
            setLoading(true);
            await resetPassword(email);
            setMessage('Check your email for password reset instructions');
        } catch (error) {
            setError('Failed to reset password');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-700">
            <div className="max-w-md w-full bg-gray-800 p-8 rounded-lg shadow-lg">
                <h2 className="text-2xl font-bold text-white text-center mb-6">
                    Reset Password
                </h2>

                {error && (
                    <div className="bg-red-500 text-white p-3 rounded mb-4">
                        {error}
                    </div>
                )}

                {message && (
                    <div className="bg-green-500 text-white p-3 rounded mb-4">
                        {message}
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

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-blue-600 text-white p-3 rounded hover:bg-blue-700 disabled:opacity-50"
                    >
                        {loading ? 'Sending...' : 'Reset Password'}
                    </button>
                </form>

                <div className="text-center mt-4 text-white">
                    Remember your password?{' '}
                    <Link href="/login" className="text-blue-400 hover:text-blue-300">
                        Sign In
                    </Link>
                </div>
            </div>
        </div>
    );
}