import { execSync } from 'child_process';

// Initialize database schema before running tests
try {
    console.log('Initializing database schema...');

    // Generate Prisma Client for repository_before (uses schema from repository_after)
    execSync('npx prisma generate --schema=../repository_after/prisma/schema.prisma', {
        stdio: 'inherit',
        cwd: 'repository_before'
    });

    // Generate Prisma Client for repository_after
    execSync('npx prisma generate --schema=repository_after/prisma/schema.prisma', {
        stdio: 'inherit'
    });

    // Push database schema
    execSync('npx prisma db push --schema=repository_after/prisma/schema.prisma --skip-generate --accept-data-loss', {
        stdio: 'inherit',
        env: { ...process.env, DATABASE_URL: 'file::memory:?cache=shared' }
    });
    console.log('Database schema initialized successfully');
} catch (error) {
    console.error('Failed to initialize database schema:', error);
    process.exit(1);
}
