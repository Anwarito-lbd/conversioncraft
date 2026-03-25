import random
import time
from typing import Any, Dict

import requests


class RetryHttpClient:
    def request(
        self,
        method: str,
        url: str,
        *,
        retries: int = 3,
        backoff_seconds: float = 0.5,
        timeout: int = 30,
        retry_statuses: tuple[int, ...] = (429, 500, 502, 503, 504),
        **kwargs: Any,
    ) -> requests.Response:
        last_error: Exception | None = None

        for attempt in range(retries + 1):
            try:
                response = requests.request(method=method, url=url, timeout=timeout, **kwargs)
                if response.status_code in retry_statuses and attempt < retries:
                    sleep_for = backoff_seconds * (2**attempt) + random.uniform(0, 0.25)
                    time.sleep(sleep_for)
                    continue
                response.raise_for_status()
                return response
            except requests.RequestException as exc:
                last_error = exc
                if attempt >= retries:
                    break
                sleep_for = backoff_seconds * (2**attempt) + random.uniform(0, 0.25)
                time.sleep(sleep_for)

        raise RuntimeError(f"HTTP request failed after retries: {last_error}")


http_client = RetryHttpClient()
