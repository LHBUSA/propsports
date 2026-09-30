// Full-page screenshots with headless Chrome (visual QA). Usage:
//   node scripts/shots.mjs <outDir> <width> <height> <url> [<url> ...]
import { execFileSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';

const [outDir, width, height, ...urls] = process.argv.slice(2);
const chrome = process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
mkdirSync(outDir, { recursive: true });
for (const url of urls) {
  const name = (new URL(url).pathname.replace(/\//g, '_') || '_home').replace(/^_$/, '_home') + `-${width}.png`;
  const file = join(outDir, name);
  execFileSync(chrome, ['--headless=new', '--disable-gpu', '--hide-scrollbars', '--force-device-scale-factor=1', `--window-size=${width},${height}`,
    '--virtual-time-budget=9000', `--screenshot=${file}`, url], { stdio: 'ignore', timeout: 90000 });
  console.log(file);
}
