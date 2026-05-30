#!/usr/bin/env node
/**
 * Import ground-truth CSV from data/imports/ into Science Lab.
 * Usage: node scripts/import-science-data.mjs [file.csv]
 */
import fs from 'fs';
import path from 'path';

const APP = process.env.APP_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
const dir = path.join(process.cwd(), 'data', 'imports');

async function importFile(filePath) {
  const text = fs.readFileSync(filePath, 'utf-8');
  const res = await fetch(`${APP}/api/science/import`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ csv: text }),
  });
  const data = await res.json();
  console.log(filePath, res.status, data);
}

async function main() {
  const arg = process.argv[2];
  if (arg) {
    await importFile(path.resolve(arg));
    return;
  }

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`Created ${dir} — add CSV files and re-run.`);
    return;
  }

  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.csv'));
  if (!files.length) {
    console.log('No CSV files in data/imports/');
    return;
  }

  for (const f of files) {
    await importFile(path.join(dir, f));
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
