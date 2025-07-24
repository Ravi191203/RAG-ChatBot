"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import ReactMarkdown from "react-markdown";

type Props = {
  onExtract: (content: string) => Promise<void>;
  knowledge: string;
  isExtracting: boolean;
};

export function KnowledgePanel({ onExtract, knowledge, isExtracting }: Props) {
  const [content, setContent] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onExtract(content);
  };

  return (
    <Card className="flex h-full flex-col">
      <CardHeader>
        <CardTitle className="font-headline">Knowledge Base</CardTitle>
        <CardDescription>
          Paste content below to create a knowledge base for the chat.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-4 overflow-hidden">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Paste your document content here..."
            className="h-40"
            disabled={isExtracting}
          />
          <Button type="submit" disabled={!content.trim() || isExtracting}>
            {isExtracting && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Extract Knowledge
          </Button>
        </form>
        <div className="flex min-h-0 flex-1 flex-col gap-2">
          <h3 className="text-sm font-medium text-muted-foreground">Extracted Knowledge</h3>
          <div className="flex-1 rounded-md border bg-muted/50">
            <ScrollArea className="h-full">
              <div className="prose prose-sm dark:prose-invert p-4">
                {knowledge ? <ReactMarkdown>{knowledge}</ReactMarkdown> : <p>No knowledge extracted yet.</p>}
              </div>
            </ScrollArea>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
