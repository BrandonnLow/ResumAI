'use client'

import React from 'react';

interface LoadingProps {
    variant?: 'dots' | 'pulse' | 'wave' | 'morphing' | 'typewriter' | 'gradient';
    size?: 'sm' | 'md' | 'lg';
    text?: string;
    className?: string;
}

export default function Loading({
    variant = 'dots',
    size = 'md',
    text,
    className = ''
}: LoadingProps) {
    const sizeClasses = {
        sm: 'h-6 w-6',
        md: 'h-12 w-12',
        lg: 'h-16 w-16'
    };

    const textSizeClasses = {
        sm: 'text-sm',
        md: 'text-base',
        lg: 'text-lg'
    };

    const renderAnimation = () => {
        switch (variant) {
            case 'dots':
                return (
                    <div className="flex space-x-2">
                        <div className="w-3 h-3 bg-blue-400 rounded-full animate-bounce"></div>
                        <div className="w-3 h-3 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-3 h-3 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                );

            case 'pulse':
                return (
                    <div className="relative">
                        <div className={`${sizeClasses[size]} bg-blue-400 rounded-full animate-ping absolute`}></div>
                        <div className={`${sizeClasses[size]} bg-blue-600 rounded-full animate-pulse`}></div>
                    </div>
                );

            case 'wave':
                return (
                    <div className="flex space-x-1">
                        {[...Array(5)].map((_, i) => (
                            <div
                                key={i}
                                className="w-2 bg-blue-400 rounded-full animate-wave"
                                style={{
                                    height: '20px',
                                    animationDelay: `${i * 0.1}s`,
                                    animationDuration: '1s'
                                }}
                            ></div>
                        ))}
                    </div>
                );

            case 'morphing':
                return (
                    <div className={`${sizeClasses[size]} relative`}>
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-600 rounded-full animate-morph"></div>
                    </div>
                );

            case 'typewriter':
                return (
                    <div className="flex items-center space-x-1">
                        <span className="text-blue-400 font-mono">{'>'}</span>
                        <div className="flex">
                            <span className="text-white">Loading</span>
                            <span className="animate-pulse text-blue-400">|</span>
                        </div>
                    </div>
                );

            case 'gradient':
                return (
                    <div className={`${sizeClasses[size]} relative overflow-hidden rounded-full bg-gray-600`}>
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-400 to-transparent animate-shimmer"></div>
                    </div>
                );

            default:
                return (
                    <div className="flex space-x-2">
                        <div className="w-3 h-3 bg-blue-400 rounded-full animate-bounce"></div>
                        <div className="w-3 h-3 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-3 h-3 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                );
        }
    };

    return (
        <div className={`flex flex-col items-center justify-center ${className}`}>
            {renderAnimation()}
            {text && (
                <p className={`mt-4 text-gray-300 ${textSizeClasses[size]} animate-pulse`}>
                    {text}
                </p>
            )}
        </div>
    );
}

export const LoadingSpinner = ({ text, size = 'md' }: { text?: string; size?: 'sm' | 'md' | 'lg' }) => (
    <Loading variant="dots" size={size} text={text} />
);

export const LoadingPage = ({ text = "Loading..." }: { text?: string }) => (
    <div className="min-h-screen bg-gray-700 flex items-center justify-center">
        <Loading variant="morphing" size="lg" text={text} />
    </div>
);

export const LoadingCard = ({ text }: { text?: string }) => (
    <div className="bg-gray-800 border border-gray-600 rounded-lg p-8 text-center">
        <Loading variant="pulse" size="md" text={text} />
    </div>
);