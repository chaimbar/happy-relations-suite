# לוג פעולות — CRM הלל מאן

> כל פעולה שמבוצעת בפרויקט נרשמת כאן. מסודר מהחדש לישן.

---

## 2026-06-08

- הקמת תשתית גיט: `git init` + חיבור לריפו `happy-relations-suite`
- יצירת תיקיית `מוח/` עם אינדקס ולוג פעולות
- הגדרת Stop hook ב-`.claude/settings.json` לאוטו-פוש לגיטהב בכל סיום סשן
- יצירת סקריפט `.claude/git-autopush.ps1`
## 2026-06-08 — סרקתי קוד קיים, נוצר crm-spec.json עם ניתוח done/missing לכל מודול
## 2026-06-08 — pipeline: ריבה(SQL) + בן(3 דפים חדשים + dashboard + sidebar) + יואב(QA) + 2 commits pushed
2026-06-08 — פרסום מלא ל-Lovable + Update לפרודקשן. 3 מסכים חדשים: שיבוץ יומי, תשלומים, רווחיות. האתר חי: himelech.crmbizflow.online
2026-06-08 — employees tab rebuilt with full feature set: KPIs, filter pills, detail sheet, salary + assignment history, CSV export
2026-06-08 — שדרוג מקיף טאב עובדים: תיקון 9 באגים קריטיים בשמות עמודות/טבלאות, שיפור ביצועים, 3 custom hooks, תצוגת רשימה, sort, סינון סוג העסקה, job_title, ותק, סטטוס תשלום שכר
2026-06-08 20:06 — Production deployment: Supabase migration הורץ (job_title, employment_type, start_date, monthly_cost_actual, is_paid, indexes) + GitHub push (502cb83) + Lovable published → himelech.crmbizflow.online
2026-06-08 — feat(projects): UX audit — אתרים tab improvements

- [2026-06-08] UX Audit tab employees: fixed 11 UX issues - retry button, tel links, CSV label, destructive delete, discoverability
2026-06-08 22:42 | Spec Compliance Audit מלא — Overall 62% | 1 P0, 11 P1, 6 P2 | GAP-012 קריטי: DB schema חסר עמודות עובד
2026-06-08 22:55 | GAP-011/012/013 Schema Fix — types.ts + employees.tsx מסונכרנים עם DB האמיתי (Lovable). תוקנו: salary_records, assignments, employees, enums.
2026-06-09 — תוקן scheduling.tsx: החלפת כל קריאות DB שגויות לסכמה הנכונה. push לגיטהב.
2026-06-09 — סשן 2: financial module + types.ts rewrite + views migration. push לגיטהב.
2026-06-09 — GAP-007/018/023: Client financial analytics on card + payments by site expandable + advanced filters (status chips + client dropdown). push לגיטהב.

2026-06-09 — Security: הוחלה מיגרציה 20260609003000 — GAP-014 (team_manager isolation), GAP-003 (audit triggers), GAP-002 (notification_queue + Edge Function)
2026-06-09 — מימוש מלא מודול שיבוצים: 4 views, drag&drop, color coding, filters, double detection
2026-06-09 Owner Dashboard שדרוג: Smart Alerts strip + גבייה חודשית + רווח נקי+מרווח% + פעולות מומלצות דינמיות (עד 5 פריטים, צבוע לפי דחיפות) + empty states עם CTA
2026-06-09 — תיקון הרשאות אדמין: profiles.role עודכן ל-admin + use-auth race condition תוקן

- 2026-06-09 — feat: self-service change-password for all roles (change-password-dialog.tsx + sidebar button)
- 2026-06-09 22:0x | QA+אבטחה: זוהה ותוקן באג 'מוח כפול' בתפקידים (RLS לפי profiles.role מול user_roles בפרונט). edge functions admin-create-user/admin-delete-user פרוסים. נוצרו 3 משתמשי בדיקה (test-*@crmtest.local / Test1234!).
2026-06-09 — נבנה סימולטור תמחור: migration pricing_scenarios (RLS admin/manager + audit trigger), דף חדש pricing-simulator.tsx עם 2 טאבים (ימי-עבודה/שלבים), חישוב buffer היסטורי, שמירת תרחישים, ניווט בסיידבר.

- 2026-06-09 | הפעלת התראות תשלום (Resend) + צ׳ק-אין נוכחות ציבורי + סגירת מדיניות INSERT ציבורית ב-check_ins.

- 2026-06-09 | מסך נוכחות חדש בתפריט הניהול — דוח כל הצ׳ק-אינים מ-check_ins.
