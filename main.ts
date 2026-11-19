// Package the offline TROPIC HEAT editor and its browser captures for make.fun.
// Run with MAKEFUN_OUTPUT_DIR=out for a local copy, or use /output in the grader.
import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

const repo = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
mkdirSync(out, { recursive: true });
cpSync(join(repo, 'app'), join(out, 'app'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(repo, 'screenshots'))) cpSync(join(repo, 'screenshots'), join(out, 'screenshots'), { recursive: true });
const caps = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
  app_path_max_bytes: 1000,
};
writeFileSync(join(out, 'dossier.json'), buildDossier(out, caps));
