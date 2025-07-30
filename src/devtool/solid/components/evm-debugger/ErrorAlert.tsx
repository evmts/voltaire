import { type Component, type Setter, Show } from 'solid-js'
import { Button } from '~/components/ui/button'
import { Card } from '~/components/ui/card'

interface ErrorAlertProps {
	error: string
	setError: Setter<string>
}

const ErrorAlert: Component<ErrorAlertProps> = (props) => {
	return (
		<Show when={props.error}>
			<Card class="border-red-100 bg-red-50 text-red-800 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300">
				<div class="flex items-center justify-between p-4">
					<div class="flex items-center">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="mr-3 h-5 w-5 text-red-500 dark:text-red-400"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
							stroke-linejoin="round"
							aria-label="Error icon"
						>
							<title>Error icon</title>
							<circle cx="12" cy="12" r="10" />
							<line x1="12" y1="8" x2="12" y2="12" />
							<line x1="12" y1="16" x2="12.01" y2="16" />
						</svg>
						<span>{props.error}</span>
					</div>
					<Button
						variant="ghost"
						size="icon"
						onClick={() => props.setError('')}
						class="h-8 w-8 text-red-500 hover:bg-red-100 hover:text-red-600 dark:text-red-400 dark:hover:bg-red-500/20 dark:hover:text-red-300"
						aria-label="Dismiss error"
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="h-5 w-5"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
							aria-label="Close"
						>
							<title>Close</title>
							<path d="M18 6 6 18" />
							<path d="m6 6 12 12" />
						</svg>
					</Button>
				</div>
			</Card>
		</Show>
	)
}

export default ErrorAlert
