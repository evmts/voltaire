import { currentSiteId, familySites } from '../sites.js'

export function FamilySites() {
	return (
		<nav className="vlt-family" aria-label="tevm documentation sites">
			<h2 className="vlt-family__heading">The rest of the family</h2>
			<p className="vlt-family__intro">
				{'Voltaire is one site in the tevm documentation family. Every link below is a separate, live site.'}
			</p>
			<div className="vlt-family__grid">
				{familySites.map((site) => (
					<a
						className="vlt-family__card"
						key={site.id}
						href={site.url}
						aria-current={site.id === currentSiteId ? 'page' : undefined}
					>
						<span className="vlt-family__name">
							{site.name}
							{site.id === currentSiteId ? <small>you are here</small> : null}
						</span>
						<span className="vlt-family__host">{site.url.replace('https://', '')}</span>
						<span className="vlt-family__description">{site.description}</span>
					</a>
				))}
			</div>
		</nav>
	)
}
