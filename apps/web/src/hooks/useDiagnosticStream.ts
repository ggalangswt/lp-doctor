import { useEffect, useState } from "react";
import type { DiagnosticEvent } from "@lpdoctor/core";

export type StreamStatus = "idle" | "open" | "closed" | "error";

interface State {
  events: DiagnosticEvent[];
  status: StreamStatus;
  error?: string;
}

// Subscribes to /api/diagnose/:tokenId via EventSource and accumulates the
// typed DiagnosticEvent stream. The hook auto-closes on unmount.
export function useDiagnosticStream(tokenId: string | null): State {
  const [state, setState] = useState<State>({ events: [], status: "idle" });

  useEffect(() => {
    if (!tokenId) {
      setState({ events: [], status: "idle" });
      return;
    }

    const url = `/api/diagnose/${tokenId}`;
    const es = new EventSource(url);
    setState({ events: [], status: "open" });

    es.onmessage = (msg) => {
      try {
        const event = JSON.parse(msg.data) as DiagnosticEvent;
        setState((s) => ({ ...s, events: [...s.events, event] }));
      } catch {
        // ignore malformed frames
      }
    };

    es.onerror = () => {
      setState((s) => ({ ...s, status: "error", error: "stream error" }));
      es.close();
    };

    return () => {
      es.close();
      setState((s) => ({ ...s, status: "closed" }));
    };
  }, [tokenId]);

  return state;
}
