// WASM API examples — imported as raw strings for the editor
// Each example logs to console and runs synchronously (Executor preloads WASM)

import keccakString from "../../examples/wasm/hash/keccak-string.js?raw";
import eip191 from "../../examples/wasm/hash/eip191.js?raw";
import sha256 from "../../examples/wasm/hash/sha256.js?raw";
import ripemd160 from "../../examples/wasm/hash/ripemd160.js?raw";
import blake2b from "../../examples/wasm/hash/blake2b.js?raw";
import solidity from "../../examples/wasm/hash/solidity.js?raw";

import hexBytes from "../../examples/wasm/hex/bytes-hex.js?raw";

import rlpEncodeDecode from "../../examples/wasm/rlp/encode-decode.js?raw";

import u256Convert from "../../examples/wasm/u256/convert.js?raw";

import bytecodeInspect from "../../examples/wasm/bytecode/inspect.js?raw";

import blobBasic from "../../examples/wasm/blob/basic.js?raw";

import accessListBasic from "../../examples/wasm/accesslist/basic.js?raw";

import txDetect from "../../examples/wasm/tx/detect-type.js?raw";

import secp256k1Basic from "../../examples/wasm/crypto/secp256k1.js?raw";
import signatureUtils from "../../examples/wasm/crypto/signature-utils.js?raw";
import signatureCanonical from "../../examples/wasm/crypto/signature-canonical.js?raw";
import secp256k1Direct from "../../examples/wasm/crypto/secp256k1-direct.js?raw";
import x25519Basic from "../../examples/wasm/crypto/x25519.js?raw";
import ed25519Basic from "../../examples/wasm/crypto/ed25519.js?raw";
import p256Basic from "../../examples/wasm/crypto/p256.js?raw";
import blake2Class from "../../examples/wasm/crypto/blake2-class.js?raw";
import sha256Class from "../../examples/wasm/crypto/sha256-class.js?raw";
import ripemd160Class from "../../examples/wasm/crypto/ripemd160-class.js?raw";

import walletKeys from "../../examples/wasm/wallet/generate-compress.js?raw";

function passthrough(code: string): string {
  return code;
}

export const wasmExamples: Record<string, string> = {
  // Hashing
  "hash/keccak-string.ts": passthrough(keccakString),
  "hash/eip191.ts": passthrough(eip191),
  "hash/sha256.ts": passthrough(sha256),
  "hash/ripemd160.ts": passthrough(ripemd160),
  "hash/blake2b.ts": passthrough(blake2b),
  "hash/solidity.ts": passthrough(solidity),
  // Hex
  "hex/bytes-hex.ts": passthrough(hexBytes),
  // RLP
  "rlp/encode-decode.ts": passthrough(rlpEncodeDecode),
  // U256
  "u256/convert.ts": passthrough(u256Convert),
  // Transactions
  "tx/detect-type.ts": passthrough(txDetect),
  // Bytecode
  "bytecode/inspect.ts": passthrough(bytecodeInspect),
  // Blobs
  "blob/basic.ts": passthrough(blobBasic),
  // Access List
  "accesslist/basic.ts": passthrough(accessListBasic),
  // Crypto
  "crypto/secp256k1.ts": passthrough(secp256k1Basic),
  "crypto/signature-utils.ts": passthrough(signatureUtils),
  "crypto/signature-canonical.ts": passthrough(signatureCanonical),
  "crypto/secp256k1-direct.ts": passthrough(secp256k1Direct),
  "crypto/x25519.ts": passthrough(x25519Basic),
  "crypto/ed25519.ts": passthrough(ed25519Basic),
  "crypto/p256.ts": passthrough(p256Basic),
  "crypto/blake2-class.ts": passthrough(blake2Class),
  "crypto/sha256-class.ts": passthrough(sha256Class),
  "crypto/ripemd160-class.ts": passthrough(ripemd160Class),
  // Wallet
  "wallet/generate-compress.ts": passthrough(walletKeys),
};
