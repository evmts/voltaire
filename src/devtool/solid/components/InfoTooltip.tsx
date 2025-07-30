import { isMobile } from '@solid-primitives/platform'
import CircleQuestionMarkIcon from 'lucide-solid/icons/circle-question-mark'
import type { JSX } from 'solid-js'
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover'
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip'

interface InfoTooltipProps {
	children: JSX.Element
}

const InfoTooltip = (props: InfoTooltipProps) => {
	if (isMobile)
		return (
			<Popover>
				<PopoverTrigger class="text-muted-foreground transition-colors hover:text-foreground">
					<CircleQuestionMarkIcon class="h-4 w-4" />
				</PopoverTrigger>
				<PopoverContent class="px-4 py-3">{props.children}</PopoverContent>
			</Popover>
		)
	return (
		<Tooltip openDelay={0}>
			<TooltipTrigger class="text-muted-foreground transition-colors hover:text-foreground">
				<CircleQuestionMarkIcon class="h-4 w-4" />
			</TooltipTrigger>
			<TooltipContent>{props.children}</TooltipContent>
		</Tooltip>
	)
}

export default InfoTooltip
