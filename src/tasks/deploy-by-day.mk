
# Nightly builds are configured as a scheduled CircleCI workflow on a per project basis

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
