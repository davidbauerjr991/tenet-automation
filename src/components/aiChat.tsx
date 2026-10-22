import { useEffect, useRef, useState } from "react";
import { ArrowDown } from "lucide-react";
import { ConversationMessage, Interstitial, Link, ListItem } from "@nicecxone/lyra-ui";
import type { NewClientStage } from "./NewClientConversation";

/* ── Model ── */

export interface ChatSession {
  id: string;
  title: string;
  at: Date;
  entries: ChatEntry[];
  /** Stage of the new-client setup when the session was saved, so it can be restored with it. */
  flowStage: NewClientStage | null;
}

export type ChatEntry =
  | { id: string; kind: "user"; text: string; at: Date }
  | { id: string; kind: "ai"; text: string; at: Date; phase: "thinking" | "typing" | "done" }
  /** `frozen` is set once a newer copy of the step has been re-written below it; it records the stage it showed. */
  | { id: string; kind: "flow"; at: Date; frozen?: { stage: NewClientStage } };

const THINK_MS = 1400;

export const NEW_CLIENT_INTRO =
  "I can create a new client for you. This provisions a new tenant, applies licenses, and registers it with the cluster. To get started, tell me a bit about the business: its name, how many agents it has, its primary need for outbound, and its main office location. I'll configure the tenant from that.";

type Intent = "create-client" | "segmentation" | "greeting" | "help" | "monitor" | "client" | "thanks" | "other";

function classify(text: string): Intent {
  const t = text.toLowerCase();
  if (/(create|add|set ?up|make|new).{0,20}client|client.{0,20}(create|setup|set up)/.test(t)) return "create-client";
  if (/segment/.test(t)) return "segmentation";
  if (/\b(thanks|thank you|thx)\b/.test(t)) return "thanks";
  if (/\b(help|what can you|what do you)\b/.test(t)) return "help";
  if (/\b(hi|hello|hey|good (morning|afternoon|evening))\b/.test(t)) return "greeting";
  if (/\b(monitor|dashboard|agents?|calls?|minutes|leaderboard|kpi|totals?)\b/.test(t)) return "monitor";
  if (/client|tenant|service/.test(t)) return "client";
  return "other";
}

function answerFor(intent: Exclude<Intent, "create-client">): string {
  switch (intent) {
    case "greeting":
      return "Hi John! I can help you create a new client or walk you through the Monitor dashboard. What would you like to do?";
    case "segmentation":
      return "Segmentation isn't set up in this prototype yet, so I can't build one here. I can create a new client for you or explain the Monitor dashboard. Which would you like?";
    case "thanks":
      return "You're welcome! Let me know if there's anything else I can help with.";
    case "help":
      return "I can create a new client for you (provisioning the tenant and preparing access), and I can explain what you're seeing on the Monitor dashboard. Try “Create a new client”.";
    case "monitor":
      return "The Monitor dashboard shows today's total agents, calls and minutes compared with yesterday, the Agents MTD leaderboard, a clients table, and version and calls breakdown charts. Which part would you like to dig into?";
    case "client":
      return "Clients are set up from the New Client page, and I can run the setup for you. Just say “Create a new client” to get started.";
    default:
      return "I'm not sure how to help with that yet. I can create a new client or explain the Monitor dashboard — try “Create a new client”.";
  }
}

/* ── Hook: ordered chat log with simulated "thinking" and typing ── */

