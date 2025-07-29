import { type Component, type Setter, Show } from 'solid-js'
import type { EvmState } from './types'
import { resetEvm, stepEvm, toggleRunPause } from './utils'

interface ControlsProps {
	isRunning: boolean
	setIsRunning: Setter<boolean>
	setError: Setter<string>
	setState: Setter<EvmState>
	isUpdating: boolean
	setIsUpdating: Setter<boolean>
}

const Controls: Component<ControlsProps> = (props) => {
	const handleResetEvm = async () => {
		try {
			props.setError('')
			props.setIsRunning(false)
			const state = await resetEvm()
			props.setState(state)
		} catch (err) {
			props.setError(`${err}`)
		}
	}

	const handleStepEvm = async () => {
		try {
			props.setError('')
			props.setIsUpdating(true)
			const state = await stepEvm()
			props.setState(state)
			setTimeout(() => props.setIsUpdating(false), 50)
		} catch (err) {
			props.setError(`${err}`)
			props.setIsUpdating(false)
		}
	}

	const handleToggleRunPause = async () => {
		try {
			props.setError('')
			props.setIsRunning(!props.isRunning)
			const state = await toggleRunPause()
			props.setState(state)
		} catch (err) {
			props.setError(`${err}`)
			props.setIsRunning(false)
		}
	}

	return (
		<div class="sticky top-16 z-10 mb-6 overflow-hidden">
			<div class="rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-[#252525]">
				<div class="flex flex-wrap items-center gap-3 p-3">
					<button
						type="button"
						onClick={handleResetEvm}
						class="inline-flex transform items-center rounded-lg border border-gray-200 bg-white px-3 py-1.5 font-medium text-gray-700 text-sm shadow-sm transition-all hover:translate-y-[-1px] hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 active:translate-y-[1px] dark:border-gray-700 dark:bg-[#2D2D2D] dark:text-gray-200 dark:focus:ring-indigo-400/50 dark:hover:bg-gray-800"
						aria-label="Reset EVM (R)"
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="mr-1.5 h-4 w-4 text-gray-500 dark:text-gray-400"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
							stroke-linejoin="round"
						>
							<title>Reset</title>
							<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
							<path d="M3 3v5h5" />
						</svg>
						Reset
					</button>
					<button
						type="button"
						onClick={handleStepEvm}
						class="inline-flex transform items-center rounded-lg border border-gray-200 bg-white px-3 py-1.5 font-medium text-gray-700 text-sm shadow-sm transition-all hover:translate-y-[-1px] hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 active:translate-y-[1px] dark:border-gray-700 dark:bg-[#2D2D2D] dark:text-gray-200 dark:focus:ring-indigo-400/50 dark:hover:bg-gray-800"
						disabled={props.isRunning}
						aria-label="Step EVM (S)"
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="mr-1.5 h-4 w-4 text-gray-500 dark:text-gray-400"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
							stroke-linejoin="round"
						>
							<title>Step</title>
							<polygon points="5 3 19 12 5 21 5 3" />
						</svg>
						Step
					</button>
					<button
						type="button"
						onClick={handleToggleRunPause}
						class={`inline-flex transform items-center rounded-lg border px-3 py-1.5 font-medium text-sm shadow-sm transition-all hover:translate-y-[-1px] focus:outline-none focus:ring-2 focus:ring-indigo-500/50 active:translate-y-[1px] dark:focus:ring-indigo-400/50 ${
							props.isRunning
								? 'border-red-200 bg-red-50 text-red-700 hover:bg-red-100 dark:border-red-800/50 dark:bg-red-500/10 dark:text-red-300 dark:hover:bg-red-500/20'
								: 'border-green-200 bg-green-50 text-green-700 hover:bg-green-100 dark:border-green-800/50 dark:bg-green-500/10 dark:text-green-300 dark:hover:bg-green-500/20'
						}`}
						aria-label={props.isRunning ? 'Pause EVM (Space)' : 'Run EVM (Space)'}
					>
						<Show
							when={props.isRunning}
							fallback={
								<svg
									xmlns="http://www.w3.org/2000/svg"
									class="mr-1.5 h-4 w-4 text-green-600 dark:text-green-400"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="2"
									stroke-linecap="round"
									stroke-linejoin="round"
								>
									<title>Run</title>
									<polygon points="5 3 19 12 5 21 5 3" />
									<polygon points="19 12 5 21 5 3 19 12" />
								</svg>
							}
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								class="mr-1.5 h-4 w-4 text-red-600 dark:text-red-400"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
								stroke-linecap="round"
								stroke-linejoin="round"
							>
								<title>Pause</title>
								<rect x="6" y="4" width="4" height="16" />
								<rect x="14" y="4" width="4" height="16" />
							</svg>
						</Show>
						{props.isRunning ? 'Pause' : 'Run'}
					</button>

					<div class="ml-auto flex items-center space-x-3 text-gray-500 text-xs dark:text-gray-400">
						<div class="flex items-center">
							<kbd class="rounded border border-gray-200 bg-gray-100 px-1.5 py-0.5 font-mono text-gray-800 text-xs dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200">
								R
							</kbd>
							<span class="ml-1">Reset</span>
						</div>
						<div class="flex items-center">
							<kbd class="rounded border border-gray-200 bg-gray-100 px-1.5 py-0.5 font-mono text-gray-800 text-xs dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200">
								S
							</kbd>
							<span class="ml-1">Step</span>
						</div>
						<div class="flex items-center">
							<kbd class="rounded border border-gray-200 bg-gray-100 px-1.5 py-0.5 font-mono text-gray-800 text-xs dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200">
								Space
							</kbd>
							<span class="ml-1">Run/Pause</span>
						</div>
						<div class="flex items-center">
							<kbd class="rounded border border-gray-200 bg-gray-100 px-1.5 py-0.5 font-mono text-gray-800 text-xs dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200">
								Ctrl
							</kbd>
							<span class="mx-0.5">+</span>
							<kbd class="rounded border border-gray-200 bg-gray-100 px-1.5 py-0.5 font-mono text-gray-800 text-xs dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200">
								D
							</kbd>
							<span class="ml-1">Dark Mode</span>
						</div>
					</div>
				</div>
			</div>
		</div>
	)
}

export default Controls
