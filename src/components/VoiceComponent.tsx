"use client";

import React, { useEffect, useState, useRef } from "react";
import { useConversation } from "@11labs/react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Mic, MicOff, Volume2, VolumeX, Settings, Loader2, Check, X, ChevronDown } from "lucide-react";
import Conclusion from "./Conclusion";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from '@/contexts/LanguageContext';

interface Message {
  message: string;
  source: 'user' | 'ai';
}

interface MediaDeviceInfo {
  deviceId: string;
  label: string;
}

const VoiceChat = () => {
  const { data: session } = useSession();
  const { t } = useLanguage();
  const [hasPermission, setHasPermission] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [currentSubtitle, setCurrentSubtitle] = useState("");
  const [audioStream, setAudioStream] = useState<MediaStream | null>(null);
  const [isBrowserSupported, setIsBrowserSupported] = useState(true);
  const [showConclusion, setShowConclusion] = useState(false);
  const [conversationTranscript, setConversationTranscript] = useState<string[]>([]);
  const [conversationSummary, setConversationSummary] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const startTimeRef = useRef<Date | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [savedConversation, setSavedConversation] = useState<any>(null);
  const [isEndingConversation, setIsEndingConversation] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [audioDevices, setAudioDevices] = useState<MediaDeviceInfo[]>([]);
  const [speakerDevices, setSpeakerDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>("");
  const [selectedSpeakerId, setSelectedSpeakerId] = useState<string>("");
  const [isLoadingDevices, setIsLoadingDevices] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioDestinationRef = useRef<MediaStreamAudioDestinationNode | null>(null);
  const [isMicDropdownOpen, setIsMicDropdownOpen] = useState(false);
  const [isSpeakerDropdownOpen, setIsSpeakerDropdownOpen] = useState(false);
  const micDropdownRef = useRef<HTMLDivElement>(null);
  const speakerDropdownRef = useRef<HTMLDivElement>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isUsingSpeaker, setIsUsingSpeaker] = useState(false);
  const [audioOutputMode, setAudioOutputMode] = useState<'auto' | 'speaker' | 'earpiece'>('auto');

  const conversation = useConversation({
    onConnect: () => {
      console.log("Connected to ElevenLabs");
      startTimeRef.current = new Date();
      setConversationTranscript([]);
      setConversationSummary("");
      setErrorMessage("");
    },
    onDisconnect: () => {
      console.log("Disconnected from ElevenLabs");
      setCurrentSubtitle("");
    },
    onMessage: (message: string | Message) => {
      if (typeof message === 'string') {
        setCurrentSubtitle(message);
        setConversationTranscript(prev => {
          const newTranscript = [...prev, `Assistant: ${message}`];
          return newTranscript;
        });
      } else if (message && typeof message === 'object' && 'message' in message) {
        const messageText = message.message;
        const source = message.source || 'ai';
        if (messageText) {
          setCurrentSubtitle(messageText);
          setConversationTranscript(prev => {
            const prefix = source === 'user' ? 'You: ' : 'Assistant: ';
            const newTranscript = [...prev, `${prefix}${messageText}`];
            return newTranscript;
          });
        }
      }
    },
    onError: (error: string | Error) => {
      const errorMsg = typeof error === "string" ? error : error.message;
      setErrorMessage(errorMsg);
      console.error("Error:", error);
    },
  });

  const { status, isSpeaking } = conversation;

  useEffect(() => {
    // Check browser support
    if (!navigator.mediaDevices || !window.MediaRecorder) {
      setIsBrowserSupported(false);
      setErrorMessage("Your browser doesn't support audio recording. Please use a modern browser like Chrome, Firefox, or Edge.");
      return;
    }

    const requestMicPermission = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          } 
        });
        
        setHasPermission(true);
        setAudioStream(stream);
        
        // Setup media recorder for transcription
        try {
          const mediaRecorder = new MediaRecorder(stream);
          mediaRecorderRef.current = mediaRecorder;
          
          mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
            }
          };
        } catch (recorderError) {
          console.warn("MediaRecorder not supported:", recorderError);
          // Continue without MediaRecorder
        }

      } catch (error) {
        console.error("Microphone access error:", error);
        if (error instanceof Error) {
          if (error.name === 'NotAllowedError') {
            setErrorMessage("Microphone access was denied. Please allow microphone access to use voice chat.");
          } else if (error.name === 'NotFoundError') {
            setErrorMessage("No microphone found. Please connect a microphone and try again.");
          } else {
            setErrorMessage(`Microphone error: ${error.message}`);
          }
        } else {
          setErrorMessage("Failed to access microphone. Please check your browser settings.");
        }
        setHasPermission(false);
      }
    };

    requestMicPermission();

    return () => {
      if (audioStream) {
        audioStream.getTracks().forEach(track => {
          track.stop();
          track.enabled = false;
        });
      }
    };
  }, []);

  useEffect(() => {
    const handleUserSpeech = (event: CustomEvent<{ text: string }>) => {
      const text = event.detail?.text || '';
      if (text.trim()) {
        setConversationTranscript(prev => {
          const newTranscript = [...prev, `You: ${text}`];
          return newTranscript;
        });
      }
    };

    window.addEventListener('userSpeech', handleUserSpeech as EventListener);

    return () => {
      window.removeEventListener('userSpeech', handleUserSpeech as EventListener);
    };
  }, []);

  const handleStartConversation = async () => {
    try {
      if (!hasPermission || !isBrowserSupported) {
        setErrorMessage("Please allow microphone access and use a supported browser");
        return;
      }

      setConversationTranscript([]);
      setConversationSummary("");
      setIsGeneratingSummary(false);
      setErrorMessage("");
      setSavedConversation(null);

      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.start(1000);
      }
      
      const conversationId = await conversation.startSession({
        agentId: process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID!,
      });
      startTimeRef.current = new Date();

      setConversationTranscript(prev => {
        const newTranscript = [...prev, "Assistant: Hello! How can I help you today?"];
        return newTranscript;
      });
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Failed to start conversation";
      setErrorMessage(errorMsg);
      console.error("Error starting conversation:", error);
    }
  };

  const generateSummary = async (transcript: string) => {
    try {
      setIsGeneratingSummary(true);
      if (!transcript.trim()) {
        return "No transcript available to summarize";
      }

      const response = await fetch('/api/summarize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ transcript }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate summary');
      }

      const data = await response.json();
      return data.summary;
    } catch (error) {
      console.error('Error generating summary:', error);
      return "Failed to generate summary. Please try again later.";
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  const saveConversation = async (): Promise<any> => {
    if (!session?.user?.id || !startTimeRef.current) {
      setErrorMessage("Cannot save conversation: User not authenticated");
      return;
    }

    try {
      setIsSaving(true);
      setErrorMessage("");
      
      const endTime = new Date();
      const startTime = startTimeRef.current;
      const duration = Math.floor((endTime.getTime() - startTime.getTime()) / 1000);
      const transcript = conversationTranscript.join("\n\n");
      
      // Validate transcript
      if (!transcript.trim()) {
        throw new Error("Cannot save empty conversation");
      }
      
      // Generate summary if not already generated and transcript exists
      let summary = conversationSummary;
      if (!summary && transcript.trim() && !isGeneratingSummary) {
        try {
          summary = await generateSummary(transcript);
          setConversationSummary(summary);
        } catch (error) {
          summary = "Failed to generate summary";
        }
      }

      const conversationData = {
        transcript: transcript.trim(),
        summary: summary?.trim() || "No summary available",
        duration,
        status: "completed",
        startTime,
        endTime
      };

      const response = await fetch('/api/conversations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(conversationData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save conversation');
      }

      const savedData = await response.json();
      
      if (!savedData || !savedData._id) {
        throw new Error("Server returned invalid conversation data");
      }
      
      return savedData;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to save conversation';
      setErrorMessage(errorMessage);
      throw error;
    } finally {
      setIsSaving(false);
    }
  };

  const handleEndConversation = async () => {
    try {
      setIsEndingConversation(true);
      setErrorMessage("");
      
      // Stop recording first
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
      
      // End session
      await conversation.endSession();
      setCurrentSubtitle("");
      
      // Get current transcript
      const transcript = conversationTranscript.join("\n\n");
      
      // Validate transcript before proceeding
      if (!transcript.trim()) {
        setErrorMessage("Cannot save empty conversation");
        setShowConclusion(true);
        return;
      }
      
      // Generate summary before showing conclusion
      if (!conversationSummary && !isGeneratingSummary) {
        try {
          const summary = await generateSummary(transcript);
          setConversationSummary(summary);
        } catch (error) {
          setConversationSummary("Failed to generate summary");
        }
      }
      
      // Try to save conversation
      try {
        const savedData = await saveConversation();
        setSavedConversation(savedData);
        setShowConclusion(true);
      } catch (error) {
        setShowConclusion(true);
        setErrorMessage("Failed to save conversation. Please try saving again.");
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to end conversation";
      setErrorMessage(errorMessage);
      setShowConclusion(true);
    } finally {
      setIsEndingConversation(false);
    }
  };

  const toggleMute = async () => {
    try {
      await conversation.setVolume({ volume: isMuted ? 1 : 0 });
      setIsMuted(!isMuted);
    } catch (error) {
      setErrorMessage("Failed to change volume");
      console.error("Error changing volume:", error);
    }
  };

  const loadAudioDevices = async () => {
    try {
      setIsLoadingDevices(true);
      const devices = await navigator.mediaDevices.enumerateDevices();
      
      // Get input devices (microphones)
      const audioInputs = devices
        .filter(device => device.kind === 'audioinput')
        .map(device => ({
          deviceId: device.deviceId,
          label: device.label || `Microphone ${device.deviceId.slice(0, 5)}`
        }));
      setAudioDevices(audioInputs);
      
      // Get output devices for non-mobile devices
      if (!isMobile) {
        const audioOutputs = devices
          .filter(device => device.kind === 'audiooutput')
          .map(device => ({
            deviceId: device.deviceId,
            label: device.label || `Speaker ${device.deviceId.slice(0, 5)}`
          }));
        setSpeakerDevices(audioOutputs);
        
        if (audioOutputs.length > 0 && !selectedSpeakerId) {
          setSelectedSpeakerId(audioOutputs[0].deviceId);
        }
      }
      
      // Set default input device if none selected
      if (audioInputs.length > 0 && !selectedDeviceId) {
        setSelectedDeviceId(audioInputs[0].deviceId);
      }
    } catch (error) {
      console.error('Error loading audio devices:', error);
      setErrorMessage('Failed to load audio devices');
    } finally {
      setIsLoadingDevices(false);
    }
  };

  const switchAudioDevice = async (deviceId: string) => {
    try {
      // Stop current stream if exists
      if (audioStream) {
        audioStream.getTracks().forEach(track => track.stop());
      }

      // Get new stream with selected device
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          deviceId: { exact: deviceId },
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      setAudioStream(stream);
      setSelectedDeviceId(deviceId);
      setHasPermission(true);

      // Update media recorder
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stop();
      }
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
        }
      };

      // If conversation is active, restart it with new device
      if (status === "connected") {
        await handleEndConversation();
        await handleStartConversation();
      }
    } catch (error) {
      console.error('Error switching audio device:', error);
      setErrorMessage('Failed to switch audio device');
    }
  };

  const setAudioOutput = async (mode: 'auto' | 'speaker' | 'earpiece') => {
    try {
      const audioElements = document.getElementsByTagName('audio');
      
      if (isMobile) {
        // For mobile devices
        for (let i = 0; i < audioElements.length; i++) {
          const audio = audioElements[i] as HTMLAudioElement;
          try {
            // @ts-ignore - Mobile specific property
            if (audio.setSinkId) {
              // @ts-ignore
              await audio.setSinkId(mode === 'speaker' ? 'speaker' : 'default');
            }
          } catch (e) {
            console.warn('setSinkId not supported:', e);
          }
        }
        
        // Additional handling for Android
        if (/Android/i.test(navigator.userAgent)) {
          try {
            // @ts-ignore - Android specific
            if (window.audioContext && window.audioContext.setSinkId) {
              // @ts-ignore
              await window.audioContext.setSinkId(mode === 'speaker' ? 'speaker' : 'default');
            }
          } catch (e) {
            console.warn('Android audio context not supported:', e);
          }
        }
      } else {
        // For desktop devices
        for (let i = 0; i < audioElements.length; i++) {
          const audio = audioElements[i] as HTMLAudioElement;
          if ('setSinkId' in HTMLAudioElement.prototype) {
            const deviceId = mode === 'auto' ? selectedSpeakerId : 
                           mode === 'speaker' ? 'speaker' : 'default';
            await (audio as any).setSinkId(deviceId);
          }
        }
      }
      
      setAudioOutputMode(mode);
      setIsUsingSpeaker(mode === 'speaker');
    } catch (error) {
      console.error('Error setting audio output:', error);
      setErrorMessage('Failed to change audio output');
    }
  };

  useEffect(() => {
    if (showSettings) {
      loadAudioDevices();
    }
  }, [showSettings]);

  // Add click outside handler for dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (micDropdownRef.current && !micDropdownRef.current.contains(event.target as Node)) {
        setIsMicDropdownOpen(false);
      }
      if (speakerDropdownRef.current && !speakerDropdownRef.current.contains(event.target as Node)) {
        setIsSpeakerDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    // Detect iOS device
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(isIOSDevice);
  }, []);

  useEffect(() => {
    // Detect mobile device
    const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    setIsMobile(isMobileDevice);
    
    // Set initial audio output mode based on device
    if (isMobileDevice) {
      // Default to speaker for mobile devices
      setAudioOutputMode('speaker');
      setIsUsingSpeaker(true);
    }
  }, []);

  return (
    <>
      <div className="w-full max-w-2xl mx-auto space-y-6">
        <Card className="w-full bg-gray-900/50 backdrop-blur-sm border-gray-800">
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-white">
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${status === "connected" ? "bg-green-500" : "bg-gray-500"}`} />
                <span>{t('voice.title')}</span>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowSettings(true)}
                  className="text-gray-400 hover:text-white hover:bg-gray-800"
                >
                  <Settings className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleMute}
                  disabled={status !== "connected" || !isBrowserSupported}
                  className="text-gray-400 hover:text-white hover:bg-gray-800"
                >
                  {isMuted ? (
                    <VolumeX className="h-4 w-4" />
                  ) : (
                    <Volume2 className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="flex justify-center">
                {status === "connected" ? (
                  <Button
                    variant="destructive"
                    onClick={handleEndConversation}
                    disabled={!isBrowserSupported || isEndingConversation}
                    className="w-24 h-24 rounded-full bg-red-500 hover:bg-red-600 text-white flex flex-col items-center justify-center gap-2 relative"
                  >
                    {isEndingConversation ? (
                      <>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Loader2 className="h-8 w-8 animate-spin text-white" />
                        </div>
                        <span className="opacity-0">{t('voice.end')}</span>
                      </>
                    ) : (
                      <>
                        <MicOff className="h-6 w-6" />
                        <span className="text-sm">{t('voice.end')}</span>
                      </>
                    )}
                  </Button>
                ) : (
                  <Button
                    onClick={handleStartConversation}
                    disabled={!hasPermission || !isBrowserSupported}
                    className="w-24 h-24 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white flex flex-col items-center justify-center gap-2"
                  >
                    <Mic className="h-6 w-6" />
                    <span className="text-sm">{t('voice.start')}</span>
                  </Button>
                )}
              </div>

              <div className="text-center text-sm space-y-2">
                {!isBrowserSupported && (
                  <p className="text-red-400 bg-red-900/20 p-2 rounded">
                    {t('voice.browserNotSupported')}
                  </p>
                )}
                {status === "connected" && (
                  <p className="text-green-400">
                    {isEndingConversation ? (
                      <span className="flex items-center justify-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        {t('voice.processing')}
                      </span>
                    ) : isSpeaking ? (
                      t('voice.agentSpeaking')
                    ) : (
                      t('voice.listening')
                    )}
                  </p>
                )}
                {errorMessage && isBrowserSupported && (
                  <p className="text-red-400 bg-red-900/20 p-2 rounded">
                    {errorMessage}
                  </p>
                )}
                {!hasPermission && isBrowserSupported && (
                  <p className="text-yellow-400 bg-yellow-900/20 p-2 rounded">
                    {t('voice.microphoneRequired')}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <AnimatePresence>
        {isEndingConversation && !showConclusion && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
          >
            <div className="bg-gray-900/95 p-8 rounded-lg shadow-xl border border-gray-800 flex flex-col items-center gap-4">
              <div className="relative">
                <Loader2 className="h-12 w-12 animate-spin text-indigo-400" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="h-8 w-8 rounded-full border-2 border-indigo-400 border-t-transparent animate-spin" />
                </div>
              </div>
              <p className="text-gray-300 text-center">
                {t('voice.processing')}
              </p>
              <p className="text-gray-400 text-sm text-center">
                {t('conclusion.generatingSummary')}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {showConclusion && (
        <Conclusion
          transcript={savedConversation?.transcript || conversationTranscript.join("\n\n")}
          summary={isGeneratingSummary ? t('conclusion.generating') : (savedConversation?.summary || conversationSummary || t('history.noSummary'))}
          onClose={() => {
            setShowConclusion(false);
            setSavedConversation(null);
            setConversationTranscript([]);
            setConversationSummary("");
          }}
          onSave={saveConversation}
          isSaving={isSaving}
          onShare={() => {
            if (navigator.share) {
              const shareText = savedConversation 
                ? `${savedConversation.summary}\n\n${t('conclusion.transcript')}:\n${savedConversation.transcript}`
                : `${conversationSummary || t('history.noSummary')}\n\n${t('conclusion.transcript')}:\n${conversationTranscript.join("\n\n")}`;
              
              navigator.share({
                title: t('conclusion.title'),
                text: shareText,
              }).catch(console.error);
            }
          }}
        />
      )}

      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          >
            <Card className="w-full max-w-md bg-gray-900/95 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white flex items-center justify-between">
                  <span>{t('settings.title')}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowSettings(false)}
                    className="text-gray-400 hover:text-white hover:bg-gray-800"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-gray-300">{t('settings.microphone')}</h3>
                  {isLoadingDevices ? (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                    </div>
                  ) : audioDevices.length === 0 ? (
                    <p className="text-sm text-gray-400">{t('settings.noMicrophones')}</p>
                  ) : (
                    <div className="relative" ref={micDropdownRef}>
                      <button
                        onClick={() => setIsMicDropdownOpen(!isMicDropdownOpen)}
                        className="w-full flex items-center justify-between p-3 rounded-lg text-sm bg-gray-800/50 border border-gray-700/30 text-gray-300 hover:bg-gray-800/70"
                      >
                        <span className="flex items-center gap-2">
                          <Mic className="h-4 w-4" />
                          {audioDevices.find(d => d.deviceId === selectedDeviceId)?.label || t('settings.microphone')}
                        </span>
                        <ChevronDown className={`h-4 w-4 transition-transform ${isMicDropdownOpen ? 'rotate-180' : ''}`} />
                      </button>
                      {isMicDropdownOpen && (
                        <div className="absolute z-10 w-full mt-1 bg-gray-800 border border-gray-700 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                          {audioDevices.map((device) => (
                            <button
                              key={device.deviceId}
                              onClick={() => {
                                switchAudioDevice(device.deviceId);
                                setIsMicDropdownOpen(false);
                              }}
                              className={`w-full flex items-center justify-between p-3 text-sm hover:bg-gray-700/50 ${
                                selectedDeviceId === device.deviceId
                                  ? 'bg-indigo-500/20 text-white'
                                  : 'text-gray-300'
                              }`}
                            >
                              <span className="flex items-center gap-2">
                                <Mic className="h-4 w-4" />
                                {device.label}
                              </span>
                              {selectedDeviceId === device.deviceId && (
                                <Check className="h-4 w-4 text-indigo-400" />
                              )}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-gray-300">{t('settings.audioOutput')}</h3>
                  {isMobile ? (
                    <div className="space-y-2">
                      <div className="grid grid-cols-3 gap-2">
                        <Button
                          onClick={() => setAudioOutput('auto')}
                          className={`flex items-center justify-center p-3 rounded-lg text-sm ${
                            audioOutputMode === 'auto'
                              ? 'bg-indigo-500/20 text-white'
                              : 'bg-gray-800/50 text-gray-300 hover:bg-gray-800/70'
                          }`}
                        >
                          <span className="flex items-center gap-2">
                            <Volume2 className="h-4 w-4" />
                            {t('settings.auto')}
                          </span>
                        </Button>
                        <Button
                          onClick={() => setAudioOutput('speaker')}
                          className={`flex items-center justify-center p-3 rounded-lg text-sm ${
                            audioOutputMode === 'speaker'
                              ? 'bg-indigo-500/20 text-white'
                              : 'bg-gray-800/50 text-gray-300 hover:bg-gray-800/70'
                          }`}
                        >
                          <span className="flex items-center gap-2">
                            <Volume2 className="h-4 w-4" />
                            {t('settings.speaker')}
                          </span>
                        </Button>
                        <Button
                          onClick={() => setAudioOutput('earpiece')}
                          className={`flex items-center justify-center p-3 rounded-lg text-sm ${
                            audioOutputMode === 'earpiece'
                              ? 'bg-indigo-500/20 text-white'
                              : 'bg-gray-800/50 text-gray-300 hover:bg-gray-800/70'
                          }`}
                        >
                          <span className="flex items-center gap-2">
                            <Volume2 className="h-4 w-4" />
                            {t('settings.earpiece')}
                          </span>
                        </Button>
                      </div>
                      <p className="text-xs text-gray-400 mt-1">
                        {isMobile ? t('settings.mobileAudioOutput') : t('settings.desktopAudioOutput')}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="relative" ref={speakerDropdownRef}>
                        <button
                          onClick={() => setIsSpeakerDropdownOpen(!isSpeakerDropdownOpen)}
                          className="w-full flex items-center justify-between p-3 rounded-lg text-sm bg-gray-800/50 border border-gray-700/30 text-gray-300 hover:bg-gray-800/70"
                        >
                          <span className="flex items-center gap-2">
                            <Volume2 className="h-4 w-4" />
                            {speakerDevices.find(d => d.deviceId === selectedSpeakerId)?.label || t('settings.speakerDevice')}
                          </span>
                          <ChevronDown className={`h-4 w-4 transition-transform ${isSpeakerDropdownOpen ? 'rotate-180' : ''}`} />
                        </button>
                        {isSpeakerDropdownOpen && (
                          <div className="absolute z-10 w-full mt-1 bg-gray-800 border border-gray-700 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                            {speakerDevices.map((device) => (
                              <button
                                key={device.deviceId}
                                onClick={() => {
                                  switchAudioDevice(device.deviceId);
                                  setIsSpeakerDropdownOpen(false);
                                }}
                                className={`w-full flex items-center justify-between p-3 text-sm hover:bg-gray-700/50 ${
                                  selectedSpeakerId === device.deviceId
                                    ? 'bg-indigo-500/20 text-white'
                                    : 'text-gray-300'
                                }`}
                              >
                                <span className="flex items-center gap-2">
                                  <Volume2 className="h-4 w-4" />
                                  {device.label}
                                </span>
                                {selectedSpeakerId === device.deviceId && (
                                  <Check className="h-4 w-4 text-indigo-400" />
                                )}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-gray-800">
                  <Button
                    variant="outline"
                    onClick={() => setShowSettings(false)}
                    className="w-full text-gray-300 hover:text-white border-gray-700 hover:border-gray-600"
                  >
                    {t('settings.close')}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default VoiceChat;
