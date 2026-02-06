/**
 * @module getters
 * @description Opcode metadata getters (pure)
 * @since 0.1.0
 */
import { Opcode } from "@tevm/voltaire/Opcode";

/**
 * Get the category of an opcode
 */
export const getCategory = Opcode.getCategory;
export const _getCategory = getCategory;

/**
 * Get the description of an opcode
 */
export const getDescription = Opcode.getDescription;
export const _getDescription = getDescription;

/**
 * Get the base gas cost of an opcode
 */
export const getGasCost = Opcode.getGasCost;
export const _getGasCost = getGasCost;

/**
 * Get the name of an opcode
 */
export const getName = Opcode.getName;
export const _getName = getName;

/**
 * Get the push size for PUSH opcodes
 */
export const getPushSize = Opcode.getPushSize;
export const _getPushSize = getPushSize;

/**
 * Get the stack effect (inputs - outputs) of an opcode
 */
export const getStackEffect = Opcode.getStackEffect;
export const _getStackEffect = getStackEffect;

/**
 * Get the number of stack inputs for an opcode
 */
export const getStackInput = Opcode.getStackInput;
export const _getStackInput = getStackInput;

/**
 * Get the number of stack outputs for an opcode
 */
export const getStackOutput = Opcode.getStackOutput;
export const _getStackOutput = getStackOutput;
