from pydantic2ts import generate_typescript_defs


# ai_core api_types
generate_typescript_defs("ai_core.api_types", "frontend/src/types/ai_core/api_types.ts")

# users api_types
generate_typescript_defs("users.api_types", "frontend/src/types/users/api_types.ts")
