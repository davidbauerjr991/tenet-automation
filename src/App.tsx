import { useState, useRef, useEffect } from "react";
import {
  Plus,
  X,
  Gauge,
  Settings,
  BarChart3,
  LayoutDashboard,
  Megaphone,
  ConciergeBell,
  Users,
  Ticket,
  Contact,
  UserCog,
  Phone,
  Mail,
  MessageSquare,
  Globe,
  MessagesSquare,
  ArrowLeftRight,
  CircleHelp,
  Bell,
} from "lucide-react";
import {
  AdminShell,
  Button,
  AiIcon,
  AppHeader,
  AppNameMenu,
  CXoneLogo,
  LeftNav,
  ContentArea,
  Container,
  ActionIconButton,
  ProfileMenu,
  defaultProfileMenuGroups,
  DashboardIcon,
  AiPanel,
  Modal,
  Toast,
  ToastContainer,
  WarningIcon,
  useToast,
  type DraggableVariant,
  type AppMenuGroup,
  type NavItem,
  type AiPanelSuggestion,
  type TreeMenuItem,
} from "@nicecxone/lyra-ui";
import appIcon from "./assets/app-icon.svg";
import { MonitorDashboard } from "./components/MonitorDashboard";
import { ClientsPage } from "./components/ClientsPage";
import { ClientsContext, INITIAL_CLIENTS, type ClientRow } from "./data/clients";
import { NewClientPage } from "./components/NewClientPage";
import { CreateFlowPage, newTenantId, type CreateFlow, type CreateRun } from "./components/CreateStepper";
import { CreateClientPage } from "./components/CreateClientPage";
import {
  EMPTY_ADMIN,
  EMPTY_PROFILE,
  EMPTY_TENANT_FORM,
  EMPTY_BUSINESS,
  type BusinessInfo,
  type ConfigReason,
  parseBusiness,
  missingBusiness,
  deriveTenant,
  resetTyped,
  SEND_STEPS,
  deriveProfile,
  explainBlocks,
  explainLength,
  applyChange,
  NewClientConversation,
  useSetupProgress,
  type AdminUser,
  type ClientProfile,
  type NewClientStage,
  type TenantForm,
} from "./components/NewClientConversation";
import { AiChatLog, AiHistory, useAiChat } from "./components/aiChat";

/* ── Nav data (Outbound Engagement) ── */
const PANEL_ITEMS: TreeMenuItem[] = [
  { label: "Campaigns", active: true },
  { label: "Contact Lists" },
  { label: "Do Not Call" },
  { label: "Call Results" },
  { label: "Scripts" },
  { label: "Schedules" },
  { label: "Reports" },
  { label: "Settings" },
];

