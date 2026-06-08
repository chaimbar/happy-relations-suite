---
skill: quote
owner: נתן
saves-to: תוצרים מוגמרים/הצעות-מחיר/[לקוח]-[YYYY-MM-DD].html
reads: מוח/עסק/my-business.md · מוח/אנשים/[לקוח].md (אם קיים) · מוח/העדפות/Style.md
output-format: HTML (RTL, Heebo font, LinkEdge branding) — פתיחה בדפדפן → הדפסה ל-PDF
---

# סקיל: הצעת מחיר

## הפעלה
כשהמשתמש מריץ `/quote` או אומר "הכן הצעת מחיר ל..." / "צור הצעה ל..."

---

## שלב 1 — טעינת הקשר
1. קרא `מוח/עסק/my-business.md` — תמחור, שירותים, תנאים
2. בדוק אם קיים `מוח/אנשים/[שם-לקוח].md` — אם כן, קרא לפני שכותב
3. קרא `מוח/העדפות/Style.md` — טון הכתיבה של חיים

---

## שלב 2 — חשיבה עסקית לפני איסוף

לפני ששואלים — חשוב ברשימה פנימית:
- אילו אינטגרציות כנראה יידרשו? (וואטסאפ / Google / Stripe / SUMIT / Make)
- אילו הרשאות משתמשים קיימות? (מנהל / עובד / לקוח / ספק)
- אילו דוחות/דשבורדים נדרשים?
- אילו תהליכי אוטומציה בולטים?
- מה הדרישות הסמויות שהלקוח לא אמר במפורש?

זה עוזר לשאול שאלות חכמות ולא להחסיר דברים קריטיים.

---

## שלב 3 — איסוף מידע
שאל את חיים — **הכל בבת אחת**, לא שאלה-שאלה.
אם מידע חסר — הצג רשימת שאלות הבהרה לפני כתיבת ההצעה.

```
שם לקוח / חברה:
תיאור הפרויקט (מה צריך):
סוג מערכת: CRM / בוט וואטסאפ / אוטומציה / פורטל / SaaS / אחר:
מודולים עיקריים (אם ידוע):
אינטגרציות נדרשות:
הרשאות משתמשים (מי משתמש במערכת):
תקציב משוער (אם ידוע):
דדליין / דחיפות:
משהו מיוחד שחשוב לציין:
```

---

## שלב 4 — כתיבת ההצעה (HTML)

צור קובץ HTML עם המבנה והסגנון הבאים:

### תבנית HTML בסיסית (חובה בכל הצעה):

