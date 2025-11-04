// @ts-nocheck
import { create } from "./create.js";
import { format } from "./format.js";
import { generateNonce } from "./generateNonce.js";
import { getMessageHash } from "./getMessageHash.js";
import { parse } from "./parse.js";
import { validate } from "./validate.js";
import { verify } from "./verify.js";
import { verifyMessage } from "./verifyMessage.js";

export * from "./BrandedMessage.js";

// Export individual functions
export {
	create,
	format,
	generateNonce,
	getMessageHash,
	parse,
	validate,
	verify,
	verifyMessage,
};

/**
 * @typedef {import('./BrandedMessage.js').BrandedMessage} BrandedMessage
 */

/**
 * Factory function for creating SIWE Message instances
 *
 * @param {Object} params - Message parameters
 * @returns {BrandedMessage} SIWE message
 */
export function Siwe(params) {
	return create(params);
}

Siwe.create = create;
Siwe.format = format;
Siwe.generateNonce = generateNonce;
Siwe.getMessageHash = getMessageHash;
Siwe.parse = parse;
Siwe.validate = validate;
Siwe.verify = verify;
Siwe.verifyMessage = verifyMessage;
