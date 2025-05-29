import React, { useRef, useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Globe, ChevronDown, Check } from 'lucide-react';
import ReactCountryFlag from "react-country-flag";

export default function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const languages = [
    { code: 'en', name: 'English', countryCode: 'GB' },
    { code: 'ar', name: 'العربية', countryCode: 'SA' },
    { code: 'ch', name: '中文', countryCode: 'CN' },
    { code: 'ru', name: 'Русский', countryCode: 'RU' },
  ] as const;

  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
        className="text-gray-400 hover:text-white hover:bg-gray-800"
      >
        <Globe className="h-4 w-4" />
      </Button>
      
      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-gray-800 border border-gray-700 rounded-lg shadow-lg z-50">
          <div className="py-1">
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => {
                  setLanguage(lang.code);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center justify-between px-4 py-2 text-sm ${
                  language === lang.code
                    ? 'bg-indigo-500/20 text-white'
                    : 'text-gray-300 hover:bg-gray-700/50'
                }`}
              >
                <span className="flex items-center gap-2">
                  <ReactCountryFlag
                    countryCode={lang.countryCode}
                    svg
                    style={{
                      width: '1.2em',
                      height: '1.2em',
                    }}
                    title={lang.name}
                  />
                  <span>{lang.name}</span>
                </span>
                {language === lang.code && (
                  <Check className="h-4 w-4 text-indigo-400" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 