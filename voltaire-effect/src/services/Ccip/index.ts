/**
 * @fileoverview CCIP (Cross-Chain Interoperability Protocol) module exports.
 *
 * @module Ccip
 * @since 0.0.1
 *
 * @description
 * EIP-3668 offchain lookup support for voltaire-effect.
 *
 * @see https://eips.ethereum.org/EIPS/eip-3668
 */

export {
	CcipError,
	CcipService,
	type CcipRequest,
	type CcipShape,
} from "./CcipService.js";
export { DefaultCcip } from "./DefaultCcip.js";
export { NoopCcip } from "./NoopCcip.js";
