const fs = require('fs');
const path = require('path');

class RefactoringValidator {
  constructor(repositoryPath) {
    this.repositoryPath = repositoryPath;
    this.controllerPath = path.join(repositoryPath, 'SongController.js');
    this.servicePath = path.join(repositoryPath, 'SongService.js');
    this.controllerContent = '';
    this.serviceContent = '';
    this.results = [];
  }

  loadFiles() {
    try {
      this.controllerContent = fs.readFileSync(this.controllerPath, 'utf8');
      if (fs.existsSync(this.servicePath)) {
        this.serviceContent = fs.readFileSync(this.servicePath, 'utf8');
      }
    } catch (err) {
      throw new Error(`Failed to load files: ${err.message}`);
    }
  }

  test(name, condition, message) {
    const passed = condition;
    this.results.push({ name, passed, message: passed ? 'PASS' : message });
    return passed;
  }

  // Criterion 1: Service layer exists
  testServiceLayerExists() {
    return this.test(
      'Service Layer Exists',
      fs.existsSync(this.servicePath) && this.serviceContent.includes('class SongService'),
      'FAIL: No dedicated service layer found'
    );
  }

  // Criterion 2: Controller doesn't call Mongoose directly
  testNoDirectMongooseInController() {
    const hasDirectCalls = /Song\.(find|findById|findByIdAndUpdate|findByIdAndDelete|aggregate|insertMany|deleteMany|save)\(/g.test(this.controllerContent);
    const hasNewSong = /new Song\(/g.test(this.controllerContent);
    return this.test(
      'No Direct Mongoose Calls in Controller',
      !hasDirectCalls && !hasNewSong,
      'FAIL: Controller contains direct Mongoose model calls'
    );
  }

  // Criterion 3: Standardized response format
  testStandardizedResponses() {
    const createMatch = this.controllerContent.match(/createSong:[\s\S]*?res\.status\(201\)\.json\(([^)]+)\)/);
    const hasStandardFormat = createMatch && createMatch[1].includes('message') && createMatch[1].includes('data');
    const noOldFormat = !this.controllerContent.includes("'Recorded Successfully!'") && 
                        !this.controllerContent.includes("'Song updated successfully!'");
    return this.test(
      'Standardized Response Format',
      hasStandardFormat && noOldFormat,
      'FAIL: Responses not standardized to { message, data } format'
    );
  }

  // Criterion 4: Consistent error handling
  testConsistentErrorHandling() {
    const errorResponses = this.controllerContent.match(/\.status\(400\)\.json\([^)]+\)/g) || [];
    const allHaveMessage = errorResponses.every(resp => resp.includes('message'));
    const noErrorKey = !this.controllerContent.includes("{ error:");
    return this.test(
      'Consistent Error Handling',
      allHaveMessage && noErrorKey,
      'FAIL: Error responses use inconsistent format (error vs message)'
    );
  }

  // Criterion 5: ObjectId validation in all ID operations
  testObjectIdValidation() {
    const updateHasValidation = /updateSong:[\s\S]*?validateObjectId\(id\)|isValid\(id\)/g.test(this.controllerContent);
    const deleteHasValidation = /deleteSong:[\s\S]*?validateObjectId\(id\)|isValid\(id\)/g.test(this.controllerContent);
    return this.test(
      'ObjectId Validation',
      updateHasValidation && deleteHasValidation,
      'FAIL: Missing ObjectId validation in update/delete operations'
    );
  }

  // Criterion 6: Safe partial updates
  testSafePartialUpdates() {
    const hasFilterLogic = this.serviceContent.includes('filter') || 
                          this.serviceContent.includes('undefined');
    return this.test(
      'Safe Partial Updates',
      hasFilterLogic,
      'FAIL: updateSong does not filter undefined values'
    );
  }

  // Criterion 7: 404 for missing resources
  test404OnMissingResource() {
    const updateHas404 = /updateSong:[\s\S]*?404/g.test(this.controllerContent);
    const deleteHas404 = /deleteSong:[\s\S]*?404/g.test(this.controllerContent);
    return this.test(
      '404 for Missing Resources',
      updateHas404 && deleteHas404,
      'FAIL: Missing 404 responses when resource not found'
    );
  }

  // Criterion 8: Schema validation on updates
  testSchemaValidation() {
    const hasRunValidators = this.serviceContent.includes('runValidators: true');
    return this.test(
      'Schema Validation on Updates',
      hasRunValidators,
      'FAIL: Updates do not enforce schema validation'
    );
  }

  // Criterion 9: REST conventions in delete
  testRESTDeleteConvention() {
    const deleteMatch = this.controllerContent.match(/deleteSong:[\s\S]*?res\.status\(204\)\.([^;]+)/);
    const uses204 = deleteMatch !== null;
    const usesSend = deleteMatch && deleteMatch[1].includes('send()');
    return this.test(
      'REST Delete Convention',
      uses204 && usesSend,
      'FAIL: Delete does not follow REST convention (204 with no body)'
    );
  }

