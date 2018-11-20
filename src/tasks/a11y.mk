a11%: ## a11y: Check accessibility for this repository.
a11%: _run_pa11y
	@$(DONE)

_run_pa11y:
	echo $(CIRCLE_BRANCH)
ifneq ($(CIRCLE_BRANCH),)
	@export TEST_URL=$(TEST_APP); \
	echo $(TEST_APP) | grep http -s || export TEST_URL=http://$(TEST_APP).herokuapp.com; \
	pa11y-ci;
else
	@if [ -z "$(TEST_URL)" ]; then export TEST_URL=https://local.ft.com:5050; fi; pa11y-ci;
endif
