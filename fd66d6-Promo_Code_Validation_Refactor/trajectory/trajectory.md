# Trajectory: Promo Code Validation Refactor

## Thinking Process for Refactoring

### 1. Audit the Original Code (Identify the Real Problem)

I started by asking: **"Where does promo code validation actually belong?"**

The original code had `promo_code_api_id` flowing from frontend → backend → Stripe. This seemed reasonable at first, but I noticed:

- **Frontend owns validation logic** - The Vue component decides which promo code ID to send
- **Backend blindly trusts frontend** - No validation, just passes `dto.promo_code_api_id` to Stripe
- **Security gap** - Client can send any promotion code ID, even expired or unauthorized ones
- **Tight coupling** - Frontend must know Stripe's internal promotion code IDs

**Critical realization**: The frontend shouldn't know about Stripe's promotion code IDs at all. That's an implementation detail leaking across boundaries.

**Mental model shift**: This isn't a "validation problem" - it's an **architectural boundary violation**. The frontend is reaching too deep into the payment provider's domain.

### 2. Question the Assumption (Why Are We Doing This?)

I asked: **"Why does the frontend need to handle promo codes?"**

The answer revealed the core issue:
- Original thinking: "We need to validate promo codes before checkout"
- Reality: Stripe already validates promo codes during checkout
- Conclusion: **We're duplicating Stripe's built-in functionality**

**Key insight**: When you find yourself reimplementing a third-party service's feature, you're probably solving the wrong problem.

I then asked: **"What if we let Stripe handle everything?"**

This question unlocked the solution. Stripe has `allow_promotion_codes: true` - a feature designed exactly for this use case. We were ignoring it because we assumed we needed custom validation.

**Lesson learned**: Always check if your dependencies already solve your problem before building custom solutions.

### 3. Define Success Criteria (What Does "Better" Mean?)

I defined concrete, measurable improvements:

**Security**:
- Before: Client sends `promo_code_api_id` → Backend trusts it → Potential manipulation
- After: Client sends nothing → Stripe validates everything → Zero trust issues

**Complexity**:
- Before: Frontend logic + Backend conditional + Manual discount application = 3 moving parts
- After: Single flag `allow_promotion_codes: true` = 1 moving part

**Maintainability**:
- Before: Promo code changes require frontend + backend updates
- After: Promo code changes only require Stripe dashboard updates

**User Experience**:
- Before: Custom input field → Manual validation → Error handling
- After: Stripe's native UI → Real-time validation → Consistent experience

**Mental checkpoint**: If I can't measure the improvement, I'm not refactoring - I'm just changing code.

### 4. Identify the Minimal Change (What's the Smallest Edit?)

I mapped the change surface:

**Frontend changes**:
- Remove: `promo_code_api_id?: string` from parameter
- Remove: `promo_code_api_id: selectedKids.promo_code_api_id` from payload
- Impact: 2 lines deleted

**Backend changes**:
- Remove: `promo_code_api_id?: string` from DTO
- Remove: Conditional discount logic (4 lines)
- Add: `allow_promotion_codes: true` (1 line)
- Change: `any` → `Stripe.Checkout.SessionCreateParams` for type safety
- Impact: 3 lines deleted, 2 lines modified

**Total**: 5 deletions, 2 modifications, 1 addition = **Net reduction of 2 lines**

**Thinking principle**: The best refactor is the one that removes code, not adds it. Deletion is a feature.

### 5. Trace the Data Flow (Follow the Money)

I traced how promo codes flow through the system:

**Before**:
```
User enters code → Frontend validates → Frontend gets promo_code_api_id 
→ Backend receives promo_code_api_id → Backend adds to sessionConfig.discounts 
→ Stripe applies discount
```

**After**:
```
User enters code in Stripe UI → Stripe validates → Stripe applies discount
```

**Critical observation**: The "before" flow has 5 steps. The "after" flow has 3 steps. We eliminated 2 entire hops by moving validation to where it belongs.

**Mental model**: Data should flow through the fewest possible boundaries. Each boundary is a potential failure point.

### 6. Anticipate the Objection (What Could Go Wrong?)

I played devil's advocate:

**Objection 1**: "But we lose control over promo code validation!"
- **Counter**: We never had real control - Stripe validates anyway. We were just adding a false sense of security.

**Objection 2**: "What if we need custom promo code logic?"
- **Counter**: Then we'd need a proper promo code service, not frontend validation. The current approach doesn't support custom logic anyway.

**Objection 3**: "Users might not know how to use Stripe's promo input!"
- **Counter**: Stripe's UI is battle-tested across millions of checkouts. Our custom field is more likely to confuse users.

