# Add HDWallet Effect Error Types

## Problem

HDWallet operations return `Effect.Effect<T, never, HDWalletService>` but the underlying operations can fail with `InvalidPathError`, `InvalidSeedError`, etc.

**Location**: `src/crypto/HDWallet/derive.ts`

```typescript
export const derive = (
  node: HDNode,
  path: string,
): Effect.Effect<HDNode, never, HDWalletService> =>  // ❌ never is wrong!
  HDWalletService.pipe(Effect.flatMap((hd) => hd.derive(node, path)));
```

## Why This Matters

- Type system claims derivation never fails
- Invalid paths cause untyped defects
- Callers can't handle errors gracefully
- Inconsistent with Effect's philosophy

## Solution

Add proper error types:

```typescript
// errors.ts
import * as Data from "effect/Data";

export class InvalidPathError extends Data.TaggedError("InvalidPathError")<{
  readonly path: string;
  readonly message: string;
}> {}

export class InvalidSeedError extends Data.TaggedError("InvalidSeedError")<{
  readonly message: string;
}> {}

export class HardenedDerivationError extends Data.TaggedError("HardenedDerivationError")<{
  readonly path: string;
  readonly message: string;
}> {}

export type HDWalletError = InvalidPathError | InvalidSeedError | HardenedDerivationError;
```

Update operations:

```typescript
export const derive = (
  node: HDNode,
  path: string,
): Effect.Effect<HDNode, InvalidPathError, HDWalletService> =>
  HDWalletService.pipe(Effect.flatMap((hd) => hd.derive(node, path)));

export const fromSeed = (
  seed: Uint8Array,
): Effect.Effect<HDNode, InvalidSeedError, HDWalletService> =>
  HDWalletService.pipe(Effect.flatMap((hd) => hd.fromSeed(seed)));
```

Update service shape:

```typescript
interface HDWalletServiceShape {
  readonly derive: (node: HDNode, path: string) => Effect.Effect<HDNode, InvalidPathError>;
  readonly fromSeed: (seed: Uint8Array) => Effect.Effect<HDNode, InvalidSeedError>;
  readonly generateMnemonic: (strength?: number) => Effect.Effect<string, never>;
}
```

## Acceptance Criteria

- [ ] Create error types for HDWallet operations
- [ ] Update service shape with error types
- [ ] Update operations.ts with correct error types
- [ ] Update HDWalletLive to use Effect.try
- [ ] All existing tests pass
- [ ] Add tests for error cases

## Priority

**Medium** - Type safety
