---
skill: crm-deploy
owner: טל
saves-to: תוצרים מוגמרים/CRM/[project-name]/06-deploy-guide.md
reads: תוצרים מוגמרים/CRM/[project-name]/03-build-prompt.txt · 04-test-cases.md · 05-security-review.md
---

# סקיל: CRM Deployment Manager

## הפעלה
כשהמשתמש כותב `/crm-deploy` או אומר:
"תעלה לאוויר" / "תכין הוראות deployment" / "איך מפרסים את זה" / "subdomain / Vercel / Cloudflare"
או כשרן שולח בריף לאחר QA + Security.

---

## שלב 0 — שליפת ENV אמיתיים (Supabase MCP)

לפני שמבקש מחיים כלום — שלוף מה שאפשר אוטומטית:

```
1. Supabase MCP: get_project_url → Project URL אמיתי
2. Supabase MCP: get_publishable_keys → Anon Key אמיתי
3. Supabase MCP: list_tables → ווידוא שה-schema עלה
```

אם חסר Project ID — שאל מחיים רק את זה. כל השאר שלוף בעצמך.

---

## שלב 0ב — איסוף מידע

שאל את חיים (הכל בבת אחת):

```
🚀 טל — בריף Deployment

1. שם הפרויקט / שם ה-repo ב-GitHub: [...]
2. הדומיין הראשי של חיים: (דוגמה: haim.co.il)
3. תת-דומיין רצוי: (דוגמה: crm / app / [client-name])
   → המערכת תרוץ על: [subdomain].[domain]
4. יש Vercel account? (כן/לא)
5. יש Cloudflare account על הדומיין? (כן/לא)
6. Supabase project URL: (דוגמה: https://xxxx.supabase.co)
7. יש משתני סביבה מיוחדים? (Green API, Stripe, כל API חיצוני)
```

---

## שלב 1 — Pre-Deployment Checklist

לפני שמתחילים, בדוק עם חיים:

```
✅ Pre-Deployment Checklist

קוד:
- [ ] ה-repo ב-GitHub (public / private)?
- [ ] build עובר בלי errors? (npm run build)
- [ ] אין console.log() שנשארו בקוד production?
- [ ] .env.local לא ב-repo (ב-.gitignore)?

Supabase:
- [ ] כל ה-tables נוצרו?
- [ ] RLS פעיל על כל table?
- [ ] Auth providers מוגדרים (Email)?
- [ ] CORS מוגדר לדומיין הנכון?

כללי:
- [ ] favicon / לוגו של הלקוח הוכן?
- [ ] שגיאות בעברית (לא באנגלית)?
```

---

## שלב 2 — Vercel Deployment

```markdown
## שלב 2: Vercel Deployment

### 2.1 — יצירת פרויקט חדש
1. כנס ל-vercel.com → Log In
2. לחץ "Add New..." → "Project"
3. Import Git Repository → בחר: [repo-name]
4. Framework Preset: **Next.js** (יזוהה אוטומטית)
5. Root Directory: `.` (השאר ריק)
6. Build Command: `npm run build` (ברירת מחדל)
7. Output Directory: `.next` (ברירת מחדל)

### 2.2 — Environment Variables
לחץ "Environment Variables" והוסף:

| Name | Value | Environment |
|------|-------|-------------|
| NEXT_PUBLIC_SUPABASE_URL | https://[project-id].supabase.co | All |
| NEXT_PUBLIC_SUPABASE_ANON_KEY | [anon key from Supabase dashboard] | All |
| SUPABASE_SERVICE_ROLE_KEY | [service role key — סודי!] | Production only |
[כל משתנה נוסף מהבריף]

⚠️ SUPABASE_SERVICE_ROLE_KEY — אף פעם לא NEXT_PUBLIC_. רק server-side.

### 2.3 — Deploy
לחץ "Deploy" → חכה 2-3 דקות.
ה-URL הזמני: https://[project-name].vercel.app
```

---

## שלב 3 — Cloudflare — תת-דומיין

```markdown
## שלב 3: Cloudflare DNS — [subdomain].[domain]

### 3.1 — קבל את ה-IP מ-Vercel
ב-Vercel: Settings → Domains → "Add Domain" → הכנס [subdomain].[domain]
Vercel יציג: CNAME record שצריך להוסיף

### 3.2 — Cloudflare DNS Record
כנס ל-cloudflare.com → בחר את הדומיין [domain]
לחץ DNS → Records → Add Record:

| Type | Name | Target | Proxy |
|------|------|--------|-------|
| CNAME | [subdomain] | cname.vercel-dns.com | ☁️ Proxied |

### 3.3 — Vercel — Verify Domain
חזור ל-Vercel → Settings → Domains
הדומיין [subdomain].[domain] יראה "Valid Configuration" תוך 5-10 דקות.

### 3.4 — SSL
Cloudflare + Vercel מטפלים ב-SSL אוטומטית.
ב-Cloudflare → SSL/TLS → Overview → בחר "Full (strict)"
```

