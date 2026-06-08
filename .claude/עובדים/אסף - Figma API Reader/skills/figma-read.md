---
skill: figma-read
owner: אסף
saves-to: תוצרים מוגמרים/Figma/[project-name]/01-spec.md
reads: מוח/עסק/my-business.md
---

# סקיל: קריאת Figma API ושליפת Design Tokens

## הפעלה
כשהמשתמש כותב `/figma-read [קישור פיגמה]`
או: "תשלוף לי את הדיזיין מפיגמה" / "תקרא את הפיגמה" / "תחבר לפיגמה"
או: כשרן שולח בריף עם Figma URL לפני שלב 1.

---

## שלב 0 — בדיקת פרטי גישה

לפני הכל, בדוק אם חיים מסר את שני הפרטים הבאים:
1. **Figma File URL** — קישור לקובץ פיגמה (מכיל `/file/` בתוכו)
2. **Figma Access Token** — טוקן אישי מ-Figma

אם חסר אחד מהם, הצג הוראה זו:

```
📋 אסף — נדרשים פרטי גישה

כדי שאוכל לקרוא את הפיגמה, אני צריך:

1. **Figma File URL** — הקישור לקובץ שלך בפיגמה
   (נראה כך: https://www.figma.com/file/XXXXXXXXX/שם-הפרויקט)

2. **Figma Personal Access Token** — איך מקבלים:
   א. היכנס ל-Figma
   ב. לחץ על תמונת הפרופיל (פינה שמאל עליונה)
   ג. Help and account → Account settings
   ד. גלול למטה לקטע "Personal access tokens"
   ה. לחץ "Generate new token"
   ו. תן לו שם (למשל "donna") ולחץ Generate
   ז. העתק את הטוקן — הוא יוצג פעם אחת בלבד!

שלח לי את שניהם ואני מתחיל.
```

---

## שלב 1 — שליפת File Key מה-URL

מה-URL `https://www.figma.com/file/XXXXXXXXXXX/שם-הפרויקט`, חלץ את ה-File Key:
- הסטרינג בין `/file/` לבין `/` הבא — זה ה-`FILE_KEY`.

---

## שלב 2 — קריאת ה-API

הרץ את הפקודה הבאה (Bash):

```bash
curl -H "X-Figma-Token: [ACCESS_TOKEN]" \
  "https://api.figma.com/v1/files/[FILE_KEY]" \
  -o figma-raw.json
```

לאחר מכן, שלוף את הצבעים, פונטים ורכיבים:

```bash
# שליפת כל הצבעים מה-JSON
cat figma-raw.json | python3 -c "
import json, sys

data = json.load(sys.stdin)
colors = set()
fonts = set()

def extract(node):
    if isinstance(node, dict):
        # חילוץ צבעים
        if 'fills' in node:
            for fill in node['fills']:
                if fill.get('type') == 'SOLID' and 'color' in fill:
                    c = fill['color']
                    r,g,b = int(c['r']*255), int(c['g']*255), int(c['b']*255)
                    colors.add(f'#{r:02X}{g:02X}{b:02X}')
        # חילוץ פונטים
        if 'style' in node and 'fontFamily' in node.get('style', {}):
            s = node['style']
            fonts.add(f\"{s['fontFamily']} | {s.get('fontSize','?')}px | weight {s.get('fontWeight','?')}\")
        for v in node.values():
            extract(v)
    elif isinstance(node, list):
        for i in node:
            extract(i)

extract(data)
print('=== COLORS ===')
for c in sorted(colors): print(c)
print()
print('=== FONTS ===')
for f in sorted(fonts): print(f)
"
```

---

## שלב 3 — בניית Design Spec

על בסיס הנתונים שנשלפו, בנה את `01-spec.md`:

```markdown
# אפיון עיצוב (Design Spec) — [project-name]
📅 [תאריך] | אסף — נשלף מ-Figma API (לא ניחוש)

## מקור הנתונים
- Figma File: [שם הקובץ]
- File Key: [FILE_KEY]
- שולף ב: [תאריך + שעה]

## 1. צבעים (Color Palette) — ערכים מדויקים
| שם מוצע | HEX | שימוש ב-Figma |
|---|---|---|
| Primary | `#XXXXXX` | [שם הלייר / שימוש שזוהה] |
| Secondary | `#XXXXXX` | |
| Background | `#XXXXXX` | |
| Text | `#XXXXXX` | |
| Muted | `#XXXXXX` | |

> ⚠️ אם הפיגמה מכילה יותר מ-10 צבעים — מוצגים רק הנפוצים ביותר.

