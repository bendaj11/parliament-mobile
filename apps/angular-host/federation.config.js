const {
  createAngularFederationConfig,
} = require('@atlas/sdk/federation-config');

module.exports = createAngularFederationConfig({
  projectRoot: __dirname,
  name: 'atlas_angular_host',
  expose: 'host',
});
