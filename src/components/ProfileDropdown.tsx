import React, { useRef, useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { User, LogOut, Sparkles } from 'lucide-react';

export default function ProfileDropdown() {
  const { data: session } = useSession();
  const { t, language } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // Random token usage for demo (between 30-70%)
  const [tokenUsage] = useState(() => Math.floor(Math.random() * 40) + 30);
  // Demo days left for free trial
  const daysLeft = 3;

  // Check if current language is RTL (Arabic)
  const isRTL = language === 'ar';

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!session?.user) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
        className="text-muted-foreground hover:text-foreground hover:bg-accent"
      >
        <User className="h-4 w-4" />
      </Button>
      
      {isOpen && (
        <div 
          className={`fixed sm:absolute mt-2 w-72 bg-popover border border-border rounded-lg shadow-lg z-[100] transform-gpu mx-4 sm:mx-0
            ${isRTL 
              ? 'sm:left-0 sm:right-auto left-0 right-auto sm:origin-top-left origin-top-left' 
              : 'sm:right-0 sm:left-auto right-0 left-auto sm:origin-top-right origin-top-right'
            }`}
          dir={isRTL ? 'rtl' : 'ltr'}
        >
          <div className="p-4 space-y-4">
            {/* Profile Header */}
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-card-foreground truncate">
                  {session.user.name}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {session.user.email}
                </p>
              </div>
            </div>

            {/* Status Badge */}
            <div className="px-2 py-1 bg-primary/10 rounded-md inline-block">
              <span className="text-xs font-medium text-primary">
                {t('nav.profile.freeTrial', { days: daysLeft })}
              </span>
            </div>

            {/* Token Usage */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">{t('nav.profile.tokenUsage')}</span>
                <span className="font-medium text-card-foreground">{tokenUsage}%</span>
              </div>
              <div className="h-2 bg-accent rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary transition-all duration-300 ease-in-out"
                  style={{ width: `${tokenUsage}%` }}
                />
              </div>
            </div>

            {/* Upgrade Button - Only shown for Free Trial users */}
            <Button
              variant="default"
              className="w-full bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-primary-foreground shadow-md"
              onClick={() => {
                // TODO: Implement upgrade flow
                console.log('Upgrade clicked');
              }}
            >
              <Sparkles className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
              <span className="text-sm font-medium">{t('nav.profile.upgradeNow')}</span>
            </Button>

            {/* Logout Button */}
            <Button
              variant="ghost"
              className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={() => signOut()}
            >
              <LogOut className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
              <span className="text-sm">{t('nav.signOut')}</span>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
} 