/**
 * @param {import('./Bytes3Type.js').Bytes3Type} a
 * @param {import('./Bytes3Type.js').Bytes3Type} b
 * @returns {boolean}
 */
export function equals(a, b) {
    for (let i = 0; i < 3; i++) {
        if (a[i] !== b[i])
            return false;
    }
    return true;
}
