#Must be above deplo%
deploy-asset%:
	@if [ -e public/asset-hashes.json ]; then nht deploy-hashed-assets --monitor-assets; fi

deplo%: ## deploy: deploy the app to heroku
	$(call ASSERT_VARS_EXIST, HEROKU_APP_STAGING VAULT_NAME)
	$(call ASSERT_ANY_VAR_EXISTS, HEROKU_APP_EU HEROKU_APP_US)
# Reset repository so that the app deploys on rebuilds even though there is no code change
	heroku repo:reset -a $(HEROKU_APP_STAGING)

	@echo "Setting environment variables for $(HEROKU_APP_STAGING)..."
	nht configure $(VAULT_NAME) $(HEROKU_APP_STAGING)

	@echo "Deploying app to $(HEROKU_APP_STAGING)"
	@git push https://git.heroku.com/$(HEROKU_APP_STAGING).git master

	heroku dyno:scale web=1 -a $(HEROKU_APP_STAGING)

	nht gtg $(HEROKU_APP_STAGING)

	@n-test smoke -H http://$(HEROKU_APP_STAGING).herokuapp.com --header "FT-Next-Backend-Key: $(FT_NEXT_BACKEND_KEY)" --browsers "chrome"

	$(if $(HEROKU_APP_EU),\
	  nht configure $(VAULT_NAME) $(HEROKU_APP_EU) --overrides REGION=EU \
	)

	$(if $(HEROKU_APP_US),\
	  nht configure $(VAULT_NAME) $(HEROKU_APP_US) --overrides REGION=US \
	)

	heroku pipelines:promote -a $(HEROKU_APP_STAGING)
	heroku dyno:scale web=0 -a $(HEROKU_APP_STAGING)

tidy:
	-rm .review-app

review-app: tidy .review-app

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

test-review-app: gtg-review-app smoke a11y

heroku-postbuil%:
	npm update
	@if [ -e bower.json ]; then $(BOWER_INSTALL); fi
	make build-production
	make deploy-assets
	npm prune --production #Need to explicitly run this so review apps are the same as production apps

