import mysql from 'mysql2/promise';

class DB {
	constructor({ host, user, password, database }) {
		this.config = { host, user, password, database };
		this.connected = false;
		this.connectAttempts(10);
	}

	async connectAttempts(maxAttempts) {
		for (let attempt = 0; attempt < maxAttempts; attempt++) {
			try {
				await this.connect();
				return;
			} catch (err) {
				if (err.code = "ECONNREFUSED") {
					console.log(`Failed to connect to database (attempt ${attempt + 1}). Retrying in 1s.`);
					await new Promise(res => setTimeout(res, 1000));
				} else {
					throw err;
				}
			}
		}

		console.log(`Error: failed to connect to database after ${maxAttempts} attempts.`);
	}

	async connect() {
		this.connection = await mysql.createConnection(this.config);
		this.connected = true;
		console.log("Database connected.");

		this.connection.on('error', async err => {
			await this.connection.close();
			this.connected = false;

			if (err.code === "PROTOCOL_CONNECTION_LOST") {
				this.#handleProtocolConnectionLost();
			} else if (err.code === 4031) {
				this.#handleInactivityTimeout();
			} else {
				throw err;
			}
		});
	}

	#handleProtocolConnectionLost() {
		console.log("Database connection lost, reconnecting...");
		this.connectAttempts(10);
	}

	#handleInactivityTimeout() {
		console.log("Database connection timed out due to inactivity.");
	}

	async execute(sql, values) {
		try {
			const [results, _fields] = await this.connection.execute(sql, values);
			return results;
		} catch (err) {
			throw err;
		}
	}

	async close() {
		await this.connection?.end();
	}

	async getDocument(id) {
		const result = await this.execute('SELECT * FROM document WHERE id = ?;', [id]);
		return result[0];
	}

	async getLatestDocument(type) {
		if (!['numero', 'video', 'audio'].includes(type)) 
			throw new Error(`Unknown type: "${type}"`);
		
		const latest = await this.execute(`SELECT * FROM document WHERE type = ? ORDER BY publication_date DESC LIMIT 1;`, [type]);
		return latest[0];
	}

	async addLike(documentId) {
		if (!documentId.match(/\d+/)) return false;
		const { affectedRows } = await this.execute('INSERT INTO likes (document_id) SELECT ? WHERE EXISTS(SELECT * FROM document WHERE id = ?);', [documentId, documentId]);
		return affectedRows !== 0;
	}

	async getLikes(documentId) {
		const result = await this.execute('SELECT (SELECT COUNT(*) FROM `likes` WHERE document_id = ?) as like_count WHERE EXISTS(SELECT * FROM document WHERE id = ?);', [documentId, documentId]);
		return result[0]?.['like_count'];
	}
}

export {
	DB
};