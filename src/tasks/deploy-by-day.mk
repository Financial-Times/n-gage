
# Wrapper for make deploy which prevents it running when build is a nightly
# Nightly builds are trigger by next-rebuild-bot
# If a nightly build is triggered during the day, we want it to deploy since it is a rerun build!
# CircleCI runs in UTC, so give an hour leeway each way.

HOUR = $(shell date +%H)

deploy-by-day:
ifeq ($(FT_NIGHTLY_BUILD),)
	$(MAKE) deploy
else
	@echo "The hour is $(HOUR)";
	@if [ $(HOUR) -gt 8 -a $(HOUR) -lt 19 ] ; then \
		echo "Nightly build can deploy between 8am and 7pm, so deploying..."; $(MAKE) deploy; \
	else \
		echo "Nightly build and out of hours - exiting before deploy"; \
	fi;
endif
