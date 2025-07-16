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

  // State for call quota
  const [quota, setQuota] = useState<number | null>(null);
  const MAX_QUOTA = 180; // 3 minutes in seconds

  // Fetch quota on mount
  useEffect(() => {
    async function fetchQuota() {
      try {
        const res = await fetch('/api/conversations/tick', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tickSeconds: 0 }),
        });
        const data = await res.json();
        if (typeof data.remaining === 'number') {
          setQuota(data.remaining);
        } else {
          setQuota(null);
        }
      } catch {
        setQuota(null);
      }
    }
    if (session?.user) fetchQuota();
  }, [session?.user]);

  // Format quota as mm:ss
  function formatQuota(seconds: number | null) {
    if (seconds === null) return '--:--';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

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

            {/* Call Quota Progress */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Call Quota Remaining</span>
                <span className="font-medium text-card-foreground">{formatQuota(quota)} / 3:00</span>
              </div>
              <div className={`h-2 rounded-full overflow-hidden ${quota === 0 ? 'bg-red-200' : 'bg-accent'}`}>
                <div 
                  className={`h-full transition-all duration-300 ease-in-out ${quota === 0 ? 'bg-red-500 animate-pulse' : quota !== null && quota < 30 ? 'bg-yellow-400' : 'bg-primary'}`}
                  style={{ width: `${quota !== null ? Math.max(0, Math.min(100, (quota / MAX_QUOTA) * 100)) : 0}%` }}
                />
              </div>
              {/* Warning & Alert */}
              {quota === 0 && (
                <div className="mt-2 p-2 bg-red-100 text-red-700 rounded text-xs font-medium flex items-center gap-2">
                  <span>🚫 Your call quota has run out. Please upgrade to continue using voice features.</span>
                </div>
              )}
              {quota !== null && quota > 0 && quota < 15 && (
                <div className="mt-2 p-2 bg-yellow-200 text-yellow-900 border border-yellow-400 rounded text-xs font-medium flex items-center gap-2 animate-pulse">
                  <span>⚠️ Your call quota is critically low. Please upgrade soon to avoid interruption.</span>
                </div>
              )}
              {quota !== null && quota >= 15 && quota < 30 && (
                <div className="mt-2 p-2 bg-yellow-100 text-yellow-800 rounded text-xs font-medium flex items-center gap-2">
                  <span>⚠️ Your call quota is almost exhausted.</span>
                </div>
              )}
            </div>

            {/* Upgrade Button - Only shown for Free Trial users */}
            <Button
              variant="default"
              className={`w-full text-primary-foreground shadow-md ${quota === 0 ? 'bg-red-500 animate-pulse hover:bg-red-600' : 'bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90'}`}
              onClick={() => {
                window.open('https://dashboard.taxai.ae/dashboard/account?tab=Subscription', '_blank');
              }}
            >
              <Sparkles className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
              <span className="text-sm font-medium">Upgrade Now</span>
            </Button>

            {/* Logout Button */}
            <Button
              variant="ghost"
              className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={() => signOut()}
            >
              <LogOut className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
              <span className="text-sm">Sign Out</span>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
} 