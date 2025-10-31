/**
 * ABI Encoding/Decoding Benchmarks
 *
 * Measures performance of ABI operations
 */

import { Abi } from "./abi.js";
import type { Address } from "./address.js";

// Benchmark runner
interface BenchmarkResult {
  name: string;
  opsPerSec: number;
  avgTimeMs: number;
  iterations: number;
}

function benchmark(name: string, fn: () => void, duration = 2000): BenchmarkResult {
  // Warmup
  for (let i = 0; i < 100; i++) {
    try {
      fn();
    } catch {
      // Ignore errors during warmup (for not-implemented functions)
    }
  }

  // Benchmark
  const startTime = performance.now();
  let iterations = 0;
  let endTime = startTime;

  while (endTime - startTime < duration) {
    try {
      fn();
    } catch {
      // Count iteration even if it throws
    }
    iterations++;
    endTime = performance.now();
  }

  const totalTime = endTime - startTime;
  const avgTimeMs = totalTime / iterations;
  const opsPerSec = (iterations / totalTime) * 1000;

  return {
    name,
    opsPerSec,
    avgTimeMs,
    iterations,
  };
}

// ============================================================================
// Test Data
// ============================================================================

const transferFunc = {
  type: "function",
  name: "transfer",
  stateMutability: "nonpayable",
  inputs: [
    { type: "address", name: "to" },
    { type: "uint256", name: "amount" },
  ],
  outputs: [{ type: "bool", name: "" }],
} as const satisfies Abi.Function;

const balanceOfFunc = {
  type: "function",
  name: "balanceOf",
  stateMutability: "view",
  inputs: [{ type: "address", name: "account" }],
  outputs: [{ type: "uint256", name: "" }],
} as const satisfies Abi.Function;

const complexFunc = {
  type: "function",
  name: "processOrder",
  stateMutability: "nonpayable",
  inputs: [
    {
      type: "tuple",
      name: "order",
      components: [
        { type: "address", name: "maker" },
        {
          type: "tuple",
          name: "asset",
          components: [
            { type: "address", name: "token" },
            { type: "uint256", name: "amount" },
          ],
        },
        { type: "uint256[]", name: "fees" },
      ],
    },
  ],
  outputs: [],
} as const satisfies Abi.Function;

const transferEvent = {
  type: "event",
  name: "Transfer",
  inputs: [
    { type: "address", name: "from", indexed: true },
    { type: "address", name: "to", indexed: true },
    { type: "uint256", name: "value", indexed: false },
  ],
} as const satisfies Abi.Event;

const insufficientBalanceError = {
  type: "error",
  name: "InsufficientBalance",
  inputs: [
    { type: "uint256", name: "available" },
    { type: "uint256", name: "required" },
  ],
} as const satisfies Abi.Error;

// const testData = new Uint8Array(32);

// ============================================================================
// Signature Benchmarks
// ============================================================================

console.log("================================================================================");
console.log("ABI SIGNATURE GENERATION BENCHMARKS");
console.log("================================================================================\n");

const results: BenchmarkResult[] = [];

console.log("--- Function Signatures ---");
results.push(
  benchmark("Function.getSignature - simple", () =>
    Abi.Function.getSignature.call(transferFunc),
  ),
);
results.push(
  benchmark("Function.getSignature - complex tuple", () =>
    Abi.Function.getSignature.call(complexFunc),
  ),
);

console.log(
  results
    .slice(-2)
    .map(
      (r) => `  ${r.name}: ${r.opsPerSec.toFixed(0)} ops/sec (${r.avgTimeMs.toFixed(4)} ms/op)`,
    )
    .join("\n"),
);

console.log("\n--- Event Signatures ---");
results.push(
  benchmark("Event.getSignature", () => Abi.Event.getSignature.call(transferEvent)),
);

console.log(
  results
    .slice(-1)
    .map(
      (r) => `  ${r.name}: ${r.opsPerSec.toFixed(0)} ops/sec (${r.avgTimeMs.toFixed(4)} ms/op)`,
    )
    .join("\n"),
);

console.log("\n--- Error Signatures ---");
results.push(
  benchmark("Error.getSignature", () =>
    Abi.Error.getSignature.call(insufficientBalanceError),
  ),
);

console.log(
  results
    .slice(-1)
    .map(
      (r) => `  ${r.name}: ${r.opsPerSec.toFixed(0)} ops/sec (${r.avgTimeMs.toFixed(4)} ms/op)`,
    )
    .join("\n"),
);

