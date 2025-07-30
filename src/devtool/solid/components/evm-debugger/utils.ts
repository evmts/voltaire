import type { EvmState } from '~/components/evm-debugger/types'

export async function loadBytecode(bytecodeHex: string): Promise<void> {
	try {
		console.log('load_bytecode', { bytecodeHex })
		const response = await (window as any).load_bytecode(bytecodeHex)
		console.log('load_bytecode response:', response)
		
		// Check if response contains error
		if (typeof response === 'string') {
			const parsed = JSON.parse(response)
			if (parsed.error) {
				throw new Error(parsed.error)
			}
		}
	} catch (err) {
		throw new Error(`Failed to load bytecode: ${err}`)
	}
}

export async function resetEvm(): Promise<EvmState> {
	try {
		console.log('reset_evm')
		const response = await (window as any).reset_evm()
		console.log('reset_evm response:', response)
		
		if (typeof response === 'string') {
			const parsed = JSON.parse(response)
			if (parsed.error) {
				throw new Error(parsed.error)
			}
			return parsed
		}
		return response
	} catch (err) {
		throw new Error(`Failed to reset EVM: ${err}`)
	}
}

export async function stepEvm(): Promise<EvmState> {
	try {
		console.log('step_evm')
		const response = await (window as any).step_evm()
		console.log('step_evm response:', response)
		
		if (typeof response === 'string') {
			const parsed = JSON.parse(response)
			if (parsed.error) {
				throw new Error(parsed.error)
			}
			return parsed
		}
		return response
	} catch (err) {
		throw new Error(`Failed to step: ${err}`)
	}
}

export async function toggleRunPause(): Promise<EvmState> {
	try {
		console.log('toggle_run_pause')
		// For now, just get the current state since we don't have continuous execution yet
		return await getEvmState()
	} catch (err) {
		throw new Error(`Failed to toggle run/pause: ${err}`)
	}
}

export async function getEvmState(): Promise<EvmState> {
	try {
		console.log('get_evm_state')
		const response = await (window as any).get_evm_state()
		console.log('get_evm_state response:', response)
		
		if (typeof response === 'string') {
			const parsed = JSON.parse(response)
			if (parsed.error) {
				throw new Error(parsed.error)
			}
			
			// Convert the Zig JSON format to our TypeScript format
			return {
				pc: parsed.pc,
				opcode: parsed.opcode,
				gasLeft: parsed.gasLeft,
				depth: parsed.depth,
				stack: parsed.stack || [],
				memory: parsed.memory || '0x',
				storage: {}, // TODO: Convert storage array to object
				logs: parsed.logs || [],
				returnData: parsed.returnData || '0x',
			}
		}
		return response
	} catch (err) {
		throw new Error(`Failed to get state: ${err}`)
	}
}

export const copyToClipboard = (text: string): void => {
	navigator.clipboard.writeText(text)
}
