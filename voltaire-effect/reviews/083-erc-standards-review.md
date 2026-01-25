# Review 083: ERC Standards Implementation Review

**Date**: 2026-01-25
**Scope**: voltaire-effect/src/standards/
**Files**: ERC20.ts, ERC721.ts, ERC1155.ts, ERC165.ts, errors.ts

## Summary

Effect-TS wrappers for ERC standards. Wraps @tevm/voltaire implementations with consistent error handling via `StandardsError`.

## 1. Completeness Analysis

### ERC20 ✅ Complete
| Method | Base Impl | Effect Wrapper |
|--------|-----------|----------------|
| encodeTransfer | ✅ | ✅ |
| encodeApprove | ✅ | ✅ |
| encodeTransferFrom | ✅ | ✅ |
| encodeBalanceOf | ✅ | ✅ |
| encodeAllowance | ✅ | ✅ |
| decodeTransferEvent | ✅ | ✅ |
| decodeApprovalEvent | ✅ | ✅ |
| decodeUint256 | ✅ | ✅ |
| decodeAddress | ✅ | ✅ |
| decodeBool | ✅ | ✅ |
| decodeString | ✅ | ✅ |

**Missing from base (not Effect issue)**:
- `encodeTotalSupply()` - view, no params
- `encodeName()` - view, no params  
- `encodeSymbol()` - view, no params
- `encodeDecimals()` - view, no params

### ERC721 ⚠️ Partial
| Method | Base Impl | Effect Wrapper |
|--------|-----------|----------------|
| encodeTransferFrom | ✅ | ✅ |
| encodeSafeTransferFrom | ✅ | ✅ |
| encodeApprove | ✅ | ✅ |
| encodeSetApprovalForAll | ✅ | ✅ |
| encodeOwnerOf | ✅ | ✅ |
| encodeTokenURI | ✅ | ✅ |
| decodeTransferEvent | ✅ | ✅ |
| decodeApprovalEvent | ✅ | ✅ |
| decodeApprovalForAllEvent | ✅ | ✅ |

**Missing from base (not Effect issue)**:
- `encodeBalanceOf(address)` - SELECTOR exists but no encoder
- `encodeGetApproved(uint256)` - SELECTOR exists but no encoder
- `encodeIsApprovedForAll(address,address)` - SELECTOR exists but no encoder
- `encodeSafeTransferFromWithData(...)` - SELECTOR exists but no encoder
- Enumerable extension encoders (totalSupply, tokenOfOwnerByIndex, tokenByIndex)

### ERC1155 ⚠️ Partial
| Method | Base Impl | Effect Wrapper |
|--------|-----------|----------------|
| encodeBalanceOf | ✅ | ✅ |
| encodeSetApprovalForAll | ✅ | ✅ |
| encodeSafeTransferFrom | ✅ | ✅ |
| encodeIsApprovedForAll | ✅ | ✅ |
| encodeURI | ✅ | ✅ |
| decodeTransferSingleEvent | ✅ | ✅ |
| decodeApprovalForAllEvent | ✅ | ✅ |

**Missing from base (not Effect issue)**:
- `encodeBalanceOfBatch(address[],uint256[])` - SELECTOR exists but no encoder
- `encodeSafeBatchTransferFrom(...)` - SELECTOR exists but no encoder
- `decodeTransferBatchEvent` - EVENT exists but no decoder
- `decodeURIEvent` - EVENT exists but no decoder

### ERC165 ✅ Complete + Enhanced
- `encodeSupportsInterface` ✅
- `decodeSupportsInterface` ✅
- `supportsInterface` ✅ (with ProviderService integration)
- `detectInterfaces` ✅ (high-level detection with concurrency)

## 2. Type Safety

### ✅ Good
- Uses branded types `AddressType`, `Uint256Type` from @tevm/voltaire
- Effect return types properly specified
- StandardsError consistently used as error channel

### ⚠️ Issues
1. **Loose log type**: `{ topics: string[]; data: string }` should be branded or from a Log type
2. **String returns for addresses**: `decodeAddress` returns `string` not `AddressType`
3. **Event decode returns string addresses**: Should return `AddressType` for consistency

```typescript
// Current
decodeTransferEvent(...): Effect<{ from: string; to: string; value: Uint256Type }, ...>

// Should be
decodeTransferEvent(...): Effect<{ from: AddressType; to: AddressType; value: Uint256Type }, ...>
```

## 3. Effect Patterns

### ✅ Consistent
- All functions use `Effect.try` pattern
- Error wrapping with `StandardsError` is uniform
- Operation names clearly identify source

### ✅ Good ERC165 Pattern
```typescript
// supportsInterface properly uses Effect.gen for composition
export const supportsInterface = (...): Effect.Effect<boolean, StandardsError, ProviderService> =>
  Effect.gen(function* () {
    const provider = yield* ProviderService;
    // ...
  });
```

### ⚠️ Improvement Opportunity
- Could use `Effect.tryPromise` if base throws async errors
- No retry/timeout patterns for provider calls in ERC165

## 4. Error Handling

### ✅ StandardsError Well-Designed
```typescript
class StandardsError extends Data.TaggedError("StandardsError")<{
  readonly operation: string;
  readonly message: string;
  readonly cause?: unknown;
}> {}
```

### ⚠️ Missing Error Specificity
Could benefit from sub-errors:
- `DecodeError` for decode failures
- `EncodeError` for encode failures
- `ProviderError` for provider call failures

## 5. Test Coverage

**❌ No test files found** in `/voltaire-effect/src/standards/*.test.ts`

Tests are required for:
- Each encode function with valid inputs
- Each decode function with valid/invalid logs
- Error paths (malformed inputs)
- ERC165 provider integration (mocked)

## 6. Action Items

### P0 - Critical
1. Add test files for all standards
2. Fix address return types (string → AddressType)

### P1 - Important (matches known issues)
3. **ERC20**: Add view encoders (totalSupply, name, symbol, decimals) to base
4. **ERC721**: Add query encoders (balanceOf, getApproved, isApprovedForAll) to base
5. **ERC1155**: Add batch methods (balanceOfBatch, safeBatchTransferFrom) to base

### P2 - Nice to Have
6. Create branded Log type
7. Add sub-error types for better error discrimination
8. Add retry patterns to ERC165 provider calls

## Code Quality

| Aspect | Score | Notes |
|--------|-------|-------|
| Completeness | 7/10 | Missing batch methods and some encoders |
| Type Safety | 7/10 | Good branded types, but string addresses in returns |
| Effect Patterns | 9/10 | Consistent, clean wrapping |
| Error Handling | 8/10 | Good TaggedError, could be more specific |
| Test Coverage | 0/10 | No tests |
| **Overall** | **6/10** | Solid foundation, needs tests and completeness |

## Related Reviews
- Review 063: ERC20 view encoders
- Review 064: ERC721 query encoders  
- Review 065: ERC1155 batch methods
