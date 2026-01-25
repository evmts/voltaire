# voltaire-effect

Effect-TS integration for the [Voltaire](https://github.com/evmts/voltaire) Ethereum primitives library.

## Installation

```bash
npm install voltaire-effect effect @tevm/voltaire
```

## Features

- **Typed Errors**: All operations return `Effect<A, E, R>` with precise error types
- **Composable**: Chain operations using Effect's powerful combinators
- **Services**: Dependency injection for crypto operations
- **Zero Runtime Overhead**: Effect's tree-shaking keeps bundles small

## Usage

```typescript
import { Effect } from "effect";
import * as Address from "voltaire-effect/primitives";
import * as Keccak from "voltaire-effect/crypto";

const program = Effect.gen(function* () {
  const addr = yield* Address.from("0x1234567890abcdef1234567890abcdef12345678");
  const hash = yield* Keccak.keccak256(new Uint8Array([1, 2, 3]));
  return { addr, hash };
});

Effect.runPromise(program);
```

## Subpath Exports

- `voltaire-effect` - Main entry
- `voltaire-effect/primitives` - Address, Hex, Bytes32, etc.
- `voltaire-effect/crypto` - Keccak, secp256k1, etc.
- `voltaire-effect/services` - Effect services/layers

## License

MIT
