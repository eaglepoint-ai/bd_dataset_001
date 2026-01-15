const fs = require('fs');
const path = require('path');

const REPO_BEFORE = path.join(__dirname, '../repository_before');
const REPO_AFTER = path.join(__dirname, '../repository_after');
const REPO_PATH = process.env.TEST_REPO_PATH || REPO_AFTER;

describe('Equivalence Tests', () => {
    
    function extractRoutesFromMonolith(filepath) {
        const content = fs.readFileSync(filepath, 'utf8');
        const routePattern = /app\.(get|post|put|delete|patch)\s*\(\s*["']([^"']+)["']/g;
        const routes = [];
        let match;
        
        while ((match = routePattern.exec(content)) !== null) {
            routes.push([match[1].toUpperCase(), match[2]]);
        }
        
        return routes;
    }

    function extractRoutesFromModular(basePath) {
        const routes = [];
        
        // Read index.js to get route prefixes
        const indexPath = path.join(basePath, 'index.js');
        const indexContent = fs.readFileSync(indexPath, 'utf8');
        
        // Find app.use statements with route prefixes
        const usePattern = /app\.use\s*\(\s*["']([^"']+)["']\s*,\s*(\w+)\s*\)/g;
        const routeMounts = [];
        let match;
        
        while ((match = usePattern.exec(indexContent)) !== null) {
            routeMounts.push([match[1], match[2]]);
        }
        
        // Map route files to their prefixes
        const prefixMap = {};
        routeMounts.forEach(([prefix, routeVar]) => {
            const requirePattern = new RegExp(`const\\s+${routeVar}\\s*=\\s*require\\s*\\(\\s*["']\\.\\/routes\\/(\\w+)["']`);
            const requireMatch = indexContent.match(requirePattern);
            if (requireMatch) {
                prefixMap[requireMatch[1]] = prefix;
            }
        });
        
        // Read each route file
        const routesDir = path.join(basePath, 'routes');
        if (fs.existsSync(routesDir)) {
            const files = fs.readdirSync(routesDir);
            files.forEach(filename => {
                if (filename.endsWith('.js')) {
                    const routeFile = filename.replace('.js', '');
                    const prefix = prefixMap[routeFile] || '';
                    
                    const filePath = path.join(routesDir, filename);
                    const content = fs.readFileSync(filePath, 'utf8');
                    
                    const routePattern = /router\.(get|post|put|delete|patch)\s*\(\s*["']([^"']+)["']/g;
                    let routeMatch;
                    
                    while ((routeMatch = routePattern.exec(content)) !== null) {
                        const fullPath = routeMatch[2] === '/' ? prefix + '/' : prefix + routeMatch[2];
                        routes.push([routeMatch[1].toUpperCase(), fullPath]);
                    }
                }
            });
        }
        
        // Also check for root route in index.js
        const rootPattern = /app\.(get|post)\s*\(\s*["']([^"']+)["']/g;
        while ((match = rootPattern.exec(indexContent)) !== null) {
            routes.push([match[1].toUpperCase(), match[2]]);
        }
        
        return routes;
    }

    describe('Route Preservation', () => {
        test('all routes from before should exist in after', () => {
            const beforeRoutes = extractRoutesFromMonolith(path.join(REPO_BEFORE, 'index.js'));
            const afterRoutes = extractRoutesFromModular(REPO_PATH);
            
            const beforeSet = new Set(beforeRoutes.map(r => JSON.stringify(r)));
            const afterSet = new Set(afterRoutes.map(r => JSON.stringify(r)));
            
            const missingRoutes = [...beforeSet].filter(r => !afterSet.has(r));
            
            expect(missingRoutes).toEqual([]);
        });

        test('number of routes should match', () => {
            const beforeRoutes = extractRoutesFromMonolith(path.join(REPO_BEFORE, 'index.js'));
            const afterRoutes = extractRoutesFromModular(REPO_PATH);
            
            expect(afterRoutes.length).toBe(beforeRoutes.length);
        });
    });

    describe('Model Preservation', () => {
        test('all mongoose models should be preserved', () => {
            const beforePath = path.join(REPO_BEFORE, 'index.js');
            const beforeContent = fs.readFileSync(beforePath, 'utf8');
            
            const modelPattern = /mongoose\.model\s*\(\s*["']([^"']+)["']/g;
            const beforeModels = new Set();
            let match;
            
            while ((match = modelPattern.exec(beforeContent)) !== null) {
                beforeModels.add(match[1]);
            }
            
            const afterModels = new Set();
            const modelsDir = path.join(REPO_PATH, 'models');
            if (fs.existsSync(modelsDir)) {
                const files = fs.readdirSync(modelsDir);
                files.forEach(filename => {
                    if (filename.endsWith('.js')) {
                        const filePath = path.join(modelsDir, filename);
                        const content = fs.readFileSync(filePath, 'utf8');
                        
                        while ((match = modelPattern.exec(content)) !== null) {
                            afterModels.add(match[1]);
                        }
                    }
                });
            }
            
            expect([...afterModels].sort()).toEqual([...beforeModels].sort());
        });
    });

    describe('Middleware Preservation', () => {
        test('core middleware should be preserved', () => {
            const beforePath = path.join(REPO_BEFORE, 'index.js');
            const beforeContent = fs.readFileSync(beforePath, 'utf8');
            
            const afterPath = path.join(REPO_PATH, 'index.js');
            const afterContent = fs.readFileSync(afterPath, 'utf8');
            
            expect(beforeContent).toContain('cors()');
            expect(afterContent).toContain('cors()');
            
            expect(beforeContent).toContain('express.json()');
            expect(afterContent).toContain('express.json()');
            
            expect(beforeContent).toContain('express.urlencoded');
            expect(afterContent).toContain('express.urlencoded');
        });
    });

    describe('Database Connection', () => {
        test('database connection logic should be preserved', () => {
            const beforePath = path.join(REPO_BEFORE, 'index.js');
            const beforeContent = fs.readFileSync(beforePath, 'utf8');
            
            expect(beforeContent).toContain('mongoose.connect');
            
            const dbPath = path.join(REPO_PATH, 'config/database.js');
            const dbContent = fs.readFileSync(dbPath, 'utf8');
            
            expect(dbContent).toContain('mongoose.connect');
            
            const indexPath = path.join(REPO_PATH, 'index.js');
            const indexContent = fs.readFileSync(indexPath, 'utf8');
            
            expect(indexContent).toContain('connectToDB');
        });
    });

    describe('Environment Variables', () => {
        test('environment variable usage should be preserved', () => {
            const beforePath = path.join(REPO_BEFORE, 'index.js');
            const beforeContent = fs.readFileSync(beforePath, 'utf8');
            
            expect(beforeContent).toMatch(/process\.env\.APP_NAME|APP_NAME/);
            expect(beforeContent).toMatch(/process\.env\.PORT|PORT/);
            expect(beforeContent).toMatch(/process\.env\.DBURL|DBURL/);
            
            const envPath = path.join(REPO_PATH, 'config/environment.js');
            const envContent = fs.readFileSync(envPath, 'utf8');
            
            expect(envContent).toContain('process.env');
            expect(envContent).toMatch(/APP_NAME|appName/);
            expect(envContent).toMatch(/PORT|port/);
        });
    });

    describe('Multer Configuration', () => {
        test('multer file upload configuration should be preserved', () => {
            const beforePath = path.join(REPO_BEFORE, 'index.js');
            const beforeContent = fs.readFileSync(beforePath, 'utf8');
            
            expect(beforeContent).toContain('multer');
            expect(beforeContent).toContain('diskStorage');
            
            const uploadPath = path.join(REPO_PATH, 'config/upload.js');
            const uploadContent = fs.readFileSync(uploadPath, 'utf8');
            
            expect(uploadContent).toContain('multer');
            expect(uploadContent).toContain('diskStorage');
        });
    });

    describe('Package Dependencies', () => {
        test('package.json should be preserved with same dependencies', () => {
            const beforePkg = JSON.parse(fs.readFileSync(path.join(REPO_BEFORE, 'package.json'), 'utf8'));
            const afterPkg = JSON.parse(fs.readFileSync(path.join(REPO_PATH, 'package.json'), 'utf8'));
            
            expect(afterPkg.dependencies).toEqual(beforePkg.dependencies);
        });
    });
});