```html
<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>הצעת מחיר — [שם לקוח]</title>
<link href="https://fonts.googleapis.com/css2?family=Heebo:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: 'Heebo', sans-serif;
    direction: rtl;
    background: #f4f6f9;
    color: #1a2e44;
    font-size: 15px;
    line-height: 1.7;
  }
  .page {
    max-width: 900px;
    margin: 40px auto;
    background: #fff;
    border-radius: 16px;
    overflow: hidden;
    box-shadow: 0 4px 30px rgba(0,0,0,0.08);
  }

  /* HEADER */
  .header {
    background: linear-gradient(135deg, #0d2137 0%, #1a4a6e 60%, #00c2cb 100%);
    padding: 40px 50px 35px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .header-logo img {
    height: 60px;
    filter: brightness(0) invert(1);
  }
  .header-meta {
    text-align: left;
    color: rgba(255,255,255,0.85);
    font-size: 13px;
    line-height: 1.9;
  }
  .header-meta strong { color: #fff; font-size: 14px; }
  .quote-number {
    display: inline-block;
    background: rgba(255,255,255,0.15);
    color: #fff;
    padding: 4px 14px;
    border-radius: 20px;
    font-size: 12px;
    margin-top: 6px;
    letter-spacing: 1px;
  }

  /* CLIENT BANNER */
  .client-banner {
    background: #f0fafa;
    border-right: 5px solid #00c2cb;
    padding: 18px 50px;
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .client-banner .label { color: #888; font-size: 12px; font-weight: 500; }
  .client-banner .name { font-size: 18px; font-weight: 700; color: #0d2137; }

  /* CONTENT */
  .content { padding: 40px 50px; }

  /* SECTION */
  .section { margin-bottom: 38px; }
  .section-title {
    font-size: 17px;
    font-weight: 700;
    color: #0d2137;
    border-bottom: 2px solid #00c2cb;
    padding-bottom: 8px;
    margin-bottom: 16px;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .section-title .icon { font-size: 20px; }

  p { margin-bottom: 10px; color: #3a4a5c; }

  /* BULLET LIST */
  ul.styled {
    list-style: none;
    padding: 0;
  }
  ul.styled li {
    padding: 7px 0 7px 0;
    border-bottom: 1px solid #f0f0f0;
    color: #3a4a5c;
    display: flex;
    align-items: flex-start;
    gap: 8px;
  }
  ul.styled li::before {
    content: "◆";
    color: #00c2cb;
    font-size: 10px;
    margin-top: 5px;
    flex-shrink: 0;
  }
  ul.styled.excluded li::before { color: #e05c5c; content: "✕"; font-size: 12px; }

  /* MODULE CARDS */
  .modules-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
    gap: 14px;
  }
  .module-card {
    background: #f8fbff;
    border: 1px solid #e0eaf4;
    border-radius: 10px;
    padding: 16px 18px;
  }
  .module-card h4 {
    font-size: 14px;
    font-weight: 700;
    color: #0d2137;
    margin-bottom: 8px;
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .module-card h4::before { content: "⬡"; color: #00c2cb; }
  .module-card ul { list-style: none; }
  .module-card ul li {
    font-size: 13px;
    color: #556;
    padding: 3px 0;
  }
  .module-card ul li::before { content: "· "; color: #00c2cb; }

  /* INTEGRATIONS */
  .integrations-list {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
  }
  .integration-tag {
    background: linear-gradient(135deg, #e8f7f8, #d0f0f2);
    border: 1px solid #b0e0e4;
    color: #0d6b72;
    padding: 6px 16px;
    border-radius: 20px;
    font-size: 13px;
    font-weight: 600;
  }

  /* PERMISSIONS TABLE */
  table {
    width: 100%;
    border-collapse: collapse;
    font-size: 14px;
  }
  thead tr { background: linear-gradient(135deg, #0d2137, #1a4a6e); color: #fff; }
  thead th { padding: 12px 16px; text-align: right; font-weight: 600; }
  tbody tr:nth-child(even) { background: #f8fbff; }
  tbody td { padding: 11px 16px; border-bottom: 1px solid #eee; color: #3a4a5c; }
  tbody td:first-child { font-weight: 600; color: #0d2137; }

  /* TIMELINE */
  .timeline { display: flex; flex-direction: column; gap: 0; }
  .timeline-item {
    display: flex;
    align-items: flex-start;
    gap: 16px;
    padding: 14px 0;
    border-bottom: 1px solid #f0f0f0;
  }
  .timeline-dot {
    width: 36px;
    height: 36px;
    background: linear-gradient(135deg, #0d2137, #00c2cb);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;
    font-size: 13px;
    font-weight: 700;
    flex-shrink: 0;
  }
  .timeline-text h4 { font-size: 14px; font-weight: 700; color: #0d2137; }
  .timeline-text p { font-size: 13px; color: #667; margin: 2px 0 0; }

  /* PRICING */
  .pricing-table { width: 100%; border-collapse: collapse; }
  .pricing-table th {
    background: linear-gradient(135deg, #0d2137, #1a4a6e);
    color: #fff;
    padding: 13px 20px;
    text-align: right;
    font-weight: 600;
  }
  .pricing-table td { padding: 13px 20px; border-bottom: 1px solid #eee; color: #3a4a5c; }
  .pricing-table tr:last-child td {
    background: linear-gradient(135deg, #e8f7f8, #d0f0f2);
    font-weight: 800;
    font-size: 16px;
    color: #0d2137;
    border-bottom: none;
  }
  .pricing-table tr:nth-child(even) td { background: #f8fbff; }

  /* PAYMENT TERMS */
  .payment-steps {
    display: flex;
    gap: 0;
    border: 1px solid #e0eaf4;
    border-radius: 10px;
    overflow: hidden;
  }
  .payment-step {
    flex: 1;
    padding: 18px 16px;
    text-align: center;
    border-left: 1px solid #e0eaf4;
  }
  .payment-step:last-child { border-left: none; }
  .payment-step .percent {
    font-size: 28px;
    font-weight: 800;
    color: #00c2cb;
    display: block;
  }
  .payment-step .when { font-size: 12px; color: #667; margin-top: 4px; }

  /* AI BADGE */
  .ai-badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    background: linear-gradient(135deg, #0d2137, #00c2cb);
    color: #fff;
    padding: 6px 16px;
    border-radius: 20px;
    font-size: 12px;
    font-weight: 600;
    margin-bottom: 16px;
  }

  /* FOOTER */
  .footer {
    background: #0d2137;
    color: rgba(255,255,255,0.7);
    text-align: center;
    padding: 24px;
    font-size: 13px;
    margin-top: 10px;
  }
  .footer strong { color: #00c2cb; }
  .validity {
    background: #fff8e6;
    border: 1px solid #f0d080;
    border-radius: 8px;
    padding: 12px 20px;
    font-size: 13px;
    color: #7a5c00;
    margin-bottom: 30px;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  /* PRINT */
  @media print {
    body { background: #fff; font-size: 13px; }
    .page { box-shadow: none; margin: 0; border-radius: 0; max-width: 100%; }
    .section { page-break-inside: avoid; }
    .header { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .payment-steps, .modules-grid { page-break-inside: avoid; }
  }
</style>
</head>
<body>
<div class="page">

  <!-- HEADER -->
  <div class="header">
    <div class="header-logo">
      <img src="../../פלט/assets/linkedge-logo.png" alt="LinkEdge" onerror="this.style.display='none'">
    </div>
    <div class="header-meta">
      <strong>חיים ברנשטיין | LinkEdge</strong><br>
      chaimb407@gmail.com<br>
      📅 [תאריך היום]<br>
      <span class="quote-number">הצעה מס׳ HB-[YYYY]-[NNN]</span>
    </div>
  </div>

  <!-- CLIENT BANNER -->
  <div class="client-banner">
    <div>
      <div class="label">מוגש עבור</div>
      <div class="name">[שם לקוח / חברה]</div>
    </div>
  </div>

  <div class="content">

    <!-- 1. תקציר הפרויקט -->
    <div class="section">
      <div class="section-title"><span class="icon">📋</span> תקציר הפרויקט</div>
      <span class="ai-badge">✦ נבנה בטכנולוגיית AI</span>
      <p>[תיאור קצר של המערכת — מה היא עושה, איזה בעיה היא פותרת, מי המשתמשים בה. 3-4 שורות בשפת הלקוח, לא ז'רגון טכני.]</p>
    </div>

    <!-- 2. מטרות המערכת -->
    <div class="section">
      <div class="section-title"><span class="icon">🎯</span> מטרות המערכת</div>
      <ul class="styled">
        <li>[מטרה 1 — ערך עסקי ברור]</li>
        <li>[מטרה 2]</li>
        <li>[מטרה 3]</li>
      </ul>
    </div>

    <!-- 3. מודולים -->
    <div class="section">
      <div class="section-title"><span class="icon">🧩</span> מודולים במערכת</div>
      <div class="modules-grid">
        <!-- חזור על module-card לכל מודול -->
        <div class="module-card">
          <h4>[שם מודול]</h4>
          <ul>
            <li>[פיצ'ר 1]</li>
            <li>[פיצ'ר 2]</li>
            <li>[פיצ'ר 3]</li>
          </ul>
        </div>
      </div>
    </div>

    <!-- 4. אינטגרציות -->
    <div class="section">
      <div class="section-title"><span class="icon">🔗</span> אינטגרציות</div>
      <div class="integrations-list">
        <!-- הוסף integration-tag לכל אינטגרציה רלוונטית -->
        <span class="integration-tag">WhatsApp</span>
        <span class="integration-tag">Google Calendar</span>
        <span class="integration-tag">Gmail</span>
        <span class="integration-tag">Make</span>
        <span class="integration-tag">Stripe</span>
        <span class="integration-tag">SUMIT</span>
      </div>
    </div>

    <!-- 5. הרשאות משתמשים -->
    <div class="section">
      <div class="section-title"><span class="icon">🔐</span> הרשאות משתמשים</div>
      <table>
        <thead>
          <tr><th>תפקיד</th><th>הרשאות עיקריות</th></tr>
        </thead>
        <tbody>
          <tr><td>מנהל מערכת</td><td>[מה הוא יכול]</td></tr>
          <tr><td>עובד</td><td>[מה הוא יכול]</td></tr>
          <tr><td>לקוח</td><td>[מה הוא יכול]</td></tr>
        </tbody>
      </table>
    </div>

    <!-- 6. דוחות ודשבורדים -->
    <div class="section">
      <div class="section-title"><span class="icon">📊</span> דוחות ודשבורדים</div>
      <ul class="styled">
        <li>[KPI / מדד 1]</li>
        <li>[גרף / סיכום 2]</li>
        <li>[דוח ביצועים 3]</li>
      </ul>
    </div>

    <!-- 7. שלבי עבודה -->
    <div class="section">
      <div class="section-title"><span class="icon">🗓️</span> שלבי עבודה</div>
      <div class="timeline">
        <div class="timeline-item">
          <div class="timeline-dot">1</div>
          <div class="timeline-text"><h4>אפיון</h4><p>[תיאור + משך זמן]</p></div>
        </div>
        <div class="timeline-item">
          <div class="timeline-dot">2</div>
          <div class="timeline-text"><h4>עיצוב</h4><p>[תיאור + משך זמן]</p></div>
        </div>
        <div class="timeline-item">
          <div class="timeline-dot">3</div>
          <div class="timeline-text"><h4>פיתוח</h4><p>[תיאור + משך זמן]</p></div>
        </div>
        <div class="timeline-item">
          <div class="timeline-dot">4</div>
          <div class="timeline-text"><h4>בדיקות</h4><p>[תיאור + משך זמן]</p></div>
        </div>
        <div class="timeline-item">
          <div class="timeline-dot">5</div>
          <div class="timeline-text"><h4>עלייה לאוויר</h4><p>[תיאור + משך זמן]</p></div>
        </div>
      </div>
    </div>

    <!-- 8. מה כלול -->
    <div class="section">
      <div class="section-title"><span class="icon">✅</span> מה כלול</div>
      <ul class="styled">
        <li>[פריט 1]</li>
        <li>[פריט 2]</li>
        <li>[פריט 3]</li>
      </ul>
    </div>

    <!-- 9. מה לא כלול -->
    <div class="section">
      <div class="section-title"><span class="icon">❌</span> מה לא כלול</div>
      <ul class="styled excluded">
        <li>שירותי פרסום ושיווק</li>
        <li>הזנת נתונים ראשונית</li>
        <li>רישיונות צד שלישי</li>
        <li>עלויות API חיצוניים</li>
        <li>שרתים חיצוניים</li>
        <li>[כל פריט ספציפי לפרויקט]</li>
      </ul>
    </div>

    <!-- 10. השקעה -->
    <div class="section">
      <div class="section-title"><span class="icon">💰</span> השקעה</div>
      <table class="pricing-table">
        <thead>
          <tr><th>רכיב</th><th>תיאור</th><th>מחיר</th></tr>
        </thead>
        <tbody>
          <tr><td>[שלב / רכיב 1]</td><td>[תיאור]</td><td>₪[X]</td></tr>
          <tr><td>[שלב / רכיב 2]</td><td>[תיאור]</td><td>₪[X]</td></tr>
          <tr><td>תחזוקה חודשית</td><td>[תיאור]</td><td>₪[X] / חודש</td></tr>
          <tr><td><strong>סה"כ הקמה</strong></td><td></td><td><strong>₪[סכום]</strong></td></tr>
        </tbody>
      </table>
    </div>

    <!-- תנאי תשלום -->
    <div class="section">
      <div class="section-title"><span class="icon">💳</span> תנאי תשלום</div>
      <div class="payment-steps">
        <div class="payment-step">
          <span class="percent">40%</span>
          <div class="when">מקדמה עם חתימה</div>
        </div>
        <div class="payment-step">
          <span class="percent">40%</span>
          <div class="when">עם דמו עובד</div>
        </div>
        <div class="payment-step">
          <span class="percent">20%</span>
          <div class="when">עם מסירה סופית</div>
        </div>
      </div>
    </div>

    <!-- תוקף ההצעה -->
    <div class="validity">
      ⏳ <span>הצעה זו בתוקף <strong>14 יום</strong> מתאריך הנפקתה. לשאלות — חיים זמין בכל עת.</span>
    </div>

  </div><!-- /content -->

  <div class="footer">
    <strong>LinkEdge</strong> · כשהכל מחובר — העסק עובד בשבילך<br>
    chaimb407@gmail.com
  </div>

</div><!-- /page -->
</body>
</html>
```

