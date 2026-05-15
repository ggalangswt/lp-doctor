import { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { ConnectButton } from "./ConnectButton.js";
import { usePermit2Migration } from "../hooks/usePermit2Migration.js";

interface MigrationStep {
  kind: "close" | "swap" | "mint";
  description: string;
  detail?: Record<string, string>;
}

export interface MigrationPreviewMeta {
  fromVersion: 3;
  targetHook?: { address: string; family: string };
  steps: MigrationStep[];
  warnings: string[];
  // address of the token that needs Permit2 approval (token0 for the swap leg)
  tokenAddress?: string;
  // Universal Router or PoolManager address that becomes the spender
  spender?: string;
  // sample notional in raw units; UI will display human-friendly
  amount?: string;
}

interface Props {
  preview: MigrationPreviewMeta;
  /** Uniswap LP NFT id this migration was diagnosed against. Used to
   *  POST the signed Permit2 digest back to the server, which records
   *  it on the LPDoctorAgent iNFT (`migrationsTriggered` counter). */
  lpTokenId?: string;
  onClose: () => void;
}

const KIND_DOT: Record<MigrationStep["kind"], string> = {
  close: "✕",
  swap: "↔",
  mint: "✦",
};

const KIND_TONE: Record<MigrationStep["kind"], string> = {
  close: "var(--bleed)",
  swap: "var(--toxic)",
  mint: "var(--healthy)",
};

function shortHash(s: string): string {
  if (s.length <= 18) return s;
  return `${s.slice(0, 10)}…${s.slice(-6)}`;
}

export function MigrationModal({ preview, lpTokenId, onClose }: Props) {
  const { isConnected } = useAccount();
  const {
    sign,
    recordMigration,
    isPending,
    error,
    result,
  } = usePermit2Migration();
  const [submitted, setSubmitted] = useState(false);
  const [recordReceipt, setRecordReceipt] = useState<{
    migrationsTriggered: number;
    txHash?: string;
    explorerUrl?: string;
    stub: boolean;
  } | null>(null);
  const [recording, setRecording] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const handleSign = async () => {
    setSubmitted(true);
    const tokenAddress = (preview.tokenAddress ??
      "0x0000000000000000000000000000000000000000") as `0x${string}`;
    const spender = (preview.spender ??
      "0x66a9893cc07d91d95644aedd05d03f95e1dba8af") as `0x${string}`;
    const amount = preview.amount ? BigInt(preview.amount) : 1_000_000n;
    const now = Math.floor(Date.now() / 1000);
    const signed = await sign({
      tokenAddress,
      spender,
      amount,
      expiration: now + 30 * 24 * 60 * 60,
      nonce: 0,
      sigDeadline: now + 30 * 60,
    });
    if (signed && lpTokenId) {
      setRecording(true);
      const receipt = await recordMigration(lpTokenId, signed);
      setRecording(false);
      if (receipt) {
        setRecordReceipt({
          migrationsTriggered: receipt.receipt.migrationsTriggered,
          txHash: receipt.receipt.txHash,
          explorerUrl: receipt.receipt.explorerUrl,
          stub: receipt.receipt.stub,
        });
      }
    }
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100,
        background: "rgba(6,9,18,0.74)",
        backdropFilter: "blur(8px)",
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        paddingTop: 110,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 640,
          maxWidth: "92vw",
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-lg)",
          boxShadow: "0 0 40px var(--cyan-glow), 0 24px 60px rgba(0,0,0,0.6)",
          overflow: "hidden",
        }}
      >
        <header
          style={{
            padding: "16px 20px",
            borderBottom: "1px solid var(--border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div>
            <span className="cap" style={{ color: "var(--cyan)" }}>
              MIGRATE · PERMIT2 BUNDLE
            </span>
            <h2
              style={{
                margin: "6px 0 0 0",
                fontFamily: "var(--font-display)",
                fontSize: 18,
                fontWeight: 500,
              }}
            >
              {preview.targetHook
                ? `Close v3 → swap → mint v4 (${preview.targetHook.family.toLowerCase().replace(/_/g, "-")})`
                : "Close v3 → mint v3 (no v4 target)"}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: "4px 10px",
              color: "var(--text-tertiary)",
              fontSize: 12,
            }}
          >
            ✕ esc
          </button>
        </header>

        <div style={{ padding: 20 }}>
          <ol
            style={{
              margin: 0,
              padding: 0,
              listStyle: "none",
              display: "flex",
              flexDirection: "column",
              gap: 8,
            }}
          >
            {preview.steps.map((step, i) => (
              <li
                key={i}
                style={{
                  display: "flex",
                  gap: 12,
                  padding: "10px 12px",
                  border: "1px solid var(--border)",
                  borderLeft: `3px solid ${KIND_TONE[step.kind]}`,
                  borderRadius: 6,
                  fontFamily: "var(--font-mono)",
                  fontSize: 12,
                }}
              >
                <span style={{ width: 18, color: KIND_TONE[step.kind] }}>
                  {KIND_DOT[step.kind]}
                </span>
                <div style={{ flex: 1 }}>
                  <div style={{ color: "var(--text)" }}>{step.description}</div>
                  {step.detail && (
                    <div
                      style={{
                        marginTop: 4,
                        color: "var(--text-tertiary)",
                        fontSize: 10,
                        display: "flex",
                        flexWrap: "wrap",
                        gap: 12,
                      }}
                    >
                      {Object.entries(step.detail).map(([k, v]) => (
                        <span key={k}>
                          <span style={{ color: "var(--text-faint)" }}>{k}=</span>
                          {v}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ol>

          {preview.warnings.length > 0 && (
            <ul
              style={{
                marginTop: 14,
                paddingLeft: 18,
                fontSize: 11,
                color: "var(--toxic)",
                lineHeight: 1.6,
              }}
            >
              {preview.warnings.map((w, i) => (
                <li key={i}>{w}</li>
              ))}
            </ul>
          )}

          <div
            style={{
              marginTop: 18,
              padding: 12,
              borderRadius: 6,
              background: "var(--surface-raised)",
              border: "1px solid var(--border)",
              fontFamily: "var(--font-mono)",
              fontSize: 11,
              color: "var(--text-secondary)",
            }}
          >
            <div style={{ marginBottom: 6, color: "var(--cyan)" }}>
              Permit2 EIP-712 typed data
            </div>
            <div>verifyingContract 0x0000…78BA3 (Permit2)</div>
            <div>spender {shortHash(preview.spender ?? "0x66a98…ba8af (Universal Router)")}</div>
            <div>token {shortHash(preview.tokenAddress ?? "0x0000…0000")}</div>
            <div>sigDeadline now + 30 min</div>
          </div>

          {result && (
            <div
              style={{
                marginTop: 14,
                padding: 12,
                borderRadius: 6,
                background: "rgba(142, 232, 135, 0.06)",
                border: "1px solid var(--healthy)",
                fontFamily: "var(--font-mono)",
                fontSize: 11,
                color: "var(--healthy)",
                wordBreak: "break-all",
              }}
            >
              <div style={{ marginBottom: 6 }}>✓ signed by {shortHash(result.signer)}</div>
              <div style={{ color: "var(--text-secondary)" }}>{shortHash(result.signature)}</div>
              <div style={{ marginTop: 4, color: "var(--text-tertiary)", fontSize: 10 }}>
                digest {shortHash(result.digest)}
              </div>
              {recording && (
                <div style={{ marginTop: 8, color: "var(--cyan)" }}>
                  recording on iNFT…
                </div>
              )}
              {recordReceipt && (
                <div
                  style={{
                    marginTop: 8,
                    paddingTop: 8,
                    borderTop: "1px dashed var(--border)",
                    color: recordReceipt.stub
                      ? "var(--text-tertiary)"
                      : "var(--cyan)",
                  }}
                >
                  iNFT migrationsTriggered → {recordReceipt.migrationsTriggered}
                  {recordReceipt.explorerUrl && !recordReceipt.stub && (
                    <>
                      {" · "}
                      <a
                        href={recordReceipt.explorerUrl}
                        target="_blank"
                        rel="noreferrer"
                        style={{ color: "var(--cyan)" }}
                      >
                        tx ↗
                      </a>
                    </>
                  )}
                  {recordReceipt.stub && " (stub — no anchor key)"}
                </div>
              )}
            </div>
          )}

          {error && submitted && (
            <p
              style={{
                marginTop: 12,
                color: "var(--bleed)",
                fontSize: 12,
              }}
            >
              {error}
            </p>
          )}
        </div>

        <footer
          style={{
            padding: 16,
            borderTop: "1px solid var(--border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            background: "var(--surface-raised)",
          }}
        >
          {!isConnected ? (
            <>
              <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                Connect a wallet to sign the Permit2 bundle.
              </span>
              <ConnectButton />
            </>
          ) : (
            <>
              <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                {result
                  ? "Signature captured. Submit it via the agent's relayer to execute."
                  : "Sign the EIP-712 PermitSingle. The agent never executes — you stay in custody."}
              </span>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleSign}
                disabled={isPending || !!result}
                style={{ padding: "10px 16px", fontSize: 13 }}
              >
                {isPending
                  ? "signing…"
                  : result
                    ? "signed"
                    : "Sign Permit2"}
              </button>
            </>
          )}
        </footer>
      </div>
    </div>
  );
}
