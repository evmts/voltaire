# Review 093: Receipt and EventLog Primitives

## Summary

Deep review of Receipt, EventLog, LogFilter, and LogIndex Effect schemas. Found **critical schema divergence** from base primitives and **known issue 059 not addressed** in Effect layer.

## Severity: HIGH

---

## Files Reviewed

- `voltaire-effect/src/primitives/Receipt/` (2 files)
- `voltaire-effect/src/primitives/EventLog/` (3 files)
- `voltaire-effect/src/primitives/LogFilter/` (3 files)
- `voltaire-effect/src/primitives/LogIndex/` (2 files)

---

## Critical Issues

### 1. Receipt Schema Missing Fields (HIGH)

**Location**: `Receipt/ReceiptSchema.ts`

The Effect schema is **missing critical fields** that exist in the base `ReceiptType`:

| Field | Base Type | Effect Schema | Impact |
|-------|-----------|---------------|--------|
| `effectiveGasPrice` | Required Uint256 | ❌ MISSING | EIP-1559 broken |
| `type` | Required ("legacy" \| "eip2930" \| "eip1559" \| "eip4844" \| "eip7702") | ❌ MISSING | Tx type detection broken |
| `blobGasUsed` | Optional Uint256 | ❌ MISSING | EIP-4844 broken |
| `blobGasPrice` | Optional Uint256 | ❌ MISSING | EIP-4844 broken |
| `root` | Optional HashType | ❌ MISSING | Pre-Byzantium broken |

```typescript
// Effect schema (incomplete):
readonly status: 0 | 1;

// Base type (correct):
readonly status?: TransactionStatusType;  // Optional!
readonly root?: HashType;                 // Pre-Byzantium alternative
readonly effectiveGasPrice: Uint256Type;  // Required
readonly type: "legacy" | "eip2930" | "eip1559" | "eip4844" | "eip7702";
```

### 2. Pre-Byzantium Handling Not Fixed (HIGH) - Issue 059

**Location**: `Receipt/ReceiptSchema.ts#L174`, `Receipt/ReceiptSchema.ts#L346`

The Effect schema requires `status` to be `0 | 1` (required literal), but pre-Byzantium receipts have `root` instead. Review 059 documents this but the Effect layer was never updated.

```typescript
// Current (broken for pre-Byzantium):
readonly status: 0 | 1;

// Required:
readonly status?: 0 | 1;
readonly root?: HashType;
```

**Historical context**: Pre-Byzantium (< block 4,370,000 on mainnet) used `root` for state root instead of `status` for success/failure.

### 3. Effect Schema Type Mismatch (HIGH)

**Location**: `Receipt/ReceiptSchema.ts#L117-175`

The `ReceiptType` interface defined in Effect schema diverges from base:

```typescript
// Effect ReceiptSchema.ts (wrong):
interface ReceiptType {
  readonly transactionHash: HashType;      // Missing branded TransactionHashType
  readonly blockNumber: bigint;            // Should be BlockNumberType
  // ... missing effectiveGasPrice, type, blobGas fields
}

// Base ReceiptType.ts (correct):
type ReceiptType = {
  readonly transactionHash: TransactionHashType;
  readonly blockNumber: BlockNumberType;
  readonly effectiveGasPrice: Uint256Type;
  readonly type: "legacy" | "eip2930" | ...
  // ... full type
}
```

---

## Medium Issues

### 4. EventLog Schema Topics Not Validated Against Max Length (MEDIUM)

**Location**: `EventLog/Rpc.ts#L46`

Topics array accepts unlimited length but EVM only supports 4 topics (LOG0-LOG4).

```typescript
// Current:
topics: S.Array(HashSchema),

// Should validate max 4:
topics: S.Array(HashSchema).pipe(S.maxItems(4)),
```

### 5. LogFilter Schema Missing Topics Type Alignment (MEDIUM)

**Location**: `LogFilter/Rpc.ts#L89-99`

Topics schema doesn't match `TopicFilterType` from base which is a branded tuple:

