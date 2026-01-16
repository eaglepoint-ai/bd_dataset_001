const { execSync } = require('child_process');

// Initialize database schema before running tests
module.exports = async () => {
    try {
        console.log('Initializing database schema...');

        // Generate Prisma Client
        console.log('Generating Prisma Client...');
        execSync('npx prisma generate --schema=repository_after/prisma/schema.prisma', { stdio: 'inherit' });

        execSync('npx prisma db push --schema=repository_after/prisma/schema.prisma --skip-generate --accept-data-loss', {
            stdio: 'inherit',
            env: { ...process.env, DATABASE_URL: 'file:/dev/shm/test.db' }
        });
        console.log('Database schema initialized successfully');
    } catch (error) {
        console.error('Failed to initialize database schema:', error);
        process.exit(1);
    }
};
