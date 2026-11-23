# `@tevm/voltaire`

Type-safe Ethereum primitives, cryptography, and EVM execution for TypeScript — backed by Pure TypeScript, WebAssembly, and Bun Native FFI behind one identical API.

**Documentation:** [voltaire.tevm.sh](https://voltaire.tevm.sh) · **Playground:** [playground.tevm.sh](https://playground.tevm.sh)

## Install

```bash
pnpm add @tevm/voltaire
# or: npm install @tevm/voltaire / bun add @tevm/voltaire
```

## Quick Start

```typescript
import { Address, Wei } from "@tevm/voltaire";
import { Abi } from "@tevm/voltaire/Abi";
import { Hex } from "@tevm/voltaire/Hex";
import { Keccak256 } from "@tevm/voltaire/Keccak256";

// Branded 20-byte Uint8Array — validated at construction
const recipient = Address("0xd8da6bf26964af9d7eed9e03e53415d37aa96045");
Address.toChecksummed(recipient); // "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045"

// Compile-time unit safety (Wei ≠ Gwei ≠ Ether)
const amount = Wei(1_000_000_000_000_000_000n);
Wei.toEther(amount); // 1n

// Selectors and ABI encoding
const selector = Hex.fromBytes(Keccak256.selector("transfer(address,uint256)")); // "0xa9059cbb"
const erc20 = Abi([
	{
		type: "function",
		name: "transfer",
		stateMutability: "nonpayable",
		inputs: [
			{ type: "address", name: "to" },
			{ type: "uint256", name: "amount" },
		],
		outputs: [{ type: "bool" }],
	},
] as const);

const calldata = erc20.encode("transfer", [recipient.toHex(), amount]);
```

## Entrypoints

| Import                      | Backend     | Runtime                  | Use Case                                                              |
| --------------------------- | ----------- | ------------------------ | --------------------------------------------------------------------- |
| `@tevm/voltaire`            | Pure TS     | Browser, Node, Bun, Deno | Default; zero boundary overhead                                       |
| `@tevm/voltaire/<Module>`   | Pure TS     | Browser, Node, Bun, Deno | Subpath tree-shaking (`/Address`, `/Abi`, `/Keccak256`, ...)          |
| `@tevm/voltaire/functional` | Pure TS     | Browser, Node, Bun, Deno | Stateless functions for smallest browser bundles                      |
| `@tevm/voltaire/wasm`       | Zig → WASM  | Browser, Node, Bun, Deno | Faster & smaller crypto (`Keccak256`, `Secp256k1`, `Bls12381`, `KZG`) |
| `@tevm/voltaire/native`     | Zig → C FFI | Bun only                 | Highest server throughput                                             |

## Included Modules

- **Primitives:** `Address`, `Hash`, `Hex`, `Bytes` / `Bytes1`–`Bytes64`, `Uint` / `Uint8`–`Uint256`, `Int8`–`Int256`, `Wei` / `Gwei` / `Ether`, `Abi`, `Rlp`, `Ssz`, `Base64`, `Transaction` (Legacy, EIP-2930, EIP-1559, EIP-4844, EIP-7702), `AccessList`, `Authorization`, `Blob`, `Block`, `EventLog`, `Receipt`, `FeeMarket`, `Bytecode`, `Opcode`, `GasConstants`, `Hardfork`, `State`, `Trie`, `Siwe`, `Ens`, `Signature`
- **Cryptography:** `Keccak256`, `SHA256`, `Blake2`, `Ripemd160`, `HMAC`, `Secp256k1`, `P256`, `Ed25519`, `Bls12381`, `BN254`, `X25519`, `EIP712`, `KZG`, `Bip39`, `HDWallet`, `Keystore`, `AesGcm`, `ChaCha20Poly1305`
- **EVM & JSON-RPC:** `evm`, `precompiles`, `jsonrpc`, `provider`, `contract`, `stream`, `utils`

## License

MIT
