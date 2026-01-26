/**
 * @module Auth
 * @description Authentication utilities for Voltaire Effect.
 * @since 0.1.0
 */

export type {
	CreateSiweMessageParams,
	ParseError,
	SiweFields,
	SiweMessage,
	VerifySiweMessageParams,
} from "./siwe.js";
export {
	createSiweMessage,
	parseSiweMessage,
	SiweMessageSchema,
	VerifyError,
	verifySiweMessage,
} from "./siwe.js";
