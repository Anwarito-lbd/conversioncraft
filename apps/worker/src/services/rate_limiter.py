import time
from collections import defaultdict, deque
from threading import Lock
from typing import Deque, Dict, Tuple


class RateLimiter:
    def __init__(self):
        self._events: Dict[str, Deque[float]] = defaultdict(deque)
        self._lock = Lock()

    def allow(self, key: str, limit: int, window_seconds: int) -> Tuple[bool, int]:
        now = time.time()
        with self._lock:
            bucket = self._events[key]
            cutoff = now - window_seconds
            while bucket and bucket[0] <= cutoff:
                bucket.popleft()

            if len(bucket) >= limit:
                retry_after = max(1, int(window_seconds - (now - bucket[0])))
                return False, retry_after

            bucket.append(now)
            return True, 0


rate_limiter = RateLimiter()
