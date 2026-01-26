# Vitest Migration Cleanup

**Priority**: P3
**Status**: 90% Complete

## Summary

16 test files still use raw vitest instead of @effect/vitest.

## Remaining Files

```
src/crypto/HDWallet/HDWallet.cleanup.test.ts
src/crypto/Keystore/Keystore.cleanup.test.ts
src/crypto/utils/constantTimeEqual.test.ts
src/jsonrpc/errors.test.ts
src/jsonrpc/JsonRpc.test.ts
src/primitives/Block/Block.test.ts
src/primitives/BlockBody/BlockBody.test.ts
src/primitives/BlockNumber/BlockNumber.test.ts
src/primitives/Brand/Brand.test.ts
src/primitives/ContractSignature/ContractSignature.test.ts
src/primitives/Hex/Hex.test.ts
src/primitives/Receipt/ReceiptSchema.test.ts
src/services/Provider/actions/multicall.test.ts
src/services/Transport/HttpTransportConfig.test.ts
src/services/Transport/WebSocketTransportConfig.test.ts
src/standards/errors.test.ts
```

## Migration Pattern

```typescript
// Before
import { describe, it, expect } from "vitest"
it("test", async () => {
  await Effect.runPromise(effect)
})

// After
import { it, expect } from "@effect/vitest"
it.effect("test", () => effect)
```
