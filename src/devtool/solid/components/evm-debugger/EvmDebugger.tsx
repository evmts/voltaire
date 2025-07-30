import { createEffect, createSignal, onCleanup, onMount, Show } from 'solid-js'
import BytecodeLoader from '~/components/evm-debugger/BytecodeLoader'
import BytecodeView from '~/components/evm-debugger/BytecodeView'
import Controls from '~/components/evm-debugger/Controls'
import CopyToast from '~/components/evm-debugger/CopyToast'
import ErrorAlert from '~/components/evm-debugger/ErrorAlert'
import GasUsage from '~/components/evm-debugger/GasUsage'
import Header from '~/components/evm-debugger/Header'
import LogsAndReturn from '~/components/evm-debugger/LogsAndReturn'
import Memory from '~/components/evm-debugger/Memory'
import Stack from '~/components/evm-debugger/Stack'
import StateSummary from '~/components/evm-debugger/StateSummary'
import Storage from '~/components/evm-debugger/Storage'
import type { EvmState } from '~/components/evm-debugger/types'
import { sampleContracts } from '~/components/evm-debugger/types'
import { getEvmState, stepEvm } from '~/components/evm-debugger/utils'

const EvmDebugger = () => {
	const [bytecode, setBytecode] = createSignal(sampleContracts[7].bytecode)
	const [state, setState] = createSignal<EvmState>({
		pc: 0,
		opcode: '-',
		gasLeft: 0,
		depth: 0,
		stack: [],
		memory: '0x',
		storage: [],
		logs: [],
		returnData: '0x',
	})
	const [isRunning, setIsRunning] = createSignal(false)
	const [error, setError] = createSignal('')
	const [copied, setCopied] = createSignal('')
	const [isUpdating, setIsUpdating] = createSignal(false)
	const [isDarkMode, setIsDarkMode] = createSignal(false)
	const [showSample, setShowSample] = createSignal(false)
	const [activePanel, setActivePanel] = createSignal('all')
	const [executionSpeed, setExecutionSpeed] = createSignal(100) // milliseconds between steps

	onMount(() => {
		if (window.matchMedia?.('(prefers-color-scheme: dark)').matches) {
			setIsDarkMode(true)
		}
		window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (event) => {
			setIsDarkMode(event.matches)
		})
	})

	createEffect(() => {
		if (!isRunning()) return
		const runStep = async () => {
			try {
				setIsUpdating(true)
				const freshState = await stepEvm()
				setState(freshState)
				setIsUpdating(false)
				
				// Stop running if execution is complete or an error occurred
				if (freshState.pc === 0 && freshState.opcode === 'COMPLETE') {
					setIsRunning(false)
				}
			} catch (err) {
				setError(`Failed to step: ${err}`)
				setIsRunning(false)
			}
		}

		const interval = setInterval(runStep, executionSpeed()) // Step at configured speed

		onCleanup(() => {
			clearInterval(interval)
		})
	})

	const handleKeyDown = (e: KeyboardEvent) => {
		if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
			return
		}

		if (e.key === 'r' || e.key === 'R') {
			const handleResetEvm = async () => {
				try {
					setError('')
					setIsRunning(false)
				} catch (err) {
					setError(`${err}`)
				}
			}

			handleResetEvm()
		} else if (e.key === 's' || e.key === 'S') {
			const handleStepEvm = async () => {
				try {
					setError('')
					setIsUpdating(true)
				} catch (err) {
					setError(`${err}`)
					setIsUpdating(false)
				}
			}

			handleStepEvm()
		} else if (e.key === ' ') {
			e.preventDefault()
			const handleToggleRunPause = async () => {
				try {
					setError('')
					setIsRunning(!isRunning())
				} catch (err) {
					setError(`${err}`)
					setIsRunning(false)
				}
			}

			handleToggleRunPause()
		} else if (e.key === 'd' && e.ctrlKey) {
			e.preventDefault()
			setIsDarkMode(!isDarkMode())
		}
	}

	createEffect(() => {
		window.addEventListener('keydown', handleKeyDown)
		onCleanup(() => {
			window.removeEventListener('keydown', handleKeyDown)
		})
	})

	return (
		<div class={`min-h-screen transition-colors duration-300 ${isDarkMode() ? 'dark' : ''}`}>
			<div class="min-h-screen bg-white text-gray-900 dark:bg-[#1E1E1E] dark:text-gray-100">
				<Header
					showSample={showSample()}
					setShowSample={setShowSample}
					isDarkMode={isDarkMode()}
					setIsDarkMode={setIsDarkMode}
					setBytecode={setBytecode}
					activePanel={activePanel()}
					setActivePanel={setActivePanel}
				/>
				<div class="mx-auto max-w-7xl px-4 py-6 sm:px-6">
					<ErrorAlert error={error()} setError={setError} />
					<BytecodeLoader
						bytecode={bytecode()}
						setBytecode={setBytecode}
						setError={setError}
						setIsRunning={setIsRunning}
						setState={setState}
					/>
					<Controls
						isRunning={isRunning()}
						setIsRunning={setIsRunning}
						setError={setError}
						setState={setState}
						isUpdating={isUpdating()}
						setIsUpdating={setIsUpdating}
						executionSpeed={executionSpeed()}
						setExecutionSpeed={setExecutionSpeed}
					/>
					<StateSummary state={state()} isUpdating={isUpdating()} />
					<Show when={activePanel() === 'all' || activePanel() === 'bytecode'}>
						<BytecodeView bytecode={bytecode()} pc={state().pc} />
					</Show>
					<Show when={activePanel() === 'all' || activePanel() === 'gas'}>
						<GasUsage state={state()} />
					</Show>
					<div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
						<Show when={activePanel() === 'all' || activePanel() === 'stack'}>
							<Stack state={state()} copied={copied()} setCopied={setCopied} />
						</Show>
						<Show when={activePanel() === 'all' || activePanel() === 'memory'}>
							<Memory state={state()} copied={copied()} setCopied={setCopied} />
						</Show>
						<Show when={activePanel() === 'all' || activePanel() === 'storage'}>
							<Storage state={state()} copied={copied()} setCopied={setCopied} />
						</Show>
						<Show when={activePanel() === 'all' || activePanel() === 'logs'}>
							<LogsAndReturn state={state()} copied={copied()} setCopied={setCopied} />
						</Show>
					</div>
				</div>
				<CopyToast copied={copied()} />
			</div>
		</div>
	)
}

export default EvmDebugger
