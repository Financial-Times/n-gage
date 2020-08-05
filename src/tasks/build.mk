buil%: ## build: Build the repository
buil%: ## build-production: Build the repository for production
buil%: public/__about.json
	@$(DONE)

# BUILD SUB-TASKS

# Only apply to Heroku apps for now
public/__about.json:
	if [ -e app.json ]; then mkdir -p public && echo '{"description":"$(call APP_NAME)","support":"next.team@ft.com","supportStatus":"active","appVersion":"$(SOURCE_VERSION)","buildCompletionTime":"$(shell date -u +"%Y-%m-%dT%H:%M:%SZ")"}' > $@ && $(DONE); fi
