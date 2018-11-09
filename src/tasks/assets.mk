
asset%: ## assets: Build the static assets.
asset%: ## assets-production: Build the static assets for production.
	@if [ -e webpack.config.js ]; then webpack $(if $(findstring assets-production,$@),--bail,--debug); fi
