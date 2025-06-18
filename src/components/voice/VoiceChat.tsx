'use client';

import React, { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { useVoiceConversation } from '@/hooks/useVoiceConversation';
import SettingsPanel from './SettingsPanel';
import ConversationControls from './ConversationControls';
import TranscriptDisplay from './TranscriptDisplay';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings, X } from 'lucide-react';
import Conclusion from '../Conclusion';
import LanguageSwitcher from '../LanguageSwitcher';

const VoiceChat: React.FC = () => {
  const { t } = useLanguage();
  const [showConclusion, setShowConclusion] = useState(false);
  
  const {
    // State
    hasPermission,
    isMuted,
    errorMessage,
    currentSubtitle,
    isBrowserSupported,
    conversationTranscript,
    conversationSummary,
    isSaving,
    isGeneratingSummary,
    savedConversation,
    isEndingConversation,
    showSettings,
    audioDevices,
    speakerDevices,
    selectedDeviceId,
    selectedSpeakerId,
    isLoadingDevices,
    isMicDropdownOpen,
    isSpeakerDropdownOpen,
    isMobile,
    audioOutputMode,
    isSpeaking,
    isConnecting,
    isConversationActive,
    
    // Refs
    micDropdownRef,
    speakerDropdownRef,
    
    // Actions
    startConversation,
    endConversation,
    saveConversation,
    toggleMute,
    toggleSettings,
    toggleMicDropdown,
    toggleSpeakerDropdown,
    handleDeviceSelect,
    handleSpeakerSelect,
    handleAudioOutputModeChange,
    closeSettings,
  } = useVoiceConversation({
    onConversationEnd: () => {
      // Show conclusion when conversation ends
      setShowConclusion(true);
    },
  });

  // Handle start conversation
  const handleStartConversation = async () => {
    await startConversation();
  };

  // Handle end conversation
  const handleEndConversation = async () => {
    await endConversation();
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Language Switcher */}
      {/* <div className="flex justify-end mb-4">
        <LanguageSwitcher />
      </div> */}
      
      <Card className="w-full">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center">
            <CardTitle className="text-2xl">{t('voice.title')}</CardTitle>
            <div className="flex space-x-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleSettings}
                aria-label={t('settings.title')}
              >
                <Settings className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          {/* Transcript Display */}
          {/* <div className="mb-6">
            <TranscriptDisplay
              currentSubtitle={currentSubtitle}
              conversationTranscript={conversationTranscript}
              isGeneratingSummary={isGeneratingSummary}
              conversationSummary={conversationSummary}
            />
          </div> */}
          
          {/* Conversation Controls */}
          <ConversationControls
            isSpeaking={isSpeaking}
            isMuted={isMuted}
            isConnecting={isConnecting}
            isConversationActive={isConversationActive}
            isEndingConversation={isEndingConversation}
            onStartConversation={handleStartConversation}
            onEndConversation={handleEndConversation}
            onToggleMute={toggleMute}
            onOpenSettings={toggleSettings}
            errorMessage={errorMessage}
            isBrowserSupported={isBrowserSupported}
            hasPermission={hasPermission}
          />
        </CardContent>
      </Card>

      {/* Settings Panel */}
      <AnimatePresence>
        {showSettings && (
          <SettingsPanel
            isOpen={showSettings}
            onClose={closeSettings}
            audioDevices={audioDevices}
            speakerDevices={speakerDevices}
            selectedDeviceId={selectedDeviceId}
            selectedSpeakerId={selectedSpeakerId}
            onDeviceSelect={handleDeviceSelect}
            onSpeakerSelect={handleSpeakerSelect}
            isMicDropdownOpen={isMicDropdownOpen}
            isSpeakerDropdownOpen={isSpeakerDropdownOpen}
            onMicDropdownToggle={toggleMicDropdown}
            onSpeakerDropdownToggle={toggleSpeakerDropdown}
            isLoadingDevices={isLoadingDevices}
            micDropdownRef={micDropdownRef}
            speakerDropdownRef={speakerDropdownRef}
            isMobile={isMobile}
            audioOutputMode={audioOutputMode}
            onAudioOutputModeChange={handleAudioOutputModeChange}
          />
        )}
      </AnimatePresence>

      {/* Conclusion Modal */}
      <AnimatePresence>
        {showConclusion && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-2xl">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                  <CardTitle>{t('conversation.conclusion')}</CardTitle>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowConclusion(false)}
                    aria-label={t('common.close')}
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Conclusion 
                  transcript={conversationTranscript.join('\n')} 
                  summary={conversationSummary} 
                  isGenerating={isGeneratingSummary}
                  isSaving={isSaving}
                  onSave={async () => {
                    try {
                      await saveConversation(conversationTranscript.join('\n\n'));
                    } catch (error) {
                      console.error("Error saving conversation:", error);
                    }
                  }}
                  onClose={() => setShowConclusion(false)}
                />
              </CardContent>
            </Card>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default VoiceChat;
