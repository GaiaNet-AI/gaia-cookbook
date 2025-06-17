"use client";

import { useState, useRef, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import ReactMarkdown from 'react-markdown';
import domtoimage from 'dom-to-image-more';
import { Twitter, Linkedin, Facebook, Download, Sparkles } from 'lucide-react';
import { Inter } from 'next/font/google';

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

const appDescription = "Unleash your narrative genius! StoryWeaver AI is your creative co-pilot, helping you transform fledgling ideas into fully-formed stories. Generate unique characters, sculpt immersive worlds, and weave compelling plots with our intelligent storycrafting assistant.";

const formSchema = z.object({
  coreIdea: z.string().min(10, { message: "Tell us a bit more about your core idea (at least 10 characters)." }),
  genre: z.string({ required_error: "Please select a genre." }).min(1, "Genre is required"),
  length: z.enum(["short", "medium", "long"], { required_error: "Please select a story length." }),
  protagonist: z.string().optional(),
  keyConflict: z.string().optional(),
  worldVibe: z.string().optional(),
  tone: z.enum(["any", "humorous", "serious", "suspenseful", "whimsical", "dark"]).default("any"),
});

type StoryFormValues = z.infer<typeof formSchema>;

const genreOptions = ["Fantasy", "Sci-Fi", "Mystery", "Romance", "Thriller", "Historical", "Horror", "Adventure", "Slice of Life", "Fable"];
const lengthOptions = [
  { value: "short", label: "Short (~300 words)" },
  { value: "medium", label: "Medium (~800 words)" },
  { value: "long", label: "Long (~1500 words)" },
] as const;
const toneOptions = [
    { value: "any", label: "Let AI Decide / Neutral" },
    { value: "humorous", label: "Humorous" },
    { value: "serious", label: "Serious" },
    { value: "suspenseful", label: "Suspenseful" },
    { value: "whimsical", label: "Whimsical" },
    { value: "dark", label: "Dark" },
] as const;

const interFont = Inter({
  subsets: ['latin'],
  display: 'swap',
});

export default function HomePage() {
  const [story, setStory] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isImageGenerating, setIsImageGenerating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const storyDisplayRef = useRef<HTMLDivElement>(null);

  const form = useForm<StoryFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      coreIdea: "",
      genre: "",
      length: "medium",
      protagonist: "",
      keyConflict: "",
      worldVibe: "",
      tone: "any",
    },
  });

  async function onSubmit(values: StoryFormValues) {
    setIsLoading(true);
    setError(null);
    setStory('');
    try {
      const response = await fetch('/api/generate-story', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setStory(data.story);
    } catch (e: any) {
      console.error(e);
      setError(e.message || "An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  }

  const handleDownloadImage = useCallback(() => {
    const node = storyDisplayRef.current;
    if (!node) {
      console.warn("Story display ref not available for image generation.");
      setError("Cannot generate image: story content area not found.");
      return;
    }

    setIsImageGenerating(true);
    setError(null);

    const contentWidth = node.scrollWidth;
    const contentHeight = node.scrollHeight;

    const options = {
      quality: 0.95,
      bgcolor: '#ffffff',
      width: contentWidth,
      height: contentHeight,
      style: {
        fontFamily: interFont.style.fontFamily,
      }
    };

    domtoimage.toPng(node, options)
      .then((dataUrl) => {
        const link = document.createElement('a');
        link.download = 'storyweaver-story.png';
        link.href = dataUrl;
        link.click();
      })
      .catch((err) => {
        console.error('Failed to generate image with dom-to-image-more:', err);
        let userErrorMessage = 'Could not generate image. ';
        if (err.message && err.message.toLowerCase().includes('tainted canvas')) {
            userErrorMessage += 'This might be due to external images or resources.';
        } else if (err.message && err.message.toLowerCase().includes('font')) {
            userErrorMessage += 'There was an issue with font rendering in the image.';
        } else {
            userErrorMessage += 'An unexpected error occurred during image generation.';
        }
        setError(userErrorMessage);
      })
      .finally(() => setIsImageGenerating(false));
  }, [storyDisplayRef]); // interFont.style.fontFamily is stable

  const shareOnSocial = (platform: 'twitter' | 'linkedin' | 'facebook') => {
    const appUrl = window.location.href;
    const text = `Check out this story I generated with StoryWeaver AI! ${appUrl}\n(Remember to attach the image you downloaded!)`;
    let url = '';
    if (platform === 'twitter') url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
    else if (platform === 'linkedin') {
      url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(appUrl)}`;
      alert("Share this link on LinkedIn and remember to upload your generated story image!");
    } else if (platform === 'facebook') url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(appUrl)}"e=${encodeURIComponent(text)}`;
    if (url) window.open(url, '_blank');
  };

  return (
    <main className="container mx-auto p-4 md:p-8 flex flex-col items-center">
      <Card className="w-full max-w-3xl">
        <CardHeader className="text-center">
          <CardTitle className="text-4xl font-bold flex items-center justify-center">
            <Sparkles className="w-8 h-8 mr-2 text-primary" /> StoryWeaver AI
          </CardTitle>
          <CardDescription className="text-md mt-2 px-4">
            {appDescription}
          </CardDescription>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="coreIdea"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>What's your story's spark? *</FormLabel>
                    <FormControl>
                      <Textarea placeholder="e.g., A detective who can talk to ghosts solves a murder in a sentient, floating city." className="resize-none" rows={3} {...field} />
                    </FormControl>
                    <FormDescription>Describe the central concept or 'what if' scenario of your story.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="genre"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Genre *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Select a story genre" /></SelectTrigger></FormControl>
                        <SelectContent>{genreOptions.map((genre) => (<SelectItem key={genre} value={genre.toLowerCase().replace(/\s+/g, '-')}>{genre}</SelectItem>))}</SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="length"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Story Length *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Select story length" /></SelectTrigger></FormControl>
                        <SelectContent>{lengthOptions.map((opt) => (<SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>))}</SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="protagonist"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Who is your main character? (Optional)</FormLabel>
                    <FormControl><Input placeholder="e.g., A cynical ex-soldier with a hidden talent for baking." {...field} /></FormControl>
                    <FormDescription>Briefly describe your protagonist's key traits or situation.</FormDescription>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="keyConflict"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>What's the main challenge? (Optional)</FormLabel>
                    <FormControl><Input placeholder="e.g., Must retrieve a stolen artifact to save their village." {...field} /></FormControl>
                    <FormDescription>The central problem or obstacle your character faces.</FormDescription>
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="worldVibe"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Describe the world's vibe (Optional)</FormLabel>
                      <FormControl><Input placeholder="e.g., Gritty neon-lit cyberpunk future" {...field} /></FormControl>
                      <FormDescription>The overall atmosphere or style of the setting.</FormDescription>
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="tone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Desired Tone (Optional)</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Select story tone" /></SelectTrigger></FormControl>
                        <SelectContent>{toneOptions.map((opt) => (<SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>))}</SelectContent>
                      </Select>
                      <FormDescription>The overall feeling or mood of the story.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col items-center space-y-4">
              <Button type="submit" disabled={isLoading} className="w-full md:w-auto text-lg px-8 py-6 mt-4">
                {isLoading ? 'Weaving your masterpiece...' : 'Craft My Story'}
              </Button>
              {error && !isLoading && <p className="text-red-500 text-sm text-center">{error}</p>}
            </CardFooter>
          </form>
        </Form>
      </Card>

      {story && (
        <Card className="w-full max-w-3xl mt-8">
          <CardHeader><CardTitle>Your AI-Crafted Tale</CardTitle></CardHeader>
          <CardContent>
            <div
              ref={storyDisplayRef}
              id="story-content-for-image"
              className="prose prose-sm sm:prose lg:prose-lg xl:prose-xl max-w-none p-4 bg-background text-foreground rounded-md shadow-inner"
            >
              <ReactMarkdown components={{
                h1: ({node, ...props}) => <h1 className="text-2xl font-bold my-4 bg-transparent border-none shadow-none" {...props} />,
                h2: ({node, ...props}) => <h2 className="text-xl font-semibold my-3 bg-transparent border-none shadow-none" {...props} />,
                p: ({node, ...props}) => <p className="my-2 leading-relaxed bg-transparent border-none shadow-none" {...props} />,
              }}>{story}</ReactMarkdown>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col sm:flex-row justify-center items-center gap-3 pt-4">
            <Button variant="outline" onClick={handleDownloadImage} disabled={isImageGenerating || !story} className="w-full sm:w-auto">
              <Download className="mr-2 h-4 w-4" />{isImageGenerating ? 'Generating...' : 'Download as Image'}
            </Button>
            <Button variant="outline" onClick={() => shareOnSocial('twitter')} disabled={!story} className="w-full sm:w-auto">
              <Twitter className="mr-2 h-4 w-4 text-[#1DA1F2]" /> Share on X
            </Button>
            <Button variant="outline" onClick={() => shareOnSocial('linkedin')} disabled={!story} className="w-full sm:w-auto">
              <Linkedin className="mr-2 h-4 w-4 text-[#0A66C2]" /> Share on LinkedIn
            </Button>
            <Button variant="outline" onClick={() => shareOnSocial('facebook')} disabled={!story} className="w-full sm:w-auto">
              <Facebook className="mr-2 h-4 w-4 text-[#1877F2]" /> Share on Facebook
            </Button>
          </CardFooter>
        </Card>
      )}
    </main>
  );
}