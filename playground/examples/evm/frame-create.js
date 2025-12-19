// EVM Frame: Create execution frames
import { Frame } from "../../../src/evm/Frame/index.js";
import { Address } from "../../../src/primitives/Address/index.js";

// Create a simple frame with defaults
const frame = Frame({
	bytecode: new Uint8Array([0x60, 0x01, 0x60, 0x02, 0x01]), // PUSH1 1, PUSH1 2, ADD
	gas: 100000n,
});

// Create frame with full context
const caller = Address("0x1111111111111111111111111111111111111111");
const address = Address("0x2222222222222222222222222222222222222222");

const fullFrame = Frame({
	bytecode: new Uint8Array([0x60, 0x42]), // PUSH1 0x42
	gas: 50000n,
	caller,
	address,
	value: 1000000000000000000n, // 1 ETH
	calldata: new Uint8Array([0xa9, 0x05, 0x9c, 0xbb]), // transfer selector
	isStatic: false,
});
