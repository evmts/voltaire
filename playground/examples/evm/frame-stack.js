// EVM Frame: Stack operations (push, pop, peek)
import { Frame } from "../../../src/evm/Frame/index.js";

const frame = Frame({ gas: 100000n });

// Push values onto stack
console.log("=== Pushing values ===");
Frame.pushStack(frame, 10n);
Frame.pushStack(frame, 20n);
Frame.pushStack(frame, 30n);

console.log("Stack after pushes:", frame.stack);
console.log("Stack depth:", frame.stack.length);

// Peek at top of stack (doesn't remove)
const top = Frame.peekStack(frame);
console.log("\nPeek top:", top.value);
console.log("Stack unchanged:", frame.stack.length);

// Pop values (LIFO order)
console.log("\n=== Popping values ===");
const pop1 = Frame.popStack(frame);
console.log("Pop 1:", pop1.value); // 30

const pop2 = Frame.popStack(frame);
console.log("Pop 2:", pop2.value); // 20

const pop3 = Frame.popStack(frame);
console.log("Pop 3:", pop3.value); // 10

console.log("Stack empty:", frame.stack.length === 0);

// Stack underflow
const underflow = Frame.popStack(frame);
console.log("\nUnderflow error:", underflow.error?.type);

// Stack overflow (max 1024 items)
console.log("\n=== Stack limits ===");
const overflowFrame = Frame({ gas: 100000n });
for (let i = 0; i < 1024; i++) {
	Frame.pushStack(overflowFrame, BigInt(i));
}
console.log("Stack at max:", overflowFrame.stack.length);

const overflow = Frame.pushStack(overflowFrame, 1025n);
console.log("Overflow error:", overflow?.type);
