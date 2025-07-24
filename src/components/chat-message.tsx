"use client";

import type { ChatMessage as ChatMessageType } from "@/app/page";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { Bot, User } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { CodeBlock } from "./code-block";

type Props = {
  message: ChatMessageType;
};

export function ChatMessage({ message }: Props) {
  const isUser = message.role === "user";

  return (
    <div
      className={cn(
        "flex items-start gap-3",
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
          "max-w-[80%] rounded-lg p-3 text-sm shadow-sm",
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
