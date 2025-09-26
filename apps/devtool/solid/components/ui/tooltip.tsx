import type { PolymorphicProps } from '@kobalte/core/polymorphic'
import type { TooltipContentProps, TooltipRootProps } from '@kobalte/core/tooltip'
import { Tooltip as TooltipPrimitive } from '@kobalte/core/tooltip'
import { mergeProps, splitProps, type ValidComponent } from 'solid-js'
import { cn } from '~/lib/cn'

export const TooltipTrigger = TooltipPrimitive.Trigger

export const Tooltip = (props: TooltipRootProps) => {
	const merge = mergeProps<TooltipRootProps[]>(
		{
			gutter: 4,
			flip: false,
		},
		props,
	)

	return <TooltipPrimitive {...merge} />
}

type tooltipContentProps<T extends ValidComponent = 'div'> = TooltipContentProps<T> & {
	class?: string
}

export const TooltipContent = <T extends ValidComponent = 'div'>(
	props: PolymorphicProps<T, tooltipContentProps<T>>,
) => {
	const [local, rest] = splitProps(props as tooltipContentProps, ['class'])

	return (
		<TooltipPrimitive.Portal>
			<TooltipPrimitive.Content
				class={cn(
					'data-[closed]:fade-out-0 data-[expanded]:fade-in-0 data-[closed]:zoom-out-95 data-[expanded]:zoom-in-95 z-50 overflow-hidden rounded-sm bg-primary px-3 py-1.5 text-primary-foreground text-xs data-[closed]:animate-out data-[expanded]:animate-in',
					local.class,
				)}
				{...rest}
			/>
		</TooltipPrimitive.Portal>
	)
}
