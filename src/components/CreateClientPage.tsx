import { Button, Checkbox, Input, PasswordInput, Select } from "@nicecxone/lyra-ui";
import {
  BILLING_CYCLES,
  CHANNELS,
  CLUSTERS,
  TIMEZONES,
  LOGIN_PORTAL_URL,
  adminUserName,
  type AdminUser,
  type ClientProfile,
  TENANT_TYPES,
  type NewClientStage,
  type TenantForm,
} from "./NewClientConversation";

const CELL = "min-w-0 basis-[calc(50%_-_0.75rem)]";

const STAGE_ORDER: NewClientStage[] = ["prompt", "running", "done", "preparing", "ready"];
const reached = (stage: NewClientStage | null, at: NewClientStage) =>
  stage !== null && STAGE_ORDER.indexOf(stage) >= STAGE_ORDER.indexOf(at);

/**
 * Create New Client page. Once the user clicks Proceed it shows the details they entered
 * (headed by the tenant's name); the tenant ID appears when provisioning finishes and the
 * SmartReach details once access has been prepared. Fields sit in a two-column layout.
 * The fields the user entered in the AI panel (except the tenant name) stay editable here;
 * the tenant name, tenant ID and SmartReach access fields are read-only.
 */
export function CreateClientPage({
  stage,
  form,
  onFormChange,
  profile,
  onProfileChange,
  profileStep,
  admin,
  onAdminChange,
}: {
  stage: NewClientStage | null;
  form: TenantForm;
  onFormChange: (form: TenantForm) => void;
  profile: ClientProfile;
  onProfileChange: React.Dispatch<React.SetStateAction<ClientProfile>>;
  /** Number of client-profile fields committed so far; each is added to the page as it's committed. */
  profileStep: number;
  admin: AdminUser;
  onAdminChange: React.Dispatch<React.SetStateAction<AdminUser>>;
}) {
  const hasForm = !!form.name.trim();
  // Read-only fields (tenant name, tenant ID, SmartReach access) — shown as inputs.
  const readOnlyFirst = [{ label: "Tenant Name", value: hasForm ? form.name.trim() : "perm_do13_flywheel_8vpme5" }];
  const readOnlyAfter: { label: string; value: string; help?: string }[] = [];
  if (!hasForm || reached(stage, "done")) {
    readOnlyAfter.push({ label: "Tenant ID", value: "11f18170-e4bc-9340-bdaf-0242ac110004" });
  }
  if (reached(stage, "ready")) {
    readOnlyAfter.push({ label: "SmartReach Client Code", value: "Fly_Wheel_8vpme5" });
    readOnlyAfter.push({
      label: "SmartReach Client ID",
      value: "128751",
      help: "The identifier SmartReach assigned to this client.",
    });
  }

  const provisioning = stage === "running";

  return (
    <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-6">
      <h2 className="lyra-heading-lg text-lyra-fg-default">{hasForm ? form.name.trim() : "Prepare Tenant Access"}</h2>
      <p className="lyra-body-md text-lyra-fg-secondary">
        {provisioning
          ? "This tenant is being provisioned. Its ID and access details will appear here as each step completes."
          : "The tenant below was provisioned in the previous step. Continue to obtain the access needed to configure this tenant (create admin user, etc.) in the next step."}
      </p>
      <div className="flex flex-row flex-wrap gap-6">
        {readOnlyFirst.map((f) => (
          <div key={f.label} className={CELL}>
            <Input label={f.label} readonly value={f.value} readOnly />
          </div>
        ))}
        {hasForm && (
          <>
            <div className={CELL}>
              <Select
                label="Tenant Type"
                placeholder="Select a Type"
                options={TENANT_TYPES}
                value={form.type}
                onValueChange={(v) => onFormChange({ ...form, type: v })}
              />
            </div>
            <div className={CELL}>
              <Input
                label="BU Account Number"
                required
                inputMode="numeric"
                value={form.buAccount}
                onChange={(e) => onFormChange({ ...form, buAccount: e.target.value })}
              />
            </div>
            <div className={CELL}>
              <Select
                label="Cluster ID"
                required
                placeholder="Select a Cluster"
                options={CLUSTERS}
                value={form.cluster}
                onValueChange={(v) => onFormChange({ ...form, cluster: v })}
              />
            </div>
            <div className={CELL}>
              <Select
                label="Billing Cycle"
                placeholder="Select a Billing Cycle"
                options={BILLING_CYCLES}
                value={form.billingCycle}
                onValueChange={(v) => onFormChange({ ...form, billingCycle: v })}
              />
            </div>
          </>
        )}
        {readOnlyAfter.map((f) => (
          <div key={f.label} className={CELL}>
            <Input label={f.label} labelHelpText={f.help} readonly value={f.value} readOnly />
          </div>
        ))}
      </div>

      {reached(stage, "ready") && profileStep > 0 && (
        <>
          <h3 className="lyra-heading-md pt-4 text-lyra-fg-default">Client Profile</h3>
          <div className="flex flex-row flex-wrap gap-6">
            <div className={CELL}>
              <Input
                label="Client Name"
                value={profile.clientName}
                onChange={(e) => onProfileChange({ ...profile, clientName: e.target.value })}
              />
            </div>
            {profileStep > 1 && (
              <div className={CELL}>
                <Select
                  label="Timezone"
                  placeholder="Select a Timezone"
                  options={TIMEZONES}
                  value={profile.timezone}
                  onValueChange={(v) => onProfileChange({ ...profile, timezone: v })}
                />
              </div>
            )}
          </div>
          {profileStep > 2 && (
            <fieldset className="flex flex-col gap-2">
              <legend className="lyra-body-md pb-1 text-lyra-fg-secondary">Channels</legend>
              <div className="flex flex-row flex-wrap gap-x-6 gap-y-2">
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
              </div>
            </fieldset>
          )}
        </>
      )}

      {reached(stage, "ready") && profileStep > 3 && (
        <>
          <h3 className="lyra-heading-md pt-4 text-lyra-fg-default">Admin User</h3>
          <div className="flex flex-row flex-wrap gap-6">
            <div className={CELL}>
              <Input
                label="First Name"
                value={admin.firstName}
                onChange={(e) => onAdminChange((a) => ({ ...a, firstName: e.target.value }))}
              />
            </div>
            <div className={CELL}>
              <Input
                label="Last Name"
                value={admin.lastName}
                onChange={(e) => onAdminChange((a) => ({ ...a, lastName: e.target.value }))}
              />
            </div>
            <div className={CELL}>
              <Input
                label="Email"
                type="email"
                value={admin.email}
                onChange={(e) => onAdminChange((a) => ({ ...a, email: e.target.value }))}
              />
            </div>
            <div className={CELL}>
              <Input label="User Name" readonly value={adminUserName(admin)} readOnly />
            </div>
            <div className={CELL}>
              <PasswordInput
                label="Password"
                autoComplete="new-password"
                value={admin.password}
                onChange={(v) => onAdminChange((a) => ({ ...a, password: v }))}
              />
            </div>
          </div>

          <div>
            <Button variant="outline" onClick={() => window.open(LOGIN_PORTAL_URL, "_blank", "noopener,noreferrer")}>
              Login Portal
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
