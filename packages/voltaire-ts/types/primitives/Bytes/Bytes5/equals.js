/** @param {Uint8Array} a @param {Uint8Array} b */
export function equals(a, b) {
    for (let i = 0; i < 5; i++) {
        if (a[i] !== b[i])
            return false;
    }
    return true;
}
