/**
 * @fileoverview Effect Schema for wallet_registerOnboarding JSON-RPC method.
 * @see EIP-6963 (wallet registration)
 * @module jsonrpc/schemas/wallet/registerOnboarding
 * @since 0.1.0
 */

import * as S from "effect/Schema";
import { JsonRpcIdSchema, JsonRpcVersionSchema } from "../common.js";

/**
 * wallet_registerOnboarding request params schema.
 * No parameters.
 */
export const RegisterOnboardingParams = S.Tuple();

/**
 * wallet_registerOnboarding result schema.
 * Returns true on success.
 */
export const RegisterOnboardingResult = S.Boolean;

/**
 * wallet_registerOnboarding request schema.
 */
export const RegisterOnboardingRequest = S.Struct({
	jsonrpc: JsonRpcVersionSchema,
	method: S.Literal("wallet_registerOnboarding"),
	params: S.optional(RegisterOnboardingParams),
	id: S.optional(JsonRpcIdSchema),
});

/**
 * wallet_registerOnboarding response schema.
 */
export const RegisterOnboardingResponse = S.Struct({
	jsonrpc: JsonRpcVersionSchema,
	id: JsonRpcIdSchema,
	result: RegisterOnboardingResult,
});

/** Type for RegisterOnboardingRequest */
export type RegisterOnboardingRequestType = S.Schema.Type<
	typeof RegisterOnboardingRequest
>;

/** Type for RegisterOnboardingResponse */
export type RegisterOnboardingResponseType = S.Schema.Type<
	typeof RegisterOnboardingResponse
>;
