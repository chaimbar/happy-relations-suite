

2026-06-08 — הקמת תשתית מוח + Stop hook לאוטו-פוש GitHub בכל סשן## 2026-06-08 — ניתוח מצב + JSON spec מלא + חלוקת עבודה לעובדים
## 2026-06-08 — בנייה מלאה: שיבוץ + תשלומים + רווחיות + דשבורד + migration SQL + QA pass
2026-06-08 — פרסום גרסה חדשה ל-Lovable: הוספת מסכי שיבוץ יומי, תשלומים, רווחיות + תיקוני QA + migration DB. אתר חי ב-himelech.crmbizflow.online
2026-06-08 — employees tab: full rebuild — KPI strip (4 cards), filter pills, CSV export, detail Sheet with 3 tabs (פרטים/שיבוצים/שכר), salary add/delete, assignment history with totals

2026-06-08 — employees.tsx: שדרוג מקיף — תיקון 9 באגים קריטיים (שמות עמודות/טבלאות), performance (useMemo/useCallback/memo), 3 custom hooks, sort+view-toggle, job_title/employment_type/start_date, salary is_paid
2026-06-08 — UX Audit טאב עובדים: תיקון נגישות מובייל (כפתורי עריכה/מחיקה), נקה סינון בפילטרים ו-empty state, ספירת תוצאות, timewatch_employee_id בטופס ובפרטים, אישור לפני מחיקת שכר, הסרת 'לחץ לפרטים' מכרטיסייה
2026-06-08 — ניהול משתמשים: טבלת user_roles + פונקציית get_all_users_for_admin + עמוד /users לאדמין בלבד + הוספת משתמשים + שינוי תפקיד + הסרת גישה + קישור בסיידבר
2026-06-08 — UX Audit טאב לקוחות: avatar initials צבעוניים, skeleton loading, טלפון/מייל כלינקים, count מסוננן, ולידציה בטופס, empty state משופר, tooltips לכפתורים, notes preview בכרטיס
2026-06-08 — feat(projects): UX audit on אתרים tab — skeleton loading, status filter chips, page header, smart empty states, RTL date fix, form price defaults

- [2026-06-08] ux(employees): UX audit - ErrorState retry button, tel links, CSV label fix, destructive delete styling, opacity-40 discoverability, EmptyState always shows Add button, salary min=1, removed dead code
## 2026-06-08 22:55 — Schema Sync (GAP-011/012/013)
- types.ts מסונכרן עם DB האמיתי: employees, assignments, salary_records, enums
- employees.tsx: תוקנו 6 שגיאות query/mutation (user_id, salary_records, shift_type, cost_estimated, sites)
- Migration file הוחלף ב-no-op documentation

2026-06-09 — P0 fix: scheduling.tsx — החלפת כל הפניות השגויות (projects/project_id/cost_snapshot/created_by/daily_cost_estimate) לסכמה הנכונה של DB החי (sites/site_id/cost_estimated/user_id/daily_cost_estimated). הדף שבור-runtime תוקן לחלוטין.
2026-06-09 — סשן 2: מודול פיננסי (GAP-005/008/010/019/024) — בניה מחדש של project_profitability view לטרגט sites, הוספת salary_site_allocation view, תיקון index.tsx (projects→sites), הרחבת ProfRow עם actual_labor_cost/actual_profit/labor_variance, כתיבה מחדש של types.ts עם כל הטבלאות הנכונות.
2026-06-09 — feat: Materials Management UI — /materials route עם CRUD מלא, סינון לפי אתר, סיכום תקציב vs בפועל, auto-sync sites.materials_cost — GAP-004/GAP-022
2026-06-09 — GAP-007/018/023: הוספת Client Analytics (סיכום פיננסי בכרטיס לקוח: אתרים/שולם/יתרה), Payments By Site (breakdown per project expandable), Advanced Search (status chips + client filter). clients.tsx + payments.tsx.

2026-06-09 — GAP-014/003/002: הוחלה מיגרציית אבטחה — RLS isolation למנהלי צוות, triggers ל-audit_logs על 7 טבלאות, notification_queue + Edge Function לשליחת מייל/ווטסאפ
2026-06-09 — שיבוצים מלא: GAP-001 Drag&Drop, GAP-009 Daily View, GAP-017 Site View, GAP-020 Employee View, GAP-026 Double Detection + Color Coding + Filters

