/**
 * @module toVersionedHash
 * @description Create versioned hash from commitment
 * @since 0.1.0
 */
import { BrandedBlob as BlobNamespace } from "@tevm/voltaire";
import type { InvalidCommitmentSizeError } from "@tevm/voltaire/Blob";
import { Effect } from "effect";

type Commitment = BlobNamespace.Commitment;
type VersionedHash = BlobNamespace.VersionedHash;

/**
 * Create versioned hash from commitment.
 *
 * Formula: BLOB_COMMITMENT_VERSION_KZG (0x01) || sha256(commitment)[1:]
 *
 * @param commitment - 48-byte KZG commitment
 * @returns Effect yielding 32-byte versioned hash or failing with InvalidCommitmentSizeError
 * @example
 * ```typescript
 * import * as Blob from 'voltaire-effect/primitives/Blob'
 * import * as Effect from 'effect/Effect'
 *
 * const hash = await Effect.runPromise(Blob.toVersionedHash(commitment))
 * ```
 * @since 0.1.0
 */
export const toVersionedHash = (
	commitment: Commitment,
): Effect.Effect<VersionedHash, InvalidCommitmentSizeError> =>
	Effect.try({
		try: () => BlobNamespace.toVersionedHash(commitment),
		catch: (e) => e as InvalidCommitmentSizeError,
	});
