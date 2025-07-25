"use client";

import type { ChatMessage as ChatMessageType } from "@/app/page";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { Bot, User, Plus } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { CodeBlock } from "./code-block";
import { Button } from "./ui/button";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { Loader2 } from "lucide-react";


type Props = {
  message: ChatMessageType;
  onMessageSaved?: () => void;
};

export function ChatMessage({ message, onMessageSaved }: Props) {
  const isUser = message.role === "user";
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveMessage = async () => {
    setIsSaving(true);
    try {
      const response = await fetch('/api/knowledge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ knowledge: message.content, type: 'chat_message' }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || "Failed to save message");
      }
      toast({
        title: "Success",
        description: "Message saved to the database.",
      });
      if (onMessageSaved) {
        onMessageSaved();
      }
    } catch (error) {
      console.error(error);
      toast({
        title: "Save Failed",
        description: "Could not save message. Make sure the database is configured.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      className={cn(
        "group flex items-start gap-3",
        isUser ? "justify-end" : "justify-start"
      )}
    >
      {!isUser && (
        <Avatar className="h-8 w-8 shrink-0">
          <AvatarFallback className="bg-primary text-primary-foreground">
            <Bot className="h-5 w-5" />
          </AvatarFallback>
        </Avatar>
      )}
      <div
        className={cn(
          "relative max-w-[80%] rounded-lg p-3 text-sm shadow-sm",
          isUser
            ? "bg-primary text-primary-foreground"
            : "bg-card",
        )}
      >
        <div className="prose prose-sm dark:prose-invert max-w-none prose-p:my-0 prose-headings:my-0">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              code: CodeBlock,
            }}
          >
            {message.content}
          </ReactMarkdown>
        </div>
         {!isUser && (
          <div className="absolute -right-12 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button variant="ghost" size="icon" onClick={handleSaveMessage} disabled={isSaving}>
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              <span className="sr-only">Save Message</span>
            </Button>
          </div>
        )}
      </div>
      {isUser && (
        <Avatar className="h-8 w-8 shrink-0">
          <AvatarFallback>
            <User className="h-5 w-5" />
          </AvatarFallback>
        </Avatar>
      )}
    </div>
  );
}
