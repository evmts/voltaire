/**
 * DecodedData - Generic decoded structure from ABI-encoded data
 *
 * Represents decoded values with their corresponding ABI types.
 * Useful for working with ABI-encoded data in a type-safe manner.
 *
 * @template T - The type of the decoded values
 */
export type DecodedDataType<T = unknown> = {
    readonly values: T;
    readonly types: readonly string[];
};
//# sourceMappingURL=DecodedDataType.d.ts.map