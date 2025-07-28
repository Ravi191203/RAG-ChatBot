
"use client";

import type { ChatMessage as ChatMessageType } from "@/app/chat/page";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { Bot, User, Plus, Speaker, RefreshCw } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { CodeBlock } from "./code-block";
import { Button } from "./ui/button";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/context/auth-context";


type Props = {
  message: ChatMessageType;
  isLastMessage: boolean;
  onRegenerate?: () => void;
  onMessageSaved?: () => void;
};

export function ChatMessage({ message, isLastMessage, onRegenerate, onMessageSaved }: Props) {
  const isUser = message.role === "user";
  const { toast } = useToast();
  const { user } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);

  const handleSaveMessage = async () => {
    if (!user) {
        toast({ title: "Authentication Error", description: "You must be logged in to save messages.", variant: "destructive" });
        return;
    }
    setIsSaving(true);
    try {
      const response = await fetch('/api/knowledge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            knowledge: message.content, 
            type: 'chat_message',
            userId: user.uid 
        }),
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

  const handlePlayAudio = async () => {
    if (audio) {
      audio.play();
      return;
    }
    
    setIsSynthesizing(true);
    try {
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: message.content }),
      });

      if (!response.ok) {
        throw new Error('Failed to synthesize speech');
      }

      const data = await response.json();
      const audioSrc = data.audio;
      const newAudio = new Audio(audioSrc);
      setAudio(newAudio);
      newAudio.play();
    } catch (error) {
      console.error(error);
      toast({
        title: "Audio Failed",
        description: "Could not play audio. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSynthesizing(false);
    }
  };


  return (
    <div
      className={cn(
        "group flex items-start gap-3 w-full",
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
          "relative max-w-[85%] rounded-lg p-3 text-sm shadow-md",
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
         {!isUser && isLastMessage && (
          <div className="absolute right-0 -bottom-10 flex opacity-0 transition-opacity group-hover:opacity-100">
            <Button variant="ghost" size="icon" onClick={handlePlayAudio} disabled={isSynthesizing}>
              {isSynthesizing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Speaker className="h-4 w-4" />}
              <span className="sr-only">Play Audio</span>
            </Button>
            <Button variant="ghost" size="icon" onClick={handleSaveMessage} disabled={isSaving}>
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              <span className="sr-only">Save Message</span>
            </Button>
            {onRegenerate && (
                <Button variant="ghost" size="icon" onClick={onRegenerate}>
                    <RefreshCw className="h-4 w-4" />
                    <span className="sr-only">Regenerate Response</span>
                </Button>
            )}
          </div>
        )}
      </div>
      {isUser && (
        <Avatar className="h-8 w-8 shrink-0">
            {user?.photoURL ? (
                <AvatarImage src={user.photoURL} alt={user.displayName || "User"} />
            ) : (
                <AvatarFallback>
                    <User className="h-5 w-5" />
                </AvatarFallback>
            )}
        </Avatar>
      )}
    </div>
  );
}
