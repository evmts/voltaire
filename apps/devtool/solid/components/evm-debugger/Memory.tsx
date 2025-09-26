import { isMobile } from '@solid-primitives/platform'
import CopyIcon from 'lucide-solid/icons/copy'
import RectangleEllipsisIcon from 'lucide-solid/icons/rectangle-ellipsis'
import { type Component, For, Show } from 'solid-js'
import { toast } from 'solid-sonner'
import Code from '~/components/Code'
import InfoTooltip from '~/components/InfoTooltip'
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { cn } from '~/lib/cn'
import { type EvmState, formatHex, formatMemory } from '~/lib/types'
import { copyToClipboard } from '~/lib/utils'

interface MemoryProps {
	state: EvmState
}

const Memory: Component<MemoryProps> = ({ state }) => {
	const handleCopy = (chunk: string, index: number) => {
		const position = `0x${(index * 32).toString(16).padStart(2, '0')}`
		copyToClipboard(`0x${chunk}`)
		toast.info(
			<>
				Item at position <Code>{position}</Code> copied to clipboard
			</>,
		)
	}

	const memoryChunks = () => formatMemory(state.memory)

	return (
		<Card class="overflow-hidden">
			<CardHeader class="border-b p-3">
				<div class="flex items-center justify-between">
					<CardTitle class="text-sm">Memory ({memoryChunks().length})</CardTitle>
					<InfoTooltip>Hexadecimal representation</InfoTooltip>
				</div>
			</CardHeader>
			<CardContent class="max-h-[300px] overflow-y-auto p-0">
				<Show
					when={memoryChunks().length > 0}
					fallback={
						<div class="flex items-center justify-center gap-2 p-8 text-muted-foreground text-sm italic">
							<RectangleEllipsisIcon class="h-5 w-5" />
							Memory is empty
						</div>
					}
				>
					<div class="divide-y">
						<For each={memoryChunks()}>
							{(chunk, index) => (
								<div class="group flex justify-between px-4 py-1.5 transition-colors hover:bg-muted/50">
									<div class="flex items-center">
										<span class="w-16 pt-0.5 font-medium font-mono text-muted-foreground text-xs">
											0x{(index() * 32).toString(16).padStart(2, '0')}:
										</span>
										<Code class="break-all text-sm">{isMobile ? formatHex(`0x${chunk}`) : `0x${chunk}`}</Code>
									</div>
									<Button
										variant="ghost"
										size="icon"
										onClick={() => handleCopy(chunk, index())}
										class={cn(
											'mt-0.5 h-7 w-7 flex-shrink-0',
											!isMobile && 'opacity-0 transition-opacity group-hover:opacity-100',
										)}
										aria-label="Copy to clipboard"
									>
										<CopyIcon class="h-4 w-4" />
									</Button>
								</div>
							)}
						</For>
					</div>
				</Show>
			</CardContent>
		</Card>
	)
}

export default Memory
