import { type Component, For, type Setter, Show } from 'solid-js'
import { type EvmState, formatHex, formatStorage } from './types'
import { copyToClipboard } from './utils'

interface StorageProps {
	state: EvmState
	copied: string
	setCopied: Setter<string>
}

const Storage: Component<StorageProps> = (props) => {
	const handleCopy = (key: string, value: string) => {
		copyToClipboard(`${key}: ${value}`)
		props.setCopied(`Storage[${formatHex(key)}]`)
		setTimeout(() => props.setCopied(''), 2000)
	}

	const storageItems = () => formatStorage(props.state.storage)

	return (
		<div class="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-[#252525]">
			<div class="flex items-center justify-between border-gray-200 border-b p-3 dark:border-gray-800">
				<h2 class="font-medium text-gray-900 text-sm dark:text-white">
					Storage ({Object.keys(props.state.storage).length})
				</h2>
				<div class="text-gray-500 text-xs dark:text-gray-400">Key-value pairs</div>
			</div>
			<div class="max-h-[300px] overflow-y-auto p-0">
				<Show
					when={Object.keys(props.state.storage).length > 0}
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
								<title>Storage</title>
								<path d="M2 10V6a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-2" />
								<path d="M10 2v4" />
								<path d="M2 6h20" />
								<path d="M10 18v4" />
								<path d="M2 18h20" />
							</svg>
							Storage is empty
						</div>
					}
				>
					<div class="divide-y divide-gray-100 dark:divide-gray-800">
						<For each={storageItems()}>
							{(item) => (
								<div class="group px-4 py-2.5 transition-colors hover:bg-gray-50 dark:hover:bg-[#2D2D2D]">
									<div class="flex items-center justify-between">
										<div class="flex items-center">
											<span class="font-medium text-gray-500 text-xs dark:text-gray-400">Key:</span>
											<span class="ml-2 font-mono text-gray-900 text-sm dark:text-white">{formatHex(item.key)}</span>
										</div>
										<button
											type="button"
											onClick={() => handleCopy(item.key, item.value)}
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
									<div class="mt-1 flex items-center">
										<span class="font-medium text-gray-500 text-xs dark:text-gray-400">Value:</span>
										<span class="ml-2 font-mono text-gray-900 text-sm dark:text-white">{formatHex(item.value)}</span>
									</div>
								</div>
							)}
						</For>
					</div>
				</Show>
			</div>
		</div>
	)
}

export default Storage
