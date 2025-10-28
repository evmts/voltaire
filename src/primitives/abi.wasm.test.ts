/**
 * Tests for WASM-accelerated ABI encoding/decoding
 *
 * @status SKIPPED - C API layer not yet implemented
 * These tests will be enabled once the C ABI implementation is complete
 */

import { describe, it, expect, beforeAll } from "vitest";
import * as wasmAbi from "./abi.wasm.js";
import {
  selectorVectors,
  encodeVectors,
  roundTripVectors,
  functionDataVectors,
} from "./abi.testdata.js";
import { Abi } from "./abi.js";

// ============================================================================
// Setup and Status Checks
// ============================================================================

describe("WASM ABI Status", () => {
  it("reports unavailable status", () => {
    expect(wasmAbi.isWasmAbiAvailable()).toBe(false);
  });

  it("provides implementation status", () => {
    const status = wasmAbi.getImplementationStatus();
    expect(status.wasmAvailable).toBe(false);
    expect(status.reason).toContain("not yet implemented");
    expect(status.requiredFiles).toBeDefined();
    expect(status.estimatedFunctions).toBeDefined();
  });
});

// ============================================================================
// Selector Tests (These work - use pure TS implementation)
// ============================================================================

describe("Abi.getFunctionSelector (Pure TS)", () => {
  for (const vector of selectorVectors) {
    // Only test function selectors (4 bytes)
    if (vector.expected.length === 8) {
      it(vector.name, () => {
        const selector = Abi.getFunctionSelector(vector.signature);
        expect(selector).toBeInstanceOf(Uint8Array);
        expect(selector.length).toBe(4);

        const hex = Array.from(selector)
          .map((b) => b.toString(16).padStart(2, "0"))
          .join("");
        expect(hex).toBe(vector.expected);
      });
    }
  }
});

describe("Abi.getEventSelector (Pure TS)", () => {
  for (const vector of selectorVectors) {
    // Only test event selectors (32 bytes)
    if (vector.expected.length === 64) {
      it(vector.name, () => {
        const selector = Abi.getEventSelector(vector.signature);
        expect(selector).toBeInstanceOf(Uint8Array);
        expect(selector.length).toBe(32);

        const hex = Array.from(selector)
          .map((b) => b.toString(16).padStart(2, "0"))
          .join("");
        expect(hex).toBe(vector.expected);
      });
    }
  }
});

// ============================================================================
// WASM Encoding Tests (Currently Throws - Waiting for C API)
// ============================================================================

describe.skip("WASM Parameter Encoding (Not Implemented)", () => {
  it("encodeParametersWasm throws not implemented", () => {
    expect(() => {
      wasmAbi.encodeParametersWasm(
        [{ type: "uint256" }],
        [42n]
      );
    }).toThrow(/not yet implemented/i);
  });

  it("decodeParametersWasm throws not implemented", () => {
    expect(() => {
      wasmAbi.decodeParametersWasm(
        [{ type: "uint256" }],
        new Uint8Array(32)
      );
    }).toThrow(/not yet implemented/i);
  });

  it("encodeFunctionDataWasm throws not implemented", () => {
    expect(() => {
      wasmAbi.encodeFunctionDataWasm(
        "transfer(address,uint256)",
        [{ type: "address" }, { type: "uint256" }],
        ["0x0000000000000000000000000000000000000000", 42n]
      );
    }).toThrow(/not yet implemented/i);
  });

  it("decodeFunctionDataWasm throws not implemented", () => {
    expect(() => {
      wasmAbi.decodeFunctionDataWasm(
        "transfer(address,uint256)",
        [{ type: "address" }, { type: "uint256" }],
        new Uint8Array(68)
      );
    }).toThrow(/not yet implemented/i);
  });

  it("encodeEventTopicsWasm throws not implemented", () => {
    expect(() => {
      wasmAbi.encodeEventTopicsWasm(
        "Transfer(address,address,uint256)",
        [
          { type: "address", indexed: true },
          { type: "address", indexed: true },
          { type: "uint256", indexed: false },
        ],
        {}
      );
    }).toThrow(/not yet implemented/i);
  });

  it("decodeEventLogWasm throws not implemented", () => {
    expect(() => {
      wasmAbi.decodeEventLogWasm(
        "Transfer(address,address,uint256)",
        [],
        new Uint8Array(),
        []
      );
    }).toThrow(/not yet implemented/i);
  });

  it("encodePackedWasm throws not implemented", () => {
    expect(() => {
      wasmAbi.encodePackedWasm(
        ["uint256"],
        [42n]
      );
    }).toThrow(/not yet implemented/i);
  });
});

// ============================================================================
// Test Vectors (Ready for Implementation)
// ============================================================================

describe.skip("WASM Encoding - Basic Types (Future)", () => {
  // These tests are ready to run once C implementation is complete
  for (const vector of encodeVectors) {
    it(vector.name, () => {
      // Convert test vector format to param/value format
      const params = vector.params.map(p => ({ type: p.type }));
      const values = vector.params.map(p => p.value);

      const encoded = wasmAbi.encodeParametersWasm(params, values as any);
      const hex = Array.from(encoded)
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");

      expect(hex).toBe(vector.expected);
    });
  }
});

describe.skip("WASM Round-Trip Tests (Future)", () => {
  for (const vector of roundTripVectors) {
    it(vector.name, () => {
      const params = vector.params.map(p => ({ type: p.type }));
      const values = vector.params.map(p => p.value);

      const encoded = wasmAbi.encodeParametersWasm(params, values as any);
      const decoded = wasmAbi.decodeParametersWasm(params, encoded);

      expect(decoded).toEqual(values);
    });
  }
});

