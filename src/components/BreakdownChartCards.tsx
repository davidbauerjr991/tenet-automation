import { useState } from "react";
import { BarChart, Container, DonutChart, Tab, TabList } from "@nicecxone/lyra-ui";

/* ── Breakdown chart cards (placeholder data) ──
   Two stacked `Container` cards, each a `TabList` over a lyra-ui chart:
   a `DonutChart` + dot legend (same legend pattern as lyra-ui's
   `AgentDashboard`), and a grouped `BarChart`. Series colors are the accent
   (data-viz) palette, never blue/status tokens. Swap in real data by editing
   `VERSION_TABS` / `CALLS_TABS`. */

interface DonutSlice {
  label: string;
  value: number;
  colorVar: string;
  dotClassName: string;
}

const SLICE_COLORS = [
  { colorVar: "var(--lyra-color-accent-purple-strong)", dotClassName: "bg-lyra-accent-purple-strong" },
  { colorVar: "var(--lyra-color-accent-orange-strong)", dotClassName: "bg-lyra-accent-orange-strong" },
  { colorVar: "var(--lyra-color-accent-green-strong)", dotClassName: "bg-lyra-accent-green-strong" },
];

function slices(rows: [string, number][]): DonutSlice[] {
  return rows.map(([label, value], i) => ({ label, value, ...SLICE_COLORS[i % SLICE_COLORS.length] }));
}

const VERSION_TABS: { id: string; label: string; slices: DonutSlice[] }[] = [
  { id: "version", label: "Version", slices: slices([["27.0", 45], ["23.0", 40], ["0.0.0", 15]]) },
  { id: "acd", label: "ACD", slices: slices([["w", 38], ["u", 34], ["a", 28]]) },
  { id: "attempt-supervisor", label: "Attempt Supervisor", slices: slices([["na4b", 50], ["na4h", 30], ["na4f", 20]]) },
];

export function VersionBreakdownCard() {
  const [tab, setTab] = useState(VERSION_TABS[0].id);
  const active = VERSION_TABS.find((t) => t.id === tab) ?? VERSION_TABS[0];

  return (
    <Container variant="neutral-subtle" className="flex w-full flex-1 flex-col overflow-hidden">
      <TabList overflowMenu overflowBreakpoint="compact" className="px-4">
        {VERSION_TABS.map((t) => (
          <Tab key={t.id} active={t.id === tab} onClick={() => setTab(t.id)}>
            {t.label}
          </Tab>
        ))}
      </TabList>
      <div className="flex flex-1 flex-col items-center justify-center gap-4 p-4">
        <div className="h-[200px] w-[200px] shrink-0">
          <DonutChart
            data={active.slices.map(({ label, value, colorVar }) => ({ label, value, colorVar }))}
          />
        </div>
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
          {active.slices.map((s) => (
            <span key={s.label} className="inline-flex items-center gap-2 lyra-body-md text-lyra-fg-secondary">
              <span className={`h-2.5 w-2.5 rounded-full ${s.dotClassName}`} aria-hidden="true" />
              {s.label}
            </span>
          ))}
        </div>
      </div>
    </Container>
  );
}

const CALLS_TABS: { id: string; label: string; outbound: number; inbound: number }[] = [
  { id: "calls-mtd", label: "Calls MTD", outbound: 32000000, inbound: 700000 },
  { id: "minutes-mtd", label: "Minutes MTD", outbound: 15000000, inbound: 2100000 },
  { id: "overall", label: "Overall", outbound: 47000000, inbound: 2800000 },
];

export function CallsMtdCard() {
  const [tab, setTab] = useState(CALLS_TABS[0].id);
  const active = CALLS_TABS.find((t) => t.id === tab) ?? CALLS_TABS[0];

  return (
    <Container variant="neutral-subtle" className="flex w-full flex-1 flex-col overflow-hidden">
      <TabList overflowMenu overflowBreakpoint="compact" className="px-4">
        {CALLS_TABS.map((t) => (
          <Tab key={t.id} active={t.id === tab} onClick={() => setTab(t.id)}>
            {t.label}
          </Tab>
        ))}
      </TabList>
      <div className="flex-1 p-4">
        <BarChart
          className="h-[260px]"
          categories={[active.label]}
          series={[
            { label: "OB Calls", data: [active.outbound], colorVar: "var(--lyra-color-accent-purple-strong)" },
            { label: "IB Calls", data: [active.inbound], colorVar: "var(--lyra-color-accent-orange-strong)" },
          ]}
        />
      </div>
    </Container>
  );
}
