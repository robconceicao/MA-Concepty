const { licenseBuildConfig } = require('./scripts/license-build-config.cjs');
module.exports = ({ config }) => ({ ...config, extra: { ...config.extra, ...licenseBuildConfig(process.env) } });
