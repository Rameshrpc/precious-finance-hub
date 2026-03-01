import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate("/dashboard");
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName },
            emailRedirectTo: window.location.origin,
          },
        });
        if (error) throw error;
        toast({
          title: "Account created",
          description: "Check your email for verification link.",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 gradient-hero items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-64 h-64 rounded-full border border-gold/30" />
          <div className="absolute bottom-32 right-16 w-48 h-48 rounded-full border border-gold/20" />
          <div className="absolute top-1/2 left-1/3 w-96 h-96 rounded-full border border-gold/10" />
        </div>
        <div className="relative z-10 max-w-lg">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-xl gradient-gold flex items-center justify-center">
              <span className="text-primary-foreground font-display font-bold text-xl">C</span>
            </div>
            <div>
              <h1 className="text-2xl font-display font-bold text-primary-foreground tracking-tight">
                CofiZen
              </h1>
              <p className="text-sm text-gold-light font-medium tracking-wider uppercase">
                Gold & Silver
              </p>
            </div>
          </div>
          <h2 className="text-4xl font-display font-bold text-primary-foreground mb-4 leading-tight">
            Precious Metals Finance,{" "}
            <span className="text-gold-shimmer">Simplified.</span>
          </h2>
          <p className="text-lg text-silver-light leading-relaxed">
            Manage gold loans, purchase orders, and sale agreements across branches — 
            all in one secure, multi-tenant platform.
          </p>
          <div className="mt-10 flex gap-8 text-silver-light">
            <div>
              <p className="text-2xl font-bold text-gold">₹500Cr+</p>
              <p className="text-sm">Assets Managed</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-gold">1000+</p>
              <p className="text-sm">Active Loans</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-gold">50+</p>
              <p className="text-sm">Branches</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Auth Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md animate-fade-in">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8 justify-center">
            <div className="w-10 h-10 rounded-xl gradient-gold flex items-center justify-center">
              <span className="text-primary-foreground font-display font-bold text-lg">C</span>
            </div>
            <span className="text-xl font-display font-bold text-primary">CofiZen</span>
          </div>

          <div className="mb-8">
            <h3 className="text-2xl font-display font-bold text-foreground">
              {isLogin ? "Welcome back" : "Create account"}
            </h3>
            <p className="text-muted-foreground mt-1">
              {isLogin
                ? "Sign in to your CofiZen account"
                : "Get started with CofiZen Gold & Silver"}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Enter your full name"
                  required={!isLogin}
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isLogin ? "Sign In" : "Create Account"}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="font-medium text-accent hover:underline"
            >
              {isLogin ? "Sign up" : "Sign in"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Auth;
