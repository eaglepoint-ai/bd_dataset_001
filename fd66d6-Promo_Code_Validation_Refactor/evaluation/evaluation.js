const fs = require('fs');
const path = require('path');

// Evaluation script for promo code validation migration
function evaluatePromoCodeMigration() {
  const results = {
    frontend_validation_removed: false,
    stripe_checkout_enabled: false,
    promo_code_param_removed: false,
    allow_promotion_codes_added: false,
    manual_discount_logic_removed: false
  };

  try {
    // Check frontend changes
    const subscriptionVue = fs.readFileSync(
      path.join(__dirname, 'repository_after', 'subscription.vue'), 
      'utf8'
    );
    
    // Verify promo code validation is removed
    results.promo_code_param_removed = !subscriptionVue.includes('promo_code_api_id');
    results.frontend_validation_removed = !subscriptionVue.includes('promo_code_api_id');

    // Check backend changes
    const paymentsService = fs.readFileSync(
      path.join(__dirname, 'repository_after', 'payments.service.ts'), 
      'utf8'
    );
    
    // Verify Stripe Checkout promo codes are enabled
    results.allow_promotion_codes_added = paymentsService.includes('allow_promotion_codes: true');
    results.stripe_checkout_enabled = paymentsService.includes('allow_promotion_codes: true');
    
    // Verify manual discount logic is removed
    results.manual_discount_logic_removed = !paymentsService.includes('sessionConfig.discounts');

    console.log('Migration Evaluation Results:');
    console.log('✅ Frontend promo code validation removed:', results.frontend_validation_removed);
    console.log('✅ Stripe Checkout promo codes enabled:', results.stripe_checkout_enabled);
    console.log('✅ Manual discount logic removed:', results.manual_discount_logic_removed);
    
    const allPassed = Object.values(results).every(result => result === true);
    console.log('\n🎯 Migration Status:', allPassed ? 'SUCCESS' : 'INCOMPLETE');
    
    return results;
  } catch (error) {
    console.error('Evaluation failed:', error.message);
    return results;
  }
}

if (require.main === module) {
  evaluatePromoCodeMigration();
}

module.exports = { evaluatePromoCodeMigration };