import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  LayoutDashboard, UserCog, Users, Building2, Calendar, MapPin, Wallet,
  DollarSign, Package, TrendingUp, Calculator, ShieldCheck, MoonStar, History,
} from "lucide-react";

import {
  CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem,
  CommandList, CommandSeparator,
} from "@/components/ui/command";
import { useAuth } from "@/hooks/use-auth";

type Cmd = {
  title: string;
  to: string;
  icon: typeof LayoutDashboard;
  group: "ניווט" | "ניהול" | "מערכת";
  managerOnly?: boolean;
  adminOnly?: boolean;
};

const COMMANDS: Cmd[] = [
  { title: "דשבורד", to: "/", icon: LayoutDashboard, group: "ניווט" },
  { title: "עובדים", to: "/employees", icon: UserCog, group: "ניווט" },
  { title: "אתרים", to: "/projects", icon: Building2, group: "ניווט" },
  { title: "שיבוץ יומי", to: "/scheduling", icon: Calendar, group: "ניווט" },
  { title: "נוכחות", to: "/attendance", icon: MapPin, group: "ניווט" },
  { title: "חומרים", to: "/materials", icon: Package, group: "ניווט" },
  { title: "לקוחות", to: "/clients", icon: Users, group: "ניהול", managerOnly: true },
  { title: "תשלומים", to: "/payments", icon: Wallet, group: "ניהול", managerOnly: true },
  { title: "שכר בפועל", to: "/salaries", icon: DollarSign, group: "ניהול", managerOnly: true },
  { title: "רווחיות", to: "/profitability", icon: TrendingUp, group: "ניהול", managerOnly: true },
  { title: "סימולטור תמחור", to: "/pricing-simulator", icon: Calculator, group: "ניהול", managerOnly: true },
  { title: "היסטוריית פעולות", to: "/activity-log", icon: History, group: "ניהול", managerOnly: true },
  { title: "ניהול משתמשים", to: "/users", icon: ShieldCheck, group: "מערכת", adminOnly: true },
];

const GROUPS: Cmd["group"][] = ["ניווט", "ניהול", "מערכת"];

/** Global ⌘K / Ctrl+K command palette for fast, role-aware navigation. */
export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { isManager, isAdmin } = useAuth();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if ((e.key === "k" || e.key === "K") && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const visible = COMMANDS.filter(
    (c) => (!c.managerOnly || isManager) && (!c.adminOnly || isAdmin),
  );

  const go = (to: string) => {
    setOpen(false);
    navigate({ to });
  };

  const toggleTheme = () => {
    setOpen(false);
    const isDark = document.documentElement.classList.toggle("dark");
    localStorage.setItem("theme", isDark ? "dark" : "light");
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="חפש מסך או פעולה..." />
      <CommandList>
        <CommandEmpty>לא נמצאו תוצאות</CommandEmpty>
        {GROUPS.map((g) => {
          const items = visible.filter((c) => c.group === g);
          if (items.length === 0) return null;
          return (
            <CommandGroup key={g} heading={g}>
              {items.map((c) => (
                <CommandItem key={c.to} value={c.title} onSelect={() => go(c.to)}>
                  <c.icon className="me-2 h-4 w-4" />
                  <span>{c.title}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          );
        })}
        <CommandSeparator />
        <CommandGroup heading="פעולות">
          <CommandItem value="מצב יום לילה theme dark" onSelect={toggleTheme}>
            <MoonStar className="me-2 h-4 w-4" />
            <span>החלף מצב יום / לילה</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
