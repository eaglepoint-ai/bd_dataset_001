const { test, expect } = require('@playwright/test');
const path = require('path');

test.describe('3D Rotating Cube', () => {
    test.beforeEach(async ({ page }) => {
        // Load the local HTML file
        const filePath = path.join(__dirname, '../repository_after/cube.html');
        const fileUrl = `file://${filePath}`;
        await page.goto(fileUrl);
    });

    test('has correct title', async ({ page }) => {
        await expect(page).toHaveTitle('3D Rotating Glassmorphic Cube');
    });

    test('has scene and faces', async ({ page }) => {
        const scene = page.locator('.scene');
        await expect(scene).toBeVisible();

        const faces = page.locator('.cube-face');
        await expect(faces).toHaveCount(6);

        // Check specific faces
        await expect(page.locator('.front')).toHaveText('Front');
        await expect(page.locator('.back')).toHaveText('Back');
        await expect(page.locator('.right')).toHaveText('Right');
        await expect(page.locator('.left')).toHaveText('Left');
        await expect(page.locator('.top')).toHaveText('Top');
        await expect(page.locator('.bottom')).toHaveText('Bottom');
    });

    test('has correct CSS variables', async ({ page }) => {
        // Check for essential CSS variable definition
        const cubeSize = await page.evaluate(() => {
            return getComputedStyle(document.documentElement).getPropertyValue('--cube-size').trim();
        });
        expect(cubeSize).toBe('200px');
    });

    test('visual regression (paused animation)', async ({ page }) => {
        // Pause animation to ensure consistent snapshot
        await page.addStyleTag({
            content: `
            .scene { 
                animation-play-state: paused !important; 
                transform: rotateX(20deg) rotateY(20deg) !important; /* Fixed position for snapshot */
            }
        `
        });

        // Wait for any layout shifts
        await page.waitForTimeout(100);

        // Take screenshot of the main container/body
        await expect(page).toHaveScreenshot('cube-snapshot.png', {
            maxDiffPixels: 100 // Allow slight rendering differences
        });
    });
});
