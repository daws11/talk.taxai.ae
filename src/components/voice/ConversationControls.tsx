import React from 'react';
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Volume2, VolumeX, Settings, Loader2 } from "lucide-react";
import { useLanguage } from '@/contexts/LanguageContext';

interface ConversationControlsProps {
  isSpeaking: boolean;
  isMuted: boolean;
  isConnecting: boolean;
  isConversationActive: boolean;
  isEndingConversation: boolean;
  onStartConversation: () => void;
  onEndConversation: () => void;
  onToggleMute: () => void;
  onOpenSettings: () => void;
  errorMessage: string;
  isBrowserSupported: boolean;
  hasPermission: boolean;
}

const ConversationControls: React.FC<ConversationControlsProps> = ({
  isSpeaking,
  isMuted,
  isConnecting,
  isConversationActive,
  isEndingConversation,
  onStartConversation,
  onEndConversation,
  onToggleMute,
  onOpenSettings,
  errorMessage,
  isBrowserSupported,
  hasPermission,
}) => {
  const { t } = useLanguage();

  // Disable buttons when there's an error or missing permissions
  const isDisabled = !isBrowserSupported || !hasPermission || !!errorMessage;

  return (
    <div className="flex flex-col items-center space-y-4 w-full">
      {/* Error message */}
      {errorMessage && (
        <div className="text-red-500 text-sm text-center p-2 bg-red-50 rounded-md w-full">
          {errorMessage}
        </div>
      )}

      {/* Browser support and permission errors */}
      {!isBrowserSupported && (
        <div className="text-yellow-600 text-sm text-center p-2 bg-yellow-50 rounded-md w-full">
          {t('errors.browserNotSupported')}
        </div>
      )}
      {!hasPermission && !errorMessage && (
        <div className="text-yellow-600 text-sm text-center p-2 bg-yellow-50 rounded-md w-full">
          {t('errors.microphoneAccessRequired')}
        </div>
      )}

      {/* Main control buttons */}
      <div className="flex items-center justify-center space-x-4 w-full">
        {/* Settings button */}
        {/* <Button
          variant="outline"
          size="icon"
          onClick={onOpenSettings}
          disabled={isDisabled}
          aria-label={t('settings.title')}
        >
          <Settings className="h-5 w-5" />
        </Button> */}

        {/* Start/End conversation button - Larger and more responsive */}
        <Button
          className={`relative p-0 rounded-full transition-all duration-200 ease-in-out
            ${isConversationActive 
              ? 'bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/30' 
              : 'bg-primary hover:bg-primary/90 shadow-lg shadow-primary/30'}
            h-20 w-20 sm:h-24 sm:w-24 md:h-28 md:w-28 lg:h-32 lg:w-32
            flex items-center justify-center
            active:scale-95 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2
            ${isConversationActive ? 'focus:ring-red-500' : 'focus:ring-primary'}
          `}
          onClick={isConversationActive ? onEndConversation : onStartConversation}
          disabled={isDisabled || (isConversationActive ? isEndingConversation : isConnecting)}
          aria-label={isConversationActive ? t('controls.endConversation') : t('controls.startConversation')}
        >
          <div className="flex flex-col items-center justify-center">
            {isConversationActive ? (
              isEndingConversation ? (
                <Loader2 className="h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 animate-spin" />
              ) : (
                <MicOff className="h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12" />
              )
            ) : isConnecting ? (
              <Loader2 className="h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 animate-spin" />
            ) : (
              <Mic className="h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12" />
            )}
            <span className="sr-only">
              {isConversationActive ? t('controls.endConversation') : t('controls.startConversation')}
            </span>
          </div>
          {/* Pulsing animation ring when active */}
          {isConversationActive && (
            <span className="absolute inset-0 rounded-full bg-inherit opacity-75 animate-ping"></span>
          )}
        </Button>

        {/* Mute/Unmute button */}
        {/* <Button
          variant="outline"
          size="icon"
          onClick={onToggleMute}
          disabled={!isConversationActive || isDisabled}
          aria-label={isMuted ? t('controls.unmute') : t('controls.mute')}
        >
          {isMuted ? (
            <VolumeX className="h-5 w-5" />
          ) : (
            <Volume2 className="h-5 w-5" />
          )}
        </Button> */}
      </div>

      {/* Status indicator with visual feedback */}
      <div className="mt-2 min-h-5">
        {isConversationActive ? (
          <div className="flex items-center justify-center space-x-2">
            {/* Animated indicator when speaking/listening */}
            <div className={`flex items-center space-x-1 ${isSpeaking ? 'text-blue-500' : 'text-green-500'}`}>
              {isSpeaking ? (
                // Pulsing animation for listening state
                <div className="flex space-x-1">
                  <span className="h-2 w-2 bg-current rounded-full animate-pulse" style={{ animationDelay: '0ms' }}></span>
                  <span className="h-2 w-2 bg-current rounded-full animate-pulse" style={{ animationDelay: '150ms' }}></span>
                  <span className="h-2 w-2 bg-current rounded-full animate-pulse" style={{ animationDelay: '300ms' }}></span>
                </div>
              ) : (
                // Static indicator for speaking state
                <div className="h-2 w-2 bg-current rounded-full"></div>
              )}
              <span className="text-sm font-medium">
                {isSpeaking ? t('status.listening') : t('status.speaking')}
              </span>
            </div>
          </div>
        ) : (
          // Empty state with minimum height to prevent layout shift
          <div className="h-5"></div>
        )}
      </div>
        <div className="mt-8 text-center space-y-3 px-2">
          <p className="text-xs sm:text-sm text-muted-foreground leading-tight">
            {t('voice.microphoneRequired')}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 text-xs sm:text-sm text-muted-foreground">
            <div className="flex items-center justify-center sm:justify-start">
              <span className="w-2 h-2 min-w-[8px] bg-green-500 rounded-full mr-2 flex-shrink-0"></span>
              <span className="truncate">{t('voice.realTimeProcessing')}</span>
            </div>
            <div className="flex items-center justify-center sm:justify-start">
              <span className="w-2 h-2 min-w-[8px] bg-blue-500 rounded-full mr-2 flex-shrink-0"></span>
              <span className="truncate">{t('voice.aiResponses')}</span>
            </div>
            <div className="flex items-center justify-center sm:justify-start">
              <span className="w-2 h-2 min-w-[8px] bg-purple-500 rounded-full mr-2 flex-shrink-0"></span>
              <span className="truncate">{t('voice.liveTranscription')}</span>
            </div>
          </div>
        </div>
    </div>
    
  );
};

export default ConversationControls;
