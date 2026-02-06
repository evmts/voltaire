/**
 * RevertReason - Decoded revert information from contract execution
 *
 * Union type representing different types of contract reverts:
 * - Error: Standard Error(string) revert
 * - Panic: Solidity 0.8+ panic codes
 * - Custom: Custom error with selector and encoded data
 * - Unknown: Unrecognized revert data
 */
export {};
