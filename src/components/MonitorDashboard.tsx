import { Fragment } from "react";
import type { LucideIcon } from "lucide-react";
import {
  DashboardCard,
  DashboardTemplate,
  Icon,
  type DashboardCardMetric,
  type IconBackground,
} from "@nicecxone/lyra-ui";
import { AgentsMtdCard } from "./AgentsMtdCard";
import { CallsMtdCard, VersionBreakdownCard } from "./BreakdownChartCards";
import { ClientsTableCard } from "./ClientsTableCard";

/* ── Monitor dashboard (placeholder content) ──
   Built on `DashboardTemplate` (the generic container/width/breakpoint shell)
   + `DashboardCard` rows, same composition as lyra-ui's `Templates/Dashboards`
   story. Every title/metric below is placeholder data — swap it for real
   content by editing `MONITOR_ROWS`; the layout code underneath doesn't need
   to change. Layout: a KPI row (the cards in `MONITOR_ROWS` + the Agents MTD leaderboard card = 4-up), then the Clients table beside two stacked chart cards. */

interface MonitorCard {
  id: string;
  title: string;
  /** Header icon — omit for a card with a plain title header. */
  icon?: LucideIcon;
  background?: IconBackground;
  metrics: DashboardCardMetric[];
  /** Subhead under the card title (`headerSubhead`). */
  subhead?: string;
}

/** "Yesterday" comparison line shown as a KPI card's subhead. */
const yesterday = (value: string) => `Yesterday: ${value}`;

const MONITOR_ROWS: MonitorCard[][] = [
  [
    {
      id: "total-agents",
      title: "Today's Total Agents",
      metrics: [{ value: "7.4K", label: "Today's Total Agents", trend: { direction: "down", percent: -6.5, comparisonPeriod: "day" } }],
      subhead: yesterday("7.9K"),
    },
    {
      id: "total-calls",
      title: "Today's Total Calls",
      metrics: [{ value: "3.4M", label: "Today's Total Calls", trend: { direction: "down", percent: -50, comparisonPeriod: "day" } }],
      subhead: yesterday("6.8M"),
    },
    {
      id: "total-minutes",
      title: "Today's Total Minutes",
      metrics: [{ value: "842K", label: "Today's Total Minutes", trend: { direction: "down", percent: -53, comparisonPeriod: "day" } }],
      subhead: yesterday("1.8M"),
    },
  ],
];

export function MonitorDashboard() {
  return (
    <div className="flex flex-1 flex-col min-w-0 overflow-y-auto p-6">
      <DashboardTemplate maxWidth="none" className="flex flex-col gap-6">
        {MONITOR_ROWS.map((row, i) => (
          <Fragment key={i}>
          <div className="flex flex-row flex-wrap gap-4">
            {row.map((card) => (
              <DashboardCard
                key={card.id}
                variant="neutral-subtle"
                className="w-full min-w-[220px] flex-1"
                headerTitle={card.title}
                headerSubhead={card.subhead}
                headerIcon={
                  card.icon ? (
                    <Icon icon={card.icon} size="md" background={card.background} shape="rounded" decorative />
                  ) : undefined
                }
                metrics={card.metrics}
                metricVariant="divided"
              />
            ))}
            {/* 4th KPI card — Agents MTD leaderboard */}
            {i === 0 && <AgentsMtdCard />}
          </div>
          {/* Clients table card + two stacked chart cards sit directly below the
              top KPI row. The KPI row is 4 equal columns (gap 1rem); here the table
              spans exactly 3 of them (3 columns + 2 gaps) and the chart stack
              takes the 4th, so the table's right edge aligns with the 3rd KPI
              card's. `flex-wrap` + min-widths (container-driven, not a viewport
              breakpoint): once there isn't room for both, the stacked chart
              cards wrap onto their own row below the table. */}
          {i === 0 && (
            <div className="flex flex-row flex-wrap gap-4">
              <div className="flex flex-[1_1_calc((100%_-_3rem)*0.75_+_2rem)] min-w-[692px] flex-col">
                <ClientsTableCard />
              </div>
              <div className="flex flex-[1_1_calc((100%_-_3rem)/4)] min-w-[220px] flex-col gap-4">
                <VersionBreakdownCard />
                <CallsMtdCard />
              </div>
            </div>
          )}
          </Fragment>
        ))}
      </DashboardTemplate>
    </div>
  );
}
