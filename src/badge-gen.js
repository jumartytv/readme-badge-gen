#!/usr/bin/env node
/**
 * readme-badge-gen / src/badge-gen.js
 * Auto-generates shields.io badges (build, coverage, license, version) into a README.
 *
 * Usage:
 *   node src/badge-gen.js --repo owner/repo
 *   node src/badge-gen.js --repo owner/repo --inject
 *   node src/badge-gen.js --repo owner/repo --coverage 87 --dry-run
 */
'use strict';

const fs = require('fs');
const path = require('path');

function parseArgs(argv) {
  const args = { repo: null, coverage: null, inject: false, dryRun: false, readme: 'README.md', file: null };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--repo') args.repo = argv[++i];
    else if (a === '--coverage') args.coverage = argv[++i];
    else if (a === '--inject') args.inject = true;
    else if (a === '--dry-run') args.dryRun = true;
    else if (a === '--readme') args.readme = argv[++i];
    else if (a === '--help') args.help = true;
  }
  return args;
}

function buildBadges({ repo, coverage }) {
  const badges = [];
  badges.push(`![CI](https://img.shields.io/github/actions/workflow/status/${repo}/ci.yml?branch=main&label=build)`);
  badges.push(`![License](https://img.shields.io/github/license/${repo})`);
  badges.push(`![Release](https://img.shields.io/github/v/release/${repo}?label=version)`);
  if (coverage !== null && coverage !== undefined) {
    const cov = Number(coverage);
    const color = cov >= 90 ? 'brightgreen' : cov >= 75 ? 'yellow' : cov >= 50 ? 'orange' : 'red';
    badges.push(`![Coverage](https://img.shields.io/badge/coverage-${cov}%25-${color})`);
  } else {
    badges.push(`![Coverage](https://img.shields.io/codecov/c/github/${repo})`);
  }
  return badges;
}

const MARKER_START = '<!-- badges:start -->';
const MARKER_END = '<!-- badges:end -->';

function injectIntoReadme(readmePath, badgeBlock) {
  let content = fs.existsSync(readmePath) ? fs.readFileSync(readmePath, 'utf8') : '# Project\n\n';
  const block = `${MARKER_START}\n${badgeBlock}\n${MARKER_END}`;

  if (content.includes(MARKER_START) && content.includes(MARKER_END)) {
    const start = content.indexOf(MARKER_START);
    const end = content.indexOf(MARKER_END) + MARKER_END.length;
    content = content.slice(0, start) + block + content.slice(end);
  } else {
    const lines = content.split('\n');
    const titleIdx = lines.findIndex((l) => l.startsWith('# '));
    if (titleIdx === -1) {
      content = `${block}\n\n${content}`;
    } else {
      lines.splice(titleIdx + 1, 0, '', block);
      content = lines.join('\n');
    }
  }
  fs.writeFileSync(readmePath, content);
}

function printHelp() {
  console.log(`readme-badge-gen — generate shields.io badges into a README

Usage:
  badge-gen --repo owner/repo                Print badge markdown
  badge-gen --repo owner/repo --inject       Inject badges into README.md (between markers)
  badge-gen --repo owner/repo --coverage 87  Set an explicit coverage percentage
  badge-gen --repo owner/repo --readme docs/README.md --inject
  badge-gen --dry-run                        Print what would change, without writing`);
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help || !args.repo) {
    printHelp();
    if (!args.repo && !args.help) process.exit(1);
    return;
  }

  const badges = buildBadges(args);
  const block = badges.join('\n');

  console.log('Generated badges:\n');
  console.log(block);

  if (args.inject) {
    const readmePath = path.resolve(process.cwd(), args.readme);
    if (args.dryRun) {
      console.log(`\n(dry run) Would inject into ${readmePath}`);
    } else {
      injectIntoReadme(readmePath, block);
      console.log(`\n✓ Injected badges into ${readmePath}`);
    }
  }
}

main();
