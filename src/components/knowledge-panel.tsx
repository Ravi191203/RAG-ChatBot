"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { FileUp, Loader2 } from "lucide-react";
import { useState, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";

type Props = {
  onExtract: (content: string) => Promise<void>;
  knowledge: string;
  isExtracting: boolean;
};

export function KnowledgePanel({ onExtract, knowledge, isExtracting }: Props) {
  const [content, setContent] = useState("");
  const [fileName, setFileName] = useState("");
  const { toast } = useToast();

  const handleFileChange = (file: File | null) => {
    if (file) {
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        toast({
          title: "Error",
          description: "File size cannot exceed 10MB.",
          variant: "destructive",
        });
        return;
      }

      if (!file.type.startsWith("text/") && !file.name.endsWith('.md')) {
        toast({
          title: "Error",
          description: "Only .txt and .md files are supported for now.",
          variant: "destructive",
        });
        return;
      }
      
      setFileName(file.name);
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        setContent(text);
      };
      reader.readAsText(file);
    }
  };
  
  const onDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (isExtracting) return;
    if (event.dataTransfer.files && event.dataTransfer.files[0]) {
      handleFileChange(event.dataTransfer.files[0]);
    }
  }, [isExtracting]);

  const onDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  const handleFilePicker = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      handleFileChange(event.target.files[0]);
    }
  };


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) {
      toast({
        title: "Error",
        description: "Content cannot be empty.",
        variant: "destructive",
      });
      return;
    }
    onExtract(content);
    setContent("");
    setFileName("");
  };

  return (
    <Card className="flex h-full flex-col">
      <CardHeader>
        <CardTitle className="font-headline">Knowledge Base</CardTitle>
        <CardDescription>
          Provide content to create a knowledge base for the chat.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-4 overflow-hidden">
        <Tabs defaultValue="text" className="flex flex-1 flex-col gap-4 overflow-hidden">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="text">Paste Text</TabsTrigger>
            <TabsTrigger value="file">Upload File</TabsTrigger>
          </TabsList>
          <TabsContent value="text" className="flex flex-1 flex-col gap-4 overflow-hidden">
            <Textarea
              value={content}
              onChange={(e) => {
                setContent(e.target.value);
                setFileName(""); 
              }}
              placeholder="Paste your document content here..."
              className="flex-1"
              disabled={isExtracting}
            />
          </TabsContent>
          <TabsContent value="file" className="flex flex-1 flex-col gap-4 overflow-hidden m-0">
            <div 
              onDrop={onDrop}
              onDragOver={onDragOver}
              onClick={() => document.getElementById('file-input')?.click()}
              className="flex flex-1 flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/30 p-8 text-center cursor-pointer hover:bg-muted/50 transition-colors"
            >
              <FileUp className="h-10 w-10 text-muted-foreground" />
              <p className="mt-4 text-muted-foreground">
                {fileName ? fileName : 'Drag & drop a .txt or .md file here, or click to select'}
              </p>
              <input 
                id="file-input" 
                type="file" 
                className="hidden" 
                onChange={handleFilePicker}
                accept=".txt,.md"
                disabled={isExtracting}
              />
            </div>
          </TabsContent>
          <form onSubmit={handleSubmit}>
            <Button type="submit" className="w-full" disabled={!content.trim() || isExtracting}>
              {isExtracting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Extract Knowledge
            </Button>
          </form>
        </Tabs>
        <div className="flex min-h-0 flex-1 flex-col gap-2">
          <h3 className="text-sm font-medium text-muted-foreground">Extracted Knowledge</h3>
          <div className="flex-1 rounded-md border bg-muted/50">
            <ScrollArea className="h-full">
              <div className="prose prose-sm dark:prose-invert max-w-none p-4">
                {knowledge ? <ReactMarkdown>{knowledge}</ReactMarkdown> : <p className="text-muted-foreground">No knowledge extracted yet.</p>}
              </div>
            </ScrollArea>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
