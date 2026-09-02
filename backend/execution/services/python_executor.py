import docker
import uuid
import time
import base64
from typing import Dict, Any, List
import logging

# Set up logging
logger = logging.getLogger(__name__)

client = docker.from_env()


def _wrap_stdin(code: str, stdin: str) -> str:
    """
    Prepend a small prologue that rewires sys.stdin to a string decoded from
    base64, so arbitrary user input can be passed without shell quoting issues.
    """
    if not stdin:
        return code
    encoded = base64.b64encode(stdin.encode("utf-8")).decode("ascii")
    prologue = (
        "import base64 as _b, io as _i, sys as _s\n"
        f"_s.stdin = _i.StringIO(_b.b64decode('{encoded}').decode('utf-8'))\n"
    )
    return prologue + code


def run_python(code: str, timeout: int = 5, stdin: str = "") -> Dict[str, Any]:
    safe_code = _wrap_stdin(code, stdin)
    container = None
    timed_out = False
    try:
        container_name = f"sandbox-{uuid.uuid4().hex[:8]}"
        logger.info(f"[Python Executor] Creating container with name: {container_name}")

        container = client.containers.run(
            image="python:3.11-slim",
            command=["python", "-c", f'{safe_code}'],
            name=container_name,
            detach=True,
            # security hardening
            network_disabled=True,          # No network
            mem_limit="128m",               # RAM cap
            cpu_quota=50000,                # 0.5 CPU
            pids_limit=32,                  # Max processes
            cap_drop=["ALL"],               # Drop all capabilities
            read_only=True,                 # Root FS read-only
            tmpfs={"/tmp": "size=16m,mode=1777"},  # Writable temp
            user="1000:1000",               # Non-root user
            security_opt=["no-new-privileges"],
            remove=False,
        )
        logger.info(f"[Python Executor] Container created successfully: {container.id}")

        start_time = time.time()

        while container.status != "exited" and (time.time() - start_time) < timeout:
            time.sleep(0.05)
            container.reload()

        if container.status != "exited":
            container.kill()
            timed_out = True

        logs = container.logs(stdout=True, stderr=True).decode("utf-8", errors="replace")

        exit_code = container.attrs["State"]["ExitCode"]
        execution_time_ms = int((time.time() - start_time) * 1000)

        result = {
            "status": 0 if exit_code == 0 else 1,
            "output": logs[:2000],  # Truncate to prevent huge responses
            "execution_time_ms": execution_time_ms,
            "timeout": timed_out,
        }
        if exit_code != 0:
            result["error"] = logs[:2000] or f"Process exited with code {exit_code}"
        return result

    except Exception as exception:
        result = {
            "status": 1,
            "error": str(exception)[:500],
            "output": "",
            "execution_time_ms": None,
            "timeout": False,
        }
        return result
    finally:
        if container:
            try:
                container.remove(force=True)
            except Exception as exception:
                logger.warning(f"Failed to remove container: {exception}")


def _normalize_output(text: str) -> List[str]:
    """Splits output into lines with trailing whitespace trimmed. Blank output == []."""
    return [line.rstrip() for line in (text or "").strip().splitlines()]


def judge_python(code: str, test_cases: List[Dict[str, Any]], timeout: int = 4) -> (List[Dict[str, Any]], Dict[str, Any]):
    """
    Runs user code against each test case (stdin -> expected stdout) and returns
    a list of per-case results plus a summary dict.
    """
    results: List[Dict[str, Any]] = []
    for index, case in enumerate(test_cases):
        result = run_python(code, timeout=timeout, stdin=case.get("stdin", ""))
        actual_output = result.get("output", "")
        expected_output = str(case.get("expected_output", ""))

        if result.get("timeout"):
            verdict = "timeout"
            error = "Execution timed out."
        elif result.get("status") != 0:
            verdict = "error"
            error = result.get("error") or result.get("output") or "Runtime error."
        elif _normalize_output(actual_output) == _normalize_output(expected_output):
            verdict = "passed"
            error = None
        else:
            verdict = "failed"
            error = None

        results.append({
            "name": case.get("name") or f"Case {index + 1}",
            "stdin": case.get("stdin", ""),
            "expected_output": expected_output,
            "actual_output": actual_output,
            "verdict": verdict,
            "execution_time_ms": result.get("execution_time_ms"),
            "error": error,
        })

    passed = sum(1 for r in results if r["verdict"] == "passed")
    total = len(results)
    summary = {
        "passed": passed,
        "total": total,
        "all_passed": passed == total,
    }
    return results, summary