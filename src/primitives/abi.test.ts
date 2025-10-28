/**
 * Tests for ABI module with abitype integration
 */

import { describe, it, expect, expectTypeOf } from "vitest";
import {
  Abi,
  AbiEncodingError,
  AbiDecodingError,
  AbiParameterMismatchError,
  AbiItemNotFoundError,
  AbiInvalidSelectorError,
} from "./abi.js";
import type { Address } from "./address.js";

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
    } as const satisfies Abi.Function;

    expect(Abi.Function.getSignature.call(transferFunc)).toBe(
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
    } as const satisfies Abi.Function;

    expect(Abi.Function.getSignature.call(func)).toBe("example()");
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
    } as const satisfies Abi.Function;

    expect(Abi.Function.getSignature.call(func)).toBe("swap(tuple)");
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
    } as const satisfies Abi.Event;

    expect(Abi.Event.getSignature.call(event)).toBe(
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
    } as const satisfies Abi.Error;

    expect(Abi.Error.getSignature.call(error)).toBe(
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
    } as const satisfies Abi.Function;

    const selector = Abi.Function.getSelector.call(func);
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
    } as const satisfies Abi.Function;

    const selector = Abi.Function.getSelector.call(func);
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
    } as const satisfies Abi.Event;

    const selector = Abi.Event.getSelector.call(event);
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
    } as const satisfies Abi.Event;

    const selector = Abi.Event.getSelector.call(event);
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
    } as const satisfies Abi.Error;

    const selector = Abi.Error.getSelector.call(error);
    expect(selector).toBeInstanceOf(Uint8Array);
    expect(selector.length).toBe(4);
  });

  it("computes selector for error with no params", () => {
    const error = {
      type: "error",
      name: "InsufficientBalance",
      inputs: [],
    } as const satisfies Abi.Error;

    const selector = Abi.Error.getSelector.call(error);
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
    } as const satisfies Abi.Function;

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
    } as const satisfies Abi.Function;

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
    } as const satisfies Abi.Function;

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
    } as const satisfies Abi.Event;

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
    } as const satisfies Abi.Error;

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
    } as const satisfies Abi.Function;

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
    } as const satisfies Abi.Function;

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
    } as const satisfies Abi.Event;

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
  } as const satisfies Abi.Function;

  it("encodeParams throws not implemented", () => {
    expect(() =>
      Abi.Function.encodeParams.call(func, [
        "0x0000000000000000000000000000000000000000" as Address,
        100n,
      ]),
    ).toThrow(AbiEncodingError);
  });

  it("decodeParams throws not implemented", () => {
    expect(() => Abi.Function.decodeParams.call(func, new Uint8Array())).toThrow(
      AbiDecodingError,
    );
  });

  it("encodeResult throws not implemented", () => {
    expect(() => Abi.Function.encodeResult.call(func, [true])).toThrow(
      AbiEncodingError,
    );
  });

  it("decodeResult throws not implemented", () => {
    expect(() => Abi.Function.decodeResult.call(func, new Uint8Array())).toThrow(
      AbiDecodingError,
    );
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
  } as const satisfies Abi.Event;

  it("encodeTopics throws not implemented", () => {
    expect(() =>
      Abi.Event.encodeTopics.call(event, {
        from: "0x0000000000000000000000000000000000000000" as Address,
      }),
    ).toThrow(AbiEncodingError);
  });

  it("decodeLog throws not implemented", () => {
    expect(() =>
      Abi.Event.decodeLog.call(event, new Uint8Array(), []),
    ).toThrow(AbiDecodingError);
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
  } as const satisfies Abi.Error;

  it("encodeParams throws not implemented", () => {
    expect(() => Abi.Error.encodeParams.call(error, [100n, 200n])).toThrow(
      AbiEncodingError,
    );
  });

  it("decodeParams throws not implemented", () => {
    expect(() => Abi.Error.decodeParams.call(error, new Uint8Array())).toThrow(
      AbiDecodingError,
    );
  });
});

describe("Abi.Constructor encoding/decoding", () => {
  const constructor = {
    type: "constructor",
    stateMutability: "nonpayable",
    inputs: [{ type: "uint256", name: "initialSupply" }],
  } as const satisfies Abi.Constructor;

  it("encodeParams throws not implemented", () => {
    expect(() =>
      Abi.Constructor.encodeParams.call(constructor, new Uint8Array(), [1000n]),
    ).toThrow(AbiEncodingError);
  });

  it("decodeParams throws not implemented", () => {
    expect(() =>
      Abi.Constructor.decodeParams.call(constructor, new Uint8Array(), 0),
    ).toThrow(AbiDecodingError);
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
  it("throws not implemented", () => {
    expect(() =>
      Abi.encodeParameters([{ type: "uint256", name: "amount" }], [100n] as any),
    ).toThrow(AbiEncodingError);
  });
});

describe("Abi.decodeParameters", () => {
  it("throws not implemented", () => {
    expect(() =>
      Abi.decodeParameters([{ type: "uint256", name: "amount" }], new Uint8Array()),
    ).toThrow(AbiDecodingError);
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

  it("throws not implemented error", () => {
    expect(() =>
      Abi.encode.call(abi, "transfer", [
        "0x0000000000000000000000000000000000000000" as Address,
        100n,
      ]),
    ).toThrow(AbiEncodingError);
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

  it("throws not implemented error", () => {
    expect(() => Abi.decode.call(abi, "balanceOf", new Uint8Array())).toThrow(
      AbiDecodingError,
    );
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
      inputs: [],
      outputs: [],
    },
  ] as const satisfies Abi;

  it("throws not implemented", () => {
    expect(() => Abi.decodeData.call(abi, new Uint8Array())).toThrow(
      AbiDecodingError,
    );
  });
});

describe("Abi.parseLogs", () => {
  const abi = [
    {
      type: "event",
      name: "Transfer",
      inputs: [],
    },
  ] as const satisfies Abi;

  it("throws not implemented", () => {
    expect(() => Abi.parseLogs.call(abi, [])).toThrow(AbiDecodingError);
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
    } as const satisfies Abi.Function;

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
    } as const satisfies Abi.Function;

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
    } as const satisfies Abi.Function;

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
    } as const satisfies Abi.Event;

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
    } as const satisfies Abi.Error;

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
    } as const satisfies Abi.Function;

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
