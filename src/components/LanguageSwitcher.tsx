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
    { code: 'ar', name: 'العربية', countryCode: 'AE' },
    { code: 'ch', name: '中文', countryCode: 'CN' },
    { code: 'ru', name: 'Русский', countryCode: 'RU' },
  ] as const;

  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
        className="text-muted-foreground hover:text-foreground hover:bg-accent"
      >
        <Globe className="h-4 w-4" />
      </Button>
      
      {isOpen && (
        <div className="fixed sm:absolute sm:right-0 left-0 sm:left-auto mt-2 w-[280px] sm:w-48 bg-popover border border-border rounded-lg shadow-lg z-[100] sm:origin-top-right origin-top-left transform-gpu mx-4 sm:mx-0">
          <div className="py-1 max-h-[80vh] overflow-y-auto">
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => {
                  setLanguage(lang.code);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center justify-between px-4 py-2 text-sm ${
                  language === lang.code
                    ? 'bg-primary/20 text-primary-foreground'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
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
                  <Check className="h-4 w-4 text-primary" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 