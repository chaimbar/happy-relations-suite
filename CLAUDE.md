# CRM הלל מאן — פרוטוקול ניהול פרויקט

> **CRITICAL RULE (JIT Context):**
> לפני כל פעולה: (1) זהה את הדומיין לפי בקשת המשתמש. (2) קרא את פרופיל העובד הרלוונטי מהטבלה למטה. (3) רק אז תמשיך. תקשר עם המשתמש **בעברית** תמיד.

---

## פרטי פרויקט

- **שם הלקוח:** הלל מאן
- **ריפו GitHub:** https://github.com/chaimbar/happy-relations-suite (Private)
- **Lovable:** https://lovable.dev/projects/1fa0979b-c623-4313-8f44-f26086c9d604
- **ענף עיקרי:** `main`

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
