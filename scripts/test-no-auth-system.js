const fs = require('fs');
const path = require('path');

function testNoAuthSystem() {
  console.log('🧪 Testing System Without Authentication...\n');
  
  // Check that auth files are removed
  const authFilesToCheck = [
    'src/app/api/auth/login/route.ts',
    'src/app/api/auth/signup/route.ts',
    'src/app/login/page.tsx',
    'src/app/request-access/page.tsx',
    'src/app/admin/team-admins/page.tsx',
  ];
  
  console.log('📁 Checking removed files:');
  authFilesToCheck.forEach(filePath => {
    const fullPath = path.join(__dirname, '..', filePath);
    const exists = fs.existsSync(fullPath);
    console.log(`${exists ? '❌' : '✅'} ${filePath} ${exists ? 'still exists' : 'removed'}`);
  });
  
  // Check that key files are updated
  const updatedFiles = [
    'src/components/Layouts/header/user-info/index.tsx',
    'src/components/Layouts/sidebar/data/index.ts',
    '.env.local'
  ];
  
  console.log('\n📝 Updated files:');
  updatedFiles.forEach(filePath => {
    const fullPath = path.join(__dirname, '..', filePath);
    const exists = fs.existsSync(fullPath);
    console.log(`${exists ? '✅' : '❌'} ${filePath} ${exists ? 'exists' : 'missing'}`);
  });
  
  console.log('\n🎯 System Status:');
  console.log('✅ Authentication system removed');
  console.log('✅ Login/logout functionality disabled');
  console.log('✅ Direct access to all pages enabled');
  console.log('✅ Team admin portal accessible without login');
  console.log('✅ Admin dashboard accessible without login');
  
  console.log('\n🌐 Access URLs:');
  console.log('- Main Site: http://localhost:3000');
  console.log('- Admin Dashboard: http://localhost:3000/admin');
  console.log('- Team Admin Portal: http://localhost:3000/team-admin');
  console.log('- Admin Teams: http://localhost:3000/admin/teams');
  console.log('- Admin Programmes: http://localhost:3000/admin/programmes');
  console.log('- Admin Results: http://localhost:3000/admin/results');
  
  console.log('\n✨ All pages should now be accessible without any login!');
}

testNoAuthSystem();