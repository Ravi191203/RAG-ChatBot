
"use client";

import { useState, useEffect, useCallback } from "react";
import { SavedItemsPanel, SavedItem } from "@/components/saved-items-panel";
import { Bot, Home, LogOut, MessageSquare, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/auth-context";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function SavedPage() {
    const [savedItems, setSavedItems] = useState<SavedItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { toast } = useToast();
    const { user, logout } = useAuth();


    const fetchSavedItems = useCallback(async () => {
        if (!user) {
            setIsLoading(false);
            return;
        }
        setIsLoading(true);
        try {
            const response = await fetch(`/api/knowledge?userId=${user.uid}`);
            if (!response.ok) {
                throw new Error("Failed to fetch saved items");
            }
            const data = await response.json();
            setSavedItems(data.savedItems || []);
        } catch (error) {
            console.error("Could not fetch data from DB", error);
            toast({
                title: "Error",
                description: "Could not load saved items. Please try again later.",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    }, [toast, user]);

    useEffect(() => {
        if (user) {
            fetchSavedItems();
        }
    }, [user, fetchSavedItems]);

    return (
        <div className="flex flex-col min-h-screen bg-background text-foreground">
            <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b bg-background/80 px-4 backdrop-blur-sm sm:px-6">
                <div className="flex items-center gap-2">
                    <Bot className="h-7 w-7 text-primary" />
                    <h1 className="text-xl font-bold font-headline">Contextual Companion</h1>
                </div>
                <div className="flex items-center gap-4">
                     <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" asChild>
                            <Link href="/">
                                <Home className="mr-2 h-4 w-4" />
                                Home
                            </Link>
                        </Button>
                        <Button variant="outline" size="sm" asChild>
                            <Link href="/global-ai">
                                <Sparkles className="mr-2 h-4 w-4" />
                                Global AI
                            </Link>
                        </Button>
                        <Button variant="outline" size="sm" asChild>
                            <Link href="/chat">
                                <MessageSquare className="mr-2 h-4 w-4" />
                                Contextual Chat
                            </Link>
                        </Button>
                    </div>
                     {user && (
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                                <Avatar className="h-8 w-8">
                                    <AvatarImage src={user.photoURL || ''} alt={user.displayName || 'User'} />
                                    <AvatarFallback>{user.displayName?.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <span className="text-sm font-medium hidden sm:inline">{user.displayName}</span>
                            </div>
                            <Button variant="outline" size="icon" onClick={logout} className="h-9 w-9">
                                <LogOut className="h-4 w-4" />
                                <span className="sr-only">Sign Out</span>
                            </Button>
                        </div>
                    )}
                </div>
            </header>
            <main className="flex-1 p-4 sm:p-6 md:p-8 flex flex-col items-center justify-start gap-8">
                <div className="w-full max-w-4xl">
                   {isLoading ? (
                        <div className="flex justify-center items-center h-64">
                            <p className="text-muted-foreground">Loading saved items...</p>
                        </div>
                   ) : (
                        <SavedItemsPanel 
                            savedItems={savedItems} 
                            onItemDeleted={fetchSavedItems} 
                            onItemUpdated={fetchSavedItems}
                        />
                   )}
                </div>
            </main>
        </div>
    );
}
