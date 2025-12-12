.PHONY: help dev dev-up dev-down dev-logs prod-build prod-up prod-down prod-logs db-migrate db-studio db-seed db-generate clean install build lint npm-install npm-install-package npm-install-dev npm-update npm-uninstall npm-audit npm-audit-fix npm-list npm-outdated npm-ci

# Docker Compose command (use 'docker compose' v2 or 'docker-compose' v1)
# Set USE_SUDO=1 to use sudo, or USE_SUDO=0 to run without sudo
USE_SUDO ?= 1

# Try docker compose v2 first, fallback to docker-compose v1
DOCKER_COMPOSE_V2 = $(if $(filter 1,$(USE_SUDO)),sudo docker compose,docker compose)
DOCKER_COMPOSE_V1 = $(if $(filter 1,$(USE_SUDO)),sudo docker-compose,docker-compose)

# Check which version is available (default to v2)
DOCKER_COMPOSE = $(DOCKER_COMPOSE_V2)

help: ## Show this help message
	@echo 'Usage: make [target]'
	@echo ''
	@echo 'Available targets:'
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  %-20s %s\n", $$1, $$2}' $(MAKEFILE_LIST)
	@echo ''
	@echo 'Environment variables:'
	@echo '  USE_SUDO=1    Use sudo for docker commands (default: 1)'
	@echo '  USE_SUDO=0    Run docker commands without sudo'
	@echo ''
	@echo 'Package installation examples:'
	@echo '  make npm-install-package lodash'
	@echo '  make npm-install-package @hookform/resolvers zod'
	@echo '  make npm-install-package PACKAGE="@hookform/resolvers zod"'
	@echo '  make npm-install-dev @types/lodash @types/node'
	@echo '  make npm-uninstall package1 package2'

# Development commands
dev-up: ## Start development environment
	$(DOCKER_COMPOSE) up -d

dev-down: ## Stop development environment
	$(DOCKER_COMPOSE) down

dev-logs: ## View development logs
	$(DOCKER_COMPOSE) logs -f

dev: dev-up dev-logs ## Start dev and follow logs

dev-restart: dev-down dev-up ## Restart development environment

# Production commands
prod-build: ## Build production images
	$(DOCKER_COMPOSE) -f docker-compose.prod.yml build

prod-up: ## Start production environment
	$(DOCKER_COMPOSE) -f docker-compose.prod.yml up -d

prod-down: ## Stop production environment
	$(DOCKER_COMPOSE) -f docker-compose.prod.yml down

prod-logs: ## View production logs
	$(DOCKER_COMPOSE) -f docker-compose.prod.yml logs -f

prod: prod-build prod-up ## Build and start production

prod-restart: prod-down prod-up ## Restart production environment

# Database commands
db-migrate: ## Run database migrations
	$(DOCKER_COMPOSE) exec app npx prisma migrate deploy

db-push: ## Push database schema changes (dev only)
	$(DOCKER_COMPOSE) exec app npx prisma db push

db-studio: ## Open Prisma Studio
	$(DOCKER_COMPOSE) exec app npx prisma studio

db-generate: ## Generate Prisma Client
	$(DOCKER_COMPOSE) exec app npx prisma generate

db-seed: ## Seed database with sample data
	$(DOCKER_COMPOSE) exec app npm run seed

db-reset: ## Reset database (WARNING: deletes all data)
	$(DOCKER_COMPOSE) exec app npx prisma migrate reset --force

# NPM commands in container
npm-install: ## Install npm dependencies in container
	$(DOCKER_COMPOSE) exec app npm install

# Allow passing packages as arguments or via PACKAGE variable
npm-install-package: ## Install packages in container (usage: make npm-install-package @hookform/resolvers zod or make npm-install-package PACKAGE="package1 package2")
	@if [ -z "$(PACKAGE)" ] && [ -z "$(filter-out $@,$(MAKECMDGOALS))" ]; then \
		echo "Error: Please provide packages. Usage: make npm-install-package @hookform/resolvers zod"; \
		echo "   or: make npm-install-package PACKAGE=\"package1 package2\""; \
		exit 1; \
	fi
	@PACKAGES="$(PACKAGE)"; \
	if [ -z "$$PACKAGES" ]; then \
		PACKAGES="$(filter-out $@,$(MAKECMDGOALS))"; \
	fi; \
	$(DOCKER_COMPOSE) exec app npm install $$PACKAGES

