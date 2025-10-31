/**
 * Tests for ABI module with abitype integration
 */

// @ts-nocheck
import { describe, it, expect, expectTypeOf } from "vitest";
import * as Abi from "./index.js";
import type { Function as AbiFunction, Event as AbiEvent, Error as AbiError } from "./types.js";
import {
  AbiEncodingError,
  AbiDecodingError,
  AbiParameterMismatchError,
  AbiItemNotFoundError,
  AbiInvalidSelectorError,
} from "./index.js";
import type { Address } from "../address.js";

// ============================================================================
// Signature Tests
// ============================================================================

describe("Abi.Function.getSignature", () => {
  it("generates correct function signature", () => {
    const transferFunc = {
      type: "function",
      name: "transfer",
      stateMutability: "nonpayable",
      inputs: [
        { type: "address", name: "to" },
        { type: "uint256", name: "amount" },
      ],
      outputs: [{ type: "bool", name: "" }],
    } as const satisfies AbiFunction;

    expect(Abi.Function.getSignature(transferFunc)).toBe(
      "transfer(address,uint256)",
    );
  });

  it("handles empty inputs", () => {
    const func = {
      type: "function",
      name: "example",
      stateMutability: "pure",
      inputs: [],
      outputs: [],
    } as const satisfies AbiFunction;

    expect(Abi.Function.getSignature(func)).toBe("example()");
  });

  it("handles complex tuples", () => {
    const func = {
      type: "function",
      name: "swap",
      stateMutability: "nonpayable",
      inputs: [
        {
          type: "tuple",
          name: "params",
          components: [
            { type: "address", name: "tokenIn" },
            { type: "uint256", name: "amountIn" },
          ],
        },
      ],
      outputs: [],
    } as const satisfies AbiFunction;

    expect(Abi.Function.getSignature(func)).toBe("swap(tuple)");
  });
});

describe("Abi.Event.getSignature", () => {
  it("generates correct event signature", () => {
    const event = {
      type: "event",
      name: "Transfer",
      inputs: [
        { type: "address", name: "from", indexed: true },
        { type: "address", name: "to", indexed: true },
        { type: "uint256", name: "value", indexed: false },
      ],
    } as const satisfies AbiEvent;

    expect(Abi.Event.getSignature(event)).toBe(
      "Transfer(address,address,uint256)",
    );
  });
});

describe("Abi.Error.getSignature", () => {
  it("generates correct error signature", () => {
    const error = {
      type: "error",
      name: "InsufficientBalance",
      inputs: [
        { type: "uint256", name: "available" },
        { type: "uint256", name: "required" },
      ],
    } as const satisfies AbiError;

    expect(Abi.Error.getSignature(error)).toBe(
      "InsufficientBalance(uint256,uint256)",
    );
  });
});

// ============================================================================
// Selector Tests
// ============================================================================

describe("Abi.Function.getSelector", () => {
  it("computes correct function selector", () => {
    const func = {
      type: "function",
      name: "transfer",
      stateMutability: "nonpayable",
      inputs: [
        { type: "address", name: "to" },
        { type: "uint256", name: "amount" },
      ],
      outputs: [],
    } as const satisfies AbiFunction;

    const selector = Abi.Function.getSelector(func);
    expect(selector).toBeInstanceOf(Uint8Array);
    expect(selector.length).toBe(4);
    // transfer(address,uint256) = 0xa9059cbb
    expect(Array.from(selector)).toEqual([0xa9, 0x05, 0x9c, 0xbb]);
  });

  it("computes selector for function with no params", () => {
    const func = {
      type: "function",
      name: "example",
      stateMutability: "pure",
      inputs: [],
      outputs: [],
    } as const satisfies AbiFunction;

    const selector = Abi.Function.getSelector(func);
    expect(selector).toBeInstanceOf(Uint8Array);
    expect(selector.length).toBe(4);
  });
});

