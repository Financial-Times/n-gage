deplo%: ## deploy: deploy the app to heroku
	$(call ASSERT_VARS_EXIST, HEROKU_APP_STAGING VAULT_NAME)
	$(call ASSERT_ANY_VAR_EXISTS, HEROKU_APP_EU HEROKU_APP_US)
# Reset repository so that the app deploys on rebuilds even though there is no code change
	heroku repo:reset -a $(HEROKU_APP_STAGING)

	@echo "Deploying app to $(HEROKU_APP_STAGING)"
	@git push https://git.heroku.com/$(HEROKU_APP_STAGING).git master

	@echo "Setting ennvironment variables for $(HEROKU_APP_STAGING)..."
	nht configure $(VAULT_NAME) $(HEROKU_APP_STAGING)
	heroku dyno:scale web=1 -a $(HEROKU_APP_STAGING)

	nht gtg $(HEROKU_APP_STAGING)

	@n-test smoke -H https://$(HEROKU_APP_STAGING).herokuapp.com --header "FT-Next-Backend-Key: $(FT_NEXT_BACKEND_KEY)"

ifdef HEROKU_APP_EU
	nht configure $(VAULT_NAME) $(HEROKU_APP_EU) --overrides REGION=EU
endif

ifdef HEROKU_APP_US
	nht configure $(VAULT_NAME) $(HEROKU_APP_US) --overrides REGION=US
endif

	heroku pipelines:promote -a $(HEROKU_APP_STAGING)
	heroku dyno:scale web=0 -a $(HEROKU_APP_STAGING)

tidy:
	-rm .review-app

review-app: tidy .review-app

.review-app:
	@echo 'Creating review app for $(VAULT_NAME)'
	nht configure $(VAULT_NAME) review-app --overrides FT_NEXT_BACKEND_KEY=null,FT_NEXT_BACKEND_KEY_OLD=null,NODE_ENV=branch
	@nht review-app $(VAULT_NAME) \
		--repo-name $(CIRCLE_PROJECT_REPONAME) \
		--branch $(CIRCLE_BRANCH) \
		--commit $(CIRCLE_SHA1) \
		--github-token $(GITHUB_AUTH_TOKEN) > $@

gtg-review-app: review-app
	nht gtg $(TEST_APP)

test-review-app: gtg-review-app smoke a11y