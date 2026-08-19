const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

function collectJavaScriptFiles(directory) {
    return fs.readdirSync(directory, { withFileTypes: true })
        .flatMap((entry) => {
            const fullPath = path.join(directory, entry.name);

            if (entry.isDirectory()) {
                return collectJavaScriptFiles(fullPath);
            }

            return fullPath.endsWith('.js')
                ? [fullPath]
                : [];
        });
}

const files = collectJavaScriptFiles(
    path.join(process.cwd(), 'api')
);

for (const file of files) {
    execFileSync(
        process.execPath,
        ['--check', file],
        { stdio: 'inherit' }
    );
}

console.log(`Syntax OK: ${files.length} archivos.`);