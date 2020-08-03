clea%: ## clean: Clean this git repository
# HACK: Can't use -e option here because it's not supported by our Jenkins
	@git clean -fxdi
	@$(DONE)
