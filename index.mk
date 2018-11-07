$(info local)
# find out where we are so we can include things relatively. MAKEFILE_LIST is the list
# of all included makefiles; this makefile will be the most recent one
this-makefile = $(realpath $(lastword $(MAKEFILE_LIST)))
ngage-dir := $(dir $(this-makefile))

# empty rule to prevent tasks matching their own filenames and trying to remake themselves
$(ngage-dir)src/%.mk: ;

# include all tasks
include $(ngage-dir)src/setup.mk
include $(ngage-dir)src/tasks/*.mk