// ============================================================================
// Selector Benchmarks (IMPLEMENTED)
// ============================================================================

console.log("\n");
console.log("================================================================================");
console.log("ABI SELECTOR GENERATION BENCHMARKS");
console.log("================================================================================\n");

console.log("--- Function Selectors ---");
results.push(
  benchmark("Function.getSelector - transfer", () =>
    Abi.Function.getSelector.call(transferFunc),
  ),
);
results.push(
  benchmark("Function.getSelector - balanceOf", () =>
    Abi.Function.getSelector.call(balanceOfFunc),
  ),
);

console.log(
  results
    .slice(-2)
    .map(
      (r) => `  ${r.name}: ${r.opsPerSec.toFixed(0)} ops/sec (${r.avgTimeMs.toFixed(4)} ms/op)`,
    )
    .join("\n"),
);

console.log("\n--- Event Selectors ---");
results.push(
  benchmark("Event.getSelector - Transfer", () =>
    Abi.Event.getSelector.call(transferEvent),
  ),
);

console.log(
  results
    .slice(-1)
    .map(
      (r) => `  ${r.name}: ${r.opsPerSec.toFixed(0)} ops/sec (${r.avgTimeMs.toFixed(4)} ms/op)`,
    )
    .join("\n"),
);

console.log("\n--- Error Selectors ---");
results.push(
  benchmark("Error.getSelector - InsufficientBalance", () =>
    Abi.Error.getSelector.call(insufficientBalanceError),
  ),
);

console.log(
  results
    .slice(-1)
    .map(
      (r) => `  ${r.name}: ${r.opsPerSec.toFixed(0)} ops/sec (${r.avgTimeMs.toFixed(4)} ms/op)`,
    )
    .join("\n"),
);

// ============================================================================
// Utility Selector Benchmarks
// ============================================================================

console.log("\n");
console.log("================================================================================");
console.log("UTILITY SELECTOR BENCHMARKS");
console.log("================================================================================\n");

console.log("--- Utility Selector Functions ---");
results.push(
  benchmark("Abi.getFunctionSelector", () =>
    Abi.getFunctionSelector("transfer(address,uint256)"),
  ),
);
results.push(
  benchmark("Abi.getEventSelector", () =>
    Abi.getEventSelector("Transfer(address,address,uint256)"),
  ),
);
results.push(
  benchmark("Abi.getErrorSelector", () =>
    Abi.getErrorSelector("InsufficientBalance(uint256,uint256)"),
  ),
);

console.log(
  results
    .slice(-3)
    .map(
      (r) => `  ${r.name}: ${r.opsPerSec.toFixed(0)} ops/sec (${r.avgTimeMs.toFixed(4)} ms/op)`,
    )
    .join("\n"),
);

// ============================================================================
// Formatting Benchmarks
// ============================================================================

console.log("\n");
console.log("================================================================================");
console.log("FORMATTING BENCHMARKS");
console.log("================================================================================\n");

console.log("--- Format ABI Items ---");
results.push(benchmark("formatAbiItem - function", () => Abi.formatAbiItem(transferFunc)));
results.push(benchmark("formatAbiItem - event", () => Abi.formatAbiItem(transferEvent)));
results.push(
  benchmark("formatAbiItem - error", () => Abi.formatAbiItem(insufficientBalanceError)),
);
results.push(
  benchmark("formatAbiItem - complex", () => Abi.formatAbiItem(complexFunc)),
);

console.log(
  results
    .slice(-4)
    .map(
      (r) => `  ${r.name}: ${r.opsPerSec.toFixed(0)} ops/sec (${r.avgTimeMs.toFixed(4)} ms/op)`,
    )
    .join("\n"),
);

console.log("\n--- Format ABI Items With Args ---");
results.push(
  benchmark("formatAbiItemWithArgs - function", () =>
    Abi.formatAbiItemWithArgs(transferFunc, ["0x0000000000000000000000000000000000000000" as unknown as Address, 100n]),
  ),
);
results.push(
  benchmark("formatAbiItemWithArgs - event", () =>
    Abi.formatAbiItemWithArgs(transferEvent, ["0x0000000000000000000000000000000000000000" as unknown as Address, "0x0000000000000000000000000000000000000000" as unknown as Address, 1000n]),
  ),
);