/* ── Left nav tree (collapses to an icon rail) ── */
const NAV_ITEMS: NavItem[] = [
  { icon: <Gauge className="h-4 w-4" strokeWidth={1.5} />, label: "Monitor", active: true },
  {
    icon: <LayoutDashboard className="h-4 w-4" strokeWidth={1.5} />,
    label: "Dashboards",
    expandable: true,
    children: [{ label: "Dashboards Item 1" }, { label: "Dashboards Item 2" }, { label: "Dashboards Item 3" }],
  },
  {
    icon: <Megaphone className="h-4 w-4" strokeWidth={1.5} />,
    label: "Campaigns",
    expandable: true,
    children: [{ label: "Campaigns Item 1" }, { label: "Campaigns Item 2" }, { label: "Campaigns Item 3" }],
  },
  {
    icon: <ConciergeBell className="h-4 w-4" strokeWidth={1.5} />,
    label: "Services",
    expandable: true,
    children: [
      { label: "New Client" },
      { label: "Delete Client" },
      { label: "Clients" },
      { label: "Call Centers" },
      { label: "Service Groups" },
      { label: "Services" },
      { label: "Client Rate" },
      { label: "Business Unit" },
    ],
  },
  {
    icon: <Users className="h-4 w-4" strokeWidth={1.5} />,
    label: "Agents",
    expandable: true,
    children: [{ label: "Agents Item 1" }, { label: "Agents Item 2" }, { label: "Agents Item 3" }],
  },
  {
    icon: <Ticket className="h-4 w-4" strokeWidth={1.5} />,
    label: "Ticketing",
    expandable: true,
    children: [{ label: "Ticketing Item 1" }, { label: "Ticketing Item 2" }, { label: "Ticketing Item 3" }],
  },
  {
    icon: <Contact className="h-4 w-4" strokeWidth={1.5} />,
    label: "Contacts",
    expandable: true,
    children: [{ label: "Contacts Item 1" }, { label: "Contacts Item 2" }, { label: "Contacts Item 3" }],
  },
  {
    icon: <UserCog className="h-4 w-4" strokeWidth={1.5} />,
    label: "Account",
    expandable: true,
    children: [{ label: "Account Item 1" }, { label: "Account Item 2" }, { label: "Account Item 3" }],
  },
  {
    icon: <Phone className="h-4 w-4" strokeWidth={1.5} />,
    label: "Voice",
    expandable: true,
    children: [{ label: "Voice Item 1" }, { label: "Voice Item 2" }, { label: "Voice Item 3" }],
  },
  {
    icon: <Mail className="h-4 w-4" strokeWidth={1.5} />,
    label: "Email",
    expandable: true,
    children: [{ label: "Email Item 1" }, { label: "Email Item 2" }, { label: "Email Item 3" }],
  },
  {
    icon: <MessageSquare className="h-4 w-4" strokeWidth={1.5} />,
    label: "SMS",
    expandable: true,
    children: [{ label: "SMS Item 1" }, { label: "SMS Item 2" }, { label: "SMS Item 3" }],
  },
  {
    icon: <Globe className="h-4 w-4" strokeWidth={1.5} />,
    label: "Web Widget",
    expandable: true,
    children: [{ label: "Web Widget Item 1" }, { label: "Web Widget Item 2" }, { label: "Web Widget Item 3" }],
  },
  {
    icon: <MessagesSquare className="h-4 w-4" strokeWidth={1.5} />,
    label: "Messaging",
    expandable: true,
    children: [{ label: "Messaging Item 1" }, { label: "Messaging Item 2" }, { label: "Messaging Item 3" }],
  },
  {
    icon: <ArrowLeftRight className="h-4 w-4" strokeWidth={1.5} />,
    label: "Input / Output",
    expandable: true,
    children: [{ label: "Input / Output Item 1" }, { label: "Input / Output Item 2" }, { label: "Input / Output Item 3" }],
  },
  {
    icon: <BarChart3 className="h-4 w-4" strokeWidth={1.5} />,
    label: "Reporting",
    expandable: true,
    children: [{ label: "Reporting Item 1" }, { label: "Reporting Item 2" }, { label: "Reporting Item 3" }],
  },
  {
    icon: <Settings className="h-4 w-4" strokeWidth={1.5} />,
    label: "System",
    expandable: true,
    children: [{ label: "System Item 1" }, { label: "System Item 2" }, { label: "System Item 3" }],
  },
];

/* ── App menu — page-switcher content (Agent Next Gen / Agent Workspace
   Premium / Outbound Engagement), "Outbound Engagement" active. Click-to-open
   wiring comes from the shared `AppNameMenu` component. ── */
const APP_MENU_GROUPS: AppMenuGroup[] = [
  {
    items: [
      { label: "Agent Next Gen" },
      { label: "Agent Workspace Premium" },
      { label: "Outbound Engagement", active: true },
    ],
  },
];

function AppNameWithMenu({ name }: { name: string }) {
  return (
    <AppNameMenu
      icon={<img src={appIcon} alt="" className="h-6 w-6" />}
      name={name}
      groups={APP_MENU_GROUPS}
      menuFooter={<CXoneLogo />}
    />
  );
}

