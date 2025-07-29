
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
import { Loader2, Send, RefreshCw, Square, Save } from "lucide-react";
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
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/auth-context";
import { ScrollArea } from "./ui/scroll-area";


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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isSavingChat, setIsSavingChat] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const lastMessageIsAssistant = messages.length > 0 && messages[messages.length - 1].role === 'assistant';

   const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isResponding]);


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isResponding) return;
    onSendMessage(input);
    setInput("");
  };

  const handleSaveChat = async () => {
    if (!user) {
        toast({ title: "Authentication Error", description: "You must be logged in to save chats.", variant: "destructive" });
        return;
    }
    setIsSavingChat(true);
    try {
        const chatContent = messages.map(m => `**${m.role === 'user' ? 'User' : 'Assistant'}:**\n\n${m.content}`).join('\n\n---\n\n');
        
        const response = await fetch('/api/knowledge', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                knowledge: chatContent, 
                type: 'chat_session',
                userId: user.uid
            })
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.details || "Failed to save chat session");
        }
        
        toast({
            title: "Success",
            description: "Your chat session has been saved.",
        });
        onMessageSaved();
    } catch (error) {
        console.error("Error saving chat:", error);
        toast({
            title: "Save Failed",
            description: "Could not save the chat session.",
            variant: "destructive"
        });
    } finally {
        setIsSavingChat(false);
    }
};

  
  const isInputDisabled = knowledge !== undefined ? (!knowledge || isResponding) : isResponding;

  const geminiModels = [
    { value: "gemini-pro", label: "Gemini Pro" },
    { value: "gemini-1.5-pro-latest", label: "Gemini 1.5 Pro" },
  ];

  return (
    <Card className="flex flex-col h-full w-full max-w-4xl mx-auto shadow-lg border-none">
        <CardHeader className="border-b">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
              <div className="flex-1">
                  <CardTitle className="font-headline">{title}</CardTitle>
                  <CardDescription>{description}</CardDescription>
              </div>
              <div className="flex flex-col sm:flex-row items-stretch gap-2 w-full sm:w-auto">
                  <Button
                      variant="outline"
                      onClick={handleSaveChat}
                      disabled={isSavingChat || messages.length === 0}
                      className="w-full sm:w-auto"
                      >
                      {isSavingChat ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                      Save Chat
                  </Button>
                  <Select value={selectedModel} onValueChange={onModelChange} disabled={isResponding}>
                      <SelectTrigger className="w-full sm:w-[180px]">
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
          </div>
        </CardHeader>
        <CardContent className="flex-1 p-0">
          <div className="p-4 sm:p-6 space-y-6">
              {messages.length === 0 ? (
                <div className="flex h-full items-center justify-center py-20">
                  <p className="text-center text-muted-foreground">
                    { isInputDisabled && knowledge !== undefined
                      ? "First, provide a document on the home page."
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
              <div ref={messagesEndRef} />
            </div>
        </CardContent>
        <CardFooter className="pt-4 border-t bg-background">
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
                              : "Type your message..."
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