```typescript
// Current (generic array):
const TopicFilterSchema = S.Array(TopicEntrySchema);

// Base TopicFilterType (specific tuple):
type TopicFilterType = readonly [
  TopicEntry?, TopicEntry?, TopicEntry?, TopicEntry?
] & { readonly [brand]: "TopicFilter" };
```

### 6. LogFilter Mutual Exclusivity Not Validated in Schema (MEDIUM)

**Location**: `LogFilter/Rpc.ts#L163-167`

Base `from.js` validates `blockhash` is mutually exclusive with `fromBlock/toBlock`, but the Effect schema doesn't enforce this at parse time.

```typescript
// Base validation (from.js):
if (params.blockhash) {
  if (params.fromBlock !== undefined || params.toBlock !== undefined) {
    throw new InvalidLogFilterError(...)
  }
}

// Effect schema: No validation
```

---

## Low Issues

### 7. Duplicate Type Definitions (LOW)

**Location**: `Receipt/ReceiptSchema.ts#L43-84`, `Receipt/ReceiptSchema.ts#L117-175`

Both `LogType` and `ReceiptType` are defined locally instead of importing from base primitives. This creates maintenance burden and drift risk (already manifested).

### 8. LogIndex Schema Accepts BigInt (LOW)

**Location**: `LogIndex/Number.ts#L80-81`

LogIndex accepts `bigint` input but log indices are always small integers. Not a bug but inconsistent with typical usage.

### 9. EventLog Test Coverage Minimal (LOW)

**Location**: `EventLog/EventLog.test.ts`

Only 1 test case. Missing:
- Edge cases (empty topics, max topics)
- Invalid inputs
- `removed: true` scenarios
- Block metadata handling

### 10. No Receipt Tests (LOW)

No `Receipt.test.ts` file exists in the Effect layer.

---

## Recommendations

### Immediate (P0)

1. **Add missing Receipt fields** to match base `ReceiptType`:
```typescript
const ReceiptSchemaInternal = S.Struct({
  // ... existing fields
  effectiveGasPrice: S.BigIntFromSelf,
  type: S.Literal("legacy", "eip2930", "eip1559", "eip4844", "eip7702"),
  blobGasUsed: S.optional(S.BigIntFromSelf),
  blobGasPrice: S.optional(S.BigIntFromSelf),
  status: S.optional(S.Literal(0, 1)),  // Make optional
  root: S.optional(HashTypeSchema),      // Pre-Byzantium
});
```

2. **Add refinement for status/root mutual requirement**:
```typescript
.pipe(S.filter(
  (r) => r.status !== undefined || r.root !== undefined,
  { message: () => "Either status or root is required" }
))
```

### Short-term (P1)

3. Add topics array max length validation (4)
4. Add LogFilter blockhash mutual exclusivity refinement
5. Import types from base primitives instead of redefining

### Medium-term (P2)

6. Add comprehensive Receipt tests
7. Add EventLog edge case tests
8. Align TopicFilterSchema with branded tuple type

---

## Test Coverage Gaps

| Module | Tests | Coverage |
|--------|-------|----------|
| Receipt | 0 | None |
| EventLog | 1 | Minimal |
| LogFilter | 3 | Basic |
| LogIndex | 0 | None (implicit via schema) |

---

## Related Issues

- **059-fix-receipt-pre-byzantium-status.md**: Documents base layer fix but Effect layer unchanged
- Base `Receipt/from.js#L59-61` also needs fixing (currently rejects pre-Byzantium)

---

## Acceptance Criteria

- [ ] Receipt schema includes all fields from base `ReceiptType`
- [ ] Pre-Byzantium receipts (with `root`) parse successfully
- [ ] Post-Byzantium receipts (with `status`) parse successfully
- [ ] Topics arrays validated to max 4 entries
- [ ] LogFilter blockhash/fromBlock mutual exclusivity enforced
- [ ] Receipt test file added with comprehensive cases
- [ ] EventLog test coverage expanded
- [ ] Types imported from base primitives, not redefined
