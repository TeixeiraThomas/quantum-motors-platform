#!/usr/bin/env python3
import argparse
import json
from datetime import datetime, timezone


def metric_value(metrics, metric_name, key, default="n/a"):
    metric = metrics.get(metric_name, {})
    values = metric.get("values", {})
    value = values.get(key)
    if value is None:
        return default
    if isinstance(value, float):
        return f"{value:.2f}"
    return str(value)


def main() -> None:
    parser = argparse.ArgumentParser(description="Generate markdown report from k6 summary export.")
    parser.add_argument("--summary", required=True, help="Path to k6 summary json file.")
    parser.add_argument("--output", required=True, help="Path to markdown output.")
    parser.add_argument("--base-url", required=True, help="Target base URL.")
    parser.add_argument("--front-host", required=True, help="Frontend Host header.")
    parser.add_argument("--api-host", required=True, help="API Host header.")
    args = parser.parse_args()

    with open(args.summary, "r", encoding="utf-8") as file:
        summary = json.load(file)

    metrics = summary.get("metrics", {})

    checks_rate = metric_value(metrics, "checks", "rate", "0")
    http_failed = metric_value(metrics, "http_req_failed", "rate", "0")
    req_count = metric_value(metrics, "http_reqs", "count", "0")
    req_rate = metric_value(metrics, "http_reqs", "rate", "0")
    p95 = metric_value(metrics, "http_req_duration", "p(95)", "n/a")
    p99 = metric_value(metrics, "http_req_duration", "p(99)", "n/a")
    avg = metric_value(metrics, "http_req_duration", "avg", "n/a")

    timestamp = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")

    content = f"""# Quantum Motors - k6 Performance Report

- Generated at: {timestamp}
- Base URL: `{args.base_url}`
- Front host header: `{args.front_host}`
- API host header: `{args.api_host}`

## Global Results

| Metric | Value |
|---|---|
| Checks success rate | {checks_rate} |
| HTTP failure rate | {http_failed} |
| Total HTTP requests | {req_count} |
| Requests per second | {req_rate} |
| HTTP duration avg (ms) | {avg} |
| HTTP duration p95 (ms) | {p95} |
| HTTP duration p99 (ms) | {p99} |

## Interpretation

1. Validate that `HTTP failure rate` is below `0.02`.
2. Confirm `p95` remains aligned with your SLO target.
3. Compare this report against previous runs to detect regressions.
"""

    with open(args.output, "w", encoding="utf-8") as file:
        file.write(content)


if __name__ == "__main__":
    main()