describe("Abi.Event.getSelector", () => {
  it("computes correct event selector (topic0)", () => {
    const event = {
      type: "event",
      name: "Transfer",
      inputs: [
        { type: "address", name: "from", indexed: true },
        { type: "address", name: "to", indexed: true },
        { type: "uint256", name: "value", indexed: false },
      ],
    } as const satisfies AbiEvent;

    const selector = Abi.Event.getSelector(event);
    expect(selector).toBeInstanceOf(Uint8Array);
    expect(selector.length).toBe(32);
    // Transfer(address,address,uint256) = 0xddf252ad...
    const hex = Array.from(selector)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    expect(hex).toBe(
      "ddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
    );
  });

  it("computes selector for event with no params", () => {
    const event = {
      type: "event",
      name: "Transfer",
      inputs: [],
    } as const satisfies AbiEvent;

    const selector = Abi.Event.getSelector(event);
    expect(selector).toBeInstanceOf(Uint8Array);
    expect(selector.length).toBe(32);
  });
});

describe("Abi.Error.getSelector", () => {
  it("computes correct error selector", () => {
    const error = {
      type: "error",
      name: "InsufficientBalance",
      inputs: [
        { type: "uint256", name: "available" },
        { type: "uint256", name: "required" },
      ],
    } as const satisfies AbiError;

    const selector = Abi.Error.getSelector(error);
    expect(selector).toBeInstanceOf(Uint8Array);
    expect(selector.length).toBe(4);
  });

  it("computes selector for error with no params", () => {
    const error = {
      type: "error",
      name: "InsufficientBalance",
      inputs: [],
    } as const satisfies AbiError;

    const selector = Abi.Error.getSelector(error);
    expect(selector).toBeInstanceOf(Uint8Array);
    expect(selector.length).toBe(4);
  });
});

// ============================================================================
// Utility Selector Tests
// ============================================================================

describe("Abi.getFunctionSelector", () => {
  it("computes correct function selector from signature string", () => {
    const selector = Abi.getFunctionSelector("transfer(address,uint256)");
    expect(selector).toBeInstanceOf(Uint8Array);
    expect(selector.length).toBe(4);
    expect(Array.from(selector)).toEqual([0xa9, 0x05, 0x9c, 0xbb]);
  });

  it("handles function with no params", () => {
    const selector = Abi.getFunctionSelector("example()");
    expect(selector).toBeInstanceOf(Uint8Array);
    expect(selector.length).toBe(4);
  });

  it("handles complex function signatures", () => {
    const selector = Abi.getFunctionSelector("swap(address,uint256,bool)");
    expect(selector).toBeInstanceOf(Uint8Array);
    expect(selector.length).toBe(4);
  });
});

describe("Abi.getEventSelector", () => {
  it("computes correct event selector from signature string", () => {
    const selector = Abi.getEventSelector("Transfer(address,address,uint256)");
    expect(selector).toBeInstanceOf(Uint8Array);
    expect(selector.length).toBe(32);
    const hex = Array.from(selector)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    expect(hex).toBe(
      "ddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
    );
  });

  it("handles event with no params", () => {
    const selector = Abi.getEventSelector("Example()");
    expect(selector).toBeInstanceOf(Uint8Array);
    expect(selector.length).toBe(32);
  });
});

describe("Abi.getErrorSelector", () => {
  it("computes correct error selector from signature string", () => {
    const selector = Abi.getErrorSelector("InsufficientBalance(uint256,uint256)");
    expect(selector).toBeInstanceOf(Uint8Array);
    expect(selector.length).toBe(4);
  });

  it("handles error with no params", () => {
    const selector = Abi.getErrorSelector("CustomError()");
    expect(selector).toBeInstanceOf(Uint8Array);
    expect(selector.length).toBe(4);
  });
});

// ============================================================================
// Formatting Tests
// ============================================================================

