---
skill: build-crm
owner: רן
saves-to: תוצרים מוגמרים/CRM/[project-name]/
reads: ROSTER.md · profile.md של כל עובד בפייפליין · מוח/עסק/my-business.md
---

# סקיל: בניית CRM אוטונומית מלאה

## הפעלה
`/build-crm [תיאור/אפיון]`
"תבנה לי CRM" / "אני צריך CRM ל[סוג עסק]" / "תתחיל בנייה"

**כלל ברזל: חיים אומר "בנה" — רן עושה הכל. חיים מקבל localhost ואחר כך production.**

---

## שלב 0 — טעינה

1. קרא `ROSTER.md` — ודא שכל עובדי Pipeline קיימים
2. קרא `מוח/עסק/my-business.md` — הקשר עסקי
3. קבע שם פרויקט: `[סוג-עסק]-crm-[YYYY-MM-DD]`
4. צור תיקייה: `תוצרים מוגמרים/CRM/[project-name]/`

---

## שלב 1 — בריף (שאלה אחת בלבד)

```
🎯 רן — בריף CRM

1. מה סוג העסק? (נדל"ן / קליניקה / שיווק / ...)
2. 3 הדברים שה-CRM חייב לעשות?
3. יש Supabase project קיים? (כן + URL / לא)
4. יש GitHub repo? (כן + שם / לא)
```

אם חיים שלח אפיון מלא בהודעה — דלג על שאלות שכבר נענו.

---

## שלב 2 — הצגת Pipeline לאישור

```
📋 Pipeline — CRM ל[סוג עסק]

שלב 1 → ריבה    → אפיון + Supabase schema
שלב 2 → עידו    → ארכיטקטורת מסכים + מפרטי רכיבים
שלב 3 → בן      → קוד Next.js מלא (לוקאלי)
שלב 3.5 → בן    → הרצת dev server → localhost:3001
שלב 4   → יואב  → QA אוטומטי (Playwright) + לולאת תיקון
שלב 5   → גיא   → אבטחה + Backend (Supabase MCP + Playwright)
────────────────────────────────
⏸️  CHECKPOINT: חיים רואה מערכת עובדת + בדוקה + בטוחה
────────────────────────────────
שלב 6 → טל      → העלאה לענן (Vercel + Supabase MCP)
שלב 7 → יואב    → QA production
[שלב 8 → עמרי   → הדרכה | אם מבוקש]

האם לאשר?
```

---

## שלב 3 — ריבה: אפיון

**בריף לריבה:**
```
📨 ריבה | שלב 1 | CRM ל[סוג עסק]

קרא מוח/עסק/my-business.md לקונטקסט.
השתמשי ב-Supabase MCP (list_tables) אם יש project קיים.

פלט נדרש ב-01-spec.md:
- ישויות + שדות + types + validations
- קשרים (1:N / N:N)
- statuses לכל entity (enum values)
- הרשאות לפי תפקיד
- לוגיקה עסקית + triggers
- integrations נדרשות
- supabase-schema.sql מלא
```

**QA Gate ריבה:**
- [ ] כל ישות שהוזכרה בבריף מוגדרת?
- [ ] יש supabase-schema.sql?
- [ ] כל enum מוגדר עם ערכים ספציפיים?
- [ ] הרשאות מוגדרות?

---

## שלב 4 — עידו: UX

**בריף לעידו:**
```
📨 עידו | שלב 2 | CRM ל[סוג עסק]

קרא 01-spec.md של ריבה.
השתמש ב-magic MCP (21st_magic_component_inspiration) לחיפוש קומפוננטים.

פלט נדרש ב-02-ux-map.md:
- navigation: sidebar desktop + bottom-nav mobile
- כל מסך: route + רכיבים + פעולות + states
- flows קריטיים (הוספה / עריכה / חיפוש)
- Design System: צבעים + font עברי + spacing
- מפרט רכיבים לבנייה: props + states + shadcn/ui
```

