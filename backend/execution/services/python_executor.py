import docker
import uuid
import time
import json
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


# ----------------------------------------------------------------------
# Function (LeetCode-style) judging
# ----------------------------------------------------------------------

# Prepended before the user's `class Solution`. Provides the node types and
# array<->node serialization the driver uses, so users write plain LeetCode code.
FUNCTION_PRELUDE = (
    "import json as _json, sys as _sys\n"
    "from typing import List, Optional, Dict, Tuple, Set\n"
    "from collections import deque as _deque, defaultdict, Counter\n"
    "import heapq, math, bisect, functools, itertools, re\n"
    "class ListNode:\n"
    "    def __init__(self, val=0, next=None):\n"
    "        self.val = val; self.next = next\n"
    "class TreeNode:\n"
    "    def __init__(self, val=0, left=None, right=None):\n"
    "        self.val = val; self.left = left; self.right = right\n"
    "def _build_list(arr):\n"
    "    head = None\n"
    "    for v in reversed(arr or []):\n"
    "        head = ListNode(v, head)\n"
    "    return head\n"
    "def _list_to_arr(node):\n"
    "    out = []\n"
    "    while node:\n"
    "        out.append(node.val); node = node.next\n"
    "    return out\n"
    "def _build_tree(arr):\n"
    "    if not arr:\n"
    "        return None\n"
    "    it = iter(arr); root = TreeNode(next(it)); q = _deque([root])\n"
    "    while q:\n"
    "        node = q.popleft()\n"
    "        try: lv = next(it)\n"
    "        except StopIteration: break\n"
    "        if lv is not None:\n"
    "            node.left = TreeNode(lv); q.append(node.left)\n"
    "        try: rv = next(it)\n"
    "        except StopIteration: break\n"
    "        if rv is not None:\n"
    "            node.right = TreeNode(rv); q.append(node.right)\n"
    "    return root\n"
    "def _tree_to_arr(root):\n"
    "    if not root:\n"
    "        return []\n"
    "    out = []; q = _deque([root])\n"
    "    while q:\n"
    "        node = q.popleft()\n"
    "        if node is None:\n"
    "            out.append(None); continue\n"
    "        out.append(node.val); q.append(node.left); q.append(node.right)\n"
    "    while out and out[-1] is None:\n"
    "        out.pop()\n"
    "    return out\n"
)


def _function_driver(entry_point: str, param_types: List[str], return_type: str) -> str:
    """Reads JSON args from stdin, calls Solution().<entry>, prints JSON result."""
    return (
        "\n\ndef _run_harness():\n"
        "    _raw = _json.loads(_sys.stdin.read() or '[]')\n"
        f"    _ptypes = {param_types!r}\n"
        "    def _conv(v, t):\n"
        "        if t == 'listnode': return _build_list(v)\n"
        "        if t == 'listnode[]': return [_build_list(x) for x in v]\n"
        "        if t == 'tree': return _build_tree(v)\n"
        "        return v\n"
        "    _args = [_conv(_raw[i], _ptypes[i] if i < len(_ptypes) else 'json') for i in range(len(_raw))]\n"
        f"    _res = Solution().{entry_point}(*_args)\n"
        f"    _rt = {return_type!r}\n"
        "    if _rt == 'listnode': _res = _list_to_arr(_res)\n"
        "    elif _rt == 'tree': _res = _tree_to_arr(_res)\n"
        "    elif _rt == 'arg0': _res = _args[0]\n"
        "    _sys.stdout.write(_json.dumps(_res))\n"
        "_run_harness()\n"
    )


def _canonical(value, mode: str):
    """Return a canonical form of a JSON value for comparison under `mode`."""
    if mode == "unordered" and isinstance(value, list):
        try:
            return sorted(value, key=lambda x: json.dumps(x, sort_keys=True))
        except TypeError:
            return value
    if mode == "unordered_nested" and isinstance(value, list):
        inner = []
        for item in value:
            if isinstance(item, list):
                try:
                    inner.append(sorted(item, key=lambda x: json.dumps(x, sort_keys=True)))
                except TypeError:
                    inner.append(item)
            else:
                inner.append(item)
        try:
            return sorted(inner, key=lambda x: json.dumps(x, sort_keys=True))
        except TypeError:
            return inner
    return value


def judge_function(code: str, test_cases: List[Dict[str, Any]], entry_point: str,
                   param_types: List[str] = None, return_type: str = "json",
                   compare_mode: str = "exact", timeout: int = 5):
    """
    Runs LeetCode-style code (a `class Solution` with `entry_point`) against
    function test cases (each {args, expected}). Returns per-case results + summary.
    """
    param_types = param_types or []
    driver = _function_driver(entry_point, param_types, return_type)
    results: List[Dict[str, Any]] = []

    for index, case in enumerate(test_cases):
        args = case.get("args", [])
        expected = case.get("expected")
        full_code = FUNCTION_PRELUDE + "\n" + code + driver
        result = run_python(full_code, timeout=timeout, stdin=json.dumps(args))
        raw = (result.get("output") or "").strip()

        if result.get("timeout"):
            verdict, error = "timeout", "Execution timed out."
        elif result.get("status") != 0:
            verdict, error = "error", (result.get("error") or raw or "Runtime error.")
        else:
            try:
                actual = json.loads(raw) if raw != "" else None
                ok = _canonical(actual, compare_mode) == _canonical(expected, compare_mode)
                verdict, error = ("passed", None) if ok else ("failed", None)
            except json.JSONDecodeError:
                verdict, error = "error", (raw or "Your function did not return a valid value.")

        results.append({
            "name": case.get("name") or f"Case {index + 1}",
            "stdin": json.dumps(args),
            "expected_output": json.dumps(expected),
            "actual_output": raw,
            "verdict": verdict,
            "execution_time_ms": result.get("execution_time_ms"),
            "error": error,
        })

    passed = sum(1 for r in results if r["verdict"] == "passed")
    total = len(results)
    return results, {"passed": passed, "total": total, "all_passed": passed == total}


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