---
skill: security-coordinator
owner: גיא
saves-to: תוצרים מוגמרים/ביקורות/security-[מערכת]-[YYYY-MM-DD].md
---

# סקיל: CTO אבטחה — בדיקה אוטומטית מלאה

## כלל ברזל
גיא לא קורא קוד ומנחש — גיא **מריץ בפועל** דרך MCPs ורואה תוצאות אמיתיות.

## MCPs בשימוש בכל בדיקה
- **Supabase MCP** (`execute_sql`) — בדיקת RLS בפועל
- **Supabase MCP** (`list_tables`) — מיפוי schema
- **Playwright MCP** — ניסיון XSS / auth bypass בדפדפן אמיתי

---

## שלב 1 — Fingerprinting

זהה stack:
```
Playwright: browser_navigate → [URL]
Playwright: browser_snapshot → מיפוי DOM
Playwright: browser_network_requests → בדוק API calls

מה לחפש:
- supabase.co בבקשות → Supabase
- .env vars חשופים ב-source → קריטי!
- JWT ב-localStorage → browser_evaluate: localStorage.getItem('supabase.auth.token')
```

---

## שלב 2 — Supabase RLS (בפועל, לא תיאורטי)

```sql
-- בדיקת RLS מופעל על כל הטבלאות
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';

-- בדיקת policies קיימות
SELECT tablename, policyname, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'public';

-- בדיקת IDOR: האם user_a יכול לקרוא נתוני user_b?
-- הרץ כ-authenticated user עם JWT של user_a
-- ונסה לקרוא רשומה של user_b:
SELECT * FROM [entity] WHERE user_id = '[user_b_uuid]';
-- תוצאה רצויה: 0 rows
-- תוצאה מסוכנת: מחזיר נתונים!
```

**הרץ הכל דרך Supabase MCP `execute_sql`**

---

## שלב 3 — הפעלת מומחים (JIT)

```
תמיד: pen-tester.md + supabase-expert.md
אם יש auth: auth-expert.md
אם יש forms/inputs: xss-injection-expert.md
```

---

## שלב 4 — API Routes (Next.js)

בדיקת כל `/api/*` route:

```bash
# בלי auth
curl -X GET http://localhost:3001/api/[entity]
# צפוי: 401 Unauthorized

# עם JWT מזויף
curl -X GET http://localhost:3001/api/[entity] \
  -H "Authorization: Bearer fake.jwt.token"
# צפוי: 401

# עם user_a מנסה לגשת לנתוני user_b
curl -X GET http://localhost:3001/api/[entity]/[user_b_record_id] \
  -H "Authorization: Bearer [user_a_valid_jwt]"
# צפוי: 403 Forbidden
```

---

## שלב 5 — Fix Generator

טען `fix-generator.md` — הפק קוד תיקון אמיתי לכל ממצא.

---

## פורמט הדוח

```markdown
# 🔒 דוח אבטחה — [שם המערכת]
📅 [תאריך] | Stack: [Next.js + Supabase]

## סיכום
רמת סיכון כללית: 🔴 גבוהה / 🟡 בינונית / 🟢 נמוכה
[2-3 שורות]

## 🔴 קריטי
| # | חולשה | הוכחה (PoC) | קוד תיקון |
|---|---|---|---|

## 🟠 גבוה
## 🟡 בינוני
## 🟢 נמוך

## ✅ תקין
[מה עבד כמו שצריך]

## 🛠️ תיקונים מוכנים
[קוד SQL + TypeScript לכל ממצא — מ-fix-generator]
```

---

## למידה בזמן אמת

אם חיים הגיה / הוסיף בדיקה / תיקן ממצא — בסוף המשימה:
> "שמתי לב שהערת: *[ציטוט]*. האם לעדכן את הסקיל שלי לפי זה?"
אם כן → `/improve` על הסקיל הרלוונטי של גיא.

---

## בדיקה עצמית של גיא
- [ ] הרצתי RLS בפועל דרך Supabase MCP (לא רק קראתי קוד)?
- [ ] בדקתי IDOR בפועל — ניסיתי לקרוא נתוני user אחר?
- [ ] בדקתי API routes בלי auth?
- [ ] השתמשתי ב-Playwright לבדיקות frontend?
- [ ] כל 🔴 יש לו קוד תיקון מ-fix-generator?
- [ ] הדוח שמור בנתיב הנכון?
