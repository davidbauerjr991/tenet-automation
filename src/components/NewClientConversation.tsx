import { useEffect, useState } from "react";
import { Button, Checkbox, ConversationMessage, DEFAULT_REQUIREMENTS, Input, Link, PasswordInput, Select, type AIProcessStep } from "@nicecxone/lyra-ui";
import { AgentPending } from "./aiChat";

export interface TenantForm {
  name: string;
  type: string;
  buAccount: string;
  cluster: string;
  billingCycle: string;
}
export const EMPTY_TENANT_FORM: TenantForm = { name: "", type: "", buAccount: "", cluster: "", billingCycle: "" };
/** Required fields (marked * on the form) gate the Proceed button. */
export const isTenantFormValid = (f: TenantForm) => !!f.name.trim() && !!f.buAccount.trim() && !!f.cluster;

export const TENANT_TYPES = [
  { value: "internal-test", label: "Internal - Test" },
  { value: "internal-demo", label: "Internal - Demo" },
  { value: "customer-trial", label: "Customer - Trial" },
  { value: "customer-production", label: "Customer - Production" },
];
export const BILLING_CYCLES = [
  { value: "monthly", label: "Monthly" },
  { value: "quarterly", label: "Quarterly" },
  { value: "semi-annually", label: "Semi-Annually" },
  { value: "annually", label: "Annually" },
];
export const CLUSTERS = ["DO11", "DO12", "DO13", "DO14", "DO15"].map((c) => ({ value: c, label: c }));

/* ── Client profile (guided one field at a time after access is prepared) ── */

export interface ClientProfile {
  clientName: string;
  timezone: string;
  channels: string[];
}
export const EMPTY_PROFILE: ClientProfile = { clientName: "", timezone: "", channels: [] };
export const PROFILE_STEP_COUNT = 4;

/* Admin user for the new client (last guided step). */
export interface AdminUser {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}
export const EMPTY_ADMIN: AdminUser = { firstName: "", lastName: "", email: "", password: "" };
export const isValidEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e.trim());
export const isPasswordValid = (p: string) => DEFAULT_REQUIREMENTS.every((req) => req.test(p));
export const isAdminValid = (a: AdminUser) =>
  !!a.firstName.trim() && !!a.lastName.trim() && isValidEmail(a.email) && isPasswordValid(a.password);
/** First.last, lowercase, letters/digits only. */
export const adminUserName = (a: AdminUser) =>
  `${a.firstName}.${a.lastName}`.toLowerCase().replace(/[^a-z0-9.]/g, "");

/** Login portal for the new client's admin. */
export const LOGIN_PORTAL_URL =
  "https://cxone.niceincontact.com/auth/authorize?response_type=code&scope=openid&client_id=0b697ebb-4ea2-4052-b12b-d3cf12a53eca&redirect_uri=https%3A%2F%2Fcxone.niceincontact.com%2Fua%2Fv1%2Fcallback&nonce=KaQ3YWG3Lzf2fFPXq08JBQ%3D%3D";

export const TIMEZONES = [
  { value: "eastern", label: "Eastern Time (US & Canada)" },
  { value: "central", label: "Central Time (US & Canada)" },
  { value: "mountain", label: "Mountain Time (US & Canada)" },
  { value: "pacific", label: "Pacific Time (US & Canada)" },
  { value: "utc", label: "UTC" },
  { value: "london", label: "London (GMT/BST)" },
  { value: "cet", label: "Central European Time" },
  { value: "india", label: "India Standard Time" },
  { value: "aest", label: "Australian Eastern Time" },
];
export const CHANNELS = [
  { value: "voice", label: "Voice" },
  { value: "sms", label: "SMS" },
  { value: "email", label: "Email" },
  { value: "chat", label: "Chat" },
  { value: "messaging", label: "Messaging" },
];
const labelOf = (opts: { value: string; label: string }[], v: string) => opts.find((o) => o.value === v)?.label ?? v;

/* ── Business details (typed to the AI) → automatic tenant configuration ── */

export interface BusinessInfo {
  name: string;
  agents: number | null;
  need: string;
  location: string;
  /** Channels mentioned in the prompt (values from CHANNELS). */
  channels: string[];
}
export const EMPTY_BUSINESS: BusinessInfo = { name: "", agents: null, need: "", location: "", channels: [] };
export const missingBusiness = (b: BusinessInfo) =>
  [!b.name && "business name", b.agents === null && "number of agents", !b.need && "primary need for outbound", !b.location && "main office location"].filter(
    Boolean,
  ) as string[];

const NEEDS: { label: string; re: RegExp }[] = [
  { label: "Appointment Reminders", re: /appointment|reminder|scheduling|booking/i },
  { label: "Collections & Payment Reminders", re: /collection|payment|debt|past due|overdue|invoice/i },
  { label: "Renewals & Retention", re: /renewal|retention|churn|win.?back/i },
  { label: "Fraud Alerts", re: /fraud|security alert/i },
  { label: "Customer Surveys", re: /survey|feedback|nps|csat/i },
  { label: "Service Notifications", re: /notification|alert|outage|delivery|order update|notify/i },
  { label: "Marketing Campaigns", re: /marketing|promo|campaign|offer/i },
  { label: "Sales Outreach", re: /sales|lead|prospect|cold call|telemarket|outreach/i },
];
const AGENTS_RE = [
  /(\d[\d,]*)\s*\+?\s*(?:agents?|seats?|reps?|users?|employees|people|staff)\b/i,
  /\b(?:agents?|seats?|headcount|team size)\s*(?:count|:|=|of|is|are)?\s*(\d[\d,]*)/i,
];
const titleCase = (t: string) => t.trim().replace(/\b\w/g, (c) => c.toUpperCase());