describe("Abi.formatAbiItem", () => {
  it("formats function with inputs and outputs", () => {
    const func = {
      type: "function",
      name: "transfer",
      stateMutability: "nonpayable",
      inputs: [
        { type: "address", name: "to" },
        { type: "uint256", name: "amount" },
      ],
      outputs: [{ type: "bool", name: "" }],
    } as const satisfies AbiFunction;

    const formatted = Abi.formatAbiItem(func);
    expect(formatted).toBe("function transfer(address to, uint256 amount) returns (bool)");
  });

  it("formats function with no outputs", () => {
    const func = {
      type: "function",
      name: "burn",
      stateMutability: "nonpayable",
      inputs: [{ type: "uint256", name: "amount" }],
      outputs: [],
    } as const satisfies AbiFunction;

    const formatted = Abi.formatAbiItem(func);
    expect(formatted).toBe("function burn(uint256 amount)");
  });

  it("formats function with state mutability", () => {
    const func = {
      type: "function",
      name: "balanceOf",
      stateMutability: "view",
      inputs: [{ type: "address", name: "account" }],
      outputs: [{ type: "uint256", name: "" }],
    } as const satisfies AbiFunction;

    const formatted = Abi.formatAbiItem(func);
    expect(formatted).toBe("function balanceOf(address account) returns (uint256) view");
  });

  it("formats event", () => {
    const event = {
      type: "event",
      name: "Transfer",
      inputs: [
        { type: "address", name: "from", indexed: true },
        { type: "address", name: "to", indexed: true },
        { type: "uint256", name: "value", indexed: false },
      ],
    } as const satisfies AbiEvent;

    const formatted = Abi.formatAbiItem(event);
    expect(formatted).toBe("event Transfer(address from, address to, uint256 value)");
  });

  it("formats error", () => {
    const error = {
      type: "error",
      name: "InsufficientBalance",
      inputs: [
        { type: "uint256", name: "available" },
        { type: "uint256", name: "required" },
      ],
    } as const satisfies AbiError;

    const formatted = Abi.formatAbiItem(error);
    expect(formatted).toBe("error InsufficientBalance(uint256 available, uint256 required)");
  });

  it("formats fallback", () => {
    const fallback = {
      type: "fallback",
      stateMutability: "payable",
    } as const satisfies Abi.Fallback;

    const formatted = Abi.formatAbiItem(fallback);
    expect(formatted).toBe("fallback");
  });

  it("formats receive", () => {
    const receive = {
      type: "receive",
      stateMutability: "payable",
    } as const satisfies Abi.Receive;

    const formatted = Abi.formatAbiItem(receive);
    expect(formatted).toBe("receive");
  });
});

describe("Abi.formatAbiItemWithArgs", () => {
  it("formats function call with arguments", () => {
    const func = {
      type: "function",
      name: "transfer",
      stateMutability: "nonpayable",
      inputs: [
        { type: "address", name: "to" },
        { type: "uint256", name: "amount" },
      ],
      outputs: [],
    } as const satisfies AbiFunction;

    const formatted = Abi.formatAbiItemWithArgs(func, [
      "0x742d35Cc6634C0532925a3b844Bc9e7595f251e3",
      1000000000000000000n,
    ]);
    expect(formatted).toBe(
      "transfer(0x742d35Cc6634C0532925a3b844Bc9e7595f251e3, 1000000000000000000)",
    );
  });

  it("formats function with no args", () => {
    const func = {
      type: "function",
      name: "totalSupply",
      stateMutability: "view",
      inputs: [],
      outputs: [{ type: "uint256", name: "" }],
    } as const satisfies AbiFunction;

    const formatted = Abi.formatAbiItemWithArgs(func, []);
    expect(formatted).toBe("totalSupply()");
  });

  it("formats event with arguments", () => {
    const event = {
      type: "event",
      name: "Transfer",
      inputs: [
        { type: "address", name: "from" },
        { type: "address", name: "to" },
        { type: "uint256", name: "value" },
      ],
    } as const satisfies AbiEvent;

    const formatted = Abi.formatAbiItemWithArgs(event, [
      "0x0000000000000000000000000000000000000000",
      "0x742d35Cc6634C0532925a3b844Bc9e7595f251e3",
      1000n,
    ]);
    expect(formatted).toContain("Transfer(");
    expect(formatted).toContain("1000");
  });
});

// ============================================================================
// Encoding/Decoding Tests (Not Implemented)
// ============================================================================

