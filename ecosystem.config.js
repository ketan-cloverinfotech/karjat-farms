// PM2 process manager config — see DEPLOY.md
module.exports = {
  apps: [
    {
      name: "karjat-farms",
      script: "node_modules/next/dist/bin/next",
      args: "start --port 3000",
      cwd: "/var/www/karjat-farms",
      instances: 1,
      exec_mode: "fork",
      watch: false,
      autorestart: true,
      max_memory_restart: "512M",
      env: {
        NODE_ENV: "production",
        PORT: "3000",
      },
      error_file: "/var/log/karjat-farms/error.log",
      out_file: "/var/log/karjat-farms/out.log",
      merge_logs: true,
      time: true,
    },
  ],
};
