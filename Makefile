files := index.html
files += style.css
files += script.js

all: pretty lint

pretty:
	prettier -w --print-width 120 *.js *.html *.css

lint:
	npx eslint *.js


publish:
	./publish.sh $(files)
