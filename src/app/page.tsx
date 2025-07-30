
"use client";

import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { KnowledgePanel } from "@/components/knowledge-panel";
import { extractKnowledge } from "@/ai/flows/knowledge-extraction";
import { Bot, MessageSquare, Save, Sparkles, LogOut, Wand2 } from 'lucide-react';
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useAuth } from "@/context/auth-context";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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


export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};


export default function Home() {
  const [knowledge, setKnowledge] = useState<string>("");
  const [originalContent, setOriginalContent] = useState<string>("");
  const [isExtracting, setIsExtracting] = useState(false);
  const { toast } = useToast();
  const router = useRouter();
  const { user, logout } = useAuth();


  useEffect(() => {
    // This effect should only run on the client after hydration
    const storedKnowledge = sessionStorage.getItem("knowledgeBase");
    if (storedKnowledge) {
      setKnowledge(storedKnowledge);
    } else if (user) {
      // If no session knowledge, fetch from DB.
      const fetchLastKnowledge = async () => {
        try {
          const response = await fetch(`/api/knowledge?userId=${user.uid}`);
          if (response.ok) {
            const data = await response.json();
            if (data.knowledge) {
              setKnowledge(data.knowledge);
              sessionStorage.setItem("knowledgeBase", data.knowledge);
            }
          }
        } catch (error) {
          console.error("Could not fetch last knowledge from DB", error);
        }
      };
      fetchLastKnowledge();
    }
     const storedOriginalContent = sessionStorage.getItem("originalContent");
    if (storedOriginalContent) {
      setOriginalContent(storedOriginalContent);
    }
  }, [user]);

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
    setOriginalContent(content);

    try {
      const result = await extractKnowledge({ content });
      let extracted = result.extractedKnowledge;
      if (result.apiKeyUsed === 'backup') {
        extracted += "\n\n*(Powered by backup API key)*";
      }

      setKnowledge(extracted);

      if (typeof window !== 'undefined') {
        sessionStorage.setItem("knowledgeBase", extracted);
        sessionStorage.setItem("originalContent", content);
        // Clear previous chat messages when new knowledge is extracted
        sessionStorage.removeItem("chatMessages");
        sessionStorage.removeItem("globalChatMessages");
      }
      
      toast({
        title: "Success",
        description: "Knowledge extracted. You can now save it or start a chat.",
      });

    } catch (error: any) {
      console.error(error);
      const errorMessage = `Sorry, knowledge extraction failed. Please try again. \n\n**Error Details:**\n\`\`\`\n${error.message}\n\`\`\``;
      setKnowledge(errorMessage);
    } finally {
      setIsExtracting(false);
    }
  };

  const handleStartDirectChat = (content: string) => {
    if (!content.trim()) {
      toast({
        title: "Error",
        description: "Content cannot be empty.",
        variant: "destructive",
      });
      return;
    }
    setKnowledge(content);
     if (typeof window !== 'undefined') {
        sessionStorage.setItem("knowledgeBase", content);
        sessionStorage.removeItem("originalContent");
        sessionStorage.removeItem("chatMessages");
        sessionStorage.removeItem("globalChatMessages");
      }
    toast({
        title: "Success",
        description: "Raw text saved. Redirecting to chat...",
    });
    router.push('/chat');
  };

  const onItemsSaved = () => {
    toast({
        title: "Saved!",
        description: "Your item has been saved successfully.",
    });
  };

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center justify-between border-b bg-background/80 px-4 backdrop-blur-sm sm:px-6">
        <div className="flex items-center gap-2">
            <Bot className="h-7 w-7 text-primary" />
            <h1 className="text-xl font-bold font-headline hidden sm:block">Contextual Companion</h1>
        </div>
         <div className="flex items-center gap-2 sm:gap-4">
             <div className="flex items-center gap-1 sm:gap-2">
                <Button variant="outline" size="sm" asChild>
                    <Link href="/saved">
                        <Save className="mr-0 h-4 w-4 sm:mr-2" />
                        <span className="hidden sm:inline">Saved</span>
                    </Link>
                </Button>
                <Button variant="outline" size="sm" asChild>
                    <Link href="/tools">
                        <Wand2 className="mr-0 h-4 w-4 sm:mr-2" />
                        <span className="hidden sm:inline">AI Tools</span>
                    </Link>
                </Button>
                <Button variant="outline" size="sm" asChild>
                <Link href="/global-ai">
                    <Sparkles className="mr-0 h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline">Global AI</span>
                </Link>
                </Button>
                <Button variant="outline" size="sm" asChild disabled={!knowledge}>
                <Link href="/chat">
                    <MessageSquare className="mr-0 h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline">Contextual Chat</span>
                </Link>
                </Button>
            </div>
            {user && (
                 <div className="flex items-center gap-2 sm:gap-4">
                    <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                            <AvatarImage src={user.photoURL || ''} alt={user.displayName || 'User'} />
                            <AvatarFallback>{user.displayName?.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <span className="text-sm font-medium hidden md:inline">{user.displayName}</span>
                    </div>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="icon" className="h-9 w-9">
                          <LogOut className="h-4 w-4" />
                          <span className="sr-only">Sign Out</span>
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you sure you want to sign out?</AlertDialogTitle>
                          <AlertDialogDescription>
                            You will be redirected to the login page.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={logout}>Sign Out</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                </div>
            )}
        </div>
      </header>
      <main className="flex-1 p-4 sm:p-6 md:p-8 flex flex-col items-center justify-start gap-8">
        <div className="w-full max-w-4xl">
            <KnowledgePanel
              onExtract={handleExtractKnowledge}
              onStartDirectChat={handleStartDirectChat}
              knowledge={knowledge}
              originalContent={originalContent}
              isExtracting={isExtracting}
              onKnowledgeSaved={onItemsSaved}
            />
        </div>
      </main>
      <footer className="py-4 px-4 sm:px-6 md:px-8">
        <div className="flex items-center justify-center gap-4">
          <p className="text-center text-xs text-muted-foreground">
            Created with
          </p>
          <div className="flex items-center gap-4">
            <div className="group relative flex items-center gap-2">
              <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"></path>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"></path>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"></path>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"></path>
                <path d="M1 1h22v22H1z" fill="none"></path>
              </svg>
              <span className="absolute left-1/2 -top-6 hidden -translate-x-1/2 rounded-md bg-foreground px-2 py-1 text-xs text-background opacity-0 transition-opacity group-hover:opacity-100 group-hover:block">Google</span>
            </div>
            <div className="group relative flex items-center gap-2">
              <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5">
                <path d="M18.156 9.344l-6.23-6.23-1.06 1.06-1.047 1.047-4.102 4.101-1.063 1.063-.007.007L0 15.01l4.98-4.98 1.06-1.06h.001l4.103-4.102 1.046-1.046 1.062-1.063 6.215 6.215-3.14 3.14-1.06 1.06-1.047 1.047-1.016 1.016 4.156 4.156 3.86-3.86z" fill="#FFC24A"></path>
                <path d="M4.734 14.547L.01 19.27l3.875 3.875 4.707-4.707-3.86-3.86z" fill="#F48522"></path>
                <path d="M12.984 20.328l-4.172-4.171-1.03-1.031-1.063-1.063-1.063-1.063-1.281 1.282 6.547 6.547 1.062-1.062 1.062-1.063z" fill="#FFA712"></path>
                <path d="M11.922 4.172l-1.063 1.062-1.047 1.047-4.101 4.102-1.063 1.062-4.632 4.633L0 16.078l4.965-4.965 1.062-1.062h.001l4.102-4.102 1.047-1.047 1.062-1.062L18.422 0l-2.344 2.344-4.156 1.828z" fill="#FFCA28"></path>
                <path d="M19.219 10.406L18.156 9.344l-3.86 3.86 1.063 1.062.015.016.016-.016 1.047-1.047 3.844-3.843z" fill="#1E88E5"></path>
                <path d="M.015 19.282l4.72-4.72 3.86 3.86-4.72 4.72z" fill="#0D65C9"></path>
              </svg>
              <span className="absolute left-1/2 -top-6 hidden -translate-x-1/2 rounded-md bg-foreground px-2 py-1 text-xs text-background opacity-0 transition-opacity group-hover:opacity-100 group-hover:block">Firebase</span>
            </div>
             <div className="group relative flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg"  viewBox="0 0 24 24" className="h-5 w-5">
                <path d="m16.83 13.999-.487.487-3.235-3.234-3.236 3.234-.488-.487 3.723-3.724 3.723 3.724Z" fill="#ffc24a"/>
                <path d="m20.243 17.152-3.413-3.413-3.723 3.723 3.413 3.413a2.46 2.46 0 0 0 3.486-.237 2.46 2.46 0 0 0 .237-3.486Z" fill="#f48522"/>
                <path d="m16.83 13.999-3.723 3.723-3.413-3.413.487-.487.01-.01 3.236-3.234 3.403 3.403v.018Z" fill="#ffa712"/>
                <path d="m9.37 11.272-3.723-3.724-.488.487-1.745 1.745a2.462 2.462 0 1 0 3.483 3.483l2.473-2.473Z" fill="#ffca28"/>
                <path d="m13.107 10.279.488-.487-3.723-3.723-3.485 3.485 3.723 3.723 3.485-3.485.012-.013Z" fill="#1e88e5"/>
                <path d="M3.757 6.848a2.46 2.46 0 0 0-.237 3.486 2.46 2.46 0 0 0 3.486.237l1.745-1.745-.012-.012-2.47-2.47L3.757 6.848Z" fill="#0d65c9"/>
              </svg>
              <span className="absolute left-1/2 -top-6 hidden -translate-x-1/2 rounded-md bg-foreground px-2 py-1 text-xs text-background opacity-0 transition-opacity group-hover:opacity-100 group-hover:block">Firebase Studio</span>
            </div>
            <div className="group relative flex items-center gap-2">
              <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4">
                <path d="M18.73 20.47l-3.56-3.57 2.1-2.1L20.83 18.37l-2.1 2.1zM5.27 3.53l3.56 3.57L6.73 9.2 3.17 5.63l2.1-2.1z" fill="#4285f4"></path>
                <path d="M9.2 20.47l2.1-2.1-2.1-2.1L7.1 18.37l2.1 2.1z" fill="#34a853"></path>
                <path d="M12 8.25A3.75 3.75 0 0 0 8.25 12 3.75 3.75 0 0 0 12 15.75a3.75 3.75 0 0 0 3.75-3.75A3.75 3.75 0 0 0 12 8.25z" fill="#fbbc05"></path>
                <path d="M18.83 11.25a.75.75 0 0 0-.75.75c0 3.31-2.69 6-6 6a6.002 6.002 0 0 1-6-6 .75.75 0 0 0-1.5 0c0 4.14 3.36 7.5 7.5 7.5s7.5-3.36 7.5-7.5a.75.75 0 0 0-.75-.75z" fill="#ea4335"></path>
              </svg>
              <span className="absolute left-1/2 -top-6 hidden -translate-x-1/2 rounded-md bg-foreground px-2 py-1 text-xs text-background opacity-0 transition-opacity group-hover:opacity-100 group-hover:block">Gemini</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
