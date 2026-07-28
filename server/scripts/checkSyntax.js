import { execFileSync } from 'node:child_process';
import { readdirSync } from 'node:fs';
import path from 'node:path';

const sourceFiles = [];

const collectSourceFiles = (directory) => {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    if (entry.name === 'node_modules') continue;

    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      collectSourceFiles(entryPath);
    } else if (entry.isFile() && /\.(?:js|mjs)$/.test(entry.name)) {
      sourceFiles.push(entryPath);
    }
  }
};

collectSourceFiles(process.cwd());

for (const sourceFile of sourceFiles) {
  execFileSync(process.execPath, ['--check', sourceFile], { stdio: 'inherit' });
}

console.log(`Syntax check passed: ${sourceFiles.length} files`);
