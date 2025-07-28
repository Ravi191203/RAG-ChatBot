
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/hooks/use-toast';
import { Bot, Home, LogOut, Save, Sparkles, Wand2, Image as ImageIcon, Video, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2 } from 'lucide-react';
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

export default function AiToolsPage() {
  const { user, logout } = useAuth();
  const { toast } = useToast();

  // Image Generation State
  const [imagePrompt, setImagePrompt] = useState('');
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [generatedImageUrl, setGeneratedImageUrl] = useState('');

  // Video Generation State
  const [videoPrompt, setVideoPrompt] = useState('');
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState('');
  const [videoOperationName, setVideoOperationName] = useState<string | null>(null);
  const [videoStatus, setVideoStatus] = useState('');


  const handleImageGeneration = async () => {
    if (!imagePrompt.trim()) {
      toast({ title: 'Error', description: 'Please enter a prompt for the image.', variant: 'destructive' });
      return;
    }
    setIsGeneratingImage(true);
    setGeneratedImageUrl('');
    try {
      const response = await fetch('/api/image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: imagePrompt }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || 'Failed to generate image');
      }
      const result = await response.json();
      setGeneratedImageUrl(result.imageUrl);
      toast({ title: 'Success', description: 'Image generated successfully!' });
    } catch (error: any) {
      console.error(error);
      toast({ title: 'Error', description: `Image generation failed: ${error.message}`, variant: 'destructive' });
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const handleVideoGeneration = async () => {
    if (!videoPrompt.trim()) {
      toast({ title: 'Error', description: 'Please enter a prompt for the video.', variant: 'destructive' });
      return;
    }
    setIsGeneratingVideo(true);
    setGeneratedVideoUrl('');
    setVideoOperationName(null);
    setVideoStatus('Starting video generation...');
    try {
      const response = await fetch('/api/video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: videoPrompt }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || 'Failed to start video generation');
      }
      const result = await response.json();
       if (result.error) {
        throw new Error(result.error);
      }
      setVideoOperationName(result.operationName);
      toast({ title: 'In Progress', description: 'Video generation has started. This may take a minute.' });
    } catch (error: any) {
      console.error(error);
      toast({ title: 'Error', description: `Video generation failed to start: ${error.message}`, variant: 'destructive' });
      setIsGeneratingVideo(false);
      setVideoStatus('');
    }
  };

  // Polling effect for video status
  useEffect(() => {
    if (videoOperationName && isGeneratingVideo) {
      const interval = setInterval(async () => {
        setVideoStatus('Checking video status...');
        try {
          const response = await fetch('/api/video', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ operationName: videoOperationName }),
          });

          const result = await response.json();

          if (result.error) {
             throw new Error(result.error);
          }

          if (result.done) {
            setGeneratedVideoUrl(result.videoUrl);
            setIsGeneratingVideo(false);
            setVideoOperationName(null);
            setVideoStatus('Video ready!');
            toast({ title: 'Success!', description: 'Your video has been generated.' });
            clearInterval(interval);
          } else {
             setVideoStatus('Still processing... Please wait.');
          }
        } catch (error: any) {
          console.error(error);
          toast({ title: 'Error', description: `Failed to check video status: ${error.message}`, variant: 'destructive' });
          setIsGeneratingVideo(false);
          setVideoStatus('');
          clearInterval(interval);
        }
      }, 5000); // Poll every 5 seconds

      return () => clearInterval(interval);
    }
  }, [videoOperationName, isGeneratingVideo, toast]);

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
              <Link href="/global-ai">
                <Sparkles className="mr-0 h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Global AI</span>
              </Link>
            </Button>
             <Button variant="outline" size="sm" asChild>
              <Link href="/">
                <Home className="mr-0 h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Home</span>
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
                    <AlertDialogDescription>You will be redirected to the login page.</AlertDialogDescription>
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
          <Card>
            <CardHeader>
              <CardTitle className="font-headline flex items-center gap-2">
                <Wand2 /> AI Creative Tools
              </CardTitle>
              <CardDescription>Generate images and videos from text prompts using cutting-edge AI models.</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="image">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="image">Image Generation</TabsTrigger>
                  <TabsTrigger value="video">Video Generation</TabsTrigger>
                </TabsList>
                
                {/* Image Generation Tab */}
                <TabsContent value="image" className="mt-4">
                  <div className="flex flex-col gap-4">
                    <Textarea
                      value={imagePrompt}
                      onChange={(e) => setImagePrompt(e.target.value)}
                      placeholder="e.g., A photo of a raccoon wearing a tiny wizard hat, photorealistic."
                      className="min-h-[100px]"
                      disabled={isGeneratingImage}
                    />
                    <Button onClick={handleImageGeneration} disabled={isGeneratingImage}>
                      {isGeneratingImage ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ImageIcon className="mr-2 h-4 w-4" />}
                      Generate Image
                    </Button>
                    <Card className="mt-4 min-h-[256px] flex items-center justify-center bg-muted/50">
                        <CardContent className="p-4 w-full">
                            {isGeneratingImage && <div className="flex flex-col items-center gap-2 text-muted-foreground"><Loader2 className="h-8 w-8 animate-spin" /><p>Generating your image...</p></div>}
                            {generatedImageUrl && (
                                <div className="flex flex-col items-center gap-4">
                                <img src={generatedImageUrl} alt="Generated" className="rounded-lg max-w-full max-h-[400px]"/>
                                 <Button asChild variant="outline">
                                    <a href={generatedImageUrl} download="generated-image.png">
                                        <Download className="mr-2 h-4 w-4" /> Download Image
                                    </a>
                                </Button>
                                </div>
                            )}
                            {!isGeneratingImage && !generatedImageUrl && <p className="text-muted-foreground text-center">Your generated image will appear here.</p>}
                        </CardContent>
                    </Card>
                  </div>
                </TabsContent>
                
                {/* Video Generation Tab */}
                <TabsContent value="video" className="mt-4">
                    <div className="flex flex-col gap-4">
                        <Textarea
                        value={videoPrompt}
                        onChange={(e) => setVideoPrompt(e.target.value)}
                        placeholder="e.g., A majestic dragon soaring over a mystical forest at dawn."
                        className="min-h-[100px]"
                        disabled={isGeneratingVideo}
                        />
                        <Button onClick={handleVideoGeneration} disabled={isGeneratingVideo}>
                        {isGeneratingVideo ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Video className="mr-2 h-4 w-4" />}
                        Generate Video
                        </Button>
                         <Card className="mt-4 min-h-[256px] flex items-center justify-center bg-muted/50">
                            <CardContent className="p-4 w-full">
                                {isGeneratingVideo && <div className="flex flex-col items-center gap-2 text-muted-foreground"><Loader2 className="h-8 w-8 animate-spin" /><p>{videoStatus}</p></div>}
                                {generatedVideoUrl && (
                                    <div className="flex flex-col items-center gap-4">
                                    <video controls src={generatedVideoUrl} className="rounded-lg max-w-full max-h-[400px]" />
                                    <Button asChild variant="outline">
                                        <a href={generatedVideoUrl} download="generated-video.mp4">
                                            <Download className="mr-2 h-4 w-4" /> Download Video
                                        </a>
                                    </Button>
                                    </div>
                                )}
                                {!isGeneratingVideo && !generatedVideoUrl && <p className="text-muted-foreground text-center">Your generated video will appear here. This may take up to a minute.</p>}
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
