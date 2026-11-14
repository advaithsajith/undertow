// Desktop wrapper: serves the game from a private local port and opens it in a window. F11 toggles fullscreen.
const { app, BrowserWindow } = require('electron');
const http = require('http'), fs = require('fs'), path = require('path');
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.fbx': 'application/octet-stream', '.txt': 'text/plain' };
function serve() {
  return new Promise(resolve => {
    const srv = http.createServer((req, res) => {
      let p = decodeURIComponent(req.url.split('?')[0]); if (p === '/') p = '/index.html';
      const f = path.join(__dirname, path.normalize(p));
      if (!f.startsWith(__dirname)) { res.writeHead(403); return res.end(); }
      fs.readFile(f, (err, data) => { if (err) { res.writeHead(404); return res.end(); } res.writeHead(200, { 'Content-Type': MIME[path.extname(f).toLowerCase()] || 'application/octet-stream' }); res.end(data); });
    });
    srv.listen(0, '127.0.0.1', () => resolve(srv.address().port));
  });
}
app.whenReady().then(async () => {
  const port = await serve();
  const win = new BrowserWindow({ width: 1600, height: 900, backgroundColor: '#000000', autoHideMenuBar: true, title: 'Undertow' });
  win.loadURL('http://127.0.0.1:' + port + '/index.html');
  win.webContents.on('before-input-event', (e, input) => { if (input.type === 'keyDown' && input.key === 'F11') win.setFullScreen(!win.isFullScreen()); });
});
app.on('window-all-closed', () => app.quit());
