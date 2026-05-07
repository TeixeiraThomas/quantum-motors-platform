import type { NextApiRequest, NextApiResponse } from "next";
import httpProxy from "http-proxy";

const proxy = httpProxy.createProxyServer();

export const config = {
  api: {
    bodyParser: false,
    externalResolver: true,
  },
};

function getProxyTarget() {
  return (
    process.env.API_URL_INTERNAL ||
    process.env.API_URL ||
    "http://localhost:3000"
  );
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const target = getProxyTarget();
  const nextPath = Array.isArray(req.query.path) ? req.query.path.join("/") : "";
  const queryIndex = req.url?.indexOf("?") ?? -1;
  const querySuffix = queryIndex >= 0 && req.url ? req.url.slice(queryIndex) : "";

  req.url = `/${nextPath}${querySuffix}`;

  console.info(
    JSON.stringify({
      timestamp: new Date().toISOString(),
      level: "info",
      service: "frontend-proxy",
      method: req.method,
      path: req.url,
      target,
    })
  );

  proxy.once("error", (error: Error) => {
    console.error(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        level: "error",
        service: "frontend-proxy",
        message: "Proxy request failed",
        error: error.message,
      })
    );

    if (!res.headersSent) {
      res.status(502).json({ code: 502, message: "Upstream API unavailable" });
    }
  });

  proxy.web(req, res, {
    target,
    changeOrigin: true,
  });
}
