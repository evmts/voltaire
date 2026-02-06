/**
 * Check if two BlockHashes are equal
 *
 * @param {import('./BlockHashType.js').BlockHashType} a
 * @param {import('./BlockHashType.js').BlockHashType} b
 * @returns {boolean}
 */
export function equals(a, b) {
    if (a.length !== b.length)
        return false;
    for (let i = 0; i < a.length; i++) {
        if (a[i] !== b[i])
            return false;
    }
    return true;
}
