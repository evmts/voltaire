# Contract & Account Service Review

## Summary

Solid Effect-TS integration with proper Layer composition and typed errors. Main issues: weak ABI type inference at runtime, private key memory handling, and the known silent catch issue (review 053).

---

## Contract Service

### ✅ Strengths

1. **Proper Effect patterns**: Uses `Effect.gen`, `Layer.effect`, error mapping with `mapError`
2. **Typed errors**: `ContractCallError`, `ContractWriteError`, `ContractEventError` with `_tag` for `catchTag`
3. **Clean service dependency**: Requires `ProviderService`, write methods require `SignerService`
4. **WriteOptions handling**: Correctly detects options object by property presence and input count

### ⚠️ Issues

#### 1. ABI Type Inference is Partial (Medium)

**Location**: [ContractTypes.ts#L306-L330](file:///Users/williamcory/voltaire/voltaire-effect/src/services/Contract/ContractTypes.ts#L306-L330)

```typescript
type AbiTypeToTs<T extends string> = T extends `uint${string}`
  ? bigint
  : T extends `int${string}`
    ? bigint
    // ... tuple returns Record<string, unknown> - loses type safety
    : T extends `tuple`
      ? Record<string, unknown>  // ❌ Should infer component types
      : unknown;
```

**Problem**: Tuple types lose structure. Array element types are `unknown[]`.

**Fix**: Use ABIType or implement recursive tuple/component parsing.

#### 2. Unsafe Type Assertions (Low)

**Location**: [Contract.ts#L317-L318](file:///Users/williamcory/voltaire/voltaire-effect/src/services/Contract/Contract.ts#L317-L318)

```typescript
to: brandedAddress as unknown as undefined,
data: data as unknown as undefined,
```

**Problem**: `as unknown as undefined` is nonsensical - these should be the correct types.

**Fix**: Fix `sendTransaction` signature to accept proper types.

#### 3. Event Decoding - Hash vs Hex Confusion (Low)

**Location**: [Contract.ts#L169-L171](file:///Users/williamcory/voltaire/voltaire-effect/src/services/Contract/Contract.ts#L169-L171)

```typescript
const topicBytes = log.topics.map((t) =>
  Hex.toBytes(t as `0x${string}`),
) as unknown as readonly HashType[];
```

**Problem**: Topics are 32-byte hashes, not arbitrary hex. Type assertion hides this.

---

## Account Service

### ✅ Strengths

1. **Clean service definition**: `Context.Tag` with proper shape typing
2. **Two implementations**: `LocalAccount` (in-memory), `JsonRpcAccount` (delegated)
3. **Proper EIP-191/712 implementation**: Correct prefix, typed data encoding
4. **Error wrapping**: All operations wrap to `AccountError`

### ⚠️ Issues

#### 4. Private Key Not Cleared From Memory (High - Security)

**Location**: [LocalAccount.ts#L435-L437](file:///Users/williamcory/voltaire/voltaire-effect/src/services/Account/LocalAccount.ts#L435-L437)

```typescript
const privateKeyBytes = Hex.toBytes(
  privateKeyHex,
) as unknown as PrivateKeyType;
```

**Problem**: Private key remains in memory indefinitely. No cleanup on Layer disposal.

**Fix**: Use `Effect.acquireRelease` to zero memory on finalization:

```typescript
Layer.scoped(
  AccountService,
  Effect.acquireRelease(
    Effect.sync(() => {
      const key = Hex.toBytes(privateKeyHex);
      return { key, zeroize: () => key.fill(0) };
    }),
    ({ zeroize }) => Effect.sync(zeroize)
  ).pipe(Effect.flatMap(({ key }) => /* build service */))
)
```

#### 5. Mnemonic String Not Cleared (High - Security)

**Location**: [fromMnemonic.ts#L106-L108](file:///Users/williamcory/voltaire/voltaire-effect/src/services/Account/fromMnemonic.ts#L106-L108)

```typescript
const seed = yield* Effect.promise(() =>
  Bip39.mnemonicToSeed(mnemonic, passphrase),
);
```

**Problem**: `seed` (64 bytes) and `mnemonic` string remain in memory.

**Fix**: Same pattern - acquire/release with zeroization.

#### 6. EIP-712 Domain Order Not Enforced (Medium)

**Location**: [LocalAccount.ts#L126-L149](file:///Users/williamcory/voltaire/voltaire-effect/src/services/Account/LocalAccount.ts#L126-L149)

**Problem**: EIP-712 spec requires strict field order (name, version, chainId, verifyingContract, salt). Current code builds fields in conditional order which happens to be correct, but isn't enforced.

#### 7. TypedData Recursive Type Limit (Low)

**Location**: [LocalAccount.ts#L191-L212](file:///Users/williamcory/voltaire/voltaire-effect/src/services/Account/LocalAccount.ts#L191-L212)

**Problem**: `findTypeDependencies` uses recursion without depth limit. Malicious typed data could cause stack overflow.

---

## Test Coverage

### ✅ Coverage

- Contract factory, read/write/simulate methods
- Event fetching with filters
- Error catching with `Effect.catchTag`
- Write options (value, gas, nonce, EIP-1559)

### ❌ Missing Tests

1. **Contract**: Tuple return types, multi-output functions, overloaded functions
2. **LocalAccount**: No tests in reviewed files (should exist elsewhere)
3. **JsonRpcAccount**: No tests in reviewed files
4. **fromMnemonic**: Invalid mnemonic, derivation path edge cases

---

## Known Issue: Review 053

The silent catch in `verifySignature.js` (not in these files) affects any Contract methods that use signature verification. Confirmed still open.

---

## Action Items

| Priority | Issue | File |
|----------|-------|------|
| High | Private key memory cleanup | LocalAccount.ts |
| High | Mnemonic/seed memory cleanup | fromMnemonic.ts |
| Medium | Improve tuple type inference | ContractTypes.ts |
| Medium | EIP-712 field order validation | LocalAccount.ts |
| Low | Fix type assertions | Contract.ts |
| Low | Add recursion depth limit | LocalAccount.ts |
| Low | Add LocalAccount tests | - |
