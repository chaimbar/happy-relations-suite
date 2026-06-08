---
skill: hebrew-video-tutorial
owner: עמרי
saves-to: פלט/video-tutorials/[YYYY-MM-DD]-[system-name]/
tools: Playwright · FFmpeg · TTS API (Google/ElevenLabs/Azure) · Python
output: tutorial.mp4 + script.md + subtitles.srt
---

# סקיל: סרטון הדרכה בעברית

## הפעלה
`/hebrew-video-tutorial` — לפי דרישה

## עיקרון מרכזי

**5 שלבים בסדר קבוע:** הבנת המערכת → תסריט → צילום → קריינות → עריכה.
אל תדלג על שלב. הסרטון מוכן רק כשה-MP4 קיים.

---

## שלב 0 — גיוס מודיעין

שאל רק מה שחסר:

**אם ניתן URL:**
1. לאיזה קהל מיועד הסרטון? (לקוחות / צוות פנימי / הדרכה כללית)
2. אילו תכונות לכסות? (ברירת מחדל: הזרימות הראשיות)
3. פרטי כניסה לסביבת הדרכה (אם נדרש)
4. איזה ספק TTS? (ברירת מחדל: Google Cloud TTS → ElevenLabs כגיבוי)

**אם לא מגיבים תוך סיבוב אחד** — המשך עם ברירות מחדל.

---

## שלב 1 — ניתוח המערכת

פתח עם Playwright:
1. נווט לדף הבית → צלם screenshot
2. מפה את כל המסכים מהניווט הראשי
3. עבור על כל מסך ראשי → screenshot + רשום: שם, מה רואים, מה אפשר לעשות
4. זהה 3-5 זרימות מרכזיות
5. בדוק console errors

**פלט:** מפת מסכים + רשימת זרימות → המשך מיד לשלב 2.

---

## שלב 2 — תסריט הדרכה בעברית

### מבנה חובה

```
## 🎬 פתיח (15-20 שניות)
"ברוכים הבאים. בסרטון הזה נראה איך ל..."

## 📍 שלב 1 — [שם הזרימה]
**מה אנחנו רואים:** [תיאור המסך]
**מה אנחנו עושים:** [רצף פעולות: "לוחצים על...", "מזינים...", "בוחרים..."]
**הסבר:** [למה? מה זה עושה?]

[חזור לכל שלב/זרימה]

## 🎯 סיכום (10-15 שניות)
"בסרטון זה ראינו... אם יש שאלות..."
```

### כללי תסריט
- כתוב כמו שמדברים, לא כמו מסמך
- משפטים קצרים (עד 15 מילה)
- סה"כ אורך: 2-5 דקות
- שמור ב-`פלט/video-tutorials/[DATE]-[name]/script.md`

---

## שלב 3 — הכנת סביבת ייצור

בדוק שהכלים מותקנים:

```bash
ffmpeg -version
python --version
pip show pillow requests google-cloud-texttospeech
npx playwright --version
```

אם FFmpeg לא מותקן:
```bash
winget install FFmpeg
```

מבנה תיקיית פרויקט:
```
פלט/video-tutorials/[YYYY-MM-DD]-[system-name]/
├── screenshots/     ← צילומי מסך לכל שלב
├── recordings/      ← הקלטות מסך (webm)
├── audio/           ← קבצי קריינות (mp3)
├── script.md
├── subtitles.srt
└── tutorial.mp4
```

---

## שלב 4 — הקלטת מסך עם Playwright

```python
import asyncio
from playwright.async_api import async_playwright

async def record_tutorial(url, steps, output_dir):
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=False)
        context = await browser.new_context(
            viewport={"width": 1280, "height": 720},
            record_video_dir=f"{output_dir}/recordings",
            record_video_size={"width": 1280, "height": 720}
        )
        page = await context.new_page()
        current_time = 0

        for step in steps:
            if step["action"] == "navigate":
                await page.goto(step["target"])
            elif step["action"] == "click":
                await page.click(step["selector"])
            elif step["action"] == "fill":
                await page.fill(step["selector"], step["value"])
            elif step["action"] == "screenshot":
                await page.screenshot(path=f"{output_dir}/screenshots/{step['name']}.png")

            wait_ms = step.get("wait", 1000)
            await asyncio.sleep(wait_ms / 1000)
            current_time += wait_ms / 1000

        await context.close()
        await browser.close()
```

---

## שלב 5 — קריינות עברית (TTS)

| ספק | איכות עברית | מחיר | קלות |
|-----|------------|------|------|
| Google Cloud TTS | ⭐⭐⭐⭐ | נמוך ($4/מיליון תווים) | בינוני |
| ElevenLabs | ⭐⭐⭐⭐⭐ | בינוני ($5/חודש) | קל |
| Azure TTS | ⭐⭐⭐⭐ | נמוך ($1/מיליון תווים) | בינוני |

