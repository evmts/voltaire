/**
 * Field bitmap positions (ERC-5267 spec)
 *
 * Each bit indicates presence of corresponding field:
 * - 0x01: name
 * - 0x02: version
 * - 0x04: chainId
 * - 0x08: verifyingContract
 * - 0x10: salt
 * - 0x20: extensions (reserved for future use)
 */
export const ERC5267_FIELDS = {
    NAME: 0x01,
    VERSION: 0x02,
    CHAIN_ID: 0x04,
    VERIFYING_CONTRACT: 0x08,
    SALT: 0x10,
    EXTENSIONS: 0x20,
};