describe("Abi.Function encoding/decoding", () => {
  const func = {
    type: "function",
    name: "transfer",
    stateMutability: "nonpayable",
    inputs: [
      { type: "address", name: "to" },
      { type: "uint256", name: "amount" },
    ],
    outputs: [{ type: "bool", name: "" }],
  } as const satisfies AbiFunction;

  it("encodeParams encodes calldata with selector", () => {
    const encoded = Abi.Function.encodeParams.call(func, [
      "0x0000000000000000000000000000000000000000" as Address,
      100n,
    ]);
    expect(encoded).toBeInstanceOf(Uint8Array);
    expect(encoded.length).toBe(68); // 4 bytes selector + 64 bytes params
    // Check selector (transfer(address,uint256) = 0xa9059cbb)
    expect(Array.from(encoded.slice(0, 4))).toEqual([0xa9, 0x05, 0x9c, 0xbb]);
  });

  it("decodeParams decodes calldata", () => {
    const encoded = Abi.Function.encodeParams.call(func, [
      "0x742d35cc6634c0532925a3b844bc9e7595f251e3" as Address,
      1000n,
    ]);
    const decoded = Abi.Function.decodeParams.call(func, encoded);
    expect(decoded).toEqual([
      "0x742d35cc6634c0532925a3b844bc9e7595f251e3",
      1000n,
    ]);
  });

  it("encodeResult encodes return values", () => {
    const encoded = Abi.Function.encodeResult.call(func, [true]);
    expect(encoded).toBeInstanceOf(Uint8Array);
    expect(encoded.length).toBe(32);
    expect(encoded[31]).toBe(1);
  });

  it("decodeResult decodes return values", () => {
    const encoded = Abi.Function.encodeResult.call(func, [true]);
    const decoded = Abi.Function.decodeResult.call(func, encoded);
    expect(decoded).toEqual([true]);
  });
});

describe("Abi.Event encoding/decoding", () => {
  const event = {
    type: "event",
    name: "Transfer",
    inputs: [
      { type: "address", name: "from", indexed: true },
      { type: "address", name: "to", indexed: true },
      { type: "uint256", name: "value", indexed: false },
    ],
  } as const satisfies AbiEvent;

  it("encodeTopics encodes indexed parameters", () => {
    const topics = Abi.Event.encodeTopics.call(event, {
      from: "0x742d35cc6634c0532925a3b844bc9e7595f251e3" as Address,
    });
    expect(topics.length).toBe(3); // topic0 + 2 indexed params
    expect(topics[0]).toBeInstanceOf(Uint8Array);
    expect(topics[0]?.length).toBe(32); // topic0 (event selector)
  });

  it("decodeLog decodes event data and topics", () => {
    const value = 1000n;
    const from = "0x742d35cc6634c0532925a3b844bc9e7595f251e3" as Address;
    const to = "0x0000000000000000000000000000000000000000" as Address;

    const topics = Abi.Event.encodeTopics.call(event, { from, to });
    const data = Abi.encodeParameters([{ type: "uint256" }], [value]);

    const decoded = Abi.Event.decodeLog.call(event, data, topics as any);
    expect(decoded.from).toBe(from);
    expect(decoded.to).toBe(to);
    expect(decoded.value).toBe(value);
  });
});

describe("Abi.Error encoding/decoding", () => {
  const error = {
    type: "error",
    name: "InsufficientBalance",
    inputs: [
      { type: "uint256", name: "available" },
      { type: "uint256", name: "required" },
    ],
  } as const satisfies AbiError;

  it("encodeParams encodes error data with selector", () => {
    const encoded = Abi.Error.encodeParams.call(error, [100n, 200n]);
    expect(encoded).toBeInstanceOf(Uint8Array);
    expect(encoded.length).toBe(68); // 4 bytes selector + 64 bytes params
  });

  it("decodeParams decodes error data", () => {
    const encoded = Abi.Error.encodeParams.call(error, [100n, 200n]);
    const decoded = Abi.Error.decodeParams.call(error, encoded);
    expect(decoded).toEqual([100n, 200n]);
  });
});

describe("Abi.Constructor encoding/decoding", () => {
  const constructor = {
    type: "constructor",
    stateMutability: "nonpayable",
    inputs: [{ type: "uint256", name: "initialSupply" }],
  } as const satisfies Abi.Constructor;

  it("encodeParams encodes constructor data with bytecode", () => {
    const bytecode = new Uint8Array([0x60, 0x80, 0x60, 0x40]);
    const encoded = Abi.Constructor.encodeParams.call(constructor, bytecode, [1000n]);
    expect(encoded).toBeInstanceOf(Uint8Array);
    expect(encoded.length).toBe(36); // 4 bytes bytecode + 32 bytes param
    // Check bytecode prefix
    expect(Array.from(encoded.slice(0, 4))).toEqual([0x60, 0x80, 0x60, 0x40]);
  });

  it("decodeParams decodes constructor data", () => {
    const bytecode = new Uint8Array([0x60, 0x80, 0x60, 0x40]);
    const encoded = Abi.Constructor.encodeParams.call(constructor, bytecode, [1000n]);
    const decoded = Abi.Constructor.decodeParams.call(constructor, encoded, bytecode.length);
    expect(decoded).toEqual([1000n]);
  });
});