**Google Cloud TTS (מומלץ):**
```python
from google.cloud import texttospeech

def generate_voiceover(text, output_path):
    client = texttospeech.TextToSpeechClient()
    synthesis_input = texttospeech.SynthesisInput(text=text)
    voice = texttospeech.VoiceSelectionParams(
        language_code="he-IL",
        name="he-IL-Wavenet-A",
        ssml_gender=texttospeech.SsmlVoiceGender.MALE
    )
    audio_config = texttospeech.AudioConfig(
        audio_encoding=texttospeech.AudioEncoding.MP3,
        speaking_rate=0.95
    )
    response = client.synthesize_speech(
        input=synthesis_input, voice=voice, audio_config=audio_config
    )
    with open(output_path, "wb") as f:
        f.write(response.audio_content)
```

**Azure (he-IL-AvriNeural / he-IL-HilaNeural):**
```python
import azure.cognitiveservices.speech as speechsdk

config = speechsdk.SpeechConfig(
    subscription=os.environ["AZURE_SPEECH_KEY"],
    region=os.environ["AZURE_SPEECH_REGION"]
)
config.speech_synthesis_voice_name = "he-IL-AvriNeural"
```

---

## שלב 6 — כתוביות SRT

```python
def generate_srt(script_segments, audio_durations, output_path):
    srt_content = ""
    counter = 1
    current_time = 0.0

    for seg in script_segments:
        duration = audio_durations.get(seg["id"], 5.0)
        start = seconds_to_srt_time(current_time)
        end = seconds_to_srt_time(current_time + duration)
        srt_content += f"{counter}\n{start} --> {end}\n{seg['text']}\n\n"
        counter += 1
        current_time += duration

    with open(output_path, "w", encoding="utf-8") as f:
        f.write(srt_content)

def seconds_to_srt_time(s):
    h, m = int(s // 3600), int((s % 3600) // 60)
    return f"{h:02d}:{m:02d}:{int(s%60):02d},{int((s-int(s))*1000):03d}"
```

---

## שלב 7 — עריכה עם FFmpeg

```bash
# חיבור קטעי אודיו
ffmpeg -i "concat:audio/intro.mp3|audio/step1.mp3|audio/outro.mp3" -acodec copy audio/full_voiceover.mp3

# יצירת slideshow מ-screenshots (אם אין הקלטת וידאו)
ffmpeg -framerate 1/4 -pattern_type glob -i "screenshots/*.png" -c:v libx264 -r 30 -pix_fmt yuv420p video_base.mp4

# חיבור וידאו + קריינות
ffmpeg -i video_base.mp4 -i audio/full_voiceover.mp3 -c:v copy -c:a aac -shortest video_with_audio.mp4

# הוספת כתוביות
ffmpeg -i video_with_audio.mp4 -vf "subtitles=subtitles.srt" -c:a copy tutorial.mp4
```

---

## שלב 8 — שמירה ומסירה

דווח:
- 📁 מיקום הסרטון
- ⏱️ אורך הסרטון
- 📝 מספר שלבים שכוסו
- 🔊 ספק TTS שנוצל
- ⚠️ שלבים שנכשלו (אם יש)

---

## מקרים מיוחדים

- **המערכת דורשת כניסה** → השתמש בפרטי demo, לא בחשבון הבעלים
- **FFmpeg לא מותקן** → `winget install FFmpeg`, הפעל שוב אחרי
- **TTS API לא מוגדר** → הצע 3 אפשרויות וקישורים להגדרה
- **סרטון ארוך מ-7 דקות** → "ממליצה לחלק ל-2-3 סרטונים לפי נושא. רוצה שאעשה את זה?"
- **המערכת לא נגישה** → "תוכל לשלוח Screenshots ידניים ואכין מהם את הסרטון?"

---

## בדיקה עצמית (לפני מסירה)

- [ ] תסריט נכתב בעברית ברורה ושוטפת?
- [ ] כל מסך ראשי כוסה?
- [ ] צילומי מסך / הקלטה קיימים לכל שלב?
- [ ] קובץ אודיו נוצר לכל קטע?
- [ ] כתוביות SRT תקינות?
- [ ] tutorial.mp4 קיים ונפתח?
- [ ] אורך בין 2-5 דקות?
- [ ] שורת פתיחה + סיום בסגנון דונה?

---

## למידה בזמן אמת

זיהוי: אם במהלך הביצוע המשתמש אמר:
**"שנה X"** / **"לא ככה"** / **"פעם הבאה..."** / **"יהיה יותר טוב אם"** / **"תזכור ש..."**

**כשמזהה הערה — בסוף המשימה, לפני הבדיקה העצמית:**
> "שמתי לב שהערת: *[ציטוט]*. האם לעדכן את הסקיל שלי לפי זה?"

אם כן → הפעל `/improve` עם ההקשר:
`"הערת שיפור ב-hebrew-video-tutorial של עמרי: [ציטוט]. [שלב רלוונטי אם ידוע]."`

ניר יציג before/after לאישורך — ורק אז מחיל.
