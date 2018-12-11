tidy-review-app:
	-rm .review-app

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
	nht gtg $(REVIEW_APP)

test-review-ap%:
	$(MAKE) gtg-review-app
	TEST_URL="http://$$(cat .review-app).herokuapp.com" \
		$(MAKE) smoke a11y