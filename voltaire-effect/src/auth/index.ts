/**
 * @module Auth
 * @description Authentication utilities for Voltaire Effect.
 * @since 0.1.0
 */

export {
	createSiweMessage,
	parseSiweMessage,
	verifySiweMessage,
	SiweMessageSchema,
	VerifyError,
} from "./siwe.js";
export type {
	CreateSiweMessageParams,
	ParseError,
	SiweFields,
	SiweMessage,
	VerifySiweMessageParams,
} from "./siwe.js";
