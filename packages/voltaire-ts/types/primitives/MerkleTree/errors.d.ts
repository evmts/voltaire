/**
 * Error thrown when proof length doesn't match expected tree depth
 */
export class InvalidProofLengthError extends Error {
    /**
     * @param {number} expected - Expected proof length (tree depth)
     * @param {number} actual - Actual proof length
     */
    constructor(expected: number, actual: number);
    expected: number;
    actual: number;
}
/**
 * Error thrown when tree has no leaves
 */
export class EmptyTreeError extends Error {
    constructor();
}
/**
 * Error thrown when leaf index is out of bounds
 */
export class LeafIndexOutOfBoundsError extends Error {
    /**
     * @param {number} index - Requested index
     * @param {number} leafCount - Number of leaves in tree
     */
    constructor(index: number, leafCount: number);
    index: number;
    leafCount: number;
}
//# sourceMappingURL=errors.d.ts.map