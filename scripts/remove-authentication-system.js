const fs = require('fs');
const path = require('path');

function removeAuthenticationSystem() {
  console.log('🗑️ Removing Authentication System...\n');
  
  const filesToDelete = [
    // Authentication API routes
    'src/app/api/auth/login/route.ts',
    'src/app/api/auth/signup/route.ts',
    'src/app/api/team-admins/route.ts',
    'src/app/api/notifications/route.ts',
    
    // Authentication pages
    'src/app/login/page.tsx',
    'src/app/request-access/page.tsx',
    'src/app/admin/team-admins/page.tsx',
    
    // Authentication setup scripts
    'scripts/setup-new-auth.js',
    'scripts/setup-simple-auth.js',
    'scripts/setup-authentication.js',
    'scripts/final-system-test.js',
    'scripts/test-team-security.js',
    
    // Authentication directories (will be removed if empty)
    'src/app/api/auth',
  ];
  
  // Delete files
  filesToDelete.forEach(filePath => {
    const fullPath = path.join(__dirname, '..', filePath);
    try {
      if (fs.existsSync(fullPath)) {
        if (fs.lstatSync(fullPath).isDirectory()) {
          // Remove directory and all contents
          fs.rmSync(fullPath, { recursive: true, force: true });
          console.log(`✅ Removed directory: ${filePath}`);
        } else {
          fs.unlinkSync(fullPath);
          console.log(`✅ Removed file: ${filePath}`);
        }
      } else {
        console.log(`⚠️ File not found: ${filePath}`);
      }
    } catch (error) {
      console.log(`❌ Error removing ${filePath}: ${error.message}`);
    }
  });
  
  console.log('\n📝 Files to manually update:');
  console.log('1. src/app/page.tsx - Remove login redirects');
  console.log('2. src/app/admin/page.tsx - Remove authentication checks');
  console.log('3. src/app/admin/layout.tsx - Remove auth middleware');
  console.log('4. src/app/team-admin/layout.tsx - Remove auth checks');
  console.log('5. src/components/Layouts/header/index.tsx - Remove login/logout buttons');
  console.log('6. .env.local - Remove JWT_SECRET and NEXTAUTH variables');
  
  console.log('\n🔧 Next steps:');
  console.log('1. Run the manual update script');
  console.log('2. Test all pages work without authentication');
  console.log('3. Remove any remaining auth-related imports');
}

removeAuthenticationSystem();