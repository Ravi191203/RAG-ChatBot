
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
import { Loader2, Send } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { ChatMessage } from "./chat-message";
import { TypingIndicator } from "./typing-indicator";

type Props = {
  messages: ChatMessageType[];
  onSendMessage: (question: string) => Promise<void>;
  isResponding: boolean;
  knowledge: string;
  onMessageSaved: () => void;
};

export function ChatPanel({
  messages,
  onSendMessage,
  isResponding,
  knowledge,
  onMessageSaved
}: Props) {
  const [input, setInput] = useState("");
  const scrollAreaViewportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollAreaViewportRef.current) {
      scrollAreaViewportRef.current.scrollTop = scrollAreaViewportRef.current.scrollHeight;
    }
  }, [messages, isResponding]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    onSendMessage(input);
    setInput("");
  };

  const isChatDisabled = !knowledge || isResponding;

  return (
    <Card className="flex h-full flex-col">
      <CardHeader>
        <CardTitle className="font-headline">Chat</CardTitle>
        <CardDescription>Ask questions about the provided context.</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          <ScrollAreaViewport ref={scrollAreaViewportRef} className="h-full">
            <div className="space-y-6 pr-4">
              {messages.length === 0 ? (
                <div className="flex h-full items-center justify-center">
                  <p className="text-center text-muted-foreground">
                    {knowledge
                      ? "Ask a question to get started."
                      : "First, provide a document and extract knowledge."}
                  </p>
                </div>
              ) : (
                messages.map((msg, index) => (
                  <ChatMessage key={index} message={msg} onMessageSaved={onMessageSaved} />
                ))
              )}
              {isResponding && <TypingIndicator />}
            </div>
          </ScrollAreaViewport>
        </ScrollArea>
      </CardContent>
      <CardFooter className="pt-4">
        <form
          onSubmit={handleSubmit}
          className="flex w-full items-center space-x-2"
        >
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              isChatDisabled
                ? "Waiting for knowledge base..."
                : "Type your question..."
            }
            disabled={isChatDisabled}
            autoComplete="off"
          />
          <Button
            type="submit"
            size="icon"
            disabled={isChatDisabled || !input.trim()}
            aria-label="Send message"
          >
            {isResponding ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </form>
      </CardFooter>
    </Card>
  );
}
