# Standard UX Patterns — לפי crmbizflow.online
> עודכן: 2026-06-01 | נלמד מהמערכת הקיימת של חיים

## כשריבה מאפיינת — לכלול את ה-UX patterns האלה.

---

## Patterns שחיים אוהב

### דפי רשימה (List Pages)
```
Header: H1 + sub-text | [Excel] [PDF] [+ הוסף]
Filter: pills row (לא dropdown)
Search: input עם אייקון
Table/Cards: data
Empty state: emoji + כותרת + כפתור CTA
```

### דפי פרטים (Detail Pages)
```
Back button ←
H1 + badge סטטוס | [ערוך]
KPI row: 3-4 מספרים עם gradient cards
Tabs: לניווט בין תת-קטגוריות
Content tabs: tables / lists / forms
```

### דפי דוחות / פיננסים
```
Date range picker: החודש | חודש קודם | שנה | הכל | מותאם
[Excel] [PDF] export
Tabs: סקירה | תזרים | דוחות | לפי ישות
Charts: recharts / area / bar
```

### KPI Cards — template קבוע
```
gradient bg (כחול/ירוק/כתום/אדום — לפי סוג)
icon קטן פינה
כותרת (sm, muted)
ספרה גדולה (3xl, bold)
sub-text (xs, muted): "0 חדשים • 0 בתהליך"
```

---

## מה לכלול באפיון

לכל מסך ב-01-spec.md — ציין:
1. **Empty state** — מה הטקסט + emoji + CTA
2. **Filters** — אילו pills? (לא "יש סינון" — כתוב בדיוק)
3. **KPI cards** — כמה? מה כל אחד מציג? gradient איזה צבע?
4. **Export** — האם יש Excel/PDF?
5. **Tabs** — אילו טאבים?
6. **Header** — מה H1? מה sub-text?
