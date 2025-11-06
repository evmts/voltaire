// @ts-nocheck

// Export constants
export * from "./BrandedOpcode/constants.js";

/**
 * @typedef {import('./BrandedOpcode/BrandedOpcode.js').BrandedOpcode} BrandedOpcode
 * @typedef {import('./BrandedOpcode/BrandedOpcode.js').Instruction} Instruction
 * @typedef {import('./BrandedOpcode/BrandedOpcode.js').Info} Info
 */

import * as constants from "./BrandedOpcode/constants.js";
// Import methods
import { disassemble } from "./BrandedOpcode/disassemble.js";
import { dupPosition } from "./BrandedOpcode/dupPosition.js";
import { format } from "./BrandedOpcode/format.js";
import { getCategory } from "./BrandedOpcode/getCategory.js";
import { getDescription } from "./BrandedOpcode/getDescription.js";
import { getGasCost } from "./BrandedOpcode/getGasCost.js";
import { getName } from "./BrandedOpcode/getName.js";
import { getPushSize } from "./BrandedOpcode/getPushSize.js";
import { getStackEffect } from "./BrandedOpcode/getStackEffect.js";
import { getStackInput } from "./BrandedOpcode/getStackInput.js";
import { getStackOutput } from "./BrandedOpcode/getStackOutput.js";
import { info } from "./BrandedOpcode/info.js";
import { isDup } from "./BrandedOpcode/isDup.js";
import { isJump } from "./BrandedOpcode/isJump.js";
import { isJumpDestination } from "./BrandedOpcode/isJumpDestination.js";
import { isLog } from "./BrandedOpcode/isLog.js";
import { isPush } from "./BrandedOpcode/isPush.js";
import { isSwap } from "./BrandedOpcode/isSwap.js";
import { isTerminating } from "./BrandedOpcode/isTerminating.js";
import { isTerminator } from "./BrandedOpcode/isTerminator.js";
import { isValid } from "./BrandedOpcode/isValid.js";
import { isValidJumpDest } from "./BrandedOpcode/isValidJumpDest.js";
import { isValidOpcode } from "./BrandedOpcode/isValidOpcode.js";
import { jumpDests } from "./BrandedOpcode/jumpDests.js";
import { logTopics } from "./BrandedOpcode/logTopics.js";
import { name } from "./BrandedOpcode/name.js";
import { parse } from "./BrandedOpcode/parse.js";
import { pushBytes } from "./BrandedOpcode/pushBytes.js";
import { pushOpcode } from "./BrandedOpcode/pushOpcode.js";
import { swapPosition } from "./BrandedOpcode/swapPosition.js";

// Export individual functions
export {
	disassemble,
	dupPosition,
	format,
	getCategory,
	getDescription,
	getGasCost,
	getName,
	getPushSize,
	getStackEffect,
	getStackInput,
	getStackOutput,
	info,
	isDup,
	isJump,
	isJumpDestination,
	isLog,
	isPush,
	isSwap,
	isTerminating,
	isTerminator,
	isValid,
	isValidJumpDest,
	isValidOpcode,
	jumpDests,
	logTopics,
	name,
	parse,
	pushBytes,
	pushOpcode,
	swapPosition,
};

/**
 * Identity function for type branding
 *
 * @param {number} value - Opcode byte value
 * @returns {BrandedOpcode} Branded opcode
 */
function Opcode(value) {
	return /** @type {BrandedOpcode} */ (value);
}

// Attach all methods to namespace
Opcode.disassemble = disassemble;
Opcode.dupPosition = dupPosition;
Opcode.format = format;
Opcode.getCategory = getCategory;
Opcode.getDescription = getDescription;
Opcode.getGasCost = getGasCost;
Opcode.getName = getName;
Opcode.getPushSize = getPushSize;
Opcode.getStackEffect = getStackEffect;
Opcode.getStackInput = getStackInput;
Opcode.getStackOutput = getStackOutput;
Opcode.info = info;
Opcode.isDup = isDup;
Opcode.isJump = isJump;
Opcode.isJumpDestination = isJumpDestination;
Opcode.isLog = isLog;
Opcode.isPush = isPush;
Opcode.isSwap = isSwap;
Opcode.isTerminating = isTerminating;
Opcode.isTerminator = isTerminator;
Opcode.isValid = isValid;
Opcode.isValidJumpDest = isValidJumpDest;
Opcode.isValidOpcode = isValidOpcode;
Opcode.jumpDests = jumpDests;
Opcode.logTopics = logTopics;
Object.defineProperty(Opcode, "name", {
	value: name,
	writable: true,
	enumerable: true,
	configurable: true,
});
Opcode.parse = parse;
Opcode.pushBytes = pushBytes;
Opcode.pushOpcode = pushOpcode;
Opcode.swapPosition = swapPosition;

// Attach constants
Object.assign(Opcode, constants);

export { Opcode };
