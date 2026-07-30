# @tevm/voltaire

Ethereum primitives and cryptography for TypeScript, backed by Voltaire's Zig implementation where WASM or native bindings are used.

## Install

```sh
pnpm add @tevm/voltaire
```

Node.js 22 is supported. The default entry point is portable JavaScript; browser and Node.js consumers do not need a native binary.

## Usage

```ts
import { Address, Hex, Keccak256 } from "@tevm/voltaire";

const address = Address.from(
  "0x742d35Cc6634C0532925a3b844Bc9e7595f51e3e",
);
console.log(Address.toHex(address));

const message = Hex.toBytes(Hex.fromString("Voltaire"));
console.log(Hex.fromBytes(Keccak256.hash(message)));
```

Tree-shakeable subpath exports are available, for example:

```ts
import { Address } from "@tevm/voltaire/Address";
```

See the [Voltaire documentation](https://voltaire.tevm.sh/) for the primitive, cryptography, and WASM APIs.

The `@tevm/voltaire/native` entry point is intended for source builds. Prebuilt native libraries are not bundled in the current npm package; use the default or WASM entry point for portable consumer installations.

## License

MIT