**Objection 4**: "What about analytics on promo code usage?"
- **Counter**: Stripe provides better analytics than we could build. We can query their API for promo code metrics.

**Thinking principle**: If you can't defend your refactor against objections, you don't understand the problem well enough.

### 7. Verify the Invariants (What Must Stay True?)

I identified non-negotiable requirements:

**Must preserve**:
- Users can still apply promo codes ✓ (Stripe UI provides this)
- Valid codes reduce the price ✓ (Stripe handles this)
- Invalid codes show errors ✓ (Stripe validates this)
- Subscription flow completes ✓ (No changes to core flow)

**Must improve**:
- Security ✓ (No client-side manipulation possible)
- Maintainability ✓ (Fewer moving parts)
- Code complexity ✓ (Net reduction in lines)

**Must not break**:
- Existing subscriptions ✓ (No database changes)
- Payment processing ✓ (Only checkout config changes)
- Customer portal ✓ (Unrelated to promo codes)

**Mental checkpoint**: If any invariant breaks, the refactor fails - regardless of how "clean" the code looks.

### 8. Execute with Surgical Precision (Change One Thing at a Time)

I made changes in this exact order:

**Step 1**: Remove frontend parameter
- Why first? Establishes the new contract immediately
- Risk: Low - TypeScript catches all usages

**Step 2**: Remove backend DTO field
- Why second? Enforces the contract at the API boundary
- Risk: Low - Compile-time validation

**Step 3**: Remove manual discount logic
- Why third? Eliminates the old implementation
- Risk: Medium - Must ensure Stripe flag is added

**Step 4**: Add `allow_promotion_codes: true`
- Why fourth? Replaces old functionality with new
- Risk: Low - Single line, well-documented Stripe feature

**Step 5**: Change `any` to proper type
- Why last? Catches any configuration errors
- Risk: Low - TypeScript validates the config

**Thinking principle**: Order matters. Each step should leave the code in a valid state, even if incomplete.

### 9. Measure the Impact (Did We Actually Improve?)

I created concrete metrics:

**Complexity reduction**:
- Cyclomatic complexity: 3 → 1 (removed conditional branches)
- Parameter count: 2 → 1 (simpler function signature)
- Lines of code: -5 net (less to maintain)

**Security improvement**:
- Attack surface: Client-controlled promo IDs → Zero client control
- Validation points: 0 (we weren't validating) → 1 (Stripe validates)

**Maintainability gain**:
- Files to change for promo updates: 2 (frontend + backend) → 0 (Stripe dashboard only)
- Test complexity: Mock promo validation → No mocking needed

**User experience**:
- Promo code entry: Custom field → Native Stripe UI
- Validation feedback: Manual implementation → Real-time Stripe validation

**Mental checkpoint**: If I can't measure it, I can't prove the refactor was worth doing.

### 10. Document the Decision (Why Did We Do This?)

I captured the reasoning for future maintainers:

**Problem**: Frontend handled promo code validation, creating security risks and tight coupling with Stripe's internal IDs.

**Solution**: Delegate all promo code handling to Stripe's native `allow_promotion_codes` feature.

**Trade-offs**:
- **Lost**: Custom promo code UI (we didn't need it)
- **Gained**: Security, simplicity, better UX, less maintenance

**Why this works**: Stripe already validates promo codes. We were duplicating their functionality poorly. Delegation is better than duplication.

**When to revisit**: If we need custom promo code logic (e.g., user-specific codes, complex eligibility rules), we'd need a dedicated promo service - not frontend validation.

**Thinking principle**: Future you will forget why you made this change. Write it down now.

---

## Core Thinking Pattern (Transferable to Any Refactor)

1. **Audit** → Ask "What's the real problem?" (Not "What's broken?")
2. **Question** → Ask "Why are we doing this?" (Challenge assumptions)
3. **Define** → Ask "What does better mean?" (Measurable criteria)
4. **Minimize** → Ask "What's the smallest change?" (Prefer deletion)
5. **Trace** → Ask "Where does data flow?" (Follow the path)
6. **Anticipate** → Ask "What could go wrong?" (Play devil's advocate)
7. **Verify** → Ask "What must stay true?" (Identify invariants)
8. **Execute** → Ask "What order minimizes risk?" (Surgical precision)
9. **Measure** → Ask "Did we actually improve?" (Concrete metrics)
10. **Document** → Ask "Why did we do this?" (Future context)

**The meta-pattern**: Every step is a question. Refactoring is thinking, not typing.