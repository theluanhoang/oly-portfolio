#!/bin/sh
set -e

SRC_DIR="$1"
DST_DIR="$2"

mkdir -p "$DST_DIR/node_modules"
mkdir -p "$DST_DIR/.bin"

if [ -d "$SRC_DIR/node_modules/.bin" ]; then
    cp -r "$SRC_DIR/node_modules/.bin/prisma" "$DST_DIR/.bin/prisma" 2>/dev/null || true
fi

if [ -d "$SRC_DIR/node_modules/prisma" ]; then
    cp -r "$SRC_DIR/node_modules/prisma" "$DST_DIR/node_modules/prisma" 2>/dev/null || true
fi

if [ -d "$SRC_DIR/node_modules/dotenv" ]; then
    cp -r "$SRC_DIR/node_modules/dotenv" "$DST_DIR/node_modules/dotenv" 2>/dev/null || true
fi

if [ -f "$SRC_DIR/node_modules/prisma/package.json" ]; then
    node -e "
    const fs = require('fs');
    const path = require('path');
    
    const srcDir = process.argv[1];
    const dstDir = process.argv[2];
    const copied = new Set();
    
    const copyPackage = (pkgName) => {
        if (copied.has(pkgName)) {
            return;
        }
        copied.add(pkgName);
        
        const src = path.join(srcDir, 'node_modules', pkgName);
        const dst = path.join(dstDir, 'node_modules', pkgName);
        
        if (!fs.existsSync(src) || fs.existsSync(dst)) {
            return;
        }
        
        try {
            fs.mkdirSync(path.dirname(dst), { recursive: true });
            fs.cpSync(src, dst, { recursive: true });
            
            const removeUnnecessaryFiles = (dir) => {
                try {
                    const entries = fs.readdirSync(dir, { withFileTypes: true });
                    for (const entry of entries) {
                        const fullPath = path.join(dir, entry.name);
                        if (entry.isDirectory()) {
                            if (['test', 'tests', '__tests__', 'docs', 'examples', '.cache', '.github', 'coverage', '.nyc_output'].includes(entry.name)) {
                                try {
                                    fs.rmSync(fullPath, { recursive: true, force: true });
                                } catch (e) {
                                }
                            } else {
                                removeUnnecessaryFiles(fullPath);
                            }
                        } else if (entry.isFile()) {
                            const ext = path.extname(entry.name);
                            const name = entry.name.toLowerCase();
                            if (ext === '.map' || 
                                ext === '.md' || 
                                (ext === '.ts' && !fullPath.includes('/dist/') && !fullPath.includes('/lib/') && !fullPath.includes('/build/')) ||
                                (ext === '.tsx' && !fullPath.includes('/dist/') && !fullPath.includes('/lib/') && !fullPath.includes('/build/')) ||
                                ext === '.d.ts' ||
                                name.startsWith('changelog') ||
                                name.startsWith('license') ||
                                name.startsWith('readme') ||
                                name.startsWith('notice') ||
                                name.endsWith('.txt')) {
                                try {
                                    fs.unlinkSync(fullPath);
                                } catch (e) {
                                }
                            }
                        }
                    }
                } catch (e) {
                }
            };
            
            removeUnnecessaryFiles(dst);
            
            const pkgJson = path.join(src, 'package.json');
            if (fs.existsSync(pkgJson)) {
                const pkg = JSON.parse(fs.readFileSync(pkgJson, 'utf8'));
                const deps = {...(pkg.dependencies || {}), ...(pkg.optionalDependencies || {})};
                
                for (const dep of Object.keys(deps)) {
                    copyPackage(dep);
                }
            }
        } catch (e) {
        }
    };
    
    try {
        const prismaPkg = JSON.parse(fs.readFileSync(path.join(srcDir, 'node_modules/prisma/package.json'), 'utf8'));
        const prismaDeps = {...(prismaPkg.dependencies || {}), ...(prismaPkg.optionalDependencies || {})};
        
        for (const dep of Object.keys(prismaDeps)) {
            copyPackage(dep);
        }
    } catch (e) {
    }
    " "$SRC_DIR" "$DST_DIR"
fi

