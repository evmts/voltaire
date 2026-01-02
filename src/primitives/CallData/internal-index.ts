export type { CallDataType } from "./CallDataType.js";
export * from "./constants.js";
export * from "./errors.js";

import { MIN_SIZE, SELECTOR_SIZE } from "./constants.js";
import { decode } from "./decode.js";
import { encode } from "./encode.js";
import { equals } from "./equals.js";
import { from } from "./from.js";
import { fromBytes } from "./fromBytes.js";
import { fromHex } from "./fromHex.js";
import { getSelector } from "./getSelector.js";
import { hasSelector } from "./hasSelector.js";
import { is } from "./is.js";
import { isValid } from "./isValid.js";
import { toBytes } from "./toBytes.js";
import { toHex } from "./toHex.js";

// Export individual functions
export {
	from,
	fromBytes,
	fromHex,
	toHex,
	toBytes,
	getSelector,
	hasSelector,
	equals,
	is,
	isValid,
	encode,
	decode,
	MIN_SIZE,
	SELECTOR_SIZE,
};

// Namespace export
export const BrandedCallData = {
	from,
	fromBytes,
	fromHex,
	toHex,
	toBytes,
	getSelector,
	hasSelector,
	equals,
	is,
	isValid,
	encode,
	decode,
	MIN_SIZE,
	SELECTOR_SIZE,
};
