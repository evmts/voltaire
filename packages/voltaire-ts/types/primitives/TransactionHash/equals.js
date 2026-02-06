/**
 * Check if two TransactionHashes are equal
 *
 * @param {import('./TransactionHashType.js').TransactionHashType} a
 * @param {import('./TransactionHashType.js').TransactionHashType} b
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
