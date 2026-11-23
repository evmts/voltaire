import { InvalidRangeError } from "../errors/ValidationError.js";
import { NAME_TO_HARDFORK } from "../Hardfork/constants.js";
import { isAtLeast } from "../Hardfork/isAtLeast.js";

/**
 * Check whether a hardfork is at or after a target hardfork.
 *
 * Resolves name aliases (`paris`, `constantinoplefix`, `glamsterdam`) and
 * compares with `Hardfork.isAtLeast`, so every fork after the
 * target (including `prague`, `osaka` and `amsterdam`) inherits its rules.
 *
 * @param {import('./types.js').Hardfork} hardfork - Hardfork to test
 * @param {import('../Hardfork/HardforkType.js').HardforkType} target - Fork that introduced the rule
 * @returns {boolean} Whether `hardfork` is at or after `target`
 * @throws {InvalidRangeError} If `hardfork` is not a known hardfork name
 */
export function isHardforkAtLeast(hardfork, target) {
	const fork =
		typeof hardfork === "string" && Object.hasOwn(NAME_TO_HARDFORK, hardfork)
			? NAME_TO_HARDFORK[
					/** @type {keyof typeof NAME_TO_HARDFORK} */ (
						/** @type {string} */ (hardfork)
					)
				]
			: undefined;
	if (fork === undefined) {
		throw new InvalidRangeError(`Unknown hardfork: ${String(hardfork)}`, {
			value: hardfork,
			expected: "a known hardfork name",
			code: -32602,
			docsPath: "/primitives/gas-constants/hardfork-utilities",
		});
	}
	return isAtLeast(fork, target);
}
