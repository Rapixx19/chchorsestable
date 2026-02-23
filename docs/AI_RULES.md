# AI ENGINEERING RULES — CHC

## 1. PLAN MODE FIRST (MANDATORY)

Before modifying code the AI must:

1. Identify affected modules
2. Check dependencies
3. Verify constraints
4. Detect risks
5. Confirm scope

If uncertainty exists → ASK USER.

Never guess.

---

## 2. DO NOT MODIFY UNRELATED CODE

AI must only change files required for the prompt.

No refactoring unless explicitly requested.

---

## 3. FILE SUMMARY REQUIREMENT

Every file must start with:

AI must read summaries before editing.

---

## 4. ARCHITECTURE BOUNDARIES

Structure:

src/modules/{module}/

Rules:

- UI does not contain business logic
- Services handle IO
- Domain logic is pure
- Modules are isolated

---

## 5. SAFETY LEVELS

GREEN
- UI
- styles

YELLOW
- services
- business logic

RED
- auth
- billing
- invoices
- infrastructure

RED changes require extra validation.

---

## 6. ACTION-BASED DESIGN

Functions represent actions:

createClient()
assignService()
generateInvoice()

Avoid large monolith functions.

---

## 7. NO HARD DELETES

Financial data must never be deleted.

Use archive or status flags.

---

## 8. CONSISTENCY CHECK AFTER CODING

After changes AI must verify:

- imports valid
- types correct
- no dead code
- naming consistent
- architecture respected

Then provide summary.

---

## 9. TESTING REQUIREMENT

All logic modules require tests.

Critical modules require integration tests.

---

## 10. ASK IF UNSURE

Confidence < 90% → ask user.

---

## 11. LOW COMPLEXITY PRINCIPLE

AI must prefer the simplest working solution.

Rules:

- Avoid unnecessary abstractions
- Avoid premature optimization
- Avoid complex patterns unless required
- Prefer small functions over large systems
- Prefer built-in libraries over external dependencies
- Minimize lines of code while preserving clarity
- Do not introduce frameworks inside modules

If multiple solutions exist → choose the least complex.

---

## 12. PERFORMANCE & WEIGHT CONTROL

AI must minimize:

- bundle size
- dependencies
- runtime cost
- database queries

Avoid heavy libraries unless justified.
