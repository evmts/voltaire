/**
 * Get account diff for a specific address
 *
 * @param {import('./StateDiffType.js').StateDiffType} diff - State diff
 * @param {import('../Address/AddressType.js').AddressType} address - Address to look up
 * @returns {import('./StateDiffType.js').AccountDiff | undefined} Account diff or undefined
 *
 * @example
 * ```typescript
 * const accountDiff = StateDiff.getAccount(diff, address);
 * if (accountDiff?.balance) {
 *   console.log(`Balance: ${accountDiff.balance.from} -> ${accountDiff.balance.to}`);
 * }
 * ```
 */
export function getAccount(diff, address) {
    // Need to match by value since Uint8Array isn't reference-equal
    for (const [addr, accountDiff] of diff.accounts.entries()) {
        if (addr.length === address.length) {
            let equal = true;
            for (let i = 0; i < addr.length; i++) {
                if (addr[i] !== address[i]) {
                    equal = false;
                    break;
                }
            }
            if (equal)
                return accountDiff;
        }
    }
    return undefined;
}
