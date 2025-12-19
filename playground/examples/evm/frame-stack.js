// EVM Frame: Stack operations (push, pop, peek)
import { Frame } from "../../../src/evm/Frame/index.js";

const frame = Frame({ gas: 100000n });
Frame.pushStack(frame, 10n);
Frame.pushStack(frame, 20n);
Frame.pushStack(frame, 30n);

// Peek at top of stack (doesn't remove)
const top = Frame.peekStack(frame);
const pop1 = Frame.popStack(frame);

const pop2 = Frame.popStack(frame);

const pop3 = Frame.popStack(frame);

// Stack underflow
const underflow = Frame.popStack(frame);
const overflowFrame = Frame({ gas: 100000n });
for (let i = 0; i < 1024; i++) {
	Frame.pushStack(overflowFrame, BigInt(i));
}

const overflow = Frame.pushStack(overflowFrame, 1025n);
