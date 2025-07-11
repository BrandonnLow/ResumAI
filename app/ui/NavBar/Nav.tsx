'use client'

import { usePathname } from "next/navigation";
import React from "react";
import Image from "next/image";
import biglogo from '../../../public/logolong.png'
import smalllogo from '../../../public/logoshort.png'
import { useAuth } from '../Context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const allNavigation = [
    { name: 'Dashboard', href: '/dashboard', current: false },
    { name: 'Practice', href: '/practice/setup', current: false },
    { name: 'Answers', href: '/answers', current: false },
    { name: 'Goals', href: '/goals', current: false },
    { name: 'Jobs', href: '/jobs', current: false },
    { name: 'Profile', href: '/profile', current: false },
];

const profileOnlyNavigation = [
    { name: 'Profile', href: '/profile/setup', current: false },
];

export default function Nav() {
    const { currentUser, logout, profileComplete, profileLoading } = useAuth();
    const router = useRouter();

    function classNames(...classes: any) {
        return classes.filter(Boolean).join(' ')
    }

    const pathname = usePathname()

    const getPagePath = (string: string): string => {
        if (!string || string.length < 2) return '';
        const newstring = string.slice(1);
        const index = newstring.indexOf('/');
        return index === -1 ? newstring : newstring.slice(0, index);
    }

    const handleLogout = async () => {
        try {
            await logout();
            router.push('/');
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    const isAuthPage = pathname === '/login' || pathname === '/register' || pathname === '/forgot-password';

    const getNavigationItems = () => {
        if (!currentUser || isAuthPage || profileLoading) {
            return [];
        }

        if (profileComplete) {
            return allNavigation;
        }

        return profileOnlyNavigation;
    };

    const navigation = getNavigationItems();

    return (
        <nav className="h-16">
            <div className="flex space-x-4 bg-[#0a0a0a]  pl-1 md:pl-3 py-4 justify-between h-full items-center">
                <div className="max-w-[90%] flex flex-row items-center">
                    <Link href="/">
                        <Image src={smalllogo} width={80} height={50} className="my-1 md:hidden block py-1 flex-shrink-0 min-w-[65px] min-h-[48px] max-w-[65px] max-h-[48px]" alt="Logo" />
                        <Image src={biglogo} width={270} height={50} className="hidden md:block py-1 flex-shrink-0 min-w-[180px] min-h-[50px] max-w-[180px] max-h-[50px]" alt="Logo" />
                    </Link>

                    {navigation.length > 0 && (
                        <div className="flex flex-row sm:space-x-4 ml-2 space-x-[1px] py-3">
                            {navigation.map((item) => {
                                const isActive = getPagePath(pathname) === getPagePath(item.href) ||
                                    (item.name === 'Profile' && (pathname === '/profile' || pathname === '/profile/setup'));

                                return (
                                    <Link
                                        key={item.name}
                                        href={item.href}
                                        className={classNames(
                                            isActive
                                                ? 'bg-gray-600 text-gray-300'
                                                : 'text-gray-500 hover:bg-gray-600 hover:text-gray-300',
                                            'group flex gap-x-3 rounded-md p-2 text-sm font-semibold leading-6 transition-colors'
                                        )}
                                    >
                                        {item.name}
                                    </Link>
                                );
                            })}

                            {currentUser && !profileComplete && (
                                <div className="flex items-center ml-4 px-3 py-1 bg-blue-900/20 border border-blue-600/30 rounded-full">
                                    <div className="w-2 h-2 bg-blue-400 rounded-full mr-2 animate-pulse"></div>
                                    <span className="text-xs text-blue-300">Complete Setup</span>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {!isAuthPage && (
                    <div className="flex items-center space-x-3">
                        {currentUser ? (
                            <div className="flex items-center space-x-3">
                                <span className="hidden lg:block text-gray-400 text-sm truncate max-w-32">
                                    {currentUser.email}
                                </span>
                                <button
                                    className="text-gray-300 hover:text-white pr-3 py-2 rounded-md text-sm font-medium transition-colors"
                                    onClick={handleLogout}
                                >
                                    Logout
                                </button>
                            </div>
                        ) : (
                            <button
                                className="bg-gradient-to-r from-gray-100 to-gray-400 text-gray-700 font-semibold px-4 rounded-full hover:from-gray-200 hover:to-gray-500 transition-all duration-200 transform hover:scale-105"
                                onClick={() => router.push('/login')}
                            >
                                Login
                            </button>
                        )}
                    </div>
                )}
            </div>
        </nav>
    )
}