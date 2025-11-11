// @ts-nocheck
export * from "./BrandedBytecode.js";

import { analyze } from "./analyze.js";
import { analyzeBlocks } from "./analyzeBlocks.js";
import { analyzeGas } from "./analyzeGas.js";
import { analyzeJumpDestinations } from "./analyzeJumpDestinations.js";
import { analyzeStack } from "./analyzeStack.js";
import { detectFusions } from "./detectFusions.js";
import { equals } from "./equals.js";
import { getNextPc as _getNextPc } from "./getNextPc.js";
import { getBlock } from "./getBlock.js";
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
import { prettyPrint } from "./prettyPrint.js";
import { scan } from "./scan.js";
import { size } from "./size.js";
import { stripMetadata } from "./stripMetadata.js";
import { toHex } from "./toHex.js";
import { toAbi } from "./toAbi.js";
import { validate } from "./validate.js";

// Export individual functions
export {
	from,
	fromHex,
	analyze,
	analyzeBlocks,
	analyzeGas,
	analyzeJumpDestinations,
	analyzeStack,
	detectFusions,
	equals,
	extractRuntime,
	formatInstruction,
	formatInstructions,
	getBlock,
	getPushSize,
	hash,
	hasMetadata,
	isPush,
	isTerminator,
	isValidJumpDest,
	parseInstructions,
	prettyPrint,
	scan,
	size,
	stripMetadata,
	toHex,
	toAbi,
	validate,
	_getNextPc,
};

// Namespace export
export const BrandedBytecode = {
	from,
	fromHex,
	analyze,
	analyzeBlocks,
	analyzeGas,
	analyzeJumpDestinations,
	analyzeStack,
	detectFusions,
	equals,
	extractRuntime,
	formatInstruction,
	formatInstructions,
	getBlock,
	getPushSize,
	hash,
	hasMetadata,
	isPush,
	isTerminator,
	isValidJumpDest,
	parseInstructions,
	prettyPrint,
	scan,
	toAbi,
	size,
	stripMetadata,
	toHex,
	validate,
	_getNextPc,
};
