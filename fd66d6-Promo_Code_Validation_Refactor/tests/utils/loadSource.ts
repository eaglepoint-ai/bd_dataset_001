import * as fs from 'fs';
import * as path from 'path';

/**
 * Utility to load source code files for testing
 */
export class SourceLoader {
  private basePath: string;

  constructor(basePath: string) {
    this.basePath = basePath.trim();
  }

  /**
   * Read subscription.vue file content
   */
  getSubscriptionVueContent(): string {
    const filePath = path.resolve(this.basePath, 'subscription.vue');
    if (!fs.existsSync(filePath)) {
      throw new Error(`subscription.vue not found at ${filePath}`);
    }
    return fs.readFileSync(filePath, 'utf8');
  }

  /**
   * Read payments.service.ts file content
   */
  getPaymentsServiceContent(): string {
    const filePath = path.resolve(this.basePath, 'payments.service.ts');
    if (!fs.existsSync(filePath)) {
      throw new Error(`payments.service.ts not found at ${filePath}`);
    }
    return fs.readFileSync(filePath, 'utf8');
  }

  /**
   * Check if file exists
   */
  fileExists(fileName: string): boolean {
    return fs.existsSync(path.resolve(this.basePath, fileName));
  }

  /**
   * Determine if path is 'before' or 'after' repository
   */
  getRepositoryType(): 'after' | 'before' {
    return this.basePath.includes('repository_after') ? 'after' : 'before';
  }
}