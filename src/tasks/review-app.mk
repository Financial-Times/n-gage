# this file is created by the `review-app` task. 
# if it exists it contains the name of the review app
# on heroku
REVIEW_APP_FILE := .review-app

tidy-review-app:
	-rm $(REVIEW_APP_FILE)

review-app: tidy-review-app .review-app

.review-app:
	@echo 'Creating review app for $(VAULT_NAME)'
	nht configure $(VAULT_NAME) review-app --overrides NODE_ENV=branch
	@nht review-app $(VAULT_NAME) \
		--repo-name $(CIRCLE_PROJECT_REPONAME) \
		--branch $(CIRCLE_BRANCH) \
		--commit $(CIRCLE_SHA1) \
		--github-token $(GITHUB_AUTH_TOKEN) > $@

gtg-review-app: review-app
	nht gtg $$(cat $(REVIEW_APP_FILE))

test-review-ap%: # test-review-app: create and test a review app on heroku
	$(MAKE) gtg-review-app
	TEST_URL="http://$$(cat $(REVIEW_APP_FILE)).herokuapp.com" \
		$(MAKE) smoke a11y