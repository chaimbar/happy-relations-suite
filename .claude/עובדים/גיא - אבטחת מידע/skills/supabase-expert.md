---
skill: supabase-expert
owner: גיא
---

# סקיל: בדיקת Supabase — בפועל, לא תיאורטי

## כלל ברזל: כל בדיקה מורצת דרך Supabase MCP `execute_sql`

---

## בדיקה 1 — RLS מופעל על הכל?

```sql
-- מריץ דרך Supabase MCP
SELECT 
  tablename,
  rowsecurity as rls_enabled,
  CASE WHEN rowsecurity THEN '✅' ELSE '🔴 חסר RLS!' END as status
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;
```

**תוצאה רצויה:** כל הטבלאות עם `rls_enabled = true`

---

## בדיקה 2 — Policies קיימות ומתאימות?

```sql
SELECT 
  tablename,
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, cmd;
```

**מה לחפש בעיות:**
- טבלה עם RLS אבל ללא policies → אף אחד לא יכול לקרוא!
- `qual = 'true'` ← חשוף לכולם!
- `qual IS NULL` עם INSERT ← כל אחד יכול להכניס!

---

## בדיקה 3 — IDOR בפועל

```sql
-- קבל 2 users שונים מ-auth.users
SELECT id, email FROM auth.users LIMIT 5;

-- נסה לקרוא נתוני user_b דרך context של user_a
-- (מדמה בקשה ב-anon mode עם JWT של user_a)
SET LOCAL role = authenticated;
SET LOCAL request.jwt.claims = '{"sub": "[user_a_uuid]", "role": "authenticated"}';

SELECT * FROM [entity] WHERE user_id = '[user_b_uuid]';
-- תוצאה רצויה: 0 rows
-- תוצאה מסוכנת: חוזר נתונים!
```

---

## בדיקה 4 — Storage Buckets

```sql
-- בדיקת buckets פתוחים
SELECT name, public 
FROM storage.buckets;
-- public = true → כל אחד יכול לגשת לקבצים!

-- בדיקת storage policies
SELECT * FROM storage.policies;
```

---

## בדיקה 5 — Functions עם SECURITY DEFINER

```sql
-- functions שרצות כ-superuser — מסוכנות אם לא מוגנות
SELECT 
  routine_name,
  security_type,
  CASE WHEN security_type = 'DEFINER' THEN '⚠️ בדוק הרשאות!' ELSE '✅' END
FROM information_schema.routines
WHERE routine_schema = 'public';
```

---

## בדיקה 6 — Realtime דליפה

```sql
-- האם יש publication ב-realtime על טבלאות רגישות?
SELECT 
  tablename,
  CASE WHEN tablename IN (
    SELECT tablename FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime'
  ) THEN '⚠️ חשוף ב-Realtime!' ELSE '✅' END as realtime_status
FROM pg_tables
WHERE schemaname = 'public';
```

---

## בדיקה 7 — Service Role Key חשוף?

**Playwright MCP:**
```
browser_navigate → [URL]
browser_evaluate → "Object.keys(window).filter(k => k.includes('supabase'))"
browser_evaluate → "localStorage.getItem('supabase.auth.token')"

// בדוק source code
browser_evaluate → "document.documentElement.innerHTML"
// חפש: service_role, eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9 (JWT prefix)
```

---

## דירוג ממצאי Supabase

| ממצא | חומרה | תיקון מיידי |
|---|---|---|
| RLS לא מופעל | 🔴 קריטי | `ALTER TABLE x ENABLE ROW LEVEL SECURITY` |
| Policy `using (true)` | 🔴 קריטי | שנה ל-`auth.uid() = user_id` |
| IDOR מוצלח | 🔴 קריטי | תיקון RLS + בדיקה מחדש |
| Service Role חשוף | 🔴 קריטי | הסר מ-client code מיד |
| Storage bucket פתוח | 🟠 גבוה | הוסף storage policy |
| SECURITY DEFINER ללא בדיקה | 🟠 גבוה | הוסף auth check בפונקציה |
| Realtime ללא RLS | 🟡 בינוני | הגבל publications |