export function useAiChat(opts: {
  flowActive: boolean;
  /** Current stage of the setup flow (used to freeze the old copy when the step is re-written). */
  flowStage: NewClientStage | null;
  startFlow: () => void;
  resumeFlow: () => void;
  /** Gives the setup flow first look at what the user typed; returns an AI reply when it handled it. */
  flowInput?: (text: string) => string | { text: string; then: () => void } | null;
}) {
  const [entries, setEntries] = useState<ChatEntry[]>([]);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const idRef = useRef(0);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const onTyped = useRef<Record<string, () => void>>({});
  // Latest options, so timer callbacks never use stale closures.
  const optsRef = useRef(opts);
  optsRef.current = opts;
  const entriesRef = useRef(entries);
  entriesRef.current = entries;

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const newId = () => `e${idRef.current++}`;
  const patch = (id: string, p: Partial<ChatEntry>) =>
    setEntries((es) => es.map((e) => (e.id === id ? ({ ...e, ...p } as ChatEntry) : e)));

  /** AI reply: thinking animation → typed-out text → optional follow-up. */
  const reply = (text: string, after?: () => void) => {
    const id = newId();
    setEntries((es) => [...es, { id, kind: "ai", text, at: new Date(), phase: "thinking" }]);
    if (after) onTyped.current[id] = after;
    timers.current.push(setTimeout(() => patch(id, { phase: "typing" }), THINK_MS));
  };

  const finishTyping = (id: string) => {
    patch(id, { phase: "done" });
    const cb = onTyped.current[id];
    delete onTyped.current[id];
    cb?.();
  };

  /**
   * Re-writes the latest setup step at the bottom of the chat (after the AI has answered a question).
   * The earlier copy stays where it was, frozen as it looked, so nothing is re-ordered.
   */
  const rewriteFlow = () =>
    setEntries((es) => {
      let liveIdx = -1;
      for (let i = es.length - 1; i >= 0; i--) {
        const e = es[i];
        if (e.kind === "flow" && !e.frozen) {
          liveIdx = i;
          break;
        }
      }
      const stage = optsRef.current.flowStage;
      if (liveIdx < 0 || !stage) return es;
      const next = es.slice();
      const live = next[liveIdx];
      next[liveIdx] = { ...live, frozen: { stage } } as ChatEntry;
      next.push({ id: `e${idRef.current++}`, kind: "flow", at: new Date() });
      return next;
    });
  const hasLiveFlow = () => entriesRef.current.some((e) => e.kind === "flow" && !e.frozen);

  const send = (raw: string) => {
    const text = raw.trim();
    if (!text) return;
    setEntries((es) => [...es, { id: newId(), kind: "user", text, at: new Date() }]);
    const intent = classify(text);
    const after = hasLiveFlow() ? rewriteFlow : undefined;
    const handled = optsRef.current.flowActive ? optsRef.current.flowInput?.(text) : null;
    if (handled) {
      if (typeof handled === "string") return reply(handled, after);
      return reply(handled.text, () => {
        after?.();
        handled.then();
      });
    }
    if (intent !== "create-client") return reply(answerFor(intent), after);
    if (optsRef.current.flowActive) {
      optsRef.current.resumeFlow();
      return reply("You already have a new client setup in progress — I've taken you back to where you left off.", after);
    }
    optsRef.current.startFlow();
    reply(NEW_CLIENT_INTRO, () => setEntries((es) => [...es, { id: newId(), kind: "flow", at: new Date() }]));
  };

  const removeFlow = () => setEntries((es) => es.filter((e) => e.kind !== "flow"));
  const clear = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    onTyped.current = {};
    setEntries([]);
  };

  /** Snapshot of the current conversation (null if the user never said anything). */
  const snapshot = (flowStage: NewClientStage | null): ChatSession | null => {
    const first = entries.find((e) => e.kind === "user");
    if (!first || first.kind !== "user") return null;
    return {
      id: `s${idRef.current++}`,
      title: first.text,
      at: first.at,
      flowStage,
      entries: entries.map((e) => (e.kind === "ai" ? { ...e, phase: "done" as const } : e)),
    };
  };

  /** Saves the current conversation to history (if the user said anything), then starts a fresh one. */
  const startNewConversation = (flowStage: NewClientStage | null) => {
    const saved = snapshot(flowStage);
    if (saved) setSessions((ss) => [saved, ...ss]);
    clear();
  };

  /** Reprints a saved session as the current conversation (saving the current one first). Returns its setup stage. */
  const restore = (id: string, currentFlowStage: NewClientStage | null): NewClientStage | null => {
    const target = sessions.find((x) => x.id === id);
    if (!target) return currentFlowStage;
    const saved = snapshot(currentFlowStage);
    const rest = sessions.filter((x) => x.id !== id);
    setSessions(saved ? [saved, ...rest] : rest);
    timers.current.forEach(clearTimeout);
    timers.current = [];
    onTyped.current = {};
    setEntries(target.entries);
    return target.flowStage;
  };

  return { entries, sessions, send, reply, finishTyping, removeFlow, clear, startNewConversation, restore };
}

/* ── Presentation ── */

/**
 * Lyra's pending Interstitial ("AI agent is performing this now…"). Inside the
 * AI panel's flex layout its three bars could get squeezed narrower/shorter than in
 * the standalone component, so the spinner and each bar are pinned to their natural size.
 */
