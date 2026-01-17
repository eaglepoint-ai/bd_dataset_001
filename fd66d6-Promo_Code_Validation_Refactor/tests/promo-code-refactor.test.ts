import { SourceLoader } from './utils/loadSource';

const repoPath = process.env.REPO_PATH || 'repository_before';
const loader = new SourceLoader(repoPath);
const repoType = loader.getRepositoryType();

describe(`Promo Code Refactor Tests - ${repoType}`, () => {
  
  describe('Core Functionality', () => {
    
    test('handleActivation signature', () => {
      const content = loader.getSubscriptionVueContent();
      
      if (repoType === 'before') {
        expect(content).toMatch(/promo_code_api_id/);
      } else {
        expect(content).toMatch(/handleActivation.*student_id.*string/);
        expect(content).not.toMatch(/promo_code_api_id/);
      }
    });

    test('subscription payload structure', () => {
      const content = loader.getSubscriptionVueContent();
      
      if (repoType === 'before') {
        expect(content).toMatch(/subscribePayload.*promo_code_api_id/s);
      } else {
        expect(content).toMatch(/subscribePayload.*customer_id/s);
        expect(content).not.toMatch(/subscribePayload.*promo_code_api_id/s);
      }
    });

    test('Stripe session configuration', () => {
      const content = loader.getPaymentsServiceContent();
      
      if (repoType === 'before') {
        expect(content).toMatch(/sessionConfig\.discounts/);
      } else {
        expect(content).toMatch(/allow_promotion_codes:\s*true/);
        expect(content).not.toMatch(/sessionConfig\.discounts/);
      }
    });
  });

  describe('Code Quality', () => {
    
    test('separation of concerns', () => {
      const vueContent = loader.getSubscriptionVueContent();
      const serviceContent = loader.getPaymentsServiceContent();
      
      if (repoType === 'after') {
        const hasStripeSDK = vueContent.includes('stripe.') || vueContent.includes('new Stripe');
        const hasDiscountLogic = vueContent.match(/\bdiscounts?\s*:/i) !== null;
        expect(hasStripeSDK || hasDiscountLogic).toBe(false);
        expect(serviceContent.includes('allow_promotion_codes')).toBe(true);
      }
    });

    test('reduced complexity', () => {
      const content = loader.getSubscriptionVueContent();
      const promoReferences = (content.match(/promo/gi) || []).length;
      
      if (repoType === 'after') {
        expect(promoReferences).toBeLessThan(2);
      }
    });
  });

  describe('File Structure', () => {
    
    test('required files exist', () => {
      expect(loader.fileExists('subscription.vue')).toBe(true);
      expect(loader.fileExists('payments.service.ts')).toBe(true);
    });

    test('component structure intact', () => {
      const content = loader.getSubscriptionVueContent();
      expect(content).toContain('<template>');
      expect(content).toContain('<script setup');
      expect(content).toContain('handleActivation');
    });
  });

  describe('Migration Validation (FAILS for before, PASSES for after)', () => {
    
    test('Stripe promotion codes enabled', () => {
      const content = loader.getPaymentsServiceContent();
      const hasAllowPromotionCodes = content.includes('allow_promotion_codes: true');
      
      // This should FAIL for before, PASS for after
      expect(hasAllowPromotionCodes).toBe(true);
    });

    test('frontend promo logic removed', () => {
      const content = loader.getSubscriptionVueContent();
      const hasPromoCodeParam = content.includes('promo_code_api_id?: string');
      
      // This should FAIL for before, PASS for after
      expect(hasPromoCodeParam).toBe(false);
    });

    test('manual discount logic removed', () => {
      const content = loader.getPaymentsServiceContent();
      const hasManualDiscounts = content.includes('sessionConfig.discounts');
      
      // This should FAIL for before, PASS for after
      expect(hasManualDiscounts).toBe(false);
    });
  });
});
