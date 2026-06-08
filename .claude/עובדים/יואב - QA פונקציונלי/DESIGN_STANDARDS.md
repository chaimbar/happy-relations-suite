# Standard QA עיצוב — לפי crmbizflow.online
> עודכן: 2026-06-01 | נלמד מהמערכת הקיימת של חיים

## כשיואב בודק מערכת — זה הסטנדרט שחיים מצפה לו.

---

## Checklist עיצוב — לכל דף

### Sidebar
- [ ] צבע sidebar כהה (לא לבן): `rgb(16, 25, 35)` בערך
- [ ] טקסט inactive: אפור-כחול (לא שחור)
- [ ] Active item: bg כהה יותר + טקסט לבן
- [ ] רוחב sidebar: ~256px

### Background
- [ ] צבע רקע עמוד: אפור-כחלחל בהיר (לא לבן מוחלט `#FFFFFF`)
- [ ] `rgb(246, 247, 248)` בערך

### Cards
- [ ] border-radius: 16px (לא 8px!)
- [ ] ללא box-shadow (או shadow קטן מאוד)
- [ ] border עדין שקוף למחצה
- [ ] gradient קל ברקע (לא לבן שטוח)

### כפתורים ראשיים
- [ ] gradient כחול (לא solid)
- [ ] border-radius: 12px

### Font
- [ ] Manrope (לא Heebo, לא Roboto)
- [ ] H1: 30px bold
- [ ] Body: 14px

### KPI Cards
- [ ] מספר גדול (28px+, bold)
- [ ] sub-text קטן מתחת
- [ ] gradient קל ב-bg

### Empty States
- [ ] יש emoji
- [ ] יש כפתור CTA ברור
- [ ] הודעה ידידותית (לא "אין נתונים")

### Filter
- [ ] Pills (לא dropdown) לפילטר ראשי

### Page Header
- [ ] H1 + sub-text תחתיו
- [ ] כפתורי Excel/PDF בדפי נתונים

---

## דוגמאות: ✅ vs ❌

| אלמנט | ❌ לא בסדר | ✅ בסדר |
|---|---|---|
| Sidebar | לבן עם border | `#101923` כהה |
| Card radius | 8px | 16px |
| Card shadow | `shadow-lg` | ללא shadow |
| כפתור ראשי | `bg-blue-600` | gradient כחול |
| Empty state | "אין נתונים" | emoji + CTA |
| Font | Heebo / System | Manrope |
| Bg color | `#FFFFFF` | `#F6F7F8` |
| Filter | `<select>` | Pills |

---

## ממצאים ב-QA שצריך לדווח עליהם כ-🔴

- Sidebar לבן
- Cards עם shadow חזק
- Empty states ללא CTA
- כפתור ראשי ללא gradient
- Font שגוי

## ממצאים ב-QA שצריך לדווח עליהם כ-🟡

- border-radius קטן מ-12px
- gradient חסר ב-KPI cards
- sub-text חסר ב-KPI cards
- filter כ-dropdown במקום pills
