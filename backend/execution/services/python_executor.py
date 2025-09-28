import docker
import uuid
import time
from typing import Dict, Any
import logging

# Set up logging
logger = logging.getLogger(__name__)

client = docker.from_env()

def run_python(code: str, timeout: int = 5) -> Dict[str, Any]:
    safe_code = code
    container = None
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

        logs = container.logs(stdout=True, stderr=True).decode("utf-8", errors="replace")

        result = {
            "status": 0 if container.attrs["State"]["ExitCode"] == 0 else 1,
            "output": logs[:2000],  # Truncate to prevent huge responses
        }
        return result

    except Exception as exception:
        result = {
            "status": 1,
            "error": str(exception)[:500],
            "output": "",
        }
        return result
    finally:
        if container:
            try:
                container.remove(force=True)
            except Exception as exception:
                logger.warning(f"Failed to remove container: {exception}")