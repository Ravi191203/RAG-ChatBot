
"use client";

import { useState, useEffect, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { ChatPanel } from "@/components/chat-panel";
import { Bot, Home, LogOut, MessageSquare, Save, Wand2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useAuth } from "@/context/auth-context";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"


export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

// Function to generate a session ID
const generateSessionId = () => `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

export default function GlobalAiPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isResponding, setIsResponding] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState("gemini-1.5-flash-latest");
  const { toast } = useToast();
  const abortControllerRef = useRef<AbortController | null>(null);
  const { user, logout } = useAuth();


  useEffect(() => {
    // Session and message loading logic now runs only on the client
    let currentSessionId = sessionStorage.getItem("chatSessionId");
    if (!currentSessionId) {
      currentSessionId = generateSessionId();
      sessionStorage.setItem("chatSessionId", currentSessionId);
    }
    setSessionId(currentSessionId);
    
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
    if (!sessionId || !user) {
      toast({
        title: "Error",
        description: "Session not initialized or user not logged in.",
        variant: "destructive",
      });
      return;
    }

    const newMessages: ChatMessage[] = [
      ...messages,
      { role: "user", content: question },
    ];
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
        body: JSON.stringify({
          knowledge: "", // No knowledge for global AI
          sessionId,
          history: messages,
          question,
          model: selectedModel,
          userId: user.uid,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || 'API request failed');
      }
      
      const result = await response.json();
      
      setMessages((prevMessages) => [
        ...prevMessages,
        { role: "assistant", content: result.answer },
      ]);

    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.log("Request aborted by user.");
        // Revert the user's message optimistic update
        setMessages(messages);
        return;
      }
      console.error(error);
      const errorMessage: ChatMessage = {
        role: "assistant",
        content: `Sorry, I encountered an error. Please try again. \n\n**Error Details:**\n\`\`\`\n${error.message}\n\`\`\``,
      };
      setMessages((prev) => [...prev, errorMessage]);
      toast({
        title: "Response Failed",
        description:
          "Could not get a response. Please check the error details in the chat.",
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

    // Remove the last assistant response and resubmit the user's prompt
     setMessages((prev) => {
        const lastAiResponseIndex = prev.map(m => m.role).lastIndexOf('assistant');
        if(lastAiResponseIndex > -1) {
             return prev.slice(0, lastAiResponseIndex);
        }
        return prev;
    });
    handleSendMessage(lastUserMessage.content);
  };

  const onMessageSaved = () => {
    toast({
        title: "Saved!",
        description: "Your item has been saved successfully.",
    });
  };

  return (
    <div className="flex flex-col h-screen bg-background text-foreground">
      <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center justify-between border-b bg-background/80 px-4 backdrop-blur-sm sm:px-6">
        <div className="flex items-center gap-2">
          <Bot className="h-7 w-7 text-primary" />
          <h1 className="text-xl font-bold font-headline hidden sm:block">Contextual Companion</h1>
        </div>
        <div className="flex items-center gap-2 sm:gap-4">
          <div className="flex items-center gap-1 sm:gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href="/saved">
                <Save className="mr-0 h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Saved</span>
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href="/tools">
                <Wand2 className="mr-0 h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">AI Tools</span>
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href="/chat">
                <MessageSquare className="mr-0 h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Contextual Chat</span>
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href="/">
                <Home className="mr-0 h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Home</span>
              </Link>
            </Button>
          </div>
          {user && (
            <div className="flex items-center gap-2 sm:gap-4">
              <div className="flex items-center gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user.photoURL || ''} alt={user.displayName || 'User'} />
                  <AvatarFallback>{user.displayName?.charAt(0)}</AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium hidden md:inline">{user.displayName}</span>
              </div>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="icon" className="h-9 w-9">
                    <LogOut className="h-4 w-4" />
                    <span className="sr-only">Sign Out</span>
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure you want to sign out?</AlertDialogTitle>
                    <AlertDialogDescription>
                      You will be redirected to the login page.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={logout}>Sign Out</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          )}
        </div>
      </header>
       <main className="flex-1 overflow-auto">
          <div className="mx-auto max-w-4xl px-4 py-6">
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
