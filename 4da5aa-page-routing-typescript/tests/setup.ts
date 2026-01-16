import * as fs from 'fs';
import * as path from 'path';

export const TEST_ROOT = path.join(__dirname, 'temp_env');

export function createStructure(structure: Record<string, string>) {
    if (fs.existsSync(TEST_ROOT)) {
        fs.rmSync(TEST_ROOT, { recursive: true, force: true });
    }
    fs.mkdirSync(TEST_ROOT, { recursive: true });

    for (const [filePath, content] of Object.entries(structure)) {
        const fullPath = path.join(TEST_ROOT, filePath);
        fs.mkdirSync(path.dirname(fullPath), { recursive: true });
        fs.writeFileSync(fullPath, content);
    }
    return TEST_ROOT;
}

export function cleanup() {
    if (fs.existsSync(TEST_ROOT)) {
        fs.rmSync(TEST_ROOT, { recursive: true, force: true });
    }
}