console.log(
  results
    .slice(-2)
    .map(
      (r) => `  ${r.name}: ${r.opsPerSec.toFixed(0)} ops/sec (${r.avgTimeMs.toFixed(4)} ms/op)`,
    )
    .join("\n"),
);

// ============================================================================
// Encoding Benchmarks (IMPLEMENTED)
// ============================================================================

console.log("\n");
console.log("================================================================================");
console.log("ABI ENCODING BENCHMARKS");
console.log("================================================================================\n");

console.log("--- Basic Type Encoding ---");
results.push(
  benchmark("encode uint256", () => {
    Abi.encodeParameters([{ type: "uint256" }], [42n]);
  })
);
results.push(
  benchmark("encode address", () => {
    Abi.encodeParameters([{ type: "address" }], ["0x0000000000000000000000000000000000000000" as unknown as Address]);
  })
);
results.push(
  benchmark("encode bool", () => {
    Abi.encodeParameters([{ type: "bool" }], [true]);
  })
);
results.push(
  benchmark("encode string", () => {
    Abi.encodeParameters([{ type: "string" }], ["Hello World"]);
  })
);

console.log(
  results
    .slice(-4)
    .map(
      (r) => `  ${r.name}: ${r.opsPerSec.toFixed(0)} ops/sec (${r.avgTimeMs.toFixed(4)} ms/op)`
    )
    .join("\n")
);

console.log("\n--- Mixed Type Encoding ---");
results.push(
  benchmark("encode (uint256, address, bool)", () => {
    Abi.encodeParameters(
      [{ type: "uint256" }, { type: "address" }, { type: "bool" }],
      [123n, "0x0000000000000000000000000000000000000000" as unknown as Address, true]
    );
  })
);
results.push(
  benchmark("encode (string, uint256, bool)", () => {
    Abi.encodeParameters(
      [{ type: "string" }, { type: "uint256" }, { type: "bool" }],
      ["test", 420n, true]
    );
  })
);

console.log(
  results
    .slice(-2)
    .map(
      (r) => `  ${r.name}: ${r.opsPerSec.toFixed(0)} ops/sec (${r.avgTimeMs.toFixed(4)} ms/op)`
    )
    .join("\n")
);

console.log("\n--- Function Encoding ---");
results.push(
  benchmark("Function.encodeParams - transfer", () => {
    Abi.Function.encodeParams.call(transferFunc, ["0x0000000000000000000000000000000000000000" as unknown as Address, 100n] as [Address, bigint]);
  })
);
results.push(
  benchmark("Function.encodeResult - bool", () => {
    Abi.Function.encodeResult.call(transferFunc, [true] as [boolean]);
  })
);

console.log(
  results
    .slice(-2)
    .map(
      (r) => `  ${r.name}: ${r.opsPerSec.toFixed(0)} ops/sec (${r.avgTimeMs.toFixed(4)} ms/op)`
    )
    .join("\n")
);

console.log("\n--- Event Encoding ---");
results.push(
  benchmark("Event.encodeTopics", () => {
    Abi.Event.encodeTopics.call(transferEvent, { from: "0x0000000000000000000000000000000000000000" as unknown as Address });
  })
);

console.log(
  results
    .slice(-1)
    .map(
      (r) => `  ${r.name}: ${r.opsPerSec.toFixed(0)} ops/sec (${r.avgTimeMs.toFixed(4)} ms/op)`
    )
    .join("\n")
);

console.log("\n--- Error Encoding ---");
results.push(
  benchmark("Error.encodeParams", () => {
    Abi.Error.encodeParams.call(insufficientBalanceError, [100n, 200n] as [bigint, bigint]);
  })
);

console.log(
  results
    .slice(-1)
    .map(
      (r) => `  ${r.name}: ${r.opsPerSec.toFixed(0)} ops/sec (${r.avgTimeMs.toFixed(4)} ms/op)`
    )
    .join("\n")
);

// ============================================================================
// Decoding Benchmarks (IMPLEMENTED)
// ============================================================================

console.log("\n");
console.log("================================================================================");
console.log("ABI DECODING BENCHMARKS");
console.log("================================================================================\n");

