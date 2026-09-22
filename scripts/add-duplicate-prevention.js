// This script will modify the results API to prevent duplicates
const fs = require('fs');
const path = require('path');

function addDuplicatePrevention() {
  console.log('🔧 Adding Duplicate Prevention to Results API...\n');
  
  const apiPath = path.join(__dirname, '../src/app/api/results/route.ts');
  
  // Read the current API file
  let apiContent = fs.readFileSync(apiPath, 'utf8');
  
  // Add duplicate check to POST method
  const duplicateCheck = `
    // Check for existing result for this programme and section
    const existingResult = await collection.findOne({
      programme: body.programme,
      section: body.section
    });
    
    if (existingResult) {
      return NextResponse.json({ 
        error: 'Result already exists for this programme and section. Use edit instead.' 
      }, { status: 400 });
    }
`;
  
  // Insert the duplicate check before the insertOne operation
  const insertIndex = apiContent.indexOf('const result = await collection.insertOne({');
  if (insertIndex !== -1) {
    apiContent = apiContent.slice(0, insertIndex) + duplicateCheck + '\n    ' + apiContent.slice(insertIndex);
    
    // Write back to file
    fs.writeFileSync(apiPath, apiContent);
    console.log('✅ Added duplicate prevention to results API');
    console.log('   Now the API will reject duplicate results for the same programme+section');
  } else {
    console.log('❌ Could not find insertion point in API file');
  }
}

addDuplicatePrevention();