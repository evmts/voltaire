/**
 * Check if two ForkIds are compatible (EIP-2124 fork validation)
 *
 * Compatible if:
 * 1. Hashes match and next blocks match (identical)
 * 2. Hashes match and remote next is 0 (remote knows of no future forks)
 * 3. Hashes match and local next is 0 (local knows of no future forks)
 * 4. Hashes differ but remote next is >= local next (remote is ahead but compatible)
 *
 * @param {import('./ForkIdType.js').ForkIdType} local - Local ForkId
 * @param {import('./ForkIdType.js').ForkIdType} remote - Remote peer's ForkId
 * @returns {boolean} True if compatible
 *
 * @example
 * ```typescript
 * const compatible = ForkId.matches(localForkId, peerForkId);
 * if (!compatible) {
 *   console.log("Fork incompatible - disconnect peer");
 * }
 * ```
 */
export function matches(local, remote) {
	// Compare hash bytes
	const localHash = local.hash;
	const remoteHash = remote.hash;

	let hashesMatch = true;
	if (localHash.length !== remoteHash.length) {
		hashesMatch = false;
	} else {
		for (let i = 0; i < localHash.length; i++) {
			if (localHash[i] !== remoteHash[i]) {
				hashesMatch = false;
				break;
			}
		}
	}

	// Case 1: Hashes match
	if (hashesMatch) {
		// Identical fork IDs
		if (local.next === remote.next) {
			return true;
		}

		// Remote knows of no future forks
		if (remote.next === 0n) {
			return true;
		}

		// Local knows of no future forks
		if (local.next === 0n) {
			return true;
		}

		// Both know of future forks but they differ - incompatible
		return false;
	}

	// Case 2: Hashes differ
	// Remote is on a future fork that we know about
	if (remote.next >= local.next && local.next !== 0n) {
		return true;
	}

	// Incompatible forks
	return false;
}
