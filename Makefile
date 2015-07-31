.PHONY: build clean serve

clean:
	@rm -rf dist tmp

build: clean
	@broccoli build dist

serve: clean
	@broccoli serve

