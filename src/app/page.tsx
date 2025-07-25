
"use client";

import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { KnowledgePanel } from "@/components/knowledge-panel";
import { ChatPanel } from "@/components/chat-panel";
import { extractKnowledge } from "@/ai/flows/knowledge-extraction";
import { Bot, MessageSquare, BookText, ArrowLeft } from 'lucide-react';
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
    
    const newMessages: ChatMessage[] = [...messages, { role: "user", content: question }];
    setMessages(newMessages);
    setIsResponding(true);

    try {
       const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ knowledge, sessionId, history: newMessages }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || 'API request failed');
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
          <div className="flex items-center gap-4">
            <div className="group relative flex items-center gap-2">
              <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"></path>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"></path>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"></path>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"></path>
                <path d="M1 1h22v22H1z" fill="none"></path>
              </svg>
              <span className="absolute left-1/2 -top-6 hidden -translate-x-1/2 rounded-md bg-foreground px-2 py-1 text-xs text-background opacity-0 transition-opacity group-hover:opacity-100 group-hover:block">Google</span>
            </div>
            <div className="group relative flex items-center gap-2">
              <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5">
                <path d="M18.156 9.344l-6.23-6.23-1.06 1.06-1.047 1.047-4.102 4.101-1.063 1.063-.007.007L0 15.01l4.98-4.98 1.06-1.06h.001l4.103-4.102 1.046-1.046 1.062-1.063 6.215 6.215-3.14 3.14-1.06 1.06-1.047 1.047-1.016 1.016 4.156 4.156 3.86-3.86z" fill="#FFC24A"></path>
                <path d="M4.734 14.547L.01 19.27l3.875 3.875 4.707-4.707-3.86-3.86z" fill="#F48522"></path>
                <path d="M12.984 20.328l-4.172-4.171-1.03-1.031-1.063-1.063-1.063-1.063-1.281 1.282 6.547 6.547 1.062-1.062 1.062-1.063z" fill="#FFA712"></path>
                <path d="M11.922 4.172l-1.063 1.062-1.047 1.047-4.101 4.102-1.063 1.062-4.632 4.633L0 16.078l4.965-4.965 1.062-1.062h.001l4.102-4.102 1.047-1.047 1.062-1.062L18.422 0l-2.344 2.344-4.156 1.828z" fill="#FFCA28"></path>
                <path d="M19.219 10.406L18.156 9.344l-3.86 3.86 1.063 1.062.015.016.016-.016 1.047-1.047 3.844-3.843z" fill="#1E88E5"></path>
                <path d="M.015 19.282l4.72-4.72 3.86 3.86-4.72 4.72z" fill="#0D65C9"></path>
              </svg>
              <span className="absolute left-1/2 -top-6 hidden -translate-x-1/2 rounded-md bg-foreground px-2 py-1 text-xs text-background opacity-0 transition-opacity group-hover:opacity-100 group-hover:block">Firebase</span>
            </div>
             <div className="group relative flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg"  viewBox="0 0 24 24" className="h-5 w-5">
                <path d="m16.83 13.999-.487.487-3.235-3.234-3.236 3.234-.488-.487 3.723-3.724 3.723 3.724Z" fill="#ffc24a"/>
                <path d="m20.243 17.152-3.413-3.413-3.723 3.723 3.413 3.413a2.46 2.46 0 0 0 3.486-.237 2.46 2.46 0 0 0 .237-3.486Z" fill="#f48522"/>
                <path d="m16.83 13.999-3.723 3.723-3.413-3.413.487-.487.01-.01 3.236-3.234 3.403 3.403v.018Z" fill="#ffa712"/>
                <path d="m9.37 11.272-3.723-3.724-.488.487-1.745 1.745a2.462 2.462 0 1 0 3.483 3.483l2.473-2.473Z" fill="#ffca28"/>
                <path d="m13.107 10.279.488-.487-3.723-3.723-3.485 3.485 3.723 3.723 3.485-3.485.012-.013Z" fill="#1e88e5"/>
                <path d="M3.757 6.848a2.46 2.46 0 0 0-.237 3.486 2.46 2.46 0 0 0 3.486.237l1.745-1.745-.012-.012-2.47-2.47L3.757 6.848Z" fill="#0d65c9"/>
              </svg>
              <span className="absolute left-1/2 -top-6 hidden -translate-x-1/2 rounded-md bg-foreground px-2 py-1 text-xs text-background opacity-0 transition-opacity group-hover:opacity-100 group-hover:block">Firebase Studio</span>
            </div>
            <div className="group relative flex items-center gap-2">
              <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4">
                <path d="M18.73 20.47l-3.56-3.57 2.1-2.1L20.83 18.37l-2.1 2.1zM5.27 3.53l3.56 3.57L6.73 9.2 3.17 5.63l2.1-2.1z" fill="#4285f4"></path>
                <path d="M20.83 5.63L18.73 3.53l-2.1 2.1 2.1 2.1 2.1-2.1zM9.2 20.47l2.1-2.1-2.1-2.1L7.1 18.37l2.1 2.1z" fill="#34a853"></path>
                <path d="M12 8.25A3.75 3.75 0 0 0 8.25 12 3.75 3.75 0 0 0 12 15.75a3.75 3.75 0 0 0 3.75-3.75A3.75 3.75 0 0 0 12 8.25z" fill="#fbbc05"></path>
                <path d="M18.83 11.25a.75.75 0 0 0-.75.75c0 3.31-2.69 6-6 6a6.002 6.002 0 0 1-6-6 .75.75 0 0 0-1.5 0c0 4.14 3.36 7.5 7.5 7.5s7.5-3.36 7.5-7.5a.75.75 0 0 0-.75-.75z" fill="#ea4335"></path>
              </svg>
              <span className="absolute left-1/2 -top-6 hidden -translate-x-1/2 rounded-md bg-foreground px-2 py-1 text-xs text-background opacity-0 transition-opacity group-hover:opacity-100 group-hover:block">Gemini</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
