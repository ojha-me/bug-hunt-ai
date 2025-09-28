from ninja import Router
from users.utils.ninja import post
from django.http import HttpRequest
from execution.services.python_executor import run_python
from .api_types import RunParams, RunResponse

router = Router(tags=["execution"])

@post(router, "run", response={200: RunResponse})
def run(request: HttpRequest, params: RunParams):
    if params.language != "python":
        return RunResponse(
            output="",
            error="Only Python is supported in this demo."
        )
    
    result = run_python(params.code, timeout=5)
    
    response = RunResponse(
        output=result.get("output", ""),
        error=result.get("error"),
    )
    
    return response