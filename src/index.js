import express from 'express';
import url from 'url';
import path from 'path';
import { readFileSync } from 'fs';

import { DB } from './db.js';

const PORT = 3000;

const config = JSON.parse(readFileSync(new URL('config.json', import.meta.url)));
const db = new DB(config.DB);

const app = express();
app.set('view engine', 'ejs');
app.set('views', absolutePath('views'));
// The head.ejs view always needs this so we add it permanently, this way we don't need to pass it to every render() call
app.locals.plausibleDataDomain = config.plausibleDataDomain;

// Express routes
app.use(ensureDBconnected); // Always send 503 error if db is down

app.get('/', (req, res) => {
	res.redirect('/home');
});

app.get('/home', async (req, res) => {
	let dernierNumero = transformData(await db.getLatestDocument('numero'));
	let derniereVideo = transformData(await db.getLatestDocument('video'));
	res.render('index', { cards: [dernierNumero, derniereVideo] });

	// translates the data from the database to data for the card ejs template
	function transformData(data) {
		let { id, type, title, publication_date, number, thumbnail } = data;
		return {
			type,
			title,
			number,
			date: formatDate(publication_date),
			documentUrl: 'document/' + id,
			thumbnailUrl: (thumbnail ? mediaPath(thumbnail) : undefined)
		};
	}

	function formatDate(date) {
		const dayOfMonth = date.getUTCDate();
		const month = (date.getUTCMonth() + 1).toString().padStart(2, '0');
		const year = date.getUTCFullYear();
		return dayOfMonth + '/' + month + '/' + year;
	}
});

app.get('/lepatron', (req, res) => {
	res.render('lepatron');
});

app.get('/legal', (req, res) => {
	res.render('mentionsLegales');
});

app.get('/document/:id', async (req, res, next) => {
	const documentId = req.params.id
	const document = await db.getDocument(documentId);
	if (!document) {
		next();
		return;
	}

	switch (document.type) {
		case 'video':
			res.render('videoReader', {
				title: document.title,
				videoUrl: mediaPath(document.file),
			});
			break;
	
		case 'audio':
			res.render('audioReader', {
				title: document.title,
				audioUrl: mediaPath(document.file),
			});
			break;
		
		case 'numero':
			res.sendFile(storagePath(document.file));
			break;

		default:
			console.error('Unknown type:', document.type);
			break;
	}
});

app.use('/public', express.static(absolutePath('public')));
app.use('/media', express.static(config.storagePath));

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
 * Gets the absolute path for a directory relative to this file.
 * @param {string} dir path relative to index.js
 * @returns {string} the absolute path
 */
function absolutePath(dir) {
	return url.fileURLToPath(new URL(dir, import.meta.url));
}

/**
 * Gets the absolute path to a resource in the storage.
 * @param {string} path path relative to the storage folder
 * @returns {string} the absolute path
 */
function storagePath(pathRelativeToStorage) {
	return path.join(config.storagePath, pathRelativeToStorage);
}

/**
 * Gets the URL path to a resource in the storage.
 * @param {string} path path relative to the storage folder
 * @returns {string} the URL path to access this resource
 */
function mediaPath(pathRelativeToStorage) {
	return path.join('/media', pathRelativeToStorage);
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