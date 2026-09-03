import { useState } from "react";
import { Link, Redirect } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff } from "lucide-react";

const signupSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(20, "Username must be 20 characters or less")
    .regex(/^[a-zA-Z0-9_]+$/, "Only letters, numbers, and underscores"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type SignupForm = z.infer<typeof signupSchema>;

export default function Signup() {
  const { user, register: registerUser } = useAuth();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<SignupForm>({
    resolver: zodResolver(signupSchema),
    defaultValues: { email: "", username: "", password: "", confirmPassword: "" },
  });

  const onSubmit = async (data: SignupForm) => {
    try {
      await registerUser(data.username, data.email, data.password);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Sign up failed";
      toast({ title: "Sign up failed", description: message, variant: "destructive" });
    }
  };

  if (user) {
    return <Redirect to="/" />;
  }

  return (
    <div className="min-h-screen bg-[#121212] flex flex-col items-center justify-center px-6 py-10">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-2">
          <h1 className="font-bold text-3xl green-gradient-text">PULSE</h1>
          <p className="text-[#B3B3B3] text-sm">Join the community.</p>
        </div>

        <div className="bg-[#1A1A1A] rounded-2xl p-6 space-y-5 border border-[#2A2A2A]">
          <h2 className="text-white font-bold text-xl">Create account</h2>

          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-[#B3B3B3] text-sm">Email</Label>
              <Input
                {...form.register("email")}
                type="email"
                placeholder="you@example.com"
                className="bg-[#2A2A2A] border-[#3E3E3E] text-white placeholder:text-[#666] focus:border-[#c2f970] h-11"
                autoComplete="email"
              />
              {form.formState.errors.email && (
                <p className="text-red-400 text-xs">{form.formState.errors.email.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label className="text-[#B3B3B3] text-sm">Username</Label>
              <Input
                {...form.register("username")}
                placeholder="your_username"
                className="bg-[#2A2A2A] border-[#3E3E3E] text-white placeholder:text-[#666] focus:border-[#c2f970] h-11"
                autoCapitalize="none"
                autoComplete="username"
              />
              {form.formState.errors.username && (
                <p className="text-red-400 text-xs">{form.formState.errors.username.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label className="text-[#B3B3B3] text-sm">Password</Label>
              <div className="relative">
                <Input
                  {...form.register("password")}
                  type={showPassword ? "text" : "password"}
                  placeholder="At least 6 characters"
                  className="bg-[#2A2A2A] border-[#3E3E3E] text-white placeholder:text-[#666] focus:border-[#c2f970] h-11 pr-10"
                  autoComplete="new-password"
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

            <div className="space-y-1.5">
              <Label className="text-[#B3B3B3] text-sm">Confirm password</Label>
              <Input
                {...form.register("confirmPassword")}
                type="password"
                placeholder="Re-enter your password"
                className="bg-[#2A2A2A] border-[#3E3E3E] text-white placeholder:text-[#666] focus:border-[#c2f970] h-11"
                autoComplete="new-password"
              />
              {form.formState.errors.confirmPassword && (
                <p className="text-red-400 text-xs">{form.formState.errors.confirmPassword.message}</p>
              )}
            </div>

            <Button
              type="submit"
              disabled={form.formState.isSubmitting}
              className="w-full bg-gradient-to-r from-[#c2f970] to-[#ecffa1] hover:opacity-90 text-black font-bold h-11 rounded-full"
            >
              {form.formState.isSubmitting ? "Creating account..." : "Create account"}
            </Button>
          </form>

          <p className="text-[#B3B3B3] text-xs text-center">
            By creating an account you agree to our terms of service.
          </p>
        </div>

        <p className="text-center text-[#B3B3B3] text-sm">
          Already have an account?{" "}
          <Link href="/login" className="text-[#c2f970] hover:underline font-semibold">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
