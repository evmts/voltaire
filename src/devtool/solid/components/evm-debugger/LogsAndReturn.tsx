import { type Component, createSignal, For, type Setter, Show } from 'solid-js'
import type { EvmState } from '~/components/evm-debugger/types'
import { copyToClipboard } from '~/components/evm-debugger/utils'

interface LogsAndReturnProps {
	state: EvmState
	copied: string
	setCopied: Setter<string>
}

const LogsAndReturn: Component<LogsAndReturnProps> = (props) => {
	const [activeTab, setActiveTab] = createSignal('logs')

	const handleCopyLog = (log: string, index: number) => {
		copyToClipboard(log)
		props.setCopied(`Log[${index}]`)
		setTimeout(() => props.setCopied(''), 2000)
	}

	const handleCopyReturnData = () => {
		copyToClipboard(props.state.returnData)
		props.setCopied('Return Data')
		setTimeout(() => props.setCopied(''), 2000)
	}

	return (
		<div class="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-[#252525]">
			<div class="flex items-center justify-between border-gray-200 border-b p-3 dark:border-gray-800">
				<h2 class="font-medium text-gray-900 text-sm dark:text-white">Logs & Return Data</h2>
				<div class="text-gray-500 text-xs dark:text-gray-400">Event logs and function return data</div>
			</div>
			<div class="border-gray-200 border-b dark:border-gray-800">
				<div class="flex">
					<button
						type="button"
						onClick={() => setActiveTab('logs')}
						class={`px-4 py-2 font-medium text-sm transition-colors ${
							activeTab() === 'logs'
								? 'border-indigo-500 border-b-2 text-indigo-600 dark:text-indigo-400'
								: 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
						}`}
						aria-label="Show logs"
					>
						Logs ({props.state.logs.length})
					</button>
					<button
						type="button"
						onClick={() => setActiveTab('returnData')}
						class={`px-4 py-2 font-medium text-sm transition-colors ${
							activeTab() === 'returnData'
								? 'border-indigo-500 border-b-2 text-indigo-600 dark:text-indigo-400'
								: 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
						}`}
						aria-label="Show return data"
					>
						Return Data
					</button>
				</div>
			</div>
			<div class="max-h-[250px] overflow-y-auto p-0">
				<Show when={activeTab() === 'logs'}>
					<Show
						when={props.state.logs.length > 0}
						fallback={
							<div class="flex items-center justify-center p-8 text-gray-500 text-sm italic dark:text-gray-400">
								<svg
									xmlns="http://www.w3.org/2000/svg"
									class="mr-2 h-5 w-5 text-gray-400 dark:text-gray-500"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="2"
									stroke-linecap="round"
									stroke-linejoin="round"
								>
									<title>Logs</title>
									<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
								</svg>
								No logs emitted
							</div>
						}
					>
						<div class="divide-y divide-gray-100 dark:divide-gray-800">
							<For each={props.state.logs}>
								{(log, index) => (
									<div class="group px-4 py-2.5 transition-colors hover:bg-gray-50 dark:hover:bg-[#2D2D2D]">
										<div class="flex items-center justify-between">
											<span class="font-medium text-gray-500 text-xs dark:text-gray-400">Log {index()}:</span>
											<button
												type="button"
												onClick={() => handleCopyLog(log, index())}
												class="rounded-md p-1 text-gray-400 opacity-0 transition-opacity hover:bg-gray-100 hover:text-gray-600 group-hover:opacity-100 dark:hover:bg-gray-700 dark:hover:text-gray-300"
												aria-label="Copy to clipboard"
											>
												<svg
													xmlns="http://www.w3.org/2000/svg"
													class="h-4 w-4"
													viewBox="0 0 24 24"
													fill="none"
													stroke="currentColor"
													stroke-width="2"
													stroke-linecap="round"
													stroke-linejoin="round"
												>
													<title>Copy</title>
													<rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
													<path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
												</svg>
											</button>
										</div>
										<div class="mt-1 break-all font-mono text-gray-900 text-sm dark:text-white">{log}</div>
									</div>
								)}
							</For>
						</div>
					</Show>
				</Show>
				<Show when={activeTab() === 'returnData'}>
					<Show
						when={props.state.returnData !== '0x' && props.state.returnData.length > 2}
						fallback={
							<div class="flex items-center justify-center p-8 text-gray-500 text-sm italic dark:text-gray-400">
								<svg
									xmlns="http://www.w3.org/2000/svg"
									class="mr-2 h-5 w-5 text-gray-400 dark:text-gray-500"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="2"
									stroke-linecap="round"
									stroke-linejoin="round"
								>
									<title>Return data</title>
									<path d="M9 10a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1h-4a1 1 0 0 1-1-1v-4z" />
									<path d="M9 15v2a2 2 0 0 0 2 2h7a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-2" />
									<path d="M6 17H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7a2 2 0 0 1 2 2v1" />
								</svg>
								No return data
							</div>
						}
					>
						<div class="group px-4 py-2.5 transition-colors hover:bg-gray-50 dark:hover:bg-[#2D2D2D]">
							<div class="flex items-center justify-between">
								<span class="font-medium text-gray-500 text-xs dark:text-gray-400">Return Data:</span>
								<button
									type="button"
									onClick={handleCopyReturnData}
									class="rounded-md p-1 text-gray-400 opacity-0 transition-opacity hover:bg-gray-100 hover:text-gray-600 group-hover:opacity-100 dark:hover:bg-gray-700 dark:hover:text-gray-300"
									aria-label="Copy to clipboard"
								>
									<svg
										xmlns="http://www.w3.org/2000/svg"
										class="h-4 w-4"
										viewBox="0 0 24 24"
										fill="none"
										stroke="currentColor"
										stroke-width="2"
										stroke-linecap="round"
										stroke-linejoin="round"
									>
										<title>Copy</title>
										<rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
										<path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
									</svg>
								</button>
							</div>
							<div class="mt-1 break-all font-mono text-gray-900 text-sm dark:text-white">{props.state.returnData}</div>
						</div>
					</Show>
				</Show>
			</div>
		</div>
	)
}

export default LogsAndReturn
