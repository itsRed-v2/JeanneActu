import express from 'express';
import url from 'url';
import { readFileSync } from 'fs';

import { DB } from './db.js';

const config = JSON.parse(readFileSync(new URL('config.json', import.meta.url)));

const db = new DB(config.DB);

const app = express();
const port = 3000;

// Express thingies
app.get('/', (req, res) => {
	res.redirect('/home');
});

app.get('/home', (req, res) => {
	res.sendFile(resourcePath('public/index.html'));
});

app.get('/lepatron', (req, res) => {
	res.sendFile(resourcePath('public/lepatron.html'));
});

app.use(express.static(resourcePath('public')));

app.get('/db', (req, res) => {
	if (!db.connected) {
		res.status(503);
		res.send("503 Service Unavailable");
		return;
	}

	db.query("SELECT * FROM Video").then(result => res.send(result));
});

const server = app.listen(port, () => {
	console.log(`Example app listening on port ${port}`);
});

// Shutdown handling
process.on('SIGTERM', () => {
	console.log('SIGTERM signal received: closing HTTP server');
	server.close(() => {
		console.log("HTTP server closed");
	});
	db.end(err => {
		console.log("Database connection closed");
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