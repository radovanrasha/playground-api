module.exports = {
  apps: [
    {
      name: "playground-api",
      script: "npm run start:prod",
      port: 3006,
      time: true,
    },
  ],
  deploy: {
    production: {
      user: "dev",
      host: "161.97.65.149",
      key: "radovanrasha.pem",
      ref: "origin/master",
      repo: "git@github.com:radovanrasha/playground-api.git",
      path: "/home/dev/playground/playground-api",
      env: {
        NODE_ENV: "production",
      },
      "post-deploy":
        "rm -rf node_modules && . ~/.nvm/nvm.sh && nvm use 20 && npm install && pm2 startOrRestart ecosystem.config.js --env production",
    },
  },
};
