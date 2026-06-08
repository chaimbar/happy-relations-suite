# עובדים — Roster

> **כלל JIT:** קרא profile.md של עובד רק כשהבקשה דורשת אותו. לא לפני.
> זהה עובד → קרא profile שלו → הפעל את הסקיל שלו.

---

## רשימה פעילה

| שם | תפקיד | פקודה/ות | Profile |
|---|---|---|---|
| **דונה** | Chief of Staff | `/morning-briefing` `/evening-summary` `/weekly-report` `/tasks` `/prep-meeting` `/block-time` `/risks` `/learn` `/learn-me` `/ask-jay` | `.claude/donna-character.md` |
| **נתן** | הצעות מחיר | `/quote` | `.claude/עובדים/נתן - הצעות מחיר/profile.md` |
| **אורן** | תקשורת ומיילים | `/draft-reply` `/forgotten-emails` `/accountability` | `.claude/עובדים/אורן - מיילים/profile.md` |
| **עמית** | חשבונאי | `/invoice` | `.claude/עובדים/עמית - חשבונאי/profile.md` |
| **יואב** | QA פונקציונלי | `/qa` `/figma-qa` | `.claude/עובדים/יואב - QA פונקציונלי/profile.md` |
| **גיא** | CTO אבטחת מידע | `/security-audit` | `.claude/עובדים/גיא - אבטחת מידע/profile.md` |
| **עמרי** | תוכן ושיווק | `/content` `/business-one-pager` `/hebrew-video-tutorial` | `.claude/עובדים/עמרי - מנהל תוכן/profile.md` |
| **דן** | מנהל זרימת עבודה | `/workflow` | `.claude/עובדים/דן - מנהל זרימת עבודה/profile.md` |
| **ניר** | מנהל איכות צוות | `/improve` `/team-review` | `.claude/עובדים/ניר - שיפור עובדים/profile.md` |
| **אסף** | Figma API Reader | `/figma-read` | `.claude/עובדים/אסף - Figma API Reader/profile.md` |
| **רן** | CTO CRM | `/build-crm` `/build-figma` | `.claude/עובדים/רן - CTO CRM/profile.md` |
| **ריבה** | CRM Pattern Analyst | `/crm-spec` `/figma-spec` | `.claude/עובדים/ריבה - CRM Analyst/profile.md` |
| **עידו** | CRM UX/UI Architect | `/crm-ux` `/figma-layout` | `.claude/עובדים/עידו - CRM UX Architect/profile.md` |
| **בן** | Full Stack Developer — בניית קוד לוקאלי | `/crm-build-prompt` `/figma-codegen` | `.claude/עובדים/בן - CRM Build Prompt/profile.md` |
| **טל** | CRM Deployment Manager | `/crm-deploy` | `.claude/עובדים/טל - CRM Deployment/profile.md` |
| **יובל** | מומחה אוטומציות Make.com | `/make` | `.claude/עובדים/יובל - Make Automation/profile.md` |

---

## תוצרים מוגמרים — לאן שומרים

| עובד | תיקייה |
|---|---|
| נתן | `תוצרים מוגמרים/הצעות-מחיר/` |
| אורן | `תוצרים מוגמרים/טיוטות/` |
| עמית | `תוצרים מוגמרים/חשבוניות/` |
| יואב | `תוצרים מוגמרים/ביקורות/` |
| גיא | `תוצרים מוגמרים/ביקורות/` |
| עמרי | `תוצרים מוגמרים/תוכן/` |
| דונה | `מוח/יומן יומי/` + `תוצרים מוגמרים/דוחות/` |
| רן (Figma) | `תוצרים מוגמרים/Figma/` |
| אסף | `תוצרים מוגמרים/Figma/[project]/01-spec.md` |

---

## שמות פנויים לעובדים הבאים

גל · אריאל · עומר · תום · שי · אדם · לירון

---

## הוספת עובד חדש

הרץ `/new-employee` — דונה תיצור את כל המבנה אוטומטית:
`profile.md` + `skills/[skill].md` + command + עדכון Roster.
