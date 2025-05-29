"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import enTranslations from '../translations/en.json';
import arTranslations from '../translations/ar.json';
import chTranslations from '../translations/ch.json';
import ruTranslations from '../translations/ru.json';

type Language = 'en' | 'ar' | 'ch' | 'ru' ;

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, params?: Record<string, number | string>) => string;
}

// Define translations type based on the JSON structure
type TranslationType = typeof enTranslations;

const translations: Record<Language, TranslationType> = {
  en: enTranslations,
  ar: arTranslations,
  ch: chTranslations,
  ru: ruTranslations
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>('en');

  useEffect(() => {
    // Load saved language preference from localStorage
    const savedLanguage = localStorage.getItem('language') as Language;
    if (savedLanguage && (savedLanguage === 'en' || savedLanguage === 'ar' || savedLanguage === 'ch' || savedLanguage === 'ru')) {
      setLanguage(savedLanguage);
      // Set initial document direction - only Arabic uses RTL
      document.documentElement.dir = savedLanguage === 'ar' ? 'rtl' : 'ltr';
    }
  }, []);

  const handleSetLanguage = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem('language', lang);
    // Update document direction - only Arabic uses RTL
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  };

  const t = (key: string, params?: Record<string, number | string>): string => {
    try {
      // Split the key by dots to access nested properties
      const keys = key.split('.');
      let value: any = translations[language];
      
      // Traverse the object using the keys
      for (const k of keys) {
        if (value && typeof value === 'object' && k in value) {
          value = value[k];
        } else {
          console.warn(`Translation key not found: ${key}`);
          return key;
        }
      }
      
      // If the value is a string, process any parameters
      if (typeof value === 'string') {
        if (params) {
          return Object.entries(params).reduce((str, [key, val]) => {
            return str.replace(new RegExp(`{{${key}}}`, 'g'), String(val));
          }, value);
        }
        return value;
      }
      
      console.warn(`Translation value is not a string: ${key}`);
      return key;
    } catch (error) {
      console.error(`Error accessing translation for key: ${key}`, error);
      return key;
    }
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage: handleSetLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
} 