FROM python:3.11-slim

# prevents Python from creating .pyc files. These are compiled bytecode files. Helps keep your image clean.
# ensures logs are printed immediately.
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

#his uses multi-stage copy to grab the uv binary from a pre-built image and put it in /bin.
#this avoids installing uv via pip or building from source — faster and smaller image.
COPY --from=ghcr.io/astral-sh/uv:0.8.4 /uv /bin/uv


# Instead of running commands from the root of the container, we create and
# switch to a dedicated directory. This keeps our project files organized.
WORKDIR /app

# Copy dependency files to /app (project root) for proper uv detection
COPY pyproject.toml uv.lock ./

# Sync dependencies in project root (installs to /app/.venv)
RUN --mount=type=cache,target=/root/.cache \
    uv sync --locked

ENV PATH="/app/.venv/bin:$PATH"

COPY . .

EXPOSE 8000

CMD ["python", "-m", "uvicorn", "bug_hunt_project.asgi:application", "--host", "0.0.0.0", "--port", "8000", "--reload"]
