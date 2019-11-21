#Must be above deplo%
deploy-asset%: ## deploy-assets: uploads static files such as CSS and JS to S3 based on the contents of a manifest file
	@if [ -e public/manifest.json ]; then \
		if [ -e .circleci/shared-helpers ]; then \
			.circleci/shared-helpers/helper-install-awscli; \
			&& .circleci/shared-helpers/helper-configure-awscli $(aws_access_hashed_assets) $(aws_secret_hashed_assets); \
			&& .circleci/shared-helpers/helper-upload-assets-to-s3 public hashed-assets/page-kit; \
		else \
			echo "Could not find the shared-helpers directory"; \
		fi \
	else \
		echo "Could not find a manifest.json"; \
	fi

	@if [ -e public/asset-hashes.json ]; then \
		nht deploy-hashed-assets --monitor-assets; \
	fi

#Must be above deplo%
deploy-production: ## deploy-production: deploy staging to production eu and us apps. Also scale down canary app
	$(call ASSERT_VARS_EXIST, HEROKU_APP_STAGING VAULT_NAME HEROKU_APP_CANARY)
	$(call ASSERT_ANY_VAR_EXISTS, HEROKU_APP_EU HEROKU_APP_US)
	$(if $(HEROKU_APP_EU),\
		nht configure $(VAULT_NAME) $(HEROKU_APP_EU) --overrides REGION=EU \
	)

	$(if $(HEROKU_APP_US),\
		nht configure $(VAULT_NAME) $(HEROKU_APP_US) --overrides REGION=US \
	)

	heroku pipelines:promote -a $(HEROKU_APP_STAGING) --to $(HEROKU_APP_EU),$(HEROKU_APP_US)
	heroku ps:scale web=0 -a $(HEROKU_APP_CANARY)

	$(MAKE) change-api

#Must be above deplo%
deploy-canary: ## deploy-canary: deploy canary app to staging
	@echo "Checking for existing canary app..."
	! curl http://$(HEROKU_APP_CANARY).herokuapp.com/__gtg -Is --fail
# Exits early on successful curl to the canary app
	@echo "Continuing with build as no existing canary app detected"
	$(call ASSERT_VARS_EXIST, HEROKU_APP_STAGING VAULT_NAME HEROKU_APP_CANARY)
# Reset repository so that the app deploys on rebuilds even though there is no code change
	heroku repo:reset -a $(HEROKU_APP_STAGING)

	@echo "Setting environment variables for $(HEROKU_APP_STAGING)..."
	nht configure $(VAULT_NAME) $(HEROKU_APP_STAGING)

	@echo "Deploying app to $(HEROKU_APP_STAGING)"
	@git push https://git.heroku.com/$(HEROKU_APP_STAGING).git master

	heroku dyno:scale web=1 -a $(HEROKU_APP_STAGING)

	nht gtg $(HEROKU_APP_STAGING)

	@n-test smoke -H http://$(HEROKU_APP_STAGING).herokuapp.com --header "FT-Next-Backend-Key: $(FT_NEXT_BACKEND_KEY)" --browsers "chrome"

	nht configure $(VAULT_NAME) $(HEROKU_APP_CANARY) --overrides "FT_APP_VARIANT=canary" \

	heroku pipelines:promote -a $(HEROKU_APP_STAGING) --to $(HEROKU_APP_CANARY)

	# Scale up canary either based on the variable or the EU app
	$(if $(HEROKU_APP_CANARY_SCALE),\
	  heroku ps:scale web=$(HEROKU_APP_CANARY_SCALE) -a $(HEROKU_APP_CANARY), \
	  heroku ps:scale $(shell heroku ps:scale -a $(HEROKU_APP_EU)) -a $(HEROKU_APP_CANARY) \
	)
	heroku dyno:scale web=0 -a $(HEROKU_APP_STAGING)

	$(MAKE) change-api

deploy-staging: ## deploy-staging: deploy the app to staging.
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

deploy-promote: ## deploy-promote: promote the staging app to production.
	$(call ASSERT_VARS_EXIST, HEROKU_APP_STAGING)

	heroku pipelines:promote -a $(HEROKU_APP_STAGING)
	heroku dyno:scale web=0 -a $(HEROKU_APP_STAGING)

	$(MAKE) change-api

deplo%: ## deploy: deploy the app to heroku
	$(MAKE) deploy-staging
	$(MAKE) deploy-promote

change-api:
	@echo "Saving deployment to the Change API..."
	@curl -s \
		--header "Content-Type: application/json" \
		--header "X-Api-Key: $(CHANGE_API_KEY)" \
		--request POST \
		--data "{ \
			\"user\": { \"githubName\": \"$(CIRCLE_USERNAME)\" }, \
			\"environment\": \"production\", \
			\"systemCode\": \"$(shell curl -s https://next-registry.ft.com/v2/ | jq -r ".[] | select(.repository == \"https://github.com/${CIRCLE_PROJECT_USERNAME}/${CIRCLE_PROJECT_REPONAME}\") | .code")\", \
			\"gitRepositoryName\": \"$(CIRCLE_PROJECT_USERNAME)/$(CIRCLE_PROJECT_REPONAME)\", \
			\"commit\": \"$(CIRCLE_SHA1)\" \
		}" \
		https://api.ft.com/change-log/v1/create
	@$(DONE)

heroku-postbuil%:
	npm update
	@if [ -e bower.json ]; then $(BOWER_INSTALL); fi
	make build-production
	make deploy-assets
	npm prune --production #Need to explicitly run this so review apps are the same as production apps
