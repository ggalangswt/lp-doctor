# @lpdoctor/mcp-server

Model Context Protocol server for LP Doctor. It exposes the product as typed tools over stdio so Claude Desktop, Cursor, or other MCP-aware agents can call the LP Doctor backend.

## Tool Surface

The current MCP server exposes **6 tools total**:

### Utility

- `lpdoctor.ping`

### Product tools

- `lpdoctor.diagnose`
- `lpdoctor.preflight`
- `lpdoctor.migrate`
- `lpdoctor.lookupReport`
- `lpdoctor.lookupReportOnChain`

## What Each Tool Does

| Tool | Purpose |
| --- | --- |
| `lpdoctor.ping` | transport liveness check |
| `lpdoctor.diagnose` | runs the full LP diagnosis flow and returns a structured summary |
| `lpdoctor.preflight` | stops early once migration preview data is available |
| `lpdoctor.migrate` | returns Permit2 typed data for user signing |
| `lpdoctor.lookupReport` | resolves a persisted report from the backend cache |
| `lpdoctor.lookupReportOnChain` | verifies the report anchor directly from `LPDoctorReports` on 0G Chain |

## Environment

Typical runtime variables:

```env
LPDOCTOR_API_URL=https://lp-doctor-production.up.railway.app
LPDOCTOR_AGENT_CONTRACT=0xe8701E0C2cdb6708d98343572E63CFe7118A62C8
LPDOCTOR_REPORTS_CONTRACT=0x9803BE5349EeDF7C28aC1914b743757ce043b7cC
LPDOCTOR_AGENT_TOKEN_ID=1
OG_GALILEO_RPC=https://evmrpc-testnet.0g.ai
```

## Local Run

```bash
pnpm install
pnpm --filter @lpdoctor/mcp-server build
pnpm --filter @lpdoctor/mcp-server start
```

The transport is stdio.

## Claude Desktop Example

Add an MCP server entry similar to this:

```json
{
  "mcpServers": {
    "lpdoctor": {
      "command": "node",
      "args": [
        "/absolute/path/to/LP-Doctor/apps/mcp-server/dist/index.js"
      ],
      "env": {
        "LPDOCTOR_API_URL": "https://lp-doctor-production.up.railway.app",
        "LPDOCTOR_AGENT_CONTRACT": "0xe8701E0C2cdb6708d98343572E63CFe7118A62C8",
        "LPDOCTOR_REPORTS_CONTRACT": "0x9803BE5349EeDF7C28aC1914b743757ce043b7cC",
        "LPDOCTOR_AGENT_TOKEN_ID": "1",
        "OG_GALILEO_RPC": "https://evmrpc-testnet.0g.ai"
      }
    }
  }
}
```

## Cursor Example

```json
{
  "mcpServers": {
    "lpdoctor": {
      "command": "node",
      "args": ["/absolute/path/to/apps/mcp-server/dist/index.js"]
    }
  }
}
```

## Smoke Test

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | pnpm --filter @lpdoctor/mcp-server exec lpdoctor-mcp
```

You should see all 6 tools in the response.

## Design Notes

- The MCP server does not replace the LP Doctor backend; it wraps it.
- `lookupReportOnChain` is the trust-minimized verification path.
- `migrate` prepares typed data only. It does not submit transactions on behalf of the user.
