import { useState } from "react";
import { Medal } from "lucide-react";
import { Button, DashboardCard, ListItem } from "@nicecxone/lyra-ui";

/* ── Agents MTD leaderboard card (placeholder data) ──
   `DashboardCard` (title + body children) holding a short ranked list built
   from `ListItem`s, with a page selector in the card's `footer` slot made of
   `Button`s (one per page). Swap in real data by editing `AGENT_PAGES`. */

interface AgentEntry {
  name: string;
  agents: number;
}

/** Three pages of three rows each. */
const AGENT_PAGES: AgentEntry[][] = [
  [
    { name: "Northern Plains Servicing ARB", agents: 1045 },
    { name: "Toyota Market Trial Prod", agents: 630 },
    { name: "iQor Credit One", agents: 609 },
  ],
  [
    { name: "REVCO Management", agents: 504 },
    { name: "Sallie Mae", agents: 435 },
    { name: "NCI", agents: 379 },
  ],
  [
    { name: "iQor_Comm2 (1079450)", agents: 309 },
    { name: "CRC", agents: 200 },
    { name: "LiveVox_Alldigitech", agents: 186 },
  ],
];

export function AgentsMtdCard() {
  const [page, setPage] = useState(0);

  return (
    <DashboardCard
      variant="neutral-subtle"
      className="w-full min-w-[220px] flex-1"
      headerTitle="Agents MTD"
      footer={
        <div className="flex items-center justify-center gap-1 py-1" role="group" aria-label="Agents MTD pages">
          {AGENT_PAGES.map((_, i) => (
            <Button
              key={i}
              variant="icon"
              size="icon-sm"
              onClick={() => setPage(i)}
              aria-label={`Page ${i + 1}`}
              aria-current={i === page ? "true" : undefined}
            >
              <span
                className={
                  i === page
                    ? "h-2 w-2 rounded-full bg-lyra-fg-default"
                    : "h-2 w-2 rounded-full bg-lyra-border-soft"
                }
              />
            </Button>
          ))}
        </div>
      }
    >
      <div className="flex flex-col">
        {AGENT_PAGES[page].map((entry, i) => (
          <ListItem
            key={entry.name}
            static
            className="items-center [&>*]:!mt-0"
            divider={i < AGENT_PAGES[page].length - 1}
            leading={<Medal className="h-5 w-5 text-lyra-accent-yellow-strong" strokeWidth={1.5} aria-hidden="true" />}
            title={entry.name}
            trailing={<span className="lyra-body-md text-lyra-fg-secondary">{entry.agents.toLocaleString("en-US")}</span>}
          />
        ))}
      </div>
    </DashboardCard>
  );
}
