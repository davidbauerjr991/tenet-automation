import { useState } from "react";
import { Save } from "lucide-react";
import { Button, Checkbox, Container, Input, Select } from "@nicecxone/lyra-ui";

const BASELINE_OPTIONS = [
  { value: "2way-1", label: "2Way Message 1 (PM Team)" },
  { value: "2way-2", label: "2Way Message 2 (PM Team)" },
  { value: "voice-1", label: "Voice Baseline (Support)" },
];

/** "New Client" home: baseline-copy form on the left, "Creating a Client" guidance on the right. */
export function NewClientPage({ onCreate }: { onCreate?: (name: string, code: string) => void }) {
  const [baseline, setBaseline] = useState(BASELINE_OPTIONS[0].value);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [copyServices, setCopyServices] = useState(false);

  return (
    <div className="flex flex-1 flex-col overflow-y-auto p-6">
      <Container variant="neutral-subtle" className="flex flex-row flex-wrap gap-8 p-6">
        <div className="flex min-w-[320px] flex-1 flex-col gap-4">
          <Select label="Baseline Client to Copy" options={BASELINE_OPTIONS} value={baseline} onValueChange={setBaseline} />
          <Input label="New Client Name" value={name} onChange={(e) => setName(e.target.value)} />
          <Input
            label="Client Code Name"
            labelHelpText="A short, unique code used to identify this client (for example in FTP directory names)."
            value={code}
            onChange={(e) => setCode(e.target.value)}
          />
          <Checkbox label="Copy All Services" checked={copyServices} onCheckedChange={(v) => setCopyServices(v === true)} />
          <Button className="w-full" disabled={!name.trim() || !code.trim()} onClick={() => onCreate?.(name.trim(), code.trim())}>
            <Save className="mr-1 h-4 w-4" strokeWidth={1.5} />
            Create
          </Button>
        </div>

        <div className="flex min-w-[320px] flex-1 flex-col gap-2 text-lyra-fg-default">
          <h2 className="lyra-heading-lg">Creating a Client</h2>
          <p className="lyra-body-md">
            This create client functionality will do a deep database clone of all the configuration entries of the Baseline client.
          </p>
          <p className="lyra-body-md">
            After a client is created, please review all settings for the new client. Pay particular attention to the Operator Phone and Callback Phone for each service.
          </p>
          <p className="lyra-body-md">Create client details:</p>
          <ul className="lyra-body-md ml-6 flex list-disc flex-col gap-1">
            <li>The primary step of the create client is the database clone of all configuration records.</li>
            <li>
              After this, the following steps will run in the background:
              <ul className="ml-6 mt-1 flex list-disc flex-col gap-1">
                <li>Create FTP dir (&lt;Client Code&gt;-Coll) on all web-servers.</li>
                <li>Reload suppliers for this parent service.</li>
                <li>Refresh dynamic web-site forwarding rules.</li>
                <li>Queuer will be reloaded for this parent service.</li>
              </ul>
            </li>
          </ul>
        </div>
      </Container>
    </div>
  );
}
