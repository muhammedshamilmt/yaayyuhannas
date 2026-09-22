# Google Sheets 404 Error - FIXED! 

## ✅ The Problem Was Fixed
Your `GOOGLE_SPREADSHEET_ID` was set to the full URL instead of just the ID.

**Before (Wrong):**
```
GOOGLE_SPREADSHEET_ID=https://docs.google.com/spreadsheets/d/19Ug-K85q4u3yNmF0MDgC8D4lOkSRs_-MVR-CbzV2rzA/edit
```

**After (Fixed):**
```
GOOGLE_SPREADSHEET_ID=19Ug-K85q4u3yNmF0MDgC8D4lOkSRs_-MVR-CbzV2rzA
```

## 🔧 Next Steps

### 1. Restart Your Development Server
After changing the `.env.local` file, you need to restart your server:

```bash
# Stop the current server (Ctrl+C)
# Then restart it
npm run dev
```

### 2. Share Your Spreadsheet
Make sure your spreadsheet is shared with the service account:

1. **Open your spreadsheet**: https://docs.google.com/spreadsheets/d/19Ug-K85q4u3yNmF0MDgC8D4lOkSRs_-MVR-CbzV2rzA/edit
2. **Click "Share"** (top right button)
3. **Add this email**: `festival-sheets-sync@festival-management-476511.iam.gserviceaccount.com`
4. **Give "Editor" permissions**
5. **Click "Send"**

### 3. Test the Connection
After restarting the server and sharing the spreadsheet:

```bash
# Test basic connection
curl http://localhost:3000/api/test-sheets

# Test write permissions
curl -X POST http://localhost:3000/api/test-sheets
```

### 4. Test Sync Operations
Once the connection works, test syncing:

```bash
# Sync candidates to sheets
curl -X POST http://localhost:3000/api/sync \
  -H "Content-Type: application/json" \
  -d '{"action": "sync-to-sheets", "type": "candidates"}'

# Sync programmes to sheets
curl -X POST http://localhost:3000/api/sync \
  -H "Content-Type: application/json" \
  -d '{"action": "sync-to-sheets", "type": "programmes"}'

# Sync results to sheets
curl -X POST http://localhost:3000/api/sync \
  -H "Content-Type: application/json" \
  -d '{"action": "sync-to-sheets", "type": "results"}'
```

## 📋 Your Current Configuration

- **Spreadsheet ID**: `19Ug-K85q4u3yNmF0MDgC8D4lOkSRs_-MVR-CbzV2rzA`
- **Service Account**: `festival-sheets-sync@festival-management-476511.iam.gserviceaccount.com`
- **Project**: `festival-management-476511`
- **Spreadsheet URL**: https://docs.google.com/spreadsheets/d/19Ug-K85q4u3yNmF0MDgC8D4lOkSRs_-MVR-CbzV2rzA/edit

## 🚨 Important Notes

1. **Teams don't sync** - Only candidates, programmes, and results sync with Google Sheets
2. **Restart required** - Always restart the server after changing `.env.local`
3. **Share the spreadsheet** - The service account needs Editor permissions
4. **Test first** - Use the test endpoints before trying actual sync operations

## ✅ Expected Result
After following these steps, your sync operations should work without the 404 error!