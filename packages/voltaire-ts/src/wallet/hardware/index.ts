export * from "./HardwareWallet.js";
// NOTE: Ledger and Trezor support temporarily disabled due to dependency issues
// export { LedgerWallet } from "./LedgerWallet.js";
// export { TrezorWallet } from "./TrezorWallet.js";

// import { LedgerWallet } from "./LedgerWallet.js";
// import { TrezorWallet } from "./TrezorWallet.js";

// /**
//  * Create a new Ledger hardware wallet instance
//  * @returns LedgerWallet instance
//  */
// export function createLedger() {
// 	return new LedgerWallet();
// }

// /**
//  * Create a new Trezor hardware wallet instance
//  * @param options - Configuration options
//  * @param options.manifest - App manifest for Trezor Connect
//  * @returns TrezorWallet instance
//  */
// export function createTrezor(options?: {
// 	manifest?: { email: string; appUrl: string };
// }) {
// 	return new TrezorWallet(options);
// }
