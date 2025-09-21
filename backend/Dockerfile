FROM python:3.11-slim

# prevents Python from creating .pyc files. These are compiled bytecode files. Helps keep your image clean.
# ensures logs are printed immediately.
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    UV_PROJECT_ENVIRONMENT=/app/.venv


#his uses multi-stage copy to grab the uv binary from a pre-built image and put it in /bin.
#this avoids installing uv via pip or building from source — faster and smaller image.
COPY --from=ghcr.io/astral-sh/uv:0.8.4 /uv /bin/uv


# Instead of running commands from the root of the container, we create and
# switch to a dedicated directory. This keeps our project files organized.
WORKDIR /app

# Copies dependency definitions into a separate folder _lock.
# They won’t be included in the runtime image if you later choose to clean up _lock.
# The trailing slash makes COPY create `/_lock/` automagically.
COPY pyproject.toml uv.lock /_lock/


# Synchronize dependencies.
# This layer is cached until uv.lock or pyproject.toml change.
RUN --mount=type=cache,target=/root/.cache \
    cd /_lock && \
    uv sync \
    --frozen 


ENV PATH="/app/.venv/bin:$PATH"


COPY . .

EXPOSE 8000

CMD ["python", "-m", "daphne", "bug_hunt_project.asgi:application", "--host", "0.0.0.0", "--port", "8000"]
