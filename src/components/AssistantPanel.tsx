'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  MessageSquare,
  X,
  Send,
  Mic,
  MicOff,
  Paperclip,
  FileText,
  Sparkles,
  ArrowRight,
  Loader2,
  ChevronDown,
  Trash2,
} from 'lucide-react';
import { trackEvent } from '@/lib/analytics';
import type { LaunchFormInputs, LaunchPack } from '@/lib/types';

// ─── Types ───

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

interface UploadedFile {
  name: string;
  type: string;
  sizeKb: number;
  extractedText: string;
}

interface AssistantPanelProps {
  inputs: LaunchFormInputs;
  pack: LaunchPack | null;
  onInsertBrief: (text: string) => void;
}

// ─── Quick Actions ───

const QUICK_ACTIONS = [
  { label: 'Help me write a better launch brief', icon: '✍️' },
  { label: 'Explain each section of the launch pack', icon: '📖' },
  { label: 'What risks am I missing?', icon: '⚠️' },
  { label: 'Suggest better success metrics', icon: '📊' },
  { label: 'How should I demo this product?', icon: '🎬' },
  { label: 'Write release notes for this launch', icon: '📝' },
  { label: 'How do I use LaunchPilot effectively?', icon: '🚀' },
];

// ─── Simple Markdown Renderer ───

function renderMarkdown(text: string): React.ReactNode {
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];
  let listItems: string[] = [];
  let listType: 'ul' | 'ol' | null = null;

  const flushList = () => {
    if (listItems.length > 0 && listType) {
      const Tag = listType;
      elements.push(
        <Tag key={`list-${elements.length}`} className={listType === 'ol' ? 'list-decimal' : 'list-disc'}>
          {listItems.map((item, i) => (
            <li key={i}>{renderInline(item)}</li>
          ))}
        </Tag>
      );
      listItems = [];
      listType = null;
    }
  };

  const renderInline = (line: string): React.ReactNode => {
    // Bold + italic patterns
    const parts: React.ReactNode[] = [];
    let remaining = line;
    let key = 0;

    while (remaining.length > 0) {
      // Bold: **text**
      const boldMatch = remaining.match(/\*\*(.+?)\*\*/);
      // Italic: *text*
      const italicMatch = remaining.match(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/);
      // Code: `text`
      const codeMatch = remaining.match(/`(.+?)`/);

      // Find earliest match
      const matches = [
        boldMatch ? { type: 'bold', match: boldMatch } : null,
        italicMatch ? { type: 'italic', match: italicMatch } : null,
        codeMatch ? { type: 'code', match: codeMatch } : null,
      ].filter(Boolean).sort((a, b) => (a!.match.index || 0) - (b!.match.index || 0));

      if (matches.length === 0) {
        parts.push(remaining);
        break;
      }

      const first = matches[0]!;
      const idx = first.match.index || 0;

      if (idx > 0) {
        parts.push(remaining.substring(0, idx));
      }

      if (first.type === 'bold') {
        parts.push(<strong key={key++}>{first.match[1]}</strong>);
      } else if (first.type === 'italic') {
        parts.push(<em key={key++}>{first.match[1]}</em>);
      } else if (first.type === 'code') {
        parts.push(<code key={key++}>{first.match[1]}</code>);
      }

      remaining = remaining.substring(idx + first.match[0].length);
    }

    return parts.length === 1 ? parts[0] : <>{parts}</>;
  };

  for (const line of lines) {
    const trimmed = line.trim();

    // Bullet list
    if (/^[-*•]\s/.test(trimmed)) {
      if (listType !== 'ul') flushList();
      listType = 'ul';
      listItems.push(trimmed.replace(/^[-*•]\s/, ''));
      continue;
    }

    // Numbered list
    if (/^\d+[.)]\s/.test(trimmed)) {
      if (listType !== 'ol') flushList();
      listType = 'ol';
      listItems.push(trimmed.replace(/^\d+[.)]\s/, ''));
      continue;
    }

    flushList();

    if (trimmed === '') {
      continue;
    }

    // Heading (### or ##)
    if (/^#{1,3}\s/.test(trimmed)) {
      const headingText = trimmed.replace(/^#{1,3}\s/, '');
      elements.push(
        <p key={`h-${elements.length}`} className="font-semibold mt-1">
          {renderInline(headingText)}
        </p>
      );
      continue;
    }

    // Regular paragraph
    elements.push(
      <p key={`p-${elements.length}`}>
        {renderInline(trimmed)}
      </p>
    );
  }

  flushList();
  return <>{elements}</>;
}

