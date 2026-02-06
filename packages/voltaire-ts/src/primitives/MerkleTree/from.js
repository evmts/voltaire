import { EmptyTreeError } from "./errors.js";

/**
 * Compute tree depth from leaf count
 * @param {number} leafCount
 * @returns {number}
 */
function computeDepth(leafCount) {
	if (leafCount <= 1) return 0;
	return Math.ceil(Math.log2(leafCount));
}

/**
 * Factory: Create MerkleTree from leaves
 * @param {Object} deps
 * @param {(data: Uint8Array) => Uint8Array} deps.keccak256
 * @returns {(leaves: import('../Hash/HashType.js').HashType[]) => import('./MerkleTreeType.js').MerkleTreeType}
 */
export function From({ keccak256 }) {
	/**
	 * Create MerkleTree from array of leaf hashes
	 * @param {import('../Hash/HashType.js').HashType[]} leaves
	 * @returns {import('./MerkleTreeType.js').MerkleTreeType}
	 */
	return function from(leaves) {
		if (leaves.length === 0) {
			throw new EmptyTreeError();
		}

		const depth = computeDepth(leaves.length);

		if (leaves.length === 1) {
			const leaf = /** @type {import('../Hash/HashType.js').HashType} */ (
				leaves[0]
			);
			return Object.freeze({
				root: leaf,
				leafCount: 1,
				depth: 0,
				leaves: Object.freeze([...leaves]),
			});
		}

		// Pad to next power of 2
		const targetLen = 2 ** depth;
		const paddedLeaves = [...leaves];
		const lastLeaf = /** @type {import('../Hash/HashType.js').HashType} */ (
			leaves[leaves.length - 1]
		);
		while (paddedLeaves.length < targetLen) {
			paddedLeaves.push(lastLeaf);
		}

		// Build tree bottom-up
		/** @type {Uint8Array[]} */
		let currentLevel = paddedLeaves;
		while (currentLevel.length > 1) {
			/** @type {Uint8Array[]} */
			const nextLevel = [];
			for (let i = 0; i < currentLevel.length; i += 2) {
				const left = /** @type {Uint8Array} */ (currentLevel[i]);
				const right = /** @type {Uint8Array} */ (currentLevel[i + 1]);
				const combined = new Uint8Array(64);
				combined.set(left, 0);
				combined.set(right, 32);
				nextLevel.push(keccak256(combined));
			}
			currentLevel = nextLevel;
		}

		const root = /** @type {import('../Hash/HashType.js').HashType} */ (
			currentLevel[0]
		);

		return Object.freeze({
			root,
			leafCount: leaves.length,
			depth,
			leaves: Object.freeze([...leaves]),
		});
	};
}