// ============================================================================
// Parameter encoding/decoding Tests
// ============================================================================

describe("Abi.Parameter encoding/decoding", () => {
  it("encode throws not implemented", () => {
    const param = { type: "uint256", name: "amount" } as const satisfies Abi.Parameter;
    expect(() => Abi.Parameter.encode.call(param, 100n)).toThrow(AbiEncodingError);
  });

  it("decode throws not implemented", () => {
    const param = { type: "uint256", name: "amount" } as const satisfies Abi.Parameter;
    expect(() => Abi.Parameter.decode.call(param, new Uint8Array())).toThrow(
      AbiDecodingError,
    );
  });
});

describe("Abi.encodeParameters", () => {
  it("encodes uint256", () => {
    const encoded = Abi.encodeParameters([{ type: "uint256", name: "amount" }], [100n] as any);
    expect(encoded).toBeInstanceOf(Uint8Array);
    expect(encoded.length).toBe(32);
    expect(encoded[31]).toBe(100);
  });

  it("encodes multiple parameters", () => {
    const encoded = Abi.encodeParameters(
      [{ type: "uint256" }, { type: "address" }, { type: "bool" }],
      [42n, "0x742d35cc6634c0532925a3b844bc9e7595f251e3" as Address, true] as any,
    );
    expect(encoded).toBeInstanceOf(Uint8Array);
    expect(encoded.length).toBe(96); // 3 * 32 bytes
  });
});

describe("Abi.decodeParameters", () => {
  it("decodes uint256", () => {
    const encoded = Abi.encodeParameters([{ type: "uint256" }], [100n] as any);
    const decoded = Abi.decodeParameters([{ type: "uint256", name: "amount" }], encoded);
    expect(decoded).toEqual([100n]);
  });

  it("decodes multiple parameters", () => {
    const params = [{ type: "uint256" }, { type: "address" }, { type: "bool" }];
    const values = [42n, "0x742d35cc6634c0532925a3b844bc9e7595f251e3" as Address, true];
    const encoded = Abi.encodeParameters(params, values as any);
    const decoded = Abi.decodeParameters(params, encoded);
    expect(decoded).toEqual(values);
  });
});

// ============================================================================
// Top-level ABI Operations
// ============================================================================

describe("Abi.getItem", () => {
  const abi = [
    {
      type: "function",
      name: "transfer",
      stateMutability: "nonpayable",
      inputs: [],
      outputs: [],
    },
    {
      type: "event",
      name: "Transfer",
      inputs: [],
    },
  ] as const satisfies Abi;

  it("finds function by name", () => {
    const func = Abi.getItem.call(abi, "transfer", "function");
    expect(func).toBeDefined();
    expect(func?.name).toBe("transfer");
  });

  it("finds event by name", () => {
    const event = Abi.getItem.call(abi, "Transfer", "event");
    expect(event).toBeDefined();
    expect(event?.name).toBe("Transfer");
  });

  it("returns undefined for missing item", () => {
    const missing = Abi.getItem.call(abi, "missing", "function");
    expect(missing).toBeUndefined();
  });
});

describe("Abi.encode", () => {
  const abi = [
    {
      type: "function",
      name: "transfer",
      stateMutability: "nonpayable",
      inputs: [
        { type: "address", name: "to" },
        { type: "uint256", name: "amount" },
      ],
      outputs: [],
    },
  ] as const satisfies Abi;

  it("encodes function call data", () => {
    const encoded = Abi.encode.call(abi, "transfer", [
      "0x742d35cc6634c0532925a3b844bc9e7595f251e3" as Address,
      100n,
    ]);
    expect(encoded).toBeInstanceOf(Uint8Array);
    expect(encoded.length).toBe(68); // 4 bytes selector + 64 bytes params
    // Check selector
    expect(Array.from(encoded.slice(0, 4))).toEqual([0xa9, 0x05, 0x9c, 0xbb]);
  });

  it("throws not found error for missing function", () => {
    expect(() =>
      Abi.encode.call(abi, "missing" as any, [] as any),
    ).toThrow(AbiItemNotFoundError);
  });
});