/** Pulls whatever business details it can out of a free-text message, keeping what was already known. */
export function parseBusiness(text: string, prev: BusinessInfo): BusinessInfo {
  const out = { ...prev };
  const t = text.trim();

  for (const re of AGENTS_RE) {
    const m = t.match(re);
    if (m) {
      out.agents = parseInt(m[1].replace(/,/g, ""), 10);
      break;
    }
  }
  const need = NEEDS.find((n) => n.re.test(t));
  if (need) out.need = need.label;
  else {
    const lab = t.match(/(?:primary need|need|use case|purpose)\s*[:\-]\s*([^,;\n]+)/i);
    if (lab) out.need = titleCase(lab[1]);
  }
  const loc = t.match(
    /(?:main office|office|located|based|headquartered|headquarters|hq|location)(?:\s+location)?\s*(?:is\s+)?(?:in|at|:|-)\s*([^;\n.]+)/i,
  );
  let locFromLabel = false;
  if (loc) {
    out.location = loc[1].replace(/\s+(and|with|we|but)\s.*$/i, "").trim();
    locFromLabel = true;
  }
  const nm =
    t.match(/(?:business name|company name|company|business|name)\s*(?:is|:|-)\s*([^,;\n.]+)/i) ||
    t.match(/(?:[Ww]e(?:'re| are)|[Tt]his is|[Ii] work (?:at|for)|[Ii]'m with|called)\s+([A-Z][\w&'.-]*(?:\s+[A-Z&][\w&'.-]*)*)/);
  if (nm) out.name = nm[1].trim();

  // Plain comma-separated answers: "Acme Dental, 40 agents, appointment reminders, Denver, CO".
  const segs: string[] = [];
  for (const raw of t.split(/[,;\n]+/)) {
    const seg = raw.trim();
    if (!seg) continue;
    if (/^[A-Z]{2}$/.test(seg) && segs.length) segs[segs.length - 1] += `, ${seg}`;
    else segs.push(seg);
  }
  const leftovers = segs.filter(
    (sg) =>
      !AGENTS_RE.some((re) => re.test(sg)) &&
      !NEEDS.some((n) => n.re.test(sg)) &&
      !/^(?:voice|sms|text|texting|email|chat|messaging|whatsapp)$/i.test(sg) &&
      !/(?:office|located|based|headquarter|hq|location|name|need|use case|purpose|company|business)\b/i.test(sg),
  );
  for (const sg of leftovers) {
    if (/\d/.test(sg) && !/^[\w\s.&'-]+,\s*[A-Z]{2}$/.test(sg)) continue;
    // A place (Columbus, Ohio / Denver, CO) is the office location, never the business name.
    if (!out.location && !locFromLabel && (regionOf(sg) || /^[A-Za-z .'-]+,\s*[A-Z]{2}$/.test(sg))) out.location = sg;
    else if (!out.name) out.name = sg;
    else if (!out.location && !locFromLabel) out.location = sg;
  }
  const found = (["voice", "sms", "email", "chat", "messaging"] as const).filter((c) =>
    new RegExp(c === "sms" ? "\\b(sms|text(?:s|ing)?)\\b" : c === "messaging" ? "\\b(messaging|whatsapp)\\b" : `\\b${c}\\b`, "i").test(t),
  );
  if (found.length) out.channels = Array.from(new Set([...out.channels, ...found]));
  if (out.location && out.location === out.location.toLowerCase()) out.location = titleCase(out.location);
  return out;
}

type Region = { cluster: string; label: string };
const WEST: Region = { cluster: "DO11", label: "US West" };
const CENTRAL: Region = { cluster: "DO12", label: "US Central" };
const EAST: Region = { cluster: "DO13", label: "US East" };
const EUROPE: Region = { cluster: "DO14", label: "Europe" };
const APAC: Region = { cluster: "DO15", label: "Asia-Pacific" };
const REGION_WORDS: [RegExp, Region][] = [
  [/\b(california|oregon|washington state|nevada|arizona|utah|seattle|portland|san francisco|los angeles|san diego|las vegas|phoenix|vancouver|silicon valley|sacramento|san jose|oakland|honolulu)\b/i, WEST],
  [/\b(colorado|denver|texas|dallas|houston|austin|chicago|illinois|minnesota|minneapolis|wisconsin|missouri|st\.? louis|kansas|oklahoma|nebraska|iowa|salt lake|new mexico|montana|idaho|wyoming|dakota|louisiana|new orleans|arkansas|kansas city|memphis|milwaukee|omaha|oklahoma city|san antonio|el paso|indianapolis|st\\.? paul)\b/i, CENTRAL],
  [/\b(new york|boston|massachusetts|connecticut|new jersey|pennsylvania|philadelphia|maryland|baltimore|virginia|carolina|georgia|atlanta|florida|miami|orlando|tampa|ohio|michigan|detroit|tennessee|nashville|kentucky|alabama|washington,? d\.?c\.?|toronto|maine|vermont|new hampshire|columbus|cleveland|cincinnati|pittsburgh|charlotte|raleigh|buffalo|richmond|louisville|jacksonville|hartford|providence)\b/i, EAST],
  [/\b(uk|united kingdom|england|london|manchester|ireland|dublin|germany|berlin|munich|france|paris|spain|madrid|italy|rome|milan|netherlands|amsterdam|sweden|poland|europe)\b/i, EUROPE],
  [/\b(australia|sydney|melbourne|india|mumbai|bangalore|bengaluru|delhi|singapore|japan|tokyo|philippines|manila|hong kong|new zealand|asia)\b/i, APAC],
];
const STATE_REGIONS: [string[], Region][] = [
  [["CA", "OR", "WA", "NV", "AZ", "UT"], WEST],
  [["CO", "TX", "IL", "MN", "WI", "MO", "KS", "OK", "NE", "IA", "NM", "MT", "ID", "WY", "ND", "SD", "LA", "AR"], CENTRAL],
  [["NY", "NJ", "PA", "MA", "CT", "RI", "VT", "NH", "ME", "MD", "DE", "DC", "VA", "NC", "SC", "GA", "FL", "OH", "KY", "TN", "AL", "MS", "WV", "MI", "IN"], EAST],
];
function regionOf(location: string): Region | null {
  for (const [re, r] of REGION_WORDS) if (re.test(location)) return r;
  const tokens = location.match(/\b[A-Z]{2}\b/g) ?? [];
  for (const [states, r] of STATE_REGIONS) if (tokens.some((tk) => states.includes(tk))) return r;
  return null;
}

export interface ConfigReason {
  field: string;
  value: string;
  why: string;
}

/** Works out the tenant fields from the business details, with a plain-language reason for each choice. */
export function deriveTenant(b: BusinessInfo): { form: TenantForm; reasons: ConfigReason[] } {
  const agents = b.agents ?? 0;
  const region = regionOf(b.location);
  const cluster = region ?? EAST;
  let hash = 0;
  for (const ch of b.name) hash = (hash * 31 + ch.charCodeAt(0)) % 900000;
  const buAccount = String(100000 + hash);
  const cycle =
    agents >= 100
      ? { value: "annually", why: `with ${agents} agents this is a larger deployment, which usually suits a committed annual cycle.` }
      : agents >= 25
        ? { value: "quarterly", why: `a mid-sized team of ${agents} agents fits quarterly billing: predictable without a full-year commitment.` }
        : { value: "monthly", why: `a smaller team of ${agents} agents fits flexible month-to-month billing while usage settles.` };
  // e.g. perm_do13_flywheel_8vpme5: environment, cluster, client name, then a random suffix to keep it unique.
  const slug = b.name.toLowerCase().replace(/[^a-z0-9]/g, "") || "client";
  const suffix = Array.from({ length: 6 }, () => "abcdefghijklmnopqrstuvwxyz0123456789"[Math.floor(Math.random() * 36)]).join("");
  const tenantName = `perm_${cluster.cluster.toLowerCase()}_${slug}_${suffix}`;
  const form: TenantForm = {
    name: tenantName,
    type: "customer-production",
    buAccount,
    cluster: cluster.cluster,
    billingCycle: cycle.value,
  };
  const reasons: ConfigReason[] = [
    {
      field: "Tenant Name",
      value: tenantName,
      why: `I generated it from the client name: a "perm" prefix for a permanent customer, the ${cluster.cluster.toLowerCase()} cluster, "${slug}", and a random suffix so it's always unique.`,
    },
    {
      field: "Tenant Type",
      value: "Customer - Production",
      why: `${b.name} is a real customer with ${agents} agents going live, so I set it up for production rather than test, demo or trial.`,
    },
    {
      field: "BU Account Number",
      value: buAccount,
      why: "I assigned the next available business unit account number for billing. Confirm with finance if it should sit under an existing account.",
    },
    {
      field: "Cluster ID",
      value: cluster.cluster,
      why: region
        ? `Your main office is in ${b.location}, so I chose the ${region.label} cluster closest to it for the lowest latency.`
        : `I couldn't place "${b.location}" on a region, so I defaulted to the ${EAST.label} cluster. Tell me if it should be elsewhere.`,
    },
    { field: "Billing Cycle", value: labelOf(BILLING_CYCLES, cycle.value), why: cycle.why },
  ];
  return { form, reasons };
}

export interface ChangeState {
  form: TenantForm;
  profile: ClientProfile;
  admin: AdminUser;
}
export type ChangeResult = { state: ChangeState; changes: string[] } | { refusal: string } | null;

/** The value a user gave for a field: a double-quoted string, else whatever follows "to" / "is" / ":". */
function extractValue(text: string): string {
  const q = text.match(/["“”]([^"“”]+)["“”]/);
  if (q) return q[1].trim();
  let last = "";
  const re = /\b(?:to|is|be|as|:)\s+(?:just\s+|now\s+)?([^,;]+?)(?=\s+[-–—]\s|\s*$|[,;])/gi;
  for (const m of text.matchAll(re)) last = m[1];
  return last.replace(/[.!]+$/, "").trim();
}
const TZ_WORDS: [RegExp, string][] = [
  [/eastern|\best\b|\bedt\b/i, "eastern"],
  [/central time|\bcst\b|\bcdt\b|central/i, "central"],
  [/mountain|\bmst\b/i, "mountain"],
  [/pacific|\bpst\b|\bpdt\b/i, "pacific"],
  [/\butc\b/i, "utc"],
  [/london|\bgmt\b|\bbst\b|\buk\b/i, "london"],
  [/\bcet\b|europe/i, "cet"],
  [/india|\bist\b/i, "india"],
  [/aest|australia|sydney/i, "aest"],
];

/**
 * Reads a "change <field> to <value>" request. Works for any editable field on the Create New Client page
 * (tenant, client profile and admin fields) as long as the user names the field.
 */
export function applyChange(text: string, cur: ChangeState): ChangeResult {
  const t = text.toLowerCase();
  const form = { ...cur.form };
  const profile = { ...cur.profile, channels: [...cur.profile.channels] };
  const admin = { ...cur.admin };
  const changes: string[] = [];
  const val = extractValue(text);

  if (/tenant id|smartreach|prepare access/.test(t) && /(change|update|set|edit)/.test(t))
    return { refusal: "That one is generated by the system when the tenant is set up, so I can't change it." };
  if (/password/.test(t) && /(change|update|set|use|make)/.test(t))
    return { refusal: "For security I won't take a password in the chat. Please enter or change it in the password field on the page." };

  if (/\b(billing|cycle)\b/.test(t)) {
    const v = /semi[- ]?annual/.test(t) ? "semi-annually" : /annual/.test(t) ? "annually" : /quarter/.test(t) ? "quarterly" : /month/.test(t) ? "monthly" : "";
    if (v && v !== form.billingCycle) {
      form.billingCycle = v;
      changes.push(`Billing Cycle to ${labelOf(BILLING_CYCLES, v)}`);
    }
  }
  const cl = text.match(/\bDO\s?(1[1-5])\b/i);
  if ((cl || /cluster/.test(t)) && cl && `DO${cl[1]}` !== form.cluster) {
    form.cluster = `DO${cl[1]}`;
    changes.push(`Cluster ID to ${form.cluster}`);
  }
  if (/\b(tenant )?type\b|\bmake (it|this)\b|\bset (it|this)\b/.test(t) && !/time ?zone/.test(t)) {
    const v = /test/.test(t) ? "internal-test" : /demo/.test(t) ? "internal-demo" : /trial/.test(t) ? "customer-trial" : /production|prod\b|live/.test(t) ? "customer-production" : "";
    if (v && v !== form.type) {
      form.type = v;
      changes.push(`Tenant Type to ${labelOf(TENANT_TYPES, v)}`);
    }
  }
  const bu = text.match(/\b(?:bu|business unit)(?:\s+account)?(?:\s+number)?\D{0,12}(\d{4,})/i);
  if (bu && bu[1] !== form.buAccount) {
    form.buAccount = bu[1];
    changes.push(`BU Account Number to ${bu[1]}`);
  }
  if (/tenant(?:'s|’s)?\s+name|(?:company|business)(?:'s|’s)?\s+name/.test(t) && val) {
    form.name = val;
    changes.push(`Tenant Name to ${val}`);
  }
  if (/client(?:'s|’s)?\s+name|name of the client/.test(t) && val) {
    profile.clientName = val;
    changes.push(`Client Name to ${val}`);
  }
  if (/time ?zone|\btz\b/.test(t)) {
    const v = TZ_WORDS.find(([re]) => re.test(text))?.[1];
    if (v && v !== profile.timezone) {
      profile.timezone = v;
      changes.push(`Timezone to ${labelOf(TIMEZONES, v)}`);
    }
  }
  if (/channels?/.test(t)) {
    const mentioned = CHANNELS.map((c) => c.value).filter((c) =>
      new RegExp(c === "sms" ? "\\b(sms|text(?:s|ing)?)\\b" : c === "messaging" ? "\\b(messaging|whatsapp)\\b" : `\\b${c}\\b`, "i").test(text),
    );
    if (mentioned.length) {
      const next = /\b(add|include|also)\b/.test(t)
        ? Array.from(new Set([...profile.channels, ...mentioned]))
        : /\b(remove|drop|without|delete)\b/.test(t)
          ? profile.channels.filter((c) => !mentioned.includes(c))
          : mentioned;
      if (next.length && next.join() !== profile.channels.join()) {
        profile.channels = next;
        changes.push(`Channels to ${next.map((c) => labelOf(CHANNELS, c)).join(", ")}`);
      }
    }
  }
  if (/admin/.test(t)) {
    if (/e-?mail/.test(t)) {
      const em = text.match(/[^\s@,;"“”]+@[^\s@,;"“”]+\.[^\s@,;"“”.]{2,}/)?.[0];
      if (em) {
        admin.email = em;
        changes.push(`Admin Email to ${em}`);
      } else if (val) return { refusal: `“${val}” doesn't look like a valid email address. Could you check it?` };
    } else if (/first name/.test(t) && val) {
      admin.firstName = val;
      changes.push(`Admin First Name to ${val}`);
    } else if (/last name|surname/.test(t) && val) {
      admin.lastName = val;
      changes.push(`Admin Last Name to ${val}`);
    } else if (/name/.test(t) && val) {
      const [first, ...rest] = val.split(/\s+/);
      admin.firstName = first;
      if (rest.length) admin.lastName = rest.join(" ");
      changes.push(`Admin Name to ${val}`);
    }
  }
  return changes.length ? { state: { form, profile, admin }, changes } : null;
}

const TZ_RULES: [RegExp, string][] = [
  [/\b(colorado|denver|salt lake|utah|arizona|phoenix|new mexico|montana|idaho|wyoming|el paso|boise)\b/i, "mountain"],
  [/\b(uk|united kingdom|england|london|manchester|ireland|dublin)\b/i, "london"],
  [/\b(india|mumbai|bangalore|bengaluru|delhi)\b/i, "india"],
  [/\b(australia|sydney|melbourne|new zealand)\b/i, "aest"],
];
const TZ_ABBR: Record<string, string> = { CO: "mountain", UT: "mountain", AZ: "mountain", NM: "mountain", MT: "mountain", ID: "mountain", WY: "mountain" };
const NEED_CHANNELS: Record<string, string[]> = {
  "Appointment Reminders": ["sms", "voice"],
  "Collections & Payment Reminders": ["voice", "sms", "email"],
  "Renewals & Retention": ["voice", "email"],
  "Fraud Alerts": ["sms", "voice"],
  "Customer Surveys": ["sms", "email"],
  "Service Notifications": ["sms", "email"],
  "Marketing Campaigns": ["email", "sms"],
  "Sales Outreach": ["voice", "email"],
};
const REGION_TZ = new Map<Region, string>([[WEST, "pacific"], [CENTRAL, "central"], [EAST, "eastern"], [EUROPE, "cet"], [APAC, "aest"]]);

/** Client profile (name, time zone, channels) worked out from the business details typed to the AI. */
export function deriveProfile(b: BusinessInfo): { profile: ClientProfile; summary: string } {
  let tz = TZ_RULES.find(([re]) => re.test(b.location))?.[1];
  if (!tz) {
    const abbr = (b.location.match(/\b[A-Z]{2}\b/g) ?? []).map((a) => TZ_ABBR[a]).find(Boolean);
    tz = abbr ?? REGION_TZ.get(regionOf(b.location) ?? EAST) ?? "eastern";
  }
  const fromPrompt = b.channels.length > 0;
  const channels = fromPrompt ? b.channels : (NEED_CHANNELS[b.need] ?? ["voice"]);
  const profile: ClientProfile = { clientName: b.name, timezone: tz, channels };
  const summary = `Client Name: ${b.name}. Timezone: ${labelOf(TIMEZONES, tz)}, from your office in ${b.location}. Channels: ${channels.map((c) => labelOf(CHANNELS, c)).join(", ")}, ${fromPrompt ? "the ones you mentioned" : `the usual fit for ${b.need.toLowerCase()}`}.`;
  return { profile, summary };
}

export interface ExplainBlock {
  kind: "p" | "li";
  /** Bold lead-in of a list item (a prefix of `text`). */
  lead?: string;
  text: string;
}
/** The "why I configured it this way" statement, as blocks so it can be typed out progressively. */
export function explainBlocks(name: string, reasons: ConfigReason[]): ExplainBlock[] {
  return [
    { kind: "p", text: `Here's why I configured the tenant this way, based on what you told me about ${name}:` },
    ...reasons.map((r): ExplainBlock => {
      const lead = `${r.field} (${r.value})`;
      return { kind: "li", lead, text: `${lead}: ${r.why}` };
    }),
    {
      kind: "p",
      text: "Would you like anything different? Just tell me what to change (for example “change the billing cycle to annually” or “use cluster DO12”), or edit the fields yourself on the Create New Client page. When you're ready, prepare access below.",
    },
  ];
}
export const explainLength = (blocks: ExplainBlock[]) => blocks.reduce((n, b) => n + b.text.length, 0);

/* ── Typed-out AI text ── */

const typedIds = new Set<string>();
/** Forget which messages have been typed (a new client setup types everything again). */
export const resetTyped = () => typedIds.clear();

/**
 * Types `texts` out one after another, as if the AI were writing them. `children` gets the revealed
 * text of each one and whether everything has finished (so buttons and inputs can wait). A message that
 * was already typed once (`id`) — or an older, frozen copy — shows in full straight away.
 */
function Typing({
  id,
  texts,
  instant = false,
  children,
}: {
  id: string;
  texts: string[];
  instant?: boolean;
  children: (shown: string[], done: boolean) => React.ReactNode;
}) {
  const total = texts.reduce((n, t) => n + t.length, 0);
  const [n, setN] = useState(0);
  const full = instant || typedIds.has(id) || n >= total;
  useEffect(() => {
    if (full) {
      if (!instant) typedIds.add(id);
      return;
    }
    const t = setInterval(() => {
      setN((c) => Math.min(c + 3, total));
      window.dispatchEvent(new Event("tenet-typing"));
    }, 25);
    return () => clearInterval(t);
  }, [full, instant, id, total]);
  let budget = n;
  const shown = texts.map((t) => {
    if (full) return t;
    const k = Math.max(0, Math.min(t.length, budget));
    budget -= k;
    return t.slice(0, k);
  });
  return <>{children(shown, full)}</>;
}

/** Shows `text` with the characters in [from, to) of the full string in bold, cut off at what's been typed. */
function Bold({ shown, from, to }: { shown: string; from: number; to: number }) {
  return (
    <>
      {shown.slice(0, from)}
      <strong>{shown.slice(from, to)}</strong>
      {shown.slice(to)}
    </>
  );
}

export type NewClientStage = "prompt" | "running" | "done" | "preparing" | "ready";

const STEP_LABELS = [
  "Reserving Tenant ID",
  "Creating Schema",
  "Applying Licenses",
  "Registering With Cluster",
  "Wiring Auth & Routing",
  "Final Validation",
];
const STEP_MS = 1500;
const EXPLAIN_STEPS = [
  "Reviewing Business Details",
  "Choosing Tenant Type",
  "Matching Cluster to Office Location",
  "Sizing Billing Cycle",
  "Assigning BU Account Number",
];
const EXPLAIN_MS = 1100;
const ADMIN_STEPS = ["Validating Admin Details", "Creating Admin Account", "Assigning Admin Permissions", "Preparing Login Instructions"];
const ADMIN_MS = 1200;
export const SEND_STEPS = ["Composing Email", "Adding Login Instructions", "Sending to Admin"];
const SEND_MS = 1200;

/* Second phase ("Prepare Access") — step durations are in 750ms ticks. */
const ACCESS_TICK_MS = 750;
const ACCESS_STEPS: { label: string; ticks: number }[] = [
  { label: "Validating SmartReach License Constraints", ticks: 2 },
  { label: "Provisioning SmartReach", ticks: 2 },
  { label: "Looking Up New Client Details", ticks: 4 },
  { label: "Adding SmartReach License to Tenant", ticks: 2 },
  { label: "Preparing Credentials", ticks: 2 },
  { label: "Establishing Admin Session", ticks: 2 },
];
const ACCESS_TOTAL_TICKS = ACCESS_STEPS.reduce((n, s) => n + s.ticks, 0);
const LOOKUP_STEP = 2;

function formatElapsed(seconds: number) {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

interface Props {
  stage: NewClientStage;
  onProceed: () => void;
  onCancel: () => void;
  onPrepare: () => void;
  onViewSetup: () => void;
  form: TenantForm;
  onFormChange: (form: TenantForm) => void;
  /** An older copy of the step (a newer one was re-written below): static, no timers or actions. */
  frozen?: boolean;
  progress: SetupProgress;
  profile: ClientProfile;
  onProfileChange: React.Dispatch<React.SetStateAction<ClientProfile>>;
  /** How many profile fields have been committed (0–3). */
  profileStep: number;
  onCommitProfileStep: () => void;
  admin: AdminUser;
  onAdminChange: React.Dispatch<React.SetStateAction<AdminUser>>;
  /** Business details typed to the AI so far. */
  business: BusinessInfo;
  /** Show the tenant fields instead of describing the business in chat. */
  showFields: boolean;
  onShowFields: () => void;
  /** Reasons for the automatic configuration (null when the fields were entered by hand). */
  autoConfig: ConfigReason[] | null;
  /** Whether the admin's login details have been (simulated) sent, and the action to send them. */
  loginState: "idle" | "sending" | "sent";
  onSendLogin: () => void;
}

/** AI-panel conversation for the "create a new client" flow: confirm prompt → provisioning steps → done. */
export interface SetupProgress {
  /** Steps of the post-setup "why I configured it this way" review completed so far. */
  explain: number;
  /** Characters of the configuration statement typed out so far. */
  typed: number;
  /** Steps of the admin-creation process completed so far. */
  adminStep: number;
  /** Steps of the "send login details" process completed so far. */
  sendStep: number;
  activeStep: number;
  elapsed: number;
  tick: number;
}

/**
 * Drives the simulated setup (and later access-preparation) progress. Lives outside the conversation
 * component so that re-writing the step further down the chat never restarts the progress.
 */
export function useSetupProgress(stage: NewClientStage | null, onComplete: () => void, onPrepared: () => void, typedTotal = 0, creatingAdmin = false, sendingLogin = false): SetupProgress {
  const [activeStep, setActiveStep] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [tick, setTick] = useState(0);
  const [explain, setExplain] = useState(0);
  const [typed, setTyped] = useState(0);
  const [adminStep, setAdminStep] = useState(0);
  const [sendStep, setSendStep] = useState(0);
  useEffect(() => {
    if (!sendingLogin) {
      setSendStep(0);
      return;
    }
    const id = setInterval(() => setSendStep((n) => (n < SEND_STEPS.length ? n + 1 : n)), SEND_MS);
    return () => clearInterval(id);
  }, [sendingLogin]);
  useEffect(() => {
    if (!creatingAdmin) {
      setAdminStep(0);
      return;
    }
    const id = setInterval(() => setAdminStep((n) => (n < ADMIN_STEPS.length ? n + 1 : n)), ADMIN_MS);
    return () => clearInterval(id);
  }, [creatingAdmin]);

  // The configuration review starts once the tenant is set up, and survives later stages.
  const postSetup = stage === "done" || stage === "preparing" || stage === "ready";
  useEffect(() => {
    if (stage === "running" || stage === "prompt" || stage === null) setExplain(0);
    if (stage === "running" || stage === "prompt" || stage === null) setTyped(0);
  }, [stage]);
  const reviewed = explain >= EXPLAIN_STEPS.length;
  const typingDone = typed >= typedTotal;
  useEffect(() => {
    if (!postSetup || !reviewed || typingDone) return;
    const id = setInterval(() => setTyped((n) => Math.min(n + 3, typedTotal)), 30);
    return () => clearInterval(id);
  }, [postSetup, reviewed, typingDone, typedTotal]);
  useEffect(() => {
    if (!postSetup) return;
    const id = setInterval(() => setExplain((n) => (n < EXPLAIN_STEPS.length ? n + 1 : n)), EXPLAIN_MS);
    return () => clearInterval(id);
  }, [postSetup]);

  useEffect(() => {
    if (stage !== "running") return;
    setActiveStep(0);
    setElapsed(0);
    const clock = setInterval(() => setElapsed((s) => s + 1), 1000);
    const steps = setInterval(() => setActiveStep((s) => s + 1), STEP_MS);
    return () => {
      clearInterval(clock);
      clearInterval(steps);
    };
  }, [stage]);

  useEffect(() => {
    if (stage === "running" && activeStep >= STEP_LABELS.length) onComplete();
  }, [stage, activeStep, onComplete]);

  useEffect(() => {
    if (stage !== "preparing") return;
    setTick(0);
    const id = setInterval(() => setTick((t) => t + 1), ACCESS_TICK_MS);
    return () => clearInterval(id);
  }, [stage]);

  useEffect(() => {
    if (stage === "preparing" && tick >= ACCESS_TOTAL_TICKS) onPrepared();
  }, [stage, tick, onPrepared]);

  return { activeStep, elapsed, tick, explain, typed, adminStep, sendStep };
}

export function NewClientConversation({ stage, onProceed, onCancel, onPrepare, onViewSetup, form, onFormChange, frozen = false, progress, profile, onProfileChange, profileStep, onCommitProfileStep, admin, onAdminChange, business, showFields, onShowFields, autoConfig, loginState, onSendLogin }: Props) {
  const { activeStep, elapsed, tick, explain, typed, adminStep, sendStep } = progress;
  const sendSteps: AIProcessStep[] = SEND_STEPS.map((label, i) => ({
    id: `s${i}`,
    label,
    status: i < sendStep ? "done" : i === sendStep ? "active" : "pending",
  }));
  const creatingAdmin = adminStep < ADMIN_STEPS.length;
  const adminSteps: AIProcessStep[] = ADMIN_STEPS.map((label, i) => ({
    id: `m${i}`,
    label,
    status: i < adminStep ? "done" : i === adminStep ? "active" : "pending",
  }));
  const explaining = explain < EXPLAIN_STEPS.length;
  const blocks = autoConfig ? explainBlocks(business.name, autoConfig) : [];
  const typingDone = typed >= explainLength(blocks);
  let budget = typed;
  const explainSteps: AIProcessStep[] = EXPLAIN_STEPS.map((label, i) => ({
    id: `x${i}`,
    label,
    status: i < explain ? "done" : i === explain ? "active" : "pending",
  }));

  // Which access step is active, and how many ticks into it we are.
  let accessActive = 0;
  let ticksInStep = tick;
  while (accessActive < ACCESS_STEPS.length && ticksInStep >= ACCESS_STEPS[accessActive].ticks) {
    ticksInStep -= ACCESS_STEPS[accessActive].ticks;
    accessActive++;
  }
  const accessSteps: AIProcessStep[] = ACCESS_STEPS.map((st, i) => ({
    id: `a${i}`,
    label: st.label,
    status: stage === "ready" || i < accessActive ? "done" : i === accessActive ? "active" : "pending",
    description:
      i === accessActive && i === LOOKUP_STEP
        ? `This could take a minute or two, making ${ticksInStep + 1} out of 20 attempts.`
        : undefined,
  }));

  const steps: AIProcessStep[] = STEP_LABELS.map((label, i) => ({
    id: String(i),
    label,
    status: stage !== "running" || i < activeStep ? "done" : i === activeStep ? "active" : "pending",
  }));

  const frozenRunning = frozen && stage === "running";
  const frozenPreparing = frozen && stage === "preparing";

  return (
    <>
      {stage === "prompt" && (
        <ConversationMessage variant="ai" showActions={false}>
          <Typing
            id={showFields ? "prompt-fields" : "prompt-chat"}
            instant={frozen}
            texts={[
              showFields
                ? "Provide the fields required to create the tenant. Clicking Proceed runs the validation pipeline sequentially."
                : "Type a bit about the business in the message box below: its name, how many agents it has, its primary need for outbound, and its main office location. For example: “Acme Dental, 40 agents, appointment reminders, Denver, CO”.",
            ]}
          >
            {([hint], done) => (
              <div className="flex flex-col gap-4">
                <p className="lyra-body-sm text-lyra-fg-secondary">{hint}</p>
                {done && showFields && (
                  <>
                <Input
                    disabled={frozen}
                    label="Tenant Name"
                    required
                    value={form.name}
                    onChange={(e) => onFormChange({ ...form, name: e.target.value })}
                  />
                  <Select
                    disabled={frozen}
                    label="Tenant Type"
                    placeholder="Select a Type"
                    options={TENANT_TYPES}
                    value={form.type}
                    onValueChange={(v) => onFormChange({ ...form, type: v })}
                  />
                  <Input
                    disabled={frozen}
                    label="BU Account Number"
                    required
                    labelHelpText="The business unit account number this tenant is billed to."
                    inputMode="numeric"
                    value={form.buAccount}
                    onChange={(e) => onFormChange({ ...form, buAccount: e.target.value })}
                  />
                  <Select
                    disabled={frozen}
                    label="Cluster ID"
                    required
                    placeholder="Select a Cluster"
                    options={CLUSTERS}
                    value={form.cluster}
                    onValueChange={(v) => onFormChange({ ...form, cluster: v })}
                  />
                  <Select
                    disabled={frozen}
                    label="Billing Cycle"
                    placeholder="Select a Billing Cycle"
                    options={BILLING_CYCLES}
                    value={form.billingCycle}
                    onValueChange={(v) => onFormChange({ ...form, billingCycle: v })}
                  />
                  </>
                )}
                {done && !frozen && (
                  <div className="flex flex-wrap gap-2">
                    {showFields && isTenantFormValid(form) && <Button onClick={onProceed}>Proceed</Button>}
                    {!showFields && <Button variant="outline" onClick={onShowFields}>Enter Fields Instead</Button>}
                    <Button variant="outline" onClick={onCancel}>Nevermind, Create Manually</Button>
                  </div>
                )}
              </div>
            )}
          </Typing>
        </ConversationMessage>
      )}

      {stage !== "prompt" && (
        <ConversationMessage
          variant="ai"
          showActions={false}
          // `processExpanded` is only a default, so remount (via key) to collapse once the steps finish.
          key={stage === "running" ? "setup-running" : "setup-finished"}
          process={frozenRunning ? undefined : steps}
          processLabel={stage === "running" ? "Setting Up Your Tenant…" : "Tenant Setup Complete"}
          processExpanded={stage === "running"}
        >
          <Typing
            id={stage === "running" ? "setup-running" : "setup-ready"}
            instant={frozen}
            texts={
              stage === "running"
                ? ["Setting up your tenant…", "This usually takes about a minute — please keep this tab open."]
                : ["Your new client's tenant is ready. Next, prepare access to configure it."]
            }
          >
            {(t, done) => (
              <div className="flex flex-col gap-1">
                {stage === "running" ? (
                  <>
                    <div className="flex items-center justify-between gap-2">
                      <span className="lyra-body-md-emphasis">{t[0]}</span>
                      {!frozenRunning && <span className="lyra-body-sm text-lyra-fg-secondary">{formatElapsed(elapsed)} elapsed</span>}
                    </div>
                    <p className="lyra-body-sm text-lyra-fg-secondary">{t[1]}</p>
                    {!frozenRunning && <AgentPending className="pt-1" />}
                  </>
                ) : (
                  <p className="lyra-body-md">{t[0]}</p>
                )}
                {stage !== "running" && done && (
                  <div>
                    <Link onClick={onViewSetup}>View Client Setup</Link>
                  </div>
                )}
                {stage === "done" && !frozen && !autoConfig && done && (
                  <div className="pt-1">
                    <Button onClick={onPrepare}>Prepare Access</Button>
                  </div>
                )}
              </div>
            )}
          </Typing>
        </ConversationMessage>
      )}

      {stage !== "prompt" && stage !== "running" && autoConfig && (
        <ConversationMessage
          variant="ai"
          showActions={false}
          // `processExpanded` is only a default, so remount (via key) to collapse once the review finishes.
          key={explaining ? "explain-running" : "explain-finished"}
          process={frozen && explaining ? undefined : explainSteps}
          processLabel={explaining ? "Reviewing Your Configuration…" : "Configuration Reviewed"}
          processExpanded={explaining}
        >
          {explaining ? (
            frozen ? (
              <p className="lyra-body-md">Reviewing the configuration I chose for {business.name}…</p>
            ) : (
              <AgentPending />
            )
          ) : (
            <div className="flex flex-col gap-3">
              {(() => {
                const shown = blocks.map((bl) => {
                  const n = Math.max(0, Math.min(bl.text.length, budget));
                  budget -= n;
                  return { bl, n };
                });
                const paras = shown.filter((x) => x.bl.kind === "p" && x.n > 0);
                const items = shown.filter((x) => x.bl.kind === "li" && x.n > 0);
                const intro = shown[0];
                const outro = shown[shown.length - 1];
                return (
                  <>
                    <p className="lyra-body-md">{intro.bl.text.slice(0, intro.n)}</p>
                    {items.length > 0 && (
                      <ul className="lyra-body-md flex list-disc flex-col gap-1 pl-6">
                        {items.map(({ bl, n }) => (
                          <li key={bl.text}>
                            <strong>{bl.text.slice(0, Math.min(n, bl.lead!.length))}</strong>
                            {bl.text.slice(bl.lead!.length, n)}
                          </li>
                        ))}
                      </ul>
                    )}
                    {outro.n > 0 && paras.length > 1 && <p className="lyra-body-md">{outro.bl.text.slice(0, outro.n)}</p>}
                  </>
                );
              })()}
              {typingDone && stage === "done" && !frozen && (
                <div>
                  <Button onClick={onPrepare}>Prepare Access</Button>
                </div>
              )}
            </div>
          )}
        </ConversationMessage>
      )}

      {(stage === "preparing" || stage === "ready") && (
        <ConversationMessage
          variant="ai"
          showActions={false}
          key={stage === "preparing" ? "access-running" : "access-finished"}
          process={frozenPreparing ? undefined : accessSteps}
          processLabel={stage === "ready" ? "Access Prepared" : "Preparing Access…"}
          processExpanded={stage === "preparing"}
        >
          {stage === "ready" ? (
            <Typing id="access-ready" instant={frozen} texts={["Access is ready. The SmartReach details are now on the page."]}>
              {([t]) => <p className="lyra-body-md">{t}</p>}
            </Typing>
          ) : frozenPreparing ? (
            <p className="lyra-body-md">Preparing access to configure this tenant…</p>
          ) : (
            <AgentPending />
          )}
        </ConversationMessage>
      )}

      {stage === "ready" && !frozen && (
        <>
          {autoConfig ? (
            <ConversationMessage variant="ai" showActions={false}>
              <Typing
                id="profile-auto"
                texts={[
                  "I've filled in the client profile from your original details, and it's on the Create New Client page now:",
                  `Client Name: ${profile.clientName}`,
                  `Timezone: ${labelOf(TIMEZONES, profile.timezone)}, based on your office in ${business.location}`,
                  `Channels: ${profile.channels.map((c) => labelOf(CHANNELS, c)).join(", ")}${business.channels.length > 0 ? ", the ones you mentioned" : `, the usual fit for ${business.need.toLowerCase()}`}`,
                  "You can edit any of them on the page. One last thing: I need the admin.",
                ]}
              >
                {(t) => (
                  <div className="flex flex-col gap-2">
                    <p className="lyra-body-md">{t[0]}</p>
                    {t[1] && (
                      <ul className="lyra-body-md flex list-disc flex-col gap-1 pl-6">
                        {t.slice(1, 4).map((x, i) => x && <li key={i}>{x}</li>)}
                      </ul>
                    )}
                    {t[4] && <p className="lyra-body-md">{t[4]}</p>}
                  </div>
                )}
              </Typing>
            </ConversationMessage>
          ) : (
            <>
              <ConversationMessage variant="ai" showActions={false}>
                <Typing
                  id="profile-great"
                  texts={[`Great! Let's finish setting up your client profile. I need a few more details about ${business.name || form.name.trim() || "this client"} to get everything configured properly.`]}
                >
                  {([t]) => <p className="lyra-body-md">{t}</p>}
                </Typing>
              </ConversationMessage>

              {profileStep > 0 && (
                <ConversationMessage variant="user" showActions={false}>
                  Client Name: {profile.clientName}
                </ConversationMessage>
              )}
              {profileStep > 1 && (
                <ConversationMessage variant="user" showActions={false}>
                  Timezone: {labelOf(TIMEZONES, profile.timezone)}
                </ConversationMessage>
              )}
              {profileStep > 2 && (
                <ConversationMessage variant="user" showActions={false}>
                  Channels: {profile.channels.map((c) => labelOf(CHANNELS, c)).join(", ")}
                </ConversationMessage>
              )}
            </>
          )}

          {profileStep > 3 && (
            <ConversationMessage variant="user" showActions={false}>
              Admin: {admin.firstName.trim()} {admin.lastName.trim()}, {admin.email.trim()}
            </ConversationMessage>
          )}

          {profileStep < PROFILE_STEP_COUNT && (
            <ConversationMessage variant="ai" showActions={false} key={`profile-${profileStep}`}>
              <div className="flex flex-col gap-4">
                {profileStep === 0 && (
                  <Input
                    label="Client Name"
                    required
                    value={profile.clientName}
                    onChange={(e) => onProfileChange({ ...profile, clientName: e.target.value })}
                  />
                )}
                {profileStep === 1 && (
                  <Select
                    label="Timezone"
                    required
                    placeholder="Select a Timezone"
                    options={TIMEZONES}
                    value={profile.timezone}
                    onValueChange={(v) => onProfileChange({ ...profile, timezone: v })}
                  />
                )}
                {profileStep === 2 && (
                  <fieldset className="flex flex-col gap-2">
                    <legend className="lyra-body-md text-lyra-fg-secondary pb-1">Channels</legend>
                    {CHANNELS.map((c) => (
                      <Checkbox
                        key={c.value}
                        label={c.label}
                        checked={profile.channels.includes(c.value)}
                        onCheckedChange={(v) =>
                          onProfileChange((prev) => ({
                            ...prev,
                            channels: v === true ? [...prev.channels.filter((x) => x !== c.value), c.value] : prev.channels.filter((x) => x !== c.value),
                          }))
                        }
                      />
                    ))}
                  </fieldset>
                )}
                {profileStep === 3 && (
                  <Typing
                    id="admin-intro"
                    texts={["Last step: who should be the admin for this client? Please give their first and last name, a valid email address and a password."]}
                  >
                    {([t], done) => (
                      <>
                        <p className="lyra-body-md">{t}</p>
                        {done && (
                          <>
                            <Input
                              label="Admin First Name"
                              required
                              value={admin.firstName}
                              onChange={(e) => onAdminChange((a) => ({ ...a, firstName: e.target.value }))}
                            />
                            <Input
                              label="Admin Last Name"
                              required
                              value={admin.lastName}
                              onChange={(e) => onAdminChange((a) => ({ ...a, lastName: e.target.value }))}
                            />
                            <Input
                              label="Admin Email"
                              required
                              type="email"
                              value={admin.email}
                              error={admin.email.trim() && !isValidEmail(admin.email) ? "Enter a valid email address" : undefined}
                              onChange={(e) => onAdminChange((a) => ({ ...a, email: e.target.value }))}
                            />
                            <PasswordInput
                              label="Admin Password"
                              required
                              showRequirements
                              autoComplete="new-password"
                              value={admin.password}
                              onChange={(v) => onAdminChange((a) => ({ ...a, password: v }))}
                            />
                          </>
                        )}
                      </>
                    )}
                  </Typing>
                )}
                <div>
                  <Button
                    onClick={onCommitProfileStep}
                    disabled={
                      (profileStep === 0 && !profile.clientName.trim()) ||
                      (profileStep === 1 && !profile.timezone) ||
                      (profileStep === 2 && profile.channels.length === 0) ||
                      (profileStep === 3 && !isAdminValid(admin))
                    }
                  >
                    Continue
                  </Button>
                </div>
              </div>
            </ConversationMessage>
          )}

          {profileStep >= PROFILE_STEP_COUNT && (
            <ConversationMessage
              variant="ai"
              showActions={false}
              // `processExpanded` is only a default, so remount (via key) to collapse once the admin is created.
              key={creatingAdmin ? "admin-running" : "admin-finished"}
              process={adminSteps}
              processLabel={creatingAdmin ? "Creating Admin User…" : "Admin User Created"}
              processExpanded={creatingAdmin}
            >
              {creatingAdmin ? (
                <AgentPending />
              ) : (
                <Typing
                  id="admin-final"
                  texts={[
                    "All set! Your client profile and admin user have been added to the Create New Client page. Here are your admin's login instructions:",
                    "Open the login portal using the link below.",
                    `Sign in with the user name ${adminUserName(admin)} and the password set above.`,
                    `If asked to verify the account, use the email address ${admin.email.trim()}.`,
                  ]}
                >
                  {(t, done) => (
                    <div className="flex flex-col gap-2">
                      <p className="lyra-body-md">{t[0]}</p>
                      {t[1] && (
                        <ol className="lyra-body-md ml-6 flex list-decimal flex-col gap-1">
                          <li>{t[1]}</li>
                          {t[2] && (
                            <li>
                              <Bold shown={t[2]} from={"Sign in with the user name ".length} to={"Sign in with the user name ".length + adminUserName(admin).length} />
                            </li>
                          )}
                          {t[3] && <li>{t[3]}</li>}
                        </ol>
                      )}
                      {done && (
                        <>
                          <div>
                            <Link onClick={() => window.open(LOGIN_PORTAL_URL, "_blank", "noopener,noreferrer")}>
                              Open the Login Portal
                            </Link>
                          </div>
                          {loginState === "idle" && !frozen && (
                            <div className="pt-1">
                              <Button onClick={onSendLogin}>Send Login Details</Button>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </Typing>
              )}
            </ConversationMessage>
          )}

          {profileStep >= PROFILE_STEP_COUNT && loginState !== "idle" && (
            <ConversationMessage
              variant="ai"
              showActions={false}
              key={loginState === "sending" ? "send-running" : "send-finished"}
              process={frozen && loginState === "sending" ? undefined : sendSteps}
              processLabel={loginState === "sending" ? "Sending Login Details…" : "Login Details Sent"}
              processExpanded={loginState === "sending"}
            >
              {loginState === "sending" ? (
                frozen ? <p className="lyra-body-md">Sending the login details…</p> : <AgentPending />
              ) : (
                <Typing
                  id="login-sent"
                  instant={frozen}
                  texts={[`Login details sent to ${admin.email.trim()}. They can sign in with the user name ${adminUserName(admin)} once they have the password.`]}
                >
                  {([t]) => <p className="lyra-body-md">{t}</p>}
                </Typing>
              )}
            </ConversationMessage>
          )}
        </>
      )}
    </>
  );
}
