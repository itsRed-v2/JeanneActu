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

app.get('/video/:id', ensureDBconnected, async (req, res) => {
	const videoID = req.params.id;
	if (!videoID.match(/\d+/)) {
		send404(req, res);
		return;
	}

	const video = await db.getVideo(parseInt(videoID));
	if (video.length == 0) {
		send404(req, res);
		return;
	}

	res.send(video[0]);
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

function ensureDBconnected(req, res, next) {
	if (db.connected) {
		next()
	} else {
		res.status(503);
		res.send("503 Service Unavailable");
	}
}

function send404(req, res) {
	res.status(404);
	res.send("404 Not Found");
}