describe("Abi.decode", () => {
  const abi = [
    {
      type: "function",
      name: "balanceOf",
      stateMutability: "view",
      inputs: [],
      outputs: [{ type: "uint256", name: "" }],
    },
  ] as const satisfies Abi;

  it("decodes function result", () => {
    const encoded = Abi.encodeParameters([{ type: "uint256" }], [1000n] as any);
    const decoded = Abi.decode.call(abi, "balanceOf", encoded);
    expect(decoded).toEqual([1000n]);
  });

  it("throws not found error for missing function", () => {
    expect(() =>
      Abi.decode.call(abi, "missing" as any, new Uint8Array()),
    ).toThrow(AbiItemNotFoundError);
  });
});

describe("Abi.decodeData", () => {
  const abi = [
    {
      type: "function",
      name: "transfer",
      stateMutability: "nonpayable",
      inputs: [
        { type: "address", name: "to" },
        { type: "uint256", name: "amount" },
      ],
      outputs: [],
    },
  ] as const satisfies Abi;

  it("decodes calldata and identifies function", () => {
    const encoded = Abi.encode.call(abi, "transfer", [
      "0x742d35cc6634c0532925a3b844bc9e7595f251e3" as Address,
      100n,
    ]);
    const decoded = Abi.decodeData.call(abi, encoded);
    expect(decoded.functionName).toBe("transfer");
    expect(decoded.args).toEqual([
      "0x742d35cc6634c0532925a3b844bc9e7595f251e3",
      100n,
    ]);
  });
});

describe("Abi.parseLogs", () => {
  const abi = [
    {
      type: "event",
      name: "Transfer",
      inputs: [
        { type: "address", name: "from", indexed: true },
        { type: "address", name: "to", indexed: true },
        { type: "uint256", name: "value", indexed: false },
      ],
    },
  ] as const satisfies Abi;

  it("parses event logs", () => {
    const event = abi[0];
    const from = "0x742d35cc6634c0532925a3b844bc9e7595f251e3" as Address;
    const to = "0x0000000000000000000000000000000000000000" as Address;
    const value = 1000n;

    const topics = Abi.Event.encodeTopics.call(event, { from, to });
    const data = Abi.encodeParameters([{ type: "uint256" }], [value]);

    const logs = [{ topics: topics as any, data }];
    const parsed = Abi.parseLogs.call(abi, logs);

    expect(parsed.length).toBe(1);
    expect(parsed[0].eventName).toBe("Transfer");
    expect(parsed[0].args.from).toBe(from);
    expect(parsed[0].args.to).toBe(to);
    expect(parsed[0].args.value).toBe(value);
  });
});

// ============================================================================
// Type Inference Tests
// ============================================================================

