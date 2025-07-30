export interface EvmState {
	pc: number // program counter
	opcode: string // e.g. "PUSH1", "ADD"
	gasLeft: number // remaining gas
	depth: number // call depth
	stack: string[] // hex values, top last
	memory: string // full 0x… hex dump
	storage: Record<string, string> // storage as key-value pairs
	logs: string[] // JSON-encoded events
	returnData: string // hex buffer
}

export interface SampleContract {
	name: string
	description: string
	bytecode: string
}

export const sampleContracts: SampleContract[] = [
	{
		name: 'Basic Arithmetic',
		description: 'Simple arithmetic: PUSH1 5, PUSH1 10, ADD, PUSH1 3, MUL (Result: 45)',
		bytecode: '0x6005600a01600302',
	},
	{
		name: 'Memory Operations',
		description: 'Memory store/load: Store 0xdeadbeef at offset 0x00, then load it back',
		bytecode: '0x63deadbeef6000526000516000556000546001600055600154',
	},
	{
		name: 'Storage Operations',
		description: 'Storage read/write: Store values in slots 0 and 1, then read them',
		bytecode: '0x600a600055601e600155600054600154600255600254',
	},
	{
		name: 'PUSH Variations',
		description: 'Different PUSH sizes: PUSH1(0xff), PUSH2(0xffff), PUSH3(0xffffff), PUSH4(0xffffffff)',
		bytecode: '0x60ff61ffff62ffffff63ffffffff',
	},
	{
		name: 'Stack Operations',
		description: 'DUP, SWAP operations: Build stack, duplicate, swap elements',
		bytecode: '0x600160026003808081905090',
	},
	{
		name: 'Comparison & Logic',
		description: 'Comparison ops: LT, GT, EQ, ISZERO, AND, OR, XOR, NOT',
		bytecode: '0x600560031060ff600016600a600514601560001915600019',
	},
	{
		name: 'Hash Operations',
		description: 'KECCAK256: Hash "Hello" stored in memory',
		bytecode: '0x7f48656c6c6f000000000000000000000000000000000000000000000000000000600052600520',
	},
	{
		name: 'Comprehensive Test',
		description: 'Full EVM showcase: arithmetic, memory, storage, events, returns, comparisons, jumps',
		bytecode: '0x6005600a01806000526003600202600155600154600302600455604260005260206000a06008600a166009600b176001600055600054600c602014610093576020600052602060006001a15b602060005260206000f3',
	},
]

export const formatHex = (hex: string): string => {
	if (!hex.startsWith('0x')) return hex
	return hex.length > 10 ? `${hex.slice(0, 6)}...${hex.slice(-4)}` : hex
}

export const formatMemory = (memory: string): string[] => {
	if (memory === '0x' || memory.length <= 2) return []

	// Remove 0x prefix
	const hex = memory.slice(2)

	// Group by 32 bytes (64 chars) for readability
	const chunks: string[] = []
	for (let i = 0; i < hex.length; i += 64) {
		chunks.push(hex.slice(i, i + 64))
	}

	return chunks
}

export const formatStorage = (storage: Record<string, string>): { key: string; value: string }[] => {
	return Object.entries(storage).map(([key, value]) => ({
		key,
		value,
	}))
}