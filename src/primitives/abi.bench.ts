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

const testAddress = "0x0000000000000000000000000000000000000000" as Address;
const testData = new Uint8Array(32);

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
    Abi.formatAbiItemWithArgs(transferFunc, [testAddress, 100n]),
  ),
);
results.push(
  benchmark("formatAbiItemWithArgs - event", () =>
    Abi.formatAbiItemWithArgs(transferEvent, [testAddress, testAddress, 1000n]),
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
// Encoding/Decoding Benchmarks (Not Implemented)
// ============================================================================

console.log("\n");
console.log("================================================================================");
console.log("ABI ENCODING/DECODING BENCHMARKS (Not Implemented)");
console.log("================================================================================\n");

console.log("--- Function Encoding ---");
results.push(
  benchmark("Function.encodeParams - simple", () => {
    try {
      Abi.Function.encodeParams.call(transferFunc, [testAddress, 100n]);
    } catch {
      // Expected - not implemented
    }
  }),
);
results.push(
  benchmark("Function.decodeResult", () => {
    try {
      Abi.Function.decodeResult.call(balanceOfFunc, testData);
    } catch {
      // Expected - not implemented
    }
  }),
);

console.log(
  results
    .slice(-2)
    .map(
      (r) =>
        `  ${r.name}: ${r.opsPerSec.toFixed(0)} ops/sec (${r.avgTimeMs.toFixed(4)} ms/op) [throws NotImplemented]`,
    )
    .join("\n"),
);

console.log("\n--- Event Encoding ---");
results.push(
  benchmark("Event.encodeTopics", () => {
    try {
      Abi.Event.encodeTopics.call(transferEvent, { from: testAddress });
    } catch {
      // Expected - not implemented
    }
  }),
);

console.log(
  results
    .slice(-1)
    .map(
      (r) =>
        `  ${r.name}: ${r.opsPerSec.toFixed(0)} ops/sec (${r.avgTimeMs.toFixed(4)} ms/op) [throws NotImplemented]`,
    )
    .join("\n"),
);

console.log("\n--- Error Encoding ---");
results.push(
  benchmark("Error.encodeParams", () => {
    try {
      Abi.Error.encodeParams.call(insufficientBalanceError, [100n, 200n]);
    } catch {
      // Expected - not implemented
    }
  }),
);

console.log(
  results
    .slice(-1)
    .map(
      (r) =>
        `  ${r.name}: ${r.opsPerSec.toFixed(0)} ops/sec (${r.avgTimeMs.toFixed(4)} ms/op) [throws NotImplemented]`,
    )
    .join("\n"),
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
// Summary
// ============================================================================

console.log("\n");
console.log("================================================================================");
console.log("Benchmarks complete!");
console.log("================================================================================");
console.log(`\nTotal benchmarks run: ${results.length}`);
console.log("\nNote: Most encoding/decoding operations throw 'Not implemented'");
console.log("These benchmarks measure error handling overhead.");
console.log("Real performance metrics will be available after implementation.\n");

// Export results for analysis
if (typeof Bun !== "undefined") {
  const resultsFile = "/Users/williamcory/primitives/src/primitives/abi-results.json";
  await Bun.write(resultsFile, JSON.stringify(results, null, 2));
  console.log(`Results saved to: ${resultsFile}\n`);
}
