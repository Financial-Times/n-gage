smok%: ## smoke: Run smoke tests on the local or review app, by setting the TEST_URL environment variable
	n-test smoke -H $(TEST_URL)
	@$(DONE)
