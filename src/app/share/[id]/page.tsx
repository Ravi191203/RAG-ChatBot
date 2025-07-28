
"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { SavedItem } from '@/components/saved-items-panel';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { CodeBlock } from '@/components/code-block';
import { format } from 'date-fns';

export default function SharePage() {
    const params = useParams();
    const router = useRouter();
    const { toast } = useToast();
    const [item, setItem] = useState<SavedItem | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const id = params.id as string;

    useEffect(() => {
        if (!id) {
            setError("No item ID provided.");
            setIsLoading(false);
            return;
        }

        const fetchItem = async () => {
            try {
                const response = await fetch(`/api/knowledge?id=${id}`);
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'Failed to fetch item');
                }
                const data = await response.json();
                setItem(data.savedItem);
            } catch (err: any) {
                console.error("Error fetching shared item:", err);
                setError(err.message);
                toast({
                    title: "Error",
                    description: "Could not load the shared item.",
                    variant: "destructive",
                });
            } finally {
                setIsLoading(false);
            }
        };

        fetchItem();
    }, [id, toast]);

    return (
        <div className="flex flex-col min-h-screen items-center justify-center bg-background text-foreground p-4 sm:p-6 md:p-8">
            <Card className="w-full max-w-2xl">
                <CardHeader>
                    <div className="flex justify-between items-start">
                        <div className='max-w-[90%]'>
                            <CardTitle className="font-headline">{item?.title || 'Shared Item'}</CardTitle>
                            <CardDescription>
                                This is a shared item from Contextual Companion.
                            </CardDescription>
                        </div>
                        <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => router.back()}>
                            <ArrowLeft className="h-4 w-4" />
                            <span className="sr-only">Back</span>
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    {isLoading && <p className="text-muted-foreground">Loading...</p>}
                    {error && <p className="text-destructive">Error: {error}</p>}
                    {item && (
                        <div>
                             <p className="text-xs text-muted-foreground mb-4">
                                Saved on: {format(new Date(item.createdAt), "PPP p")}
                            </p>
                            <div className="prose prose-sm dark:prose-invert max-w-none rounded-md border bg-muted/50 p-4">
                                <ReactMarkdown remarkPlugins={[remarkGfm]} components={{ code: CodeBlock }}>
                                    {item.content}
                                </ReactMarkdown>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
