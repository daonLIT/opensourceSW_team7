// metro.config.js
const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

// wasm을 웹 번들에서 asset으로 인식시키기
config.resolver.assetExts = [...config.resolver.assetExts, "wasm"];
config.resolver.sourceExts = config.resolver.sourceExts.filter((ext) => ext !== "wasm");

module.exports = config;