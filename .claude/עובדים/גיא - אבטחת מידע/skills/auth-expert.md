---
skill: auth-expert
owner: גיא
---

# סקיל: מומחה אימות משתמשים — בדיקות אמיתיות

**כלל:** כל בדיקה מורצת בפועל דרך Playwright MCP או curl. לא תיאורטי.

## בדיקות מעשיות (Playwright MCP)

```
// ניסיון גישה ישירה לאחר login ראשוני ללא MFA
browser_navigate → /dashboard (בלי לסיים auth)
// צפוי: redirect ל-login

// בדיקת session persistence
browser_navigate → /dashboard → browser_evaluate: "location.reload()"
// צפוי: עדיין מחובר

// ניסיון JWT מזויף
browser_evaluate → `
  fetch('/api/me', {
    headers: { Authorization: 'Bearer eyJhbGciOiJub25lIn0.eyJzdWIiOiJoYWNrZWQifQ.' }
  }).then(r => r.status)
`
// צפוי: 401

// בדיקת Rate Limiting על login
browser_evaluate → `
  Promise.all(Array(15).fill(0).map(() =>
    fetch('/api/auth/login', {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({email:'test@test.com',password:'wrong'})
    }).then(r => r.status)
  ))
`
// צפוי: אחרי ~10 ניסיונות → 429 Too Many Requests
```

## תחומי בדיקה ואחריות

### 1. JWT Analysis & Attacks
- [ ] **JWT Algorithm Confusion (RS256 ↔ HS256)**: האם ניתן לשנות את ה-Algorithm ל-HS256 ולחתום על ה-Token באמצעות ה-Public Key של השרת?
- [ ] **alg:none Attack**: האם השרת מקבל Token שבו שדה ה-`alg` מוגדר כ-`none` ללא אימות החתימה?
- [ ] **JWT Signature Verification**: האם השרת מוודא בפועל את חתימת ה-JWT מול ה-Secret הנכון בכל בקשה?
- [ ] **Expired Tokens**: האם השרת מקבל Tokens שפג תוקפם (`exp` time)?

### 2. Session Management
- [ ] **Session Hijacking**: האם מזהה ה-Session (Cookie או Token) מועבר בצורה לא מאובטחת או דולף ב-Referrer?
- [ ] **Session Fixation**: האם מזהה ה-Session נשאר זהה לפני ואחרי ההתחברות? (מאפשר לתוקף לקבוע מזהה מראש).
- [ ] **Cookie Security**: האם ה-Cookies של ה-Session מוגדרים עם הדגלים `Secure`, `HttpOnly` ו-`SameSite=Lax/Strict`?

### 3. OAuth & SSO (Google, Apple, Facebook)
- [ ] **OAuth CSRF**: האם משתמשים בפרמטר `state` בתהליך ה-OAuth כדי למנוע CSRF?
- [ ] **Redirect URI Bypass**: האם ניתן לשנות את ה-`redirect_uri` בתהליך ה-OAuth לכתובת חיצונית של תוקף כדי לגנוב את ה-authorization code?

### 4. חוזק אימות ואימות דו-שלבי (MFA)
- [ ] **MFA/OTP Bypass**: האם ניתן לעקוף את שלב ה-MFA (למשל על ידי גישה ישירה לראוטים פנימיים לאחר הזנת סיסמה ראשונית)?
- [ ] **Brute Force on OTP**: האם יש הגבלה (Rate Limiting) על מספר ניסיונות הזנת קוד ה-OTP / Magic Link?
- [ ] **Weak Password Policies**: האם המערכת מאפשרת להירשם עם סיסמאות נפוצות או קצרות מאוד (פחות מ-6 תווים)?

### 5. הרשמה וניהול יוזרים
- [ ] **Account Enumeration**: האם הודעות השגיאה בחיבור/שחזור סיסמה חושפות אם משתמש קיים במערכת (למשל "אימייל זה לא קיים במערכת" לעומת "פרטי התחברות שגויים")?
- [ ] **רישום פתוח**: האם המערכת פתוחה לרישום של כל אחד ללא אימות אימייל, מה שמאפשר ליצור אלפי יוזרים פיקטיביים?
