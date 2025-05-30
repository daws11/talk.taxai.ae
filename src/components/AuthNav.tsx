"use client";

import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/button';
import { Globe, Sun, Moon } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

type Language = 'en' | 'ar' | 'ch' | 'ru';

const languages: { code: Language; name: string }[] = [
  { code: 'en', name: 'English' },
  { code: 'ar', name: 'العربية' },
  { code: 'ch', name: '中文' },
  { code: 'ru', name: 'Русский' },
];

export default function AuthNav() {
  const { t, language, setLanguage } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const [isLanguageOpen, setIsLanguageOpen] = useState(false);
  const languageDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (languageDropdownRef.current && !languageDropdownRef.current.contains(event.target as Node)) {
        setIsLanguageOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="fixed top-4 right-4 flex items-center gap-2 z-50">
      <div className="relative" ref={languageDropdownRef}>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsLanguageOpen(!isLanguageOpen)}
          className="text-muted-foreground hover:text-foreground hover:bg-accent"
        >
          <Globe className="h-4 w-4" />
        </Button>
        {isLanguageOpen && (
          <div className="absolute right-0 mt-2 w-48 bg-popover border border-border rounded-lg shadow-lg z-[100] sm:origin-top-right origin-top-left transform-gpu">
            <div className="py-1 max-h-[80vh] overflow-y-auto">
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => {
                    setLanguage(lang.code);
                    setIsLanguageOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-4 py-2 text-sm ${
                    language === lang.code
                      ? 'bg-primary/20 text-primary-foreground'
                      : 'text-card-foreground hover:bg-accent/50'
                  }`}
                >
                  <span>{lang.name}</span>
                  {language === lang.code && (
                    <span className="text-primary">✓</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleTheme}
        className="text-muted-foreground hover:text-foreground hover:bg-accent"
      >
        {theme === 'dark' ? (
          <Sun className="h-4 w-4" />
        ) : (
          <Moon className="h-4 w-4" />
        )}
      </Button>
    </div>
  );
} 