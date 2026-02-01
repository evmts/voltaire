/**
 * @module calculateCreate2Address
 * @description Calculate CREATE2 contract deployment address with Effect
 * @since 0.1.0
 */
import { Effect } from "effect";
import { Address, type AddressType } from "@tevm/voltaire/Address";
import type { HashType } from "@tevm/voltaire/Hash";

/**
 * Calculate CREATE2 contract deployment address
 *
 * Formula: keccak256(0xff ++ sender ++ salt ++ keccak256(initCode))[12:32]
 *
 * @param address - Deployer address
 * @param salt - 32-byte salt value
 * @param initCode - Contract initialization bytecode (Uint8Array)
 * @returns Effect yielding the contract address that would be created
 * @example
 * ```typescript
 * const program = Address.calculateCreate2Address(deployerAddr, salt, initCode)
 * const contractAddr = await Effect.runPromise(program)
 * ```
 */
export const calculateCreate2Address = (
  address: AddressType,
  salt: HashType,
  initCode: Uint8Array,
): Effect.Effect<AddressType, Error> =>
  Effect.try({
    try: () => Address.calculateCreate2Address(address, salt, initCode as Parameters<typeof Address.calculateCreate2Address>[2]),
    catch: (e) => e as Error,
  });
