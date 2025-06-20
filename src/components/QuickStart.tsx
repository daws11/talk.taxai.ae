'use client';
import React, { useEffect, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import ReactCountryFlag from "react-country-flag";
import { useSession } from 'next-auth/react';

const languages = [
  { code: 'en', name: 'English', countryCode: 'GB', db: 'english' },
  { code: 'ar', name: 'العربية', countryCode: 'AE', db: 'arabic' },
  { code: 'ch', name: '中文', countryCode: 'CN', db: 'chinese' },
  { code: 'ru', name: 'Русский', countryCode: 'RU', db: 'russian' },
] as const;

export default function QuickStart() {
  const { setLanguage } = useLanguage();
  const [show, setShow] = useState(false);
  const { data: session, status } = useSession();

  console.log("SESSION DI QUICKSTART", session, status);

  useEffect(() => {
    const userLang = (session?.user as any)?.language;
    console.log("QuickStart check:", {
      status,
      user: session?.user,
      userLang,
      quickStartShown: localStorage.getItem('quickStartShown')
    });
    if (
      status === 'authenticated' &&
      session?.user &&
      (!('language' in (session.user as any)) || (session.user as any).language === null) &&
      !localStorage.getItem('quickStartShown')
    ) {
      setShow(true);
    }
  }, [session, status]);

  const handleSelect = async (code: string, dbLang: string) => {
    setLanguage(code as any);
    localStorage.setItem('quickStartShown', 'true');
    setShow(false);
    // Simpan ke database
    await fetch('/api/user/language', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ language: dbLang }),
    });
  };

  // Jangan render apapun jika belum login, status loading, atau tidak perlu tampil
  if (status !== 'authenticated' || !session?.user || !show) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50">
      <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-lg p-8 max-w-sm w-full text-center">
        <h2 className="text-xl font-bold mb-4">Quick Start</h2>
        <p className="mb-6">Select your preferred language:</p>
        <div className="flex flex-col gap-3">
          {languages.map(lang => (
            <button
              key={lang.code}
              onClick={() => handleSelect(lang.code, lang.db)}
              className="flex items-center gap-3 px-4 py-2 rounded border hover:bg-accent transition"
            >
              <ReactCountryFlag
                countryCode={lang.countryCode}
                svg
                style={{ width: '1.5em', height: '1.5em' }}
                title={lang.name}
              />
              <span>{lang.name}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
} 