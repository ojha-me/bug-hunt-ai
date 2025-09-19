from ninja import Router
from typing import Dict, Any, Callable
from users.utils.auth import JWTAuth
import functools

RATE_LIMIT = ["1000/h", "100/m", "10/s"]


def setup_route(
    method: str,
    router: Router,
    path: str,
    response: Dict[int, Any],
    auth: Any = None,
):
    """
    Factory that returns a decorator.
    This decorator will register the route with the router.
    """

    def decorator(view_func: Callable):
        """This is the actual decorator that wraps your view function."""

        # Ninja relies on the original function signature to inject body/query/path parameters.
        # this @functools.wraps allows Ninja to track the signature and pass params.
        @functools.wraps(view_func)
        def wrapper(request, *args, **kwargs):
            return view_func(request, *args, **kwargs)

        router.add_api_operation(
            path,
            [method],
            wrapper,
            auth=auth() if auth and callable(auth) else auth,
            response=response,
        )

        return wrapper 

    return decorator

def get(router: Router, path: str, response: Dict[int, Any], **kwargs):
    return setup_route("GET", router, path, response, auth=JWTAuth, **kwargs)

def post(router: Router, path: str, response: Dict[int, Any], **kwargs):
    return setup_route("POST", router, path, response, auth=JWTAuth, **kwargs)

def public_get(router: Router, path: str, response: Dict[int, Any], **kwargs):
    return setup_route("GET", router, path, response, auth=None, **kwargs)

def public_post(router: Router, path: str, response: Dict[int, Any], **kwargs):
    return setup_route("POST", router, path, response, auth=None, **kwargs)