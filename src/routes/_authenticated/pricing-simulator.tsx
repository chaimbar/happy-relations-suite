import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import {
  Calculator, TrendingUp, Save, Sparkles, AlertTriangle, Trash2, ArrowLeft, Info,
} from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/_authenticated/pricing-simulator")({
  component: PricingSimulatorPage,
});

const PRESET_STAGES = ["שחור", "לבן", "גבס", "פינישים", "חוץ", "גגות", "ריצוף"];

function fmt(n: number) {
  return `₪${Math.round(Number(n)).toLocaleString("he-IL")}`;
}

type ProfRow = {
  contract_price: number | null;
  labor_cost_estimated: number;
  labor_cost_actual: number;
  profit_actual: number;
  cost_variance: number;
};

type Scenario = {
  id: string;
  name: string;
  client_id: string | null;
  input_mode: string;
  estimated_labor_cost: number;
  estimated_materials_cost: number;
  applied_buffer_pct: number;
  desired_margin_pct: number;
  suggested_price: number;
  created_at: string;
};

type StageRow = { name: string; enabled: boolean; workers: number; days: number };

// Pure, testable pricing calculation.
function computePrice(estimatedLabor: number, materials: number, bufferPct: number, marginPct: number) {
  const bufferedLabor = estimatedLabor * (1 + bufferPct / 100);
  const realisticCost = bufferedLabor + materials;
  const suggestedPrice = marginPct < 100 ? realisticCost / (1 - marginPct / 100) : realisticCost;
  const profit = suggestedPrice - realisticCost;
  return { bufferedLabor, realisticCost, suggestedPrice, profit };
}

