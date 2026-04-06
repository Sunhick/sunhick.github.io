# Makefile for Jekyll Portfolio Site (Chirpy Theme)
# Author: Sunil Murthy

.PHONY: help install serve build clean deploy status push pull test doctor stop

help: ## Show this help message
	@echo "Jekyll Portfolio (Chirpy) - Available Commands:"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-15s\033[0m %s\n", $$1, $$2}'

# Development
install: ## Install dependencies
	bundle install

serve: ## Start development server
	bundle exec jekyll serve --incremental --drafts

serve-prod: ## Start server with production settings
	JEKYLL_ENV=production bundle exec jekyll serve

stop: ## Stop all running Jekyll server instances
	@pgrep -f "jekyll serve" | xargs kill 2>/dev/null || echo "No Jekyll servers running"

# Build
build: ## Build the site for production
	JEKYLL_ENV=production bundle exec jekyll build

build-dev: ## Build the site for development
	bundle exec jekyll build --drafts

# Maintenance
clean: ## Clean generated files and caches
	bundle exec jekyll clean
	rm -rf .sass-cache .jekyll-cache .jekyll-metadata

doctor: ## Run Jekyll doctor to check for issues
	bundle exec jekyll doctor

update: ## Update dependencies
	bundle update

# Git
status: ## Show git status
	git status

pull: ## Pull latest changes from remote
	git pull origin main

deploy: build ## Build and deploy to GitHub Pages
	@echo "Deploying to GitHub Pages..."
	git add .
	@read -p "Enter commit message: " msg; \
	git commit -m "$$msg"
	git push origin main

# Content
new-post: ## Create a new blog post (usage: make new-post TITLE="My New Post")
	@if [ -z "$(TITLE)" ]; then \
		echo "Error: make new-post TITLE=\"My New Post\""; \
		exit 1; \
	fi
	@DATE=$$(date +%Y-%m-%d); \
	TIME=$$(date +%H:%M:%S); \
	TZ=$$(date +%z); \
	SLUG=$$(echo "$(TITLE)" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9]/-/g' | sed 's/--*/-/g' | sed 's/^-\|-$$//g'); \
	FILE="_posts/$$DATE-$$SLUG.md"; \
	printf -- "---\ntitle: \"$(TITLE)\"\ndate: $$DATE $$TIME $$TZ\ncategories: []\ntags: []\n---\n\nWrite your post content here...\n" > $$FILE; \
	echo "Created: $$FILE"

new-tab: ## Create a new tab page (usage: make new-tab NAME="projects" ORDER=6)
	@if [ -z "$(NAME)" ]; then \
		echo "Error: make new-tab NAME=\"projects\" ORDER=6"; \
		exit 1; \
	fi
	@FILE="_tabs/$(NAME).md"; \
	TITLE=$$(echo "$(NAME)" | sed 's/.*/\u&/'); \
	printf -- "---\nlayout: page\nicon: fas fa-file\norder: $(ORDER)\ntitle: $$TITLE\n---\n\nPage content goes here...\n" > $$FILE; \
	echo "Created: $$FILE"

# Resume
resume-update: ## Copy resume PDF from LaTeX source
	@if [ -d "$(HOME)/prv/github/resume" ]; then \
		echo "Copy your built PDF to assets/resume/"; \
	else \
		echo "Resume source directory not found"; \
	fi

# Testing
test: doctor build ## Run doctor check and production build

# Info
info: ## Show environment information
	@echo "Ruby:    $$(ruby --version)"
	@echo "Bundler: $$(bundle --version)"
	@echo "Jekyll:  $$(bundle exec jekyll --version)"
	@echo "Theme:   $$(bundle info jekyll-theme-chirpy | head -1)"
	@echo "Branch:  $$(git branch --show-current)"

# Shortcuts
s: serve
b: build
c: clean
d: deploy
dev: clean install serve ## Full dev setup
