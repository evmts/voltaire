// @ts-nocheck
export * from "./BrandedMessage.js";

import { create } from "./create.js";
import { format } from "./format.js";
import { generateNonce } from "./generateNonce.js";
import { getMessageHash } from "./getMessageHash.js";
import { parse } from "./parse.js";
import { validate } from "./validate.js";
import { verify } from "./verify.js";
import { verifyMessage } from "./verifyMessage.js";

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

// Namespace export
export const BrandedSiwe = {
	create,
	format,
	generateNonce,
	getMessageHash,
	parse,
	validate,
	verify,
	verifyMessage,
};
