import React, { useRef, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';

interface TranscriptDisplayProps {
  currentSubtitle: string;
  conversationTranscript: string[];
  isGeneratingSummary: boolean;
  conversationSummary: string;
}

const TranscriptDisplay: React.FC<TranscriptDisplayProps> = ({
  currentSubtitle,
  conversationTranscript,
  isGeneratingSummary,
  conversationSummary,
}) => {
  const { t } = useLanguage();
  const transcriptEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (transcriptEndRef.current) {
      transcriptEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [conversationTranscript, currentSubtitle]);

  return (
    <div className="space-y-4">
      {/* Current Subtitle */}
      {currentSubtitle && (
        <div className="bg-muted/50 p-4 rounded-lg animate-pulse">
          <p className="text-sm text-muted-foreground">{t('transcript.nowSpeaking')}</p>
          <p className="text-lg font-medium">{currentSubtitle}</p>
        </div>
      )}

      {/* Conversation Transcript */}
      <div className="space-y-2">
        <h3 className="text-sm font-medium">{t('transcript.conversationHistory')}</h3>
        <div className="bg-muted/30 rounded-lg p-4 h-48 overflow-y-auto">
          {conversationTranscript.length > 0 ? (
            <div className="space-y-2">
              {conversationTranscript.map((line, index) => (
                <div 
                  key={index} 
                  className={`text-sm ${line.startsWith('You:') ? 'text-primary' : 'text-foreground'}`}
                >
                  {line}
                </div>
              ))}
              <div ref={transcriptEndRef} />
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              {t('transcript.noMessagesYet')}
            </p>
          )}
        </div>
      </div>

      {/* Conversation Summary */}
      {conversationSummary && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium">{t('transcript.summary')}</h3>
          <div className="bg-muted/30 rounded-lg p-4">
            {isGeneratingSummary ? (
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <div className="h-4 w-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                <span>{t('transcript.generatingSummary')}</span>
              </div>
            ) : (
              <p className="text-sm">{conversationSummary}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TranscriptDisplay;
