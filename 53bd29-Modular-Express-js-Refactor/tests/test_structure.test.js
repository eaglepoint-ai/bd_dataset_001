const fs = require('fs');
const path = require('path');

const REPO_PATH = process.env.TEST_REPO_PATH || path.join(__dirname, '../repository_after');

describe('Structure Tests', () => {
    describe('Directory Structure', () => {
        test('config directory should exist', () => {
            expect(fs.existsSync(path.join(REPO_PATH, 'config'))).toBe(true);
        });

        test('models directory should exist', () => {
            expect(fs.existsSync(path.join(REPO_PATH, 'models'))).toBe(true);
        });

        test('controllers directory should exist', () => {
            expect(fs.existsSync(path.join(REPO_PATH, 'controllers'))).toBe(true);
        });

        test('routes directory should exist', () => {
            expect(fs.existsSync(path.join(REPO_PATH, 'routes'))).toBe(true);
        });

        test('middleware directory should exist', () => {
            expect(fs.existsSync(path.join(REPO_PATH, 'middleware'))).toBe(true);
        });
    });

    describe('Config Files', () => {
        test('all config files should exist', () => {
            expect(fs.existsSync(path.join(REPO_PATH, 'config/database.js'))).toBe(true);
            expect(fs.existsSync(path.join(REPO_PATH, 'config/environment.js'))).toBe(true);
            expect(fs.existsSync(path.join(REPO_PATH, 'config/upload.js'))).toBe(true);
        });
    });

    describe('Model Files', () => {
        test('all model files should exist (one per feature)', () => {
            const models = [
                'Account.js', 'Post.js', 'Comment.js', 'Community.js',
                'CommunityChat.js', 'PrivateChat.js', 'Notification.js', 'Bot.js'
            ];
            
            models.forEach(model => {
                const modelPath = path.join(REPO_PATH, 'models', model);
                expect(fs.existsSync(modelPath)).toBe(true);
            });
        });
    });

    describe('Controller Files', () => {
        test('all controller files should exist (one per feature)', () => {
            const controllers = [
                'authController.js', 'postsController.js', 'interactionsController.js',
                'notificationsController.js', 'searchController.js', 'profileController.js',
                'uploadController.js', 'privateChatsController.js', 'botsController.js',
                'communityController.js'
            ];
            
            controllers.forEach(controller => {
                const controllerPath = path.join(REPO_PATH, 'controllers', controller);
                expect(fs.existsSync(controllerPath)).toBe(true);
            });
        });
    });

    describe('Route Files', () => {
        test('all route files should exist (one per feature)', () => {
            const routes = [
                'authRoutes.js', 'postsRoutes.js', 'interactionsRoutes.js',
                'notificationsRoutes.js', 'searchRoutes.js', 'profileRoutes.js',
                'uploadRoutes.js', 'privateChatsRoutes.js', 'botsRoutes.js',
                'communityRoutes.js'
            ];
            
            routes.forEach(route => {
                const routePath = path.join(REPO_PATH, 'routes', route);
                expect(fs.existsSync(routePath)).toBe(true);
            });
        });
    });

    describe('Middleware', () => {
        test('async handler middleware should exist', () => {
            expect(fs.existsSync(path.join(REPO_PATH, 'middleware/asyncHandler.js'))).toBe(true);
        });
    });

    describe('Main Entry Point', () => {
        test('index.js file should exist', () => {
            expect(fs.existsSync(path.join(REPO_PATH, 'index.js'))).toBe(true);
        });

        test('index.js should be minimal (under 60 lines)', () => {
            const indexPath = path.join(REPO_PATH, 'index.js');
            const content = fs.readFileSync(indexPath, 'utf8');
            const lines = content.split('\n');
            const codeLines = lines.filter(line => {
                const trimmed = line.trim();
                return trimmed && !trimmed.startsWith('//');
            });
            expect(codeLines.length).toBeLessThan(60);
        });
    });

    describe('CommonJS Usage', () => {
        test('should use CommonJS require/module.exports', () => {
            const filesToCheck = [
                'index.js',
                'config/database.js',
                'models/Account.js',
                'controllers/authController.js',
                'routes/authRoutes.js'
            ];

            filesToCheck.forEach(file => {
                const filePath = path.join(REPO_PATH, file);
                const content = fs.readFileSync(filePath, 'utf8');
                
                expect(content).toContain('require(');
                expect(content).toContain('module.exports');
                // Should not use ES6 imports (except dynamic import())
                const hasES6Import = content.includes('import ') && !content.includes('import(');
                expect(hasES6Import).toBe(false);
            });
        });
    });

    describe('Async Error Handling', () => {
        test('controllers should use asyncHandler', () => {
            const controllers = [
                'authController.js', 'postsController.js', 'interactionsController.js',
                'notificationsController.js', 'searchController.js', 'profileController.js'
            ];

            controllers.forEach(controller => {
                const controllerPath = path.join(REPO_PATH, 'controllers', controller);
                const content = fs.readFileSync(controllerPath, 'utf8');
                expect(content).toContain('asyncHandler');
            });
        });
    });

    describe('Route Separation', () => {
        test('routes should only map endpoints, not contain business logic', () => {
            const routes = ['authRoutes.js', 'postsRoutes.js', 'interactionsRoutes.js'];

            routes.forEach(route => {
                const routePath = path.join(REPO_PATH, 'routes', route);
                const content = fs.readFileSync(routePath, 'utf8');
                const lines = content.split('\n');
                const codeLines = lines.filter(line => {
                    const trimmed = line.trim();
                    return trimmed && !trimmed.startsWith('//');
                });

                // Routes should be concise
                expect(codeLines.length).toBeLessThan(30);
                
                // Should not contain await or database calls
                expect(content).not.toContain('await ');
                expect(content).not.toContain('Model.find');
            });
        });
    });

    describe('Model Exports', () => {
        test('models should export mongoose models', () => {
            const models = ['Account.js', 'Post.js', 'Comment.js'];

            models.forEach(model => {
                const modelPath = path.join(REPO_PATH, 'models', model);
                const content = fs.readFileSync(modelPath, 'utf8');
                
                expect(content).toContain('mongoose.Schema');
                expect(content).toContain('mongoose.model');
                expect(content).toContain('module.exports');
            });
        });
    });

    describe('Centralized Configuration', () => {
        test('database config should be centralized', () => {
            const dbPath = path.join(REPO_PATH, 'config/database.js');
            const content = fs.readFileSync(dbPath, 'utf8');
            
            expect(content).toContain('mongoose.connect');
            expect(content).toContain('connectToDB');
        });

        test('environment config should be centralized', () => {
            const envPath = path.join(REPO_PATH, 'config/environment.js');
            const content = fs.readFileSync(envPath, 'utf8');
            
            expect(content).toContain('process.env');
            expect(content).toContain('module.exports');
        });

        test('upload config should be centralized', () => {
            const uploadPath = path.join(REPO_PATH, 'config/upload.js');
            const content = fs.readFileSync(uploadPath, 'utf8');
            
            expect(content).toContain('multer');
            expect(content).toContain('storage');
        });
    });
});
