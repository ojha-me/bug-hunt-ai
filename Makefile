# Makefile
.PHONY: dev backend frontend migrate migrate-make migrate-run types

# Start both servers
dev:
	cd backend && python manage.py runserver &
	cd frontend && yarn dev

# Backend server
backend:
	cd backend && python manage.py runserver

# ASGI server (if using uvicorn)
asgi:
	cd backend && uvicorn bug_hunt_project.asgi:application --reload

# Frontend
frontend:
	cd frontend && yarn dev

# Generate TypeScript types
types:
	cd backend && python manage.py shell < scripts/generate_pydantic_ts_types.py

# Make and apply migrations
migrate-make:
	cd backend && python manage.py makemigrations

migrate-run:
	cd backend && python manage.py migrate

# One command to make + run migrations
migrate: migrate-make migrate-run