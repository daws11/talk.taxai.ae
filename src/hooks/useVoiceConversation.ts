import { useState, useRef, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useConversation } from '@11labs/react';

// Extend the AudioContext interface to include setSinkId
declare global {
  interface AudioContext {
    setSinkId?(sinkId: string): Promise<void>;
  }
}

interface MediaDeviceInfo {
  deviceId: string;
  label: string;
}

interface UseVoiceConversationProps {
  onConversationStart?: () => void;
  onConversationEnd?: () => void;
  onError?: (error: string) => void;
}

export const useVoiceConversation = ({
  onConversationStart,
  onConversationEnd,
  onError,
}: UseVoiceConversationProps = {}) => {
  const { data: session } = useSession();
  const [hasPermission, setHasPermission] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [currentSubtitle, setCurrentSubtitle] = useState("");
  const [audioStream, setAudioStream] = useState<MediaStream | null>(null);
  const [isBrowserSupported, setIsBrowserSupported] = useState(true);
  const [conversationTranscript, setConversationTranscript] = useState<string[]>([]);
  const [conversationSummary, setConversationSummary] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [savedConversation, setSavedConversation] = useState<any>(null);
  const [isEndingConversation, setIsEndingConversation] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [audioDevices, setAudioDevices] = useState<MediaDeviceInfo[]>([]);
  const [speakerDevices, setSpeakerDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>("");
  const [selectedSpeakerId, setSelectedSpeakerId] = useState<string>("");
  const [isLoadingDevices, setIsLoadingDevices] = useState(false);
  const [isMicDropdownOpen, setIsMicDropdownOpen] = useState(false);
  const [isSpeakerDropdownOpen, setIsSpeakerDropdownOpen] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [audioOutputMode, setAudioOutputMode] = useState<'auto' | 'speaker' | 'earpiece'>('auto');
  
  const startTimeRef = useRef<Date | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioDestinationRef = useRef<MediaStreamAudioDestinationNode | null>(null);
  const micDropdownRef = useRef<HTMLDivElement | null>(null);
  const speakerDropdownRef = useRef<HTMLDivElement | null>(null);

  // Initialize conversation
  const conversation = useConversation({
    onConnect: () => {
      console.log("Connected to ElevenLabs");
      startTimeRef.current = new Date();
      setConversationTranscript([]);
      setConversationSummary("");
      setErrorMessage("");
      onConversationStart?.();
    },
    onDisconnect: () => {
      console.log("Disconnected from ElevenLabs");
      setCurrentSubtitle("");
      onConversationEnd?.();
    },
    onMessage: (message: any) => {
      if (typeof message === 'string') {
        setCurrentSubtitle(message);
        setConversationTranscript(prev => [...prev, `Assistant: ${message}`]);
      } else if (message?.message) {
        const messageText = message.message;
        const source = message.source || 'ai';
        const prefix = source === 'user' ? 'You: ' : 'Assistant: ';
        setCurrentSubtitle(messageText);
        setConversationTranscript(prev => [...prev, `${prefix}${messageText}`]);
      }
    },
    onError: (error: any) => {
      const errorMsg = typeof error === "string" ? error : error.message;
      setErrorMessage(errorMsg);
      onError?.(errorMsg);
      console.error("Error:", error);
    },
  });

  // Check browser support and request permissions
  useEffect(() => {
    // Check for browser support
    if (!navigator.mediaDevices || !window.MediaRecorder) {
      setIsBrowserSupported(false);
      setErrorMessage("Your browser doesn't support audio recording. Please use a modern browser like Chrome, Firefox, or Edge.");
      return;
    }

    // Check for iOS devices
    const userAgent = window.navigator.userAgent;
    const isIOS = /iPad|iPhone|iPod/.test(userAgent) || 
                 (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    setIsIOS(isIOS);
    
    // Check for mobile devices
    const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
    setIsMobile(isMobileDevice);

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
              // Handle audio data if needed
            }
          };
        } catch (recorderError) {
          console.warn("MediaRecorder not supported:", recorderError);
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
    loadAudioDevices();

    return () => {
      if (audioStream) {
        audioStream.getTracks().forEach(track => {
          track.stop();
          track.enabled = false;
        });
      }
    };
  }, []);

  // Load available audio devices
  const loadAudioDevices = useCallback(async () => {
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
      
      if (audioInputs.length > 0 && !selectedDeviceId) {
        setSelectedDeviceId(audioInputs[0].deviceId);
      }
      
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
    } catch (error) {
      console.error("Error loading audio devices:", error);
    } finally {
      setIsLoadingDevices(false);
    }
  }, [isMobile, selectedDeviceId, selectedSpeakerId]);

  // Handle device changes
  useEffect(() => {
    if (!audioStream || !selectedDeviceId) return;

    const updateAudioTrack = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: { deviceId: { exact: selectedDeviceId } }
        });
        
        // Stop old tracks
        audioStream.getTracks().forEach(track => track.stop());
        
        // Set new stream
        setAudioStream(stream);
        
        // Update media recorder
        if (mediaRecorderRef.current?.state === 'recording') {
          mediaRecorderRef.current.stop();
        }
        mediaRecorderRef.current = new MediaRecorder(stream);
        
      } catch (error) {
        console.error("Error updating audio device:", error);
        setErrorMessage("Failed to switch microphone. Please try again.");
      }
    };

    updateAudioTrack();
  }, [selectedDeviceId]);

  // Start conversation
  const startConversation = async () => {
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
      
      await conversation.startSession({
        agentId: process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID!,
      });
      
      startTimeRef.current = new Date();
      setConversationTranscript(prev => [...prev, "Assistant: Hello! How can I help you today?"]);
      
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Failed to start conversation";
      setErrorMessage(errorMsg);
      console.error("Error starting conversation:", error);
    }
  };

  // End conversation
  const endConversation = async () => {
    try {
      setIsEndingConversation(true);
      setErrorMessage("");
      
      // Stop recording
      if (mediaRecorderRef.current?.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
      
      // End session
      await conversation.endSession();
      setCurrentSubtitle("");
      
      // Validate transcript before proceeding
      const transcript = conversationTranscript.join("\n\n");
      if (!transcript.trim()) {
        setErrorMessage("Cannot save empty conversation");
        return;
      }
      
      // Generate summary if needed
      if (!conversationSummary && !isGeneratingSummary) {
        try {
          const summary = await generateSummary(transcript);
          setConversationSummary(summary);
        } catch (error) {
          setConversationSummary("Failed to generate summary");
        }
      }
      
      // Save conversation
      try {
        const savedData = await saveConversation(transcript);
        setSavedConversation(savedData);
      } catch (error) {
        setErrorMessage("Failed to save conversation. Please try saving again.");
      }
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to end conversation";
      setErrorMessage(errorMessage);
    } finally {
      setIsEndingConversation(false);
    }
  };

  // Generate summary
  const generateSummary = async (transcript: string): Promise<string> => {
    try {
      setIsGeneratingSummary(true);
      if (!transcript.trim()) {
        return "No transcript available to summarize";
      }

      const response = await fetch('/api/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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

  // Save conversation to database
  const saveConversation = async (transcript: string): Promise<any> => {
    if (!session?.user?.id || !startTimeRef.current) {
      throw new Error("Cannot save conversation: User not authenticated");
    }

    try {
      setIsSaving(true);
      setErrorMessage("");
      
      const endTime = new Date();
      const startTime = startTimeRef.current;
      const duration = Math.floor((endTime.getTime() - startTime.getTime()) / 1000);
      
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
        headers: { 'Content-Type': 'application/json' },
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



  // Toggle mute
  const toggleMute = async () => {
    try {
      await conversation.setVolume({ volume: isMuted ? 1 : 0 });
      setIsMuted(!isMuted);
    } catch (error) {
      setErrorMessage("Failed to change volume");
      console.error("Error changing volume:", error);
    }
  };

  // Toggle settings panel
  const toggleSettings = useCallback(() => {
    setShowSettings(prev => !prev);
  }, []);

  // Close settings panel
  const closeSettings = useCallback(() => {
    setShowSettings(false);
  }, []);

  // Toggle mic dropdown
  const toggleMicDropdown = () => {
    setIsMicDropdownOpen(prev => !prev);
    if (isSpeakerDropdownOpen) setIsSpeakerDropdownOpen(false);
  };

  // Toggle speaker dropdown
  const toggleSpeakerDropdown = () => {
    setIsSpeakerDropdownOpen(prev => !prev);
    if (isMicDropdownOpen) setIsMicDropdownOpen(false);
  };

  // Handle device selection
  const handleDeviceSelect = (deviceId: string) => {
    setSelectedDeviceId(deviceId);
    setIsMicDropdownOpen(false);
  };

  // Handle speaker selection
  const handleSpeakerSelect = (deviceId: string) => {
    setSelectedSpeakerId(deviceId);
    setIsSpeakerDropdownOpen(false);
    
    // For iOS, we need to handle speaker selection differently
    if (isIOS) {
      const audioElements = document.getElementsByTagName('audio');
      for (let i = 0; i < audioElements.length; i++) {
        try {
          // @ts-ignore - webkitAudioContext is not in the type definition
          const audioContext = new (window.AudioContext || window.webkitAudioContext)();
          if (audioContext.setSinkId) {
            // @ts-ignore - setSinkId is not in the type definition
            audioContext.setSinkId(deviceId);
          }
        } catch (error) {
          console.error("Error setting audio output:", error);
        }
      }
    }
  };

  // Handle audio output mode change (for mobile)
  const handleAudioOutputModeChange = (mode: 'auto' | 'speaker' | 'earpiece') => {
    setAudioOutputMode(mode);
    
    // For iOS, we need to handle audio session category
    if (isIOS) {
      try {
        // @ts-ignore - webkitAudioContext is not in the type definition
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!audioContextRef.current) {
          audioContextRef.current = new AudioContext();
        }
        
        // @ts-ignore - webkitAudioSession is not in the type definition
        if (audioContextRef.current.audioWorklet && audioContextRef.current.audioWorklet.addModule) {
          // @ts-ignore - webkitAudioSession is not in the type definition
          audioContextRef.current.audioSession.overrideOutputAudioPort(
            mode === 'speaker' ? 'speaker' : 'none'
          );
        }
      } catch (error) {
        console.error("Error setting audio output mode:", error);
      }
    }
  };

  return {
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
    isSpeaking: conversation.isSpeaking,
    isConnecting: conversation.status === 'connecting',
    isConversationActive: conversation.status === 'connected',
    
    // Refs
    micDropdownRef,
    speakerDropdownRef,
    
    // Actions
    startConversation,
    endConversation,
    toggleMute,
    toggleSettings,
    toggleMicDropdown,
    toggleSpeakerDropdown,
    handleDeviceSelect,
    handleSpeakerSelect,
    handleAudioOutputModeChange,
    
    // Close settings
    closeSettings: () => setShowSettings(false),
    
    // Save conversation
    saveConversation,
  };
};