export function AgentPending({ className }: { className?: string }) {
  return (
    <Interstitial
      pending
      title=""
      timestamp=""
      by=""
      className={`[&>[data-lyra-spinner]]:shrink-0 [&_[data-lyra-bar]]:shrink-0 [&_[data-lyra-bar]]:grow-0 ${className ?? ""}`}
    />
  );
}

const timeFmt = (d: Date) => d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
const dateFmt = (d: Date) => d.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric", year: "numeric" });
const sameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString();

/** Reveals `text` a few characters at a time, as if an AI were typing it. */
function TypedText({ text, onDone }: { text: string; onDone: () => void }) {
  const [n, setN] = useState(0);
  const done = useRef(false);
  useEffect(() => {
    const id = setInterval(() => setN((c) => Math.min(c + 2, text.length)), 40);
    return () => clearInterval(id);
  }, [text]);
  useEffect(() => {
    if (n >= text.length && !done.current) {
      done.current = true;
      onDone();
    }
  }, [n, text, onDone]);
  return <>{text.slice(0, n)}</>;
}

function MessageRow({
  e,
  dateStamp,
  finishTyping,
  onTick,
}: {
  e: Exclude<ChatEntry, { kind: "flow" }>;
  dateStamp?: string;
  finishTyping: (id: string) => void;
  onTick?: (n: number) => void;
}) {
  if (e.kind === "user") {
    return (
      <ConversationMessage variant="user" showActions={false} dateStamp={dateStamp} timestamp={timeFmt(e.at)}>
        {e.text}
      </ConversationMessage>
    );
  }
  return (
    <ConversationMessage
      variant="ai"
      showActions={false}
      dateStamp={dateStamp}
      timestamp={e.phase === "done" ? timeFmt(e.at) : undefined}
    >
      {e.phase === "thinking" ? (
        <AgentPending />
      ) : e.phase === "typing" ? (
        <TypedTextTracked text={e.text} onDone={() => finishTyping(e.id)} onTick={onTick ?? (() => {})} />
      ) : (
        e.text
      )}
    </ConversationMessage>
  );
}

/**
 * The live chat. Entries keep their order; when the AI answers a question mid-setup the
 * latest step is re-written at the bottom and the earlier copy is frozen in place. The log
 * scrolls to the bottom whenever anything changes (`scrollKey` covers the live step's updates).
 */
