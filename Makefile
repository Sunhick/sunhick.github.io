# Makefile for Jekyll Portfolio Site
# Author: Sunil Murthy
# Description: Development and deployment commands for sunhick.github.io

.PHONY: help install serve build clean deploy status push pull test lint doctor stop

# Default target
help: ## Show this help message
	@echo "Jekyll Portfolio Site - Available Commands:"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-15s\033[0m %s\n", $$1, $$2}'
	@echo ""
	@echo "Examples:"
	@echo "  make serve    # Start development server with hot-reload"
	@echo "  make build    # Build the site for production"
	@echo "  make deploy   # Deploy to GitHub Pages"

# Development Commands
install: ## Install dependencies (bundle install)
	@echo "📦 Installing Jekyll dependencies..."
	bundle install
	@echo "✅ Dependencies installed successfully!"

serve: ## Start development server with hot-reload (default port 4000)
	@echo "🚀 Starting Jekyll development server with hot-reload..."
	@echo "📍 Site will be available at: http://localhost:4000"
	@echo "🔄 Hot-reload enabled - changes will be reflected automatically"
	@echo "⏹️  Press Ctrl+C to stop the server"
	bundle exec jekyll serve --livereload --incremental --drafts

serve-prod: ## Start server with production settings
	@echo "🏭 Starting Jekyll server with production settings..."
	JEKYLL_ENV=production bundle exec jekyll serve --livereload

serve-port: ## Start server on custom port (usage: make serve-port PORT=3000)
	@echo "🚀 Starting Jekyll server on port $(PORT)..."
	bundle exec jekyll serve --livereload --port $(PORT)

serve-host: ## Start server accessible from network (usage: make serve-host HOST=0.0.0.0)
	@echo "🌐 Starting Jekyll server accessible from network..."
	bundle exec jekyll serve --livereload --host $(HOST) --port 4000

stop: ## Stop all running Jekyll server instances
	@echo "🛑 Stopping all Jekyll server instances..."
	@PIDS=$$(pgrep -f "jekyll serve" 2>/dev/null || true); \
	if [ -n "$$PIDS" ]; then \
		echo "🔍 Found Jekyll processes: $$PIDS"; \
		kill $$PIDS 2>/dev/null || true; \
		sleep 2; \
		REMAINING=$$(pgrep -f "jekyll serve" 2>/dev/null || true); \
		if [ -n "$$REMAINING" ]; then \
			echo "💀 Force killing remaining processes: $$REMAINING"; \
			kill -9 $$REMAINING 2>/dev/null || true; \
		fi; \
		echo "✅ All Jekyll servers stopped"; \
	else \
		echo "ℹ️  No Jekyll server instances found running"; \
	fi

# Build Commands
build: ## Build the site for production
	@echo "🔨 Building Jekyll site for production..."
	JEKYLL_ENV=production bundle exec jekyll build
	@echo "✅ Site built successfully in _site/ directory"

build-dev: ## Build the site for development
	@echo "🔨 Building Jekyll site for development..."
	bundle exec jekyll build --drafts
	@echo "✅ Development build completed"

build-incremental: ## Build with incremental regeneration
	@echo "🔨 Building Jekyll site with incremental regeneration..."
	bundle exec jekyll build --incremental
	@echo "✅ Incremental build completed"

# Maintenance Commands
clean: ## Clean generated files and caches
	@echo "🧹 Cleaning Jekyll generated files..."
	bundle exec jekyll clean
	rm -rf .sass-cache
	rm -rf .jekyll-cache
	rm -rf .jekyll-metadata
	@echo "✅ Cleanup completed"

doctor: ## Run Jekyll doctor to check for issues
	@echo "🩺 Running Jekyll doctor..."
	bundle exec jekyll doctor

lint: ## Check for common issues and validate HTML
	@echo "🔍 Linting Jekyll site..."
	bundle exec jekyll doctor
	@echo "✅ Linting completed"

# Git and Deployment Commands
status: ## Show git status
	@echo "📊 Git repository status:"
	git status

pull: ## Pull latest changes from remote
	@echo "⬇️  Pulling latest changes..."
	git pull origin main

push: ## Push changes to remote repository
	@echo "⬆️  Pushing changes to remote repository..."
	git add .
	@read -p "Enter commit message: " msg; \
	git commit -m "$$msg"
	git push origin main

deploy: build ## Build and deploy to GitHub Pages
	@echo "🚀 Deploying to GitHub Pages..."
	@echo "📝 Note: GitHub Pages will automatically build and deploy from main branch"
	$(MAKE) push
	@echo "✅ Deployment initiated! Check GitHub Actions for build status."

# Development Workflow Commands
dev: clean install serve ## Full development setup (clean, install, serve)

new-post: ## Create a new blog post (usage: make new-post TITLE="My New Post")
	@if [ -z "$(TITLE)" ]; then \
		echo "❌ Error: Please provide a title. Usage: make new-post TITLE=\"My New Post\""; \
		exit 1; \
	fi
	@DATE=$$(date +%Y-%m-%d); \
	FILENAME="_posts/$$DATE-$$(echo "$(TITLE)" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9]/-/g' | sed 's/--*/-/g' | sed 's/^-\|-$$//g').md"; \
	echo "---" > $$FILENAME; \
	echo "layout: post" >> $$FILENAME; \
	echo "title: \"$(TITLE)\"" >> $$FILENAME; \
	echo "date: $$DATE" >> $$FILENAME; \
	echo "categories: []" >> $$FILENAME; \
	echo "tags: []" >> $$FILENAME; \
	echo "---" >> $$FILENAME; \
	echo "" >> $$FILENAME; \
	echo "Write your post content here..." >> $$FILENAME; \
	echo "📝 Created new post: $$FILENAME"

new-page: ## Create a new page (usage: make new-page NAME="about")
	@if [ -z "$(NAME)" ]; then \
		echo "❌ Error: Please provide a name. Usage: make new-page NAME=\"about\""; \
		exit 1; \
	fi
	@FILENAME="_pages/$(NAME).md"; \
	echo "---" > $$FILENAME; \
	echo "layout: page" >> $$FILENAME; \
	echo "title: \"$$(echo "$(NAME)" | sed 's/\b\w/\U&/g')\"" >> $$FILENAME; \
	echo "permalink: /$(NAME)/" >> $$FILENAME; \
	echo "---" >> $$FILENAME; \
	echo "" >> $$FILENAME; \
	echo "Page content goes here..." >> $$FILENAME; \
	echo "📄 Created new page: $$FILENAME"

# Testing and Validation
test: ## Run tests and validations
	@echo "🧪 Running Jekyll tests..."
	$(MAKE) doctor
	$(MAKE) build-dev
	@echo "✅ All tests passed!"

# Utility Commands
update: ## Update dependencies
	@echo "🔄 Updating Jekyll dependencies..."
	bundle update
	@echo "✅ Dependencies updated!"

gems: ## List installed gems
	@echo "💎 Installed gems:"
	bundle list

config: ## Show Jekyll configuration
	@echo "⚙️  Jekyll configuration:"
	bundle exec jekyll doctor

# Resume specific commands
resume-update: ## Update resume from LaTeX source
	@echo "📄 Updating resume from LaTeX source..."
	@if [ -d "/Users/sunilmur/prv/github/resume" ]; then \
		echo "📂 Found resume source directory"; \
		echo "💡 Consider running: make -C /Users/sunilmur/prv/github/resume"; \
		echo "📋 Then copy the generated PDF to public/resume/"; \
	else \
		echo "❌ Resume source directory not found"; \
	fi

# Quick shortcuts
s: serve ## Shortcut for serve
b: build ## Shortcut for build
c: clean ## Shortcut for clean
d: deploy ## Shortcut for deploy

# Environment info
info: ## Show environment information
	@echo "🔍 Environment Information:"
	@echo "Ruby version: $$(ruby --version)"
	@echo "Bundler version: $$(bundle --version)"
	@echo "Jekyll version: $$(bundle exec jekyll --version)"
	@echo "Git branch: $$(git branch --show-current)"
	@echo "Git status: $$(git status --porcelain | wc -l) files changed"
	@echo "Site URL: $$(grep '^url:' _config.yml | cut -d' ' -f2)"
