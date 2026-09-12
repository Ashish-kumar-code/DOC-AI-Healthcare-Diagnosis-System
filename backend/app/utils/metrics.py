"""
Application metrics collection for DOC AI.
In-memory metrics with Prometheus-compatible export endpoint.
"""

import threading
from collections import defaultdict
from datetime import datetime, timezone
from time import time


class MetricsCollector:
    """Thread-safe in-memory metrics collector."""

    _instance = None
    _lock = threading.Lock()

    def __new__(cls):
        if cls._instance is None:
            with cls._lock:
                if cls._instance is None:
                    cls._instance = super().__new__(cls)
                    cls._instance._initialized = False
        return cls._instance

    def __init__(self):
        if self._initialized:
            return
        self._initialized = True
        self._lock = threading.Lock()

        # Application startup time
        self.start_time = time()
        self.start_datetime = datetime.now(timezone.utc)

        # Request metrics
        self.request_count = defaultdict(int)       # {method_path: count}
        self.request_errors = defaultdict(int)       # {method_path: error_count}
        self.request_latency_sum = defaultdict(float)  # {method_path: total_ms}
        self.request_latency_count = defaultdict(int)
        self.status_codes = defaultdict(int)          # {status_code: count}

        # ML inference metrics
        self.ml_inference_count = defaultdict(int)     # {model_name: count}
        self.ml_inference_latency_sum = defaultdict(float)
        self.ml_inference_errors = defaultdict(int)
        self.ml_confidence_sum = defaultdict(float)
        self.ml_predictions = defaultdict(lambda: defaultdict(int))  # {model: {prediction: count}}

        # Global counters
        self.total_requests = 0
        self.total_errors = 0
        self.active_requests = 0

    def record_request(self, method, path, status_code, duration_ms):
        """Record a completed HTTP request."""
        key = f"{method} {path}"
        with self._lock:
            self.total_requests += 1
            self.request_count[key] += 1
            self.request_latency_sum[key] += duration_ms
            self.request_latency_count[key] += 1
            self.status_codes[status_code] += 1
            if status_code >= 400:
                self.total_errors += 1
                self.request_errors[key] += 1

    def record_ml_inference(self, model_name, duration_ms, prediction=None,
                            confidence=None, error=False):
        """Record an ML model inference."""
        with self._lock:
            self.ml_inference_count[model_name] += 1
            self.ml_inference_latency_sum[model_name] += duration_ms
            if error:
                self.ml_inference_errors[model_name] += 1
            if confidence is not None:
                self.ml_confidence_sum[model_name] += confidence
            if prediction:
                self.ml_predictions[model_name][str(prediction)] += 1

    def increment_active(self):
        with self._lock:
            self.active_requests += 1

    def decrement_active(self):
        with self._lock:
            self.active_requests = max(0, self.active_requests - 1)

    def get_uptime_seconds(self):
        return time() - self.start_time

    def get_summary(self):
        """Get a JSON-serializable metrics summary."""
        uptime = self.get_uptime_seconds()
        with self._lock:
            # Top endpoints by request count
            top_endpoints = sorted(
                self.request_count.items(),
                key=lambda x: x[1],
                reverse=True
            )[:10]

            # Compute average latencies
            avg_latencies = {}
            for key in self.request_latency_count:
                count = self.request_latency_count[key]
                if count > 0:
                    avg_latencies[key] = round(
                        self.request_latency_sum[key] / count, 2
                    )

            # Slowest endpoints
            slowest = sorted(
                avg_latencies.items(),
                key=lambda x: x[1],
                reverse=True
            )[:5]

            # ML metrics
            ml_summary = {}
            for model in self.ml_inference_count:
                count = self.ml_inference_count[model]
                ml_summary[model] = {
                    "total_inferences": count,
                    "errors": self.ml_inference_errors.get(model, 0),
                    "avg_latency_ms": round(
                        self.ml_inference_latency_sum[model] / count, 2
                    ) if count > 0 else 0,
                    "avg_confidence": round(
                        self.ml_confidence_sum[model] / count, 2
                    ) if count > 0 else 0,
                    "prediction_distribution": dict(self.ml_predictions.get(model, {})),
                }

            # Error rate
            error_rate = (
                round(self.total_errors / self.total_requests * 100, 2)
                if self.total_requests > 0 else 0
            )

            return {
                "uptime": {
                    "seconds": round(uptime, 0),
                    "human": _format_uptime(uptime),
                    "started_at": self.start_datetime.isoformat(),
                },
                "requests": {
                    "total": self.total_requests,
                    "active": self.active_requests,
                    "errors": self.total_errors,
                    "error_rate_percent": error_rate,
                    "requests_per_minute": round(
                        self.total_requests / (uptime / 60), 2
                    ) if uptime > 0 else 0,
                },
                "status_codes": dict(self.status_codes),
                "top_endpoints": [
                    {"endpoint": k, "count": v} for k, v in top_endpoints
                ],
                "slowest_endpoints": [
                    {"endpoint": k, "avg_ms": v} for k, v in slowest
                ],
                "ml_models": ml_summary,
            }

    def get_prometheus_text(self):
        """Export metrics in Prometheus text format."""
        lines = []
        uptime = self.get_uptime_seconds()

        with self._lock:
            # Uptime
            lines.append("# HELP docai_uptime_seconds Application uptime in seconds")
            lines.append("# TYPE docai_uptime_seconds gauge")
            lines.append(f"docai_uptime_seconds {uptime:.0f}")

            # Request totals
            lines.append("# HELP docai_requests_total Total HTTP requests")
            lines.append("# TYPE docai_requests_total counter")
            lines.append(f"docai_requests_total {self.total_requests}")

            # Error totals
            lines.append("# HELP docai_errors_total Total HTTP errors")
            lines.append("# TYPE docai_errors_total counter")
            lines.append(f"docai_errors_total {self.total_errors}")

            # Active requests
            lines.append("# HELP docai_active_requests Current active requests")
            lines.append("# TYPE docai_active_requests gauge")
            lines.append(f"docai_active_requests {self.active_requests}")

            # Status codes
            lines.append("# HELP docai_http_status_total HTTP responses by status code")
            lines.append("# TYPE docai_http_status_total counter")
            for code, count in sorted(self.status_codes.items()):
                lines.append(f'docai_http_status_total{{code="{code}"}} {count}')

            # Per-endpoint request count
            lines.append("# HELP docai_endpoint_requests_total Requests per endpoint")
            lines.append("# TYPE docai_endpoint_requests_total counter")
            for endpoint, count in self.request_count.items():
                safe = endpoint.replace('"', '')
                lines.append(f'docai_endpoint_requests_total{{endpoint="{safe}"}} {count}')

            # ML inference
            lines.append("# HELP docai_ml_inferences_total ML model inferences")
            lines.append("# TYPE docai_ml_inferences_total counter")
            for model, count in self.ml_inference_count.items():
                lines.append(f'docai_ml_inferences_total{{model="{model}"}} {count}')

            lines.append("# HELP docai_ml_inference_latency_ms_sum ML inference latency sum")
            lines.append("# TYPE docai_ml_inference_latency_ms_sum counter")
            for model, total in self.ml_inference_latency_sum.items():
                lines.append(f'docai_ml_inference_latency_ms_sum{{model="{model}"}} {total:.2f}')

        return "\n".join(lines) + "\n"


def _format_uptime(seconds):
    """Format seconds into human-readable uptime."""
    days = int(seconds // 86400)
    hours = int((seconds % 86400) // 3600)
    minutes = int((seconds % 3600) // 60)
    secs = int(seconds % 60)
    parts = []
    if days:
        parts.append(f"{days}d")
    if hours:
        parts.append(f"{hours}h")
    if minutes:
        parts.append(f"{minutes}m")
    parts.append(f"{secs}s")
    return " ".join(parts)


def setup_metrics_middleware(app):
    """Register metrics collection middleware with the Flask app."""
    metrics = MetricsCollector()

    @app.before_request
    def _metrics_before():
        from flask import g
        g.metrics_start = time()
        metrics.increment_active()

    @app.after_request
    def _metrics_after(response):
        from flask import g, request
        metrics.decrement_active()
        if hasattr(g, 'metrics_start'):
            duration_ms = (time() - g.metrics_start) * 1000
            # Normalize path to avoid high-cardinality (e.g., /api/users/123 -> /api/users/:id)
            path = _normalize_path(request.path)
            metrics.record_request(
                request.method, path,
                response.status_code, duration_ms
            )
        return response

    return metrics


def _normalize_path(path):
    """Normalize URL paths to reduce cardinality.
    Replaces numeric IDs with :id placeholder.
    """
    parts = path.strip('/').split('/')
    normalized = []
    for part in parts:
        if part.isdigit():
            normalized.append(':id')
        else:
            normalized.append(part)
    return '/' + '/'.join(normalized)
