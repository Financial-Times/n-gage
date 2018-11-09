buil%: ## build: Build this repository.
buil%: ## build-production: Build this repository for production.
buil%: public/__about.json
	@if [ -e webpack.config.js ]; then $(MAKE) $(subst build,assets,$@); fi
	@if [ -e Procfile ] && [ "$(findstring build-production,$@)" == "build-production" ]; then haikro build; fi
	@$(DONE)

# BUILD SUB-TASKS

# Only apply to Heroku apps for now
public/__about.json:
	@if [ -e Procfile ]; then mkdir -p public && echo '{"description":"$(call APP_NAME)","support":"next.team@ft.com","supportStatus":"active","appVersion":"$(shell git rev-parse HEAD | xargs echo -n)","buildCompletionTime":"$(shell date -u +"%Y-%m-%dT%H:%M:%SZ")"}' > $@ && $(DONE); fi
