import express from 'express';
import url from 'url';

const app = express();
const port = 3000;

app.get('/', (req, res) => {
	res.redirect('/home');
});

app.get('/home', (req, res) => {
	res.sendFile(resourcePath('public/index.html'));
});

app.get('/lepatron', (req, res) => {
	res.sendFile(resourcePath('public/lepatron.html'));
});

app.get('/legal', (req, res) => {
	res.sendFile(resourcePath('public/mentionsLegales.html'));
});


app.use(express.static(resourcePath('public')));

const server = app.listen(port, () => {
	console.log(`Example app listening on port ${port}`);
});

// Shutdown handling
process.on('SIGTERM', () => {
	console.log('SIGTERM signal received: closing HTTP server');
	server.close(() => {
		console.log("HTTP server closed");
	});
});

/**
 * Gets the absolute path for a resource relative to this file.
 * @param {string} path path relative to index.js
 * @returns {string} the absolute path
 */
function resourcePath(path) {
	return url.fileURLToPath(new URL(path, import.meta.url));
}