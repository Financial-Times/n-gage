
# Environment variables come from https://github.com/Financial-Times/next-vault-sync
.env: ## .env: Downloads environment variables from Vault
	@if [[ -z "$(shell command -v vault)" ]]; then echo "Error: You don't have Vault installed. Follow the guide at https://github.com/Financial-Times/vault/wiki/Getting-Started-With-Vault"; exit 1; fi
	@if [  -z "$(shell find ~/.vault-token -mmin -480)" ]; then \
		if [ -z "$(VAULT_AUTH_GITHUB_TOKEN)" ]; then \
			echo "Error: VAULT_AUTH_GITHUB_TOKEN variable is not set."; exit 1; \
		else \
			echo "You are not logged in, logging you in..." && vault login --method github token=$$VAULT_AUTH_GITHUB_TOKEN; \
		fi \
	fi
	@if [[ -z "$(shell grep '*.env*' .gitignore)" ]]; then echo "Error: .gitignore must include: *.env* (including the asterisks)"; exit 1; fi
	@if [[ ! -e package.json ]]; then echo "Error: package.json not found."; exit 1; fi
	@if [[ ! -z "$(CIRCLECI)" ]]; then echo "Error: The CIRCLECI environment variable must *not* be set."; exit 1; fi

	@ngage get-config --team $(TEAM)

	@$(DONE)

# for use with CI deployments that need the env vars in a file (dotenv format)
.env-vault-circleci-dotenv:
	@ngage get-config --env prod --team $(TEAM)
	@$(DONE)

# for use with CI deployments that need the env vars in a file (JSON format)
.env-vault-circleci-json:
	@ngage get-config --env prod --format json --team $(TEAM)
	@$(DONE)
