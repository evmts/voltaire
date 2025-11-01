/**
 * EIP-712 Benchmarks
 *
 * Performance benchmarks for EIP-712 operations
 */

import { bench, run } from "mitata";
import { writeFileSync } from "node:fs";
import { Eip712 } from "./eip712.js";
import * as Address from "../primitives/Address/index.js";
import type { Hash } from "../primitives/Hash/index.js";
import * as HashNamespace from "../primitives/Hash/index.js";
const Hash = HashNamespace;

// Test data setup
const privateKey = new Uint8Array(32);
for (let i = 0; i < 32; i++) {
  privateKey[i] = i + 1;
}

const simpleTypedData: Eip712.TypedData = {
  domain: {
    name: "TestApp",
    version: "1",
    chainId: 1n,
  },
  types: {
    Message: [{ name: "content", type: "string" }],
  },
  primaryType: "Message",
  message: {
    content: "Hello, World!",
  },
};

const complexTypedData: Eip712.TypedData = {
  domain: {
    name: "Ether Mail",
    version: "1",
    chainId: 1n,
    verifyingContract: Address.fromHex(
      "0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC",
    ),
  },
  types: {
    Person: [
      { name: "name", type: "string" },
      { name: "wallet", type: "address" },
    ],
    Mail: [
      { name: "from", type: "Person" },
      { name: "to", type: "Person" },
      { name: "contents", type: "string" },
    ],
  },
  primaryType: "Mail",
  message: {
    from: {
      name: "Cow",
      wallet: Address.fromHex("0xCD2a3d9F938E13CD947Ec05AbC7FE734Df8DD826"),
    },
    to: {
      name: "Bob",
      wallet: Address.fromHex("0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB"),
    },
    contents: "Hello, Bob!",
  },
};

const permitTypedData: Eip712.TypedData = {
  domain: {
    name: "USD Coin",
    version: "1",
    chainId: 1n,
    verifyingContract: Address.fromHex(
      "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
    ),
  },
  types: {
    Permit: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
      { name: "value", type: "uint256" },
      { name: "nonce", type: "uint256" },
      { name: "deadline", type: "uint256" },
    ],
  },
  primaryType: "Permit",
  message: {
    owner: Address.fromHex("0x742d35Cc6634C0532925a3b844Bc9e7595f251e3"),
    spender: Address.fromHex("0x1234567890123456789012345678901234567890"),
    value: 1000000n,
    nonce: 0n,
    deadline: 1700000000n,
  },
};

// Pre-computed signature for verification benchmark
const testSignature = Eip712.signTypedData(simpleTypedData, privateKey);
const testAddress = Eip712.recoverAddress(testSignature, simpleTypedData);

// ============================================================================
// Domain Operations
// ============================================================================

bench("Domain.hash - minimal", () => {
  Eip712.Domain.hash({ name: "Test" });
});

bench("Domain.hash - complete", () => {
  Eip712.Domain.hash({
    name: "TestDomain",
    version: "1",
    chainId: 1n,
    verifyingContract: Address.fromHex(
      "0x742d35Cc6634C0532925a3b844Bc9e7595f251e3",
    ),
    salt: Hash.fromHex(
      "0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
    ),
  });
});

// ============================================================================
// Type Encoding
// ============================================================================

bench("encodeType - simple", () => {
  const types: Eip712.TypeDefinitions = {
    Person: [
      { name: "name", type: "string" },
      { name: "wallet", type: "address" },
    ],
  };
  Eip712.encodeType("Person", types);
});

bench("encodeType - nested", () => {
  Eip712.encodeType("Mail", complexTypedData.types);
});

bench("hashType - simple", () => {
  const types: Eip712.TypeDefinitions = {
    Person: [
      { name: "name", type: "string" },
      { name: "wallet", type: "address" },
    ],
  };
  Eip712.hashType("Person", types);
});

bench("hashType - nested", () => {
  Eip712.hashType("Mail", complexTypedData.types);
});

// ============================================================================
// Value Encoding
// ============================================================================

bench("encodeValue - uint256", () => {
  Eip712.encodeValue("uint256", 42n, {});
});

bench("encodeValue - address", () => {
  const address = Address.fromHex("0x742d35Cc6634C0532925a3b844Bc9e7595f251e3");
  Eip712.encodeValue("address", address, {});
});

bench("encodeValue - string", () => {
  Eip712.encodeValue("string", "Hello, World!", {});
});

bench("encodeValue - bytes", () => {
  const bytes = new Uint8Array([1, 2, 3, 4, 5]);
  Eip712.encodeValue("bytes", bytes, {});
});