const encodedUint256 = Abi.encodeParameters([{ type: "uint256" }], [42n]);
const encodedAddress = Abi.encodeParameters([{ type: "address" }], ["0x0000000000000000000000000000000000000000" as unknown as Address]);
const encodedBool = Abi.encodeParameters([{ type: "bool" }], [true]);
const encodedString = Abi.encodeParameters([{ type: "string" }], ["Hello World"]);
const encodedMixed = Abi.encodeParameters(
  [{ type: "uint256" }, { type: "address" }],
  [123n, "0x0000000000000000000000000000000000000000" as unknown as Address]
);

console.log("--- Basic Type Decoding ---");
results.push(
  benchmark("decode uint256", () => {
    Abi.decodeParameters([{ type: "uint256" }], encodedUint256);
  })
);
results.push(
  benchmark("decode address", () => {
    Abi.decodeParameters([{ type: "address" }], encodedAddress);
  })
);
results.push(
  benchmark("decode bool", () => {
    Abi.decodeParameters([{ type: "bool" }], encodedBool);
  })
);
results.push(
  benchmark("decode string", () => {
    Abi.decodeParameters([{ type: "string" }], encodedString);
  })
);

console.log(
  results
    .slice(-4)
    .map(
      (r) => `  ${r.name}: ${r.opsPerSec.toFixed(0)} ops/sec (${r.avgTimeMs.toFixed(4)} ms/op)`
    )
    .join("\n")
);

console.log("\n--- Mixed Type Decoding ---");
results.push(
  benchmark("decode (uint256, address)", () => {
    Abi.decodeParameters(
      [{ type: "uint256" }, { type: "address" }],
      encodedMixed
    );
  })
);

console.log(
  results
    .slice(-1)
    .map(
      (r) => `  ${r.name}: ${r.opsPerSec.toFixed(0)} ops/sec (${r.avgTimeMs.toFixed(4)} ms/op)`
    )
    .join("\n")
);

console.log("\n--- Function Decoding ---");
const encodedTransferCall = Abi.Function.encodeParams.call(transferFunc, ["0x0000000000000000000000000000000000000000" as unknown as Address, 100n] as [Address, bigint]);
const encodedBoolResult = Abi.Function.encodeResult.call(transferFunc, [true] as [boolean]);

results.push(
  benchmark("Function.decodeParams", () => {
    Abi.Function.decodeParams.call(transferFunc, encodedTransferCall);
  })
);
results.push(
  benchmark("Function.decodeResult", () => {
    Abi.Function.decodeResult.call(transferFunc, encodedBoolResult);
  })
);

console.log(
  results
    .slice(-2)
    .map(
      (r) => `  ${r.name}: ${r.opsPerSec.toFixed(0)} ops/sec (${r.avgTimeMs.toFixed(4)} ms/op)`
    )
    .join("\n")
);

console.log("\n--- Event Decoding ---");
const encodedEventData = Abi.encodeParameters([{ type: "uint256" }], [1000n]);
const eventTopics = Abi.Event.encodeTopics.call(transferEvent, { from: "0x0000000000000000000000000000000000000000" as unknown as Address, to: "0x0000000000000000000000000000000000000000" as unknown as Address });

results.push(
  benchmark("Event.decodeLog", () => {
    Abi.Event.decodeLog.call(transferEvent, encodedEventData, eventTopics as any);
  })
);

console.log(
  results
    .slice(-1)
    .map(
      (r) => `  ${r.name}: ${r.opsPerSec.toFixed(0)} ops/sec (${r.avgTimeMs.toFixed(4)} ms/op)`
    )
    .join("\n")
);

console.log("\n--- Error Decoding ---");
const encodedError = Abi.Error.encodeParams.call(insufficientBalanceError, [100n, 200n] as [bigint, bigint]);

results.push(
  benchmark("Error.decodeParams", () => {
    Abi.Error.decodeParams.call(insufficientBalanceError, encodedError);
  })
);

console.log(
  results
    .slice(-1)
    .map(
      (r) => `  ${r.name}: ${r.opsPerSec.toFixed(0)} ops/sec (${r.avgTimeMs.toFixed(4)} ms/op)`
    )
    .join("\n")
);

// ============================================================================
// ABI-Level Operations
// ============================================================================

const testAbi = [transferFunc, balanceOfFunc] as const satisfies Abi;

console.log("\n");
console.log("================================================================================");
console.log("ABI-LEVEL OPERATIONS BENCHMARKS");
console.log("================================================================================\n");

