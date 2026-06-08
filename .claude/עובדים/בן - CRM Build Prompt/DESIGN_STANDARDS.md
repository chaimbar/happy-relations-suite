# Standard קוד עיצוב — לפי crmbizflow.online
> עודכן: 2026-06-01 | נלמד מהמערכת הקיימת של חיים

## זה מה שחיים אוהב. בונה לפי זה. תמיד.

---

## globals.css — הגדרות בסיס

```css
@import url('https://fonts.googleapis.com/css2?family=Manrope:wght@300;400;500;600;700;800&display=swap');

@layer base {
  :root {
    --background: 210 14% 97%;        /* #F6F7F8 — לא לבן */
    --foreground: 215 28% 17%;        /* #1F2937 */
    --card: 0 0% 100%;
    --card-foreground: 215 28% 17%;
    --primary: 209 88% 50%;           /* #0F83F0 */
    --primary-foreground: 0 0% 100%;
    --muted: 210 14% 96%;
    --muted-foreground: 215 16% 47%;
    --border: 210 16% 91%;
    --radius: 1rem;                   /* 16px */
    --sidebar-bg: #101923;
  }
  
  body { font-family: 'Manrope', sans-serif; direction: rtl; }
}
```

---

## Sidebar — תמיד כהה

```tsx
// components/layout/Sidebar.tsx
<aside className="hidden md:flex flex-col w-64 min-h-screen"
  style={{ backgroundColor: '#101923' }}>
  
  {/* Logo */}
  <div className="p-6">
    <h1 className="text-white text-lg font-bold">ניהול אתרים</h1>
  </div>

  {/* Nav items */}
  <nav className="flex-1 p-3 space-y-1">
    {navItems.map(item => (
      <Link key={item.href} href={item.href}
        className={cn(
          "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
          isActive 
            ? "bg-[#1E2D3D] text-white"           // active: כהה יותר + לבן
            : "text-[#8B9BB4] hover:bg-[#1A2533] hover:text-white"  // inactive: אפור-כחול
        )}>
        <Icon className="h-4 w-4 shrink-0" />
        {item.label}
      </Link>
    ))}
  </nav>
</aside>
```

---

## Cards — 16px radius, ללא shadow, gradient קל

```tsx
// כרטיסייה סטנדרטית
<div className="bg-white rounded-2xl border border-border/50 p-4">
  {/* border/50 = שקוף למחצה */}
</div>

// כרטיסיית KPI עם gradient
<div className="bg-white rounded-2xl border border-border/50 p-4"
  style={{ background: 'linear-gradient(to right bottom, rgba(15,131,240,0.08), white)' }}>
  <p className="text-sm text-muted-foreground">{title}</p>
  <h3 className="text-3xl font-bold mt-1">{value}</h3>
  <p className="text-xs text-muted-foreground mt-1">{subText}</p>
</div>

// ❌ אסור: className="shadow-md" או "shadow-lg"
// ✅ מותר: border + gradient קל
```

---

## כפתורים — Gradient ראשי

```tsx
// Primary button — gradient
<button className="px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90"
  style={{ background: 'linear-gradient(145deg, #0F83F0, #1565C0)' }}>
  הוסף עובד
</button>

// Secondary button
<button className="px-4 py-2 rounded-xl text-sm font-medium border border-border bg-white hover:bg-muted transition-colors">
  ביטול
</button>
```

---

## Page Header — מבנה קבוע

```tsx
<div className="flex items-start justify-between mb-6">
  <div>
    <h1 className="text-3xl font-bold">{title}</h1>
    <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
  </div>
  <div className="flex items-center gap-2">
    {/* Export buttons */}
    <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-sm hover:bg-muted">
      <FileSpreadsheet className="h-4 w-4" /> Excel
    </button>
    <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-sm hover:bg-muted">
      <FileText className="h-4 w-4" /> PDF
    </button>
    {/* Primary CTA */}
    <button style={{ background: 'linear-gradient(145deg, #0F83F0, #1565C0)' }}
      className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white">
      <Plus className="h-4 w-4" /> {ctaLabel}
    </button>
  </div>
</div>
```

---

## Empty State — עם emoji + CTA

```tsx
<div className="text-center py-20">
  <div className="text-5xl mb-4">😊</div>
  <h3 className="text-lg font-semibold mb-2">אין עובדים עדיין</h3>
  <p className="text-sm text-muted-foreground mb-6">הוסף את העובד הראשון שלך</p>
  <button style={{ background: 'linear-gradient(145deg, #0F83F0, #1565C0)' }}
    className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white">
    <Plus className="h-4 w-4 inline ml-1" /> הוסף עובד
  </button>
</div>
```

---

## Filter Pills — לא dropdown

```tsx
<div className="flex gap-2 mb-4">
  {['כולם', 'פעיל', 'לא פעיל'].map(filter => (
    <button key={filter}
      onClick={() => setActiveFilter(filter)}
      className={cn(
        "px-4 py-1.5 rounded-full text-sm font-medium transition-colors",
        activeFilter === filter
          ? "text-white" 
          : "bg-muted text-muted-foreground hover:bg-muted/80"
      )}
      style={activeFilter === filter ? { background: 'linear-gradient(145deg, #0F83F0, #1565C0)' } : {}}>
      {filter}
    </button>
  ))}
</div>
```

---

## Tabs פנימיים

```tsx
<div className="flex gap-0 border-b border-border mb-6">
  {tabs.map(tab => (
    <button key={tab}
      onClick={() => setActiveTab(tab)}
      className={cn(
        "px-5 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors",
        activeTab === tab
          ? "border-[#0F83F0] text-[#0F83F0]"
          : "border-transparent text-muted-foreground hover:text-foreground"
      )}>
      {tab}
    </button>
  ))}
</div>
```

---

## KPI Card — template

```tsx
interface KPICardProps {
  title: string;
  value: string | number;
  subText?: string;
  icon: LucideIcon;
  gradient?: string; // 'blue' | 'green' | 'orange' | 'red'
  href?: string;
}

const gradients = {
  blue:   'linear-gradient(to right bottom, rgba(15,131,240,0.08), white)',
  green:  'linear-gradient(to right bottom, rgba(34,197,94,0.08), white)',
  orange: 'linear-gradient(to right bottom, rgba(249,115,22,0.08), white)',
  red:    'linear-gradient(to right bottom, rgba(239,68,68,0.08), white)',
};

export function KPICard({ title, value, subText, icon: Icon, gradient = 'blue', href }: KPICardProps) {
  const Wrapper = href ? Link : 'div';
  return (
    <Wrapper href={href as string}
      className="rounded-2xl border border-border/50 p-5 transition-shadow hover:shadow-sm cursor-pointer"
      style={{ background: gradients[gradient] }}>
      <div className="flex items-start justify-between">
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        <div className="p-2 rounded-xl bg-white/80">
          <Icon className="h-4 w-4 text-muted-foreground" />
        </div>
      </div>
      <div className="text-3xl font-bold mt-3">{value}</div>
      {subText && <p className="text-xs text-muted-foreground mt-1">{subText}</p>}
    </Wrapper>
  );
}
```
