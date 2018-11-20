a11%: ## a11y: Check accessibility for this repository.
a11%: _run_pa11y
	pa11y-ci
	@$(DONE)

_run_pa11y:
	pa11y-ci
