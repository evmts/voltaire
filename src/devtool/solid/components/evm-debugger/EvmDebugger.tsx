import { createEffect, createSignal, onCleanup, onMount, Show } from 'solid-js'
import BytecodeLoader from '~/components/evm-debugger/BytecodeLoader'
import Controls from '~/components/evm-debugger/Controls'
import CopyToast from '~/components/evm-debugger/CopyToast'
import ErrorAlert from '~/components/evm-debugger/ErrorAlert'
import Header from '~/components/evm-debugger/Header'
import LogsAndReturn from '~/components/evm-debugger/LogsAndReturn'
import Memory from '~/components/evm-debugger/Memory'
import Stack from '~/components/evm-debugger/Stack'
import StateSummary from '~/components/evm-debugger/StateSummary'
import Storage from '~/components/evm-debugger/Storage'
import type { EvmState } from '~/components/evm-debugger/types'
import { getEvmState } from '~/components/evm-debugger/utils'

const EvmDebugger = () => {
	const [bytecode, setBytecode] = createSignal('0x')
	const [state, setState] = createSignal<EvmState>({
		pc: 0,
		opcode: '-',
		gasLeft: 0,
		depth: 0,
		stack: [],
		memory: '0x',
		storage: {},
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
	const [helloResponse, setHelloResponse] = createSignal('')

	// Hello world test function
	const testHelloWorld = async () => {
		try {
			// Call the Zig backend function
			const response = await (window as any).hello_world('World')
			setHelloResponse(response)
			console.log('Hello world response:', response)
		} catch (err) {
			setError(`Hello world test failed: ${err}`)
		}
	}

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
		const refreshState = async () => {
			try {
				const freshState = await getEvmState()
				setState(freshState)
			} catch (err) {
				setError(`Failed to get state: ${err}`)
			}
		}

		const interval = setInterval(refreshState, 100)

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
					
					{/* Hello World Test Section */}
					<div class="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
						<h3 class="text-lg font-medium text-blue-900 dark:text-blue-100 mb-2">
							WebUI Communication Test
						</h3>
						<button
							onClick={testHelloWorld}
							class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors mr-4"
						>
							Test Hello World
						</button>
						<Show when={helloResponse()}>
							<div class="mt-2 p-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded">
								<strong class="text-green-800 dark:text-green-200">Response:</strong>{' '}
								<span class="text-green-700 dark:text-green-300">{helloResponse()}</span>
							</div>
						</Show>
					</div>
					
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
					/>
					<StateSummary state={state()} isUpdating={isUpdating()} />
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
