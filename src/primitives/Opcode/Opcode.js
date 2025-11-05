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
import { info } from "./BrandedOpcode/info.js";
import { isDup } from "./BrandedOpcode/isDup.js";
import { isJump } from "./BrandedOpcode/isJump.js";
import { isLog } from "./BrandedOpcode/isLog.js";
import { isPush } from "./BrandedOpcode/isPush.js";
import { isSwap } from "./BrandedOpcode/isSwap.js";
import { isTerminating } from "./BrandedOpcode/isTerminating.js";
import { isValid } from "./BrandedOpcode/isValid.js";
import { isValidJumpDest } from "./BrandedOpcode/isValidJumpDest.js";
import { jumpDests } from "./BrandedOpcode/jumpDests.js";
import { logTopics } from "./BrandedOpcode/logTopics.js";
import { name } from "./BrandedOpcode/name.js";
import { parse } from "./BrandedOpcode/parse.js";
import { pushBytes } from "./BrandedOpcode/pushBytes.js";
import { pushOpcode } from "./BrandedOpcode/pushOpcode.js";
import { swapPosition } from "./BrandedOpcode/swapPosition.js";

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
Object.defineProperty(Opcode, "name", {
	value: name,
	writable: true,
	enumerable: true,
	configurable: true,
});
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
