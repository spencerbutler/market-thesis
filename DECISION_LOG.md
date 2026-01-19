# Decision Log

This log records **why** decisions were made, not just what changed.
It is complementary to CHANGELOG.md.

---

## Entry Template

**Date:** YYYY-MM-DD  
**Version Context:** vX.Y  
**Decision:**  
**Category:** Allocation / Risk / Policy / Data  
**Trigger:**  
**Alternatives Considered:**  
**Rationale:**  
**Invalidation Conditions:**  

---

## 2026-01-18 — v1.7

**Decision:** Rebalanced portfolio to reduce CAT concentration and add regional banks  
**Category:** Allocation / Risk  
**Trigger:** CAT exceeded concentration cap; missing credit transmission exposure  
**Alternatives Considered:**  
- Retain CAT overweight without banks  
- Use KRE instead of individual banks  

**Rationale:**  
- Trimmed CAT to ≤25% to reduce single-name risk  
- Added RF and HBAN for direct small-business lending exposure  
- Preserved materials exposure via DOW + FCX  

**Invalidation Conditions:**  
- Credit conditions deteriorate materially  
- Small-business loan growth <5% YoY  
- ISM PMI <48

---
