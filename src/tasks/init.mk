ini%: ## init: Clean the repository and start from a fresh build
ini%:
	$(MAKE) clean
	$(MAKE) install
	$(MAKE) .env
	$(MAKE) build
	@$(DONE)
