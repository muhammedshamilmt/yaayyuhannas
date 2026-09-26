const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const path = require('path');

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);

async function run() {
  try {
    await client.connect();
    const db = client.db(process.env.MONGODB_DB || 'wattaqa-festival-2k25');
    const programmesCollection = db.collection('programmes');

    const programmes = await programmesCollection.find({}).sort({ section: 1, name: 1 }).toArray();

    let mdContent = `# Current Programmes (${programmes.length} total)\n\n`;

    let currentSection = '';
    for (const p of programmes) {
      if (p.section !== currentSection) {
        currentSection = p.section;
        mdContent += `\n## Section: ${currentSection || 'Uncategorized'}\n\n`;
        mdContent += `| Code | Name | Category | Position Type |\n`;
        mdContent += `|------|------|----------|---------------|\n`;
      }
      mdContent += `| \`${p.code}\` | ${p.name} | ${p.category} | ${p.positionType || '-'} |\n`;
    }

    fs.writeFileSync(path.join(__dirname, '..', 'current_programmes.md'), mdContent);
    console.log(`Successfully saved ${programmes.length} programmes to current_programmes.md`);

  } finally {
    await client.close();
  }
}

run().catch(console.dir);
