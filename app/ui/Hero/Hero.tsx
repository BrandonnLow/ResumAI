'use client'
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../Context/AuthContext';
import { useRouter } from 'next/navigation';

export default function Hero() {
  const [rotation, setRotation] = useState(0);
  const { currentUser, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const interval = setInterval(() => {
      setRotation(prev => (prev + 0.5) % 360);
    }, 50);

    return () => clearInterval(interval);
  }, []);

  const handleStartPracticing = () => {
    if (currentUser) {
      router.push('/dashboard');
    } else {
      // Redirect to register page for new users
      router.push('/register');
    }
  };

  if (loading) {
    return (
      <div className="flex mx-auto bg-gray-700 md:pt-8 h-screen items-center justify-center w-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <div className="flex mx-auto bg-gray-700 md:pt-8 h-screen items-center justify-center w-full">
      <div className="relative flex md:justify-center justify-end gap-y-3 md:flex-row flex-col mx-4">
        <div className="m-8 md:mt-0 text-center max-w-[500px]">
          <h1 className="text-4xl md:text-5xl pt-[30px] font-bold mb-4 text-white">
            Interview and Job AI Assistant
          </h1>
          <p className="text-gray-300 text-lg md:text-xl mt-2 mb-8 italic">
            We use modern powerful LLMs and Decoders to elevate your interview skills.
            Not sure what to work on? Don't worry our AI got you covered
          </p>

          {currentUser ? (
            <div className="space-y-4">
              <p className="text-gray-300 text-sm">
                Welcome back, {currentUser.email}!
              </p>
              <button
                onClick={handleStartPracticing}
                className="md:mt-6 px-8 py-3 bg-gradient-to-r from-gray-100 to-gray-400 text-gray-700 font-bold rounded-full shadow-lg hover:shadow-xl transform transition-all duration-300 hover:-translate-y-1 hover:scale-105"
              >
                Continue to Dashboard
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <button
                onClick={handleStartPracticing}
                className="md:mt-6 px-8 py-3 bg-gradient-to-r from-gray-100 to-gray-400 text-gray-700 font-bold rounded-full shadow-lg hover:shadow-xl transform transition-all duration-300 hover:-translate-y-1 hover:scale-105"
              >
                Start Practicing Now
              </button>
            </div>
          )}
        </div>
        <div
          className="relative mx-auto min-w-48 max-w-48 h-80 bg-gray-100 rounded-lg"
          style={{ transform: `perspective(1000px) rotateY(${rotation}deg)` }}
        >
          <div className={`p-6`}>
            <div className="w-24 h-24 rounded-full bg-gray-200 mx-auto mb-4"></div>
            <div className="h-4 bg-gray-300 rounded w-3/4 mx-auto mb-3"></div>
            <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
            <div className="h-3 bg-gray-300 rounded w-full mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-5/6 mb-2"></div>
            <div className="h-3 bg-gray-300 rounded w-full mb-4"></div>
          </div>
        </div>
      </div>
    </div>
  );
}