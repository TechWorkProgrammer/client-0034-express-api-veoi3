import fs from "fs";
import path from "path";

export function findProjectRoot(startDir = process.cwd()): string {
    let dir = startDir;
    while (true) {
        if (fs.existsSync(path.join(dir, "package.json"))) return dir;
        const parent = path.dirname(dir);
        if (parent === dir) return startDir;
        dir = parent;
    }
}

export function resolveFromRoot(p: string): string {
    if (!p) return findProjectRoot();
    if (path.isAbsolute(p)) return p;
    return path.join(findProjectRoot(), p);
}
