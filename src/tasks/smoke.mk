smok%: ## smoke: run smoke tests on the local or review app
	n-test smoke -H $(TEST_URL)
	@$(DONE)
