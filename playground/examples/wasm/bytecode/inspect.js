// WASM: Bytecode helpers
import { analyzeJumpDestinations, isBytecodeBoundary, isValidJumpDest, validateBytecode, bytesToHex } from "voltaire/wasm";

(() => {
  // Simple bytecode: PUSH1 0x01 PUSH1 0x02 ADD STOP
  const code = new Uint8Array([0x60, 0x01, 0x60, 0x02, 0x01, 0x00]);

  // Validate
  try {
    validateBytecode(code);
    console.log("Bytecode valid");
  } catch (e) {
    console.log("Bytecode invalid:", e);
  }

  // Analyze JUMPDESTs
  const jumpdests = analyzeJumpDestinations(code);
  console.log("Jumpdests bitset:", bytesToHex(jumpdests));

  // Boundaries & validity checks
  console.log("isBytecodeBoundary(0):", isBytecodeBoundary(code, 0));
  console.log("isValidJumpDest(0):", isValidJumpDest(code, 0));
})();

