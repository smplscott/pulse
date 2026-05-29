import { useState } from "react";
import { Link } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { SiSpotify } from "react-icons/si";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Zap } from "lucide-react";

const loginSchema = z.object({
  identifier: z.string().min(1, "Email or username is required"),
  password: z.string().min(1, "Password is required"),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function Login() {
  const { login } = useAuth();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);
  const [devLoading, setDevLoading] = useState(false);

  const handleDevLogin = async () => {
    setDevLoading(true);
    try {
      await login("dev", "dev");
    } catch {
      toast({ title: "Dev login failed", variant: "destructive" });
    } finally {
      setDevLoading(false);
    }
  };

  const form = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { identifier: "", password: "" },
  });

  const onSubmit = async (data: LoginForm) => {
    try {
      await login(data.identifier, data.password);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Login failed";
      toast({ title: "Login failed", description: message, variant: "destructive" });
    }
  };

  const handleSpotify = () => {
    toast({ title: "Coming soon", description: "Spotify login will be available soon." });
  };

  if (forgotSent) {
    return (
      <div className="min-h-screen bg-[#121212] flex flex-col items-center justify-center px-6">
        <div className="w-full max-w-sm text-center space-y-4">
          <h1 className="font-bold text-2xl green-gradient-text">PULSE</h1>
          <div className="bg-[#1A1A1A] rounded-2xl p-6 space-y-4 border border-[#2A2A2A]">
            <p className="text-white font-semibold text-lg">Check your inbox</p>
            <p className="text-[#B3B3B3] text-sm">If an account exists with that email, we've sent a password reset link.</p>
            <Button onClick={() => setForgotSent(false)} variant="outline" className="w-full border-[#3E3E3E] text-white hover:bg-[#2A2A2A]">
              Back to login
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#121212] flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-2">
          <h1 className="font-bold text-3xl green-gradient-text">PULSE</h1>
          <p className="text-[#B3B3B3] text-sm">Your music. Your community.</p>
        </div>

        <div className="bg-[#1A1A1A] rounded-2xl p-6 space-y-5 border border-[#2A2A2A]">
          <h2 className="text-white font-bold text-xl">Log in</h2>

          <Button
            type="button"
            onClick={handleSpotify}
            className="w-full bg-[#1DB954] hover:bg-[#1ed760] text-black font-semibold flex items-center justify-center gap-2 h-11 rounded-full"
          >
            <SiSpotify className="h-5 w-5" />
            Log in with Spotify
          </Button>

          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-[#3E3E3E]" />
            <span className="text-[#B3B3B3] text-xs">or</span>
            <div className="flex-1 h-px bg-[#3E3E3E]" />
          </div>

          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-[#B3B3B3] text-sm">Email or username</Label>
              <Input
                {...form.register("identifier")}
                placeholder="you@example.com"
                className="bg-[#2A2A2A] border-[#3E3E3E] text-white placeholder:text-[#666] focus:border-[#1DB954] h-11"
                autoCapitalize="none"
                autoComplete="username"
              />
              {form.formState.errors.identifier && (
                <p className="text-red-400 text-xs">{form.formState.errors.identifier.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label className="text-[#B3B3B3] text-sm">Password</Label>
              <div className="relative">
                <Input
                  {...form.register("password")}
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className="bg-[#2A2A2A] border-[#3E3E3E] text-white placeholder:text-[#666] focus:border-[#1DB954] h-11 pr-10"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#666] hover:text-white"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {form.formState.errors.password && (
                <p className="text-red-400 text-xs">{form.formState.errors.password.message}</p>
              )}
            </div>

            <button
              type="button"
              onClick={() => setForgotSent(true)}
              className="text-[#1DB954] text-xs hover:underline block"
            >
              Forgot password?
            </button>

            <Button
              type="submit"
              disabled={form.formState.isSubmitting}
              className="w-full bg-[#1DB954] hover:bg-[#1ed760] text-black font-bold h-11 rounded-full"
            >
              {form.formState.isSubmitting ? "Logging in..." : "Log in"}
            </Button>
          </form>
        </div>

        <p className="text-center text-[#B3B3B3] text-sm">
          Don't have an account?{" "}
          <Link href="/signup" className="text-[#1DB954] hover:underline font-semibold">
            Sign up
          </Link>
        </p>

        {import.meta.env.DEV && (
          <div className="border-t border-[#2A2A2A] pt-4">
            <button
              type="button"
              onClick={handleDevLogin}
              disabled={devLoading}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-dashed border-[#3E3E3E] text-[#666] hover:border-[#c2f970]/50 hover:text-[#c2f970] transition-colors text-sm font-medium disabled:opacity-50"
            >
              <Zap className="h-4 w-4" />
              {devLoading ? "Logging in…" : "Dev login"}
            </button>
            <p className="text-center text-[#444] text-xs mt-1.5">Only visible in development</p>
          </div>
        )}
      </div>
    </div>
  );
}
