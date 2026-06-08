import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { HardHat, Mail, Lock, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
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
        shouldCreateUser: true,
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
            <Tabs defaultValue="magic" dir="rtl">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="magic">קישור מאגי</TabsTrigger>
                <TabsTrigger value="signin">התחברות</TabsTrigger>
                <TabsTrigger value="signup">הרשמה</TabsTrigger>
              </TabsList>

              {/* === MAGIC LINK === */}
              <TabsContent value="magic">
                <form onSubmit={handleMagicLink} className="space-y-4 mt-4">
                  <div className="rounded-lg bg-blue-50 border border-blue-200 p-3 text-sm text-blue-800 text-right">
                    <strong>הכי פשוט:</strong> הזן אימייל ונשלח לך קישור כניסה — בלי סיסמה.
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="magic-name">שם מלא (לחשבון חדש)</Label>
                    <Input
                      id="magic-name"
                      placeholder="השאר ריק אם כבר רשום"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                    />
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
                    המשתמש הראשון מקבל אוטומטית הרשאת מנהל ראשי
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

              {/* === SIGN UP === */}
              <TabsContent value="signup">
                <form onSubmit={handleSignUp} className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-name">שם מלא</Label>
                    <Input
                      id="signup-name"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">אימייל</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      dir="ltr"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">סיסמה</Label>
                    <div className="relative">
                      <Input
                        id="signup-password"
                        type={showPassword ? "text" : "password"}
                        required
                        minLength={8}
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
                    <p className="text-xs text-muted-foreground">
                      סיסמה חזקה: לפחות 8 תווים, אות גדולה, מספר וסימן.{" "}
                      <span dir="ltr" className="font-mono">למשל: Admin@2024!</span>
                    </p>
                  </div>
                  <Button type="submit" disabled={loading} className="w-full">
                    {loading ? "נרשם..." : "צור חשבון"}
                  </Button>
                  <p className="text-xs text-muted-foreground text-center">
                    המשתמש הראשון מקבל אוטומטית הרשאת מנהל ראשי
                  </p>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
