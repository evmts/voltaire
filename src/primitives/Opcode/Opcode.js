// @ts-nocheck

// Export constants
export * from "./constants.js";

/**
 * @typedef {import('./BrandedOpcode.js').BrandedOpcode} BrandedOpcode
 * @typedef {import('./BrandedOpcode.js').Instruction} Instruction
 * @typedef {import('./BrandedOpcode.js').Info} Info
 */

// Import methods
import { disassemble } from "./disassemble.js";
import { dupPosition } from "./dupPosition.js";
import { format } from "./format.js";
import { info } from "./info.js";
import { isDup } from "./isDup.js";
import { isJump } from "./isJump.js";
import { isLog } from "./isLog.js";
import { isPush } from "./isPush.js";
import { isSwap } from "./isSwap.js";
import { isTerminating } from "./isTerminating.js";
import { isValid } from "./isValid.js";
import { isValidJumpDest } from "./isValidJumpDest.js";
import { jumpDests } from "./jumpDests.js";
import { logTopics } from "./logTopics.js";
import { name } from "./name.js";
import { parse } from "./parse.js";
import { pushBytes } from "./pushBytes.js";
import { pushOpcode } from "./pushOpcode.js";
import { swapPosition } from "./swapPosition.js";
import * as constants from "./constants.js";

// Export individual functions
export {
	info,
	name,
	isValid,
	isPush,
	isDup,
	isSwap,
	isLog,
	isTerminating,
	isJump,
	pushBytes,
	pushOpcode,
	dupPosition,
	swapPosition,
	logTopics,
	parse,
	format,
	disassemble,
	jumpDests,
	isValidJumpDest,
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
Opcode.info = info;
Object.defineProperty(Opcode, 'name', { value: name, writable: true, enumerable: true, configurable: true });
Opcode.isValid = isValid;
Opcode.isPush = isPush;
Opcode.isDup = isDup;
Opcode.isSwap = isSwap;
Opcode.isLog = isLog;
Opcode.isTerminating = isTerminating;
Opcode.isJump = isJump;
Opcode.pushBytes = pushBytes;
Opcode.pushOpcode = pushOpcode;
Opcode.dupPosition = dupPosition;
Opcode.swapPosition = swapPosition;
Opcode.logTopics = logTopics;
Opcode.parse = parse;
Opcode.format = format;
Opcode.disassemble = disassemble;
Opcode.jumpDests = jumpDests;
Opcode.isValidJumpDest = isValidJumpDest;

// Attach constants
Object.assign(Opcode, constants);

export { Opcode };
