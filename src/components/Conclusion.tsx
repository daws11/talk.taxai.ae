"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Share2, Copy, CheckCircle2, Loader2, X, Save } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from '@/contexts/LanguageContext';

interface ConclusionProps {
  transcript: string;
  summary: string;
  onClose: () => void;
  onSave: () => Promise<void>;
  isSaving: boolean;
  onShare: () => void;
}

const Conclusion: React.FC<ConclusionProps> = ({
  transcript,
  summary,
  onClose,
  onSave,
  isSaving,
  onShare,
}) => {
  const { t } = useLanguage();
  const [isGenerating, setIsGenerating] = React.useState(true);
  const [showContent, setShowContent] = React.useState(false);

  React.useEffect(() => {
    // Simulate loading state for better UX
    const timer = setTimeout(() => {
      setIsGenerating(false);
      setShowContent(true);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  const handleSave = async () => {
    try {
      await onSave();
    } catch (error) {
      console.error("Error saving conversation:", error);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
    >
      <Card className="w-full max-w-4xl max-h-[90vh] bg-gray-900/95 backdrop-blur-sm border-gray-800 overflow-hidden">
        <CardHeader className="border-b border-gray-800">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-semibold text-white flex items-center gap-2">
              {isGenerating ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin text-indigo-400" />
                  <span>{t('conclusion.generating')}</span>
                </>
              ) : (
                t('conclusion.title')
              )}
            </CardTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-gray-400 hover:text-white hover:bg-gray-800"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-8rem)]">
          <AnimatePresence mode="wait">
            {isGenerating ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center py-12 space-y-4"
              >
                <div className="relative">
                  <Loader2 className="h-12 w-12 animate-spin text-indigo-400" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="h-8 w-8 rounded-full border-2 border-indigo-400 border-t-transparent animate-spin" />
                  </div>
                </div>
                <p className="text-gray-400 text-center">
                  {t('conclusion.analyzing')}
                </p>
              </motion.div>
            ) : (
              <motion.div
                key="content"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-indigo-400" />
                    {t('conclusion.summary')}
                  </h3>
                  <div className="p-4 rounded-lg bg-gray-800/50 border border-gray-700">
                    <p className="text-gray-300 whitespace-pre-wrap">{summary}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-indigo-400" />
                    {t('conclusion.transcript')}
                  </h3>
                  <div className="p-4 rounded-lg bg-gray-800/50 border border-gray-700 max-h-[40vh] overflow-y-auto">
                    <div className="space-y-4">
                      {transcript.split("\n\n").map((message, index) => {
                        const isUser = message.startsWith("You:");
                        return (
                          <div
                            key={index}
                            className={`p-3 rounded-lg ${
                              isUser
                                ? "bg-indigo-900/20 border border-indigo-800/30"
                                : "bg-gray-700/20 border border-gray-600/30"
                            }`}
                          >
                            <p className="text-sm font-medium text-gray-400 mb-1">
                              {isUser ? t('conclusion.you') : t('conclusion.assistant')}
                            </p>
                            <p className="text-gray-300 whitespace-pre-wrap">
                              {message.replace(/^(You|Assistant):\s*/, "")}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-gray-800">
                  <Button
                    variant="outline"
                    onClick={onShare}
                    className="text-gray-300 border-gray-700 hover:bg-gray-800 hover:text-white"
                  >
                    <Share2 className="h-4 w-4 mr-2" />
                    {t('conclusion.share')}
                  </Button>
                  <Button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        {t('conclusion.saving')}
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        {t('conclusion.save')}
                      </>
                    )}
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default Conclusion; 