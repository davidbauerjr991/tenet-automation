import * as React from "react";
import { AIProcess, type AIProcessStep, Button, Checkbox, Container, Input, Modal, Select, Separator, Stepper } from "@nicecxone/lyra-ui";
import { TIMEZONES } from "./NewClientConversation";

export const CREATE_CLIENT_STEPS = ["CXone Tenant Setup", "Prepare Tenant Access", "Create Employee Access", "SmartReach Setup", "Verify"];

/* ── Create run (started from the New Client home page) ── */

export interface CreateRun {
  name: string;
  code: string;
  tenantId: string;
  phase: "running" | "done";
}

export interface CreateFlow {
  /** The Create New Client page was opened from the New Client home page. */
  blank: boolean;
  run: CreateRun | null;
  start: (name: string, code: string) => void;
  finish: () => void;
  back: () => void;
}

export const newTenantId = () => String(Math.floor(10000000 + Math.random() * 89999999));

const TENANT_STEPS = ["Reserving tenant ID", "Creating schema", "Applying licenses", "Registering with cluster", "Wiring auth & routing", "Final validation"];
const TENANT_STEP_MS = 1500;

const ACCESS_STEPS = [
  "Validating SmartReach license constraints",
  "Provisioning SmartReach",
  "Looking up new client details",
  "Adding SmartReach license to tenant",
  "Preparing credentials",
  "Establishing admin session",
];
const ACCESS_STEP_MS = 1500;

const OUTBOUND_CHANNELS = [
  { value: "voice", label: "voice" },
  { value: "sms", label: "sms" },
  { value: "email", label: "email" },
  { value: "chat", label: "chat" },
  { value: "messaging", label: "messaging" },
];

interface OutboundSetup {
  clientName: string;
  timezone: string;
  channels: string[];
}

const EMPTY_OUTBOUND: OutboundSetup = { clientName: "", timezone: "", channels: [] };

const withChannel = (list: string[], value: string, on: boolean) =>
  on ? [...list.filter((c) => c !== value), value] : list.filter((c) => c !== value);

const ADMIN_STEPS = ["Creating admin user", "Sending invitation email"];
const ADMIN_STEP_MS = 1500;
const ACCESS_ATTEMPTS = 20;

interface AdminRecord {
  first: string;
  last: string;
  email: string;
  userName: string;
  password: string;
}

const newAdminPassword = () => `${Math.random().toString(36).slice(2, 10)}Xq#${Math.floor(10 + Math.random() * 89)}`;

interface SmartReachIds {
  code: string;
  id: string;
}

const newSmartReachCode = () => {
  const words = ["Fly", "Wheel", "Bright", "River", "Cedar", "Harbor", "Summit", "Ember"];
  const pick = () => words[Math.floor(Math.random() * words.length)];
  const tail = Math.random().toString(36).slice(2, 8);
  return `${pick()}_${pick()}_${tail}`;
};

const newSmartReachId = () => String(Math.floor(100000 + Math.random() * 899999));

/** A group of detail fields; `divider` puts a separator above it. */
function DetailSection({ divider, children }: { divider?: boolean; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-6">
      {divider && <Separator />}
      {children}
    </div>
  );
}

