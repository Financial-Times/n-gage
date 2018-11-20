
smok%:
ifneq ($(CIRCLE_BRANCH),)
	TEST_URL=$(TEST_APP); \
	echo $(TEST_APP) | grep http -s || TEST_URL=http://$(TEST_APP).herokuapp.com; \
	n-test smoke -H $$TEST_URL;
else
	@if [ -z "$(TEST_URL)" ]; then TEST_URL=local.ft.com:3002; fi; \
	n-test smoke -H $$TEST_URL;
endif
	@$(DONE)
