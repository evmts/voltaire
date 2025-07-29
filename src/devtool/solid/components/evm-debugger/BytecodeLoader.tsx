import type { Component, Setter } from 'solid-js'
import type { EvmState } from '~/components/evm-debugger/types'
import { loadBytecode, resetEvm } from '~/components/evm-debugger/utils'

interface BytecodeLoaderProps {
	bytecode: string
	setBytecode: Setter<string>
	setError: Setter<string>
	setIsRunning: Setter<boolean>
	setState: Setter<EvmState>
}

const BytecodeLoader: Component<BytecodeLoaderProps> = (props) => {
	const handleLoadBytecode = async () => {
		try {
			props.setError('')
			await loadBytecode(props.bytecode)
			props.setIsRunning(false)
			const state = await resetEvm()
			props.setState(state)
		} catch (err) {
			props.setError(`${err}`)
		}
	}

	return (
		<div class="mb-6 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-[#252525]">
			<div class="flex items-center justify-between border-gray-200 border-b bg-gray-50 p-4 dark:border-gray-800 dark:bg-[#1E1E1E]">
				<div>
					<h2 class="font-medium text-base text-gray-900 dark:text-white">Bytecode</h2>
					<p class="mt-0.5 text-gray-500 text-sm dark:text-gray-400">
						Enter EVM bytecode to debug or select a sample contract
					</p>
				</div>
				<button
					type="button"
					onClick={handleLoadBytecode}
					class="flex transform items-center rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 px-4 py-2 text-white shadow-sm transition-all duration-200 hover:translate-y-[-1px] hover:from-indigo-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 active:translate-y-[1px] active:from-indigo-700 active:to-purple-800 dark:focus:ring-indigo-400/50"
					aria-label="Load bytecode"
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="mr-2 h-4 w-4"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
						aria-label="Load icon"
					>
						<title>Load icon</title>
						<path d="m5 12 5 5 9-9" />
					</svg>
					Load Bytecode
				</button>
			</div>
			<div class="p-4">
				<textarea
					id="bytecode"
					value={props.bytecode}
					onInput={(e) => props.setBytecode(e.target.value)}
					class="h-24 w-full rounded-lg border border-gray-200 bg-white p-3 font-mono text-gray-900 text-sm placeholder-gray-400 shadow-inner transition-colors focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/50 dark:border-gray-700 dark:bg-[#2D2D2D] dark:text-gray-100 dark:placeholder-gray-500 dark:focus:border-indigo-400 dark:focus:ring-indigo-400/50"
					placeholder="0x608060405234801561001057600080fd5b50..."
					aria-label="EVM bytecode input"
				/>
			</div>
		</div>
	)
}

export default BytecodeLoader