**QA Gate עידו:**
- [ ] כל ישות מ-spec קיבלה לפחות מסך list + מסך detail?
- [ ] מסך dashboard מוגדר?
- [ ] כל מסך Core עם loading + empty + error states?
- [ ] Mobile מוגדר?
- [ ] Design System מוגדר?

---

## שלב 5 — בן: קוד

**בריף לבן:**
```
📨 בן | שלב 3 | CRM ל[סוג עסק]

קרא 01-spec.md + 02-ux-map.md.
השתמש ב-Supabase MCP (apply_migration) להרצת schema.
השתמש ב-magic MCP לקומפוננטים מורכבים.

פלט נדרש ב-code/:
- Next.js 14 App Router מלא
- כל מסך מה-UX map
- Supabase auth + RLS
- כל form עם validation + error messages בעברית
- כל list עם loading + empty + error states
- RTL + Mobile First
- README.md + .env.local.example
```

**QA Gate בן:**
- [ ] `npm run build` עובר בלי errors?
- [ ] README.md קיים עם 5 צעדי הרצה?
- [ ] .env.local.example מלא?
- [ ] supabase-schema.sql הורץ ב-Supabase MCP?

---

## שלב 5.5 — בן: הרצת Dev Server

**בריף לבן (המשך):**
```
לאחר שהקוד עבר build:

1. הרץ: cd תוצרים מוגמרים/CRM/[project-name]/code && npm install
2. צור .env.local מ-.env.local.example (עם ערכים אמיתיים מ-Supabase MCP)
3. הרץ: npm run dev -- --port 3001
4. בדוק שהשרת עלה: http://localhost:3001
5. דווח לרן:
   ✅ שרת פועל: http://localhost:3001
   כניסה לדמו: [אימייל] / [סיסמה זמנית]
```

---

## שלב 6 — יואב: QA אוטומטי (Playwright)

**בריף ליואב:**
```
📨 יואב | שלב 4 | CRM ל[סוג עסק]

URL לבדיקה: http://localhost:3001
קרא 01-spec.md + 02-ux-map.md לפני שמתחיל.
השתמש ב-Playwright MCP לכל בדיקה.

פלט נדרש ב-04-qa-report.md:
- בדיקת כל flow קריטי (Playwright screenshots)
- בדיקת כל CRUD entity
- בדיקת auth (login/logout/protected routes)
- בדיקת mobile 375px
- console errors מ-browser_console_messages
- ציון סופי X/40
```

**QA Gate יואב:**
- [ ] אין 🔴 קריטיים (אם יש → לולאת תיקון)?
- [ ] ציון >= 30/40?
- [ ] אין console errors?

---

## שלב 6.5 — לולאת תיקון (מקסימום 3 סיבובים)

```
אם יואב מצא 🔴 קריטיים:

סיבוב [N]/3:
  1. בן מקבל: רשימת 🔴 מיואב
  2. בן מתקן קוד
  3. בן מריץ npm run build (חייב לעבור)
  4. יואב חוזר על אותן הבדיקות שנכשלו
  5. אם עבר → ממשיכים
  6. אם לא עבר → סיבוב הבא

אחרי 3 סיבובים ועדיין יש 🔴:
  → עצור ודווח לחיים: "יש בעיה שלא הצלחנו לפתור אוטומטית: [תיאור]"
  → חכה להנחיה
```

---

## שלב 7 — גיא: אבטחה + Backend

**בריף לגיא:**
```
📨 גיא | שלב 5 | CRM ל[סוג עסק]

URL: http://localhost:3001
Supabase project: [URL]
קרא 01-spec.md לישויות ו-RLS.
השתמש ב-Supabase MCP (execute_sql) לבדיקת RLS בפועל.

פלט נדרש ב-05-security-review.md:
- בדיקת RLS לכל טבלה (execute_sql עם user מזויף)
- בדיקת API routes — הרשאות?
- בדיקת auth flow — tokens, sessions
- בדיקת input validation (XSS, injection)
- ממצאים לפי חומרה: 🔴 קריטי / 🟡 חשוב / 🟢 מינורי
```

**QA Gate גיא:**
- [ ] אין 🔴 קריטיים?
- [ ] RLS עובד נכון (מישהו לא יכול לקרוא נתוני מישהו אחר)?

