import type { Component } from 'solid-js'
import type { EvmState } from './types'

interface StateSummaryProps {
	state: EvmState
	isUpdating: boolean
}

const StateSummary: Component<StateSummaryProps> = (props) => {
	return (
		<div
			class={`mb-6 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-[#252525] ${
				props.isUpdating ? 'animate-pulse' : ''
			}`}
		>
			<div class="grid grid-cols-2 md:grid-cols-4">
				<div class="flex flex-col items-center justify-center border-gray-200 border-r border-b p-4 md:border-b-0 dark:border-gray-800">
					<div class="mb-1 font-medium text-gray-500 text-xs uppercase tracking-wider dark:text-gray-400">PC</div>
					<div class="font-mono font-semibold text-2xl text-gray-900 dark:text-white">{props.state.pc}</div>
				</div>
				<div class="flex flex-col items-center justify-center border-gray-200 border-b p-4 md:border-r md:border-b-0 dark:border-gray-800">
					<div class="mb-1 font-medium text-gray-500 text-xs uppercase tracking-wider dark:text-gray-400">Opcode</div>
					<div class="rounded-full bg-gradient-to-r from-indigo-500/10 to-purple-500/10 px-2.5 py-0.5 font-mono font-semibold text-indigo-700 text-lg dark:from-indigo-500/20 dark:to-purple-500/20 dark:text-indigo-300">
						{props.state.opcode}
					</div>
				</div>
				<div class="flex flex-col items-center justify-center border-gray-200 border-r p-4 dark:border-gray-800">
					<div class="mb-1 font-medium text-gray-500 text-xs uppercase tracking-wider dark:text-gray-400">Gas Left</div>
					<div class="font-mono font-semibold text-2xl text-gray-900 dark:text-white">{props.state.gasLeft}</div>
				</div>
				<div class="flex flex-col items-center justify-center p-4">
					<div class="mb-1 font-medium text-gray-500 text-xs uppercase tracking-wider dark:text-gray-400">Depth</div>
					<div class="font-mono font-semibold text-2xl text-gray-900 dark:text-white">{props.state.depth}</div>
				</div>
			</div>
		</div>
	)
}

export default StateSummary