---

## שלב 5 — שמירה
שמור ל: `תוצרים מוגמרים/הצעות-מחיר/[שם-לקוח]-[YYYY-MM-DD].html`
צור את התיקייה אם לא קיימת.
אמור לחיים: "פתח את הקובץ בדפדפן → Ctrl+P → שמור כ-PDF"

---

## בדיקה עצמית (לפני הצגה)
- [ ] מספר הצעה כלול? (HB-YYYY-NNN)
- [ ] תמחור מיושר עם my-business.md?
- [ ] 10 סעיפים קיימים לפי המבנה?
- [ ] מודולים ספציפיים לפרויקט — לא גנריים?
- [ ] אינטגרציות רלוונטיות בלבד?
- [ ] הרשאות מפורטות לכל תפקיד?
- [ ] תנאי תשלום 40/40/20?
- [ ] "מה לא כלול" — לפחות 4 פריטים?
- [ ] AI badge מופיע בתקציר?
- [ ] הלוגו מצויין ב-header?
- [ ] נשמר ל-תוצרים מוגמרים/הצעות-מחיר/ כ-.html?

---

## למידה בזמן אמת

זיהוי: אם במהלך הביצוע המשתמש אמר:
**"שנה X"** / **"לא ככה"** / **"פעם הבאה..."** / **"יהיה יותר טוב אם"** / **"תזכור ש..."**

**כשמזהה הערה — בסוף המשימה, לפני הבדיקה העצמית:**
> "שמתי לב שהערת: *[ציטוט]*. האם לעדכן את הסקיל שלי לפי זה?"

אם כן → הפעל `/improve` עם ההקשר:
`"הערת שיפור ב-quote של נתן: [ציטוט]. [שלב רלוונטי אם ידוע]."`

ניר יציג before/after לאישורך — ורק אז מחיל.
