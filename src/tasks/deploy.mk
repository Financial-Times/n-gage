deplo%: ## deploy: deploy the app to heroku
	$(call ASSERT_VARS_EXIST, HEROKU_APP_STAGING VAULT_NAME HEROKU_APP_EU HEROKU_APP_US)
# Reset repository so that the app deploys on rebuilds even though there is no code change
	heroku repo:reset -a ${HEROKU_APP_STAGING}
	@echo "Deploying app to ${HEROKU_APP_STAGING}"
	@git push https://git.heroku.com/$(HEROKU_APP_STAGING).git master
	@echo "Setting ennvironment variables for ${HEROKU_APP_STAGING}..."
	nht configure ${VAULT_NAME} ${HEROKU_APP_STAGING}
	heroku dyno:scale web=1 -a $(HEROKU_APP_STAGING)
	nht gtg ${HEROKU_APP_STAGING}
	@n-test smoke -H https://${HEROKU_APP_STAGING}.herokuapp.com --header "FT-Next-Backend-Key: ${FT_NEXT_BACKEND_KEY}"
	nht configure ${VAULT_NAME} ${HEROKU_APP_EU} --overrides REGION=EU
	nht configure ${VAULT_NAME} ${HEROKU_APP_US} --overrides REGION=US
	heroku pipelines:promote -a $(HEROKU_APP_STAGING)
	heroku dyno:scale web=0 -a $(HEROKU_APP_STAGING)

review-app:
	-rm .review-app
	make .review-app

.review-app:
	@echo 'Creating review app for ${VAULT_NAME}'
	@nht review-app ${VAULT_NAME} \
		--repo-name ${CIRCLE_PROJECT_REPONAME} \
		--branch ${CIRCLE_BRANCH} \
		--commit ${CIRCLE_SHA1} \
		--github-token ${GITHUB_AUTH_TOKEN} > $@

provision: review-app
	nht configure ${VAULT_NAME} ${TEST_APP} --overrides FT_NEXT_BACKEND_KEY=,FT_NEXT_BACKEND_KEY_OLD=,NODE_ENV=branch,TEST_APP=${TEST_APP}
	nht gtg ${TEST_APP}
	make smoke-test
	make a11y
