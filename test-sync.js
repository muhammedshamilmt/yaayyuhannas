// Test script to verify sync functionality
require('dotenv').config({ path: '.env.local' });

async function testSync() {
  try {
    console.log('🧪 Testing sync functionality...');
    
    // Test sync from sheets
    const response = await fetch('http://localhost:3000/api/sync', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'sync-from-sheets',
        type: 'teams'
      })
    });

    const result = await response.json();
    
    if (result.success) {
      console.log('✅ Sync test successful:', result.message);
    } else {
      console.log('❌ Sync test failed:', result.error);
    }
    
  } catch (error) {
    console.error('❌ Test error:', error.message);
  }
}

// Only run if server is running
console.log('Make sure your dev server is running (npm run dev)');
console.log('Then run: node test-sync.js');

if (process.argv.includes('--run')) {
  testSync();
}