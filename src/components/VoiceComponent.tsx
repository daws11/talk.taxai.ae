"use client";

import React, { useEffect, useState, useRef } from "react";
import { useConversation } from "@11labs/react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Mic, MicOff, Volume2, VolumeX, Settings, Loader2, Check, X } from "lucide-react";
import Conclusion from "./Conclusion";
import { motion, AnimatePresence } from "framer-motion";

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
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>("");
  const [isLoadingDevices, setIsLoadingDevices] = useState(false);

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
      console.log("Received message:", message);
      if (typeof message === 'string') {
        setCurrentSubtitle(message);
        setConversationTranscript(prev => {
          const newTranscript = [...prev, `Assistant: ${message}`];
          console.log("Updated transcript with assistant message:", newTranscript);
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
            console.log("Updated transcript with message object:", newTranscript);
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
              console.log("Audio data available:", event.data);
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
      console.log("User speech event received:", text);
      if (text.trim()) {
        setConversationTranscript(prev => {
          const newTranscript = [...prev, `You: ${text}`];
          console.log("Updated transcript with user speech:", newTranscript);
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
      console.log("Started conversation:", conversationId);
      startTimeRef.current = new Date();

      setConversationTranscript(prev => {
        const newTranscript = [...prev, "Assistant: Hello! How can I help you today?"];
        console.log("Added initial message to transcript:", newTranscript);
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

  const saveConversation = async (): Promise<void> => {
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
      
      console.log("Current transcript before saving:", transcript);
      console.log("Transcript array:", conversationTranscript);
      
      // Validate transcript
      if (!transcript.trim()) {
        console.error("Empty transcript detected");
        throw new Error("Cannot save empty conversation");
      }
      
      // Generate summary if not already generated and transcript exists
      let summary = conversationSummary;
      if (!summary && transcript.trim() && !isGeneratingSummary) {
        try {
          console.log("Generating summary for transcript:", transcript);
          summary = await generateSummary(transcript);
          console.log("Generated summary:", summary);
          setConversationSummary(summary);
        } catch (error) {
          console.warn("Failed to generate summary:", error);
          summary = "Failed to generate summary";
        }
      }

      const conversationData = {
        transcript: transcript.trim(),
        summary: summary?.trim() || "No summary available",
        duration,
        startTime,
        endTime,
        status: "completed"
      };

      console.log("Saving conversation with data:", conversationData);

      const response = await fetch('/api/conversations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(conversationData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || errorData.details || 'Failed to save conversation');
      }

      const savedData = await response.json();
      console.log("Server response:", savedData);

      if (!savedData.transcript || !savedData.summary) {
        throw new Error("Server returned invalid conversation data");
      }
      
      setSavedConversation(savedData);
      console.log('Conversation saved successfully:', savedData);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to save conversation';
      console.error('Error saving conversation:', error);
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
      console.log("Final transcript before ending:", transcript);
      
      // Validate transcript before proceeding
      if (!transcript.trim()) {
        console.error("Empty transcript detected when ending conversation");
        setErrorMessage("Cannot save empty conversation");
        setShowConclusion(true);
        setIsEndingConversation(false);
        return;
      }
      
      // Generate summary before showing conclusion
      if (!conversationSummary && !isGeneratingSummary) {
        try {
          console.log("Generating summary before showing conclusion");
          const summary = await generateSummary(transcript);
          console.log("Generated summary for conclusion:", summary);
          setConversationSummary(summary);
        } catch (error) {
          console.warn("Failed to generate summary for conclusion:", error);
          setConversationSummary("Failed to generate summary");
        }
      }
      
      // Try to save conversation
      try {
        await saveConversation();
        // Only show conclusion after successful save
        if (savedConversation?.transcript && savedConversation?.summary) {
          console.log("Showing conclusion with saved data:", savedConversation);
          setShowConclusion(true);
        } else {
          throw new Error("Failed to save conversation data");
        }
      } catch (error) {
        console.error("Error saving conversation in handleEndConversation:", error);
        // If save fails, still show conclusion but with error message
        setShowConclusion(true);
        setErrorMessage("Conversation ended but failed to save. Please try saving again.");
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to end conversation";
      setErrorMessage(errorMessage);
      console.error("Error ending conversation:", error);
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
      const audioInputs = devices
        .filter(device => device.kind === 'audioinput')
        .map(device => ({
          deviceId: device.deviceId,
          label: device.label || `Microphone ${device.deviceId.slice(0, 5)}`
        }));
      setAudioDevices(audioInputs);
      
      // Set default device if none selected
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
          console.log("Audio data available:", event.data);
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

  useEffect(() => {
    if (showSettings) {
      loadAudioDevices();
    }
  }, [showSettings]);

  return (
    <>
      <div className="w-full max-w-2xl mx-auto space-y-6">
        <Card className="w-full bg-gray-900/50 backdrop-blur-sm border-gray-800">
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-white">
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${status === "connected" ? "bg-green-500" : "bg-gray-500"}`} />
                <span>Voice Assistant</span>
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
                        <span className="opacity-0">End</span>
                      </>
                    ) : (
                      <>
                        <MicOff className="h-6 w-6" />
                        <span className="text-sm">End</span>
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
                    <span className="text-sm">Start</span>
                  </Button>
                )}
              </div>

              <div className="text-center text-sm space-y-2">
                {!isBrowserSupported && (
                  <p className="text-red-400 bg-red-900/20 p-2 rounded">
                    {errorMessage}
                  </p>
                )}
                {status === "connected" && (
                  <p className="text-green-400">
                    {isEndingConversation ? (
                      <span className="flex items-center justify-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Processing conversation...
                      </span>
                    ) : isSpeaking ? (
                      "Agent is speaking..."
                    ) : (
                      "Listening..."
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
                    Please allow microphone access to use voice chat
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
                Processing your conversation...
              </p>
              <p className="text-gray-400 text-sm text-center">
                Generating summary and saving transcript
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {showConclusion && (
        <Conclusion
          transcript={savedConversation?.transcript || conversationTranscript.join("\n\n")}
          summary={isGeneratingSummary ? "Generating summary..." : (savedConversation?.summary || conversationSummary || "No summary available")}
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
                ? `${savedConversation.summary}\n\nFull Transcript:\n${savedConversation.transcript}`
                : `${conversationSummary || "No summary available"}\n\nFull Transcript:\n${conversationTranscript.join("\n\n")}`;
              
              navigator.share({
                title: "Tax Conversation Summary",
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
                  <span>Audio Settings</span>
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
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-gray-300">Select Microphone</h3>
                  {isLoadingDevices ? (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                    </div>
                  ) : audioDevices.length === 0 ? (
                    <p className="text-sm text-gray-400">No microphones found</p>
                  ) : (
                    <div className="space-y-2">
                      {audioDevices.map((device) => (
                        <button
                          key={device.deviceId}
                          onClick={() => switchAudioDevice(device.deviceId)}
                          className={`w-full flex items-center justify-between p-3 rounded-lg text-sm transition-colors ${
                            selectedDeviceId === device.deviceId
                              ? 'bg-indigo-500/20 border border-indigo-500/30 text-white'
                              : 'bg-gray-800/50 border border-gray-700/30 text-gray-300 hover:bg-gray-800/70'
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
                <div className="pt-4 border-t border-gray-800">
                  <Button
                    variant="outline"
                    onClick={() => setShowSettings(false)}
                    className="w-full text-gray-300 hover:text-white border-gray-700 hover:border-gray-600"
                  >
                    Close
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