2026-06-09 feat(dashboard): Owner Dashboard שדרוג — Smart Alerts, גבייה חודשית, רווח נקי+מרווח%, פעולות מומלצות דינמיות, empty states עם CTA
 — תיקון הרשאות אדמין: עדכון profiles.role ל-admin עבור chaimb407@gmail.com + תיקון race condition ב-useAuth (setLoading ממתין ל-fetchRoles)
2026-06-09 — תיקון הרשאות אדמין: עדכון profiles.role ל-admin עבור chaimb407@gmail.com + תיקון race condition ב-useAuth (setLoading ממתין ל-fetchRoles)
2026-06-09 - תיקון סכמה מלא: clients.tsx (full_name, client_balance), payments.tsx (כתיבה מחדש לסכמה האמיתית: site_id/amount/payment_method), materials.tsx (project_id->site_id, created_by->user_id), types.ts (כתיבה מחדש לפי DB אמיתי)

- 2026-06-09 — הוספת שינוי סיסמה עצמי לכל סוגי המשתמשים (כפתור בסייד-בר + דיאלוג, supabase.auth.updateUser)
2026-06-09 — תיקון חיבור Supabase: עדכון .env ו-config.toml מ-hozkrgoxtkcwnzsjnpuj לפרויקט הנכון goyxefoioaphbomplsmq, push לגיטהב commit 2ba794c
- 2026-06-09: אבטחה+RLS — תיקון 4 SECURITY DEFINER views, איחוד מערכת תפקידים ל-user_roles (מקור אמת יחיד), edge functions ליצירת/מחיקת משתמשים, בדיקות דפדפן חיות (admin+employee). נותר: פאבליש ב-Lovable + הקשחת חשיפת נתונים פיננסיים לעובד.
- פיצ'ר בונוס: סימולטור תמחור (/pricing-simulator) — מחשב מחיר מומלץ לפרויקט חדש לפי ימי-עבודה/שלבים + buffer מבוסס סטיית עלות היסטורית; טבלת pricing_scenarios עם RLS למנהלים.

- 2026-06-09 — הופעלה מערכת ההתראות (פריסת send-notification + חיווט מ-payments) + דף צ׳ק-אין ציבורי /checkin/:empId (submit_checkin) + סגירת חור RLS ציבורי ב-check_ins.

- 2026-06-09 — נוסף מסך "נוכחות" לתפריט (/attendance): טבלת צ׳ק-אין עם עובד/אתר/שעה/מיקום GPS + KPIs.
- 2026-06-09: שדרוג עיצוב פרימיום (scrollbar/glass/אנימציות/card-lift) + שיעור דשבורד וsidebar לפי תפקיד (עובד=מוגבל) + מצב לילה (toggle). ממתין ל-Publish ב-Lovable + QA דפדפן.
- 2026-06-09: פיצ'רי וואו — ⌘K Command Palette (ניווט מודע-תפקיד + toggle לילה) + גרף רווחיות אתרים בדשבורד (recharts, מנהלים). ממתין ל-Publish + QA.
- 2026-06-10: אודיט מוצר מול אפיון + מימוש P0/P1 — ייצוא Excel ב-8 מסכים (util משותף export-csv), טאב סיכום נוכחות חודשי (נוכחות מול שיבוץ + עלות), גלילה אופקית ללוח שיבוץ במובייל. build עובר, push בוצע.
- 2026-06-10: מסך היסטוריית פעולות (/activity-log, מנהלים) + שיוך עובד למנהל צוות (managed_by, אדמין) + migration לתיחום ישיר ותיקון מדיניות audit_logs. commit c4cad5d.
- 2026-06-25 — תיקון: כפתורי עריכה/מחיקה בכרטיס לקוח גלויים תמיד (לא רק ב-hover); תיקון אבטחה: views client_balance + site_profitability עם security_invoker.
- 2026-06-25: fix(sites) client_id NOT NULL + שדה לקוח חובה בטופס

- 2026-06-28 — כותרת דשבורד: "דשבורט טסט" → "דשבורד" (הסרת מילת טסט)