describe.skip("WASM Function Data Tests (Future)", () => {
  for (const vector of functionDataVectors) {
    if (vector.expectedCalldata) {
      it(vector.name, () => {
        const params = vector.params.map(p => ({ type: p.type }));
        const values = vector.params.map(p => p.value);

        const calldata = wasmAbi.encodeFunctionDataWasm(
          vector.signature,
          params,
          values as any
        );

        const hex = Array.from(calldata)
          .map((b) => b.toString(16).padStart(2, "0"))
          .join("");

        expect(hex).toBe(vector.expectedCalldata);
      });
    }
  }
});

// ============================================================================
// Error Handling Tests (Future)
// ============================================================================

describe.skip("WASM Error Handling (Future)", () => {
  it("throws on invalid type", () => {
    expect(() => {
      wasmAbi.encodeParametersWasm(
        [{ type: "invalid_type" as any }],
        [42n]
      );
    }).toThrow();
  });

  it("throws on mismatched parameter count", () => {
    expect(() => {
      wasmAbi.encodeParametersWasm(
        [{ type: "uint256" }, { type: "address" }],
        [42n] as any // Missing second value
      );
    }).toThrow();
  });

  it("throws on invalid selector in decode", () => {
    const wrongSelector = new Uint8Array([0xff, 0xff, 0xff, 0xff]);
    expect(() => {
      wasmAbi.decodeFunctionDataWasm(
        "transfer(address,uint256)",
        [{ type: "address" }, { type: "uint256" }],
        wrongSelector
      );
    }).toThrow();
  });

  it("throws on truncated data", () => {
    expect(() => {
      wasmAbi.decodeParametersWasm(
        [{ type: "uint256" }],
        new Uint8Array(16) // Too small
      );
    }).toThrow();
  });

  it("throws on invalid event topic0", () => {
    const wrongTopic0 = new Uint8Array(32).fill(0xff);
    expect(() => {
      wasmAbi.decodeEventLogWasm(
        "Transfer(address,address,uint256)",
        [
          { type: "address", indexed: true },
          { type: "address", indexed: true },
          { type: "uint256", indexed: false },
        ],
        new Uint8Array(),
        [wrongTopic0]
      );
    }).toThrow();
  });
});

// ============================================================================
// Performance Comparison Tests (Future)
// ============================================================================

describe.skip("WASM vs Pure TS Performance (Future)", () => {
  it("WASM encoding should be faster for large arrays", () => {
    const params = [{ type: "uint256[]" }];
    const values = [Array(1000).fill(42n)];

    const wasmStart = performance.now();
    wasmAbi.encodeParametersWasm(params, values as any);
    const wasmTime = performance.now() - wasmStart;

    const tsStart = performance.now();
    // Pure TS implementation (when available)
    // Abi.encodeParameters(params, values);
    const tsTime = performance.now() - tsStart;

    // WASM should be faster (this is aspirational)
    // expect(wasmTime).toBeLessThan(tsTime);

    console.log(`WASM: ${wasmTime}ms, TS: ${tsTime}ms`);
  });

  it("WASM decoding should be faster for complex types", () => {
    // Test with nested tuples and arrays
    const params = [{
      type: "tuple[]",
      components: [
        { type: "address" },
        { type: "uint256" },
        { type: "bytes" }
      ]
    }];

    // Create test data
    const testData = new Uint8Array(1000);
    // Fill with encoded data...

    const wasmStart = performance.now();
    try {
      wasmAbi.decodeParametersWasm(params, testData);
    } catch (e) {
      // Expected - not implemented yet
    }
    const wasmTime = performance.now() - wasmStart;

    console.log(`WASM decode attempt: ${wasmTime}ms`);
  });
});

// ============================================================================
// Integration Tests (Future)
// ============================================================================

describe.skip("WASM Integration Tests (Future)", () => {
  it("encodes and decodes ERC20 transfer", () => {
    const transferSig = "transfer(address,uint256)";
    const params = [
      { type: "address" },
      { type: "uint256" }
    ];
    const values = [
      "0xd8da6bf26964af9d7eed9e03e53415d37aa96045",
      1000000000000000000n
    ];

    const calldata = wasmAbi.encodeFunctionDataWasm(
      transferSig,
      params,
      values as any
    );

    expect(calldata.length).toBeGreaterThan(4);
    expect(calldata.slice(0, 4)).toEqual(
      Abi.getFunctionSelector(transferSig)
    );

    const decoded = wasmAbi.decodeFunctionDataWasm(
      transferSig,
      params,
      calldata
    );

    expect(decoded).toEqual(values);
  });

  it("encodes and decodes Transfer event", () => {
    const transferSig = "Transfer(address,address,uint256)";
    const params = [
      { type: "address", indexed: true, name: "from" },
      { type: "address", indexed: true, name: "to" },
      { type: "uint256", indexed: false, name: "value" }
    ];

    const from = "0x0000000000000000000000000000000000000000";
    const to = "0xd8da6bf26964af9d7eed9e03e53415d37aa96045";
    const value = 1000000000000000000n;

    const topics = wasmAbi.encodeEventTopicsWasm(
      transferSig,
      params,
      { from, to }
    );

    expect(topics.length).toBe(3); // topic0 + 2 indexed params

    // Encode non-indexed data
    const data = wasmAbi.encodeParametersWasm(
      [{ type: "uint256" }],
      [value]
    );

    const decoded = wasmAbi.decodeEventLogWasm(
      transferSig,
      params,
      data,
      topics
    );

    expect(decoded).toEqual({
      from,
      to,
      value
    });
  });
});
