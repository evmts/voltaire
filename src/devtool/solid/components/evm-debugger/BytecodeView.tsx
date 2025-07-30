import { type Component, For, Show, createMemo } from 'solid-js'
import { opcodeToString } from '~/components/evm-debugger/utils'

interface BytecodeViewProps {
	bytecode: string
	pc: number
}

interface DisassembledInstruction {
	offset: number
	opcode: string
	hex: string
	push?: string
}

const disassembleBytecode = (bytecode: string): DisassembledInstruction[] => {
	const instructions: DisassembledInstruction[] = []
	const bytes = bytecode.startsWith('0x') ? bytecode.slice(2) : bytecode
	
	let i = 0
	while (i < bytes.length) {
		const offset = i / 2
		const opcodeByte = parseInt(bytes.slice(i, i + 2), 16)
		const opcodeName = opcodeToString(opcodeByte)
		
		const instruction: DisassembledInstruction = {
			offset,
			opcode: opcodeName,
			hex: bytes.slice(i, i + 2),
		}
		
		// Handle PUSH instructions
		if (opcodeByte >= 0x60 && opcodeByte <= 0x7f) {
			const pushSize = opcodeByte - 0x5f
			const pushData = bytes.slice(i + 2, i + 2 + pushSize * 2)
			instruction.push = pushData
			i += pushSize * 2
		}
		
		instructions.push(instruction)
		i += 2
	}
	
	return instructions
}

const BytecodeView: Component<BytecodeViewProps> = (props) => {
	const instructions = createMemo(() => disassembleBytecode(props.bytecode))
	
	const currentInstructionIndex = createMemo(() => {
		const instrs = instructions()
		return instrs.findIndex((instr) => instr.offset === props.pc)
	})
	
	return (
		<div class="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-[#252525]">
			<div class="flex items-center justify-between border-gray-200 border-b p-3 dark:border-gray-800">
				<h2 class="font-medium text-gray-900 text-sm dark:text-white">
					Bytecode Disassembly
				</h2>
				<div class="text-gray-500 text-xs dark:text-gray-400">
					{instructions().length} instructions
				</div>
			</div>
			<div class="max-h-[400px] overflow-y-auto">
				<table class="w-full">
					<thead class="sticky top-0 border-gray-200 border-b bg-gray-50 text-gray-500 text-xs uppercase tracking-wider dark:border-gray-800 dark:bg-[#1E1E1E] dark:text-gray-400">
						<tr>
							<th class="px-4 py-2 text-left font-medium">Offset</th>
							<th class="px-4 py-2 text-left font-medium">Opcode</th>
							<th class="px-4 py-2 text-left font-medium">Hex</th>
							<th class="px-4 py-2 text-left font-medium">Data</th>
						</tr>
					</thead>
					<tbody class="divide-y divide-gray-100 dark:divide-gray-800">
						<For each={instructions()}>
							{(instruction, index) => (
								<tr
									class={`group transition-colors ${
										index() === currentInstructionIndex()
											? 'bg-indigo-50 dark:bg-indigo-900/20'
											: 'hover:bg-gray-50 dark:hover:bg-[#2D2D2D]'
									}`}
								>
									<td class="px-4 py-2">
										<span class="font-mono text-gray-500 text-xs dark:text-gray-400">
											0x{instruction.offset.toString(16).padStart(4, '0')}
										</span>
									</td>
									<td class="px-4 py-2">
										<span
											class={`font-mono text-sm ${
												index() === currentInstructionIndex()
													? 'font-semibold text-indigo-600 dark:text-indigo-400'
													: 'text-gray-900 dark:text-white'
											}`}
										>
											{instruction.opcode}
										</span>
									</td>
									<td class="px-4 py-2">
										<span class="font-mono text-gray-600 text-xs dark:text-gray-300">
											0x{instruction.hex}
										</span>
									</td>
									<td class="px-4 py-2">
										<Show when={instruction.push}>
											<span class="font-mono text-purple-600 text-xs dark:text-purple-400">
												0x{instruction.push}
											</span>
										</Show>
									</td>
								</tr>
							)}
						</For>
					</tbody>
				</table>
			</div>
		</div>
	)
}

export default BytecodeView