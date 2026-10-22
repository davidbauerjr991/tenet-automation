import { createContext, useContext } from "react";

/* ── Shared clients data ──
   One list feeds both the Monitor dashboard's Clients card and the Clients page,
   so a client saved from "Create New Client" shows up in both. */

export interface ClientRow {
  id: string;
  client: string;
  version: string;
  acdVersion: string;
  shard: string;
  calls: number;
  callsMtd: number;
  hciMtd: number;
  smsMtd: number;
  emailMtd: number;
  minsMtd: number;
  agentsMtd: number;
}

export const INITIAL_CLIENTS: ClientRow[] = [
  { id: "1", client: "iQor Credit One", version: "23.0", acdVersion: "w", shard: "na4c", calls: 925000, callsMtd: 18000000, hciMtd: 4000000, smsMtd: 0, emailMtd: 0, minsMtd: 3700000, agentsMtd: 609 },
  { id: "2", client: "CRC", version: "23.0", acdVersion: "u", shard: "na4h", calls: 186000, callsMtd: 1400000, hciMtd: 0, smsMtd: 373000, emailMtd: 0, minsMtd: 366000, agentsMtd: 200 },
  { id: "3", client: "SLBA PAC", version: "23.0", acdVersion: "a", shard: "na4f", calls: 175000, callsMtd: 1800000, hciMtd: 0, smsMtd: 0, emailMtd: 0, minsMtd: 395000, agentsMtd: 152 },
  { id: "4", client: "NCI", version: "23.0", acdVersion: "j", shard: "na4b", calls: 171000, callsMtd: 1300000, hciMtd: 462000, smsMtd: 0, emailMtd: 0, minsMtd: 377000, agentsMtd: 379 },
  { id: "5", client: "REVCO Management", version: "27.0", acdVersion: "b", shard: "na4b", calls: 166000, callsMtd: 1900000, hciMtd: 0, smsMtd: 195000, emailMtd: 0, minsMtd: 689000, agentsMtd: 504 },
  { id: "6", client: "Credit Management Comp", version: "23.0", acdVersion: "w", shard: "na4b", calls: 161000, callsMtd: 1200000, hciMtd: 0, smsMtd: 0, emailMtd: 0, minsMtd: 716000, agentsMtd: 112 },
  { id: "7", client: "LiveVox_Alldigitech", version: "23.0", acdVersion: "g", shard: "na4b", calls: 135000, callsMtd: 1500000, hciMtd: 1400000, smsMtd: 0, emailMtd: 0, minsMtd: 428000, agentsMtd: 186 },
  { id: "8", client: "Spring Oaks", version: "23.0", acdVersion: "o", shard: "na4h", calls: 133000, callsMtd: 967000, hciMtd: 0, smsMtd: 0, emailMtd: 0, minsMtd: 204000, agentsMtd: 61 },
  { id: "9", client: "Northern Plains Servicing Agency", version: "23.0", acdVersion: "t", shard: "na4b", calls: 99000, callsMtd: 2100000, hciMtd: 1500000, smsMtd: 0, emailMtd: 0, minsMtd: 716000, agentsMtd: 1000 },
  { id: "10", client: "Sallie Mae", version: "23.0", acdVersion: "o", shard: "na4h", calls: 95000, callsMtd: 1500000, hciMtd: 762000, smsMtd: 239000, emailMtd: 0, minsMtd: 689000, agentsMtd: 435 },
  { id: "11", client: "USBank", version: "23.0", acdVersion: "n", shard: "na4b", calls: 94000, callsMtd: 1600000, hciMtd: 1500000, smsMtd: 0, emailMtd: 0, minsMtd: 353000, agentsMtd: 184 },
  { id: "12", client: "Toyota Market Trial Prod", version: "23.0", acdVersion: "f", shard: "na4f", calls: 87000, callsMtd: 1700000, hciMtd: 0, smsMtd: 0, emailMtd: 0, minsMtd: 764000, agentsMtd: 630 },
  { id: "13", client: "iQor_Comm2 (1079450)", version: "23.0", acdVersion: "k", shard: "na4f", calls: 73000, callsMtd: 603000, hciMtd: 561000, smsMtd: 0, emailMtd: 0, minsMtd: 171000, agentsMtd: 309 },
];

/** Totals across every record (not just this page) — placeholder figures. */
export const GRAND_TOTAL = {
  calls: 3400000,
  callsMtd: 51000000,
  hciMtd: 17000000,
  smsMtd: 1200000,
  emailMtd: 236000,
  minsMtd: 15000000,
  agentsMtd: 11000,
};


/** Records the placeholder dataset represents beyond the rows listed above (522 total at first). */
export const BASE_RECORDS = 522 - INITIAL_CLIENTS.length;

const compact = new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 });
export const fmt = (n: number) => compact.format(n);

export type NumericKey = "calls" | "callsMtd" | "hciMtd" | "smsMtd" | "emailMtd" | "minsMtd" | "agentsMtd";

export const NUMERIC_COLUMNS: { key: NumericKey; label: string }[] = [
  { key: "calls", label: "Calls" },
  { key: "callsMtd", label: "Calls MTD" },
  { key: "hciMtd", label: "HCI MTD" },
  { key: "smsMtd", label: "SMS MTD" },
  { key: "emailMtd", label: "Email MTD" },
  { key: "minsMtd", label: "Mins MTD" },
  { key: "agentsMtd", label: "Agents MTD" },
];


export const ClientsContext = createContext<ClientRow[]>(INITIAL_CLIENTS);
export const useClients = () => useContext(ClientsContext);
