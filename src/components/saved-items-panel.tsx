
"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { CodeBlock } from "./code-block";
import { format } from "date-fns";

export type SavedItem = {
    _id: string;
    content: string;
    type: 'knowledge' | 'chat_message';
    createdAt: string;
};

type Props = {
  savedItems: SavedItem[];
};

export function SavedItemsPanel({ savedItems }: Props) {
  
  const savedKnowledge = savedItems.filter(item => item.type === 'knowledge');
  const savedChats = savedItems.filter(item => item.type === 'chat_message');

  return (
    <Card className="flex h-full flex-col">
      <CardHeader>
        <CardTitle className="font-headline">Saved Items</CardTitle>
        <CardDescription>
          Review your saved knowledge bases and chat messages.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-4 overflow-hidden">
        <Tabs defaultValue="knowledge" className="flex flex-1 flex-col gap-4 overflow-hidden">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="knowledge">Saved Knowledge ({savedKnowledge.length})</TabsTrigger>
            <TabsTrigger value="chats">Saved Chats ({savedChats.length})</TabsTrigger>
          </TabsList>
          
          <TabsContent value="knowledge" className="flex-1 m-0">
             <ScrollArea className="h-72 rounded-md border bg-muted/50">
                <div className="p-4 space-y-4">
                    {savedKnowledge.length > 0 ? savedKnowledge.map(item => (
                        <div key={item._id} className="p-4 rounded-md border bg-background">
                            <p className="text-xs text-muted-foreground mb-2">Saved on: {format(new Date(item.createdAt), "PPP p")}</p>
                            <div className="prose prose-sm dark:prose-invert max-w-none">
                                <ReactMarkdown remarkPlugins={[remarkGfm]} components={{ code: CodeBlock }}>
                                    {item.content}
                                </ReactMarkdown>
                            </div>
                        </div>
                    )) : (
                        <p className="text-center text-muted-foreground p-8">No knowledge bases saved yet.</p>
                    )}
                </div>
            </ScrollArea>
          </TabsContent>
           <TabsContent value="chats" className="flex-1 m-0">
             <ScrollArea className="h-72 rounded-md border bg-muted/50">
                <div className="p-4 space-y-4">
                    {savedChats.length > 0 ? savedChats.map(item => (
                        <div key={item._id} className="p-4 rounded-md border bg-background">
                            <p className="text-xs text-muted-foreground mb-2">Saved on: {format(new Date(item.createdAt), "PPP p")}</p>
                             <div className="prose prose-sm dark:prose-invert max-w-none">
                                <ReactMarkdown remarkPlugins={[remarkGfm]} components={{ code: CodeBlock }}>
                                    {item.content}
                                </ReactMarkdown>
                            </div>
                        </div>
                    )) : (
                        <p className="text-center text-muted-foreground p-8">No chat messages saved yet.</p>
                    )}
                </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
