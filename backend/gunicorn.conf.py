"""Gunicorn production configuration for DOC-AI."""

import multiprocessing
import os

# Server socket
bind = f"0.0.0.0:{os.getenv('PORT', '5000')}"
backlog = 2048

# Worker processes
# Recommended: 2-4 x $(NUM_CORES)
workers = int(os.getenv('GUNICORN_WORKERS', multiprocessing.cpu_count() * 2 + 1))
worker_class = 'gthread'  # Thread-based workers for I/O bound Flask apps
threads = int(os.getenv('GUNICORN_THREADS', 4))
worker_connections = 1000

# Timeouts
timeout = int(os.getenv('GUNICORN_TIMEOUT', 120))  # Higher for ML inference
graceful_timeout = 30
keepalive = 5

# Restart workers after this many requests (prevents memory leaks)
max_requests = 1000
max_requests_jitter = 50

# Logging
accesslog = '-'  # stdout
errorlog = '-'   # stderr
loglevel = os.getenv('LOG_LEVEL', 'info').lower()
access_log_format = '%(h)s %(l)s %(u)s %(t)s "%(r)s" %(s)s %(b)s "%(f)s" "%(a)s" %(D)sμs'

# Process naming
proc_name = 'doc-ai-backend'

# Preload app to save memory (workers share app code)
preload_app = True

# Server mechanics
tmp_upload_dir = None


def on_starting(server):
    """Called just before the master process is initialized."""
    server.log.info("DOC-AI backend starting with gunicorn")


def post_fork(server, worker):
    """Called just after a worker has been forked."""
    server.log.info(f"Worker spawned (pid: {worker.pid})")


def pre_exec(server):
    """Called just before a new master process is forked."""
    server.log.info("Forked child, re-executing.")


def worker_exit(server, worker):
    """Called when a worker exits."""
    server.log.info(f"Worker exited (pid: {worker.pid})")
