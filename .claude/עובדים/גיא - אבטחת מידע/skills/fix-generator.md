---
skill: fix-generator
owner: גיא
---

# סקיל: מחולל תיקונים — קוד אמיתי

## כלל ברזל
לא פרומפטים ל-Lovable. לא תיאורים. **קוד אמיתי שבן מדביק ישירות.**

---

## לכל ממצא — 3 דברים

### 1. SQL Fix (לבעיות Supabase)

```sql
-- 🔴 בעיה: RLS לא מופעל על [entity]
-- תיקון:
alter table [entity] enable row level security;

create policy "[entity]_select_own" on [entity]
  for select using (auth.uid() = user_id);

create policy "[entity]_insert_own" on [entity]
  for insert with check (auth.uid() = user_id);

create policy "[entity]_update_own" on [entity]
  for update using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "[entity]_delete_own" on [entity]
  for delete using (auth.uid() = user_id);
```

**הרץ דרך Supabase MCP `execute_sql` מיד.**

---

### 2. TypeScript Fix (לבעיות קוד)

**בעיה: API route לא מאמת auth**
```typescript
// ❌ לפני (לא בטוח)
export async function GET(request: Request) {
  const { data } = await supabase.from('customers').select('*');
  return Response.json(data);
}

// ✅ אחרי (בטוח)
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
  const cookieStore = cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get: (name) => cookieStore.get(name)?.value } }
  );

  const { data: { user }, error } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  // RLS מטפל בסינון — user רואה רק את הנתונים שלו
  const { data } = await supabase.from('customers').select('*');
  return Response.json(data);
}
```

**בעיה: XSS — תוכן לא sanitized**
```typescript
// ❌ לפני
<div dangerouslySetInnerHTML={{ __html: userInput }} />

// ✅ אחרי — השתמש ב-DOMPurify
import DOMPurify from 'isomorphic-dompurify';
<div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(userInput) }} />

// או עדיף — אל תשתמש ב-dangerouslySetInnerHTML בכלל:
<div>{userInput}</div>  // React מ-escape אוטומטית
```

**בעיה: Service Role Key חשוף ב-client**
```typescript
// ❌ לפני — NEXT_PUBLIC_ = חשוף לכל!
const supabase = createClient(url, process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY!);

// ✅ אחרי — Service Role רק ב-server-side
// בקובץ שמסתיים ב-.server.ts או בתוך app/api/
import { createClient } from '@supabase/supabase-js';
const adminClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // ← בלי NEXT_PUBLIC_
);
```

---

### 3. .env.local Fix

```bash
# ✅ מבנה נכון של env vars
# ב-.env.local (לא ב-git!)

# Client-safe (יכולים להיות NEXT_PUBLIC_)
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...

# Server-only (אסור NEXT_PUBLIC_!)
SUPABASE_SERVICE_ROLE_KEY=eyJ...
GREEN_API_TOKEN=...
STRIPE_SECRET_KEY=sk_...
RESEND_API_KEY=re_...
```

---

## חוקי תיקון

1. **לא שובר פונקציונליות** — בדוק שה-fix לא חוסם users לגיטימיים
2. **SQL fixes מורצים דרך Supabase MCP** — לא מדביקים ידנית
3. **TypeScript fixes מועברים לבן** לביצוע — עם הסבר של 1 שורה
4. **אחרי כל fix** — יואב מריץ regression test על אותו flow
