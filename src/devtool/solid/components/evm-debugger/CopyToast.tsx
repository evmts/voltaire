import { type Component, Show } from 'solid-js'

interface CopyToastProps {
	copied: string
}

const CopyToast: Component<CopyToastProps> = (props) => {
	return (
		<Show when={props.copied}>
			<div class="fixed right-4 bottom-4 flex animate-fade-in items-center space-x-2 rounded-lg border border-gray-200 bg-white p-3 text-gray-900 shadow-lg dark:border-gray-800 dark:bg-[#252525] dark:text-white">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="h-5 w-5 text-green-500 dark:text-green-400"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
					aria-label="Success checkmark"
				>
					<title>Success checkmark</title>
					<path d="M20 6 9 17l-5-5" />
				</svg>
				<span>Copied {props.copied} to clipboard</span>
			</div>
		</Show>
	)
}

export default CopyToast
