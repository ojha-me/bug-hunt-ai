from pydantic2ts import generate_typescript_defs


# ai_core api_types
generate_typescript_defs("ai_core.api_types", "../frontend/src/types/ai_core/api_types.ts")

# users api_types
generate_typescript_defs("users.api_types", "../frontend/src/types/users/api_types.ts")

# execution api_types
generate_typescript_defs("execution.api_types", "../frontend/src/types/execution/api_types.ts")

# learning_path_types 
generate_typescript_defs("learning_paths.api_types", "../frontend/src/types/learning_paths/api_types.ts")
