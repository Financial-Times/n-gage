a11%: ## a11y: Run automated accessibility tests
a11%: _run_pa11y
	@$(DONE)

# The pa11y config (dotfiles/.pa11yci.js) is copied to the repo during the make install step
_run_pa11y:
	@if [ -e .pa11yci.js ]; then pa11y-ci; fi
