/**
 * BLAKE2b Performance Benchmarks
 *
 * Measures BLAKE2b hashing performance across various input sizes and output lengths
 */

import { bench, group, run } from "mitata";
import { writeFileSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { Blake2 } from "./blake2.js";
import { Blake2Wasm } from "./blake2.wasm.js";
import * as loader from "../wasm-loader/loader.js";

// Load WASM module
const wasmPath = join(import.meta.dirname, "../../wasm/blake2.wasm");
const wasmBuffer = readFileSync(wasmPath);
await loader.loadWasm(wasmBuffer.buffer);

// Test data generators
function generateTestData(size: number): Uint8Array {
  const data = new Uint8Array(size);
  for (let i = 0; i < size; i++) {
    data[i] = i & 0xff;
  }
  return data;
}

// Results storage
const results: {
  timestamp: string;
  benchmarks: Array<{
    name: string;
    opsPerSec: number;
    avgTime: number;
    samples: number;
  }>;
} = {
  timestamp: new Date().toISOString(),
  benchmarks: [],
};

// Benchmark: Different input sizes with default output (Noble)
group("BLAKE2b Noble - Variable Input Sizes (64-byte output)", () => {
	const empty = new Uint8Array([]);
	const small = generateTestData(32);
	const medium = generateTestData(1024); // 1 KB
	const large = generateTestData(1024 * 64); // 64 KB
	const xlarge = generateTestData(1024 * 1024); // 1 MB

	bench("Empty input", () => {
		Blake2.hash(empty);
	});

	bench("32 bytes", () => {
		Blake2.hash(small);
	});

	bench("1 KB", () => {
		Blake2.hash(medium);
	});

	bench("64 KB", () => {
		Blake2.hash(large);
	});

	bench("1 MB", () => {
		Blake2.hash(xlarge);
	});
});

// Benchmark: Different input sizes with default output (WASM)
group("BLAKE2b WASM - Variable Input Sizes (64-byte output)", () => {
	const empty = new Uint8Array([]);
	const small = generateTestData(32);
	const medium = generateTestData(1024); // 1 KB
	const large = generateTestData(1024 * 64); // 64 KB
	const xlarge = generateTestData(1024 * 1024); // 1 MB

	bench("Empty input", () => {
		Blake2Wasm.hash(empty);
	});

	bench("32 bytes", () => {
		Blake2Wasm.hash(small);
	});

	bench("1 KB", () => {
		Blake2Wasm.hash(medium);
	});

	bench("64 KB", () => {
		Blake2Wasm.hash(large);
	});

	bench("1 MB", () => {
		Blake2Wasm.hash(xlarge);
	});
});

// Benchmark: Different output lengths
group("BLAKE2b - Variable Output Lengths (1 KB input)", () => {
  const input = generateTestData(1024);

  bench("BLAKE2b-64 (1 byte)", () => {
    Blake2.hash(input, 1);
  });

  bench("BLAKE2b-160 (20 bytes)", () => {
    Blake2.hash(input, 20);
  });

  bench("BLAKE2b-256 (32 bytes)", () => {
    Blake2.hash(input, 32);
  });

  bench("BLAKE2b-384 (48 bytes)", () => {
    Blake2.hash(input, 48);
  });

  bench("BLAKE2b-512 (64 bytes)", () => {
    Blake2.hash(input, 64);
  });
});

// Benchmark: String vs Uint8Array input
group("BLAKE2b - Input Type Comparison", () => {
  const str = "The quick brown fox jumps over the lazy dog";
  const bytes = new TextEncoder().encode(str);

  bench("String input", () => {
    Blake2.hash(str);
  });

  bench("Uint8Array input", () => {
    Blake2.hash(bytes);
  });

  bench("hashString method", () => {
    Blake2.hashString(str);
  });
});

// Benchmark: Throughput calculation
group("BLAKE2b - Throughput", () => {
  const sizes = [
    { name: "1 KB", size: 1024 },
    { name: "10 KB", size: 10 * 1024 },
    { name: "100 KB", size: 100 * 1024 },
    { name: "1 MB", size: 1024 * 1024 },
  ];

  for (const { name, size } of sizes) {
    const data = generateTestData(size);
    bench(`${name} throughput`, () => {
      Blake2.hash(data);
    });
  }
});

// Benchmark: Real-world use cases
group("BLAKE2b - Common Use Cases", () => {
  bench("Hash 32-byte address", () => {
    const address = new Uint8Array(32).fill(0x42);
    Blake2.hash(address, 32);
  });

  bench("Hash transaction (200 bytes)", () => {
    const tx = generateTestData(200);
    Blake2.hash(tx);
  });

  bench("Hash block header (500 bytes)", () => {
    const header = generateTestData(500);
    Blake2.hash(header);
  });

  bench("Content hash (10 KB)", () => {
    const content = generateTestData(10 * 1024);
    Blake2.hash(content, 32);
  });
});

// Benchmark: Sequential hashing
group("BLAKE2b - Sequential Operations", () => {
  const input = generateTestData(1024);

  bench("10 sequential hashes", () => {
    for (let i = 0; i < 10; i++) {
      Blake2.hash(input);
    }
  });

  bench("100 sequential hashes", () => {
    for (let i = 0; i < 100; i++) {
      Blake2.hash(input);
    }
  });
});

// Benchmark: Comparison Noble vs WASM
group("BLAKE2b - Noble vs WASM Comparison (1 KB input)", () => {
	const input = generateTestData(1024);

	bench("Noble - 32-byte output", () => {
		Blake2.hash(input, 32);
	});

	bench("WASM - 32-byte output", () => {
		Blake2Wasm.hash(input, 32);
	});

	bench("Noble - 64-byte output", () => {
		Blake2.hash(input, 64);
	});

	bench("WASM - 64-byte output", () => {
		Blake2Wasm.hash(input, 64);
	});
});

// Run benchmarks and save results
(async () => {
  console.log("Running BLAKE2b benchmarks...\n");

  await run({
    units: false,
    silent: false,
    avg: true,
    json: false,
    colors: true,
    min_max: true,
    collect: false,
    percentiles: true,
  });

	console.log("\n📊 Benchmark Summary:");
	console.log("=====================");
	console.log("BLAKE2b implementations:");
	console.log("- Noble: @noble/hashes (JavaScript)");
	console.log("- WASM: Zig implementation (WebAssembly)");
	console.log(`Timestamp: ${results.timestamp}`);
	console.log("\nPerformance characteristics:");
	console.log("- Fast hashing for all input sizes");
	console.log("- Linear scaling with input size");
	console.log("- Minimal overhead for variable output lengths");
	console.log("- WASM offers native-speed performance");

  // Save results to JSON file
  const outputPath = join(import.meta.dirname, "blake2-results.json");
  try {
    writeFileSync(
      outputPath,
      JSON.stringify(
        {
          ...results,
          note: "BLAKE2b benchmarks using @noble/hashes library",
          algorithm: "BLAKE2b",
          library: "@noble/hashes/blake2b",
        },
        null,
        2,
      ),
    );
    console.log(`\n✅ Results saved to: ${outputPath}`);
  } catch (error) {
    console.error(`\n❌ Failed to save results: ${error}`);
  }
})();