npm-install-dev: ## Install dev dependencies in container (usage: make npm-install-dev @types/lodash @types/node or make npm-install-dev PACKAGE="package1 package2")
	@if [ -z "$(PACKAGE)" ] && [ -z "$(filter-out $@,$(MAKECMDGOALS))" ]; then \
		echo "Error: Please provide packages. Usage: make npm-install-dev @types/lodash @types/node"; \
		echo "   or: make npm-install-dev PACKAGE=\"package1 package2\""; \
		exit 1; \
	fi
	@PACKAGES="$(PACKAGE)"; \
	if [ -z "$$PACKAGES" ]; then \
		PACKAGES="$(filter-out $@,$(MAKECMDGOALS))"; \
	fi; \
	$(DOCKER_COMPOSE) exec app npm install --save-dev $$PACKAGES

npm-update: ## Update npm packages in container
	$(DOCKER_COMPOSE) exec app npm update

npm-uninstall: ## Uninstall packages from container (usage: make npm-uninstall package1 package2 or make npm-uninstall PACKAGE="package1 package2")
	@if [ -z "$(PACKAGE)" ] && [ -z "$(filter-out $@,$(MAKECMDGOALS))" ]; then \
		echo "Error: Please provide packages. Usage: make npm-uninstall package1 package2"; \
		echo "   or: make npm-uninstall PACKAGE=\"package1 package2\""; \
		exit 1; \
	fi
	@PACKAGES="$(PACKAGE)"; \
	if [ -z "$$PACKAGES" ]; then \
		PACKAGES="$(filter-out $@,$(MAKECMDGOALS))"; \
	fi; \
	$(DOCKER_COMPOSE) exec app npm uninstall $$PACKAGES

npm-audit: ## Run npm audit in container
	$(DOCKER_COMPOSE) exec app npm audit

npm-audit-fix: ## Fix npm audit issues in container
	$(DOCKER_COMPOSE) exec app npm audit fix

npm-list: ## List installed packages in container
	$(DOCKER_COMPOSE) exec app npm list --depth=0

npm-outdated: ## Check for outdated packages in container
	$(DOCKER_COMPOSE) exec app npm outdated

npm-ci: ## Clean install in container (removes node_modules and reinstalls)
	$(DOCKER_COMPOSE) exec app sh -c "rm -rf node_modules package-lock.json && npm install"

# Local development commands (without Docker)
install: ## Install npm dependencies locally
	npm install

build: ## Build Next.js application
	npm run build

lint: ## Run ESLint
	npm run lint

dev-local: ## Run Next.js dev server locally (requires local DB)
	npm run dev

seed-local: ## Run seed script locally (requires local DB)
	npm run seed

# Utility commands
clean: ## Remove all containers, volumes, and images
	$(DOCKER_COMPOSE) down -v
	$(if $(wildcard docker-compose.prod.yml),$(DOCKER_COMPOSE) -f docker-compose.prod.yml down -v,)
	$(if $(filter 1,$(USE_SUDO)),sudo docker system prune -af,docker system prune -af)

clean-volumes: ## Remove only Docker volumes (keeps containers)
	$(DOCKER_COMPOSE) down -v

shell: ## Open shell in app container
	$(DOCKER_COMPOSE) exec app sh

shell-db: ## Open PostgreSQL shell
	$(DOCKER_COMPOSE) exec postgres psql -U postgres -d oly_portfolio

ps: ## Show running containers
	$(DOCKER_COMPOSE) ps

logs-app: ## View app container logs only
	$(DOCKER_COMPOSE) logs -f app

logs-db: ## View database container logs only
	$(DOCKER_COMPOSE) logs -f postgres

# Setup commands
setup: install db-generate ## Initial setup: install deps and generate Prisma client
	@echo "Setup complete! Run 'make dev-up' to start the development environment."

setup-full: setup dev-up db-migrate db-seed ## Full setup: install, start containers, migrate, and seed
	@echo "Full setup complete! Your application should be running at http://localhost:3000"

# Prevent Make from treating package names as targets
%:
	@:

