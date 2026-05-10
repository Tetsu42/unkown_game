export default {
    publicDir: 'assets',
      plugins: [
    {
      name: 'fix-mp3-mime',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          if (req.url.endsWith('.mp3')) {
            res.setHeader('Content-Type', 'audio/mpeg');
          }
          next();
        });
      }
    }
  ]
}
