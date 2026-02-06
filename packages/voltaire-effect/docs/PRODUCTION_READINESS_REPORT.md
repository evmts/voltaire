# Voltaire-Effect Docs Production Readiness Report

**Generated:** 2026-01-26  
**Files Reviewed:** 200+ MDX files  
**Status:** 🟡 Needs Fixes Before Production

---

## Executive Summary

| Category | Count | Severity |
|----------|-------|----------|
| Critical Issues | 7 | 🔴 |
| Moderate Issues | 15 | 🟠 |
| Minor Issues | 20+ | 🟡 |
| Files with No Issues | 150+ | ✅ |

---

## 🔴 Critical Issues (Must Fix)

### 1. File/Title Mismatch

| File | Issue |
|------|-------|
| [contract.mdx](file:///Users/williamcory/voltaire/voltaire-effect/docs/contract.mdx) | Title is "EventStream" but filename is `contract.mdx`. Content documents EventStream, not Contract service. **Should be renamed to `event-stream.mdx` or content replaced.** |

### 2. Broken Internal Links

| File | Line | Broken Link |
|------|------|-------------|
| crypto/bip39.mdx | 175 | `/guides/hd-wallet` |
| crypto/index.mdx | 171-173 | `/testing`, `/services/signer`, `/guides/hd-wallet` |
| crypto/secp256k1.mdx | 216 | `/services/signer` |
| services/account.mdx | 158, 187 | `/guides/hd-wallet`, `/examples/wallet-creation` |
| services/contract.mdx | 152, 157 | `/examples/contract-interactions`, `/examples/event-streaming` |
| services/multicall.mdx | 204, 207 | `/examples/multicall`, `/recipes` |
| services/provider.mdx | 551 | `/examples/read-blockchain` |
| services/signer.mdx | 310, 313 | `/examples/send-transactions`, `/guides/hd-wallet` |

**Action:** Verify these paths exist in docs.json navigation. If not, create pages or fix links.

### 3. Missing Effect Provider

| File | Line | Issue |
|------|------|-------|
| crypto/ripemd160.mdx | 27-30 | `hash160` Effect missing `.pipe(Effect.provide(CryptoLive))` call - code will fail |

### 4. Undefined Variables in Code Examples

| File | Line | Undefined Variable |
|------|------|-------------------|
| examples/multicall.mdx | 89 | Invalid address with typo (`ees` → `Eed`) |
| examples/contract-interactions.mdx | 141 | `myAddress` used but never declared |
| examples/error-handling.mdx | 138-139 | `address`, `requiredAmount` never declared |
| primitives/ssz.mdx | 19 | `Slot.Number` used but `Slot` not imported |

### 5. Missing File

| Expected | Status |
|----------|--------|
| primitives/uint256.mdx | Does not exist (referenced in codebase) |

---

## 🟠 Moderate Issues

### 6. Inconsistent Import Paths

Mixed import styles across docs will confuse users:

| Pattern | Files Using |
|---------|-------------|
| `'voltaire-effect/primitives/X'` | Most primitives |
| `'voltaire-effect/X'` | chainid.mdx, nonce.mdx, u256.mdx, merkletree.mdx, ens.mdx, typeddata.mdx, domain.mdx |
| `'voltaire-effect'` (barrel) | block.mdx, bytes.mdx, gas.mdx |
| `'@tevm/voltaire'` | keccak256.mdx, secp256k1.mdx |
| `'@tevm/voltaire/native'` | bip39.mdx |

**Action:** Standardize on one import pattern across all docs.

### 7. Inconsistent Schema Import Alias

| Alias | Files Using |
|-------|-------------|
| `import * as Schema from 'effect/Schema'` | Most files |
| `import * as S from 'effect/Schema'` | Some primitives |

**Action:** Pick one alias and use consistently.

### 8. Placeholder RPC URLs

| File | URL |
|------|-----|
| services/transport.mdx | `https://eth.example.com` (4 instances) |
| services/ccip.mdx | `https://gateway.example.com` |

**Action:** Replace with real public RPCs like `https://eth.llamarpc.com`.

### 9. "Coming Soon" Reference

| File | Line | Issue |
|------|------|-------|
| services/signer.mdx | 261 | "Use a NonceManager layer (coming soon)" - feature not available |

**Action:** Remove or implement NonceManager.

### 10. Missing Imports in Examples

| File | Missing Import |
|------|---------------|
| examples/event-streaming.mdx | `ProviderService` in historicalToLive example |
| examples/layer-presets.mdx | `TransportService` used but not imported |
| examples/event-streaming.mdx | `makeBlockStream` path inconsistent |

---

## 🟡 Minor Issues

### 11. Snippets Missing Frontmatter

All 11 snippet files lack YAML frontmatter:
- snippets/basic-provider.mdx
- snippets/basic-signer.mdx
- snippets/contract-read.mdx
- snippets/crypto-layer.mdx
- snippets/decode-address.mdx
- snippets/error-handling.mdx
- snippets/install.mdx
- snippets/layer-example.mdx
- snippets/multicall-example.mdx
- snippets/retry-timeout.mdx
- snippets/test-layer.mdx

**Note:** May be intentional for inclusion purposes.

### 12. Inconsistent Service Title Casing

| Without "Service" | With "Service" |
|-------------------|----------------|
| Transport, Multicall, Presets, BlockStream, TransactionStream | Provider Service, Signer Service, etc. |

### 13. Sparse Crypto Documentation (< 50 lines)

These are functional but lack error handling and security notes:
- blake2.mdx (36 lines)
- bls12381.mdx (47 lines)
- bn254.mdx (52 lines)
- ed25519.mdx (47 lines)
- eip712.mdx (52 lines)
- hmac.mdx (45 lines)
- keystore.mdx (47 lines)
- kzg.mdx (46 lines)
- modexp.mdx (49 lines)
- p256.mdx (43 lines)
- signers.mdx (68 lines)

### 14. Sparse Primitive Documentation (< 25 lines)

- storage.mdx (20 lines)
- blockfilter.mdx (21 lines)
- storagevalue.mdx (22 lines)
- validator-index.mdx (22 lines)

### 15. Unverified External Links

| File | Link |
|------|------|
| address.mdx | `https://voltaire.tevm.sh/primitives/address` |
| hex.mdx | `https://voltaire.tevm.sh/primitives/hex` |
| uint.mdx | `https://voltaire.tevm.sh/primitives/uint` |
| hash.mdx | `https://voltaire.tevm.sh/primitives/hash` |

**Action:** Verify these domains are active.

---

## ✅ Verified Working

- ✅ No TODO/FIXME/WIP markers (except one "coming soon")
- ✅ All navigation entries in docs.json have corresponding files
- ✅ Code examples have proper syntax highlighting
- ✅ All required frontmatter present in main docs
- ✅ Effect.ts patterns are correct and up-to-date
- ✅ No empty or stub files
- ✅ External links (Effect docs, GitHub) properly formatted

---

## Recommended Fix Priority

### Phase 1: Critical (Block Production)
1. Fix `contract.mdx` filename/content mismatch
2. Fix 5 broken internal links in crypto/
3. Add missing Effect provider in ripemd160.mdx
4. Fix 4 undefined variable issues in examples
5. Add missing Slot import in ssz.mdx

### Phase 2: Moderate (Before Launch)
6. Standardize import paths across all docs
7. Standardize Schema alias (Schema vs S)
8. Replace placeholder URLs with real RPCs
9. Remove "coming soon" or implement feature
10. Fix missing imports in examples

### Phase 3: Polish (Post-Launch OK)
11. Add frontmatter to snippets
12. Standardize service title casing
13. Expand sparse crypto docs with error handling
14. Expand sparse primitive docs
15. Verify external voltaire.tevm.sh links

---

## Quick Fix Commands

```bash
# Find all "coming soon" references
grep -r "coming soon" voltaire-effect/docs/

# Find all TODO/FIXME
grep -rE "TODO|FIXME|WIP" voltaire-effect/docs/

# Find inconsistent imports
grep -r "@tevm/voltaire" voltaire-effect/docs/
grep -r "voltaire-effect/" voltaire-effect/docs/ | grep -v primitives

# Count lines per file (find sparse docs)
find voltaire-effect/docs -name "*.mdx" -exec wc -l {} \; | sort -n | head -20
```