console.log("--- ABI Lookup Operations ---");
results.push(
  benchmark("Abi.getItem", () => Abi.getItem.call(testAbi, "transfer", "function")),
);

console.log(
  results
    .slice(-1)
    .map(
      (r) => `  ${r.name}: ${r.opsPerSec.toFixed(0)} ops/sec (${r.avgTimeMs.toFixed(4)} ms/op)`,
    )
    .join("\n"),
);

// ============================================================================
// Round-Trip Benchmarks
// ============================================================================

console.log("\n");
console.log("================================================================================");
console.log("ROUND-TRIP BENCHMARKS");
console.log("================================================================================\n");

console.log("--- Encode + Decode Round-Trip ---");
results.push(
  benchmark("round-trip uint256", () => {
    const encoded = Abi.encodeParameters([{ type: "uint256" }], [42n]);
    Abi.decodeParameters([{ type: "uint256" }], encoded);
  })
);
results.push(
  benchmark("round-trip (uint256, address)", () => {
    const params = [{ type: "uint256" }, { type: "address" }];
    const values = [123n, "0x0000000000000000000000000000000000000000" as unknown as Address];
    const encoded = Abi.encodeParameters(params, values as any);
    Abi.decodeParameters(params, encoded);
  })
);
results.push(
  benchmark("round-trip Function call", () => {
    const encoded = Abi.Function.encodeParams.call(transferFunc, ["0x0000000000000000000000000000000000000000" as unknown as Address, 100n] as [Address, bigint]);
    Abi.Function.decodeParams.call(transferFunc, encoded);
  })
);

console.log(
  results
    .slice(-3)
    .map(
      (r) => `  ${r.name}: ${r.opsPerSec.toFixed(0)} ops/sec (${r.avgTimeMs.toFixed(4)} ms/op)`
    )
    .join("\n")
);

// ============================================================================
// Summary
// ============================================================================

console.log("\n");
console.log("================================================================================");
console.log("BENCHMARK SUMMARY");
console.log("================================================================================");
console.log(`\nTotal benchmarks run: ${results.length}`);

// Calculate statistics
const allOpsPerSec = results.map(r => r.opsPerSec);
const avgOps = allOpsPerSec.reduce((a, b) => a + b, 0) / allOpsPerSec.length;
const maxOps = Math.max(...allOpsPerSec);
const minOps = Math.min(...allOpsPerSec);

console.log(`\nPerformance Statistics:`);
console.log(`  Average: ${avgOps.toFixed(0)} ops/sec`);
console.log(`  Max: ${maxOps.toFixed(0)} ops/sec (${results.find(r => r.opsPerSec === maxOps)?.name})`);
console.log(`  Min: ${minOps.toFixed(0)} ops/sec (${results.find(r => r.opsPerSec === minOps)?.name})`);

// Top 5 fastest operations
console.log(`\nTop 5 Fastest Operations:`);
const sortedResults = [...results].sort((a, b) => b.opsPerSec - a.opsPerSec);
sortedResults.slice(0, 5).forEach((r, i) => {
  console.log(`  ${i + 1}. ${r.name}: ${r.opsPerSec.toFixed(0)} ops/sec`);
});

// Encoding vs Decoding comparison
const encodingOps = results.filter(r => r.name.includes('encode')).map(r => r.opsPerSec);
const decodingOps = results.filter(r => r.name.includes('decode')).map(r => r.opsPerSec);
if (encodingOps.length > 0 && decodingOps.length > 0) {
  const avgEncoding = encodingOps.reduce((a, b) => a + b, 0) / encodingOps.length;
  const avgDecoding = decodingOps.reduce((a, b) => a + b, 0) / decodingOps.length;
  console.log(`\nEncoding vs Decoding:`);
  console.log(`  Avg Encoding: ${avgEncoding.toFixed(0)} ops/sec`);
  console.log(`  Avg Decoding: ${avgDecoding.toFixed(0)} ops/sec`);
  console.log(`  Ratio: ${(avgEncoding / avgDecoding).toFixed(2)}x (encoding ${avgEncoding > avgDecoding ? 'faster' : 'slower'})`);
}

console.log("\n");

// Export results for analysis
if (typeof Bun !== "undefined") {
  const resultsFile = "/Users/williamcory/primitives/src/primitives/abi-results.json";
  await Bun.write(resultsFile, JSON.stringify(results, null, 2));
  console.log(`Results saved to: ${resultsFile}\n`);
}
