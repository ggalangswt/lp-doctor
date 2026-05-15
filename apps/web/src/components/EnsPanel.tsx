import { LabelBadge } from "./LabelBadge.js";

export interface EnsRecord {
  key: string;
  value: string;
  txHash?: string;
}

export interface EnsPublication {
  parentName: string;
  subnameLabel: string;
  fullName: string;
  resolverUrl: string;
  records: EnsRecord[];
  network: "mainnet" | "sepolia";
  stub: boolean;
  publishedAt: string;
}

interface Props {
  publication: EnsPublication;
}

function shortValue(v: string): string {
  if (v.length <= 24) return v;
  if (v.startsWith("0x")) return `${v.slice(0, 10)}…${v.slice(-6)}`;
  return `${v.slice(0, 22)}…`;
}

export function EnsPanel({ publication }: Props) {
  const { parentName, fullName, resolverUrl, records, network, stub } = publication;
  return (
    <section className="p-4 rounded-lg border border-slate-700 bg-slate-900/50">
      <header className="flex items-center justify-between gap-2">
        <h2 className="text-xs uppercase tracking-wider text-slate-500">
          ENS identity
        </h2>
        <LabelBadge label={stub ? "EMULATED" : "VERIFIED"} />
      </header>

      <div className="mt-3 space-y-2 text-xs font-mono">
        <div className="flex items-center gap-2">
          <span className="text-slate-500 w-20 shrink-0">name</span>
          <a
            href={resolverUrl}
            target="_blank"
            rel="noreferrer"
            className="text-violet-300 hover:text-violet-200 truncate"
            title={fullName}
          >
            {parentName}
          </a>
          <span className="ml-auto text-[10px] text-slate-500">{network}</span>
        </div>

        <div className="pt-2 border-t border-slate-800 space-y-1">
          {records.map((r) => (
            <div key={r.key} className="flex items-start gap-2">
              <span className="text-slate-500 w-44 shrink-0 truncate" title={r.key}>
                {r.key.replace(/^lpdoctor\.\d+\./, "")}
              </span>
              <span className="text-slate-200 truncate" title={r.value}>
                {shortValue(r.value)}
              </span>
              {r.txHash && (
                <span className="ml-auto text-[10px] text-slate-500" title={r.txHash}>
                  ✓
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      <p className="mt-3 text-[10px] text-slate-500">
        {stub
          ? `ENS publish skipped — ${records.length} text records prepared. Set ENS_PARENT_PRIVATE_KEY on the server to publish to ${network} under ${parentName}.`
          : `Resolving ${parentName} on ${network} returns the full provenance trio (storage rootHash, chain anchor tx, verdict excerpt) under structured keys. Anyone with the parent name can list every diagnosis the agent has anchored.`}
      </p>
    </section>
  );
}
