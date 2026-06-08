---
skill: crm-build-prompt
owner: בן
saves-to: תוצרים מוגמרים/CRM/[project-name]/code/
reads: תוצרים מוגמרים/CRM/[project-name]/01-spec.md · תוצרים מוגמרים/CRM/[project-name]/02-ux-map.md
---

# סקיל: בניית מערכת לוקאלית — Full Stack

## הפעלה
כשהמשתמש כותב `/crm-build-prompt` או:
"תבנה את המערכת", "תכתוב את הקוד", "תפתח את ה-CRM"
או כשרן שולח בריף עם אפיון + UX מוכנים.

---

## שלב 0 — קריאת חומרים

1. קרא `01-spec.md` — ישויות, שדות, לוגיקה עסקית, statuses
2. קרא `02-ux-map.md` — מסכים, navigation, Design System, מפרטי רכיבים
3. אם חסר אחד → שאל את חיים, אל תתחיל בלעדיו

---

## שלב 1 — בריף טכני (אם עצמאי, לא Pipeline)

שאל בבת אחת:
```
🔧 בן — בריף טכני

1. יש Supabase project קיים? (כן + URL / לא — ייצור חדש)
2. יש GitHub repo? (כן + שם / לא — ייצור מקומי בלבד)
3. Stack מועדף? (ברירת מחדל: Next.js 14 + Supabase + shadcn/ui + TypeScript)
4. יש env vars קיימים שצריך לשמר?
```

---

## שלב 2 — מבנה פרויקט (תמיד אותו מבנה)

```
code/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── layout.tsx
│   ├── (dashboard)/
│   │   ├── layout.tsx          ← sidebar + nav
│   │   ├── page.tsx            ← dashboard ראשי
│   │   ├── [entity]/
│   │   │   ├── page.tsx        ← רשימה
│   │   │   ├── [id]/page.tsx   ← פרופיל
│   │   │   └── new/page.tsx    ← טופס הוספה
│   │   └── settings/page.tsx
│   ├── api/
│   │   └── [route]/route.ts    ← API routes
│   ├── globals.css
│   └── layout.tsx              ← root: dir="rtl", font, providers
├── components/
│   ├── ui/                     ← shadcn/ui (אל תכתוב ידנית)
│   ├── layout/                 ← Sidebar, Navbar, MobileNav
│   ├── [entity]/               ← קומפוננטים ספציפיים לישות
│   └── shared/                 ← Toast, LoadingSpinner, EmptyState, ErrorBoundary
├── lib/
│   ├── supabase/
│   │   ├── client.ts           ← createBrowserClient
│   │   ├── server.ts           ← createServerClient
│   │   └── middleware.ts
│   ├── validations/            ← zod schemas לכל entity
│   └── utils.ts
├── types/
│   └── index.ts                ← TypeScript types לכל entity
├── supabase-schema.sql         ← כל ה-SQL מוכן להרצה
├── .env.local.example          ← רשימת כל env vars נדרשים
├── README.md                   ← הוראות הרצה ב-5 צעדים
└── package.json
```

---

## שלב 3 — Supabase Schema (MCP ראשון)

**השתמש ב-Supabase MCP** לבדיקת schema קיים לפני כתיבה:

```
1. supabase MCP: list_tables → בדוק מה כבר קיים
2. כתוב supabase-schema.sql מלא לכל ישות מהאפיון:
```

```sql
-- דוגמה לישות לקוח
create table if not exists customers (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  name text not null,
  phone text,
  email text,
  status text default 'active' check (status in ('active','inactive','lead')),
  notes text,
  user_id uuid references auth.users(id) on delete cascade not null
);

-- RLS
alter table customers enable row level security;
create policy "users_own_customers" on customers
  for all using (auth.uid() = user_id);

-- Updated_at trigger
create or replace function update_updated_at()
returns trigger as $$
begin new.updated_at = now(); return new; end;
$$ language plpgsql;

create trigger customers_updated_at
  before update on customers
  for each row execute function update_updated_at();
```

**אחרי כתיבת ה-SQL → הרץ דרך Supabase MCP: `apply_migration`**

---

## שלב 4 — קומפוננטים (magic MCP)

לפני כתיבת קומפוננט מורכב, חפש ב-magic MCP:

