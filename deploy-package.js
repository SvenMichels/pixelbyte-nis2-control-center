const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const DEPLOY = path.join(ROOT, 'deploy');
const DIST = path.join(ROOT, 'dist');

function log(msg) {
    console.log(`[deploy-package] ${msg}`);
}

function fail(msg) {
    console.error(`[deploy-package] ERROR: ${msg}`);
    process.exit(1);
}

function rimraf(target) {
    if (!fs.existsSync(target)) return;
    fs.rmSync(target, { recursive: true, force: true });
}

function copyDir(src, dest) {
    fs.mkdirSync(dest, { recursive: true });
    for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);
        if (entry.isDirectory()) {
            copyDir(srcPath, destPath);
        } else {
            fs.copyFileSync(srcPath, destPath);
        }
    }
}

function copyFile(src, dest) {
    const destDir = path.dirname(dest);
    fs.mkdirSync(destDir, { recursive: true });
    fs.copyFileSync(src, dest);
}

if (!fs.existsSync(DIST)) {
    fail(`dist/ folder not found. Run "npx nest build" first.`);
}

fs.mkdirSync(DEPLOY, { recursive: true });

log('Cleaning deploy/dist_new …');
rimraf(path.join(DEPLOY, 'dist_new'));

log('Cleaning deploy/prisma …');
rimraf(path.join(DEPLOY, 'prisma'));

log('Copying dist → deploy/dist_new …');
copyDir(DIST, path.join(DEPLOY, 'dist_new'));

const PRISMA_SRC = path.join(ROOT, 'prisma');
if (!fs.existsSync(PRISMA_SRC)) {
    fail('prisma/ folder not found.');
}
log('Copying prisma → deploy/prisma …');
copyDir(PRISMA_SRC, path.join(DEPLOY, 'prisma'));

const FILES = ['package.json', 'prisma.config.ts'];

for (const file of FILES) {
    const src = path.join(ROOT, file);
    if (!fs.existsSync(src)) {
        log(`SKIP ${file} (not found)`);
        continue;
    }
    log(`Copying ${file} → deploy/${file}`);
    copyFile(src, path.join(DEPLOY, file));
}

console.log('');
console.log('========================================');
console.log(' DEPLOY PACKAGE READY');
console.log(' → upload deploy/dist_new to server');
console.log('========================================');

