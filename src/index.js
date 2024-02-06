import express from 'express';
import url from 'url';
import path from 'path';
import { readFileSync } from 'fs';

import { DB } from './db.js';

const PORT = 3000;

const config = JSON.parse(readFileSync(new URL('config.json', import.meta.url)));
const db = new DB(config.DB);
const app = express();

// Express thingies
app.use(ensureDBconnected);

app.get('/', (req, res) => {
	res.redirect('/home');
});

app.get('/home', (req, res) => {
	res.sendFile(staticResourcePath('public/index.html'));
});

app.get('/lepatron', (req, res) => {
	res.sendFile(staticResourcePath('public/lepatron.html'));
});

app.get('/document/:id', async (req, res, next) => {
	const documentId = req.params.id
	const document = await db.getDocument(documentId);
	if (document) {
		res.sendFile(storagePath(document.file));
	} else {
		next();
	}
});

app.use(express.static(staticResourcePath('public')));

app.use('/', send404);

// Opening the express server
const server = app.listen(PORT, () => {
	console.log(`Example app listening on port ${PORT}`);
});

// Shutdown handling
process.on('SIGTERM', () => {
	console.log('SIGTERM signal received: closing HTTP server');

	// Ensuring no connection prevents the server from exiting (eg. video streaming)
	server.closeAllConnections();

	// Closing http server and db connection
	server.close(() => {
		console.log("HTTP server closed");
	});
	db.close().then(() => {
		console.log("Database connection closed");
	});
});

/**
 * Gets the absolute path for a static resource relative to this file.
 * @param {string} path path relative to index.js
 * @returns {string} the absolute path
 */
function staticResourcePath(path) {
	return url.fileURLToPath(new URL(path, import.meta.url));
}

/**
 * Gets the absolute path to a resource in the storage.
 * @param {string} path path relative the storage folder
 * @returns {string} the absolute path
 */
function storagePath(pathRelativeToStorage) {
	return path.join('/storage', pathRelativeToStorage);
}

async function ensureDBconnected(req, res, next) {
	if (db.connected) {
		next();
	} else {
		try {
			await db.connect();
			next();
		} catch (err) {
			res.status(503).send("503 Service Unavailable");
		}
	}
}

function send404(req, res, next) {
	res.status(404).send("404 Not Found");
}