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
import { ChevronLeft, Send, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { insertThreadSchema } from "@shared/schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Link } from "wouter";

// Extend the schema with validation rules
const formSchema = insertThreadSchema.extend({
  title: z.string().min(5, "Title must be at least 5 characters"),
  content: z.string().min(10, "Content must be at least 10 characters"),
});

type FormData = z.infer<typeof formSchema>;

export default function CreateThread() {
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  
  // Mock user ID - in a real app this would come from auth context
  const userId = 1;
  
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const availableGenres = [
    "House", "Techno", "Hip-Hop", "R&B", "Jazz", "Soul", "Disco", 
    "Ambient", "Classical", "Rock", "Pop", "Indie", "Electronic"
  ];

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      content: "",
      userId: userId,
      type: "discussion",
      status: "active"
    }
  });

  const createThreadMutation = useMutation({
    mutationFn: (data: FormData) => apiRequest("POST", "/api/threads", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/threads"] });
      toast({
        title: "Thread Created",
        description: "Your thread has been posted successfully"
      });
      navigate("/");
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create thread. Please try again.",
        variant: "destructive"
      });
      console.error("Create thread error:", error);
    }
  });

  const onSubmit = (data: FormData) => {
    // Include selected genres in content if needed
    if (selectedGenres.length > 0) {
      data.content = `${data.content}\n\nGenres: ${selectedGenres.join(", ")}`;
    }
    
    createThreadMutation.mutate(data);
  };

  const handleAddGenre = (genre: string) => {
    if (!selectedGenres.includes(genre)) {
      setSelectedGenres([...selectedGenres, genre]);
    }
  };

  const handleRemoveGenre = (genre: string) => {
    setSelectedGenres(selectedGenres.filter(g => g !== genre));
  };

  return (
    <div className="min-h-screen pb-32">
      <Header />
      
      <main className="pt-4 px-4">
        <Link href="/">
          <div className="flex items-center mb-4 cursor-pointer">
            <ChevronLeft className="h-6 w-6 mr-2" />
            <span className="text-lg font-medium">Create Thread</span>
          </div>
        </Link>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Thread Title</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="What's your thread about?"
                      className="bg-[#282828] border-[#3E3E3E] placeholder:text-[#B3B3B3]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Content</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Share your thoughts, questions, or insights..."
                      className="bg-[#282828] border-[#3E3E3E] placeholder:text-[#B3B3B3]"
                      rows={6}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Thread Type</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger className="bg-[#282828] border-[#3E3E3E]">
                        <SelectValue placeholder="Select thread type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-[#282828] border-[#3E3E3E]">
                      <SelectItem value="discussion">Discussion</SelectItem>
                      <SelectItem value="recommendation">Recommendation</SelectItem>
                      <SelectItem value="review">Review</SelectItem>
                      <SelectItem value="question">Question</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="space-y-2">
              <FormLabel>Music Genres (Optional)</FormLabel>
              <div className="flex flex-wrap gap-2 mb-2">
                {selectedGenres.map((genre) => (
                  <Badge key={genre} variant="secondary" className="flex items-center gap-1">
                    {genre}
                    <button 
                      type="button" 
                      onClick={() => handleRemoveGenre(genre)}
                      className="h-3 w-3 rounded-full bg-[#3E3E3E] flex items-center justify-center text-white"
                    >
                      <X className="h-2 w-2" />
                    </button>
                  </Badge>
                ))}
              </div>
              
              <Select onValueChange={handleAddGenre}>
                <SelectTrigger className="bg-[#282828] border-[#3E3E3E]">
                  <SelectValue placeholder="Add music genres" />
                </SelectTrigger>
                <SelectContent className="bg-[#282828] border-[#3E3E3E]">
                  {availableGenres.map((genre) => (
                    <SelectItem 
                      key={genre} 
                      value={genre}
                      disabled={selectedGenres.includes(genre)}
                    >
                      {genre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="pt-4 flex justify-end">
              <Button
                type="submit"
                className="bg-[#5271ff] hover:bg-[#3a5bea] text-white"
                disabled={createThreadMutation.isPending}
              >
                {createThreadMutation.isPending ? (
                  "Creating..."
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Post Thread
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