const HEADER_ACTIONS = (
  <>
    <ActionIconButton size="xl" title="Help">
      <CircleHelp className="h-5 w-5" strokeWidth={1.5} />
    </ActionIconButton>
    <ActionIconButton size="xl" title="Dashboards">
      <DashboardIcon className="text-lyra-fg-default" />
    </ActionIconButton>
    <ActionIconButton size="xl" title="Notifications" badge={4}>
      <Bell className="h-5 w-5" strokeWidth={1.5} />
    </ActionIconButton>
    <ProfileMenu
      initials="JS"
      avatarColor="#5d6a79"
      groups={defaultProfileMenuGroups}
      showThemeToggle
      className="ml-1"
    />
  </>
);

const AI_PANEL_DEFAULT_WIDTH = 360;
const AI_SUGGESTIONS: AiPanelSuggestion[] = [
  { id: "1", label: "Create a new client" },
  { id: "2", label: "What does the Monitor dashboard show?" },
  { id: "3", label: "Create a segmentation" },
];

/**
 * App chrome (AppHeader + icon LeftNav + ContentArea/Container) plus a fully wired "Ask AI" panel using
 * the same docking/undocking + resize behavior as the Agent Next Gen
 * template (see AgentNextGenTemplate.stories.tsx) — draggable float mode by
 * default, dockable into the layout, resizable while docked.
 *
 * This demo only ever wires up ONE Draggable panel — for a demo with
 * MULTIPLE Draggable panels sharing a single dock slot under an AppHeader
 * (the same shape of problem as this file's AI panel + Agent Next Gen's
 * Notifications panel, but in an isolated, controllable Storybook sandbox),
 * see Draggable.stories.tsx's `MultiplePanelsSingleDock` story and its
 * "App Header" control.
 */
type Section = "monitor" | "clients" | "new-client-home" | "new-client";

function withSelection(items: NavItem[], section: Section, select: (s: Section) => void, onNewClient: () => void): NavItem[] {
  return items.map((item) => {
    if (item.label === "Monitor") return { ...item, active: section === "monitor", onClick: () => select("monitor") };
    if (item.label === "Services") {
      return {
        ...item,
        active: section !== "monitor",
        defaultOpen: section !== "monitor",
        children: item.children?.map((c) => {
          if (c.label === "New Client") {
            return { ...c, active: section === "new-client-home" || section === "new-client", onClick: onNewClient };
          }
          if (c.label === "Clients") return { ...c, active: section === "clients", onClick: () => select("clients") };
          return c;
        }),
      };
    }
    return { ...item, active: false };
  });
}