```
1. 21st_magic_component_inspiration → חפש "[שם רכיב] Hebrew RTL"
2. אם נמצא מתאים → התאם ל-RTL + עברית
3. אם לא נמצא → כתוב עם shadcn/ui ברירת מחדל
```

**כללי קומפוננטים:**
- כל טופס: react-hook-form + zod + הודעות שגיאה בעברית
- כל רשימה: loading skeleton + empty state + error state
- כל פעולה (שמירה/מחיקה/עדכון): toast notification בעברית
- כל מסך: responsive (375px / 768px / 1280px)
- RTL: `dir="rtl"` ב-root layout, `text-right` ברירת מחדל

---

## שלב 5 — Auth Flow (Supabase Auth)

```typescript
// lib/supabase/middleware.ts
// Protected routes — redirect to /login if no session
// Public routes: /login, /signup, /forgot-password

// app/(auth)/login/page.tsx
// Email + password
// "שכחתי סיסמה" link
// Error messages בעברית: "אימייל או סיסמה שגויים"

// app/(dashboard)/layout.tsx
// Check session server-side
// User context provider
// Sidebar + mobile nav
```

---

## שלב 6 — README.md (חובה)

```markdown
# [שם המערכת]

## הרצה מקומית (5 צעדים)

1. `npm install`
2. העתק `.env.local.example` → `.env.local` ומלא את הערכים
3. הרץ את `supabase-schema.sql` ב-Supabase SQL Editor
4. `npm run dev`
5. פתח http://localhost:3000

## ENV Variables נדרשים
\`\`\`
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
\`\`\`

## מבנה תיקיות
[תיאור קצר של מה בכל תיקייה]
```

---

## שלב 6.5 — הרצת Dev Server (אחרי build תקין)

```bash
# 1. התקנת תלויות
cd תוצרים מוגמרים/CRM/[project-name]/code
npm install

# 2. בניית .env.local אוטומטית מ-Supabase MCP
# supabase MCP: get_project_url → NEXT_PUBLIC_SUPABASE_URL
# supabase MCP: get_publishable_keys → NEXT_PUBLIC_SUPABASE_ANON_KEY

# 3. הרצת dev server
npm run dev -- --port 3001
```

**בדוק ש-localhost:3001 מגיב לפני שמדווח לרן.**

אם השרת לא עולה:
- בדוק שגיאות console
- ודא שה-ENV vars מלאים
- תקן ועלה שוב

**דווח לרן:**
```
✅ שרת פועל: http://localhost:3001
כניסה: admin@demo.com / Demo1234!
(סיסמה זמנית — שנה אחרי אישור)
```

---

## שלב 7 — דיווח לרן / חיים

```
✅ בן סיים — קוד מוכן

📁 נשמר: תוצרים מוגמרים/CRM/[project-name]/code/

מה נבנה:
- [X] קבצים נכתבו
- Supabase schema: [X] טבלאות + RLS
- מסכים: [רשימה]
- Auth: ✅
- Mobile responsive: ✅
- RTL: ✅

כדי להריץ:
1. npm install
2. מלא .env.local
3. הרץ supabase-schema.sql
4. npm run dev

הבא בתור: יואב (/qa) — בדיקות פונקציונליות
```

---

## בדיקה עצמית של בן (לפני מסירה)

- [ ] קראתי spec + UX לפני שהתחלתי?
- [ ] יש `supabase-schema.sql` מלא עם RLS לכל טבלה?
- [ ] כל טופס עם validation + הודעות שגיאה בעברית?
- [ ] כל רשימה עם loading + empty + error states?
- [ ] כל פעולה עם toast notification בעברית?
- [ ] `dir="rtl"` ב-root layout?
- [ ] Mobile responsive — בדקתי 375px?
- [ ] `.env.local.example` כולל כל הvars?
- [ ] `README.md` עם 5 צעדי הרצה?
- [ ] ⛔ שמרתי ב-`תוצרים מוגמרים/CRM/[project-name]/code/` בלבד?
- [ ] השתמשתי ב-Supabase MCP לבדיקת schema?
- [ ] השתמשתי ב-magic MCP לפחות פעם אחת?

---

## למידה בזמן אמת

אם חיים הגיה / תיקן:
> "שמתי לב שהערת: *[ציטוט]*. האם לעדכן את הסקיל שלי לפי זה?"
אם כן → הפעל `/improve`.
