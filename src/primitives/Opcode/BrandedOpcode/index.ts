// Re-export branded type
export type { BrandedOpcode, Instruction, Info } from "./BrandedOpcode.js";

// Export constants
export * from "./constants.js";

// Import all functions
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

// Export internal functions (tree-shakeable)
export {
	disassemble as _disassemble,
	dupPosition as _dupPosition,
	format as _format,
	info as _info,
	isDup as _isDup,
	isJump as _isJump,
	isLog as _isLog,
	isPush as _isPush,
	isSwap as _isSwap,
	isTerminating as _isTerminating,
	isValid as _isValid,
	isValidJumpDest as _isValidJumpDest,
	jumpDests as _jumpDests,
	logTopics as _logTopics,
	name as _name,
	parse as _parse,
	pushBytes as _pushBytes,
	pushOpcode as _pushOpcode,
	swapPosition as _swapPosition,
};

// Namespace export
export const BrandedOpcode = {
	disassemble,
	dupPosition,
	format,
	info,
	isDup,
	isJump,
	isLog,
	isPush,
	isSwap,
	isTerminating,
	isValid,
	isValidJumpDest,
	jumpDests,
	logTopics,
	name,
	parse,
	pushBytes,
	pushOpcode,
	swapPosition,
};