## 2. טיפוגרפיה (Typography) — ערכים מדויקים
| סוג | גופן | גודל | משקל | Line Height |
|---|---|---|---|---|
| H1 | `[שם גופן]` | `Xpx` | `X00` | `X` |
| H2 | | | | |
| Body | | | | |
| Small | | | | |

## 3. מרווחים ועיגול פינות (מהנפוצים ב-JSON)
- **Border Radius:** `Xpx`
- **Padding נפוץ:** `Xpx`
- **Gap בין אלמנטים:** `Xpx`

## 4. רכיבים שזוהו (Frames ברמה עליונה)
| שם Frame | סוג מוצע | הערות |
|---|---|---|
| [שם] | Hero / Card / Navbar / Footer | |

## 5. נכסים לייצוא
- [ ] אייקונים (זוהו / לא זוהו)
- [ ] תמונות רקע
- [ ] לוגו
```

שמור ל: `תוצרים מוגמרים/Figma/[project-name]/01-spec.md`

---

## שלב 3.5 — העשרת ה-Spec עם השראה (magic MCP)

אחרי שליפת הנתונים, אם חסרים פרטי עיצוב (למשל אין צבעים ברורים, או פונט לא זוהה):

```
1. קרא magic MCP: 21st_magic_component_inspiration
   שאילתה: "[סוג הממשק — dashboard / CRM / landing] Hebrew RTL"

2. ציין בה-spec:
   "⚠️ [שדה] לא זוהה בפיגמה — הצעה מ-21st.dev: [ערך]"

3. סמן בבירור: ערכים מ-Figma API (מדויקים) vs הצעות מ-21st.dev (לבדיקה)
```

---

## שלב 4 — דיווח לרן / חיים

```
✅ אסף סיים — Design Spec מוכן

📁 נשמר: תוצרים מוגמרים/Figma/[project-name]/01-spec.md

מה נשלף:
- [X] צבעים מדויקים
- [X] פונטים + גדלים + משקלים
- [X] רכיבים ראשיים שזוהו
- [X] מרווחים נפוצים

הבא בתור: בן (/figma-codegen) — יכול לכתוב קוד מיידית מהנתונים האלה.
```

---

## טיפול בשגיאות — מלא

| שגיאה | סיבה | פעולה |
|---|---|---|
| 403 | טוקן לא תקין / פג תוקף | "הטוקן לא עובד. צור טוקן חדש ב-Figma (פרופיל → Account Settings → Personal Access Tokens)" |
| 404 | File Key שגוי | "ה-URL לא תקין. ודא שה-URL מכיל `/file/` או `/design/` ושיש לך גישה לקובץ" |
| 429 | Rate limit | "Figma הגביל בקשות. ממתין 60 שניות ומנסה שוב." → sleep 60 → retry |
| קובץ >5MB | קובץ גדול מדי | שלוף רק Frame ספציפי (ראה למטה) |
| Python לא מותקן | סביבה | השתמש ב-jq במקום: `cat figma-raw.json \| jq '[.. \| .fills? // empty \| .[] \| select(.type=="SOLID") \| .color]'` |
| אין גישה לקובץ | הרשאות Figma | "הקובץ פרטי. בקש מהמעצב לשתף אותך, או שיספק Export של ה-JSON" |

**שליפת Frame ספציפי (לקבצים גדולים):**
```bash
# שלב א — שלוף רשימת Frames
curl -H "X-Figma-Token: [TOKEN]" \
  "https://api.figma.com/v1/files/[FILE_KEY]?depth=1" | \
  python3 -c "import json,sys; data=json.load(sys.stdin); [print(f\"{c['id']} | {c['name']}\") for c in data['document']['children'][0].get('children',[])]"

# שלב ב — שלוף רק ה-Frame שצריך
curl -H "X-Figma-Token: [TOKEN]" \
  "https://api.figma.com/v1/files/[FILE_KEY]/nodes?ids=[NODE_ID]"
```

**Figma URL מסוג `/design/` (החדש):** עובד אותו דבר, רק חלץ את ה-key מאחרי `/design/`.

---

## בדיקה עצמית של אסף

- [ ] קיבלתי Figma URL + Access Token לפני שהתחלתי?
- [ ] חילצתי File Key נכון מה-URL?
- [ ] ה-API החזיר תגובה תקינה (לא 403/404)?
- [ ] כל הצבעים הם ערכי HEX מדויקים (לא "כחול כהה")?
- [ ] הפונטים כוללים שם, גודל ומשקל?
- [ ] הקובץ נשמר ב-`תוצרים מוגמרים/Figma/[project-name]/01-spec.md`?
- [ ] דיווחתי לרן / חיים שניתן להמשיך לבן?
