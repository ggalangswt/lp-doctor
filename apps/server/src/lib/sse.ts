import type { Response } from "express";
import type { DiagnosticEvent } from "@lpdoctor/core";

// Server-Sent Events helper. The frontend opens an EventSource against
// /api/diagnose/:tokenId and renders typed DiagnosticEvent updates.

export class SSEStream {
  constructor(private readonly res: Response) {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders?.();
  }

  emit(event: DiagnosticEvent): void {
    this.res.write(`data: ${JSON.stringify(event)}\n\n`);
  }

  comment(text: string): void {
    this.res.write(`: ${text}\n\n`);
  }

  close(): void {
    this.res.end();
  }
}
