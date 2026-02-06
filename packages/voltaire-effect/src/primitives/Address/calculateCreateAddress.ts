/**
 * @module calculateCreateAddress
 * @description Calculate CREATE contract deployment address with Effect
 * @since 0.1.0
 */
import { Effect } from "effect";
import { Address, type AddressType, type InvalidValueError } from "@tevm/voltaire/Address";

/**
 * Calculate CREATE contract deployment address
 *
 * Formula: keccak256(rlp([sender, nonce]))[12:32]
 *
 * @param address - Deployer address
 * @param nonce - Transaction nonce
 * @returns Effect yielding the contract address that would be created
 * @example
 * ```typescript
 * const program = Address.calculateCreateAddress(deployerAddr, 0n)
 * const contractAddr = await Effect.runPromise(program)
 * ```
 */
export const calculateCreateAddress = (
  address: AddressType,
  nonce: bigint,
): Effect.Effect<AddressType, InvalidValueError> =>
  Effect.try({
    try: () => Address.calculateCreateAddress(address, nonce),
    catch: (e) => e as InvalidValueError,
  });
