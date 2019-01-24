a11%: ## a11y: Check accessibility for this repository.
a11%: _run_pa11y
	@$(DONE)

_run_pa11y:
	@if [ -e .pa11yci.js ]; then pa11y-ci; fi
