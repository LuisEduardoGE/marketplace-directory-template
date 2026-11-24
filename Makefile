.DEFAULT_GOAL := help
.PHONY: help run test lint

PYTHON ?= $(shell command -v python3 >/dev/null 2>&1 && echo python3 || echo python)

help: ## List available targets
	@grep -E '^[a-zA-Z_-]+:.*?## ' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  %-6s %s\n", $$1, $$2}'

run: ## Serve the site on a free local port (or PORT=8080)
	@port=$${PORT:-$$($(PYTHON) -c "import socket; s = socket.socket(); s.bind((\"127.0.0.1\", 0)); print(s.getsockname()[1])")}; \
	echo "Serving on http://localhost:$$port (Ctrl+C to stop)"; \
	$(PYTHON) -m http.server $$port --bind 127.0.0.1

test: ## Validate config.js and the CSV in data/ (node --test)
	node --test tests/*.test.mjs

lint: ## Syntax-check the JavaScript (node --check)
	node --check config.js
	node --check scripts/app.js
