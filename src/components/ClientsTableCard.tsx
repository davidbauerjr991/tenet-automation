import { useMemo, useState } from "react";
import {
  Checkbox,
  Container,
  SortableTableHead,
  Tab,
  TabList,
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
  cn,
  type SortDirection,
} from "@nicecxone/lyra-ui";
import { BASE_RECORDS, GRAND_TOTAL, NUMERIC_COLUMNS, fmt, useClients, type NumericKey } from "../data/clients";

/* ── Clients table card (placeholder data) ──
   A `Container` card holding a `TabList` (Clients / Services), a "Show
   Disabled" `Checkbox`, a sortable `Table` with a Grand Total row, and the
   shared `TableFooter` for pagination — all existing lyra-ui components, same
   composition as lyra-ui's `Templates/Data Management` story. Swap in real
   data by editing `src/data/clients.tsx` (shared with the Clients page). */

const TEXT_COLUMN_CLASS = "flex-1 min-w-[96px]";
const NUMERIC_COLUMN_CLASS = "flex-1 min-w-[96px] justify-end text-right";

export function ClientsTableCard() {
  const clients = useClients();
  const totalRecords = BASE_RECORDS + clients.length;
  const pageSize = clients.length;
  const totalPages = Math.ceil(totalRecords / pageSize);
  const [activeTab, setActiveTab] = useState<"clients" | "services">("clients");
  const [showDisabled, setShowDisabled] = useState(true);
  const [sortKey, setSortKey] = useState<NumericKey>("calls");
  const [sortDirection, setSortDirection] = useState<Exclude<SortDirection, null>>("desc");
  const [page, setPage] = useState(1);

  const rows = useMemo(() => {
    const sorted = [...clients].sort((a, b) => a[sortKey] - b[sortKey]);
    return sortDirection === "desc" ? sorted.reverse() : sorted;
  }, [clients, sortKey, sortDirection]);

  const handleSort = (key: NumericKey) => {
    if (key === sortKey) {
      setSortDirection((d) => (d === "desc" ? "asc" : "desc"));
    } else {
      setSortKey(key);
      setSortDirection("desc");
    }
  };

  const displayStart = (page - 1) * pageSize + 1;
  const displayEnd = Math.min(page * pageSize, totalRecords);

  return (
    <Container variant="neutral-subtle" className="flex w-full flex-1 flex-col overflow-hidden">
      <TabList overflowMenu className="px-6">
        <Tab active={activeTab === "clients"} onClick={() => setActiveTab("clients")}>Clients</Tab>
        <Tab active={activeTab === "services"} onClick={() => setActiveTab("services")}>Services</Tab>
      </TabList>

      <div className="flex justify-end px-6 pt-4 pb-2">
        <Checkbox
          label="Show Disabled"
          checked={showDisabled}
          onCheckedChange={(v) => setShowDisabled(v === true)}
        />
      </div>

      <div className="px-6">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="flex-[2] min-w-[200px]">Client</TableHead>
              <TableHead className={TEXT_COLUMN_CLASS}>Version</TableHead>
              <TableHead className={TEXT_COLUMN_CLASS}>ACD Version</TableHead>
              <TableHead className={TEXT_COLUMN_CLASS}>Shard</TableHead>
              {NUMERIC_COLUMNS.map((col) => (
                <SortableTableHead
                  key={col.key}
                  className={NUMERIC_COLUMN_CLASS}
                  sortDirection={sortKey === col.key ? sortDirection : null}
                  onSort={() => handleSort(col.key)}
                >
                  {col.label}
                </SortableTableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.id}>
                <TableCell className="flex-[2] min-w-[200px]">
                  {row.client}
                </TableCell>
                <TableCell className={TEXT_COLUMN_CLASS}>{row.version}</TableCell>
                <TableCell className={TEXT_COLUMN_CLASS}>{row.acdVersion}</TableCell>
                <TableCell className={TEXT_COLUMN_CLASS}>{row.shard}</TableCell>
                {NUMERIC_COLUMNS.map((col) => (
                  <TableCell key={col.key} className={NUMERIC_COLUMN_CLASS}>
                    {fmt(row[col.key])}
                  </TableCell>
                ))}
              </TableRow>
            ))}
            <TableRow className="border-t border-lyra-border-default hover:bg-transparent">
              <TableCell className={cn("flex-[2] min-w-[200px] lyra-body-md-emphasis")}>Grand Total</TableCell>
              <TableCell className={TEXT_COLUMN_CLASS} />
              <TableCell className={TEXT_COLUMN_CLASS} />
              <TableCell className={TEXT_COLUMN_CLASS} />
              {NUMERIC_COLUMNS.map((col) => (
                <TableCell key={col.key} className={cn(NUMERIC_COLUMN_CLASS, "lyra-body-md-emphasis")}>
                  {fmt(GRAND_TOTAL[col.key])}
                </TableCell>
              ))}
            </TableRow>
          </TableBody>
        </Table>
      </div>

      <TableFooter
        className="px-6 shrink-0"
        currentPage={page}
        totalPages={totalPages}
        onPageChange={setPage}
        rowsPerPage={pageSize}
        showRowsPerPage={false}
        totalRecords={totalRecords}
        displayStart={displayStart}
        displayEnd={displayEnd}
      />
    </Container>
  );
}
