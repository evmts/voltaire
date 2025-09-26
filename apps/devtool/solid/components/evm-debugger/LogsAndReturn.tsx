import { isMobile } from '@solid-primitives/platform'
import CopyIcon from 'lucide-solid/icons/copy'
import RectangleEllipsisIcon from 'lucide-solid/icons/rectangle-ellipsis'
import { type Component, createSignal, For, Show } from 'solid-js'
import { toast } from 'solid-sonner'
import Code from '~/components/Code'
import InfoTooltip from '~/components/InfoTooltip'
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { ToggleButton } from '~/components/ui/toggle'
import { cn } from '~/lib/cn'
import type { EvmState } from '~/lib/types'
import { copyToClipboard } from '~/lib/utils'

interface LogsAndReturnProps {
	state: EvmState
}

const LogsAndReturn: Component<LogsAndReturnProps> = ({ state }) => {
	const [activeTab, setActiveTab] = createSignal('returnData')

	const handleCopyLog = (log: string, index: number) => {
		copyToClipboard(log)
		toast.info(`Copied log at index ${index} to clipboard`)
	}

	const handleCopyReturnData = () => {
		copyToClipboard(state.returnData)
		toast.info('Copied return data to clipboard')
	}

	return (
		<Card class="overflow-hidden">
			<CardHeader class="border-b p-0 pr-3">
				<div class="flex items-center justify-between">
					<CardTitle class="text-sm">
						<div class="flex">
							<ToggleButton
								pressed={activeTab() === 'returnData'}
								onChange={() => setActiveTab('returnData')}
								variant="default"
								class="whitespace-nowrap rounded-none border-0 border-transparent border-b-2 px-4 py-2 data-[pressed]:border-primary"
								aria-label="Show return data"
							>
								Return data
							</ToggleButton>
							<ToggleButton
								pressed={activeTab() === 'logs'}
								onChange={() => setActiveTab('logs')}
								variant="default"
								class="whitespace-nowrap rounded-none border-0 border-transparent border-b-2 px-4 py-2 data-[pressed]:border-primary"
								aria-label="Show logs"
							>
								Logs ({state.logs.length})
							</ToggleButton>
						</div>
					</CardTitle>
					<InfoTooltip>Function return data and event logs</InfoTooltip>
				</div>
			</CardHeader>
			<div class="border-b"></div>
			<CardContent class="max-h-[250px] overflow-y-auto p-0">
				<Show when={activeTab() === 'logs'}>
					<Show
						when={state.logs.length > 0}
						fallback={
							<div class="flex items-center justify-center gap-2 p-8 text-muted-foreground text-sm italic">
								<RectangleEllipsisIcon class="h-5 w-5" />
								No logs emitted
							</div>
						}
					>
						<div class="divide-y">
							<For each={state.logs}>
								{(item, index) => (
									<div class="group flex justify-between gap-2 px-4 py-1.5 transition-colors hover:bg-muted/50">
										<div class="flex items-center">
											<span class="w-16 font-medium text-muted-foreground text-xs">{index()}:</span>
											<Code class="break-all text-sm">{item}</Code>
										</div>
										<Button
											variant="ghost"
											size="icon"
											onClick={() => handleCopyLog(item, index())}
											class={cn('h-7 w-7', !isMobile && 'opacity-0 transition-opacity group-hover:opacity-100')}
											aria-label="Copy to clipboard"
										>
											<CopyIcon class="h-4 w-4" />
										</Button>
									</div>
								)}
							</For>
						</div>
					</Show>
				</Show>
				<Show when={activeTab() === 'returnData'}>
					<Show
						when={state.returnData !== '0x' && state.returnData.length > 2}
						fallback={
							<div class="flex items-center justify-center gap-2 p-8 text-muted-foreground text-sm italic">
								<RectangleEllipsisIcon class="h-5 w-5" />
								No return data
							</div>
						}
					>
						<div class="group px-4 py-2.5 transition-colors hover:bg-muted/50">
							<div class="flex items-center justify-between gap-2">
								<Code class="break-all text-sm">{state.returnData}</Code>
								<Button
									variant="ghost"
									size="icon"
									onClick={handleCopyReturnData}
									class={cn('h-7 w-7', !isMobile && 'opacity-0 transition-opacity group-hover:opacity-100')}
									aria-label="Copy to clipboard"
								>
									<CopyIcon class="h-4 w-4" />
								</Button>
							</div>
						</div>
					</Show>
				</Show>
			</CardContent>
		</Card>
	)
}

export default LogsAndReturn
