/**
 * Type tests for ABI module with abitype integration
 */

import { describe, it, expectTypeOf } from "vitest";
import type { Abi } from "./abi.js";
import type { Address } from "./address.js";

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
