import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { HardHat, Mail, Lock, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "כניסה / הרשמה — ניהול אתרים" },
      { name: "description", content: "כניסה למערכת ניהול עובדים, אתרים ולקוחות." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [magicLinkSent, setMagicLinkSent] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/", replace: true });
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) navigate({ to: "/", replace: true });
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      console.error("[Auth] signIn error:", error);
      toast.error("שגיאה בהתחברות", { description: error.message });
      return;
    }
    toast.success("התחברת בהצלחה");
    navigate({ to: "/", replace: true });
  }

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault();
    if (!email) { toast.error("נא להזין אימייל"); return; }
    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: false,
        emailRedirectTo: window.location.origin,
        data: fullName ? { full_name: fullName } : undefined,
      },
    });
    setLoading(false);
    if (error) {
      console.error("[Auth] magic link error:", error);
      toast.error("שגיאה בשליחת הקישור", { description: error.message });
      return;
    }
    setMagicLinkSent(true);
    toast.success("קישור נשלח לאימייל!", { description: "בדוק את תיבת הדואר שלך ולחץ על הקישור." });
  }

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: { full_name: fullName },
      },
    });
    setLoading(false);
    if (error) {
      console.error("[Auth] signUp error:", error);
      toast.error("שגיאה בהרשמה", { description: error.message });
      return;
    }
    toast.success("נרשמת בהצלחה — בדוק את האימייל לאישור");
  }

  if (magicLinkSent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-secondary to-background px-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <div className="flex justify-center mb-2">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg">
                <Mail className="h-7 w-7" />
              </div>
            </div>
            <CardTitle>בדוק את האימייל שלך</CardTitle>
            <CardDescription>שלחנו קישור כניסה לכתובת <strong dir="ltr">{email}</strong></CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">לחץ על הקישור באימייל כדי להיכנס למערכת. הקישור תקף ל-24 שעות.</p>
            <Button variant="outline" className="w-full" onClick={() => setMagicLinkSent(false)}>
              שלח שוב
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-secondary to-background px-4">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center gap-3 mb-8">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg">
            <HardHat className="h-7 w-7" />
          </div>
          <div className="text-center">
            <h1 className="font-display text-3xl font-bold tracking-tight">ניהול אתרים</h1>
            <p className="text-sm text-muted-foreground mt-1">מערכת תפעולית לעובדים, אתרים ולקוחות</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>ברוכים הבאים</CardTitle>
            <CardDescription>התחבר או צור חשבון חדש</CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              type="button"
              variant="outline"
              className="w-full gap-2 mb-4"
              disabled={loading}
              onClick={async () => {
                setLoading(true);
                const result = await lovable.auth.signInWithOAuth("google", {
                  redirect_uri: window.location.origin,
                });
                if (result.error) {
                  setLoading(false);
                  toast.error("שגיאה בהתחברות עם Google", { description: result.error.message });
                  return;
                }
                if (result.redirected) return;
                navigate({ to: "/", replace: true });
              }}
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
              {loading ? "מתחבר..." : "המשך עם Google"}
            </Button>
            <div className="relative mb-4">
              <Separator />
              <span className="absolute left-1/2 -translate-x-1/2 -top-2.5 bg-card px-2 text-xs text-muted-foreground">או</span>
            </div>
            <Tabs defaultValue="signin" dir="rtl">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="signin">התחברות</TabsTrigger>
                <TabsTrigger value="magic">קישור מאגי</TabsTrigger>
              </TabsList>

              {/* === MAGIC LINK (existing users only) === */}
              <TabsContent value="magic">
                <form onSubmit={handleMagicLink} className="space-y-4 mt-4">
                  <div className="rounded-lg bg-blue-50 border border-blue-200 p-3 text-sm text-blue-800 text-right">
                    הזן את האימייל שלך ונשלח לך קישור כניסה — רק למשתמשים קיימים.
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="magic-email">אימייל</Label>
                    <Input
                      id="magic-email"
                      type="email"
                      dir="ltr"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                  <Button type="submit" disabled={loading} className="w-full gap-2">
                    <Mail className="h-4 w-4" />
                    {loading ? "שולח..." : "שלח קישור לאימייל"}
                  </Button>
                  <p className="text-xs text-muted-foreground text-center">
                    יצירת חשבונות חדשים מתבצעת רק על-ידי מנהל דרך עמוד "משתמשים".
                  </p>
                </form>
              </TabsContent>

              {/* === SIGN IN === */}
              <TabsContent value="signin">
                <form onSubmit={handleSignIn} className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="signin-email">אימייל</Label>
                    <Input
                      id="signin-email"
                      type="email"
                      dir="ltr"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signin-password">סיסמה</Label>
                    <div className="relative">
                      <Input
                        id="signin-password"
                        type={showPassword ? "text" : "password"}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                      />
                      <button
                        type="button"
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <Button type="submit" disabled={loading} className="w-full gap-2">
                    <Lock className="h-4 w-4" />
                    {loading ? "מתחבר..." : "כניסה"}
                  </Button>
                </form>
              </TabsContent>

            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
