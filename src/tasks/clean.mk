clea%: ## clean: Git clean the repository
# HACK: Can't use -e option here because it's not supported by our Jenkins
	@git clean -fxdi
	@$(DONE)
