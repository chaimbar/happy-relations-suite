---
skill: crm-ux
owner: עידו
saves-to: תוצרים מוגמרים/CRM/[project-name]/02-ux-map.md
reads: תוצרים מוגמרים/CRM/[project-name]/01-spec.md · מוח/עסק/my-business.md
---

# סקיל: CRM UX/UI Architecture

## הפעלה
כשהמשתמש כותב `/crm-ux` או אומר:
"תתכנן את המסכים" / "תכין UX ל-CRM" / "תחשוב על הממשק"
או כשרן שולח בריף עם אפיון מריבה.

---

## שלב 0 — קריאת האפיון

1. קרא את `01-spec.md` מהפרויקט (אם קיים)
2. אם אין אפיון — שאל: "יש אפיון מריבה? אם לא, תאר בקצרה את הישויות הראשיות."
3. קרא `מוח/עסק/my-business.md` — הבן קהל יעד (בעלי עסקים, לא מפתחים)

---

## שלב 1 — בריף (אם עצמאי, לא Pipeline)

שאל בבת אחת:

```
🎨 עידו — בריף UX

1. מה סוג המשתמש העיקרי? (מנהל לבד / צוות מכירות / מנהל + נציגים)
2. איפה הם עובדים בעיקר? (דסקטופ / טלפון / שניהם)
3. יש מערכת קיימת שאוהבים את ה-UX שלה? (לא חייב CRM — כל מערכת)
4. מה הפעולה שעושים הכי הרבה ביום? (להוסיף ליד / לעדכן סטטוס / לשלוח הודעה)
```

---

## שלב 2 — ארכיטקטורת ניווט

### בחר מבנה ניווט

**Option A — Sidebar (דסקטופ + tablet):**
```
צד שמאל RTL: לוגו | ניווט ראשי | פרופיל משתמש
תוכן: רוחב מלא עם header
```

**Option B — Bottom Nav (mobile first):**
```
תחתית: 4-5 אייקונים לדפים הראשיים
header: שם דף + פעולות
```

**Option C — Hybrid (ברירת מחדל מומלצת):**
```
דסקטופ: Sidebar
מובייל: Bottom Nav
אותו קוד — responsive
```

הצג את הבחירה ונמק.

---

## שלב 3 — מפת מסכים

לכל מסך, כתוב:

```
## מסך: [שם המסך]
נתיב: /[route]
תיאור: [מה הדף עושה]
מי רואה: [Admin / כולם / ...]

### מה יש בדף
- [רכיב 1]: [תיאור]
- [רכיב 2]: [תיאור]

### פעולות אפשריות
- [לחיצה על X] → [מה קורה]
- [FAB / כפתור] → [מה נפתח]

### עדיפות
🔴 Core | 🟡 Nice | ⚪ Future
```

**מסכים חובה לכל CRM:**
1. Dashboard / Home — סיכום מצב + קיצורי דרך
2. רשימת ישות ראשית (לקוחות / לידים / ...) — search + filter + sort
3. פרופיל ישות — כל הפרטים + history + פעולות
4. הוספה / עריכה — form נקי
5. Settings — הגדרות משתמש + נתונים
6. Login / Auth

**מסכים ייחודיים לפי סוג ה-CRM** — הוסף לפי האפיון.

---

## שלב 4 — Flows קריטיים

תאר כל flow כצעדים:

```
### Flow: הוספת לקוח חדש
1. לחיצה על FAB / "לקוח חדש"
2. Form: שם, טלפון, מקור (required) + שאר (optional)
3. שמור → redirect לפרופיל הלקוח החדש
4. Toast: "לקוח נוסף בהצלחה"

### Flow: עדכון סטטוס עסקה
1. פרופיל לקוח → טאב "עסקאות"
2. לחיצה על עסקה → dropdown סטטוס
3. שינוי → שמירה אוטומטית
4. History log מתעדכן
```

**Flows חובה:** הוספת ישות, עדכון סטטוס, חיפוש, שליחת הודעה (אם רלוונטי)

---

## שלב 5 — Design System

