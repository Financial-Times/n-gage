#Must be above deplo%
deploy-asset%: ## deploy-assets: Uploads static files such as CSS and JS to S3
	@if [ -e public/manifest.json ]; then \
		if [ "$(NODE_ENV)" = "branch" ]; then \
			nht upload-assets-to-s3 \
				--accessKeyId=$(aws_access_hashed_assets) \
				--secretAccessKey=$(aws_secret_hashed_assets) \
				--directory="public" \
				--bucket="ft-next-hashed-assets-preview" \
				--destination="hashed-assets/page-kit"; \
		else \
			nht upload-assets-to-s3 \
				--accessKeyId=$(aws_access_hashed_assets) \
				--secretAccessKey=$(aws_secret_hashed_assets) \
				--directory="public" \
				--bucket="ft-next-hashed-assets-prod" \
				--destination="hashed-assets/page-kit" \
			&& nht upload-assets-to-s3 \
				--accessKeyId=$(aws_access_hashed_assets) \
				--secretAccessKey=$(aws_secret_hashed_assets) \
				--directory="public" \
				--bucket="ft-next-hashed-assets-prod-us" \
				--destination="hashed-assets/page-kit"; \
		fi \
	fi

#Must be above deplo%
deploy-production: ## deploy-production: Deploy staging to production eu and us apps. Also scale down canary app
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
deploy-canary: ## deploy-canary: Deploy canary app to staging
	@echo "Checking for existing canary app..."
	! curl https://$(HEROKU_APP_CANARY).herokuapp.com/__gtg -Is --fail
# Exits early on successful curl to the canary app
	@echo "Continuing with build as no existing canary app detected"
	$(call ASSERT_VARS_EXIST, HEROKU_APP_STAGING VAULT_NAME HEROKU_APP_CANARY)
# Reset repository so that the app deploys on rebuilds even though there is no code change
	heroku repo:reset -a $(HEROKU_APP_STAGING)

	@echo "Setting environment variables for $(HEROKU_APP_STAGING)..."
	nht configure $(VAULT_NAME) $(HEROKU_APP_STAGING)

	@echo "Deploying app to $(HEROKU_APP_STAGING)"
	@git push https://git.heroku.com/$(HEROKU_APP_STAGING).git HEAD

	heroku dyno:scale web=1 -a $(HEROKU_APP_STAGING)

	nht gtg $(HEROKU_APP_STAGING)

	@n-test smoke -H https://$(HEROKU_APP_STAGING).herokuapp.com --header "FT-Next-Backend-Key: $(FT_NEXT_BACKEND_KEY)" --browsers "chrome"

	nht configure $(VAULT_NAME) $(HEROKU_APP_CANARY) --overrides "FT_APP_VARIANT=canary" \

	heroku pipelines:promote -a $(HEROKU_APP_STAGING) --to $(HEROKU_APP_CANARY)

	# Scale up canary either based on the variable or the EU app
	$(if $(HEROKU_APP_CANARY_SCALE),\
	  heroku ps:scale web=$(HEROKU_APP_CANARY_SCALE) -a $(HEROKU_APP_CANARY), \
	  heroku ps:scale $(shell heroku ps:scale -a $(HEROKU_APP_EU)) -a $(HEROKU_APP_CANARY) \
	)
	heroku dyno:scale web=0 -a $(HEROKU_APP_STAGING)

	$(MAKE) change-api

deploy-staging: ## deploy-staging: Deploy the app to staging
	$(call ASSERT_VARS_EXIST, HEROKU_APP_STAGING VAULT_NAME)
	$(call ASSERT_ANY_VAR_EXISTS, HEROKU_APP_EU HEROKU_APP_US)
# Reset repository so that the app deploys on rebuilds even though there is no code change
	heroku repo:reset -a $(HEROKU_APP_STAGING)

	@echo "Setting environment variables for $(HEROKU_APP_STAGING)..."
	nht configure $(VAULT_NAME) $(HEROKU_APP_STAGING)

	@echo "Deploying app to $(HEROKU_APP_STAGING)"
	@git push https://git.heroku.com/$(HEROKU_APP_STAGING).git HEAD

	heroku dyno:scale web=1 -a $(HEROKU_APP_STAGING)

	nht gtg $(HEROKU_APP_STAGING)

	@n-test smoke -H https://$(HEROKU_APP_STAGING).herokuapp.com --header "FT-Next-Backend-Key: $(FT_NEXT_BACKEND_KEY)" --browsers "chrome"

	$(if $(HEROKU_APP_EU),\
	  nht configure $(VAULT_NAME) $(HEROKU_APP_EU) --overrides REGION=EU \
	)

	$(if $(HEROKU_APP_US),\
	  nht configure $(VAULT_NAME) $(HEROKU_APP_US) --overrides REGION=US \
	)

deploy-promote: ## deploy-promote: Promote the staging app to production
	$(call ASSERT_VARS_EXIST, HEROKU_APP_STAGING)

	heroku pipelines:promote -a $(HEROKU_APP_STAGING)
	heroku dyno:scale web=0 -a $(HEROKU_APP_STAGING)

	$(MAKE) change-api

deplo%: ## deploy: Deploy the app to heroku
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
	@if [ ! -e package-lock.json ]; then
		npm update
	fi

	@if [ -e bower.json ]; then $(BOWER_INSTALL); fi
	make build-production
	make deploy-assets
	npm prune --production #Need to explicitly run this so review apps are the same as production apps
