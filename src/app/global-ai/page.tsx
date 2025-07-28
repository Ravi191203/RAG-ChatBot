
"use client";

import { useState, useEffect, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { ChatPanel } from "@/components/chat-panel";
import { Bot, Home, MessageSquare, Save, Sparkles } from 'lucide-react';
import { Button } from "@/components/ui/button";
import Link from "next/link";


export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

// Generate a simple session ID
const getSessionId = () => {
  if (typeof window !== 'undefined') {
    let sessionId = sessionStorage.getItem("chatSessionId");
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      sessionStorage.setItem("chatSessionId", sessionId);
    }
    return sessionId;
  }
  return null;
}


export default function GlobalAiPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isResponding, setIsResponding] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState("googleai/gemini-1.5-flash-latest");
  const { toast } = useToast();
  const abortControllerRef = useRef<AbortController | null>(null);


  useEffect(() => {
    const id = getSessionId();
    setSessionId(id);
    
    // Load state from session storage
    const storedMessages = sessionStorage.getItem("globalChatMessages");
    if (storedMessages) {
        setMessages(JSON.parse(storedMessages));
    }
  }, []);

  // Persist messages to session storage whenever they change
  useEffect(() => {
    if (messages.length > 0) {
      sessionStorage.setItem("globalChatMessages", JSON.stringify(messages));
    }
  }, [messages]);


  const handleSendMessage = async (question: string) => {
    if (!sessionId) {
      toast({
        title: "Error",
        description: "Session not initialized.",
        variant: "destructive",
      });
      return;
    }
    
    const newMessages: ChatMessage[] = [...messages, { role: "user", content: question }];
    setMessages(newMessages);
    setIsResponding(true);

    try {
       const controller = new AbortController();
       abortControllerRef.current = controller;

       const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        // We pass `knowledge: ""` to signal to the API this is a general chat
        body: JSON.stringify({ knowledge: "", sessionId, history: newMessages, question, model: selectedModel }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || 'API request failed');
      }

      const result = await response.json();

      const assistantMessage: ChatMessage = { role: "assistant", content: result.answer };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error: any) {
        if (error.name === 'AbortError') {
            console.log("Request aborted by user.");
             const lastMessage = newMessages[newMessages.length - 1];
            if (lastMessage.role === 'user') {
                setMessages(prev => prev.slice(0, -1));
            }
            return;
        }
      console.error(error);
      const errorMessage: ChatMessage = {
        role: "assistant",
        content: "Sorry, I encountered an error. Please try again.",
      };
      setMessages((prev) => [...prev, errorMessage]);
      toast({
        title: "Response Failed",
        description: "Could not get a response. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsResponding(false);
      abortControllerRef.current = null;
    }
  };

  const handleStopGenerating = () => {
    if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        setIsResponding(false);
    }
  };

  const handleRegenerateResponse = () => {
    const lastUserMessage = messages.findLast((msg) => msg.role === 'user');
    if (!lastUserMessage) return;

    // Remove the last AI response and resubmit the user's prompt
    setMessages((prev) => prev.slice(0, -1));
    handleSendMessage(lastUserMessage.content);
  };

  const onMessageSaved = () => {
    toast({
        title: "Saved!",
        description: "Your item has been saved successfully.",
    });
  };

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
       <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b bg-background/80 px-4 backdrop-blur-sm sm:px-6">
        <div className="flex items-center gap-2">
            <Bot className="h-7 w-7 text-primary" />
            <h1 className="text-xl font-bold font-headline">Contextual Companion</h1>
        </div>
         <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" asChild>
                <Link href="/saved">
                    <Save className="mr-2 h-4 w-4" />
                    Saved
                </Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href="/chat">
                <MessageSquare className="mr-2 h-4 w-4" />
                Contextual Chat
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href="/">
                <Home className="mr-2 h-4 w-4" />
                Home
              </Link>
            </Button>
        </div>
      </header>
      <main className="flex-1 p-4 sm:p-6 md:p-8 flex items-start justify-center">
        <div className="w-full max-w-2xl h-[calc(100vh-10rem)]">
            <ChatPanel
              messages={messages}
              onSendMessage={handleSendMessage}
              onRegenerate={handleRegenerateResponse}
              isResponding={isResponding}
              onStopGenerating={handleStopGenerating}
              onMessageSaved={onMessageSaved}
              selectedModel={selectedModel}
              onModelChange={setSelectedModel}
              title="Global AI Chat"
              description="Ask me anything! I'm here to help with any topic."
            />
        </div>
      </main>
    </div>
  );
}
