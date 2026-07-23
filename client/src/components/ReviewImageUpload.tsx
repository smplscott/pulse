import { useRef } from "react";
import { Camera, X, HelpCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface Props {
  value: string | null;
  onChange: (dataUrl: string | null) => void;
}

const MAX_BYTES = 5 * 1024 * 1024;

export default function ReviewImageUpload({ value, onChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  function handleFile(file: File) {
    if (!file.type.startsWith("image/")) {
      toast({ title: "Images only", description: "Please upload a photo (JPG, PNG, etc.)", variant: "destructive" });
      return;
    }
    if (file.size > MAX_BYTES) {
      toast({ title: "File too large", description: "Please choose a photo under 5 MB.", variant: "destructive" });
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result;
      if (typeof result === "string") onChange(result);
    };
    reader.readAsDataURL(file);
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = "";
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }

  return (
    <div className="mb-3">
      <div className="flex items-center gap-1.5 mb-1.5">
        <p className="text-xs text-[#B3B3B3] font-medium">Verify with Image *</p>
        <Tooltip>
          <TooltipTrigger asChild>
            <button type="button" className="text-[#555] hover:text-[#B3B3B3] transition-colors">
              <HelpCircle className="h-3.5 w-3.5" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-[200px] text-center text-xs">
            Your photo verifies you were there and becomes the artwork for your review
          </TooltipContent>
        </Tooltip>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleInputChange}
      />

      {value ? (
        <div className="relative w-20 h-20">
          <img
            src={value}
            alt="Review artwork"
            className="w-20 h-20 rounded-xl object-cover border border-[#3E3E3E]"
          />
          <button
            type="button"
            onClick={() => onChange(null)}
            className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-[#282828] border border-[#3E3E3E] flex items-center justify-center text-[#B3B3B3] hover:text-white transition-colors"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={e => e.preventDefault()}
          className="w-full border border-dashed border-[#3E3E3E] hover:border-[#b388eb]/60 rounded-xl p-4 flex flex-col items-center gap-2 transition-colors group"
        >
          <div className="w-10 h-10 rounded-full bg-[#282828] group-hover:bg-[#1a0d2e] flex items-center justify-center transition-colors">
            <Camera className="h-5 w-5 text-[#555] group-hover:text-[#b388eb] transition-colors" />
          </div>
          <p className="text-xs text-[#555] group-hover:text-[#B3B3B3] transition-colors text-center">
            Tap to upload a photo from the show
          </p>
        </button>
      )}
    </div>
  );
}
