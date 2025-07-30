import { type ComponentProps, splitProps } from 'solid-js'
import { cn } from '~/lib/cn'

export const Skeleton = (props: ComponentProps<'div'>) => {
	const [local, rest] = splitProps(props, ['class'])

	return <div class={cn('animate-pulse rounded-sm bg-primary/10', local.class)} {...rest} />
}