function AppChrome({ children }: { children: (ctx: { onAskAi: () => void; section: Section; clientStage: NewClientStage | null; tenantForm: TenantForm; setTenantForm: (f: TenantForm) => void; profile: ClientProfile; setProfile: React.Dispatch<React.SetStateAction<ClientProfile>>; profileStep: number; admin: AdminUser; setAdmin: React.Dispatch<React.SetStateAction<AdminUser>>; dirty: boolean; saveClient: () => void; requestLeave: (leave: () => void) => void; startNewClient: () => void; goMonitor: () => void; goNewClientHome: () => void; createFlow: CreateFlow; addToast: ReturnType<typeof useToast>["addToast"]}) => React.ReactNode }) {
  const [navOpen, setNavOpen] = useState(false);
  const [section, setSection] = useState<Section>("monitor");
  // Bumped only when code (not the user) navigates, to remount LeftNav so Services opens via defaultOpen.
  const [navKey, setNavKey] = useState(0);
  const [clientStage, setClientStage] = useState<NewClientStage | null>(null);
  const [tenantForm, setTenantForm] = useState<TenantForm>(EMPTY_TENANT_FORM);
  const [profile, setProfile] = useState<ClientProfile>(EMPTY_PROFILE);
  // Client-profile fields committed so far (guided one at a time once access is prepared).
  const [profileStep, setProfileStep] = useState(0);
  const [admin, setAdmin] = useState<AdminUser>(EMPTY_ADMIN);
  // Create on the New Client home page opens a blank Create New Client page (until the AI flow starts).
  const [blankCreate, setBlankCreate] = useState(false);
  const [createRun, setCreateRun] = useState<CreateRun | null>(null);
  const createFlow: CreateFlow = {
    blank: blankCreate,
    run: createRun,
    start: (name, code) => {
      setCreateRun({ name, code, tenantId: newTenantId(), phase: "running" });
      setBlankCreate(true);
      setSection("new-client");
      setNavOpen(true);
      setNavKey((k) => k + 1);
    },
    finish: () => setCreateRun((r) => (r ? { ...r, phase: "done" } : r)),
    back: () => {
      setCreateRun(null);
      setBlankCreate(false);
      setSection("new-client-home");
    },
  };
  // Business details typed to the AI, the reasons for the tenant fields derived from them, and the manual-fields option.
  const [business, setBusiness] = useState<BusinessInfo>(EMPTY_BUSINESS);
  const [autoConfig, setAutoConfig] = useState<ConfigReason[] | null>(null);
  const [showFields, setShowFields] = useState(false);
  const [loginState, setLoginState] = useState<"idle" | "sending" | "sent">("idle");
  const resetNewClient = () => {
    resetTyped();
    setBusiness(EMPTY_BUSINESS);
    setAutoConfig(null);
    setShowFields(false);
    setLoginState("idle");
    setTenantForm(EMPTY_TENANT_FORM);
    setProfile(EMPTY_PROFILE);
    setProfileStep(0);
    setAdmin(EMPTY_ADMIN);
    setSavedSnapshot(null);
    setSavedClientId(null);
    setBlankCreate(false);
    setCreateRun(null);
  };

  // Save / unsaved-changes tracking for the Create New Client page.
  const { toasts, addToast, dismissToast } = useToast();
  const snapshot = JSON.stringify({ tenantForm, profile, profileStep, admin });
  const [savedSnapshot, setSavedSnapshot] = useState<string | null>(null);
  const dirty = snapshot !== savedSnapshot;
  const [pendingLeave, setPendingLeave] = useState<(() => void) | null>(null);
  // Shared clients list (Monitor card + Clients page). Saving upserts this client's row.
  const [clients, setClients] = useState<ClientRow[]>(INITIAL_CLIENTS);
  const [savedClientId, setSavedClientId] = useState<string | null>(null);
  const saveClient = () => {
    const id = savedClientId ?? `new-${Date.now()}`;
    const row: ClientRow = {
      id,
      client: profile.clientName.trim() || tenantForm.name.trim() || "New Client",
      version: "23.0",
      acdVersion: "a",
      shard: tenantForm.cluster ? tenantForm.cluster.toLowerCase() : "na4b",
      calls: 0,
      callsMtd: 0,
      hciMtd: 0,
      smsMtd: 0,
      emailMtd: 0,
      minsMtd: 0,
      agentsMtd: 0,
    };
    setClients((cs) => (cs.some((c) => c.id === id) ? cs.map((c) => (c.id === id ? row : c)) : [...cs, row]));
    setSavedClientId(id);
    setSavedSnapshot(snapshot);
    addToast({ variant: "success", title: "Success!", message: "Client Successfully Saved", duration: 4000 });
  };
  /** Runs `leave` now, or asks first ("save before you leave?") when there are unsaved changes. */
  const requestLeave = (leave: () => void) => {
    if (dirty) setPendingLeave(() => leave);
    else leave();
  };
  const resumeNewClient = () => {
    setAiPanelOpen(true);
    if (clientStage !== null && clientStage !== "prompt") {
      setSection("new-client");
      setNavOpen(true);
      setNavKey((k) => k + 1);
    }
  };
  const chat = useAiChat({
    flowActive: clientStage !== null,
    flowStage: clientStage,
    startFlow: () => setClientStage("prompt"),
    resumeFlow: resumeNewClient,
    flowInput: (text) => {
      if (clientStage === "prompt" && !showFields) {
        if (/\?|^\s*(hi|hello|hey|thanks|thank you|help|what|how|why)\b/i.test(text) && !/\d/.test(text)) return null;
        const next = parseBusiness(text, business);
        if (JSON.stringify(next) === JSON.stringify(business)) return null;
        setBusiness(next);
        const missing = missingBusiness(next);
        if (missing.length) {
          return `Thanks, I've noted that. I still need the ${missing.join(", ").replace(/, ([^,]*)$/, " and $1")}. You can type it in the message box, or use “Enter Fields Instead” to fill in the tenant fields yourself.`;
        }
        const { form, reasons } = deriveTenant(next);
        setTenantForm(form);
        setAutoConfig(reasons);
        return {
          text: `Thanks! That's everything I need for ${next.name}. I'm setting up the tenant now, and I'll explain how I configured it once it's ready.`,
          then: proceedNewClient,
        };
      }
      if (clientStage !== null && clientStage !== "prompt") {
        const change = applyChange(text, { form: tenantForm, profile, admin });
        if (!change) return null;
        if ("refusal" in change) return change.refusal;
        setTenantForm(change.state.form);
        setProfile(change.state.profile);
        setAdmin(change.state.admin);
        return `Done. I changed the ${change.changes.join(" and the ")}. The Create New Client page now reflects it, and you can still edit any of these fields there directly.`;
      }
      return null;
    },
  });
  // "+ New Client": sends "Create a new client" to the AI (thinking → typed reply),
  // or resumes the flow where the user left off.
  const startNewClient = () => {
    setAiPanelOpen(true);
    if (clientStage === null) chat.send("Create a new client");
    else resumeNewClient();
  };
  // Proceed: start provisioning and show the entered details on the Create New Client page.
  const proceedNewClient = () => {
    setClientStage("running");
    setSection("new-client");
    setNavOpen(true);
    setNavKey((k) => k + 1);
  };
  const completeNewClient = () => setClientStage("done");
  const setupProgress = useSetupProgress(
    clientStage,
    completeNewClient,
    () => {
      setClientStage("ready");
      // Auto-configured clients get their profile (name, timezone, channels) filled in from the original prompt.
      if (autoConfig) {
        setProfile(deriveProfile(business).profile);
        setProfileStep(3);
      }
    },
    autoConfig ? explainLength(explainBlocks(business.name, autoConfig)) : 0,
    profileStep >= 4,
    loginState !== "idle",
  );
  useEffect(() => {
    if (loginState === "sending" && setupProgress.sendStep >= SEND_STEPS.length) {
      setLoginState("sent");
      addToast({ variant: "success", title: "Success!", message: `Login details sent to ${admin.email.trim()}`, duration: 4000 });
    }
  });
  const navItems = withSelection(NAV_ITEMS, section, setSection, () => setSection("new-client-home"));
  const containerRef = useRef<HTMLDivElement>(null);

  type PanelState = "closed" | "open" | "closing";

  const [aiPanelOpen,  setAiPanelOpen]  = useState(false);
  const [aiMounted,    setAiMounted]    = useState(false);
  const [aiState,      setAiState]      = useState<PanelState>("closed");
  const [aiVariant,    setAiVariant]    = useState<DraggableVariant>("docked");
  const [aiWidth,      setAiWidth]      = useState(AI_PANEL_DEFAULT_WIDTH);
  const [aiHeight,     setAiHeight]     = useState(860);
  const [aiIsResizing, setAiIsResizing] = useState(false);
  const aiFloatLeft = useRef<number | null>(null);
  const aiFloatTop  = useRef<number | null>(null);
  const aiPanelRef  = useRef<HTMLDivElement>(null);
  const aiAnimTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const MAX_PANEL_HEIGHT = 860;
  const BOTTOM_PADDING   = 8;

  const computePanelHeight = () => {
    if (!containerRef.current) return MAX_PANEL_HEIGHT;
    const top = containerRef.current.getBoundingClientRect().top;
    return Math.min(window.innerHeight - top - BOTTOM_PADDING, MAX_PANEL_HEIGHT);
  };

  useEffect(() => {
    clearTimeout(aiAnimTimer.current);
    if (aiPanelOpen) {
      if (containerRef.current && aiFloatLeft.current === null) {
        const r = containerRef.current.getBoundingClientRect();
        aiFloatLeft.current = r.left + containerRef.current.offsetWidth - aiWidth - 16;
      }
      setAiHeight(computePanelHeight());
      setAiMounted(true);
      setAiState("open");
    } else {
      setAiState("closing");
      aiAnimTimer.current = setTimeout(() => setAiState("closed"), 150);
    }
    return () => clearTimeout(aiAnimTimer.current);
  }, [aiPanelOpen]);

  useEffect(() => {
    if (!aiPanelOpen) return;
    const onResize = () => setAiHeight(computePanelHeight());
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [aiPanelOpen]);

  const handleAiVariantChange = (v: DraggableVariant) => {
    if (v === "docked" && aiPanelRef.current) {
      const r = aiPanelRef.current.getBoundingClientRect();
      aiFloatLeft.current = r.left;
      aiFloatTop.current  = r.top;
    }
    setAiVariant(v);
  };

  const getAiFloatStyle = (): React.CSSProperties => {
    const rect = containerRef.current?.getBoundingClientRect();
    const left = aiFloatLeft.current !== null
      ? aiFloatLeft.current
      : containerRef.current
        ? (rect?.left ?? 0) + containerRef.current.offsetWidth - aiWidth - 16
        : 0;
    const top = aiFloatTop.current !== null ? aiFloatTop.current : (rect?.top ?? 0);
    return { position: "fixed", top, left, zIndex: 9999 };
  };

  // History → pick a conversation: reprint it in the chat and switch the panel back to its home view,
  // which scrolls to the last message.
  const restoreSession = (id: string) => {
    if (id !== "current") setClientStage(chat.restore(id, clientStage));
    setTimeout(() => {
      (aiPanelRef.current ?? document).querySelector<HTMLButtonElement>('[aria-label="Back to home"]')?.click();
    }, 0);
  };

  const aiPanel = aiMounted ? (
    <AiPanel
      ref={aiPanelRef}
      draggable
      draggableVariant={aiVariant}
      defaultDraggableWidth={aiWidth}
      defaultDraggableHeight={aiHeight}
      onVariantChange={handleAiVariantChange}
      onWidthChange={setAiWidth}
      onResizeStateChange={setAiIsResizing}
      userName="John"
      suggestions={AI_SUGGESTIONS}
      onSuggestion={(sg) => chat.send(sg.label)}
      inputProps={{ onSubmit: chat.send, placeholder: "Ask AI anything…" }}
      historyContent={<AiHistory current={chat.entries} sessions={chat.sessions} onSelect={restoreSession} />}
      onNewConversation={() => {
        chat.startNewConversation(clientStage);
        resetNewClient();
        setClientStage(null);
      }}
      onClose={() => setAiPanelOpen(false)}
      className={aiVariant === "docked" ? "h-full" : undefined}
    >
      {chat.entries.length > 0 && (
        <AiChatLog
          entries={chat.entries}
          finishTyping={chat.finishTyping}
          scrollKey={`${clientStage}-${profileStep}-${setupProgress.explain}`}
          growKey={setupProgress.typed + setupProgress.adminStep + setupProgress.sendStep}
          renderFlow={(frozenStage) =>
            (frozenStage ?? clientStage) && (
              <NewClientConversation
                stage={(frozenStage ?? clientStage) as NewClientStage}
                frozen={frozenStage !== undefined}
                progress={setupProgress}
                profile={profile}
                onProfileChange={setProfile}
                profileStep={profileStep}
                onCommitProfileStep={() => setProfileStep((n) => n + 1)}
                admin={admin}
                onAdminChange={setAdmin}
                onProceed={proceedNewClient}
                onCancel={() => {
                  setClientStage(null);
                  resetNewClient();
                  chat.removeFlow();
                  chat.reply("No problem — I've taken you to the New Client page so you can create it manually.");
                  setAiPanelOpen(false);
                  setSection("new-client-home");
                  setNavOpen(true);
                  setNavKey((k) => k + 1);
                }}
                onPrepare={() => setClientStage("preparing")}
                onViewSetup={() => setSection("new-client")}
                form={tenantForm}
                onFormChange={setTenantForm}
                business={business}
                showFields={showFields}
                onShowFields={() => { setShowFields(true); setAutoConfig(null); }}
                autoConfig={autoConfig}
                loginState={loginState}
                onSendLogin={() => setLoginState("sending")}
              />
            )
          }
        />
      )}
    </AiPanel>
  ) : null;

  return (
    /* Shell background must sit on this ROOT div (matching AgentNextGen-
       Template's root) so it extends behind the AppHeader — AppHeader itself
       is transparent, and only Storybook's preview.ts body-background sync
       makes a bg-less root look correct inside Storybook. Standalone builds
       (e.g. prototype exports) have no such decorator. */
    <ClientsContext.Provider value={clients}>
    <div className="flex h-screen flex-col overflow-hidden bg-lyra-bg-surface-shell">
      <AppHeader
        appName={<AppNameWithMenu name="Outbound Engagement" />}
        actions={HEADER_ACTIONS}
      />
      <ToastContainer>
        {toasts.map((t) => (
          <Toast key={t.id} variant={t.variant} title={t.title} duration={t.duration} onDismiss={() => dismissToast(t.id)}>
            {t.message}
          </Toast>
        ))}
      </ToastContainer>

      <Modal
        open={pendingLeave !== null}
        alert
        onClose={() => setPendingLeave(null)}
        headerTitle="Unsaved Changes"
        headerIcon={<WarningIcon className="h-5 w-5" />}
        headerActions={
          <ActionIconButton title="Cancel" onClick={() => setPendingLeave(null)}>
            <X className="h-5 w-5" strokeWidth={1.5} />
          </ActionIconButton>
        }
        className="w-[480px]"
      >
        <div className="flex flex-col gap-4 px-5">
          <p className="lyra-body-md text-lyra-fg-default">
            You have unsaved changes would you like to save them before you leave?
          </p>
        </div>
        <div className="mt-6 flex items-center justify-between gap-2 px-5 pb-5">
          <Button variant="ghost" data-modal-cancel onClick={() => setPendingLeave(null)}>
            Cancel
          </Button>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                const leave = pendingLeave;
                setPendingLeave(null);
                leave?.();
              }}
            >
              Exit Without Saving
            </Button>
            <Button
              onClick={() => {
                const leave = pendingLeave;
                saveClient();
                setPendingLeave(null);
                leave?.();
              }}
            >
              Save &amp; Exit
            </Button>
          </div>
        </div>
      </Modal>

      <div className="flex flex-1 overflow-hidden bg-lyra-bg-surface-shell">
        <LeftNav key={navKey} items={navItems} open={navOpen} onToggle={() => setNavOpen((v) => !v)} />

        <ContentArea ref={containerRef} className="relative min-w-0">
          <Container className="relative flex flex-1 overflow-hidden">
            {children({ onAskAi: () => setAiPanelOpen((v) => !v), section, clientStage, tenantForm, setTenantForm, profile, setProfile, profileStep, admin, setAdmin, dirty, saveClient, requestLeave, startNewClient, goMonitor: () => setSection("monitor"), goNewClientHome: () => setSection("new-client-home"), createFlow, addToast })}
          </Container>

          {/* AI panel — float (fixed position, doesn't take layout space).
              No inner `pointerEvents:"auto"` wrapper div here: `Draggable`'s
              own root already sets `pointer-events:auto` on itself and
              moves with the drag's CSS `transform`, so an ancestor wrapper
              gains nothing and is actively harmful — an ancestor's layout
              box does NOT follow a descendant's transform, so after
              dragging the panel away from its start position, a stray
              wrapper like this is left behind as an invisible "ghost" hit
              area at the panel's ORIGINAL position, silently swallowing
              clicks meant for whatever real UI sits there instead (this
              bug has recurred at least 3 times across consumer apps that
              copied this story as a reference — see `draggable.tsx`'s own
              `onInteract` prop doc comment, and lyra-form-generator's/
              lyra-ux-templates'/Outbound-Campaigns' `App.tsx` fixes). This
              div now exists purely to hold the fade/slide open-close
              animation styles, with `pointerEvents:"none"` so it never
              itself intercepts anything. */}
          {aiVariant === "float" && aiMounted && (
            <div
              style={{
                ...getAiFloatStyle(),
                pointerEvents: "none",
                visibility: aiState === "closed" ? "hidden" : "visible",
                opacity: aiState === "open" ? 1 : 0,
                transform: aiState === "open" ? "translateY(0)" : "translateY(-8px)",
                transition: aiState === "open"
                  ? "opacity 150ms ease, transform 150ms ease"
                  : "opacity 100ms ease, transform 100ms ease",
              }}
            >
              {aiPanel}
            </div>
          )}
        </ContentArea>

        {/* AI panel — docked (sibling of the content column so flex layout keeps it in-bounds) */}
        {aiVariant === "docked" && (
          <div className="pb-3" style={{
            width: aiState === "open" ? aiWidth : 0,
            marginRight: aiState === "open" ? 12 : 0,
            overflow: "hidden",
            flexShrink: 0,
            transition: aiIsResizing ? "none" : "width 250ms cubic-bezier(0.4, 0, 0.2, 1)",
          }}>
            <div
              className="h-full animate-in fade-in-0 duration-150"
              style={{ width: aiWidth, display: aiState === "open" ? "block" : "none" }}
            >
              {aiPanel}
            </div>
          </div>
        )}
      </div>
    </div>
    </ClientsContext.Provider>
  );
}

