// @ts-nocheck
// Export constants
export * from "./constants.js";
/**
 * @typedef {import('./OpcodeType.js').OpcodeType} BrandedOpcode
 * @typedef {import('./OpcodeType.js').Instruction} Instruction
 * @typedef {import('./OpcodeType.js').Info} Info
 */
import * as constants from "./constants.js";
// Import methods
import { disassemble } from "./disassemble.js";
import { dupPosition } from "./dupPosition.js";
import { format } from "./format.js";
import { getCategory } from "./getCategory.js";
import { getDescription } from "./getDescription.js";
import { getGasCost } from "./getGasCost.js";
import { getName } from "./getName.js";
import { getPushSize } from "./getPushSize.js";
import { getStackEffect } from "./getStackEffect.js";
import { getStackInput } from "./getStackInput.js";
import { getStackOutput } from "./getStackOutput.js";
import { info } from "./info.js";
import { isDup } from "./isDup.js";
import { isJump } from "./isJump.js";
import { isJumpDestination } from "./isJumpDestination.js";
import { isLog } from "./isLog.js";
import { isPush } from "./isPush.js";
import { isSwap } from "./isSwap.js";
import { isTerminating } from "./isTerminating.js";
import { isTerminator } from "./isTerminator.js";
import { isValid } from "./isValid.js";
import { isValidJumpDest } from "./isValidJumpDest.js";
import { isValidOpcode } from "./isValidOpcode.js";
import { jumpDests } from "./jumpDests.js";
import { logTopics } from "./logTopics.js";
import { name } from "./name.js";
import { parse } from "./parse.js";
import { pushBytes } from "./pushBytes.js";
import { pushOpcode } from "./pushOpcode.js";
import { swapPosition } from "./swapPosition.js";
// Export individual functions (public API)
export { disassemble, dupPosition, format, getCategory, getDescription, getGasCost, getName, getPushSize, getStackEffect, getStackInput, getStackOutput, info, isDup, isJump, isJumpDestination, isLog, isPush, isSwap, isTerminating, isTerminator, isValid, isValidJumpDest, isValidOpcode, jumpDests, logTopics, name, parse, pushBytes, pushOpcode, swapPosition, };
// Export internal functions (tree-shakeable, _-prefixed)
export { disassemble as _disassemble, dupPosition as _dupPosition, format as _format, getCategory as _getCategory, getDescription as _getDescription, getGasCost as _getGasCost, getName as _getName, getPushSize as _getPushSize, getStackEffect as _getStackEffect, getStackInput as _getStackInput, getStackOutput as _getStackOutput, info as _info, isDup as _isDup, isJump as _isJump, isJumpDestination as _isJumpDestination, isLog as _isLog, isPush as _isPush, isSwap as _isSwap, isTerminating as _isTerminating, isTerminator as _isTerminator, isValid as _isValid, isValidJumpDest as _isValidJumpDest, isValidOpcode as _isValidOpcode, jumpDests as _jumpDests, logTopics as _logTopics, name as _name, parse as _parse, pushBytes as _pushBytes, pushOpcode as _pushOpcode, swapPosition as _swapPosition, };
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
// Namespace export (branded namespace)
export const BrandedOpcode = {
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
    ...constants,
};
export { Opcode };
