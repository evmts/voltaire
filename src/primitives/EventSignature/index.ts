// @ts-nocheck
export * from "./EventSignatureType.js";

import { equals } from "./equals.js";
import { from } from "./from.js";
import { fromHex } from "./fromHex.js";
import { fromSignature } from "./fromSignature.js";
import { toHex } from "./toHex.js";

// Export individual functions
export { from, fromHex, fromSignature, toHex, equals };

// Namespace export
export const EventSignature = {
	from,
	fromHex,
	fromSignature,
	toHex,
	equals,
};
