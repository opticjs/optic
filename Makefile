.PHONY: build clean serve

clean:
	@rm -rf dist tmp lib

build: clean
	@broccoli build dist

build_lib: clean
	@NODE_ENV=production broccoli build lib

serve: clean
	@broccoli serve

