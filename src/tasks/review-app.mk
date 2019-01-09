# this file is created by the `review-app` task. 
# if it exists it contains the name of the review app
# on heroku
REVIEW_APP_FILE := .review-app

tidy-review-app:
	-rm $(REVIEW_APP_FILE)

review-app: tidy-review-app .review-app

.review-app:
	@echo 'Creating review app for $(VAULT_NAME)'
ifdef REVIEW_APP_CONFIGURE_OVERRIDES
	@echo 'Using nht configure overrides: $(REVIEW_APP_CONFIGURE_OVERRIDES)'
	nht configure $(VAULT_NAME) review-app --overrides "$(REVIEW_APP_CONFIGURE_OVERRIDES)"
else
	nht configure $(VAULT_NAME) review-app --overrides NODE_ENV=branch
endif
	@nht review-app $(VAULT_NAME) \
		--repo-name $(CIRCLE_PROJECT_REPONAME) \
		--branch $(CIRCLE_BRANCH) \
		--commit $(CIRCLE_SHA1) \
		--github-token $(GITHUB_AUTH_TOKEN) > $@

gtg-review-app: review-app
	nht gtg $$(cat $(REVIEW_APP_FILE))

test-review-ap%: # test-review-app: create and test a review app on heroku. To override custom environment variables when running `nht configure`, add `REVIEW_APP_CONFIGURE_OVERRIDES="NODE_ENV=branch,OTHER_VAR=something" to the Makefile`
	$(MAKE) gtg-review-app
	TEST_URL="http://$$(cat $(REVIEW_APP_FILE)).herokuapp.com" \
		$(MAKE) smoke a11y
	@$(DONE)