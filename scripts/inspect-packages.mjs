import fs from 'fs';
import path from 'path';

const provinces = ['ninh-binh', 'quang-ninh', 'hai-phong', 'thanh-hoa', 'nghe-an'];

for (const p of provinces) {
  const base = path.join('source', 'extracted', p, p, 'references');
  const alignPath = path.join(base, 'map_mission_alignment.json');
  console.log(`\n=================== ${p.toUpperCase()} ALIGNMENT ===================`);
  if (fs.existsSync(alignPath)) {
    const align = JSON.parse(fs.readFileSync(alignPath, 'utf8'));
    console.log('quest_clusters:', align.quest_clusters);
    console.log('alignment_notes:', align.alignment_notes);
  }
}
