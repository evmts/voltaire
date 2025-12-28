import { Opcode } from "voltaire";
// ADD (0x01) - Addition
const addInfo = Opcode.info(Opcode.ADD);

// SUB (0x03) - Subtraction
const subInfo = Opcode.info(Opcode.SUB);

// MUL (0x02) - Multiplication
const mulInfo = Opcode.info(Opcode.MUL);

// DIV (0x04) - Division
const divInfo = Opcode.info(Opcode.DIV);

// MOD (0x06) - Modulo
const modInfo = Opcode.info(Opcode.MOD);

// EXP (0x0a) - Exponentiation
const expInfo = Opcode.info(Opcode.EXP);

// ADDMOD (0x08) - Modular addition
const addmodInfo = Opcode.info(Opcode.ADDMOD);

// MULMOD (0x09) - Modular multiplication
const mulmodInfo = Opcode.info(Opcode.MULMOD);

// SIGNEXTEND (0x0b) - Sign extension
const signextendInfo = Opcode.info(Opcode.SIGNEXTEND);

// SDIV (0x05) - Signed division
const sdivInfo = Opcode.info(Opcode.SDIV);

// SMOD (0x07) - Signed modulo
const smodInfo = Opcode.info(Opcode.SMOD);
