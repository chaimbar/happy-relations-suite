# Standard עיצוב — לפי crmbizflow.online
> עודכן: 2026-06-01 | נלמד מהמערכת הקיימת של חיים

## זה מה שחיים אוהב. זה הסטנדרט. לא לסטות ממנו.

---

## צבעים (Design Tokens)

```css
/* Sidebar */
--sidebar-bg: #101923;          /* כהה, כמעט שחור */
--sidebar-text: #8B9BB4;        /* אפור-כחול למשנה */
--sidebar-active: #FFFFFF;      /* לבן לאיטם פעיל */
--sidebar-active-bg: #1E2D3D;   /* כחול-כהה לאיטם פעיל */

/* Page background */
--page-bg: #F6F7F8;             /* אפור-כחלחל, לא לבן */

/* Cards */
--card-bg: #FFFFFF;
--card-border: rgba(228, 232, 236, 0.5);  /* שקוף למחצה, עדין מאוד */
--card-radius: 16px;            /* לא 8px! 16px */
--card-shadow: none;            /* ללא shadow — נקי */
--card-gradient: linear-gradient(to right bottom, rgba(15, 131, 240, 0.1), transparent);

/* Primary action */
--btn-primary-bg: linear-gradient(145deg, #0F83F0, #1565C0);
--btn-radius: 12px;
--btn-padding: 8px 16px;

/* Typography */
--font-family: 'Manrope', sans-serif;  /* לא Heebo */
--h1-size: 30px;
--h1-weight: 700;
--body-size: 14px;
--body-color: #1F2937;
```

---

## כללי UX שחיים אוהב

### 1. Sidebar — תמיד כהה
```
❌ לא: sidebar לבן עם border אפור
✅ כן: sidebar #101923, טקסט #8B9BB4, active item עם bg כהה יותר
```

### 2. Cards — 16px radius, ללא shadow
```
❌ לא: border-radius: 8px + box-shadow
✅ כן: border-radius: 16px + border עדין שקוף + gradient קל
```

### 3. כפתורים ראשיים — Gradient
```
❌ לא: background: #1e40af (solid)
✅ כן: background: linear-gradient(145deg, #0F83F0, #1565C0)
```

### 4. Empty States — ידידותיים עם emoji
```
❌ לא: "אין נתונים"
✅ כן: "אין עובדים עדיין 😊 | הוסף את הראשון שלך [כפתור]"
```

### 5. KPI Cards — מספרים גדולים + sub-text
```
✅ מבנה:
  H3 (17px) = כותרת
  ספרה גדולה (30px+, bold)
  sub-text (12px, אפור) = "0 חדשים • 0 בתהליך"
```

### 6. ניווט פנימי — Tabs
```
✅ כאשר יש תת-מקטעים בדף → Tabs (לא Accordion)
   דוגמה: פיננסים = סקירה | תזרים | דוחות | לקוחות
```

### 7. Filter Pills — לא dropdown
```
✅ כולם | מנהלים | עובדים  ← pills בשורה, לא select box
```

### 8. Page Header
```
✅ מבנה:
  H1 (30px, bold) = "ניהול עובדים"
  Sub-text (14px, אפור) = "Probe Test Business • ניהול צוות והרשאות"
  [כפתורי Action מימין]
```

### 9. ייצוא — חובה בדפי נתונים
```
✅ כפתורי Excel + PDF בפינה הימנית של header
```

### 10. Date Range Picker — לדפי נתונים
```
✅ החודש | חודש קודם | שנה נוכחית | הכל | מותאם אישית
```

---

## Font: Manrope (לא Heebo)

```css
@import url('https://fonts.googleapis.com/css2?family=Manrope:wght@300;400;500;600;700;800&display=swap');

body { font-family: 'Manrope', sans-serif; }
```

Manrope תומכת בעברית ומרגישה יותר פרימיום מ-Heebo.

---

## מה שחיים אוהב — בקיצור

✅ כהה, פרימיום, gradient  
✅ cards נקיות, ללא shadow, radius גדול  
✅ כפתורים עם gradient כחול  
✅ emoji ב-empty states  
✅ מספרים גדולים ב-KPIs  
✅ tabs לניווט פנימי  
✅ filter pills  
✅ ייצוא בכל דף  
