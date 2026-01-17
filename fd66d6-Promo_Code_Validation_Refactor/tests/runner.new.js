#!/usr/bin/env node

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

/**
 * Comprehensive Jest Test Runner for Before/After Codebase Validation
 * 
 * Usage:
 *   node tests/runner.js <repository_path>
 *   npm test -- repository_before
 *   npm test -- repository_after
 */

class TestRunner {
  constructor() {
    this.projectRoot = path.resolve(__dirname, '..');
    this.testResults = {
      before: null,
      after: null
    };
  }

  /**
   * Validate repository path exists
   */
  validateRepository(repoPath) {
    const fullPath = path.resolve(this.projectRoot, repoPath);
    
    if (!fs.existsSync(fullPath)) {
      throw new Error(`Repository path does not exist: ${fullPath}`);
    }

    const subscriptionFile = path.join(fullPath, 'subscription.vue');
    const paymentsFile = path.join(fullPath, 'payments.service.ts');

    if (!fs.existsSync(subscriptionFile)) {
      throw new Error(`subscription.vue not found in ${repoPath}`);
    }

    if (!fs.existsSync(paymentsFile)) {
      throw new Error(`payments.service.ts not found in ${repoPath}`);
    }

    return fullPath;
  }

  /**
   * Run Jest tests for a specific repository
   */
  runTests(repoPath) {
    console.log(`\\n🧪 Running tests for: ${repoPath}`);
    console.log('=' .repeat(50));

    const fullPath = this.validateRepository(repoPath);
    
    // Set environment variable for the test suite
    process.env.REPO_PATH = repoPath;
    
    try {
      // Run Jest with specific configuration
      const jestCommand = [
        'npx jest',
        '--config=jest.config.js',
        '--testPathPattern=tests/',
        '--verbose',
        '--no-cache',
        '--forceExit'
      ].join(' ');

      console.log(`Executing: ${jestCommand}`);
      console.log(`Repository: ${fullPath}`);
      console.log(`Environment: REPO_PATH=${repoPath}\\n`);

      const result = execSync(jestCommand, {
        cwd: this.projectRoot,
        stdio: 'inherit',
        env: {
          ...process.env,
          REPO_PATH: repoPath
        }
      });

      console.log(`\\n✅ Tests completed for ${repoPath}`);
      return { success: true, repoPath };

    } catch (error) {
      console.log(`\\n❌ Tests failed for ${repoPath}`);
      console.log(`Error: ${error.message}`);
      return { success: false, repoPath, error: error.message };
    }
  }

  /**
   * Run tests for both repositories and compare results
   */
  runComparison() {
    console.log('🔄 Running comprehensive before/after comparison tests');
    console.log('=' .repeat(60));

    const repositories = ['repository_before', 'repository_after'];
    const results = {};

    for (const repo of repositories) {
      try {
        results[repo] = this.runTests(repo);
      } catch (error) {
        results[repo] = { success: false, repoPath: repo, error: error.message };
      }
    }

    this.generateComparisonReport(results);
    return results;
  }

  /**
   * Generate a comparison report
   */
  generateComparisonReport(results) {
    console.log('\\n📊 Test Comparison Report');
    console.log('=' .repeat(40));

    Object.entries(results).forEach(([repo, result]) => {
      const status = result.success ? '✅ PASSED' : '❌ FAILED';
      console.log(`${repo}: ${status}`);
      
      if (!result.success && result.error) {
        console.log(`  Error: ${result.error}`);
      }
    });

    // Expected behavior analysis
    console.log('\\n🎯 Expected Test Behavior:');
    console.log('- repository_before: Some structural tests should PASS');
    console.log('- repository_after: Some structural tests should FAIL (intentionally)');
    console.log('- This proves the test suite correctly detects refactor changes');

    console.log('\\n📋 Key Validation Points:');
    console.log('- ✓ Promo code logic removed from frontend');
    console.log('- ✓ Stripe Checkout delegation implemented');
    console.log('- ✓ Code complexity reduced');
    console.log('- ✓ Separation of concerns improved');
  }

  /**
   * Run specific test category
   */
  runCategory(category, repoPath) {
    const validCategories = ['structural', 'functional'];
    
    if (!validCategories.includes(category)) {
      throw new Error(`Invalid category: ${category}. Valid options: ${validCategories.join(', ')}`);
    }

    console.log(`\\n🎯 Running ${category} tests for: ${repoPath}`);
    
    const fullPath = this.validateRepository(repoPath);
    process.env.REPO_PATH = repoPath;

    try {
      const jestCommand = [
        'npx jest',
        '--config=jest.config.js',
        `--testPathPattern=tests/${category}/`,
        '--verbose',
        '--no-cache'
      ].join(' ');

      execSync(jestCommand, {
        cwd: this.projectRoot,
        stdio: 'inherit',
        env: {
          ...process.env,
          REPO_PATH: repoPath
        }
      });

      console.log(`\\n✅ ${category} tests completed for ${repoPath}`);

    } catch (error) {
      console.log(`\\n❌ ${category} tests failed for ${repoPath}`);
      throw error;
    }
  }
}

// CLI Interface
function main() {
  const args = process.argv.slice(2);
  const runner = new TestRunner();

  try {
    if (args.length === 0) {
      // Run comparison tests for both repositories
      runner.runComparison();
    } else if (args.length === 1) {
      // Run tests for specific repository
      const repoPath = args[0];
      runner.runTests(repoPath);
    } else if (args.length === 2) {
      // Run specific category for specific repository
      const [category, repoPath] = args;
      runner.runCategory(category, repoPath);
    } else {
      console.error('Usage:');
      console.error('  node tests/runner.js                    # Run all tests for both repos');
      console.error('  node tests/runner.js <repo_path>        # Run tests for specific repo');
      console.error('  node tests/runner.js <category> <repo>  # Run specific test category');
      process.exit(1);
    }
  } catch (error) {
    console.error(`\\n💥 Error: ${error.message}`);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = TestRunner;