---

## שלב 4 — Supabase Production Setup

```markdown
## שלב 4: Supabase — הגדרות Production

### 4.1 — CORS
Supabase Dashboard → Settings → API → CORS Origins
הוסף: https://[subdomain].[domain]

### 4.2 — Auth Redirect URLs
Authentication → URL Configuration:
Site URL: https://[subdomain].[domain]
Redirect URLs:
  https://[subdomain].[domain]/auth/callback
  https://[subdomain].[domain]/login

### 4.3 — Email Templates (אופציונלי)
Authentication → Email Templates
ערוך את תבנית "Confirm signup" לעברית:
"שלום, לחץ על הקישור לאימות החשבון שלך..."
```

---

## שלב 4.5 — בדיקת Build (Vercel MCP)

אחרי Deploy — בדוק בזמן אמת:

```
1. Vercel MCP: list_deployments → מצא את ה-deployment הנוכחי
2. Vercel MCP: get_deployment_build_logs → קרא build logs
   - אם יש errors → תקן לפני שממשיך
3. Vercel MCP: get_runtime_logs → בדוק שגיאות runtime ב-5 דקות ראשונות
```

**כל error ב-build logs = עצור + תקן + redeploy. לא ממשיכים עם build שבור.**

---

## שלב 5 — Post-Deployment Verification

```markdown
## שלב 5: בדיקות לאחר פריסה

עבור כל סעיף — בצע ידנית ב-browser:

### HTTPS ואבטחה
- [ ] https://[subdomain].[domain] נטען (לא HTTP)
- [ ] מנעול ירוק בבראוזר (SSL תקין)
- [ ] אין warnings ב-console

### Auth
- [ ] דף login נטען
- [ ] הרשמה עובדת (שלח מייל אמיתי לבדיקה)
- [ ] Login עובד → redirect ל-dashboard
- [ ] Logout עובד

### Core Features
- [ ] Dashboard נטען עם נתונים (או ריק בצורה תקינה)
- [ ] הוספת רשומה חדשה → נשמרת ב-Supabase
- [ ] עריכת רשומה → מתעדכן
- [ ] מחיקה → נמחק (אם רלוונטי)

### Mobile
- [ ] נפתח על טלפון — layout תקין
- [ ] ניווט עובד על מובייל
- [ ] Forms עובדים על מובייל (keyboard לא מסתיר)

### Performance
- [ ] דף ראשון נטען תוך פחות מ-3 שניות
- [ ] אין 404 errors בnetwork tab
```

---

## שלב 6 — Custom Domain לחיים (בונוס)

```markdown
## שלב 6: Domain מותאם ללקוח (אם רלוונטי)

אם הלקוח רוצה CRM על הדומיין שלו (crm.client-domain.co.il):

1. הלקוח נותן גישה ל-Cloudflare שלו (או DNS provider שלו)
2. חזור על שלב 3 עם הדומיין של הלקוח
3. ב-Vercel — הוסף גם את הדומיין של הלקוח (Settings → Domains)
4. SSL עולה אוטומטית

זמן: ~15 דקות אחרי שיש גישה ל-DNS.
```

---

## פלט מלא — מה יוצא

```
תוצרים מוגמרים/CRM/[project-name]/06-deploy-guide.md
```

מסמך עם:
- Pre-deployment checklist
- שלבי Vercel עם ערכים אמיתיים
- שלבי Cloudflare DNS
- Supabase production setup
- Post-deployment verification checklist

---

## בדיקה עצמית של טל (לפני מסירה)

- [ ] שם ה-repo האמיתי נכלל בהוראות?
- [ ] תת-הדומיין הספציפי מוגדר?
- [ ] כל ENV variables ממוינים (public vs secret)?
- [ ] CORS URLs מכוונים לדומיין הנכון?
- [ ] Auth redirect URLs מוגדרים?
- [ ] Post-deployment checklist כולל mobile?
- [ ] המסמך שמור ל-`06-deploy-guide.md`?
- [ ] אם Pipeline — רן קיבל אישור שהכל מוכן?

---

## למידה בזמן אמת

אם חיים הגיה / תיקן — בסוף:
> "שמתי לב שהערת: *[ציטוט]*. האם לעדכן את הסקיל שלי לפי זה?"

אם כן → הפעל `/improve`.
