import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import Header from "@/components/layout/Header";
import BottomNav from "@/components/layout/BottomNav";
import MusicPlayer from "@/components/layout/MusicPlayer";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ChevronLeft, MusicIcon, Send, MicIcon, PlayCircleIcon } from "lucide-react";
import { insertThreadSchema } from "@shared/schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Link } from "wouter";
import { Checkbox } from "@/components/ui/checkbox";

// Extend the schema with validation rules
const formSchema = insertThreadSchema.extend({
  title: z.string().min(5, "Title must be at least 5 characters"),
  content: z.string().min(10, "Content must be at least 10 characters"),
});

type FormData = z.infer<typeof formSchema>;

export default function CreateSongRequest() {
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  
  // Mock user ID - in a real app this would come from auth context
  const userId = 1;
  
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [hasLyrics, setHasLyrics] = useState(false);
  const [hasInstrumental, setHasInstrumental] = useState(false);
  const [hasMelody, setHasMelody] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "Help identify this track",
      content: "",
      userId: userId,
      type: "song_request",
      status: "active"
    }
  });

  const createThreadMutation = useMutation({
    mutationFn: (data: FormData) => apiRequest("POST", "/api/threads", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/threads"] });
      toast({
        title: "Song Request Created",
        description: "Your request has been posted successfully"
      });
      navigate("/whats-this-song");
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create song request. Please try again.",
        variant: "destructive"
      });
      console.error("Create song request error:", error);
    }
  });

  const onSubmit = (data: FormData) => {
    // Add additional metadata to the content
    let enrichedContent = data.content;
    
    const details = [];
    if (hasLyrics) details.push("Has Lyrics");
    if (hasInstrumental) details.push("Instrumental Parts");
    if (hasMelody) details.push("Recognizable Melody");
    
    if (details.length > 0) {
      enrichedContent += "\n\nDetails: " + details.join(", ");
    }
    
    data.content = enrichedContent;
    createThreadMutation.mutate(data);
  };

  // Simulate recording audio
  const handleToggleRecording = () => {
    if (!isRecording) {
      setIsRecording(true);
      
      // Simulate recording duration counter
      const interval = setInterval(() => {
        setRecordingDuration(prev => {
          if (prev >= 15) {
            clearInterval(interval);
            setIsRecording(false);
            return 15;
          }
          return prev + 1;
        });
      }, 1000);
    } else {
      setIsRecording(false);
      setRecordingDuration(0);
    }
  };

  return (
    <div className="min-h-screen pb-32">
      <Header />
      
      <main className="pt-4 px-4">
        <Link href="/whats-this-song">
          <div className="flex items-center mb-4 cursor-pointer">
            <ChevronLeft className="h-6 w-6 mr-2" />
            <span className="text-lg font-medium">What's This Song?</span>
          </div>
        </Link>
        
        <div className="bg-gradient-to-r from-[#b388eb]/20 to-[#3E3E3E]/20 rounded-lg p-4 mb-6">
          <h1 className="text-xl font-bold mb-2">Create Song Identification Request</h1>
          <p className="text-sm text-[#B3B3B3]">
            Need help identifying a song? Provide as many details as possible and our community 
            will help you find it.
          </p>
        </div>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Describe the song... include any lyrics you remember, where you heard it, the beat, instruments, similar artists, etc."
                      className="bg-[#282828] border-[#3E3E3E] placeholder:text-[#B3B3B3]"
                      rows={6}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="flex flex-col space-y-2">
              <FormLabel>Add Details</FormLabel>
              <div className="flex flex-col space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="hasLyrics" 
                    checked={hasLyrics} 
                    onCheckedChange={(checked) => setHasLyrics(!!checked)} 
                  />
                  <label 
                    htmlFor="hasLyrics" 
                    className="text-sm cursor-pointer"
                  >
                    I remember some lyrics
                  </label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="hasInstrumental" 
                    checked={hasInstrumental} 
                    onCheckedChange={(checked) => setHasInstrumental(!!checked)} 
                  />
                  <label 
                    htmlFor="hasInstrumental" 
                    className="text-sm cursor-pointer"
                  >
                    I remember instrumental parts
                  </label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="hasMelody" 
                    checked={hasMelody} 
                    onCheckedChange={(checked) => setHasMelody(!!checked)} 
                  />
                  <label 
                    htmlFor="hasMelody" 
                    className="text-sm cursor-pointer"
                  >
                    I can hum/sing the melody
                  </label>
                </div>
              </div>
            </div>
            
            <div className="bg-[#181818] rounded-lg p-4 mt-4">
              <FormLabel className="mb-2 block">Record a Sample (Optional)</FormLabel>
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={handleToggleRecording}
                  className={`flex items-center space-x-2 py-2 px-4 rounded-full ${
                    isRecording 
                      ? "bg-red-600 text-white" 
                      : "bg-[#282828] text-white"
                  }`}
                >
                  <MicIcon className="h-4 w-4" />
                  <span>{isRecording ? "Stop Recording" : "Record Audio"}</span>
                </button>
                
                {isRecording ? (
                  <span className="text-red-500 animate-pulse">
                    Recording: {recordingDuration}s
                  </span>
                ) : recordingDuration > 0 ? (
                  <div className="flex items-center">
                    <PlayCircleIcon className="h-5 w-5 mr-2 text-[#B3B3B3]" />
                    <span className="text-[#B3B3B3]">Sample (0:{recordingDuration.toString().padStart(2, '0')})</span>
                  </div>
                ) : null}
              </div>
              <p className="text-xs text-[#B3B3B3] mt-2">
                Try to sing, hum, or play the part of the song you remember
              </p>
            </div>
            
            <div className="pt-4 flex justify-end">
              <Button
                type="submit"
                className="pink-gradient pink-gradient-hover text-white"
                disabled={createThreadMutation.isPending}
              >
                {createThreadMutation.isPending ? (
                  "Posting..."
                ) : (
                  <>
                    <MusicIcon className="h-4 w-4 mr-2" />
                    Post Request
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </main>
      
      <MusicPlayer />
      <BottomNav />
    </div>
  );
}
