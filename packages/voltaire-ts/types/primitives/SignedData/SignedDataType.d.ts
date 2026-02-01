/**
 * EIP-191 signed data type
 *
 * Represents signed data according to EIP-191 specification.
 * The version byte determines the signature format:
 * - 0x00: Data with validator address
 * - 0x01: Structured data (EIP-712)
 * - 0x45: Personal message ("E" for Ethereum Signed Message)
 *
 * @see https://eips.ethereum.org/EIPS/eip-191
 */
export type SignedDataType = Uint8Array & {
    readonly __tag: "SignedData";
};
/**
 * EIP-191 version byte
 *
 * Determines the format and validation rules for signed data:
 * - 0x00: Data with intended validator (contract address)
 * - 0x01: Structured data following EIP-712
 * - 0x45: Personal message with "\x19Ethereum Signed Message:\n" prefix
 */
export type SignedDataVersion = 0x00 | 0x01 | 0x45;
//# sourceMappingURL=SignedDataType.d.ts.map