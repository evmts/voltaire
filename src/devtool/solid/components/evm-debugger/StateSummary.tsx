import type { Component } from 'solid-js'
import type { EvmState } from '~/components/evm-debugger/types'

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
				<div class="flex flex-col items-center justify-center border-gray-200 border-r border-b p-4 transition-all hover:bg-gray-50 md:border-b-0 dark:border-gray-800 dark:hover:bg-gray-800/50">
					<div class="mb-1 flex items-center font-medium text-gray-500 text-xs uppercase tracking-wider dark:text-gray-400">
						<svg xmlns="http://www.w3.org/2000/svg" class="mr-1 h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
							<polyline points="5 12 10 17 20 7" />
						</svg>
						PC
					</div>
					<div class="font-mono font-semibold text-2xl text-gray-900 dark:text-white">{props.state.pc}</div>
				</div>
				<div class="flex flex-col items-center justify-center border-gray-200 border-b p-4 transition-all hover:bg-gray-50 md:border-r md:border-b-0 dark:border-gray-800 dark:hover:bg-gray-800/50">
					<div class="mb-1 flex items-center font-medium text-gray-500 text-xs uppercase tracking-wider dark:text-gray-400">
						<svg xmlns="http://www.w3.org/2000/svg" class="mr-1 h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
							<rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
							<path d="M9 9h6v6h-6z" />
						</svg>
						Opcode
					</div>
					<div class="rounded-full bg-gradient-to-r from-indigo-500/10 to-purple-500/10 px-3 py-1 font-mono font-semibold text-indigo-700 text-lg shadow-sm dark:from-indigo-500/20 dark:to-purple-500/20 dark:text-indigo-300">
						{props.state.opcode}
					</div>
				</div>
				<div class="flex flex-col items-center justify-center border-gray-200 border-r p-4 transition-all hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-800/50">
					<div class="mb-1 flex items-center font-medium text-gray-500 text-xs uppercase tracking-wider dark:text-gray-400">
						<svg xmlns="http://www.w3.org/2000/svg" class="mr-1 h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
							<path d="M13 16h-1v-4h1m0-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
						</svg>
						Gas Left
					</div>
					<div class="font-mono font-semibold text-2xl text-gray-900 dark:text-white">
						{props.state.gasLeft.toLocaleString()}
					</div>
				</div>
				<div class="flex flex-col items-center justify-center p-4 transition-all hover:bg-gray-50 dark:hover:bg-gray-800/50">
					<div class="mb-1 flex items-center font-medium text-gray-500 text-xs uppercase tracking-wider dark:text-gray-400">
						<svg xmlns="http://www.w3.org/2000/svg" class="mr-1 h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
							<path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
						</svg>
						Depth
					</div>
					<div class="font-mono font-semibold text-2xl text-gray-900 dark:text-white">{props.state.depth}</div>
				</div>
			</div>
		</div>
	)
}

export default StateSummary
