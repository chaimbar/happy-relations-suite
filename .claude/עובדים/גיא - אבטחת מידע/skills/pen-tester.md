---
skill: pen-tester
owner: גיא
---

# סקיל: Penetration Testing — עם כלים אמיתיים

## כלל ברזל: כל בדיקה מורצת בפועל. לא צ'קליסטים תיאורטיים.

---

## שלב 1 — Recon (Playwright MCP)

```
browser_navigate → [URL]
browser_snapshot → מיפוי מלא של DOM
browser_network_requests → כל ה-API calls
browser_console_messages → שגיאות + info דלוף
browser_evaluate → "JSON.stringify(window.__NEXT_DATA__)" → meta data חשוף?
browser_evaluate → "JSON.stringify(localStorage)" → tokens חשופים?
```

**מה לחפש:**
- URL של Supabase ב-network requests
- JWT token ב-localStorage
- API keys ב-source
- Internal routes ב-`__NEXT_DATA__`

---

## שלב 2 — Auth Bypass (Playwright MCP)

```
// ניסיון גישה לדפים מוגנים ללא login
browser_navigate → /dashboard
// צפוי: redirect ל-/login
// מסוכן: טוען את הדף!

browser_navigate → /api/customers
// צפוי: {"error":"Unauthorized"}
// מסוכן: מחזיר נתונים!

// ניסיון עם JWT מזויף
browser_evaluate → `
  fetch('/api/customers', {
    headers: { 'Authorization': 'Bearer fake.invalid.jwt' }
  }).then(r => r.status)
`
// צפוי: 401
// מסוכן: 200!
```

---

## שלב 3 — IDOR (Playwright MCP + curl)

```bash
# התחבר כ-user_a, קבל JWT
# ואז נסה לגשת לנתוני user_b:

# קרא רשומה של user_b
curl -X GET "[URL]/api/customers/[user_b_record_id]" \
  -H "Authorization: Bearer [user_a_jwt]"
# צפוי: 403 / 404
# מסוכן: מחזיר נתוני user_b!

# עדכן רשומה של user_b
curl -X PATCH "[URL]/api/customers/[user_b_record_id]" \
  -H "Authorization: Bearer [user_a_jwt]" \
  -H "Content-Type: application/json" \
  -d '{"name": "HACKED"}'
# צפוי: 403
# מסוכן: 200 + עדכן!
```

---

## שלב 4 — XSS (Playwright MCP)

```
// ניסיון הזרקת XSS בשדות form
browser_fill → שדה שם: "<script>alert('XSS')</script>"
browser_fill → שדה חיפוש: "'; DROP TABLE customers; --"
browser_fill → שדה טקסט: "<img src=x onerror=alert(1)>"
browser_click → כפתור שמירה
browser_screenshot → האם ה-alert פרץ?
browser_console_messages → האם יש XSS execution?

// בדיקת reflected XSS דרך URL
browser_navigate → "[URL]/search?q=<script>alert(1)</script>"
browser_screenshot → האם הסקריפט מוצג?
```

---

## שלב 5 — File Upload

```
// ניסיון העלאת קובץ מסוכן
browser_fill → שדה upload: [קובץ test.html עם <script>alert(1)</script>]
// צפוי: שגיאה / rejection
// מסוכן: מקבל ושמור!

// בדיקת גישה ישירה לקבצים שהועלו
browser_navigate → "[Supabase Storage URL]/[bucket]/[filename]"
// צפוי: 403 אם bucket פרטי
// מסוכן: מציג קובץ!
```

---

## שלב 6 — Security Headers

```
browser_evaluate → `
  fetch(window.location.href).then(r => ({
    csp: r.headers.get('Content-Security-Policy'),
    hsts: r.headers.get('Strict-Transport-Security'),
    xframe: r.headers.get('X-Frame-Options'),
    xcontent: r.headers.get('X-Content-Type-Options')
  }))
`
```

**headers חובה:**
- `Content-Security-Policy` — מגן על XSS
- `X-Frame-Options: DENY` — מגן על Clickjacking
- `X-Content-Type-Options: nosniff`
- `Strict-Transport-Security` — HTTPS בלבד

---

## שלב 7 — Rate Limiting

```
// ניסיון brute force על login
browser_evaluate → `
  async function bruteForce() {
    for(let i = 0; i < 20; i++) {
      await fetch('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({email:'test@test.com', password: 'wrong'+i})
      });
    }
  }
  bruteForce();
`
// אחרי 10+ ניסיונות — האם חוסם? (429 Too Many Requests)
// Supabase Auth מטפל בזה אוטומטית — בדוק שהוא מופעל
```

---

## דירוג ממצאים

| ממצא | חומרה |
|---|---|
| Auth bypass — דפים מוגנים נגישים | 🔴 קריטי |
| IDOR מוצלח | 🔴 קריטי |
| XSS מוצלח | 🔴 קריטי |
| JWT לא מאומת ב-API | 🔴 קריטי |
| Service Role Key חשוף | 🔴 קריטי |
| חסרים security headers | 🟠 גבוה |
| Upload קבצים מסוכנים | 🟠 גבוה |
| אין rate limiting | 🟡 בינוני |
| Account enumeration | 🟡 בינוני |
