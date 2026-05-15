#!/usr/bin/env node

// LPDoctor MCP server — exposes tools callable by other agents
// (Claude Desktop, Cursor, or autonomous agents via MCP transport).

import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { ping, pingToolDefinition } from "./tools/ping.js";
import {
  diagnose,
  diagnoseInputSchema,
  diagnoseToolDefinition,
} from "./tools/diagnose.js";
import {
  preflight,
  preflightInputSchema,
  preflightToolDefinition,
} from "./tools/preflight.js";
import {
  migrate,
  migrateInputSchema,
  migrateToolDefinition,
} from "./tools/migrate.js";
import {
  lookupReport,
  lookupReportInputSchema,
  lookupReportToolDefinition,
} from "./tools/lookupReport.js";
import {
  lookupReportOnChain,
  lookupReportOnChainInputSchema,
  lookupReportOnChainToolDefinition,
} from "./tools/lookupReportOnChain.js";

async function main() {
  const server = new Server(
    {
      name: "lpdoctor-mcp",
      version: "0.1.0",
    },
    {
      capabilities: {
        tools: {},
      },
    },
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: [
      pingToolDefinition,
      diagnoseToolDefinition,
      preflightToolDefinition,
      migrateToolDefinition,
      lookupReportToolDefinition,
      lookupReportOnChainToolDefinition,
    ],
  }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    switch (name) {
      case "lpdoctor.ping": {
        const result = await ping();
        return { content: [{ type: "text", text: JSON.stringify(result) }] };
      }
      case "lpdoctor.diagnose": {
        const parsed = diagnoseInputSchema.parse(args ?? {});
        const result = await diagnose(parsed);
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      }
      case "lpdoctor.preflight": {
        const parsed = preflightInputSchema.parse(args ?? {});
        const result = await preflight(parsed);
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      }
      case "lpdoctor.migrate": {
        const parsed = migrateInputSchema.parse(args ?? {});
        const result = await migrate(parsed);
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      }
      case "lpdoctor.lookupReport": {
        const parsed = lookupReportInputSchema.parse(args ?? {});
        const result = await lookupReport(parsed);
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      }
      case "lpdoctor.lookupReportOnChain": {
        const parsed = lookupReportOnChainInputSchema.parse(args ?? {});
        const result = await lookupReportOnChain(parsed);
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      }
      default:
        throw new Error(`unknown tool: ${name}`);
    }
  });

  const transport = new StdioServerTransport();
  await server.connect(transport);

  // Keep process alive until stdio closes.
  process.stdin.resume();
}

main().catch((err) => {
  process.stderr.write(`mcp fatal: ${String(err)}\n`);
  process.exit(1);
});
