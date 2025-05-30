import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import * as ScrollArea from '@radix-ui/react-scroll-area';
import { Clock, MessageSquare } from "lucide-react";
import Conclusion from "./Conclusion";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from '@/contexts/LanguageContext';

interface Conversation {
  _id: string;
  transcript: string;
  summary: string;
  duration: number;
  createdAt: string;
  status: string;
}

const ConversationHistory: React.FC = () => {
  const { t } = useLanguage();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [showConclusion, setShowConclusion] = useState(false);

  useEffect(() => {
    fetchConversations();
  }, []);

  const fetchConversations = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/conversations');
      if (!response.ok) {
        throw new Error('Failed to fetch conversations');
      }
      const data = await response.json();
      setConversations(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load conversations');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return "Invalid date";
      }
      return new Intl.DateTimeFormat('en-US', {
        dateStyle: 'medium',
        timeStyle: 'short'
      }).format(date);
    } catch (error) {
      console.error("Error formatting date:", error);
      return "Invalid date";
    }
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return t('history.duration', { minutes, seconds: remainingSeconds });
  };

  const handleConversationClick = (conversation: Conversation) => {
    setSelectedConversation(conversation);
    setShowConclusion(true);
  };

  return (
    <div className="w-full max-w-2xl mx-auto mt-8">
      <Card className="w-full bg-card/50 backdrop-blur-sm border-border">
        <CardHeader>
          <CardTitle className="text-card-foreground flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            {t('history.title')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              {t('history.loading')}
            </div>
          ) : error ? (
            <div className="text-center py-8 text-destructive">
              {t('history.error')}
            </div>
          ) : conversations.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {t('history.empty')}
            </div>
          ) : (
            <ScrollArea.Root className="h-[400px] pr-4">
              <ScrollArea.Viewport className="h-full w-full">
                <div className="space-y-4">
                  {conversations.map((conversation) => (
                    <motion.div
                      key={conversation._id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-accent/50 rounded-lg p-4 cursor-pointer hover:bg-accent/70 transition-colors border border-border"
                      onClick={() => handleConversationClick(conversation)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <p className="text-sm text-card-foreground line-clamp-2">
                            {conversation.summary || t('history.noSummary')}
                          </p>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              <span>{formatDate(conversation.createdAt)}</span>
                            </div>
                            <span>•</span>
                            <span>{formatDuration(conversation.duration)}</span>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-muted-foreground hover:text-foreground hover:bg-accent"
                        >
                          {t('history.view')}
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </ScrollArea.Viewport>
              <ScrollArea.Scrollbar 
                orientation="vertical" 
                className="flex w-2.5 touch-none select-none bg-accent/50 p-0.5"
              >
                <ScrollArea.Thumb className="relative flex-1 rounded-full bg-muted" />
              </ScrollArea.Scrollbar>
            </ScrollArea.Root>
          )}
        </CardContent>
      </Card>

      <AnimatePresence>
        {showConclusion && selectedConversation && (
          <Conclusion
            transcript={selectedConversation.transcript}
            summary={selectedConversation.summary}
            onClose={() => {
              setShowConclusion(false);
              setSelectedConversation(null);
            }}
            onSave={async () => {
              return Promise.resolve();
            }}
            isSaving={false}
            onShare={() => {
              if (navigator.share) {
                const shareText = `${selectedConversation.summary}\n\n${t('conclusion.transcript')}:\n${selectedConversation.transcript}`;
                navigator.share({
                  title: t('conclusion.title'),
                  text: shareText,
                }).catch(error => {
                  console.error("Error sharing:", error);
                });
              }
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default ConversationHistory; 