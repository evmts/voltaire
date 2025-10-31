/**
 * ABI Utility Functions
 *
 * Standalone utility functions for working with ABI items and signatures.
 */

import type { Item, Function, Event, Error } from "./types.js";
import { Hash } from "../hash.js";

/**
 * Get function selector from signature string
 *
 * @param signature - Function signature (e.g., "transfer(address,uint256)")
 * @returns 4-byte selector
 *
 * @example
 * ```typescript
 * const selector = getFunctionSelector("transfer(address,uint256)");
 * // Uint8Array([0xa9, 0x05, 0x9c, 0xbb])
 * ```
 */
export function getFunctionSelector(signature: string): Uint8Array {
  const hash = Hash.keccak256String(signature);
  return hash.slice(0, 4);
}

/**
 * Get event selector from signature string
 *
 * @param signature - Event signature (e.g., "Transfer(address,address,uint256)")
 * @returns 32-byte selector (topic0)
 *
 * @example
 * ```typescript
 * const selector = getEventSelector("Transfer(address,address,uint256)");
 * // 32-byte Hash
 * ```
 */
export function getEventSelector(signature: string): Hash {
  return Hash.keccak256String(signature);
}

/**
 * Get error selector from signature string
 *
 * @param signature - Error signature (e.g., "InsufficientBalance(uint256,uint256)")
 * @returns 4-byte selector
 *
 * @example
 * ```typescript
 * const selector = getErrorSelector("InsufficientBalance(uint256,uint256)");
 * // Uint8Array([...])
 * ```
 */
export function getErrorSelector(signature: string): Uint8Array {
  const hash = Hash.keccak256String(signature);
  return hash.slice(0, 4);
}

/**
 * Format ABI item to human-readable string
 *
 * @example "function transfer(address to, uint256 amount) returns (bool)"
 */
export function formatAbiItem(item: Item): string {
  if (!("name" in item)) {
    return item.type;
  }

  const inputs =
    "inputs" in item
      ? item.inputs.map((p) => `${p.type}${p.name ? ` ${p.name}` : ""}`).join(", ")
      : "";

  let result = `${item.type} ${item.name}(${inputs})`;

  if (item.type === "function" && item.outputs.length > 0) {
    const outputs = item.outputs.map((p) => p.type).join(", ");
    result += ` returns (${outputs})`;
  }

  if ("stateMutability" in item && item.stateMutability !== "nonpayable") {
    result += ` ${item.stateMutability}`;
  }

  return result;
}

/**
 * Format ABI item with argument values
 *
 * @example "transfer(0x742d...f251e, 1000000000000000000)"
 */
export function formatAbiItemWithArgs(item: Item, args: readonly unknown[]): string {
  if (!("name" in item) || !("inputs" in item)) {
    return formatAbiItem(item);
  }

  const formattedArgs = args
    .map((arg, i) => {
      void item.inputs[i];
      // TODO: Format based on type (addresses with checksum, bigints as strings, etc.)
      return String(arg);
    })
    .join(", ");

  return `${item.name}(${formattedArgs})`;
}

/**
 * Get ABI item by name and optionally type
 */
export function getItem<
  TAbi extends readonly Item[],
  TName extends string,
  TType extends Item["type"] | undefined = undefined,
>(
  abi: TAbi,
  name: TName,
  type?: TType,
): Extract<TAbi[number], { name: TName }> | undefined {
  return abi.find(
    (item) =>
      "name" in item &&
      item.name === name &&
      (type === undefined || item.type === type),
  ) as any;
}
