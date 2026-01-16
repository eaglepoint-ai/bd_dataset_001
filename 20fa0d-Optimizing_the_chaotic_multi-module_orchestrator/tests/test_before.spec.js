/**
 * Comprehensive Test Suite for repository_before (Original ChaoticComponent)
 * SAME tests as test_after.spec.js to demonstrate issues in original code
 * EXPECTED: Many failures showing what the refactoring fixed
 */

import { test, expect } from '@playwright/test';
import { TEST_CONFIG, SELECTORS } from './test_config.js';
import {
  waitForElement,
  getMemoryUsage,
  monitorMemoryGrowth,
  getRenderCount,
  getSyncCounter,
  checkSourceCode,
  countPatternInSource,
  rapidModeSwitching,
  clickAndWaitForLog,
} from './test_utils.js';

const BASE_URL = TEST_CONFIG.BEFORE_URL; // http://localhost:5173

test.describe('ChaoticComponent BEFORE - Baseline Tests', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
  });

  // ========================================================================
  // REQUIREMENT #1: Four-sub-module architecture (SHOULD PASS - exists in both)
  // ========================================================================
  test('Req #1: All four modules render in full mode', async ({ page }) => {
    await page.click(SELECTORS.modeButton('full'));
    await page.waitForTimeout(500);

    const hasAlpha = await page.locator(SELECTORS.alphaSection).count() > 0;
    const hasBeta = await page.locator(SELECTORS.betaSection).count() > 0;
    const hasGamma = await page.locator(SELECTORS.gammaSection).count() > 0;
    const hasDelta = await page.locator(SELECTORS.deltaSection).count() > 0;

    expect(hasAlpha).toBeTruthy();
    expect(hasBeta).toBeTruthy();
    expect(hasGamma).toBeTruthy();
    expect(hasDelta).toBeTruthy();

    console.log('✓ BEFORE: All four modules present');
  });

  test('Req #1: Mode switching works correctly', async ({ page }) => {
    await page.click(SELECTORS.modeButton('alpha'));
    await page.waitForTimeout(300);
    expect(await page.locator(SELECTORS.alphaSection).count()).toBeGreaterThan(0);

    await page.click(SELECTORS.modeButton('beta'));
    await page.waitForTimeout(300);
    expect(await page.locator(SELECTORS.betaSection).count()).toBeGreaterThan(0);

    await page.click(SELECTORS.modeButton('gamma'));
    await page.waitForTimeout(300);
    expect(await page.locator(SELECTORS.gammaSection).count()).toBeGreaterThan(0);

    await page.click(SELECTORS.modeButton('delta'));
    await page.waitForTimeout(300);
    expect(await page.locator(SELECTORS.deltaSection).count()).toBeGreaterThan(0);

    console.log('✓ BEFORE: Mode switching works');
  });

  // ========================================================================
  // REQUIREMENT #2: Two Context providers (SHOULD PASS - exists in both)
  // ========================================================================
  test('Req #2: Sync counter increments over time', async ({ page }) => {
    await page.click(SELECTORS.modeButton('full'));
    const initialSync = await getSyncCounter(page);

    await page.waitForTimeout(6000);

    const finalSync = await getSyncCounter(page);
    expect(finalSync).toBeGreaterThan(initialSync);

    console.log('✓ BEFORE: Context providers working');
  });

  test('Req #2: Theme context provides border colors', async ({ page }) => {
    await page.click(SELECTORS.modeButton('alpha'));
    await page.waitForTimeout(500);

    const alphaItems = await page.locator(SELECTORS.alphaItem).first();
    if (await alphaItems.count() > 0) {
      const borderStyle = await alphaItems.evaluate(el => 
        window.getComputedStyle(el).border
      );
      expect(borderStyle).toBeTruthy();
    }

    console.log('✓ BEFORE: Theme context works');
  });

  // ========================================================================
  // REQUIREMENT #3: mainRef tracking (SHOULD PASS - exists in both)
  // ========================================================================
  test('Req #3: Render count increases with interactions', async ({ page }) => {
    await page.click(SELECTORS.modeButton('alpha'));
    const initialRenderCount = await getRenderCount(page);

    await page.click(SELECTORS.modeButton('beta'));
    await page.waitForTimeout(300);
    await page.click(SELECTORS.modeButton('alpha'));
    await page.waitForTimeout(300);

    const finalRenderCount = await getRenderCount(page);
    expect(finalRenderCount).toBeGreaterThanOrEqual(initialRenderCount);
    expect(finalRenderCount).toBeGreaterThan(0);

    console.log('✓ BEFORE: mainRef tracking functional');
  });

  // ========================================================================
  // REQUIREMENT #4: Memory leaks (EXPECTED TO FAIL - has leaks!)
  // ========================================================================
  test('Req #4: No memory leaks detected', async ({ page }) => {
    await page.goto(BASE_URL + '?mode=full');

    const memoryBefore = await monitorMemoryGrowth(page, 1000, 2);
    await rapidModeSwitching(page, TEST_CONFIG.MODES, 20);
    const memoryAfter = await monitorMemoryGrowth(page, 1000, 2);

    const growth = memoryAfter.final - memoryBefore.initial;
    console.log('⚠ BEFORE: Memory growth: ' + growth.toFixed(2) + ' MB (EXPECTED LEAK)');

    // EXPECTED TO FAIL - original code has memory leaks
    expect(growth).toBeLessThan(TEST_CONFIG.MEMORY_LEAK_THRESHOLD_MB);
  });

  // ========================================================================
  // REQUIREMENT #5: JSON.parse/stringify (EXPECTED TO FAIL - uses it!)
  // ========================================================================
  test('Req #5: No JSON.parse/stringify in critical paths', async () => {
    const hasJSONParse = await checkSourceCode(
      '../repository_before/ChaoticComponent.jsx',
      /JSON\.parse\(JSON\.stringify/
    );

    const hasImmutableUtils = await checkSourceCode(
      '../repository_before/utils.js',
      /setNestedValue|deleteNestedValue|deepMerge/
    );

    console.log('⚠ BEFORE: Uses JSON.parse/stringify (INEFFICIENT)');

    // EXPECTED TO FAIL - original uses JSON.parse/stringify
    expect(hasJSONParse).toBeFalsy();
    expect(hasImmutableUtils).toBeTruthy();
  });

  // ========================================================================
  // REQUIREMENT #6: Gamma pipeline cancellation (EXPECTED TO FAIL - no AbortController)
  // ========================================================================
  test('Req #6: Pipeline cancels on mode switch', async ({ page }) => {
    const consoleLogs = [];
    page.on('console', msg => consoleLogs.push(msg.text()));

    await page.click(SELECTORS.modeButton('gamma'));
    await page.waitForTimeout(200);
    await page.click(SELECTORS.modeButton('alpha'));
    await page.waitForTimeout(2000);

    const pipelineCompleted = consoleLogs.some(log => 
      log.includes('Pipeline finished')
    );

    console.log('⚠ BEFORE: Pipeline cancellation: ' + (pipelineCompleted ? 'FAILED' : 'OK'));

    // EXPECTED TO FAIL - original doesn't cancel properly
    expect(pipelineCompleted).toBeFalsy();
  });

  // ========================================================================
  // REQUIREMENT #7: Debounce timing (EXPECTED TO FAIL - uses 0ms!)
  // ========================================================================
  test('Req #7: Proper 300ms debounce implemented', async () => {
    const hasProperDebounce = await checkSourceCode(
      '../repository_before/SubComponentAlpha.jsx',
      /300/
    );

    const hasZeroTimeout = await checkSourceCode(
      '../repository_before/SubComponentAlpha.jsx',
      /setTimeout\([^,]+,\s*0\)/
    );

    console.log('⚠ BEFORE: Uses 0ms timeout (NO DEBOUNCE)');

    // EXPECTED TO FAIL - original uses setTimeout(..., 0)
    expect(hasProperDebounce).toBeTruthy();
    expect(hasZeroTimeout).toBeFalsy();
  });

  // ========================================================================
  // REQUIREMENT #8: Beta batch processing (EXPECTED TO FAIL - no optimization)
  // ========================================================================
  test('Req #8: Tree renders efficiently with optimization', async ({ page }) => {
    await page.click(SELECTORS.modeButton('beta'));
    await page.waitForTimeout(1500);

    const treeContainer = await page.locator('.sub-beta').count();
    expect(treeContainer).toBeGreaterThan(0);

    const initialNodes = await page.locator('.sub-beta div').count();
    expect(initialNodes).toBeGreaterThan(0);

    const expandable = page.locator('[style*="cursor: pointer"]').first();
    if (await expandable.count() > 0) {
      const startTime = Date.now();
      await expandable.click();
      await page.waitForTimeout(800);
      const endTime = Date.now();

      const finalNodes = await page.locator('.sub-beta div').count();
      expect(finalNodes).toBeGreaterThan(0);

      const renderTime = endTime - startTime;
      console.log('⚠ BEFORE: Tree interaction time: ' + renderTime + 'ms (may be slow)');

      expect(renderTime).toBeLessThan(1000);
    } else {
      console.log('✓ BEFORE: Tree rendered with ' + initialNodes + ' static nodes');
    }
  });

  // ========================================================================
  // REQUIREMENT #9: Delta deep updates (SHOULD PASS - exists but inefficient)
  // ========================================================================
  test('Req #9: Form updates track history with immutability', async ({ page }) => {
    await page.click(SELECTORS.modeButton('delta'));
    await page.waitForTimeout(500);

    const usernameField = page.locator('input[placeholder*="johndoe"]').first();

    if (await usernameField.count() > 0) {
      await usernameField.fill('testuser');
      await page.waitForTimeout(500);

      const historyText = await page.locator(SELECTORS.deltaHistory).textContent();
      expect(historyText).toContain('Modifications');

      console.log('⚠ BEFORE: Form history works (but uses JSON.parse/stringify)');
    }
  });

  // ========================================================================
  // REQUIREMENT #10: Utility functions (EXPECTED TO FAIL - obfuscated names)
  // ========================================================================
  test('Req #10: Utility functions have clear names', async () => {
    const hasClearNames = await checkSourceCode(
      '../repository_before/utils.js',
      /export\s+(const|function)\s+(range|stringHash|reverseMap|createCache)/
    );

    const hasObfuscated = await checkSourceCode(
      '../repository_before/utils.js',
      /const\s+(_r|_h|_m|_z)\s*=/
    );

    console.log('⚠ BEFORE: Uses obfuscated names (_r, _h, _m, _z)');

    // EXPECTED TO FAIL - original uses obfuscated names
    expect(hasClearNames).toBeTruthy();
    expect(hasObfuscated).toBeFalsy();
  });

  // ========================================================================
  // REQUIREMENT #11: TypeScript strict mode (EXPECTED TO FAIL - uses .jsx)
  // ========================================================================
  test('Req #11: TypeScript strict mode enabled', async () => {
    const fs = await import('fs/promises');

    // Check for .tsx files (EXPECTED TO FAIL - uses .jsx)
    let usesTSX = false;
    try {
      await fs.access('../repository_before/ChaoticComponent.tsx');
      usesTSX = true;
    } catch {
      console.log('⚠ BEFORE: Uses .jsx files (NOT TypeScript)');
    }

    expect(usesTSX).toBeTruthy();

    // Try to check tsconfig (may not exist or not strict)
    try {
      const tsconfig = JSON.parse(
        await fs.readFile('../repository_before/tsconfig.json', 'utf-8')
      );

      expect(tsconfig.compilerOptions.strict).toBeTruthy();
      expect(tsconfig.compilerOptions.noImplicitAny).toBeTruthy();
      expect(tsconfig.compilerOptions.strictNullChecks).toBeTruthy();
    } catch {
      console.log('⚠ BEFORE: No strict TypeScript config');
      throw new Error('TypeScript strict mode not enabled');
    }
  });

  // ========================================================================
  // REQUIREMENT #12: Self-contained (SHOULD PASS - no external state libs)
  // ========================================================================
  test('Req #12: Remains self-contained', async () => {
    const fs = await import('fs/promises');
    const packageJson = JSON.parse(
      await fs.readFile('../repository_before/package.json', 'utf-8')
    );

    const deps = {
      ...packageJson.dependencies,
      ...packageJson.devDependencies
    };

    const hasRedux = 'redux' in deps || '@reduxjs/toolkit' in deps;
    const hasMobX = 'mobx' in deps;
    const hasZustand = 'zustand' in deps;

    expect(hasRedux).toBeFalsy();
    expect(hasMobX).toBeFalsy();
    expect(hasZustand).toBeFalsy();

    console.log('✓ BEFORE: Self-contained');
  });

  // ========================================================================
  // INTEGRATION TEST
  // ========================================================================
  test('Integration: Complete user workflow with performance check', async ({ page }) => {
    const startRenderCount = await getRenderCount(page);

    await page.click(SELECTORS.modeButton('full'));
    await page.waitForTimeout(500);

    const alphaItem = page.locator(SELECTORS.alphaItem).first();
    if (await alphaItem.count() > 0) {
      await alphaItem.click();
      await page.waitForTimeout(300);
    }

    await page.click(SELECTORS.modeButton('delta'));
    await page.waitForTimeout(500);

    const usernameField = page.locator('input').first();
    if (await usernameField.count() > 0) {
      await usernameField.fill('integration_test');
      await page.waitForTimeout(500);
    }

    await page.click(SELECTORS.modeButton('gamma'));
    await page.waitForTimeout(2000);

    const gammaResult = page.locator(SELECTORS.gammaResult);
    if (await gammaResult.count() > 0) {
      const resultText = await gammaResult.textContent();
      expect(resultText).toContain('300');
    }

    const endRenderCount = await getRenderCount(page);
    const renderDelta = endRenderCount - startRenderCount;

    console.log('⚠ BEFORE: Integration render delta: ' + renderDelta + ' (may be high)');

    // More lenient for BEFORE (expected to have more re-renders)
    expect(renderDelta).toBeLessThan(50);
  });

  // ========================================================================
  // PERFORMANCE COMPARISON (EXPECTED TO FAIL - excessive re-renders)
  // ========================================================================
  test('Performance: Verify optimized rendering', async ({ page }) => {
    await page.click(SELECTORS.modeButton('alpha'));

    const initialCount = await getRenderCount(page);

    const alphaItem = page.locator(SELECTORS.alphaItem).first();
    if (await alphaItem.count() > 0) {
      await alphaItem.click();
      await page.waitForTimeout(300);
    }

    const finalCount = await getRenderCount(page);
    const renderIncrease = finalCount - initialCount;

    console.log('⚠ BEFORE: Re-renders: ' + renderIncrease + ' (EXPECTED TO BE HIGH)');

    // EXPECTED TO FAIL - original has excessive re-renders
    expect(renderIncrease).toBeLessThan(TEST_CONFIG.RENDER_COUNT_THRESHOLD);
  });
});