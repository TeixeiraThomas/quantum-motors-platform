const { i18n } = require("./next-i18next.config");

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  i18n,

  publicRuntimeConfig: {
    apiUrl: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000",
    environment: process.env.NODE_ENV || "development",
  },
  serverRuntimeConfig: {
    apiUrl:
      process.env.API_URL_INTERNAL ||
      process.env.API_URL ||
      process.env.NEXT_PUBLIC_API_URL ||
      "http://localhost:3000",
  },

  webpack(config) {
    const fileLoaderRule = config.module.rules.find(
      (rule) => rule.test && rule.test.test && rule.test.test(".svg")
    );

    if (fileLoaderRule) {
      fileLoaderRule.exclude = /\.svg$/i;
    }

    config.module.rules.push({
      test: /\.svg$/i,
      use: [
        {
          loader: require.resolve("@svgr/webpack"),
          options: {
            svgoConfig: {
              plugins: [
                {
                  name: "removeViewBox",
                  active: false,
                },
              ],
            },
          },
        },
      ],
    });

    return config;
  },

  images: {
    unoptimized: true,
  },
};

module.exports = nextConfig;
