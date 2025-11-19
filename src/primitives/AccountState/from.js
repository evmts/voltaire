// @ts-nocheck

/**
 * @typedef {import('./AccountStateType.js').AccountStateType} AccountStateType
 * @typedef {import('./AccountStateType.js').AccountStateLike} AccountStateLike
 */

/**
 * Creates an AccountState from an object with the required fields.
 *
 * @param {AccountStateLike} state - Object containing nonce, balance, storageRoot, and codeHash
 * @returns {AccountStateType} - A validated AccountState
 *
 * @example
 * ```typescript
 * const state = AccountState.from({
 *   nonce: Nonce.from(5n),
 *   balance: Wei.from(1000000000000000000n), // 1 ETH
 *   storageRoot: StateRoot.from("0x56e8..."),
 *   codeHash: Hash.from("0xc5d2..."),
 * });
 * ```
 */
export function from(state) {
	if (!state || typeof state !== "object") {
		throw new TypeError(
			"AccountState must be an object with nonce, balance, storageRoot, and codeHash",
		);
	}

	const { nonce, balance, storageRoot, codeHash } = state;

	// Validate all required fields exist
	if (nonce === undefined) {
		throw new TypeError("AccountState.nonce is required");
	}
	if (balance === undefined) {
		throw new TypeError("AccountState.balance is required");
	}
	if (storageRoot === undefined) {
		throw new TypeError("AccountState.storageRoot is required");
	}
	if (codeHash === undefined) {
		throw new TypeError("AccountState.codeHash is required");
	}

	// Return immutable object
	return Object.freeze({
		nonce,
		balance,
		storageRoot,
		codeHash,
	});
}
