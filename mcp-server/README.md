# 🎪 Ayyuhannas Arts & Sports Fest 2026 - MCP Database Server

**Connector Name:** `ayyuhannas-fest`  
**Icon / Logo:** Available at `/logo.png`  
**Protocol:** Model Context Protocol (MCP) 2024-11-05 (Server-Sent Events & Stdio)

A production-grade Model Context Protocol server connecting any AI client (**Google Gemini, Claude, ChatGPT, Cursor, Codex**) directly to the live Ayyuhannas Arts & Sports Fest MongoDB database.

---

## 🚀 Live Hosting on Render

### Step 1: Deploy on Render
1. Log in to [Render.com](https://render.com/).
2. Click **New +** > **Web Service**.
3. Connect your GitHub repository.
4. Set the following settings:
   - **Name**: `ayyuhannas-fest-mcp` (or any name you like)
   - **Language**: `Docker`
   - **Dockerfile Path**: `./mcp-server/Dockerfile`
   - **Docker Build Context Directory**: `./mcp-server`
   - **Instance Type**: `Free`
   - **Health Check Path**: `/health`

*(Alternatively, if deploying without Docker using Node: Root Directory `mcp-server`, Build Command `npm install && npm run build`, Start Command `npm start`)*

---

### Step 2: Add Environment Variables in Render
In the **Environment** tab on Render, add these variables:

| Key | Recommended Value | Notes |
| :--- | :--- | :--- |
| **`MONGODB_URI`** | `mongodb+srv://wattaqa-2k25:DSvR9vIF9JZTuC63@wattaqa-2k25.snkdtfc.mongodb.net/?appName=wattaqa-2k25` | Your live MongoDB Atlas cluster |
| **`MONGODB_DB`** | `wattaqa-festival-2k25` | Target festival database |
| **`MCP_AUTH_TOKEN`** | `generate-a-secure-secret-token` *(e.g. `ayyuhannas-secret-2026`)* | Token to protect your MCP server |
| **`READ_ONLY`** | `true` | Prevents accidental data edits by AI |
| **`MAX_DOCUMENTS_LIMIT`** | `100` | Safety limit for queries |
| **`NODE_ENV`** | `production` | Production mode |

*(Note: Render automatically injects `PORT=10000`, which our server listens to automatically on `0.0.0.0`).*

---

### Step 3: Verify Your Deployment
Once deployed, Render gives you a public HTTPS URL, for example:
`https://yaayyuhannas.onrender.com`

- **Visual Dashboard**: Open `https://yaayyuhannas.onrender.com` in your browser to see the festival logo and connection details.
- **Health Check**: `https://yaayyuhannas.onrender.com/health` -> returns `{"status":"healthy","server":"ayyuhannas-fest","database":"connected"}`
- **Logo Endpoint**: `https://yaayyuhannas.onrender.com/logo.png`
- **MCP SSE Endpoint**: `https://yaayyuhannas.onrender.com/sse`

---

## 🤖 Connecting Your AI to the Hosted Render Server

### 1. Cursor IDE
In Cursor **Settings** > **Features** > **MCP Servers** > **Add New MCP Server**:
- **Name**: `ayyuhannas-fest`
- **Type**: `SSE`
- **URL**: `https://yaayyuhannas.onrender.com/sse?token=YOUR_MCP_AUTH_TOKEN`

---

### 2. Claude Desktop
Add to `claude_desktop_config.json`:
```json
{
  "mcpServers": {
    "ayyuhannas-fest": {
      "url": "https://yaayyuhannas.onrender.com/sse",
      "headers": {
        "Authorization": "Bearer YOUR_MCP_AUTH_TOKEN"
      }
    }
  }
}
```

---

### 3. Google Gemini / Cloud Agents
Configure the MCP SSE tool connection with:
- **URL**: `https://yaayyuhannas.onrender.com/sse`
- **Headers**: `{"Authorization": "Bearer YOUR_MCP_AUTH_TOKEN"}`

---

## 🛠️ Tools Exposed

1. **`get_festival_overview`**: Overall festival status, total teams, candidates, completed programmes, and current standings.
2. **`get_live_standings`**: Real-time points, rank, and medal counts (Gold, Silver, Bronze) for all teams.
3. **`search_candidates`**: Search candidates by chest number, name, or team code with linked event registrations and won prizes.
4. **`get_programme_details`**: Event lookup (e.g. `AS01`) returning rules, registered rosters, and published winners.
5. **`diagnose_database_anomalies`**: Scans for duplicate chest numbers, missing team assignments, and junior song limit violations.
6. **`list_collections`**: Lists all database collections and active document counts.
7. **`describe_collection_schema`**: Dynamically describes the schema and field types of any collection.
8. **`query_documents`**: Safe filtered query into any collection with sorting, projection, and pagination.
9. **`run_aggregation`**: Executes complex MongoDB aggregation pipelines (`$match`, `$group`, `$sort`).
