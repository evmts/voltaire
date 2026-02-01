/**
 * Get EIP712Domain type definition based on domain fields present
 *
 * @param {import('./DomainType.js').DomainType} domain - Domain
 * @returns {Array<{name: string, type: string}>} Type definition
 */
export function getEIP712DomainType(domain) {
    /** @type {Array<{name: string, type: string}>} */
    const fields = [];
    if (domain.name !== undefined) {
        fields.push({ name: "name", type: "string" });
    }
    if (domain.version !== undefined) {
        fields.push({ name: "version", type: "string" });
    }
    if (domain.chainId !== undefined) {
        fields.push({ name: "chainId", type: "uint256" });
    }
    if (domain.verifyingContract !== undefined) {
        fields.push({ name: "verifyingContract", type: "address" });
    }
    if (domain.salt !== undefined) {
        fields.push({ name: "salt", type: "bytes32" });
    }
    return fields;
}
