import { isMobile } from '@solid-primitives/platform'
import GaugeIcon from 'lucide-solid/icons/gauge'
import PauseIcon from 'lucide-solid/icons/pause'
import PlayIcon from 'lucide-solid/icons/play'
import RotateCcwIcon from 'lucide-solid/icons/rotate-ccw'
import StepForwardIcon from 'lucide-solid/icons/step-forward'
import { type Component, type Setter, Show } from 'solid-js'
import type { EvmState } from '~/components/evm-debugger/types'
import { resetEvm, stepEvm, toggleRunPause } from '~/components/evm-debugger/utils'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'

interface ControlsProps {
	isRunning: boolean
	setIsRunning: Setter<boolean>
	setError: Setter<string>
	setState: Setter<EvmState>
	isUpdating: boolean
	setIsUpdating: Setter<boolean>
	executionSpeed: number
	setExecutionSpeed: Setter<number>
}

const Controls: Component<ControlsProps> = (props) => {
	const handleResetEvm = async () => {
		try {
			props.setError('')
			props.setIsRunning(false)
			const state = await resetEvm()
			props.setState(state)
		} catch (err) {
			props.setError(`${err}`)
		}
	}

	const handleStepEvm = async () => {
		try {
			props.setError('')
			props.setIsUpdating(true)
			const state = await stepEvm()
			props.setState(state)
			setTimeout(() => props.setIsUpdating(false), 50)
		} catch (err) {
			props.setError(`${err}`)
			props.setIsUpdating(false)
		}
	}

	const handleToggleRunPause = async () => {
		try {
			props.setError('')
			props.setIsRunning(!props.isRunning)
			const state = await toggleRunPause()
			props.setState(state)
		} catch (err) {
			props.setError(`${err}`)
			props.setIsRunning(false)
		}
	}

	return (
		<div class="sticky top-18 z-50 flex w-full justify-center px-4">
			<div class="grid grid-cols-2 xs:grid-cols-4 gap-x-4 gap-y-2 rounded-sm border border-border/30 bg-amber-50/50 p-2 backdrop-blur-md dark:bg-amber-950/30">
				<Button
					variant="outline"
					size="sm"
					onClick={handleResetEvm}
					aria-label="Reset EVM (R)"
					class="flex items-center gap-2"
				>
					<RotateCcwIcon class="h-4 w-4" />
					Reset
					{!isMobile && (
						<Badge variant="outline" class="px-1.5 py-0.5 font-mono font-normal text-muted-foreground text-xs">
							R
						</Badge>
					)}
				</Button>
				<Button
					variant="outline"
					size="sm"
					onClick={handleStepEvm}
					disabled={props.isRunning}
					aria-label="Step EVM (S)"
					class="flex items-center gap-2"
				>
					<StepForwardIcon class="h-4 w-4" />
					Step
					{!isMobile && (
						<Badge variant="outline" class="px-1.5 py-0.5 font-mono font-normal text-muted-foreground text-xs">
							S
						</Badge>
					)}
				</Button>
				<Button
					variant={props.isRunning ? 'secondary' : 'outline'}
					size="sm"
					onClick={handleToggleRunPause}
					aria-label={props.isRunning ? 'Pause EVM (Space)' : 'Run EVM (Space)'}
					class="flex items-center gap-2"
				>
					<Show when={props.isRunning} fallback={<PlayIcon class="h-4 w-4" />}>
						<PauseIcon class="h-4 w-4" />
					</Show>
					{props.isRunning ? 'Pause' : 'Run'}
					{!isMobile && (
						<Badge variant="outline" class="px-1.5 py-0.5 font-mono font-normal text-muted-foreground text-xs">
							Space
						</Badge>
					)}
				</Button>
				<Button
					variant="outline"
					size="sm"
					disabled={!props.isRunning}
					onClick={handleToggleRunPause}
					aria-label="Speed"
					class="flex items-center gap-2"
				>
					<GaugeIcon class="h-4 w-4" />
					Speed
				</Button>
			</div>
		</div>
	)
}

export default Controls
