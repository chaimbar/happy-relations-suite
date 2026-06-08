---
skill: figma-layout
owner: עידו
saves-to: תוצרים מוגמרים/Figma/[project-name]/02-layout-plan.md
reads: תוצרים מוגמרים/Figma/[project-name]/01-spec.md · מוח/עסק/my-business.md
---

# סקיל: תכנון שלד HTML ורספונסיביות (Figma Layout)

## הפעלה
כשהמשתמש כותב `/figma-layout` או כשרן שולח בריף עם אפיון עיצובי מריבה.

---

## שלב 0 — קריאת האפיון
1. קרא את `01-spec.md` של הפרויקט הנוכחי.
2. קרא את `מוח/עסק/my-business.md` להקשר של חיים.

---

## שלב 1 — בריף (אם מופעל עצמאית)
אם לא הגיע מרן, שאל את חיים בבת אחת:
```
📋 עידו — בריף פריסה ורספונסיביות

1. האם יש דרישות Breakpoints ספציפיות? (ברירת מחדל: Mobile 375px, Desktop 1280px)
2. האם יש אלמנטים שצריכים להיעלם במובייל (hidden) או להשתנות לחלוטין (למשל תפריט המבורגר)?
```

---

## שלב 2 — תכנון שלד ה-HTML והפריסה (Layout Architecture)

תרגם את ה-Design Spec של ריבה למפרט פריסה:
1. **חלוקה לבלוקים סמנטיים:**
   - `<header>`, `<nav>`, `<main>`, `<section>`, `<footer>`.
2. **תכנון Flexbox ו-Grid (CSS Layout):**
   - הגדר מכולות (Containers) ראשיות.
   - קבע אילו אלמנטים יסודרו בשורות (`flex-row`) ואילו בעמודות (`flex-col`).
   - הגדר שימוש ב-Grid עבור גלריות או כרטיסיות.
3. **הגדרת רספונסיביות (Responsive Blueprint):**
   - כיצד הבלוקים מתנהגים במעבר מדסקטופ למובייל:
     - `flex-row` הופך ל-`flex-col`.
     - אלמנטים שמשנים סדר (`order-first`, `order-last`).
     - תפריט ניווט הופך להמבורגר נפתח או Bottom Nav במובייל.
4. **התאמה ל-RTL (Right-to-Left):**
   - כיווני טקסט, יישורי פלקס (`justify-start` הופך לימין), מרווחים (`ml-*` הופך ל-`mr-*` או שימוש ב-`pe-*` / `ps-*` ב-Tailwind).

---

## שלב 3 — מסמך פריסת ה-HTML (Layout Plan)

הפק קובץ פריסה בפורמט הבא:

```markdown
# תוכנית פריסה ורספונסיביות (Layout Plan) — [project-name]
📅 [תאריך] | עידו

## 1. מבנה סמנטי של הדף (HTML Outline)
```html
<!-- שלד לוגי מוצע -->
<body>
  <header>...</header>
  <main class="container">
    <section class="hero-section">...</section>
    <section class="grid-section">...</section>
  </main>
  <footer>...</footer>
</body>
```

## 2. הגדרות גריד ופלקס (Grid & Flex Spec)
- **מכולה ראשית (Main Wrapper):** `min-h-screen flex flex-col bg-background text-text`
- **איזור הניווט (Navbar):** `w-full flex items-center justify-between px-6 py-4`
- **כרטיסיות מידע (Cards Grid):** `grid grid-cols-1 md:grid-cols-3 gap-6`

## 3. התנהגות רספונסיבית (Responsiveness & Breakpoints)
- **דסקטופ (>= 1024px):**
  - תפריט ניווט מלא פרוס אופקית.
  - כרטיסיות מידע מסודרות ב-Grid של 3 עמודות.
- **מובייל (< 1024px):**
  - תפריט הניווט נפתח בהמבורגר או הופך ל-Dropdown.
  - כרטיסיות מידע מסודרות בטור אחד (`grid-cols-1`).
  - המרווחים הצידיים יורדים ל-`px-4`.

## 4. כללי RTL מובנים
- שימוש בכיווניות גלובלית `dir="rtl"` ב-`<html>`.
- מרווחים צידיים ב-Tailwind יוגדרו באמצעות Logical Properties:
  - `ms-*` (margin-start) ו-`me-*` (margin-end) במקום `ml` / `mr`.
  - `ps-*` (padding-start) ו-`pe-*` (padding-end) במקום `pl` / `pr`.
```

שמור ל: `תוצרים מוגמרים/Figma/[project-name]/02-layout-plan.md`

---

## בדיקה עצמית של עידו

- [ ] שלד ה-HTML מוגדר עם תגיות סמנטיות תקינות?
- [ ] מוגדר שימוש ספציפי ב-Flex / Grid לסידור האלמנטים?
- [ ] תוכנית הרספונסיביות מפרטת את ההתנהגות בדסקטופ ובמובייל בנפרד?
- [ ] כללי ה-RTL מוגדרים תוך שימוש במרווחים לוגיים (`ms`, `ps` וכו')?
- [ ] הקובץ נשמר בנתיב המבוקש?
- [ ] מוכן להעברה לבן ליצירת הקוד בפועל?
