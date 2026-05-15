// lpdoctor.ping — trivial liveness tool, useful to confirm the MCP transport
// is wired up before adding real tools.

import { z } from "zod";

export const pingInputSchema = z.object({}).strict();

export async function ping(): Promise<{ pong: true; at: string }> {
  return { pong: true, at: new Date().toISOString() };
}

export const pingToolDefinition = {
  name: "lpdoctor.ping",
  description: "Return { pong: true } to verify the MCP server is reachable.",
  inputSchema: {
    type: "object",
    properties: {},
    additionalProperties: false,
  },
} as const;
