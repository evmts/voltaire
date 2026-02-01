import { InvalidLengthError } from "../errors/index.js";
/**
 * Assert hex has specific size
 *
 * @see https://voltaire.tevm.sh/primitives/hex for Hex documentation
 * @since 0.0.0
 * @param hex - Hex string to check
 * @param targetSize - Expected byte size
 * @returns Sized hex string
 * @throws {InvalidLengthError} If size doesn't match
 * @example
 * ```typescript
 * import * as Hex from './primitives/Hex/index.js';
 * const hex = Hex.from('0x1234');
 * const sized = Hex.assertSize(hex, 2); // Sized<2>
 * ```
 */
export function assertSize(hex, targetSize) {
    const actualSize = (hex.length - 2) / 2;
    if (actualSize !== targetSize) {
        throw new InvalidLengthError(`Expected ${targetSize} bytes, got ${actualSize}`, {
            code: -32602,
            value: hex,
            expected: `${targetSize} bytes`,
            context: { actualSize, targetSize },
            docsPath: "/primitives/hex#error-handling",
        });
    }
    return hex;
}
