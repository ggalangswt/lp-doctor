import { Link } from "react-router-dom";
import type { V3PositionRaw } from "../lib/api.js";
import { classifyHealth, type Health } from "../lib/health.js";
import { Cap, Mono, fmt } from "../design/atoms.js";
import { Health as HealthBadge } from "../design/Health.js";
import { TokenPair } from "../design/TokenPair.js";

interface Props {
  position: V3PositionRaw;
}

const HEALTH_TO_STATUS: Record<Health, "healthy" | "drift" | "bleeding"> = {
  green: "healthy",
  amber: "drift",
  red: "bleeding",
};

const HEALTH_TONE: Record<"healthy" | "drift" | "bleeding", string> = {
  healthy: "healthy",
  drift: "toxic",
  bleeding: "bleed",
};

const CTA_LABEL: Record<"healthy" | "drift" | "bleeding", string> = {
  healthy: "HEALTHY · HOLD",
  drift: "DRIFTING · REVIEW",
  bleeding: "BLEEDING · MIGRATE",
};

const TIER_LABEL: Record<string, string> = {
  "100": "0.01%",
  "500": "0.05%",
  "3000": "0.30%",
  "10000": "1.00%",
};

function feeTierLabel(tier: string): string {
  return TIER_LABEL[tier] ?? `${(parseInt(tier, 10) / 10_000).toFixed(2)}%`;
}

function formatLiquidity(liq: string): string {
  try {
    const n = Number(BigInt(liq));
    return fmt.num(n);
  } catch {
    return liq;
  }
}

export function PositionCard({ position }: Props) {
  const health = classifyHealth(position);
  const status = HEALTH_TO_STATUS[health];
  const tone = HEALTH_TONE[status];

  const { pool, tickLower, tickUpper } = position;
  const tickRange = `${tickLower.tickIdx} → ${tickUpper.tickIdx}`;

  const dep0 = parseFloat(position.depositedToken0);
  const dep1 = parseFloat(position.depositedToken1);
  const fee0 = parseFloat(position.collectedFeesToken0);
  const fee1 = parseFloat(position.collectedFeesToken1);
  const totalDeposited = dep0 + dep1;
  const totalFees = fee0 + fee1;

  const borderColor =
    status === "bleeding"
      ? "rgba(255, 94, 79, 0.35)"
      : status === "drift"
        ? "rgba(245, 210, 102, 0.25)"
        : "var(--border)";

  return (
    <Link
      to={`/diagnose/${position.id}`}
      style={{
        display: "block",
        position: "relative",
        background: "var(--surface)",
        border: `1px solid ${borderColor}`,
        borderRadius: "var(--radius-lg)",
        textDecoration: "none",
        color: "inherit",
        overflow: "hidden",
        transition: "transform 160ms var(--ease-precise), border-color 200ms, box-shadow 200ms",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = `0 0 24px var(--${tone}-glow)`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = "none";
      }}
    >
      {status === "bleeding" && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(90deg, transparent 0%, rgba(255,94,79,0.10) 50%, transparent 100%)",
            backgroundSize: "200% 100%",
            animation: "bleed-sweep 3.2s linear infinite",
            pointerEvents: "none",
          }}
        />
      )}

      <div
        style={{
          height: 2,
          background:
            status === "bleeding"
              ? "linear-gradient(90deg, var(--bleed), transparent)"
              : status === "drift"
                ? "linear-gradient(90deg, var(--toxic), transparent)"
                : "linear-gradient(90deg, var(--healthy), transparent)",
        }}
      />

      <div style={{ padding: "20px 22px 18px" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 18,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <TokenPair t0={pool.token0.symbol} t1={pool.token1.symbol} />
            <div>
              <div
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: 16,
                  fontWeight: 500,
                  letterSpacing: "-0.01em",
                }}
              >
                {pool.token0.symbol} / {pool.token1.symbol}
              </div>
              <Mono
                style={{
                  display: "block",
                  fontSize: 10,
                  color: "var(--text-tertiary)",
                  marginTop: 2,
                }}
              >
                tokenId {position.id} · {feeTierLabel(pool.feeTier)}
              </Mono>
            </div>
          </div>
          <HealthBadge status={status} />
        </div>

        <div style={{ marginBottom: 14 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Cap>RANGE</Cap>
            <Mono style={{ fontSize: 11, color: "var(--text-secondary)" }}>
              {tickRange}
            </Mono>
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "12px 18px",
            paddingTop: 14,
            borderTop: "1px solid var(--border-faint)",
          }}
        >
          <div>
            <Cap>DEPOSITED</Cap>
            <Mono
              style={{
                display: "block",
                fontSize: 14,
                color: "var(--text)",
                marginTop: 4,
                letterSpacing: "-0.01em",
              }}
            >
              {fmt.num(totalDeposited)}
            </Mono>
          </div>
          <div>
            <Cap>FEES</Cap>
            <Mono
              style={{
                display: "block",
                fontSize: 14,
                color: totalFees > 0 ? "var(--healthy)" : "var(--text)",
                marginTop: 4,
                letterSpacing: "-0.01em",
              }}
            >
              {fmt.num(totalFees)}
            </Mono>
          </div>
          <div>
            <Cap>LIQUIDITY</Cap>
            <Mono
              style={{
                display: "block",
                fontSize: 14,
                color: "var(--text)",
                marginTop: 4,
                letterSpacing: "-0.01em",
              }}
            >
              {formatLiquidity(position.liquidity)}
            </Mono>
          </div>
          <div>
            <Cap>FEE TIER</Cap>
            <Mono
              style={{
                display: "block",
                fontSize: 14,
                color: "var(--text)",
                marginTop: 4,
                letterSpacing: "-0.01em",
              }}
            >
              {feeTierLabel(pool.feeTier)}
            </Mono>
          </div>
        </div>

        <div
          style={{
            marginTop: 18,
            paddingTop: 14,
            borderTop: "1px solid var(--border-faint)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Cap style={{ color: `var(--${tone})` }}>{CTA_LABEL[status]}</Cap>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              fontSize: 12,
              color: "var(--cyan)",
            }}
          >
            Diagnose
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <path
                d="M2 5h6M5 2l3 3-3 3"
                stroke="currentColor"
                strokeWidth="1.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
        </div>
      </div>
    </Link>
  );
}