```markdown
## Design System — CRM [שם פרויקט]

### צבעים
Primary: [hex] — כפתורים ראשיים, links
Secondary: [hex] — אלמנטים משניים
Success: #22c55e | Warning: #f59e0b | Error: #ef4444
Background: [hex] | Surface: [hex] | Border: [hex]

### טיפוגרפיה (RTL)
Font: Heebo / Assistant / Rubik (Google Fonts, Hebrew)
H1: 24px bold | H2: 20px semibold | Body: 14px regular
Direction: RTL | text-align: right

### Components (shadcn/ui)
Button, Input, Select, Table, Card, Badge, Dialog, Toast, Sidebar
```

---

## שלב 5.5 — חיפוש קומפוננטים אמיתיים (magic MCP)

לפני כתיבת המפרט, חפש קומפוננטים קיימים ב-21st.dev:

```
עבור כל מסך Core:
1. קרא magic MCP: 21st_magic_component_inspiration
   שאילתה: "[שם הרכיב] RTL Hebrew [סוג: table/form/sidebar/card]"

2. אם מצאת קומפוננט מתאים → ציין אותו במפרט:
   "השתמש ב: [שם קומפוננט] מ-21st.dev (URL)"

3. אם לא מצאת → השתמש ב-shadcn/ui ברירת מחדל
```

**לא לבנות מאפס מה שכבר קיים ומוכן.**

---

## שלב 6 — מפרט רכיבים לבנייה לוקאלית

**כלל:** לא Lovable, לא v0, לא Bolt. הכל נבנה לוקאלית. עידו מגדיר מה לבנות — בן בונה.

לכל מסך Core, כתוב מפרט רכיב:

```markdown
### רכיב: [שם]
קובץ: src/components/[name].tsx
stack: React + Tailwind + shadcn/ui
RTL: כן | Mobile First: כן

#### Props
- [propName]: [type] — [תיאור]

#### מה מציג
- [רכיב 1 מ-shadcn]: [שימוש]
- [רכיב 2 מ-shadcn]: [שימוש]

#### מצבים (states)
- loading: Skeleton
- empty: [הודעה בעברית]
- error: Alert destructive

#### דוגמת שימוש
<ComponentName prop="value" />
```

**רכיבי shadcn/ui לשימוש (ברירות מחדל):**
- ניווט: `Sidebar`, `NavigationMenu`, `Sheet` (מובייל)
- נתונים: `Table`, `DataTable`, `Card`
- פעולות: `Button`, `Dialog`, `DropdownMenu`
- טפסים: `Form`, `Input`, `Select`, `Combobox`
- משוב: `Toast`, `Alert`, `Badge`, `Skeleton`

---

## פלט מלא — מה יוצא

```
תוצרים מוגמרים/CRM/[project-name]/02-ux-map.md
```

המסמך כולל:
- בחירת מבנה ניווט + נימוק
- מפת מסכים מלאה (כל מסך עם תיאור + פעולות)
- Flows קריטיים
- Design System (צבעים, טיפוגרפיה, components)
- מפרט רכיבים מלא לכל מסך Core (props + states + shadcn)?

---

## בדיקה עצמית של עידו (לפני מסירה)

- [ ] כל ישות מהאפיון של ריבה מקבלת לפחות מסך אחד?
- [ ] כל מסך Core מוגדר עם רכיבים + פעולות?
- [ ] יש לפחות 3 flows קריטיים מתוארים?
- [ ] Design System מוגדר עם צבעים + font עברי?
- [ ] RTL מוזכר בכל מסך שיש בו טקסט?
- [ ] Mobile מוגדר (bottom nav / responsive)?
- [ ] לכל מסך Core יש מפרט רכיב עם props + states?
- [ ] כל רכיב משתמש ב-shadcn/ui (לא CSS ידני)?
- [ ] המסמך שמור לנתיב הנכון?
- [ ] אם זה Pipeline של רן — הפלט מוכן להעברה לבן לבנייה לוקאלית?

---

## למידה בזמן אמת

אם חיים הגיה / תיקן — בסוף:
> "שמתי לב שהערת: *[ציטוט]*. האם לעדכן את הסקיל שלי לפי זה?"

אם כן → הפעל `/improve`.
