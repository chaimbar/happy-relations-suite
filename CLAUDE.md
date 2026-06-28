# CRM הלל מאן — פרוטוקול ניהול פרויקט

> **CRITICAL RULE (JIT Context):**
> לפני כל פעולה: (1) זהה את הדומיין לפי בקשת המשתמש. (2) קרא את פרופיל העובד הרלוונטי מהטבלה למטה. (3) רק אז תמשיך. תקשר עם המשתמש **בעברית** תמיד.

> **COMMUNICATION MODE (caveman / ultra):**
> בפרויקט זה ענה תמיד במצב `caveman` ברמת `ultra` (ראה skill `caveman`) — דחוס מקסימלי, כל המהות הטכנית נשמרת.
> חריגים: (1) אם המשתמש מבקש פירוט/הסבר/"תפרט" — ענה רגיל ומלא. (2) חריגי Auto-Clarity של הסקיל (אזהרות אבטחה, פעולות הרסניות, רצף רב-שלבי שעלול להשתמע לא נכון) — שם כתוב רגיל. הדחיסות לא פוגעת בעברית התקנית של ההודעות.

---

## פרטי פרויקט

- **שם הלקוח:** הלל מאן
- **ריפו GitHub:** https://github.com/chaimbar/happy-relations-suite (Private)
- **Lovable:** https://lovable.dev/projects/1fa0979b-c623-4313-8f44-f26086c9d604
- **ענף עיקרי:** `main`
- **תיקיית עבודה בשרת:** `/srv/projects/workforce-crm` (גישה דרך VS Code Remote-SSH ל-`dona-server`)

---

## ארכיטקטורה — מסדי נתונים ופריסה (חשוב!)

**זרימת פריסה (קוד):** עורכים כאן → `git commit` → `git push origin main` → **Lovable בונה ופורס אוטומטית** לאתר החי `himelech.crmbizflow.online` (~1-2 דק'). השרת הזה מריץ רק עותק dev מקומי (PM2 `workforce-crm`, פורט 4600) — הוא **לא** מארח את האתר הציבורי.

**שני מסדי נתונים (Supabase):**
- 🟢 **חי (פרודקשן):** פרויקט `hozkrgoxtkcwnzsjnpuj` — מנוהל ע"י **Lovable Cloud**, נגיש **רק** דרך Lovable → Cloud → **SQL editor** (אין connection string חיצוני, ה-service_role לא חשוף). ⚠️ קובץ `.env` שב-repo מצביע על DB ישן (`goyxe...`) והוא **מטעה** — Lovable מזריק env משלו. אל תסתמך על `.env`.
- 🔵 **גיבוי:** פרויקט `goyxefoioaphbomplsmq` (Supabase של המשתמש, חשבון eli) — מקבל **גיבוי יומי אוטומטי ב-03:00** מה-DB החי דרך `pg_cron`+`dblink` (פונקציה `backup_to_goyxe()` שהוגדרה ב-SQL editor).

**איפה עושים מה:**
- שינוי **קוד/עיצוב** → כאן (VS Code/Claude Code) → push → Lovable.
- שינוי **סכמת DB** → דרך Lovable (SQL editor או בקשה ל-Lovable). לא מהקבצים כאן.
- **סודות** (סיסמאות DB, tokens) → ב-`/srv/backups/workforce-crm/` (מחוץ ל-repo) וב-`~/.git-credentials`. **לעולם לא** לחייב `.env` או סודות ל-git.

---

## SESSION DISCIPLINE

**One session = one task.**
משימה אחת לשיחה. ברגע שהמשימה הושלמה — השיחה נגמרת.

---

## TASK COMPLETION & AUTO-LOGGING

לאחר השלמת המשימה:
1. **APPEND** שורה ל-`changelog.md` (אל תקרא — רק הוסף).
2. **APPEND** שורה ל-`מוח/activity-log.md` עם תאריך + תיאור הפעולה (אל תקרא — רק הוסף).
3. אם הפעולה שינתה מצב הפרויקט — **עדכן** `מוח/project-state.md`.
4. **APPEND** רעיונות שעלו ל-`backlog.md`.
5. בסוף הפלט, כתוב בדיוק:
   > "✅ המשימה הושלמה והיומן עודכן. **נא לסגור את הצ'אט הזה ולפתוח אחד חדש** כדי לשמור על הקשר נקי."

> **אוטו-פוש:** Stop hook מוגדר — כל סיום סשן דוחף אוטומטית לגיטהב.

---

## JIT ROUTING TABLE

| Trigger / Task Domain | Worker | Role | Profile File |
|---|---|---|---|
| `/build-crm` `/build-figma` / בניית פיצ'רים | רן | CRM CTO | `.claude/עובדים/רן - CTO CRM/profile.md` |
| `/crm-spec` `/figma-spec` / ניתוח דרישות | ריבה | CRM Analyst | `.claude/עובדים/ריבה - CRM Analyst/profile.md` |
| `/crm-ux` `/figma-layout` / עיצוב UX | עידו | CRM UX | `.claude/עובדים/עידו - CRM UX Architect/profile.md` |
| `/crm-build-prompt` `/figma-codegen` / קוד Full Stack | בן | Full Stack Dev | `.claude/עובדים/בן - CRM Build Prompt/profile.md` |
| `/crm-deploy` / דפלוי ו-GitHub | טל | Deployment | `.claude/עובדים/טל - CRM Deployment/profile.md` |
| `/qa` `/figma-qa` / בדיקות | יואב | QA Engineer | `.claude/עובדים/יואב - QA פונקציונלי/profile.md` |
| `/security-audit` / אבטחה | גיא | Security CTO | `.claude/עובדים/גיא - אבטחת מידע/profile.md` |
| `/workflow` / תהליכי עבודה | דן | Workflow Manager | `.claude/עובדים/דן - מנהל זרימת עבודה/profile.md` |
| `/make` / אוטומציות Make.com | יובל | Make Automation | `.claude/עובדים/יובל - Make Automation/profile.md` |
| `/improve` `/team-review` / שיפור | ניר | QA & Improvement | `.claude/עובדים/ניר - שיפור עובדים/profile.md` |

---

## GitHub WORKFLOW

```bash
# בדיקת סטטוס
git status

# עדכון מה-Lovable
git pull origin main

# Push אחרי שינויים מקומיים
git add .
git commit -m "תיאור השינוי"
git push origin main
```

---

## CREDIT RULE

- אל תסרוק תיקיות שלמות
- טען רק את פרופיל העובד הרלוונטי
- אל תקרא changelog אלא אם נדרש