/* ── Page: Admin UIs – With Page Header (AdminShell "WithPageHeader" template) ── */

export default function App() {
  return (
    <AppChrome>
      {({ onAskAi, section, clientStage, tenantForm, setTenantForm, profile, setProfile, profileStep, admin, setAdmin, dirty, saveClient, requestLeave, startNewClient, goMonitor, goNewClientHome, createFlow, addToast }) => (
        <AdminShell
          className="tenet-hide-left-panel"
          storageKeyPrefix="tenet_automation_admin_shell"
          navTitle="Outbound"
          navItems={PANEL_ITEMS}
          defaultLeftPinned
          showPageHeader
          pageTitle={
            section === "monitor" ? "Monitor" : section === "clients" ? "Clients" : section === "new-client-home" ? "New Client" : "Create New Client"
          }
          pageBreadcrumb={section === "new-client" ? { label: "New Client", onClick: () => requestLeave(goNewClientHome) } : undefined}
          pageActions={
            <>
              {section === "monitor" && (
                <>
                  <Button onClick={startNewClient}>
                    <Plus className="h-4 w-4 mr-1" strokeWidth={1.5} />
                    New Client
                  </Button>
                  <div className="mx-1 h-6 w-px bg-lyra-border-subtle" />
                </>
              )}
              {section === "new-client" && (
                <>
                  <Button variant="outline" onClick={() => requestLeave(goNewClientHome)}>Cancel</Button>
                  <Button onClick={saveClient} disabled={!dirty}>Save</Button>
                  <div className="mx-1 h-6 w-px bg-lyra-border-subtle" />
                </>
              )}
              <Button variant="outline" onClick={onAskAi}>
                <AiIcon className="h-4 w-4" />
                Ask AI
              </Button>
            </>
          }
          rightPanelContent={
            <div className="p-4">
              <p className="lyra-body-md text-lyra-fg-secondary">Side panel content.</p>
            </div>
          }
        >
          {section === "monitor" ? (
            <MonitorDashboard />
          ) : section === "clients" ? (
            <ClientsPage />
          ) : section === "new-client-home" ? (
            <NewClientPage onCreate={createFlow.start} />
          ) : createFlow.blank && createFlow.run && clientStage === null ? (
            <CreateFlowPage
              run={createFlow.run}
              onFinish={createFlow.finish}
              onAdminSent={(email) => addToast({ variant: "success", title: "Success!", message: `Email sent to ${email}`, duration: 4000 })}
            />
          ) : (
            <CreateClientPage
              stage={clientStage}
              form={tenantForm}
              onFormChange={setTenantForm}
              profile={profile}
              onProfileChange={setProfile}
              profileStep={profileStep}
              admin={admin}
              onAdminChange={setAdmin}
            />
          )}
        </AdminShell>
      )}
    </AppChrome>
  );
}