bench("encodeValue - struct", () => {
  const types: Eip712.TypeDefinitions = {
    Person: [
      { name: "name", type: "string" },
      { name: "wallet", type: "address" },
    ],
  };
  const person = {
    name: "Alice",
    wallet: Address.fromHex("0x742d35Cc6634C0532925a3b844Bc9e7595f251e3"),
  };
  Eip712.encodeValue("Person", person, types);
});

// ============================================================================
// Struct Hashing
// ============================================================================

bench("hashStruct - simple", () => {
  const types: Eip712.TypeDefinitions = {
    Message: [{ name: "content", type: "string" }],
  };
  const message = { content: "Hello!" };
  Eip712.hashStruct("Message", message, types);
});

bench("hashStruct - complex", () => {
  Eip712.hashStruct(
    complexTypedData.primaryType,
    complexTypedData.message,
    complexTypedData.types,
  );
});

// ============================================================================
// Typed Data Hashing
// ============================================================================

bench("hashTypedData - simple message", () => {
  Eip712.hashTypedData(simpleTypedData);
});

bench("hashTypedData - nested types", () => {
  Eip712.hashTypedData(complexTypedData);
});

bench("hashTypedData - ERC-2612 permit", () => {
  Eip712.hashTypedData(permitTypedData);
});

// ============================================================================
// Signing Operations
// ============================================================================

bench("signTypedData - simple message", () => {
  Eip712.signTypedData(simpleTypedData, privateKey);
});

bench("signTypedData - nested types", () => {
  Eip712.signTypedData(complexTypedData, privateKey);
});

bench("signTypedData - ERC-2612 permit", () => {
  Eip712.signTypedData(permitTypedData, privateKey);
});

// ============================================================================
// Verification Operations
// ============================================================================

bench("recoverAddress", () => {
  Eip712.recoverAddress(testSignature, simpleTypedData);
});

bench("verifyTypedData - valid signature", () => {
  Eip712.verifyTypedData(testSignature, simpleTypedData, testAddress);
});

bench("verifyTypedData - invalid signature", () => {
  const wrongAddress = Address.fromHex(
    "0x1234567890123456789012345678901234567890",
  );
  Eip712.verifyTypedData(testSignature, simpleTypedData, wrongAddress);
});

// ============================================================================
// End-to-End Operations
// ============================================================================

bench("sign + verify (simple)", () => {
  const sig = Eip712.signTypedData(simpleTypedData, privateKey);
  const addr = Eip712.recoverAddress(sig, simpleTypedData);
  Eip712.verifyTypedData(sig, simpleTypedData, addr);
});

bench("sign + verify (complex)", () => {
  const sig = Eip712.signTypedData(complexTypedData, privateKey);
  const addr = Eip712.recoverAddress(sig, complexTypedData);
  Eip712.verifyTypedData(sig, complexTypedData, addr);
});

bench("sign + verify (permit)", () => {
  const sig = Eip712.signTypedData(permitTypedData, privateKey);
  const addr = Eip712.recoverAddress(sig, permitTypedData);
  Eip712.verifyTypedData(sig, permitTypedData, addr);
});

// ============================================================================
// Utility Operations
// ============================================================================

bench("validate - simple", () => {
  Eip712.validate(simpleTypedData);
});

bench("validate - complex", () => {
  Eip712.validate(complexTypedData);
});

bench("format", () => {
  Eip712.format(simpleTypedData);
});

// ============================================================================
// Run benchmarks and export results
// ============================================================================

// Capture results
const results: Record<
  string,
  { opsPerSec: number; avgTime: number; samples: number }
> = {};

// Monkey-patch mitata's summary function to capture results
const originalSummary = (globalThis as any).summary;
(globalThis as any).summary = (result: any) => {
  results[result.name] = {
    opsPerSec: result.hz || 0,
    avgTime: result.avg || 0,
    samples: result.samples || 0,
  };
  if (originalSummary) originalSummary(result);
};

await run();

// Export results to JSON
const output = {
  timestamp: new Date().toISOString(),
  results,
  summary: {
    totalBenchmarks: Object.keys(results).length,
    categories: {
      domain: Object.keys(results).filter((k) => k.startsWith("Domain")).length,
      encoding: Object.keys(results).filter(
        (k) => k.startsWith("encode") || k.startsWith("hash"),
      ).length,
      signing: Object.keys(results).filter(
        (k) => k.startsWith("sign") || k.startsWith("verify"),
      ).length,
      utility: Object.keys(results).filter(
        (k) => k.startsWith("validate") || k.startsWith("format"),
      ).length,
    },
  },
};

writeFileSync(
  new URL("./eip712-results.json", import.meta.url),
  JSON.stringify(output, null, 2),
);

console.log("\n✓ Benchmark results exported to eip712-results.json");
