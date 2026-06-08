# מצב פרויקט CRM הלל מאן
עדכון אחרון: 2026-06-08

## סטטוס: בניית תשתית הושלמה — ממתין לאישור migration

---

## מה עובד (push לגיטהב commit d2b0c6b)

| מסך | סטטוס |
|---|---|
| Auth (magic link + password) | קוד מוכן |
| דשבורד (KPI אמיתיים) | קוד מוכן |
| עובדים (CRUD + חיפוש) | קוד מוכן |
| לקוחות (CRUD + חיפוש) | קוד מוכן |
| אתרים (CRUD + חיפוש) | קוד מוכן |
| שיבוץ יומי (יומן שבועי) | קוד מוכן |
| תשלומים (לפי לקוח + אתר) | קוד מוכן |
| רווחיות (גרפים + טבלה) | קוד מוכן |

## MIGRATION — פעולה אחת נדרשת

קובץ SQL קיים בריפו: supabase/migrations/20260608120000_assignments_stages_materials_payments_salaries.sql
טרם הוחל על DB — דורש אישור ידני.

פרויקט Supabase: goyxefoioaphbomplsmq

## טבלאות DB

קיימות: profiles, user_roles, employees, clients, projects

ממתינות: assignments, project_stages, materials, payments, salaries, VIEW project_profitability

## GitHub
ריפו: https://github.com/chaimbar/happy-relations-suite
ענף: main
commit אחרון: d2b0c6b

## Lovable
https://lovable.dev/projects/1fa0979b-c623-4313-8f44-f26086c9d604