---

## ⏸️ CHECKPOINT — אישור חיים לפני העלאה לענן

```
⏸️ CHECKPOINT — המערכת עברה QA + אבטחה. מוכנה לאישור.

🌐 כתובת לבדיקה: http://localhost:3001

📊 סיכום מה שנבדק עד כאן:
  יואב — QA: [X]/40 | 🔴 [N] | 🟡 [N] | ✅ [N]
  גיא  — אבטחה: [X] קריטיים | [X] גבוהים | RLS: ✅/❌

🔍 מה כדאי לבדוק לפני שמאשרים:
  ✓ זרימה אחת מקצה לקצה (הוסף לקוח → עדכן → מחק)
  ✓ הניווט הגיוני לך?
  ✓ משהו חסר שהיית מצפה לראות?
  ✓ נראה טוב על מובייל? (F12 → Toggle Device)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
כתוב הערות — או "מאשר, תעלה לענן"
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**רן לא ממשיך לטל לפני אישור מפורש של חיים.**

אם יש הערות:
- שינויי UI/לוגיקה → בן מתקן → יואב מריץ regression
- שינויי אבטחה → גיא מתקן → חזרה ל-CHECKPOINT
- "הכל טוב" → ממשיכים לטל

---

## שלב 8 — טל: Deployment

**בריף לטל:**
```
📨 טל | שלב 6 | CRM ל[סוג עסק]

השתמש ב:
- Supabase MCP (get_project_url, get_publishable_keys) לשליפת ENV
- Vercel MCP (list_deployments, get_deployment_build_logs) לפיקוח

בצע deployment ב-Vercel.
דווח: URL production + build logs + post-deploy checklist.
```

---

## שלב 9 — יואב: QA Production

**בריף ליואב (סיבוב שני):**
```
📨 יואב | שלב 7 | QA Production

URL: [production URL מטל]
חזור על אותן בדיקות עם Playwright על production.
התמקד ב: auth, CRUD, mobile, console errors.
```

---

## שלב 10 — דוח מסכם לחיים

```
# 🎉 CRM מוכן לשימוש — [שם פרויקט]
📅 [תאריך]

## קישורים
🌐 Production: https://[subdomain].[domain]
💻 Local: http://localhost:3001 (עדיין פועל)

## מה נבנה
[רשימת פיצ'רים שנבנו]

## ציונות
| בדיקה | ציון |
|---|---|
| QA פונקציונלי | X/40 |
| אבטחה | X 🔴 / X 🟡 |
| Build | ✅ |
| Mobile | ✅ |

## כניסה למערכת
אימייל: [admin@example.com]
סיסמה: [temp-password]
(שנה אחרי הכניסה הראשונה)

## תוצרים
תוצרים מוגמרים/CRM/[project-name]/
├── 01-spec.md
├── 02-ux-map.md
├── 04-qa-report.md
├── 05-security-review.md
├── 06-deploy-guide.md
└── code/
```

---

## למידה בזמן אמת

אם במהלך Pipeline חיים אמר "שנה X" / "פעם הבאה..." / "יהיה יותר טוב אם" — בסוף המשימה:
> "שמתי לב שהערת: *[ציטוט]*. האם לעדכן את ה-Pipeline שלי לפי זה?"

אם כן → `/improve` על `build-crm.md` של רן — ניר יציג before/after ויבצע.

---

## בדיקה עצמית של רן

- [ ] בריף התקבל לפני תחילת Pipeline?
- [ ] Pipeline הוצג ואושר?
- [ ] כל QA Gate עבר לפני מעבר הלאה?
- [ ] CHECKPOINT — חיים אישר רק אחרי שיואב וגיא סיימו?
- [ ] לולאת תיקון הופעלה אם היו 🔴?
- [ ] גיא בדק RLS בפועל עם Supabase MCP?
- [ ] טל קיבל ENV אמיתיים מ-Supabase MCP?
- [ ] יואב בדק production אחרי deployment?
- [ ] דוח מסכם כולל קישור production + ציונות?