describe("Abi Type Inference", () => {
  it("should infer basic function parameter types", () => {
    const transferFunc = {
      type: "function",
      name: "transfer",
      stateMutability: "nonpayable",
      inputs: [
        { type: "address", name: "to" },
        { type: "uint256", name: "amount" },
      ],
      outputs: [{ type: "bool", name: "" }],
    } as const satisfies AbiFunction;

    type InputTypes = Abi.ParametersToPrimitiveTypes<typeof transferFunc.inputs>;
    type OutputTypes = Abi.ParametersToPrimitiveTypes<typeof transferFunc.outputs>;

    expectTypeOf<InputTypes[0]>().toEqualTypeOf<Address>();
    expectTypeOf<InputTypes[1]>().toEqualTypeOf<bigint>();
    expectTypeOf<OutputTypes[0]>().toEqualTypeOf<boolean>();
  });

  it("should infer complex types with arrays", () => {
    const batchTransferFunc = {
      type: "function",
      name: "batchTransfer",
      stateMutability: "nonpayable",
      inputs: [
        { type: "address[]", name: "recipients" },
        { type: "uint256[]", name: "amounts" },
      ],
      outputs: [],
    } as const satisfies AbiFunction;

    type InputTypes = Abi.ParametersToPrimitiveTypes<typeof batchTransferFunc.inputs>;

    // abitype should infer arrays properly
    expectTypeOf<InputTypes[0]>().toMatchTypeOf<readonly Address[]>();
    expectTypeOf<InputTypes[1]>().toMatchTypeOf<readonly bigint[]>();
  });

  it("should infer tuple types", () => {
    const swapFunc = {
      type: "function",
      name: "swap",
      stateMutability: "nonpayable",
      inputs: [
        {
          type: "tuple",
          name: "params",
          components: [
            { type: "address", name: "tokenIn" },
            { type: "address", name: "tokenOut" },
            { type: "uint256", name: "amountIn" },
          ],
        },
      ],
      outputs: [{ type: "uint256", name: "amountOut" }],
    } as const satisfies AbiFunction;

    type InputTypes = Abi.ParametersToPrimitiveTypes<typeof swapFunc.inputs>;

    // Should infer as tuple with correct types
    expectTypeOf<InputTypes[0]>().toMatchTypeOf<{
      readonly tokenIn: Address;
      readonly tokenOut: Address;
      readonly amountIn: bigint;
    }>();
  });

  it("should infer event parameter types with indexed fields", () => {
    const transferEvent = {
      type: "event",
      name: "Transfer",
      inputs: [
        { type: "address", name: "from", indexed: true },
        { type: "address", name: "to", indexed: true },
        { type: "uint256", name: "value", indexed: false },
      ],
    } as const satisfies AbiEvent;

    type EventParams = Abi.ParametersToObject<typeof transferEvent.inputs>;

    expectTypeOf<EventParams["from"]>().toEqualTypeOf<Address>();
    expectTypeOf<EventParams["to"]>().toEqualTypeOf<Address>();
    expectTypeOf<EventParams["value"]>().toEqualTypeOf<bigint>();
  });

  it("should infer error parameter types", () => {
    const insufficientBalanceError = {
      type: "error",
      name: "InsufficientBalance",
      inputs: [
        { type: "uint256", name: "available" },
        { type: "uint256", name: "required" },
      ],
    } as const satisfies AbiError;

    type ErrorParams = Abi.ParametersToPrimitiveTypes<typeof insufficientBalanceError.inputs>;

    expectTypeOf<ErrorParams[0]>().toEqualTypeOf<bigint>();
    expectTypeOf<ErrorParams[1]>().toEqualTypeOf<bigint>();
  });

  it("should infer nested struct types", () => {
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
    } as const satisfies AbiFunction;

    type InputTypes = Abi.ParametersToPrimitiveTypes<typeof complexFunc.inputs>;

    // Should infer nested tuple structure
    expectTypeOf<InputTypes[0]>().toMatchTypeOf<{
      readonly maker: Address;
      readonly asset: {
        readonly token: Address;
        readonly amount: bigint;
      };
      readonly fees: readonly bigint[];
    }>();
  });

  it("should work with full ABI type inference", () => {
    const abi = [
      {
        type: "function",
        name: "balanceOf",
        stateMutability: "view",
        inputs: [{ type: "address", name: "account" }],
        outputs: [{ type: "uint256", name: "" }],
      },
      {
        type: "function",
        name: "transfer",
        stateMutability: "nonpayable",
        inputs: [
          { type: "address", name: "to" },
          { type: "uint256", name: "amount" },
        ],
        outputs: [{ type: "bool", name: "" }],
      },
    ] as const satisfies Abi;

    type FunctionNames = Abi.ExtractFunctionNames<typeof abi>;
    type BalanceOfFunc = Abi.GetFunction<typeof abi, "balanceOf">;
    type TransferFunc = Abi.GetFunction<typeof abi, "transfer">;

    expectTypeOf<FunctionNames>().toMatchTypeOf<"balanceOf" | "transfer">();
    expectTypeOf<BalanceOfFunc>().toMatchTypeOf<Abi.Function>();
    expectTypeOf<TransferFunc>().toMatchTypeOf<Abi.Function>();
  });
});
