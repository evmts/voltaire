// EVM Opcodes: Arithmetic operations
// Note: EVM stack is LIFO. For binary ops, first value pushed is 'b', second is 'a'.
// So for "a op b", push b first, then a. When popped: a (top), b (second).
import { Frame } from "@tevm/voltaire";
let frame = Frame({ gas: 100n, stack: [10n, 20n] });
frame.add();
frame = Frame({ gas: 100n, stack: [7n, 6n] });
frame.mul();
frame = Frame({ gas: 100n, stack: [30n, 100n] }); // 30 pushed first, 100 on top
frame.sub();
frame = Frame({ gas: 100n, stack: [3n, 100n] }); // 3 pushed first, 100 on top
frame.div();

// Division by zero
frame = Frame({ gas: 100n, stack: [0n, 100n] });
frame.div();
frame = Frame({ gas: 100n, stack: [5n, 17n] }); // 5 pushed first, 17 on top
frame.mod();
frame = Frame({ gas: 1000n, stack: [10n, 2n] }); // exp=10 first, base=2 on top
frame.exp();
const maxUint256 =
	0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffn;
frame = Frame({ gas: 100n, stack: [maxUint256, 1n] });
frame.add();