// ─── Main Component ───

export default function AssistantPanel({ inputs, pack, onInsertBrief }: AssistantPanelProps) {
  // Panel state
  const [isOpen, setIsOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  // Conversation state
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // File upload
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Speech
  const [isRecording, setIsRecording] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const recognitionRef = useRef<any>(null);

  // Scroll management
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Check speech support on mount
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    setSpeechSupported(!!SpeechRecognition);
  }, []);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // ─── Panel Toggle ───

  const handleOpen = () => {
    setIsOpen(true);
    setIsClosing(false);
    trackEvent({ name: 'assistant_opened' });
  };

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsOpen(false);
      setIsClosing(false);
    }, 250);
  };

  // ─── Send Message ───

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim()) return;

    const userMessage: Message = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: content.trim(),
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    trackEvent({
      name: 'assistant_message_sent',
      properties: { messageLength: content.length, hasDocContext: !!uploadedFile },
    });

    const startTime = Date.now();

    try {
      // Build conversation history for API
      const apiMessages = [...messages, userMessage].map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const response = await fetch('/api/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: apiMessages,
          documentContext: uploadedFile?.extractedText || undefined,
          launchContext: {
            inputs,
            pack: pack || undefined,
          },
        }),
      });

      const data = await response.json();

      const assistantMessage: Message = {
        id: `msg-${Date.now()}`,
        role: 'assistant',
        content: data.content || 'Sorry, I could not generate a response.',
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, assistantMessage]);

      trackEvent({
        name: 'assistant_response_received',
        properties: { durationMs: Date.now() - startTime, success: true },
      });
    } catch (err) {
      const errorMessage: Message = {
        id: `msg-${Date.now()}`,
        role: 'assistant',
        content: 'Sorry, something went wrong. Please try again.',
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, errorMessage]);

      trackEvent({
        name: 'assistant_response_received',
        properties: { durationMs: Date.now() - startTime, success: false },
      });
    } finally {
      setIsLoading(false);
    }
  }, [messages, uploadedFile, inputs, pack]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(inputValue);
  };

  // ─── File Upload ───

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileSizeKb = Math.round(file.size / 1024);
    const fileType = file.name.split('.').pop()?.toLowerCase() || 'unknown';

    trackEvent({
      name: 'assistant_file_uploaded',
      properties: { fileType, fileSizeKb },
    });

    try {
      let extractedText = '';

      if (fileType === 'txt' || fileType === 'md' || fileType === 'csv') {
        extractedText = await file.text();
      } else if (fileType === 'json') {
        const raw = await file.text();
        try {
          extractedText = JSON.stringify(JSON.parse(raw), null, 2);
        } catch {
          extractedText = raw;
        }
      } else if (fileType === 'pdf') {
        // Use server-side PDF extraction for robustness
        const formData = new FormData();
        formData.append('file', file);
        
        const response = await fetch('/api/parse-pdf', {
          method: 'POST',
          body: formData,
        });
        
        if (!response.ok) {
          throw new Error('Failed to parse PDF on the server.');
        }
        
        const data = await response.json();
        extractedText = data.text;
        
        if (!extractedText || extractedText.trim().length < 10) {
          extractedText = `[PDF file "${file.name}" uploaded — the text content could not be fully extracted. This may be a scanned/image-based PDF. The file is ${fileSizeKb}KB.]`;
        }
      } else {
        // Attempt to read as text for other formats
        try {
          extractedText = await file.text();
        } catch {
          extractedText = `[File "${file.name}" uploaded (${fileSizeKb}KB, .${fileType}). Unable to extract text content.]`;
        }
      }

      setUploadedFile({
        name: file.name,
        type: fileType,
        sizeKb: fileSizeKb,
        extractedText: extractedText.substring(0, 12000), // Cap context length
      });
    } catch (err) {
      console.error('File extraction error:', err);
      setUploadedFile({
        name: file.name,
        type: fileType,
        sizeKb: fileSizeKb,
        extractedText: `[File "${file.name}" uploaded but text extraction failed.]`,
      });
    }

    // Reset input so same file can be re-uploaded
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // ─── Speech-to-Text ───

  const toggleRecording = () => {
    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event: any) => {
      const transcript = Array.from(event.results)
        .map((result: any) => result[0].transcript)
        .join('');
      setInputValue(transcript);
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    recognition.onerror = () => {
      setIsRecording(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsRecording(true);

    trackEvent({ name: 'assistant_voice_used' });
  };

  // ─── Insert to Brief ───

  const handleInsertToBrief = (text: string) => {
    onInsertBrief(text);
    trackEvent({
      name: 'assistant_inserted_into_brief',
      properties: { textLength: text.length },
    });
  };

  // ─── Clear Conversation ───

  const handleClear = () => {
    setMessages([]);
    setUploadedFile(null);
  };

  // ─── Render ───

  return (
    <>
      {/* Floating Trigger Button */}
      {!isOpen && (
        <button
          onClick={handleOpen}
          id="assistant-trigger"
          className="fixed bottom-6 right-6 z-50 h-13 w-13 rounded-full bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white shadow-lg hover:shadow-xl transition-all flex items-center justify-center cursor-pointer assistant-trigger-pulse group"
          title="Open LaunchPilot Assistant"
        >
          <MessageSquare className="h-5.5 w-5.5 group-hover:scale-110 transition-transform" />
          {/* Notification dot */}
          {messages.length === 0 && (
            <span className="absolute -top-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-400 border-2 border-white dark:border-gray-900" />
          )}
        </button>
      )}

      {/* Panel + Backdrop */}
      {isOpen && (
        <>
          {/* Mobile Backdrop */}
          <div
            className={`fixed inset-0 z-40 bg-black/30 backdrop-blur-sm lg:hidden ${isClosing ? 'assistant-backdrop-exit' : 'assistant-backdrop-enter'}`}
            onClick={handleClose}
          />

          {/* Assistant Panel */}
          <div
            className={`fixed top-0 right-0 z-50 h-full w-full sm:w-[400px] flex flex-col bg-white dark:bg-[#0d1117] border-l border-gray-200 dark:border-gray-800 shadow-2xl ${isClosing ? 'assistant-panel-exit' : 'assistant-panel-enter'}`}
            id="assistant-panel"
          >
            {/* Panel Header */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-200 dark:border-gray-800 bg-gray-50/80 dark:bg-gray-900/80 backdrop-blur-sm shrink-0">
              <div className="flex items-center space-x-2.5">
                <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center">
                  <Sparkles className="h-3.5 w-3.5 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white leading-tight">
                    LaunchPilot Assistant
                  </h3>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400 leading-tight">
                    AI Launch Advisor
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-1.5">
                {messages.length > 0 && (
                  <button
                    onClick={handleClear}
                    className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    title="Clear conversation"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
                <button
                  onClick={handleClose}
                  className="p-1.5 text-gray-400 hover:text-gray-900 dark:hover:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  title="Close assistant"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Messages Area */}
            <div
              ref={scrollContainerRef}
              className="flex-1 overflow-y-auto px-5 py-4 space-y-4 assistant-scroll"
            >
              {/* Welcome State */}
              {messages.length === 0 && (
                <div className="space-y-5">
                  {/* Welcome Message */}
                  <div className="bg-gradient-to-br from-indigo-50 to-indigo-100/50 dark:from-indigo-950/30 dark:to-indigo-900/20 border border-indigo-100 dark:border-indigo-900/40 rounded-xl p-4">
                    <p className="text-xs text-indigo-900 dark:text-indigo-200 leading-relaxed">
                      <span className="font-semibold">Hey! 👋</span> I&apos;m your LaunchPilot Assistant — a senior product advisor here to help you craft better launch plans.
                    </p>
                    <p className="text-xs text-indigo-700 dark:text-indigo-300 mt-2 leading-relaxed">
                      Ask me anything about your launch, or try a quick action below.
                    </p>
                  </div>

                  {/* Quick Actions */}
                  <div>
                    <p className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2.5">
                      Quick Actions
                    </p>
                    <div className="space-y-1.5">
                      {QUICK_ACTIONS.map((action) => (
                        <button
                          key={action.label}
                          onClick={() => sendMessage(action.label)}
                          className="w-full text-left px-3 py-2 rounded-lg border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 hover:border-indigo-200 dark:hover:border-indigo-800 text-xs text-gray-700 dark:text-gray-300 transition-all group flex items-center space-x-2.5 cursor-pointer"
                        >
                          <span className="text-sm">{action.icon}</span>
                          <span className="flex-1">{action.label}</span>
                          <ArrowRight className="h-3 w-3 text-gray-300 dark:text-gray-600 group-hover:text-indigo-500 group-hover:translate-x-0.5 transition-all" />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Conversation Messages */}
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-xl px-3.5 py-2.5 text-xs leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-indigo-600 dark:bg-indigo-500 text-white rounded-br-sm'
                        : 'bg-gray-50 dark:bg-gray-800/80 text-gray-700 dark:text-gray-200 border border-gray-100 dark:border-gray-700/60 rounded-bl-sm'
                    }`}
                  >
                    {msg.role === 'assistant' ? (
                      <div className="assistant-msg">
                        {renderMarkdown(msg.content)}
                        {/* Insert to Brief action */}
                        <div className="mt-2.5 pt-2 border-t border-gray-200/60 dark:border-gray-700/40 flex items-center space-x-2">
                          <button
                            onClick={() => handleInsertToBrief(msg.content)}
                            className="inline-flex items-center space-x-1 text-[10px] font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 transition-colors cursor-pointer"
                          >
                            <ChevronDown className="h-3 w-3" />
                            <span>Send to launch brief</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      msg.content
                    )}
                  </div>
                </div>
              ))}

              {/* Typing Indicator */}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-gray-50 dark:bg-gray-800/80 border border-gray-100 dark:border-gray-700/60 rounded-xl rounded-bl-sm px-4 py-3 flex items-center space-x-1.5">
                    <div className="h-1.5 w-1.5 rounded-full bg-indigo-400 typing-dot" />
                    <div className="h-1.5 w-1.5 rounded-full bg-indigo-400 typing-dot" />
                    <div className="h-1.5 w-1.5 rounded-full bg-indigo-400 typing-dot" />
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* File Upload Indicator */}
            {uploadedFile && (
              <div className="px-5 py-2 border-t border-gray-100 dark:border-gray-800 bg-emerald-50/50 dark:bg-emerald-950/20 shrink-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <FileText className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span className="text-[11px] font-medium text-emerald-700 dark:text-emerald-300 truncate max-w-[200px]">
                      {uploadedFile.name}
                    </span>
                    <span className="text-[10px] text-emerald-500 dark:text-emerald-500">
                      ({uploadedFile.sizeKb}KB)
                    </span>
                  </div>
                  <button
                    onClick={() => setUploadedFile(null)}
                    className="text-emerald-400 hover:text-red-500 transition-colors cursor-pointer"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              </div>
            )}

            {/* Input Bar */}
            <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-[#0d1117] shrink-0">
              <form onSubmit={handleSubmit} className="flex items-end space-x-2">
                {/* File Upload */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="shrink-0 p-2 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                  title="Upload a document"
                >
                  <Paperclip className="h-4 w-4" />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".txt,.md,.pdf,.json,.csv,.doc,.docx"
                  className="hidden"
                  onChange={handleFileUpload}
                />

                {/* Text Input */}
                <div className="flex-1 relative">
                  <textarea
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage(inputValue);
                      }
                    }}
                    placeholder="Ask about your launch..."
                    rows={1}
                    className="w-full px-3 py-2 text-xs bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:text-white resize-none max-h-20 overflow-y-auto"
                    disabled={isLoading}
                  />
                </div>

                {/* Mic Button */}
                {speechSupported && (
                  <button
                    type="button"
                    onClick={toggleRecording}
                    className={`shrink-0 p-2 rounded-lg transition-colors cursor-pointer ${
                      isRecording
                        ? 'text-red-500 bg-red-50 dark:bg-red-950/30 recording-pulse'
                        : 'text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                    title={isRecording ? 'Stop recording' : 'Voice input'}
                  >
                    {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                  </button>
                )}

                {/* Send Button */}
                <button
                  type="submit"
                  disabled={!inputValue.trim() || isLoading}
                  className="shrink-0 p-2 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white rounded-lg transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  title="Send message"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </button>
              </form>

              {/* Keyboard hint */}
              <p className="text-[9px] text-gray-400 dark:text-gray-600 mt-1.5 text-center">
                Press <kbd className="px-1 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-[9px] font-mono">Enter</kbd> to send · <kbd className="px-1 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-[9px] font-mono">Shift+Enter</kbd> for new line
              </p>
            </div>
          </div>
        </>
      )}
    </>
  );
}
