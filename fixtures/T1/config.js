const config = {
  port: process.env.PORT || 3000,
  debug: process.env.NODE_ENV !== "production",
  maxRetries: 3
};
module.exports = config;
