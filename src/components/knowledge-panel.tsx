
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
import { FileUp, Loader2, MessageSquareText, Plus } from "lucide-react";
import { useState, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import remarkGfm from "remark-gfm";
import { CodeBlock } from "./code-block";
import { useAuth } from "@/context/auth-context";


type Props = {
  onExtract: (content: string) => Promise<void>;
  onStartDirectChat: (content: string) => void;
  knowledge: string;
  originalContent: string;
  isExtracting: boolean;
  onKnowledgeSaved: () => void;
};

export function KnowledgePanel({ onExtract, onStartDirectChat, knowledge, originalContent, isExtracting, onKnowledgeSaved }: Props) {
  const [activeTab, setActiveTab] = useState("text");
  const [content, setContent] = useState("");
  const [fileName, setFileName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

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

  const handleSaveKnowledge = async () => {
    if (!knowledge || !user) {
        toast({ title: "Error", description: !user ? "You must be logged in." : "No knowledge to save.", variant: "destructive" });
        return;
    }
    setIsSaving(true);
    try {
      const response = await fetch('/api/knowledge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            knowledge, 
            type: 'knowledge',
            userId: user.uid
        }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || "Failed to save knowledge");
      }
      toast({
        title: "Success",
        description: "Knowledge saved to the database.",
      });
      onKnowledgeSaved();
    } catch (error) {
      console.error(error);
      toast({
        title: "Save Failed",
        description: "Could not save knowledge. Make sure the database is configured.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleExtractSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onExtract(content);
  };

  const handleDirectChatSubmit = (e: React.FormEvent) => {
     e.preventDefault();
     onStartDirectChat(content);
  }
  
  const DisplayContent = ({ content }: { content: string }) => (
    <ScrollArea className="h-full max-h-48 sm:max-h-full">
      <div className="prose prose-sm dark:prose-invert max-w-none p-4 prose-p:my-0 prose-headings:my-0">
        {content ? (
          <ReactMarkdown remarkPlugins={[remarkGfm]} components={{ code: CodeBlock }}>
            {content}
          </ReactMarkdown>
        ) : (
          <p className="text-muted-foreground">No content yet.</p>
        )}
      </div>
    </ScrollArea>
  );


  return (
    <Card className="flex h-full flex-col">
      <CardHeader>
        <CardTitle className="font-headline">Knowledge Base</CardTitle>
        <CardDescription>
          Provide content to create a knowledge base for the chat.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-4 overflow-hidden">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-1 flex-col gap-4 overflow-hidden">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="text">Paste Text</TabsTrigger>
            <TabsTrigger value="file">Upload File</TabsTrigger>
            <TabsTrigger value="direct">Direct Chat</TabsTrigger>
          </TabsList>

          <TabsContent value="text" className="flex flex-1 flex-col gap-4 overflow-hidden m-0">
             <form onSubmit={handleExtractSubmit} className="flex flex-1 flex-col gap-4">
                <Textarea
                  value={content}
                  onChange={(e) => {
                    setContent(e.target.value);
                    setFileName(""); 
                  }}
                  placeholder="Paste your document content here to have the AI extract key knowledge..."
                  className="flex-1 min-h-[150px] sm:min-h-0"
                  disabled={isExtracting}
                />
                <Button type="submit" className="w-full" disabled={!content.trim() || isExtracting}>
                  {isExtracting && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Extract Knowledge
                </Button>
            </form>
          </TabsContent>
          <TabsContent value="file" className="flex flex-1 flex-col gap-4 overflow-hidden m-0">
             <form onSubmit={handleExtractSubmit} className="flex flex-1 flex-col gap-4">
                <div 
                  onDrop={onDrop}
                  onDragOver={onDragOver}
                  onClick={() => document.getElementById('extract-file-input')?.click()}
                  className="flex flex-1 flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/30 p-8 text-center cursor-pointer hover:bg-muted/50 transition-colors min-h-[150px] sm:min-h-0"
                >
                  <FileUp className="h-10 w-10 text-muted-foreground" />
                  <p className="mt-4 text-muted-foreground">
                    {fileName ? fileName : 'Drag & drop a .txt or .md file here, or click to select'}
                  </p>
                  <input 
                    id="extract-file-input" 
                    type="file" 
                    className="hidden" 
                    onChange={handleFilePicker}
                    accept=".txt,.md"
                    disabled={isExtracting}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={!content.trim() || isExtracting}>
                  {isExtracting && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Extract Knowledge
                </Button>
            </form>
          </TabsContent>
          
           <TabsContent value="direct" className="flex flex-1 flex-col gap-4 overflow-hidden m-0">
            <form onSubmit={handleDirectChatSubmit} className="flex flex-1 flex-col gap-4">
              <div className="flex-1 flex flex-col gap-4">
                 <Textarea
                  value={content}
                  onChange={(e) => {
                    setContent(e.target.value);
                    setFileName("");
                  }}
                  placeholder="Paste raw text here to use it directly as context..."
                  className="flex-1 min-h-[100px] sm:min-h-0"
                  disabled={isExtracting}
                />
                <div className="text-center text-sm text-muted-foreground">or</div>
                 <div 
                  onDrop={onDrop}
                  onDragOver={onDragOver}
                  onClick={() => document.getElementById('direct-file-input')?.click()}
                  className="flex flex-1 flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/30 p-6 text-center cursor-pointer hover:bg-muted/50 transition-colors min-h-[100px] sm:min-h-0"
                >
                  <FileUp className="h-8 w-8 text-muted-foreground" />
                  <p className="mt-2 text-muted-foreground">
                    {fileName ? fileName : 'Upload a .txt or .md file'}
                  </p>
                  <input 
                    id="direct-file-input" 
                    type="file" 
                    className="hidden" 
                    onChange={handleFilePicker}
                    accept=".txt,.md"
                    disabled={isExtracting}
                  />
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={!content.trim() || isExtracting}>
                  <MessageSquareText className="mr-2 h-4 w-4" />
                  Start Chat with Content
              </Button>
            </form>
          </TabsContent>
        </Tabs>

        <div className="flex min-h-0 flex-1 flex-col gap-2">
            <Tabs defaultValue="extracted" className="flex flex-1 flex-col overflow-hidden">
                 <div className="flex items-center justify-between">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="extracted">AI-Extracted Knowledge</TabsTrigger>
                        <TabsTrigger value="original">Original Content</TabsTrigger>
                    </TabsList>
                    <Button 
                        variant="outline" 
                        size="sm"
                        onClick={handleSaveKnowledge}
                        disabled={!knowledge || isSaving || !user}
                        className="ml-4"
                    >
                        {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                        Save
                    </Button>
                </div>
                <TabsContent value="extracted" className="flex-1 rounded-md border bg-muted/50 m-0 mt-2">
                   <DisplayContent content={knowledge} />
                </TabsContent>
                <TabsContent value="original" className="flex-1 rounded-md border bg-muted/50 m-0 mt-2">
                    <DisplayContent content={originalContent} />
                </TabsContent>
            </Tabs>
        </div>
      </CardContent>
    </Card>
  );
}
