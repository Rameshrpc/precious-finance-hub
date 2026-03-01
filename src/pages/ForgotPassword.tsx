import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ArrowLeft, CheckCircle } from "lucide-react";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      setSent(true);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center gradient-hero p-4 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full border border-gold/10" />
        <div className="absolute -bottom-48 -right-24 w-[500px] h-[500px] rounded-full border border-gold/5" />
      </div>

      <Card className="w-full max-w-md relative z-10 shadow-2xl border-border/50 animate-fade-in">
        <CardHeader className="text-center pb-4 pt-8">
          <div className="flex items-center justify-center gap-3 mb-2">
            <div className="w-11 h-11 rounded-xl gradient-gold flex items-center justify-center shadow-gold">
              <span className="font-display font-bold text-lg text-gold-foreground">C</span>
            </div>
            <h1 className="text-2xl font-display font-bold text-foreground tracking-tight">
              Cofi<span className="text-gold-shimmer">Zen</span>
            </h1>
          </div>
          <p className="text-xs text-muted-foreground tracking-widest uppercase font-medium">
            Gold & Silver
          </p>
        </CardHeader>

        <CardContent className="px-6 pb-8">
          {sent ? (
            <div className="text-center space-y-4 animate-fade-in">
              <CheckCircle className="h-12 w-12 text-success mx-auto" />
              <div>
                <h2 className="text-lg font-display font-bold text-foreground">Check your email</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  We've sent a password reset link to <span className="font-medium text-foreground">{email}</span>
                </p>
              </div>
              <Link to="/auth">
                <Button variant="outline" className="gap-2 mt-2">
                  <ArrowLeft className="h-4 w-4" /> Back to Sign In
                </Button>
              </Link>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <h2 className="text-lg font-display font-bold text-foreground">Forgot Password</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Enter your email and we'll send you a reset link.
                </p>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="reset-email">Email Address</Label>
                  <Input
                    id="reset-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@company.com"
                    required
                  />
                </div>
                <Button type="submit" variant="gold" className="w-full" size="lg" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Send Reset Link
                </Button>
              </form>
              <div className="mt-4 text-center">
                <Link to="/auth" className="text-xs font-medium text-gold hover:text-gold-light transition-colors inline-flex items-center gap-1">
                  <ArrowLeft className="h-3 w-3" /> Back to Sign In
                </Link>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ForgotPassword;
