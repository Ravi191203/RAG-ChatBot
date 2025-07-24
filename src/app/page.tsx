"use client";

import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { KnowledgePanel } from "@/components/knowledge-panel";
import { ChatPanel } from "@/components/chat-panel";
import { extractKnowledge } from "@/ai/flows/knowledge-extraction";
import { Bot, MessageSquare, BookText, ArrowLeft } from 'lucide-react';
import type { ChatMessage as ApiChatMessage } from './api/chat/route';
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";


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


export default function Home() {
  const [knowledge, setKnowledge] = useState<string>("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isExtracting, setIsExtracting] = useState(false);
  const [isResponding, setIsResponding] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [activePanel, setActivePanel] = useState<"knowledge" | "chat">("knowledge");
  const { toast } = useToast();

  useEffect(() => {
    const id = getSessionId();
    setSessionId(id);
  }, []);

  useEffect(() => {
    const fetchHistory = async () => {
      if (sessionId) {
        try {
          const response = await fetch(`/api/chat?sessionId=${sessionId}`);
          if (response.ok) {
            const history: ApiChatMessage[] = await response.json();
            setMessages(history.map(h => ({ role: h.role, content: h.content })));
          }
        } catch (error) {
          console.error("Failed to fetch chat history:", error);
        }
      }
    };
    fetchHistory();
  }, [sessionId]);


  const handleExtractKnowledge = async (content: string) => {
    if (!content) {
      toast({
        title: "Error",
        description: "Content cannot be empty.",
        variant: "destructive",
      });
      return;
    }
    setIsExtracting(true);
    setKnowledge("");
    setMessages([]);

    try {
      const result = await extractKnowledge({ content });
      setKnowledge(result.extractedKnowledge);
      toast({
        title: "Success",
        description: "Knowledge extracted successfully.",
      });
      if (window.innerWidth < 768) { // md breakpoint
        setActivePanel("chat");
      }
    } catch (error) {
      console.error(error);
      toast({
        title: "Extraction Failed",
        description: "Could not extract knowledge. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsExtracting(false);
    }
  };

  const handleSendMessage = async (question: string) => {
    if (!sessionId) {
      toast({
        title: "Error",
        description: "Session not initialized.",
        variant: "destructive",
      });
      return;
    }
    const userMessage: ChatMessage = { role: "user", content: question };
    setMessages((prev) => [...prev, userMessage]);
    setIsResponding(true);

    try {
       const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ question, knowledge, sessionId }),
      });

      if (!response.ok) {
        throw new Error('API request failed');
      }

      const result = await response.json();

      const assistantMessage: ChatMessage = { role: "assistant", content: result.answer };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
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
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b bg-background/80 px-4 backdrop-blur-sm sm:px-6">
        <div className="flex items-center gap-2">
            <Bot className="h-7 w-7 text-primary" />
            <h1 className="text-xl font-bold font-headline">Contextual Companion</h1>
        </div>
         <div className="md:hidden">
          {activePanel === 'knowledge' ? (
            <Button variant="outline" size="sm" onClick={() => setActivePanel('chat')} disabled={!knowledge}>
              <MessageSquare className="mr-2 h-4 w-4" />
              Chat
            </Button>
          ) : (
            <Button variant="outline" size="sm" onClick={() => setActivePanel('knowledge')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          )}
        </div>
      </header>
      <main className="flex-1 p-4 sm:p-6 md:p-8 grid md:grid-cols-2 gap-8">
        <div className={cn("md:block", activePanel !== 'knowledge' && 'hidden')}>
            <KnowledgePanel
              onExtract={handleExtractKnowledge}
              knowledge={knowledge}
              isExtracting={isExtracting}
            />
        </div>
        <div className={cn("md:block", activePanel !== 'chat' && 'hidden')}>
            <ChatPanel
              messages={messages}
              onSendMessage={handleSendMessage}
              isResponding={isResponding}
              knowledge={knowledge}
            />
        </div>
      </main>
    </div>
  );
}
