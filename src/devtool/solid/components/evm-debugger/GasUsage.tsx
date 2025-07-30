import { type Component, createMemo, createSignal, onMount } from 'solid-js'
import type { EvmState } from '~/components/evm-debugger/types'

interface GasUsageProps {
	state: EvmState
	initialGas?: number
}

const GasUsage: Component<GasUsageProps> = (props) => {
	const [initialGas, setInitialGas] = createSignal(props.initialGas || 1000000)
	
	onMount(() => {
		if (props.state.gasLeft > 0 && props.state.gasLeft > initialGas()) {
			setInitialGas(props.state.gasLeft)
		}
	})
	
	const gasUsed = createMemo(() => {
		const init = initialGas()
		const left = props.state.gasLeft
		return init > left ? init - left : 0
	})
	
	const gasPercentage = createMemo(() => {
		const init = initialGas()
		if (init === 0) return 0
		return ((init - props.state.gasLeft) / init) * 100
	})
	
	const gasUsageColor = createMemo(() => {
		const percentage = gasPercentage()
		if (percentage < 50) return 'from-green-500 to-green-600'
		if (percentage < 75) return 'from-yellow-500 to-yellow-600'
		if (percentage < 90) return 'from-orange-500 to-orange-600'
		return 'from-red-500 to-red-600'
	})
	
	return (
		<div class="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-[#252525]">
			<div class="flex items-center justify-between border-gray-200 border-b p-3 dark:border-gray-800">
				<h2 class="font-medium text-gray-900 text-sm dark:text-white">Gas Usage</h2>
				<div class="text-gray-500 text-xs dark:text-gray-400">
					{gasUsed().toLocaleString()} / {initialGas().toLocaleString()}
				</div>
			</div>
			<div class="p-4">
				<div class="mb-3">
					<div class="relative h-8 overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-800">
						<div
							class={`absolute inset-y-0 left-0 bg-gradient-to-r transition-all duration-300 ${gasUsageColor()}`}
							style={{ width: `${gasPercentage()}%` }}
						>
							<div class="h-full bg-white/20" />
						</div>
						<div class="absolute inset-0 flex items-center justify-center">
							<span class="font-medium text-gray-700 text-sm dark:text-gray-200">
								{gasPercentage().toFixed(1)}% used
							</span>
						</div>
					</div>
				</div>
				
				<div class="grid grid-cols-3 gap-4 text-center">
					<div>
						<div class="mb-1 text-gray-500 text-xs uppercase tracking-wider dark:text-gray-400">
							Initial
						</div>
						<div class="font-mono font-semibold text-gray-900 dark:text-white">
							{initialGas().toLocaleString()}
						</div>
					</div>
					<div>
						<div class="mb-1 text-gray-500 text-xs uppercase tracking-wider dark:text-gray-400">
							Used
						</div>
						<div class="font-mono font-semibold text-gray-900 dark:text-white">
							{gasUsed().toLocaleString()}
						</div>
					</div>
					<div>
						<div class="mb-1 text-gray-500 text-xs uppercase tracking-wider dark:text-gray-400">
							Remaining
						</div>
						<div class="font-mono font-semibold text-gray-900 dark:text-white">
							{props.state.gasLeft.toLocaleString()}
						</div>
					</div>
				</div>
				
				<div class="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-800/50">
					<div class="mb-2 text-gray-600 text-xs font-medium uppercase tracking-wider dark:text-gray-300">
						Gas Efficiency Tips
					</div>
					<div class="space-y-1 text-gray-600 text-xs dark:text-gray-400">
						<div class={gasPercentage() < 50 ? 'text-green-600 dark:text-green-400' : ''}>
							• Storage operations (SSTORE) cost 20,000 gas
						</div>
						<div class={gasPercentage() < 75 ? 'text-yellow-600 dark:text-yellow-400' : ''}>
							• Memory expansion costs increase quadratically
						</div>
						<div class={gasPercentage() < 90 ? 'text-orange-600 dark:text-orange-400' : ''}>
							• External calls can consume significant gas
						</div>
					</div>
				</div>
			</div>
		</div>
	)
}

export default GasUsage