/** The setup popup (AI progress) and, once it completes, the step menu with the tenant details. */
export function CreateFlowPage({ run, onFinish, onAdminSent }: { run: CreateRun; onFinish: () => void; onAdminSent?: (email: string) => void }) {
  const running = run.phase === "running";
  const [step, setStep] = React.useState(0);
  const [elapsed, setElapsed] = React.useState(0);

  const [accessRunning, setAccessRunning] = React.useState(false);
  const [accessStep, setAccessStep] = React.useState(0);
  const [accessDone, setAccessDone] = React.useState(false);
  const [smartReach, setSmartReach] = React.useState<SmartReachIds | null>(null);

  const [adminOpen, setAdminOpen] = React.useState(false);
  const [adminFirst, setAdminFirst] = React.useState("");
  const [adminLast, setAdminLast] = React.useState("");
  const [adminEmail, setAdminEmail] = React.useState("");
  const [adminSuffix, setAdminSuffix] = React.useState(() => String(1000 + Math.floor(Math.random() * 8999)));
  const [admins, setAdmins] = React.useState<AdminRecord[]>([]);
  const [adminDraft, setAdminDraft] = React.useState<AdminRecord | null>(null);
  const [adminSending, setAdminSending] = React.useState(false);
  const [obOpen, setObOpen] = React.useState(false);
  const [obDraft, setObDraft] = React.useState<OutboundSetup>(EMPTY_OUTBOUND);
  const [obSaved, setObSaved] = React.useState<OutboundSetup | null>(null);
  const [adminStep, setAdminStep] = React.useState(0);

  React.useEffect(() => {
    if (!running) return;
    setStep(0);
    setElapsed(0);
    const steps = setInterval(() => setStep((n) => Math.min(n + 1, TENANT_STEPS.length)), TENANT_STEP_MS);
    const clock = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => {
      clearInterval(steps);
      clearInterval(clock);
    };
  }, [running]);

  React.useEffect(() => {
    if (!accessRunning) return;
    setAccessStep(0);
    const steps = setInterval(() => setAccessStep((n) => Math.min(n + 1, ACCESS_STEPS.length)), ACCESS_STEP_MS);
    return () => clearInterval(steps);
  }, [accessRunning]);

  const finished = running && step >= TENANT_STEPS.length;
  React.useEffect(() => {
    if (finished) onFinish();
  }, [finished, onFinish]);

  React.useEffect(() => {
    if (!adminSending) return;
    setAdminStep(0);
    const steps = setInterval(() => setAdminStep((n) => Math.min(n + 1, ADMIN_STEPS.length)), ADMIN_STEP_MS);
    return () => clearInterval(steps);
  }, [adminSending]);

  const adminFinished = adminSending && adminStep >= ADMIN_STEPS.length;
  React.useEffect(() => {
    if (!adminFinished || !adminDraft) return;
    setAdminSending(false);
    setAdmins((prev) => [...prev, adminDraft]);
    onAdminSent?.(adminDraft.email);
  }, [adminFinished]); // eslint-disable-line react-hooks/exhaustive-deps

  const accessFinished = accessRunning && accessStep >= ACCESS_STEPS.length;
  React.useEffect(() => {
    if (!accessFinished) return;
    setAccessRunning(false);
    setAccessDone(true);
    setSmartReach({ code: newSmartReachCode(), id: newSmartReachId() });
  }, [accessFinished]);

  const processSteps: AIProcessStep[] = TENANT_STEPS.map((label, i) => ({
    id: `t${i}`,
    label,
    status: i < step ? "done" : i === step ? "active" : "pending",
  }));

  const accessProcessSteps: AIProcessStep[] = ACCESS_STEPS.map((label, i) => ({
    id: `a${i}`,
    label,
    status: i < accessStep ? "done" : i === accessStep ? "active" : "pending",
    ...(i === 2 && i === accessStep ? { description: `This could take a minute or two, making ${Math.min(accessStep + 1, 2)} out of ${ACCESS_ATTEMPTS} attempts.` } : {}),
  }));

  const adminDomain = smartReach ? `smartreach-${smartReach.code.split("_").slice(0, 2).join("").toLowerCase()}.com` : "";
  const adminUserName =
    adminFirst.trim() && adminLast.trim()
      ? `${adminFirst.trim().toLowerCase()}.${adminLast.trim().toLowerCase()}${adminSuffix}@${adminDomain}`
      : "";
  const adminReady = Boolean(adminFirst.trim() && adminLast.trim() && adminEmail.trim());

  const formatElapsed = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  const openAdmin = () => {
    setAdminFirst("");
    setAdminLast("");
    setAdminEmail("");
    setAdminSuffix(String(1000 + Math.floor(Math.random() * 8999)));
    setAdminOpen(true);
  };

  const currentStep = admins.length > 0 ? 3 : accessDone ? 2 : run.phase === "done" ? 1 : 0;

  const adminProcessSteps: AIProcessStep[] = ADMIN_STEPS.map((label, i) => ({
    id: `m${i}`,
    label,
    status: i < adminStep ? "done" : i === adminStep ? "active" : "pending",
  }));

  const saveAdmin = () => {
    setAdminDraft({
      first: adminFirst.trim(),
      last: adminLast.trim(),
      email: adminEmail.trim(),
      userName: adminUserName,
      password: newAdminPassword(),
    });
    setAdminOpen(false);
    setAdminSending(true);
  };

  return (
    <div className="flex flex-1 flex-col overflow-y-auto p-6">
      <Modal open={running} className="w-[520px]">
        <div className="flex flex-col gap-3 px-5 pb-5">
          <div className="flex items-center justify-between gap-2">
            <span className="lyra-body-md-emphasis text-lyra-fg-default">Setting up your tenant…</span>
            <span className="lyra-body-sm text-lyra-fg-secondary">{formatElapsed(elapsed)} elapsed</span>
          </div>
          <p className="lyra-body-sm text-lyra-fg-secondary">This usually takes about a minute — please keep this tab open.</p>
          <AIProcess steps={processSteps} label="Tenant setup" defaultExpanded />
        </div>
      </Modal>

      <Modal open={accessRunning} className="w-[520px]">
        <div className="flex flex-col gap-3 px-5 pb-5">
          <span className="lyra-body-md-emphasis text-lyra-fg-default">Preparing access for your tenant…</span>
          <AIProcess steps={accessProcessSteps} label="Tenant access" defaultExpanded />
        </div>
      </Modal>

      <Modal open={adminSending} className="w-[520px]">
        <div className="flex flex-col gap-3 px-5 pb-5">
          <span className="lyra-body-md-emphasis text-lyra-fg-default">Creating the admin user…</span>
          <AIProcess steps={adminProcessSteps} label="Admin setup" defaultExpanded />
        </div>
      </Modal>

      <Modal open={obOpen} onClose={() => setObOpen(false)} headerTitle="Setup Outbound" className="w-[640px]">
        <div className="flex flex-col gap-6 px-5 pb-5">
          <div className="flex flex-wrap gap-4">
            <div className="min-w-0 basis-[calc(50%_-_0.5rem)]">
              <Input label="Client Name" value={obDraft.clientName} onChange={(e) => setObDraft({ ...obDraft, clientName: e.target.value })} />
            </div>
            <div className="min-w-0 basis-[calc(50%_-_0.5rem)]">
              <Select label="Timezone" options={TIMEZONES} value={obDraft.timezone} onValueChange={(v) => setObDraft({ ...obDraft, timezone: v })} />
            </div>
          </div>
          <div className="flex flex-col gap-3">
            <span className="lyra-body-md text-lyra-fg-secondary">Channels</span>
            {OUTBOUND_CHANNELS.map((c) => (
              <Checkbox
                key={c.value}
                label={c.label}
                checked={obDraft.channels.includes(c.value)}
                onCheckedChange={(v) => setObDraft({ ...obDraft, channels: withChannel(obDraft.channels, c.value, Boolean(v)) })}
              />
            ))}
          </div>
          <div className="flex flex-wrap justify-start gap-2">
            <Button
              disabled={!obDraft.clientName.trim()}
              onClick={() => {
                setObSaved(obDraft);
                setObOpen(false);
              }}
            >
              Save
            </Button>
            <Button variant="outline" onClick={() => setObOpen(false)}>
              Cancel
            </Button>
          </div>
        </div>
      </Modal>

      <Modal open={adminOpen} onClose={() => setAdminOpen(false)} headerTitle="Create Admin" className="w-[640px]">
        <div className="flex flex-col gap-6 px-5 pb-5">
          <div className="flex flex-wrap gap-4">
            <div className="min-w-0 basis-[calc(50%_-_0.5rem)]">
              <Input label="First Name" required value={adminFirst} onChange={(e) => setAdminFirst(e.target.value)} />
            </div>
            <div className="min-w-0 basis-[calc(50%_-_0.5rem)]">
              <Input label="Last Name" required value={adminLast} onChange={(e) => setAdminLast(e.target.value)} />
            </div>
            <div className="min-w-0 basis-[calc(50%_-_0.5rem)]">
              <Input label="Email Address" required value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} />
            </div>
            <div className="min-w-0 basis-[calc(50%_-_0.5rem)]">
              <Input label="User Name" required value={adminUserName} readonly />
            </div>
          </div>
          <div className="flex flex-wrap justify-start gap-2">
            <Button disabled={!adminReady} onClick={saveAdmin}>
              Save & Send Email
            </Button>
            <Button variant="outline" onClick={() => setAdminOpen(false)}>
              Cancel
            </Button>
          </div>
        </div>
      </Modal>

      <Container variant="neutral-subtle" className="flex flex-col gap-6 p-6">
        <Stepper steps={CREATE_CLIENT_STEPS.map((title) => ({ title }))} currentStep={currentStep} labelPlacement="below" fill navigation="none" />
        {run.phase === "done" && (
          <div className="flex flex-col gap-6">
            <p className="lyra-body-md text-lyra-fg-default">
              The tenant below was provisioned in the previous step. Continue to obtain the access needed to configure this tenant (create admin user, etc.) in the next step.
            </p>
            <div className="flex flex-wrap justify-start gap-2">
              {obSaved ? null : admins.length > 0 ? (
                <Button onClick={() => setObOpen(true)}>Setup Outbound</Button>
              ) : accessDone ? (
                <Button onClick={openAdmin}>Create Admin</Button>
              ) : (
                <Button onClick={() => setAccessRunning(true)} disabled={accessRunning}>
                  Prepare Access
                </Button>
              )}
            </div>
          </div>
        )}
      </Container>
      {run.phase === "done" && (
        <div className="flex flex-col gap-6 pt-6">
          <DetailSection>
            <div className="flex flex-wrap gap-4">
              <div className="min-w-0 basis-[calc(50%_-_0.5rem)]">
                <Input label="Tenant Name" value={run.name} readonly />
              </div>
              <div className="min-w-0 basis-[calc(50%_-_0.5rem)]">
                <Input label="Tenant ID" value={run.tenantId} readonly />
              </div>
            </div>
          </DetailSection>
          {smartReach && (
            <DetailSection divider>
              <div className="flex flex-wrap gap-4">
                <div className="min-w-0 basis-[calc(50%_-_0.5rem)]">
                  <Input label="SmartReach Client Code" value={smartReach.code} readonly />
                </div>
                <div className="min-w-0 basis-[calc(50%_-_0.5rem)]">
                  <Input label="SmartReach Client ID" value={smartReach.id} readonly />
                </div>
              </div>
            </DetailSection>
          )}
          {admins.length > 0 && (
            <DetailSection divider>
              {admins.map((a, i) => (
                <div key={`${a.userName}-${i}`} className="flex flex-wrap gap-4">
                  <div className="min-w-0 basis-[calc(50%_-_0.5rem)]">
                    <Input label="First Name" value={a.first} readonly />
                  </div>
                  <div className="min-w-0 basis-[calc(50%_-_0.5rem)]">
                    <Input label="Last Name" value={a.last} readonly />
                  </div>
                  <div className="min-w-0 basis-[calc(50%_-_0.5rem)]">
                    <Input label="Email Address" value={a.email} readonly />
                  </div>
                  <div className="min-w-0 basis-[calc(50%_-_0.5rem)]">
                    <Input label="User Name" value={a.userName} readonly />
                  </div>
                  <div className="min-w-0 basis-[calc(50%_-_0.5rem)]">
                    <Input label="Password" value={a.password} readonly />
                  </div>
                  {i === admins.length - 1 && (
                    <div className="flex min-w-0 basis-[calc(50%_-_0.5rem)] items-end">
                      <Button variant="outline" onClick={openAdmin}>
                        Add Another Admin
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </DetailSection>
          )}
          {obSaved && (
            <DetailSection divider>
              <div className="flex flex-wrap gap-4">
                <div className="min-w-0 basis-[calc(50%_-_0.5rem)]">
                  <Input label="Client Name" value={obSaved.clientName} onChange={(e) => setObSaved({ ...obSaved, clientName: e.target.value })} />
                </div>
                <div className="min-w-0 basis-[calc(50%_-_0.5rem)]">
                  <Select label="Timezone" options={TIMEZONES} value={obSaved.timezone} onValueChange={(v) => setObSaved({ ...obSaved, timezone: v })} />
                </div>
              </div>
              <div className="flex flex-col gap-3">
                <span className="lyra-body-md text-lyra-fg-secondary">Channels</span>
                {OUTBOUND_CHANNELS.map((c) => (
                  <Checkbox
                    key={c.value}
                    label={c.label}
                    checked={obSaved.channels.includes(c.value)}
                    onCheckedChange={(v) => setObSaved({ ...obSaved, channels: withChannel(obSaved.channels, c.value, Boolean(v)) })}
                  />
                ))}
              </div>
            </DetailSection>
          )}
        </div>
      )}
    </div>
  );
}
