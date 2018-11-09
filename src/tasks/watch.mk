
watc%: ## watch: Watch for static asset changes.
	@if [ -e webpack.config.js ]; then webpack --watch --debug; fi
	@$(DONE)
