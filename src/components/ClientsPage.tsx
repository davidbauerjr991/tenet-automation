import { useMemo, useState } from "react";
import {
  ColumnToggle,
  SortableTableHead,
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
  TableToolbar,
  cn,
  type SortDirection,
} from "@nicecxone/lyra-ui";
import { GRAND_TOTAL, NUMERIC_COLUMNS, fmt, useClients, type NumericKey } from "../data/clients";

/* ── Clients page ──
   Built from lyra-ui's `Templates/Data Management` layout: `TableToolbar`
   (quick search, record count, column toggle), a sortable `Table` and the
   shared `TableFooter` with rows-per-page. Rows come from the same shared list
   as the Monitor dashboard's Clients card (`useClients`), so a saved client
   appears in both. */

const TEXT_COLUMN_CLASS = "flex-1 min-w-[96px]";
const NUMERIC_COLUMN_CLASS = "flex-1 min-w-[96px] justify-end text-right";
const CLIENT_COLUMN_CLASS = "flex-[2] min-w-[200px]";

const COLUMN_DEFS = [
  { key: "version", label: "Version" },
  { key: "acdVersion", label: "ACD Version" },
  { key: "shard", label: "Shard" },
  ...NUMERIC_COLUMNS.map((c) => ({ key: c.key as string, label: c.label })),
];

export function ClientsPage() {
  const clients = useClients();
  const [search, setSearch] = useState("");
  const [visible, setVisible] = useState<Set<string>>(() => new Set(COLUMN_DEFS.map((c) => c.key)));
  const [sortKey, setSortKey] = useState<NumericKey>("calls");
  const [sortDirection, setSortDirection] = useState<Exclude<SortDirection, null>>("desc");
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = q ? clients.filter((c) => c.client.toLowerCase().includes(q)) : clients;
    const sorted = [...list].sort((a, b) => a[sortKey] - b[sortKey]);
    return sortDirection === "desc" ? sorted.reverse() : sorted;
  }, [clients, search, sortKey, sortDirection]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / rowsPerPage));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * rowsPerPage;
  const pageRows = filtered.slice(start, start + rowsPerPage);
  const show = (key: string) => visible.has(key);

  const handleSort = (key: NumericKey) => {
    if (key === sortKey) setSortDirection((d) => (d === "desc" ? "asc" : "desc"));
    else {
      setSortKey(key);
      setSortDirection("desc");
    }
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <TableToolbar
        className="px-6"
        searchQuery={search}
        onSearchChange={(v) => {
          setSearch(v);
          setPage(1);
        }}
        recordCount={filtered.length}
        actions={<ColumnToggle columns={COLUMN_DEFS} visibleColumns={visible} onVisibilityChange={setVisible} />}
      />

      <div className="min-h-0 flex-1 overflow-auto px-6">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className={CLIENT_COLUMN_CLASS}>Client</TableHead>
              {show("version") && <TableHead className={TEXT_COLUMN_CLASS}>Version</TableHead>}
              {show("acdVersion") && <TableHead className={TEXT_COLUMN_CLASS}>ACD Version</TableHead>}
              {show("shard") && <TableHead className={TEXT_COLUMN_CLASS}>Shard</TableHead>}
              {NUMERIC_COLUMNS.filter((c) => show(c.key)).map((col) => (
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
            {pageRows.map((row) => (
              <TableRow key={row.id}>
                <TableCell className={CLIENT_COLUMN_CLASS}>{row.client}</TableCell>
                {show("version") && <TableCell className={TEXT_COLUMN_CLASS}>{row.version}</TableCell>}
                {show("acdVersion") && <TableCell className={TEXT_COLUMN_CLASS}>{row.acdVersion}</TableCell>}
                {show("shard") && <TableCell className={TEXT_COLUMN_CLASS}>{row.shard}</TableCell>}
                {NUMERIC_COLUMNS.filter((c) => show(c.key)).map((col) => (
                  <TableCell key={col.key} className={NUMERIC_COLUMN_CLASS}>
                    {fmt(row[col.key])}
                  </TableCell>
                ))}
              </TableRow>
            ))}
            <TableRow className="border-t border-lyra-border-default hover:bg-transparent">
              <TableCell className={cn(CLIENT_COLUMN_CLASS, "lyra-body-md-emphasis")}>Grand Total</TableCell>
              {show("version") && <TableCell className={TEXT_COLUMN_CLASS} />}
              {show("acdVersion") && <TableCell className={TEXT_COLUMN_CLASS} />}
              {show("shard") && <TableCell className={TEXT_COLUMN_CLASS} />}
              {NUMERIC_COLUMNS.filter((c) => show(c.key)).map((col) => (
                <TableCell key={col.key} className={cn(NUMERIC_COLUMN_CLASS, "lyra-body-md-emphasis")}>
                  {fmt(GRAND_TOTAL[col.key])}
                </TableCell>
              ))}
            </TableRow>
          </TableBody>
        </Table>
      </div>

      <TableFooter
        className="shrink-0 px-6"
        currentPage={safePage}
        totalPages={totalPages}
        onPageChange={setPage}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={(n) => {
          setRowsPerPage(n);
          setPage(1);
        }}
        totalRecords={filtered.length}
        displayStart={filtered.length === 0 ? 0 : start + 1}
        displayEnd={Math.min(start + rowsPerPage, filtered.length)}
      />
    </div>
  );
}
