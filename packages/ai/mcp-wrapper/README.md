# Carte AI MCP wrapper Worker

EmDash 0.9.0 does not expose plugin-defined MCP tool registration yet
(`emdash-cms/emdash` Discussion #850), so Carte v0.1 ships this interim
Worker. It exposes a small MCP JSON-RPC endpoint and proxies tool calls to the
native `@carte/ai` plugin route:

```text
/_emdash/api/plugins/carte-ai/tool-call
```

## Configure the wrapper

1. Deploy the Worker from this directory after setting the target plugin route:

   ```bash
   cd packages/ai/mcp-wrapper
   wrangler deploy --var EM_DASH_PLUGIN_BASE_URL:https://your-site.example/_emdash/api/plugins/carte-ai
   ```

2. Point an MCP client at the Worker. For Claude Desktop, use `mcp-remote` in
   `claude_desktop_config.json`:

   ```json
   {
     "mcpServers": {
       "carte-ai": {
         "command": "npx",
         "args": [
           "-y",
           "mcp-remote",
           "https://carte-ai-mcp-wrapper.<your-subdomain>.workers.dev/mcp"
         ]
       }
     }
   }
   ```

3. Restart the MCP client. The wrapper currently advertises
   `listMenuItems` (read-only) and `updateMenuItemPrice` (write-on-confirm).

When EmDash ships first-class custom MCP tool registration, Carte can migrate
these descriptors into the native API and remove this proxy layer.

Mission consumer-of-record comment:
<https://github.com/emdash-cms/emdash/discussions/850#discussioncomment-16856766>
