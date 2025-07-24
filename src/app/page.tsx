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
      <main className="flex-1 p-4 sm:p-6 md:p-8 grid md:grid-cols-2 gap-8 items-start">
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
      <footer className="py-4 px-4 sm:px-6 md:px-8">
        <div className="flex items-center justify-center gap-4">
          <p className="text-center text-xs text-muted-foreground">
            Created with
          </p>
          <div className="flex items-center gap-3">
            <svg
              viewBox="0 0 1024 1024"
              aria-hidden="true"
              className="h-4 w-4 text-muted-foreground"
            >
              <path
                fill="currentColor"
                d="M885.333 469.333H520.533V554.667H793.6C780.8 661.333 704 725.333 618.667 725.333C501.333 725.333 405.333 629.333 405.333 512C405.333 394.667 501.333 298.667 618.667 298.667C672 298.667 716.8 320 750.933 352L821.333 281.6C759.467 226.133 682.667 192 618.667 192C426.667 192 256 362.667 256 512C256 661.333 426.667 832 618.667 832C810.667 832 917.333 698.667 917.333 522.667C917.333 496 917.333 477.867 917.333 469.333H885.333Z"
              ></path>
            </svg>
            <svg
              viewBox="0 0 1024 1024"
              aria-hidden="true"
              className="h-4 w-4 text-muted-foreground"
            >
              <path
                fill="currentColor"
                d="M624.2,63.1l-341.6,198l-0.3,395.7l341.9,198.5l341.9-198.5V261.1L624.2,63.1z M624.2,854.4L316.5,673.5V301.2l307.7-178.4v531.6H624.2z M932.3,673.5L624.2,852.1V707.3l253.9-147.2L624.2,412.8V264l308.1,178.4V673.5zM878.1,438.2L624.2,585.5L370.3,438.2L624.2,291L878.1,438.2z"
              ></path>
            </svg>
            <svg
              viewBox="0 0 1024 1024"
              aria-hidden="true"
              className="h-4 w-4 text-muted-foreground"
            >
              <path
                fill="currentColor"
                d="m82 512l292-171v-170l-292 171z m860 0l-292 171v170l292-171z m-430 255l-292-170v170l292 170z m0-765l292 170v171l-292-171z"
              ></path>
            </svg>
          </div>
        </div>
      </footer>
    </div>
  );
}
