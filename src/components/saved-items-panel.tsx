
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
import { Button } from "./ui/button";
import { Pencil, Trash2, Loader2, Camera } from "lucide-react";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog"
import { Textarea } from "./ui/textarea";
import { useState, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import html2canvas from 'html2canvas';


export type SavedItem = {
    _id: string;
    content: string;
    type: 'knowledge' | 'chat_message';
    createdAt: string;
};

type Props = {
  savedItems: SavedItem[];
  onItemDeleted: () => void;
  onItemUpdated: () => void;
};

export function SavedItemsPanel({ savedItems, onItemDeleted, onItemUpdated }: Props) {
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState("");
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isCapturing, setIsCapturing] = useState<string | null>(null);

  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  
  const savedKnowledge = savedItems.filter(item => item.type === 'knowledge');
  const savedChats = savedItems.filter(item => item.type === 'chat_message');

  const handleDelete = async (id: string) => {
    setIsDeleting(id);
    try {
      const response = await fetch(`/api/knowledge?id=${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('Failed to delete item');
      }
      toast({
        title: 'Success',
        description: 'Item deleted successfully.',
      });
      onItemDeleted();
    } catch (error) {
      console.error(error);
      toast({
        title: 'Error',
        description: 'Could not delete item.',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(null);
    }
  };

  const handleEdit = async () => {
    if (!editingItemId) return;
    setIsEditing(editingItemId);
    try {
      const response = await fetch('/api/knowledge', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editingItemId, content: editingContent }),
      });
      if (!response.ok) {
        throw new Error('Failed to update item');
      }
      toast({
        title: 'Success',
        description: 'Item updated successfully.',
      });
      onItemUpdated();
    } catch (error) {
       console.error(error);
      toast({
        title: 'Error',
        description: 'Could not update item.',
        variant: 'destructive',
      });
    } finally {
      setIsEditing(null);
      setEditingItemId(null);
      setEditingContent("");
      setIsEditDialogOpen(false);
    }
  };

  const handleCapture = async (id: string, index: number) => {
    const cardElement = cardRefs.current[index];
    if (!cardElement) return;

    setIsCapturing(id);
    try {
        const canvas = await html2canvas(cardElement, {
            useCORS: true,
            backgroundColor: null, 
        });
        const dataUrl = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.href = dataUrl;
        link.download = `capture-${id}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast({
            title: 'Success',
            description: 'Image snippet captured and downloaded.',
        });
    } catch (error) {
        console.error('Error capturing element:', error);
        toast({
            title: 'Error',
            description: 'Could not capture image.',
            variant: 'destructive',
        });
    } finally {
        setIsCapturing(null);
    }
  };
  
  const openEditDialog = (item: SavedItem) => {
    setEditingItemId(item._id);
    setEditingContent(item.content);
    setIsEditDialogOpen(true);
  };
  
  const SavedItemCard = ({ item, index }: { item: SavedItem, index: number }) => (
    <div key={item._id} ref={el => cardRefs.current[index] = el} className="p-4 rounded-md border bg-background relative group">
      <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
         <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleCapture(item._id, index)} disabled={!!isCapturing}>
          {isCapturing === item._id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
          <span className="sr-only">Capture</span>
        </Button>
        <Dialog open={isEditDialogOpen && editingItemId === item._id} onOpenChange={(open) => { if (!open) setIsEditDialogOpen(false)}}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEditDialog(item)}>
              <Pencil className="h-4 w-4" />
              <span className="sr-only">Edit</span>
            </Button>
          </DialogTrigger>
        </Dialog>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-destructive/10 hover:text-destructive">
               {isDeleting === item._id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
               <span className="sr-only">Delete</span>
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete this item.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={() => handleDelete(item._id)} disabled={!!isDeleting}>
                {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
      <p className="text-xs text-muted-foreground mb-2">Saved on: {format(new Date(item.createdAt), "PPP p")}</p>
      <div className="prose prose-sm dark:prose-invert max-w-none">
          <ReactMarkdown remarkPlugins={[remarkGfm]} components={{ code: CodeBlock }}>
              {item.content}
          </ReactMarkdown>
      </div>
    </div>
  );

  return (
    <>
      <Card className="flex h-full flex-col">
        <CardHeader>
          <CardTitle className="font-headline">Saved Items</CardTitle>
          <CardDescription>
            Review, edit, or delete your saved knowledge bases and chat messages.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-1 flex-col gap-4 overflow-hidden">
          <Tabs defaultValue="knowledge" className="flex flex-1 flex-col gap-4 overflow-hidden">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="knowledge">Saved Knowledge ({savedKnowledge.length})</TabsTrigger>
              <TabsTrigger value="chats">Saved Chats ({savedChats.length})</TabsTrigger>
            </TabsList>
            
            <TabsContent value="knowledge" className="flex-1 m-0">
               <ScrollArea className="h-[40vh] md:h-72 rounded-md border bg-muted/50">
                  <div className="p-4 space-y-4">
                      {savedKnowledge.length > 0 ? savedKnowledge.map((item, index) => (
                          <SavedItemCard key={item._id} item={item} index={index}/>
                      )) : (
                          <p className="text-center text-muted-foreground p-8">No knowledge bases saved yet.</p>
                      )}
                  </div>
              </ScrollArea>
            </TabsContent>
             <TabsContent value="chats" className="flex-1 m-0">
               <ScrollArea className="h-[40vh] md:h-72 rounded-md border bg-muted/50">
                  <div className="p-4 space-y-4">
                      {savedChats.length > 0 ? savedChats.map((item, index) => (
                          <SavedItemCard key={item._id} item={item} index={savedKnowledge.length + index} />
                      )) : (
                          <p className="text-center text-muted-foreground p-8">No chat messages saved yet.</p>
                      )}
                  </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Dialog open={isEditDialogOpen && !!editingItemId} onOpenChange={(open) => { if (!open) { setIsEditDialogOpen(false); setEditingItemId(null); } }}>
         <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Item</DialogTitle>
              <DialogDescription>Make changes to your saved item below.</DialogDescription>
            </DialogHeader>
            <Textarea 
              value={editingContent}
              onChange={(e) => setEditingContent(e.target.value)}
              className="min-h-[200px] text-sm"
            />
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
              <Button onClick={handleEdit} disabled={!!isEditing}>
                {isEditing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
      </Dialog>
    </>
  );
}
