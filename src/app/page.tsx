"use client";

import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { KnowledgePanel } from "@/components/knowledge-panel";
import { ChatPanel } from "@/components/chat-panel";
import { extractKnowledge } from "@/ai/flows/knowledge-extraction";
import { intelligentResponse } from "@/ai/flows/intelligent-responses";
import { Bot } from 'lucide-react';

export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export default function Home() {
  const [knowledge, setKnowledge] = useState<string>("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isExtracting, setIsExtracting] = useState(false);
  const [isResponding, setIsResponding] = useState(false);
  const { toast } = useToast();

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
    const userMessage: ChatMessage = { role: "user", content: question };
    setMessages((prev) => [...prev, userMessage]);
    setIsResponding(true);

    try {
      const result = await intelligentResponse({ question, context: knowledge });
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
      </header>
      <main className="flex-1 p-4 sm:p-6 md:p-8 grid md:grid-cols-2 gap-8">
        <KnowledgePanel
          onExtract={handleExtractKnowledge}
          knowledge={knowledge}
          isExtracting={isExtracting}
        />
        <ChatPanel
          messages={messages}
          onSendMessage={handleSendMessage}
          isResponding={isResponding}
          knowledge={knowledge}
        />
      </main>
    </div>
  );
}
