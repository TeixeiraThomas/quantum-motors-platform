import http from "k6/http";
import { check, sleep } from "k6";

const baseUrl = __ENV.BASE_URL || "http://172.16.248.64";
const frontHost = __ENV.FRONT_HOST || "front.quantum.local";
const apiHost = __ENV.API_HOST || "api.quantum.local";

export const options = {
  scenarios: {
    warmup: {
      executor: "ramping-vus",
      stages: [
        { duration: "30s", target: 5 },
        { duration: "1m", target: 20 },
        { duration: "30s", target: 0 }
      ]
    }
  },
  thresholds: {
    http_req_failed: ["rate<0.02"],
    "http_req_duration{endpoint:front_home}": ["p(95)<1500"],
    "http_req_duration{endpoint:front_configure}": ["p(95)<2000"],
    "http_req_duration{endpoint:api_health}": ["p(95)<800"],
    "http_req_duration{endpoint:api_models}": ["p(95)<1200"]
  }
};

function get(path, host, endpointTag) {
  return http.get(`${baseUrl}${path}`, {
    headers: {
      Host: host
    },
    tags: {
      endpoint: endpointTag
    }
  });
}

function post(path, host, payload, endpointTag) {
  return http.post(`${baseUrl}${path}`, payload, {
    headers: {
      Host: host,
      "Content-Type": "application/json"
    },
    tags: {
      endpoint: endpointTag
    }
  });
}

export default function () {
  const frontHome = get("/", frontHost, "front_home");
  check(frontHome, {
    "front home status is 200": (r) => r.status === 200,
    "front home contains html": (r) => r.body.includes("<html")
  });

  const frontConfigure = get("/configure?model_id=1", frontHost, "front_configure");
  check(frontConfigure, {
    "front configure status is 200": (r) => r.status === 200
  });

  const apiHealth = get("/health", apiHost, "api_health");
  check(apiHealth, {
    "api health status is 200": (r) => r.status === 200,
    "api health body is OK": (r) => r.body.includes("OK")
  });

  const apiModels = get("/models", apiHost, "api_models");
  check(apiModels, {
    "api models status is 200": (r) => r.status === 200,
    "api models has id": (r) => r.body.includes("\"id\"")
  });

  const apiConfigure = post("/car/configure", apiHost, JSON.stringify({ model: 1 }), "api_configure");
  check(apiConfigure, {
    "api configure status is 200": (r) => r.status === 200,
    "api configure code 200": (r) => r.body.includes("\"code\":200")
  });

  sleep(1);
}
