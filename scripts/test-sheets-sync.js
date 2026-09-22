const { sheetsSync } = require('../src/lib/sheetsSync');
require('dotenv').config({ path: '.env.local' });

async function testGoogleSheetsSync() {
  try {
    console.log('🔄 Testing Google Sheets sync for teams...');
    
    // Test syncing teams to Google Sheets
    const result = await sheetsSync.syncToSheets('teams');
    
    if (result.success) {
      console.log(`✅ Successfully synced ${result.count} teams to Google Sheets`);
      console.log('📊 Teams data has been synced with captain email field included');
    } else {
      console.log('❌ Failed to sync teams to Google Sheets');
    }
    
    console.log('\n💡 Check your Google Sheets to verify:');
    console.log('1. Teams sheet should exist');
    console.log('2. Captain Email column should be present');
    console.log('3. All team data should be synced correctly');
    
  } catch (error) {
    console.error('❌ Error testing Google Sheets sync:', error);
    
    if (error.message.includes('permission') || error.message.includes('403')) {
      console.log('\n🔧 Troubleshooting:');
      console.log('- Make sure your Google Sheets is shared with the service account email');
      console.log('- Check that the Google Sheets API is enabled');
    } else if (error.message.includes('not found') || error.message.includes('404')) {
      console.log('\n🔧 Troubleshooting:');
      console.log('- Verify the GOOGLE_SPREADSHEET_ID in your .env.local file');
      console.log('- Make sure the spreadsheet exists and is accessible');
    }
  }
}

// Run the test
testGoogleSheetsSync().catch(console.error);