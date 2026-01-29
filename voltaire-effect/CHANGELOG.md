# voltaire-effect

## 0.3.0

### Minor Changes

- [`98a7758`](https://github.com/evmts/voltaire/commit/98a7758142e1f447acbb00074243e016f8089034) Thanks [@roninjin10](https://github.com/roninjin10)! - Upgrade Effect dependencies to 3.19+ with @effect/platform 0.94+

  **Breaking**: `@effect/platform` moved to peerDependencies. Install explicitly:

  ```bash
  pnpm add effect@^3.19.0 @effect/platform@^0.94.0
  ```

- [`a4974a5`](https://github.com/evmts/voltaire/commit/a4974a52afdde48655dd6cf99a0e304fe1f7e96a) Thanks [@roninjin10](https://github.com/roninjin10)! - Add ExecutionPlan-based provider fallback (experimental)

  ```typescript
  import { Effect, Schedule } from "effect";
  import { makeProviderPlan, getBlockNumber } from "voltaire-effect";

  const plan = makeProviderPlan([
    {
      url: process.env.INFURA_URL!,
      attempts: 2,
      schedule: Schedule.spaced("1 second"),
    },
    {
      url: process.env.ALCHEMY_URL!,
      attempts: 3,
      schedule: Schedule.exponential("500 millis"),
    },
    { url: "https://eth.llamarpc.com" }, // public fallback
  ]);

  const blockNumber =
    yield * getBlockNumber().pipe(Effect.withExecutionPlan(plan));
  ```

  - `makeProviderPlan`: Declarative multi-provider retry/fallback
  - `makeResilientProviderPlan`: Pre-configured with sensible defaults
  - Requires Effect 3.16+ for ExecutionPlan

### Patch Changes

- [`87bda7b`](https://github.com/evmts/voltaire/commit/87bda7bd37c8ffb92359b274dbb594c0a42fe89e) Thanks [@roninjin10](https://github.com/roninjin10)! - Add provider fallback strategies documentation

  New guide at `guides/provider-fallback.mdx` covering:

  - ExecutionPlan-based multi-provider fallback
  - Configuring retry attempts and schedules per provider
  - Production patterns for resilient RPC access

- [`19fbca9`](https://github.com/evmts/voltaire/commit/19fbca982735a07ebc9a6fe304786b0191bcd2e1) Thanks [@roninjin10](https://github.com/roninjin10)! - Update PrivateKey error test snapshots for new Redacted schema structure

  Error output now shows full transformation chain:

  ```
  PrivateKey.RedactedBytes
  └─ Encoded side transformation failure
     └─ PrivateKey.Bytes
        └─ Transformation process failure
           └─ Private key must be 32 bytes, got 31

  Docs: https://voltaire.dev/primitives/private-key
  ```

- [`90db5ee`](https://github.com/evmts/voltaire/commit/90db5ee932847dee6b38509b1ab0dc939615b12a) Thanks [@roninjin10](https://github.com/roninjin10)! - Simplify Redacted schema implementations using `S.Redacted` pipe

  Before:

  ```typescript
  export const RedactedBytes = S.transformOrFail(
    S.Uint8ArrayFromSelf,
    S.Redacted(PrivateKeyTypeSchema),
    {
      decode: (bytes, _options, ast) => {
        try {
          return ParseResult.succeed(
            Redacted.make(PrivateKey.fromBytes(bytes))
          );
        } catch (e) {
          return ParseResult.fail(
            new ParseResult.Type(ast, bytes, "Invalid private key format")
          );
        }
      },
      encode: (redacted, _options, ast) => {
        /* ... */
      },
    }
  );
  ```

  After:

  ```typescript
  export const RedactedBytes = Bytes.pipe(S.Redacted).annotations({
    identifier: "PrivateKey.RedactedBytes",
    title: "Private Key (Redacted)",
    description: "A 32-byte secp256k1 private key wrapped in Redacted",
  });
  ```

  Preserves underlying schema error chain for better error messages.

- [`61fa44f`](https://github.com/evmts/voltaire/commit/61fa44f6ed7d4222c84ce5634627f14c75972055) Thanks [@roninjin10](https://github.com/roninjin10)! - Use pre-computed typed examples in schema annotations

  Before:

  ```typescript
  export const Hex = S.transformOrFail(/* ... */).annotations({
    examples: [
      "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045",
      "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
    ],
  });
  ```

  After:

  ```typescript
  const EXAMPLE_ADDRESSES: readonly [AddressType, AddressType] = [
    Address("0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045"),
    Address("0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"),
  ] as const;

  export const Hex = S.transformOrFail(/* ... */).annotations({
    examples: EXAMPLE_ADDRESSES,
  });
  ```

  Ensures schema examples match the actual decoded types.
