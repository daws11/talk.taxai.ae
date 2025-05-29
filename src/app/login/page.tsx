"use client";

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError('Invalid email or password');
      } else {
        router.push('/');
        router.refresh();
      }
    } catch (error) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-900 via-gray-900 to-black px-3 sm:px-4 lg:px-6 py-6 sm:py-8">
      <div className="w-full max-w-[85%] sm:max-w-sm md:max-w-md p-5 sm:p-6 md:p-7 space-y-5 sm:space-y-6 bg-gray-900/50 backdrop-blur-sm rounded-xl border border-gray-800 shadow-xl">
        <div className="text-center">
          <div className="flex flex-col items-center justify-center gap-3 sm:gap-4 mb-4 sm:mb-6">
            <div className="bg-transparent rounded-full p-1.5 ring-1.5 ring-indigo-500/20 transform hover:scale-105 transition-transform duration-200">
              <Image 
                src="/logo-yosr.png" 
                alt="YOSR Logo" 
                width={60}
                height={60}
                className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-full"
                style={{ background: 'transparent' }} 
                priority
              />
            </div>
            <div className="flex flex-col items-center justify-center space-y-0.5 sm:space-y-1">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-indigo-400 leading-tight tracking-tight drop-shadow-lg">
                YOSR
              </h1>
              <p className="text-sm sm:text-base md:text-lg font-medium text-indigo-200/90 tracking-wide max-w-[240px] sm:max-w-xs text-center">
                Your Voice-Powered AI Tax Assistant
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 sm:mt-6 space-y-4 sm:space-y-5">
          <div className="space-y-3 sm:space-y-4">
            <div>
              <label htmlFor="email" className="block text-xs sm:text-sm font-medium text-gray-300 mb-1 sm:mb-1.5 tracking-wide">
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="mt-1 block w-full px-3 py-2 sm:py-2.5 bg-gray-800/80 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-1.5 focus:ring-indigo-500 focus:border-transparent text-sm shadow-sm transition-all duration-200"
                placeholder="Enter your email"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-xs sm:text-sm font-medium text-gray-300 mb-1 sm:mb-1.5 tracking-wide">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="mt-1 block w-full px-3 py-2 sm:py-2.5 bg-gray-800/80 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-1.5 focus:ring-indigo-500 focus:border-transparent text-sm shadow-sm transition-all duration-200"
                placeholder="Enter your password"
              />
            </div>
          </div>

          {error && (
            <div className="text-red-400 text-xs text-center bg-red-900/20 p-2 rounded-lg font-medium tracking-wide border border-red-900/30">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 sm:py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold text-sm sm:text-base focus:outline-none focus:ring-1.5 focus:ring-indigo-500 focus:ring-offset-1 focus:ring-offset-gray-900 disabled:opacity-50 disabled:cursor-not-allowed shadow-md transition-all duration-200 transform hover:scale-[1.01] active:scale-[0.99]"
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span className="text-xs sm:text-sm">Signing in...</span>
              </span>
            ) : (
              <span className="text-xs sm:text-sm">Sign in</span>
            )}
          </button>

          <p className="text-center text-xs sm:text-sm text-gray-400 mt-3 sm:mt-4">
            Don't have an account?{' '}
            <Link 
              href="/register" 
              className="text-indigo-400 hover:text-indigo-300 font-semibold transition-colors duration-200 hover:underline inline-block"
            >
              Register here
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
} 