export function AiChatLog({
  entries,
  finishTyping,
  renderFlow,
  scrollKey,
  growKey,
}: {
  entries: ChatEntry[];
  finishTyping: (id: string) => void;
  /** `frozenStage` is set for older copies of the step (render them static, without actions). */
  renderFlow: (frozenStage?: NewClientStage) => React.ReactNode;
  /** Changes whenever the live step updates in place (stage, committed profile fields…). */
  scrollKey?: unknown;
  /** Ticks while the live step types itself out: follow it while pinned, without counting it as unread. */
  growKey?: number;
}) {
  const anchorRef = useRef<HTMLDivElement>(null);
  const scrollerRef = useRef<HTMLElement | null>(null);
  const atBottomRef = useRef(true);
  const prevLenRef = useRef(0);
  const prevKeyRef = useRef(scrollKey);
  const [atBottom, setAtBottom] = useState(true);
  const [unread, setUnread] = useState(0);
  const [typedChars, setTypedChars] = useState(0);

  const jumpToBottom = (smooth = false) => {
    const el = scrollerRef.current;
    if (!el) return;
    if (smooth && typeof el.scrollTo === "function") el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    else el.scrollTop = el.scrollHeight;
  };

  // Find the panel's scrolling body and track whether the reader is at the bottom of it.
  useEffect(() => {
    const anchor = anchorRef.current;
    const el = (anchor?.closest(".overflow-y-auto") as HTMLElement | null) ?? anchor?.parentElement ?? null;
    scrollerRef.current = el;
    if (!el) return;
    const onScroll = () => {
      const near = el.scrollHeight - el.scrollTop - el.clientHeight < 48;
      atBottomRef.current = near;
      setAtBottom(near);
      if (near) setUnread(0);
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  // New content: stay pinned to the latest if the reader is at the bottom (or they just posted);
  // otherwise leave the scroll position alone and count what arrived.
  useEffect(() => {
    const addedCount = Math.max(0, entries.length - prevLenRef.current);
    const keyChanged = prevKeyRef.current !== scrollKey;
    // The reply is added in the same update as the user's message, so look at everything that was added.
    const userPosted = entries.slice(prevLenRef.current).some((e) => e.kind === "user");
    const firstRender = prevLenRef.current === 0;
    prevLenRef.current = entries.length;
    prevKeyRef.current = scrollKey;

    if (atBottomRef.current || userPosted || firstRender) {
      jumpToBottom();
      atBottomRef.current = true;
      setAtBottom(true);
      setUnread(0);
    } else if (addedCount > 0 || keyChanged) {
      setUnread((n) => n + addedCount + (keyChanged && addedCount === 0 ? 1 : 0));
    }
  }, [entries, scrollKey]);

  // Flow messages type themselves out (see Typing): follow them while pinned.
  useEffect(() => {
    const follow = () => {
      if (atBottomRef.current) jumpToBottom();
    };
    window.addEventListener("tenet-typing", follow);
    return () => window.removeEventListener("tenet-typing", follow);
  }, []);

  // Typing grows the last message: keep following it while pinned.
  useEffect(() => {
    if (atBottomRef.current) jumpToBottom();
  }, [typedChars, growKey]);

  let lastMessageAt: Date | null = null;

  return (
    <>
      {entries.map((e) => {
        if (e.kind === "flow") {
          return (
            <div key={e.id} className="flex flex-col gap-6">
              {renderFlow(e.frozen?.stage)}
            </div>
          );
        }
        const dateStamp = lastMessageAt === null || !sameDay(lastMessageAt, e.at) ? dateFmt(e.at) : undefined;
        lastMessageAt = e.at;
        return <MessageRow key={e.id} e={e} dateStamp={dateStamp} finishTyping={finishTyping} onTick={setTypedChars} />;
      })}

      {/* Zero-height sticky anchor pinned to the bottom of the scrolling panel: holds the
          "N new messages" and "Scroll to bottom" links while the reader is scrolled up. */}
      <div ref={anchorRef} className="sticky bottom-0 -mt-6 h-0 overflow-visible">
        {!atBottom && (
          <div className="pointer-events-none absolute inset-x-0 bottom-3 flex justify-center">
            <div className="pointer-events-auto flex items-center gap-3 rounded-full border border-lyra-border-subtle bg-lyra-bg-surface-overlay px-3 py-1 shadow-md">
              {unread > 0 && (
                <Link onClick={() => jumpToBottom(true)}>
                  {unread} new {unread === 1 ? "message" : "messages"}
                </Link>
              )}
              <Link onClick={() => jumpToBottom(true)}>
                <span className="inline-flex items-center gap-1">
                  <ArrowDown className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" />
                  Scroll to bottom
                </span>
              </Link>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

/* ── History ── */

const sessionStamp = (d: Date) => `${dateFmt(d)} · ${timeFmt(d)}`;

/** AI-panel history: every conversation (the current one first). Picking one reprints it in the chat. */
export function AiHistory({
  current,
  sessions,
  onSelect,
}: {
  current: ChatEntry[];
  sessions: ChatSession[];
  onSelect: (id: string) => void;
}) {
  const currentFirst = current.find((e) => e.kind === "user");
  const all: { id: string; title: string; at: Date }[] = [
    ...(currentFirst && currentFirst.kind === "user" ? [{ id: "current", title: currentFirst.text, at: currentFirst.at }] : []),
    ...sessions,
  ];

  if (all.length === 0) {
    return <p className="lyra-body-sm text-lyra-fg-secondary px-3">No conversation history.</p>;
  }
  return (
    <>
      {all.map((sn) => (
        <ListItem
          key={sn.id}
          role="button"
          tabIndex={0}
          title={sn.title}
          subtitle={sn.id === "current" ? `Current Conversation · ${sessionStamp(sn.at)}` : sessionStamp(sn.at)}
          onClick={() => onSelect(sn.id)}
          onKeyDown={(ev) => {
            if (ev.key === "Enter" || ev.key === " ") onSelect(sn.id);
          }}
        />
      ))}
    </>
  );
}

/** TypedText that also reports progress so the log can keep itself scrolled to the bottom. */
function TypedTextTracked({ text, onDone, onTick }: { text: string; onDone: () => void; onTick: (n: number) => void }) {
  useEffect(() => {
    const id = setInterval(() => onTick(Date.now()), 120);
    return () => clearInterval(id);
  }, [onTick]);
  return <TypedText text={text} onDone={onDone} />;
}
