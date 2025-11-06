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

// Export internal functions (tree-shakeable)
export {
	create as _create,
	format as _format,
	generateNonce as _generateNonce,
	getMessageHash as _getMessageHash,
	parse as _parse,
	validate as _validate,
	verify as _verify,
	verifyMessage as _verifyMessage,
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
