/**
 * EIP-191 version byte constants
 */
/** Version 0x00: Data with validator */
export const VERSION_DATA_WITH_VALIDATOR = 0x00;
/** Version 0x01: Structured data (EIP-712) */
export const VERSION_STRUCTURED_DATA = 0x01;
/** Version 0x45: Personal message */
export const VERSION_PERSONAL_MESSAGE = 0x45;
/** EIP-191 prefix byte */
export const EIP191_PREFIX = 0x19;
/** Personal message prefix string */
export const PERSONAL_MESSAGE_PREFIX = "\x19Ethereum Signed Message:\n";
