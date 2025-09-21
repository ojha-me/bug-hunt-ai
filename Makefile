# Makefile for BugHunt AI Project

# Use docker-compose as the command, which is an alias for `docker compose` on newer systems.
COMPOSE_CMD = docker-compose

# Define service names for easier reference
BACKEND_SERVICE = backend
FRONTEND_SERVICE = frontend

.PHONY: help build up down stop logs db-reset migrate makemigrations shell-backend add-backend-pkg add-frontend-pkg

help: ## ✨ Show this help message
	@echo "Usage: make [target]"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

# --- Image and Container Management ---
build: ## Build or rebuild all service images
	$(COMPOSE_CMD) build

up: ## Start all services in the background (detached mode)
	$(COMPOSE_CMD) up -d

down: ## Stop and remove all services and networks
	$(COMPOSE_CMD) down

stop: ## Stop services without removing them
	$(COMPOSE_CMD) stop

logs: ## View live logs from all running services
	$(COMPOSE_CMD) logs -f

# --- Database and Migration Management ---
db-reset: down ## Nuke the database and start fresh with migrations
	@echo "--> Wiping database volume..."
	$(COMPOSE_CMD) down -v
	@echo "--> Starting services and applying migrations..."
	$(MAKE) up
	@echo "--> Waiting for database to initialize..."
	@sleep 5
	$(MAKE) migrate
	@echo "--> Database reset complete!"

migrate: ## Apply database migrations to the running backend
	$(COMPOSE_CMD) exec $(BACKEND_SERVICE) python manage.py migrate

makemigrations: ## Create new database migrations for an app
	@read -p "Enter Django app name to create migrations for: " app_name; \
	$(COMPOSE_CMD) exec $(BACKEND_SERVICE) python manage.py makemigrations $$app_name

# --- Package Management ---
add-backend-pkg: ## Add a Python package to the backend
	@read -p "Enter Python package name to install (e.g., 'requests'): " pkg_name; \
	$(COMPOSE_CMD) exec $(BACKEND_SERVICE) uv pip install $$pkg_name
	@echo "\n\033[1;33m--> IMPORTANT: Manually add '$$pkg_name' to your backend/pyproject.toml and run 'uv lock' locally!\033[0m"

add-frontend-pkg: ## Add a Node package to the frontend
	@read -p "Enter Node package name to add (e.g., 'axios'): " pkg_name; \
	$(COMPOSE_CMD) exec $(FRONTEND_SERVICE) yarn add $$pkg_name

# --- Development Helpers ---
shell-backend: ## Open a bash shell inside the backend container
	$(COMPOSE_CMD) exec $(BACKEND_SERVICE) bash