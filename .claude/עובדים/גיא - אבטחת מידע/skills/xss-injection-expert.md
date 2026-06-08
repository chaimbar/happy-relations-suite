---
skill: xss-injection-expert
owner: גיא
---

# סקיל: מומחה XSS והזרקות — בדיקות אמיתיות עם Playwright

**כלל:** כל הזרקה מורצת בפועל. לא "בדוק אם יש" — **הזרק ובדוק מה קורה.**

## בדיקות מעשיות (Playwright MCP)

```
// Stored XSS — הזרק ובדוק אם מוצג
browser_fill → שדה שם/הערה: "<script>document.title='XSS'</script>"
browser_click → שמור
browser_navigate → דף שמציג את הנתון
browser_evaluate → "document.title" 
// צפוי: "XSS" לא מופיע → React מ-escape
// מסוכן: document.title === 'XSS'!

// Reflected XSS דרך URL
browser_navigate → "[URL]?search=<img src=x onerror=alert(1)>"
browser_console_messages → האם יש JS execution?

// SQL Injection דרך form
browser_fill → שדה חיפוש: "'; DROP TABLE customers; --"
browser_fill → שדה חיפוש: "' OR '1'='1"
browser_console_messages → האם יש DB error?
// Supabase + ORM → בדרך כלל מוגן, אבל נוודא

// Open Redirect
browser_navigate → "[URL]/login?next=https://evil.com"
// אחרי login — לאן מפנה?
// צפוי: /dashboard
// מסוכן: https://evil.com
```



בדיקת עמידות המערכת בפני הזרקות קוד, שינוי נתיבים ופענוח קלטים שגוי בשרת ובדפדפן.

## תחומי בדיקה ואחריות

### 1. Cross-Site Scripting (XSS)
- [ ] **Stored XSS**: האם קלט מסוכן המוכנס לשדות (כמו שם משתמש, הערות, תיאור מוצר) נשמר בבסיס הנתונים ומוצג למשתמשים אחרים ללא סניטציה או escaping (הרצה של סקריפט)?
- [ ] **Reflected XSS**: האם המערכת משקפת פרמטרים מה-URL (למשל פרמטרי חיפוש או שגיאות) ישירות לתוך ה-DOM ללא סינון?
- [ ] **DOM-based XSS**: האם סקריפטים ב-Client Side משתמשים במקורות לא בטוחים (כמו `location.search`, `document.referrer`) ומעבירים אותם ל-Sinks מסוכנים (כמו `element.innerHTML`, `eval()`, `document.write()`)?

### 2. SQL Injection (SQLi)
- [ ] **שאילתות דינמיות**: האם השרת מבצע שאילתות SQL ישירות על בסיס נתוני משתמש ללא שימוש ב-Prepared Statements / Parameterized Queries?
- [ ] **חשיפת שגיאות**: האם הזנת תווים מיוחדים (כמו `'`, `"`, `--`) גורמת לשגיאות מסד נתונים מפורטות החושפות את מבנה הנתונים (Error-based SQLi)?

### 3. Path Traversal & LFI
- [ ] **Path Traversal**: האם נתיבי קבצים או בקשות הורדה (כמו `/api/download?file=logo.png`) מאפשרים שימוש בתווים יחסיים (כמו `../` או `..\`) כדי לקרוא קבצי מערכת רגישים (כמו `etc/passwd` או קבצי קונפיגורציה)?

### 4. Template & Server-Side Injections
- [ ] **SSTI (Server-Side Template Injection)**: האם השרת משתמש במנוע תבניות (כמו Twig, Jinja2, EJS) ומאפשר הרצת קוד שרת על ידי הזנת ביטויים מתמטיים או פקודות (כמו `${7*7}`)?
- [ ] **HTML Injection**: האם משתמשים יכולים להזריק תגיות HTML מעוצבות או קישורים זדוניים לתוך הודעות או ממשק המערכת?

### 5. Client-Side & Parameters
- [ ] **HTTP Parameter Pollution (HPP)**: האם שליחת פרמטר כפול בבקשה גורמת לשרת להתנהג בצורה לא צפויה?
- [ ] **Open Redirect**: האם פרמטרי הפניה (כמו `?next=/dashboard`) מאפשרים להפנות את המשתמש לדומיין חיצוני זדוני ללא בדיקת whitelist של הדומיינים המורשים?
