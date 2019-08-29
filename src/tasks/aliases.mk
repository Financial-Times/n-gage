# some aliases
css:
	$(call WARN,DEPRECATED: This is an n-ui specific task. It will not work for applications not built using n-ui.)
	nui build --sass-only
js:
	$(call WARN,DEPRECATED: This is an n-ui specific task. It will not work for applications not built using n-ui.)
	nui build --js-only
