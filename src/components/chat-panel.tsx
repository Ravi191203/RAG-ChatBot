
"use client";

import type { ChatMessage as ChatMessageType } from "@/app/chat/page";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea, ScrollAreaViewport } from "@/components/ui/scroll-area";
import { Loader2, Send, RefreshCw, Square } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { ChatMessage } from "./chat-message";
import { TypingIndicator } from "./typing-indicator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"


type Props = {
  messages: ChatMessageType[];
  onSendMessage: (question: string) => Promise<void>;
  onRegenerate: () => void;
  isResponding: boolean;
  onStopGenerating: () => void;
  knowledge?: string; // Optional for global chat
  onMessageSaved: () => void;
  selectedModel: string;
  onModelChange: (model: string) => void;
  title: string;
  description: string;
};

export function ChatPanel({
  messages,
  onSendMessage,
  onRegenerate,
  isResponding,
  onStopGenerating,
  knowledge,
  onMessageSaved,
  selectedModel,
  onModelChange,
  title,
  description
}: Props) {
  const [input, setInput] = useState("");
  const scrollAreaViewportRef = useRef<HTMLDivElement>(null);

  const lastMessageIsAssistant = messages.length > 0 && messages[messages.length - 1].role === 'assistant';

  useEffect(() => {
    if (scrollAreaViewportRef.current) {
      scrollAreaViewportRef.current.scrollTop = scrollAreaViewportRef.current.scrollHeight;
    }
  }, [messages, isResponding]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isResponding) return;
    onSendMessage(input);
    setInput("");
  };
  
  // Disable chat if responding. If knowledge is provided, also check for its presence.
  const isInputDisabled = knowledge !== undefined ? (!knowledge || isResponding) : isResponding;

  const geminiModels = [
    { value: "googleai/gemini-1.5-flash-latest", label: "Gemini 1.5 Flash (Fast)" },
    { value: "googleai/gemini-pro", label: "Gemini Pro (Balanced)" },
    { value: "googleai/gemini-1.5-pro-latest", label: "Gemini 1.5 Pro (Powerful)" },
  ];

  return (
    <Card className="flex h-full flex-col">
      <CardHeader>
        <div className="flex justify-between items-start">
            <div>
                <CardTitle className="font-headline">{title}</CardTitle>
                <CardDescription>{description}</CardDescription>
            </div>
            <Select value={selectedModel} onValueChange={onModelChange} disabled={isResponding}>
                <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Select a model" />
                </SelectTrigger>
                <SelectContent>
                    {geminiModels.map((model) => (
                        <SelectItem key={model.value} value={model.value}>
                            {model.label}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          <ScrollAreaViewport ref={scrollAreaViewportRef} className="h-full">
            <div className="space-y-6 pr-4">
              {messages.length === 0 ? (
                <div className="flex h-full items-center justify-center">
                  <p className="text-center text-muted-foreground">
                    { isInputDisabled && knowledge !== undefined
                      ? "First, provide a document and extract knowledge."
                      : "Ask a question to get started."}
                  </p>
                </div>
              ) : (
                messages.map((msg, index) => (
                  <ChatMessage 
                    key={index} 
                    message={msg} 
                    isLastMessage={index === messages.length - 1}
                    onRegenerate={onRegenerate}
                    onMessageSaved={onMessageSaved}
                 />
                ))
              )}
              {isResponding && <TypingIndicator />}
            </div>
          </ScrollAreaViewport>
        </ScrollArea>
      </CardContent>
      <CardFooter className="pt-4">
         <div className="flex w-full items-center space-x-2">
            {isResponding ? (
                 <Button
                    variant="outline"
                    className="w-full"
                    onClick={onStopGenerating}
                >
                    <Square className="mr-2 h-4 w-4" />
                    Stop Generating
                </Button>
            ) : (
                <form
                    onSubmit={handleSubmit}
                    className="flex w-full items-center space-x-2"
                >
                    <Input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder={
                        isInputDisabled && knowledge !== undefined
                            ? "Waiting for knowledge base..."
                            : "Type your question..."
                        }
                        disabled={isInputDisabled}
                        autoComplete="off"
                    />
                    <Button
                        type="submit"
                        size="icon"
                        disabled={isInputDisabled || !input.trim()}
                        aria-label="Send message"
                    >
                        <Send className="h-4 w-4" />
                    </Button>
                    {lastMessageIsAssistant && !isResponding && (
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={onRegenerate}
                            disabled={isResponding}
                            aria-label="Regenerate response"
                            >
                            <RefreshCw className="h-4 w-4" />
                        </Button>
                    )}
                </form>
            )}
        </div>
      </CardFooter>
    </Card>
  );
}