function PricingSimulatorPage() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { isManager } = useAuth();

  // ── Historical benchmark from site_profitability ──────────────
  const { data: profRows = [] } = useQuery({
    queryKey: ["pricing-benchmark"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_profitability")
        .select("contract_price, labor_cost_estimated, labor_cost_actual, profit_actual, cost_variance");
      if (error) throw error;
      return (data ?? []) as ProfRow[];
    },
  });

  const withActuals = profRows.filter((r) => r.labor_cost_actual > 0 && r.labor_cost_estimated > 0);
  const avgVariancePct =
    withActuals.length > 0
      ? Math.round(
          (withActuals.reduce((s, r) => s + r.cost_variance / r.labor_cost_estimated, 0) /
            withActuals.length) *
            100,
        )
      : 0;
  const marginRows = profRows.filter((r) => (r.contract_price ?? 0) > 0);
  const avgAchievedMargin =
    marginRows.length > 0
      ? Math.round(
          (marginRows.reduce((s, r) => s + r.profit_actual / Number(r.contract_price), 0) /
            marginRows.length) *
            100,
        )
      : null;

  // ── Average daily worker cost (prefill) ───────────────────────
  const { data: avgDailyCost = 0 } = useQuery({
    queryKey: ["pricing-avg-daily"],
    queryFn: async () => {
      const { data } = await supabase
        .from("employees")
        .select("daily_cost_estimated")
        .eq("status", "active");
      const vals = (data ?? [])
        .map((e) => Number((e as { daily_cost_estimated: number | null }).daily_cost_estimated ?? 0))
        .filter((v) => v > 0);
      return vals.length ? Math.round(vals.reduce((s, v) => s + v, 0) / vals.length) : 0;
    },
  });

  // ── Saved scenarios ───────────────────────────────────────────
  const { data: scenarios = [] } = useQuery({
    queryKey: ["pricing-scenarios"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pricing_scenarios")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Scenario[];
    },
  });

  // ── Form state ────────────────────────────────────────────────
  const [mode, setMode] = useState<"workdays" | "stages">("workdays");
  const [dailyCost, setDailyCost] = useState(0);
  const [workers, setWorkers] = useState(3);
  const [days, setDays] = useState(20);
  const [stageRows, setStageRows] = useState<StageRow[]>(
    PRESET_STAGES.map((name) => ({ name, enabled: false, workers: 2, days: 5 })),
  );
  const [materialsCost, setMaterialsCost] = useState(0);
  const [desiredMargin, setDesiredMargin] = useState(20);
  const [useBuffer, setUseBuffer] = useState(true);
  const [bufferPct, setBufferPct] = useState(0);
  const [scenarioName, setScenarioName] = useState("");

  // Seed daily cost + buffer from data once (don't override user edits).
  const seededCost = useRef(false);
  const seededBuffer = useRef(false);
  useEffect(() => {
    if (!seededCost.current && avgDailyCost > 0) {
      setDailyCost(avgDailyCost);
      seededCost.current = true;
    }
  }, [avgDailyCost]);
  useEffect(() => {
    if (!seededBuffer.current && avgVariancePct !== 0) {
      setBufferPct(Math.max(0, avgVariancePct));
      seededBuffer.current = true;
    }
  }, [avgVariancePct]);

  // ── Calculation ───────────────────────────────────────────────
  const estimatedLabor =
    mode === "workdays"
      ? workers * days * dailyCost
      : stageRows.reduce((s, r) => (r.enabled ? s + r.workers * r.days * dailyCost : s), 0);

  const effectiveBuffer = useBuffer ? bufferPct : 0;
  const { bufferedLabor, realisticCost, suggestedPrice, profit } = computePrice(
    estimatedLabor,
    materialsCost,
    effectiveBuffer,
    desiredMargin,
  );
  const marginWarning =
    avgAchievedMargin !== null && desiredMargin > avgAchievedMargin + 5;

  const saveMutation = useMutation({
    mutationFn: async () => {
      const inputs =
        mode === "workdays"
          ? { workers, days, dailyCost }
          : { dailyCost, stages: stageRows.filter((r) => r.enabled) };
      const { error } = await supabase.from("pricing_scenarios").insert({
        name: scenarioName.trim() || "תרחיש ללא שם",
        input_mode: mode,
        inputs,
        estimated_labor_cost: estimatedLabor,
        estimated_materials_cost: materialsCost,
        applied_buffer_pct: effectiveBuffer,
        desired_margin_pct: desiredMargin,
        suggested_price: suggestedPrice,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("התרחיש נשמר");
      setScenarioName("");
      qc.invalidateQueries({ queryKey: ["pricing-scenarios"] });
    },
    onError: (e: unknown) => toast.error("שמירה נכשלה: " + (e as Error).message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("pricing_scenarios").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("התרחיש נמחק");
      qc.invalidateQueries({ queryKey: ["pricing-scenarios"] });
    },
  });

  return (
    <div className="space-y-5">
      {/* Intro */}
      <Card className="border-accent/30 bg-accent/5">
        <CardContent className="p-4 flex items-start gap-3">
          <Sparkles className="h-5 w-5 text-accent-foreground shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium">סימולטור תמחור חכם</p>
            <p className="text-muted-foreground mt-0.5">
              הזן הערכה לפרויקט חדש — המערכת מחשבת את העלות הצפויה לפי הדאטה ההיסטורית שלך
              ומציעה מחיר. ה-buffer מבוסס על סטיית העלות הממוצעת שלך בפועל
              {avgVariancePct !== 0 ? ` (${avgVariancePct > 0 ? "+" : ""}${avgVariancePct}%).` : "."}
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-2 gap-5">
        {/* ── Inputs ── */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Calculator className="h-4 w-4" /> פרטי ההערכה
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Tabs value={mode} onValueChange={(v) => setMode(v as "workdays" | "stages")}>
              <TabsList className="w-full">
                <TabsTrigger value="workdays" className="flex-1">לפי ימי עבודה</TabsTrigger>
                <TabsTrigger value="stages" className="flex-1">לפי שלבים</TabsTrigger>
              </TabsList>

              <TabsContent value="workdays" className="space-y-3 pt-2">
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <Label className="text-xs">מספר עובדים</Label>
                    <Input type="number" min={0} value={workers}
                      onChange={(e) => setWorkers(Number(e.target.value) || 0)} />
                  </div>
                  <div>
                    <Label className="text-xs">ימי עבודה</Label>
                    <Input type="number" min={0} value={days}
                      onChange={(e) => setDays(Number(e.target.value) || 0)} />
                  </div>
                  <div>
                    <Label className="text-xs">עלות יומית לעובד</Label>
                    <Input type="number" min={0} value={dailyCost}
                      onChange={(e) => setDailyCost(Number(e.target.value) || 0)} />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="stages" className="space-y-2 pt-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs">עלות יומית לעובד</Label>
                  <Input type="number" min={0} value={dailyCost} className="w-28 h-8"
                    onChange={(e) => setDailyCost(Number(e.target.value) || 0)} />
                </div>
                <div className="space-y-1.5">
                  {stageRows.map((row, i) => (
                    <div key={row.name}
                      className={`flex items-center gap-2 rounded-lg border p-2 transition-colors ${row.enabled ? "bg-muted/30" : ""}`}>
                      <Switch checked={row.enabled}
                        onCheckedChange={(c) =>
                          setStageRows((rs) => rs.map((r, j) => j === i ? { ...r, enabled: c } : r))} />
                      <span className="text-sm font-medium w-16">{row.name}</span>
                      {row.enabled && (
                        <div className="flex items-center gap-2 ms-auto">
                          <div className="flex items-center gap-1">
                            <span className="text-[11px] text-muted-foreground">עובדים</span>
                            <Input type="number" min={0} value={row.workers} className="w-16 h-8"
                              onChange={(e) => setStageRows((rs) => rs.map((r, j) =>
                                j === i ? { ...r, workers: Number(e.target.value) || 0 } : r))} />
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-[11px] text-muted-foreground">ימים</span>
                            <Input type="number" min={0} value={row.days} className="w-16 h-8"
                              onChange={(e) => setStageRows((rs) => rs.map((r, j) =>
                                j === i ? { ...r, days: Number(e.target.value) || 0 } : r))} />
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </TabsContent>
            </Tabs>

            <div className="grid grid-cols-2 gap-3 pt-1 border-t">
              <div>
                <Label className="text-xs">עלות חומרים (₪)</Label>
                <Input type="number" min={0} value={materialsCost}
                  onChange={(e) => setMaterialsCost(Number(e.target.value) || 0)} />
              </div>
              <div>
                <Label className="text-xs">אחוז רווח רצוי (%)</Label>
                <Input type="number" min={0} max={99} value={desiredMargin}
                  onChange={(e) => setDesiredMargin(Number(e.target.value) || 0)} />
              </div>
            </div>

            {/* Buffer control */}
            <div className="rounded-lg border p-3 space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm flex items-center gap-1.5">
                  <TrendingUp className="h-3.5 w-3.5" /> מרווח ביטחון היסטורי
                </Label>
                <Switch checked={useBuffer} onCheckedChange={setUseBuffer} />
              </div>
              {useBuffer && (
                <>
                  <div className="flex items-center gap-3">
                    <Slider value={[bufferPct]} min={0} max={50} step={1}
                      onValueChange={(v) => setBufferPct(v[0])} className="flex-1" />
                    <span className="text-sm font-semibold w-12 text-end">{bufferPct}%</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    מוסיף {bufferPct}% לעלות העבודה כדי לכסות חריגות צפויות.
                  </p>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* ── Result ── */}
        <Card className="border-green-500/30">
          <CardHeader>
            <CardTitle className="text-base">מחיר מומלץ להצעה</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center py-2">
              <p className="text-4xl font-bold text-green-600">{fmt(suggestedPrice)}</p>
              <p className="text-xs text-muted-foreground mt-1">
                כולל רווח של {fmt(profit)} ({desiredMargin}%)
              </p>
            </div>

            <div className="space-y-2 text-sm">
              <Row label="עלות עבודה משוערת" value={fmt(estimatedLabor)} />
              {effectiveBuffer > 0 && (
                <Row label={`אחרי buffer (+${effectiveBuffer}%)`} value={fmt(bufferedLabor)} muted />
              )}
              <Row label="עלות חומרים" value={fmt(materialsCost)} />
              <Row label="סה״כ עלות ריאלית" value={fmt(realisticCost)} bold />
              <div className="border-t pt-2">
                <Row label="רווח צפוי" value={fmt(profit)} accent />
              </div>
            </div>

            {/* Reality reference */}
            {avgAchievedMargin !== null && (
              <div className={`rounded-lg border p-3 text-xs flex items-start gap-2 ${
                marginWarning ? "border-amber-400/50 bg-amber-50/50" : "border-blue-400/40 bg-blue-50/40"}`}>
                {marginWarning
                  ? <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                  : <Info className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />}
                <div>
                  <p className="font-medium">
                    רפרנס מציאות: היסטורית השגת בממוצע <b>{avgAchievedMargin}%</b> רווח בפועל.
                  </p>
                  {marginWarning && (
                    <p className="text-amber-700 mt-0.5">
                      הרווח שביקשת ({desiredMargin}%) גבוה משמעותית — ייתכן שהמחיר אגרסיבי מדי.
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Save */}
            {isManager && (
              <div className="flex gap-2 pt-1">
                <Input placeholder="שם התרחיש (לדוגמה: הצעה לקבלן X)"
                  value={scenarioName} onChange={(e) => setScenarioName(e.target.value)} />
                <Button onClick={() => saveMutation.mutate()}
                  disabled={saveMutation.isPending || estimatedLabor <= 0}>
                  <Save className="h-4 w-4" /> שמור
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Saved scenarios ── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">תרחישים שמורים</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {scenarios.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground text-sm">
              אין עדיין תרחישים שמורים
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/30 text-xs text-muted-foreground">
                    <th className="text-right px-4 py-3 font-medium">שם</th>
                    <th className="text-right px-4 py-3 font-medium">קלט</th>
                    <th className="text-right px-4 py-3 font-medium">עלות עבודה</th>
                    <th className="text-right px-4 py-3 font-medium">buffer</th>
                    <th className="text-right px-4 py-3 font-medium">רווח</th>
                    <th className="text-right px-4 py-3 font-medium">מחיר מומלץ</th>
                    <th className="text-right px-4 py-3 font-medium">תאריך</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {scenarios.map((s) => (
                    <tr key={s.id} className="border-b hover:bg-muted/20">
                      <td className="px-4 py-3 font-medium">{s.name}</td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className="text-xs">
                          {s.input_mode === "stages" ? "שלבים" : "ימי עבודה"}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{fmt(s.estimated_labor_cost)}</td>
                      <td className="px-4 py-3 text-muted-foreground">{s.applied_buffer_pct}%</td>
                      <td className="px-4 py-3 text-muted-foreground">{s.desired_margin_pct}%</td>
                      <td className="px-4 py-3 font-semibold text-green-600">{fmt(s.suggested_price)}</td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">
                        {new Date(s.created_at).toLocaleDateString("he-IL")}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 justify-end">
                          <Button variant="ghost" size="sm" title="צור אתר עם מחיר זה"
                            onClick={() => {
                              navigate({ to: "/projects" });
                              toast.info(`צור אתר חדש עם מחיר ${fmt(s.suggested_price)}`);
                            }}>
                            <ArrowLeft className="h-4 w-4" />
                          </Button>
                          {isManager && (
                            <Button variant="ghost" size="sm" title="מחק"
                              onClick={() => deleteMutation.mutate(s.id)}>
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Row({ label, value, bold, muted, accent }: {
  label: string; value: string; bold?: boolean; muted?: boolean; accent?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className={muted ? "text-muted-foreground text-xs" : ""}>{label}</span>
      <span className={`${bold ? "font-bold" : ""} ${accent ? "font-semibold text-green-600" : ""} ${muted ? "text-muted-foreground text-xs" : ""}`}>
        {value}
      </span>
    </div>
  );
}
