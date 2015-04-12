.PHONY: build clean

clean:
	rm -rf dist tmp

build: clean
	broccoli build dist
