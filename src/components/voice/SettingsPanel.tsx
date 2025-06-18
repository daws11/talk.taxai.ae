import React, { useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings, Check, ChevronDown } from "lucide-react";
import { useLanguage } from '@/contexts/LanguageContext';

interface MediaDeviceInfo {
  deviceId: string;
  label: string;
}

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  audioDevices: MediaDeviceInfo[];
  speakerDevices: MediaDeviceInfo[];
  selectedDeviceId: string;
  selectedSpeakerId: string;
  onDeviceSelect: (deviceId: string) => void;
  onSpeakerSelect: (deviceId: string) => void;
  isMicDropdownOpen: boolean;
  isSpeakerDropdownOpen: boolean;
  onMicDropdownToggle: () => void;
  onSpeakerDropdownToggle: () => void;
  isLoadingDevices: boolean;
  micDropdownRef: React.RefObject<HTMLDivElement | null>;
  speakerDropdownRef: React.RefObject<HTMLDivElement | null>;
  isMobile: boolean;
  audioOutputMode: 'auto' | 'speaker' | 'earpiece';
  onAudioOutputModeChange: (mode: 'auto' | 'speaker' | 'earpiece') => void;
}

const SettingsPanel: React.FC<SettingsPanelProps> = ({
  isOpen,
  onClose,
  audioDevices,
  speakerDevices,
  selectedDeviceId,
  selectedSpeakerId,
  onDeviceSelect,
  onSpeakerSelect,
  isMicDropdownOpen,
  isSpeakerDropdownOpen,
  onMicDropdownToggle,
  onSpeakerDropdownToggle,
  isLoadingDevices,
  micDropdownRef,
  speakerDropdownRef,
  isMobile,
  audioOutputMode,
  onAudioOutputModeChange,
}) => {
  const { t } = useLanguage();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (micDropdownRef.current && !micDropdownRef.current.contains(event.target as Node)) {
        onMicDropdownToggle();
      }
      if (speakerDropdownRef.current && !speakerDropdownRef.current.contains(event.target as Node)) {
        onSpeakerDropdownToggle();
      }
    };

    if (isMicDropdownOpen || isSpeakerDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMicDropdownOpen, isSpeakerDropdownOpen, onMicDropdownToggle, onSpeakerDropdownToggle]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            {t('settings.title')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Microphone Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium">{t('settings.microphone')}</label>
              <div className="relative" ref={micDropdownRef}>
                <Button
                  variant="outline"
                  className="w-full justify-between"
                  onClick={onMicDropdownToggle}
                  disabled={isLoadingDevices}
                >
                  {audioDevices.find(d => d.deviceId === selectedDeviceId)?.label || t('settings.selectMicrophone')}
                  <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
                {isMicDropdownOpen && (
                  <div className="absolute z-10 mt-1 w-full rounded-md bg-popover shadow-lg">
                    <div className="p-1">
                      {isLoadingDevices ? (
                        <div className="px-4 py-2 text-sm">Loading devices...</div>
                      ) : audioDevices.length > 0 ? (
                        audioDevices.map((device) => (
                          <div
                            key={device.deviceId}
                            className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-accent cursor-pointer rounded-sm"
                            onClick={() => {
                              onDeviceSelect(device.deviceId);
                              onMicDropdownToggle();
                            }}
                          >
                            {device.deviceId === selectedDeviceId && <Check className="h-4 w-4" />}
                            {device.label}
                          </div>
                        ))
                      ) : (
                        <div className="px-4 py-2 text-sm">No microphones found</div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Speaker Selection - Only show for non-mobile or when explicitly needed */}
            {!isMobile && (
              <div className="space-y-2">
                <label className="text-sm font-medium">{t('settings.speaker')}</label>
                <div className="relative" ref={speakerDropdownRef}>
                  <Button
                    variant="outline"
                    className="w-full justify-between"
                    onClick={onSpeakerDropdownToggle}
                    disabled={isLoadingDevices}
                  >
                    {speakerDevices.find(d => d.deviceId === selectedSpeakerId)?.label || t('settings.selectSpeaker')}
                    <ChevronDown className="ml-2 h-4 w-4" />
                  </Button>
                  {isSpeakerDropdownOpen && (
                    <div className="absolute z-10 mt-1 w-full rounded-md bg-popover shadow-lg">
                      <div className="p-1">
                        {isLoadingDevices ? (
                          <div className="px-4 py-2 text-sm">Loading devices...</div>
                        ) : speakerDevices.length > 0 ? (
                          speakerDevices.map((device) => (
                            <div
                              key={device.deviceId}
                              className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-accent cursor-pointer rounded-sm"
                              onClick={() => {
                                onSpeakerSelect(device.deviceId);
                                onSpeakerDropdownToggle();
                              }}
                            >
                              {device.deviceId === selectedSpeakerId && <Check className="h-4 w-4" />}
                              {device.label}
                            </div>
                          ))
                        ) : (
                          <div className="px-4 py-2 text-sm">No speakers found</div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Audio Output Mode - For mobile devices */}
            {isMobile && (
              <div className="space-y-2">
                <label className="text-sm font-medium">{t('settings.audioOutput')}</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['auto', 'speaker', 'earpiece'] as const).map((mode) => (
                    <Button
                      key={mode}
                      variant={audioOutputMode === mode ? 'default' : 'outline'}
                      size="sm"
                      className="capitalize"
                      onClick={() => onAudioOutputModeChange(mode)}
                    >
                      {t(`settings.${mode}`)}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-4">
              <Button
                onClick={onClose}
                className="w-full"
              >
                {t('settings.close')}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SettingsPanel;
