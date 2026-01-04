/**
 * Error thrown when proof length doesn't match expected tree depth
 */
export class InvalidProofLengthError extends Error {
	/**
	 * @param {number} expected - Expected proof length (tree depth)
	 * @param {number} actual - Actual proof length
	 */
	constructor(expected, actual) {
		super(
			`Invalid proof length: expected ${expected} (tree depth), got ${actual}`,
		);
		this.name = "InvalidProofLengthError";
		this.expected = expected;
		this.actual = actual;
	}
}

/**
 * Error thrown when tree has no leaves
 */
export class EmptyTreeError extends Error {
	constructor() {
		super("Cannot create MerkleTree with no leaves");
		this.name = "EmptyTreeError";
	}
}

/**
 * Error thrown when leaf index is out of bounds
 */
export class LeafIndexOutOfBoundsError extends Error {
	/**
	 * @param {number} index - Requested index
	 * @param {number} leafCount - Number of leaves in tree
	 */
	constructor(index, leafCount) {
		super(`Leaf index ${index} out of bounds for tree with ${leafCount} leaves`);
		this.name = "LeafIndexOutOfBoundsError";
		this.index = index;
		this.leafCount = leafCount;
	}
}
