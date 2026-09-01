const express = require('express');

/**
 * Small web server so Pterodactyl / uptime monitors have something to ping.
 * Not required for the bot to function, but Pterodactyl eggs often expect
 * a process that binds to a port, and it's handy for uptime checks.
 */
function keepAlive() {
  const app = express();
  const port = process.env.PORT || 3000;

  app.get('/', (req, res) => {
    res.send('Aster MC bot is running.');
  });

  app.listen(port, () => {
    console.log(`[Web] Keep-alive server listening on port ${port}`);
  });
}

module.exports = keepAlive;
