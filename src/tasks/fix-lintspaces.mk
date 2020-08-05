# autofix common lintspaces issues
#
# 1. convert two spaces to one tab
# 2. convert space-tab to tab with all files
# 3. convert solitary space at the beginning of line to tab
# 4 convert "blank" lines to be actually blank
fix-lintspaces: ## fix-lintspaces: Autofix common lintspaces issues
	$(call GLOB,'*.js') | xargs sed -Ei '' 's/  /	/g' \
		&& $(call GLOB,'*.js') | xargs sed -Ei '' 's/ 	/	/g' \
		&& $(call GLOB,'*.js') | xargs sed -Ei '' 's/^ /	/g' \
		&& $(call GLOB,'*') | xargs sed -Ei '' 's/[[:blank:]]+$$//g' \
		&& $(DONE)
