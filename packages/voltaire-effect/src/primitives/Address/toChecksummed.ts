/**
 * @module toChecksummed
 * @description Convert Address to EIP-55 checksummed hex string (requires KeccakService)
 * @since 0.1.0
 */
import { Effect } from "effect";
import { Address, type AddressType } from "@tevm/voltaire/Address";
import { KeccakService } from "../../crypto/Keccak256/index.js";

/**
 * Convert Address to EIP-55 checksummed hex string
 *
 * Requires KeccakService to be provided.
 *
 * @param addr - Address to convert
 * @returns Effect yielding checksummed hex string
 * @example
 * ```typescript
 * import { KeccakLive } from 'voltaire-effect/crypto/Keccak256'
 *
 * const program = Address.toChecksummed(addr)
 * const checksummed = await Effect.runPromise(program.pipe(Effect.provide(KeccakLive)))
 * // "0x742d35Cc6634C0532925a3b844Bc9e7595f251e3"
 * ```
 */
export const toChecksummed = (
  addr: AddressType,
): Effect.Effect<string, never, KeccakService> =>
  Effect.gen(function* () {
    yield* KeccakService;
    return Address.toChecksummed(addr);
  });
