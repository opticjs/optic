.PHONY: build clean serve build_lib

clean:
	@rm -rf dist tmp lib

build: clean
	@broccoli build dist

build_lib: clean
	@NODE_ENV=production broccoli build lib

serve: clean
	@NODE_ENV=development broccoli serve

