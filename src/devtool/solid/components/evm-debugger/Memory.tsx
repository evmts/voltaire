import { type Component, For, type Setter, Show } from 'solid-js'
import { type EvmState, formatMemory } from './types'
import { copyToClipboard } from './utils'

interface MemoryProps {
	state: EvmState
	copied: string
	setCopied: Setter<string>
}

const Memory: Component<MemoryProps> = (props) => {
	const handleCopy = (chunk: string, index: number) => {
		copyToClipboard(`0x${chunk}`)
		props.setCopied(`Memory[0x${(index * 32).toString(16)}]`)
		setTimeout(() => props.setCopied(''), 2000)
	}

	const memoryChunks = () => formatMemory(props.state.memory)

	return (
		<div class="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-[#252525]">
			<div class="flex items-center justify-between border-gray-200 border-b p-3 dark:border-gray-800">
				<h2 class="font-medium text-gray-900 text-sm dark:text-white">Memory</h2>
				<div class="text-gray-500 text-xs dark:text-gray-400">Hexadecimal representation</div>
			</div>
			<div class="max-h-[300px] overflow-y-auto p-0">
				<Show
					when={memoryChunks().length > 0}
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
								<title>Memory</title>
								<rect x="2" y="4" width="20" height="16" rx="2" />
								<path d="M10 4v4" />
								<path d="M2 8h20" />
								<path d="M6 12h.01" />
								<path d="M10 12h.01" />
								<path d="M14 12h.01" />
								<path d="M18 12h.01" />
								<path d="M6 16h.01" />
								<path d="M10 16h.01" />
								<path d="M14 16h.01" />
								<path d="M18 16h.01" />
							</svg>
							Memory is empty
						</div>
					}
				>
					<div class="divide-y divide-gray-100 dark:divide-gray-800">
						<For each={memoryChunks()}>
							{(chunk, index) => (
								<div class="group flex justify-between px-4 py-2.5 transition-colors hover:bg-gray-50 dark:hover:bg-[#2D2D2D]">
									<div class="flex items-start">
										<span class="w-10 pt-0.5 font-medium font-mono text-gray-500 text-xs dark:text-gray-400">
											0x{(index() * 32).toString(16).padStart(4, '0')}:
										</span>
										<span class="ml-2 break-all font-mono text-gray-900 text-sm dark:text-white">{chunk}</span>
									</div>
									<button
										type="button"
										onClick={() => handleCopy(chunk, index())}
										class="mt-0.5 flex-shrink-0 rounded-md p-1 text-gray-400 opacity-0 transition-opacity hover:bg-gray-100 hover:text-gray-600 group-hover:opacity-100 dark:hover:bg-gray-700 dark:hover:text-gray-300"
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
							)}
						</For>
					</div>
				</Show>
			</div>
		</div>
	)
}

export default Memory
