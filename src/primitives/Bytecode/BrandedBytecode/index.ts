// @ts-nocheck
export * from "./constants.js";
export * from "./BrandedBytecode.js";

import { analyze } from "./analyze.js";
import { analyzeJumpDestinations } from "./analyzeJumpDestinations.js";
import {
	INVALID,
	JUMPDEST,
	PUSH1,
	PUSH32,
	RETURN,
	REVERT,
	STOP,
} from "./constants.js";
import { equals } from "./equals.js";
import { extractRuntime } from "./extractRuntime.js";
import { formatInstruction } from "./formatInstruction.js";
import { formatInstructions } from "./formatInstructions.js";
import { from } from "./from.js";
import { fromHex } from "./fromHex.js";
import { getPushSize } from "./getPushSize.js";
import { hasMetadata } from "./hasMetadata.js";
import { hash } from "./hash.js";
import { isPush } from "./isPush.js";
import { isTerminator } from "./isTerminator.js";
import { isValidJumpDest } from "./isValidJumpDest.js";
import { parseInstructions } from "./parseInstructions.js";
import { size } from "./size.js";
import { stripMetadata } from "./stripMetadata.js";
import { toHex } from "./toHex.js";
import { validate } from "./validate.js";

// Export individual functions
export {
	from,
	fromHex,
	analyze,
	analyzeJumpDestinations,
	equals,
	extractRuntime,
	formatInstruction,
	formatInstructions,
	getPushSize,
	hash,
	hasMetadata,
	isPush,
	isTerminator,
	isValidJumpDest,
	parseInstructions,
	size,
	stripMetadata,
	toHex,
	validate,
};

// Namespace export
export const BrandedBytecode = {
	from,
	fromHex,
	analyze,
	analyzeJumpDestinations,
	equals,
	extractRuntime,
	formatInstruction,
	formatInstructions,
	getPushSize,
	hash,
	hasMetadata,
	isPush,
	isTerminator,
	isValidJumpDest,
	parseInstructions,
	size,
	stripMetadata,
	toHex,
	validate,
	INVALID,
	JUMPDEST,
	PUSH1,
	PUSH32,
	RETURN,
	REVERT,
	STOP,
};
