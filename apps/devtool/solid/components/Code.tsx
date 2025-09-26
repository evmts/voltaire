import type { VariantProps } from 'class-variance-authority'
import type { ComponentProps } from 'solid-js'
import { cn } from '~/lib/cn'
import { Badge, type badgeVariants } from './ui/badge'

const Code = (props: ComponentProps<'div'> & VariantProps<typeof badgeVariants>) => {
	return (
		<Badge {...props} variant={props.variant ?? 'secondary'} class={cn('px-1 font-medium font-mono', props.class)}>
			{props.children}
		</Badge>
	)
}

export default Code
