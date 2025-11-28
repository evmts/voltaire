// EVM Opcodes: Arithmetic operations
// Note: EVM stack is LIFO. For binary ops, first value pushed is 'b', second is 'a'.
// So for "a op b", push b first, then a. When popped: a (top), b (second).
import { Frame } from "../../../src/evm/Frame/index.js";

// ADD (0x01): a + b (commutative, order doesn't matter)
console.log("=== ADD ===");
let frame = Frame({ gas: 100n, stack: [10n, 20n] });
frame.add();
console.log("10 + 20 =", frame.stack[0]);

// MUL (0x02): a * b (commutative)
console.log("\n=== MUL ===");
frame = Frame({ gas: 100n, stack: [7n, 6n] });
frame.mul();
console.log("7 * 6 =", frame.stack[0]);

// SUB (0x03): a - b where a=top, b=second
// For 100 - 30: push 30, then 100 (so 100 is on top)
console.log("\n=== SUB ===");
frame = Frame({ gas: 100n, stack: [30n, 100n] }); // 30 pushed first, 100 on top
frame.sub();
console.log("100 - 30 =", frame.stack[0]);

// DIV (0x04): a / b where a=top, b=second
// For 100 / 3: push 3, then 100
console.log("\n=== DIV ===");
frame = Frame({ gas: 100n, stack: [3n, 100n] }); // 3 pushed first, 100 on top
frame.div();
console.log("100 / 3 =", frame.stack[0]);

// Division by zero
frame = Frame({ gas: 100n, stack: [0n, 100n] });
frame.div();
console.log("100 / 0 =", frame.stack[0], "(division by zero returns 0 in EVM)");

// MOD (0x06): a % b where a=top, b=second
console.log("\n=== MOD ===");
frame = Frame({ gas: 100n, stack: [5n, 17n] }); // 5 pushed first, 17 on top
frame.mod();
console.log("17 % 5 =", frame.stack[0]);

// EXP (0x0a): base ** exponent where base=top, exp=second
console.log("\n=== EXP ===");
frame = Frame({ gas: 1000n, stack: [10n, 2n] }); // exp=10 first, base=2 on top
frame.exp();
console.log("2 ** 10 =", frame.stack[0]);

// Overflow behavior
console.log("\n=== Overflow (mod 2^256) ===");
const maxUint256 =
	0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffn;
frame = Frame({ gas: 100n, stack: [maxUint256, 1n] });
frame.add();
console.log("MAX_UINT256 + 1 =", frame.stack[0], "(wraps to 0)");