  // Criterion 10: No body with 204
  testNo204Body() {
    const has204WithJson = /status\(204\)\.json\(/g.test(this.controllerContent);
    return this.test(
      'No Response Body with 204',
      !has204WithJson,
      'FAIL: 204 response includes body (should be empty)'
    );
  }

  // Criterion 11: Pagination support
  testPaginationSupport() {
    const hasPagination = /page|limit/gi.test(this.controllerContent) && 
                         /skip|limit/gi.test(this.serviceContent);
    return this.test(
      'Pagination Support',
      hasPagination,
      'FAIL: getSongs does not support pagination'
    );
  }

  // Criterion 12: Pagination metadata
  testPaginationMetadata() {
    const hasMetadata = /totalPages|pagination/gi.test(this.serviceContent);
    return this.test(
      'Pagination Metadata',
      hasMetadata,
      'FAIL: Pagination response missing metadata (total, totalPages, etc.)'
    );
  }

  // Criterion 13: Zero values for empty dataset
  testZeroValuesForEmpty() {
    const hasDefaultValues = /totalSongs: 0|length > 0/g.test(this.serviceContent);
    return this.test(
      'Zero Values for Empty Dataset',
      hasDefaultValues,
      'FAIL: getTotal does not return zero values for empty database'
    );
  }

  // Criterion 14: No duplicated logic
  testNoDuplicatedLogic() {
    const validationCount = (this.controllerContent.match(/validateObjectId|isValid/g) || []).length;
    const hasHelper = /validateObjectId\s*=/g.test(this.controllerContent);
    return this.test(
      'No Duplicated Validation Logic',
      hasHelper && validationCount >= 2,
      'FAIL: Validation logic is duplicated instead of using helper'
    );
  }

  // Criterion 15: Consistent camelCase naming
  testCamelCaseNaming() {
    const hasOldNaming = /NumberofAlbum/g.test(this.controllerContent) || 
                        /NumberofAlbum/g.test(this.serviceContent);
    const hasNewNaming = /numberOfAlbums/g.test(this.serviceContent);
    return this.test(
      'Consistent camelCase Naming',
      !hasOldNaming && (this.serviceContent ? hasNewNaming : false),
      'FAIL: Inconsistent naming (NumberofAlbum should be numberOfAlbums)'
    );
  }

  // Criterion 16: No new dependencies
  testNoNewDependencies() {
    const allowedRequires = ['mongoose', 'db', 'SongService'];
    const requires = [...this.controllerContent.matchAll(/require\(['"]([^'"]+)['"]\)/g)];
    const allAllowed = requires.every(match => {
      const dep = match[1];
      return allowedRequires.some(allowed => dep.includes(allowed)) || dep.startsWith('.');
    });
    return this.test(
      'No New External Dependencies',
      allAllowed,
      'FAIL: New external dependencies added'
    );
  }

  runAll() {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`Testing: ${this.repositoryPath}`);
    console.log('='.repeat(60));

    this.loadFiles();

    this.testServiceLayerExists();
    this.testNoDirectMongooseInController();
    this.testStandardizedResponses();
    this.testConsistentErrorHandling();
    this.testObjectIdValidation();
    this.testSafePartialUpdates();
    this.test404OnMissingResource();
    this.testSchemaValidation();
    this.testRESTDeleteConvention();
    this.testNo204Body();
    this.testPaginationSupport();
    this.testPaginationMetadata();
    this.testZeroValuesForEmpty();
    this.testNoDuplicatedLogic();
    this.testCamelCaseNaming();
    this.testNoNewDependencies();

    return this.results;
  }

  printResults() {
    const passed = this.results.filter(r => r.passed).length;
    const total = this.results.length;

    console.log('\nTest Results:');
    console.log('-'.repeat(60));
    this.results.forEach((result, index) => {
      const status = result.passed ? '✓' : '✗';
      const color = result.passed ? '\x1b[32m' : '\x1b[31m';
      console.log(`${color}${status}\x1b[0m ${index + 1}. ${result.name}`);
      if (!result.passed) {
        console.log(`   ${result.message}`);
      }
    });
    console.log('-'.repeat(60));
    console.log(`Score: ${passed}/${total} tests passed`);
    console.log('='.repeat(60));

    return { passed, total, success: passed === total };
  }
}

// Run tests if executed directly
if (require.main === module) {
  const beforeValidator = new RefactoringValidator('./repository_before');
  const beforeResults = beforeValidator.runAll();
  const beforeSummary = beforeValidator.printResults();

  const afterValidator = new RefactoringValidator('./repository_after');
  const afterResults = afterValidator.runAll();
  const afterSummary = afterValidator.printResults();

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('SUMMARY');
  console.log('='.repeat(60));
  console.log(`repository_before: ${beforeSummary.passed}/${beforeSummary.total} ❌`);
  console.log(`repository_after:  ${afterSummary.passed}/${afterSummary.total} ${afterSummary.success ? '✅' : '❌'}`);
  console.log('='.repeat(60));

  process.exit(afterSummary.success && !beforeSummary.success ? 0 : 1);
}

module.exports = RefactoringValidator;
