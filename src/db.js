import mysql from 'mysql';

class DB {
	constructor(config) {
		this.config = config;
		this.connected = false;
		this.connectAttempts(10);
	}

	async connectAttempts(maxAttempts) {
		return new Promise((resolve, reject) => {
			let attempts = 0;

			const id = setInterval(() => {
				this.connect()
					.then((res) => {
						clearInterval(id);
						this.connected = true
						resolve(res);
					})
					.catch((reason) => {
						attempts++;
						if (attempts >= maxAttempts) {
							clearInterval(id);
							console.log(`Error: failed to connect to database after ${attempts} attempts.`);
							reject(reason);
						} else {
							console.log(`Failed to connect to database (attempt ${attempts}). Retrying in 1s.`);
						}
					});
			}, 1000);
		});
	}

	async connect() {
		return new Promise((resolve, reject) => {
			this.connection = mysql.createConnection(this.config);
			this.connection.connect(err => {
				if (err) reject(err);
				else {
					this.connection.on('error', err => {
						this.connected = false;
						if (err.code === "PROTOCOL_CONNECTION_LOST") {
							console.log("Database connection lost, reconnecting...");
							this.connectAttempts(10);
						} else {
							throw err;
						}
					});
					console.log("Database connected.");
					resolve();
				}
			});
		});
	}

	async query(sql) {
		return new Promise((resolve, reject) => {
			this.connection.query(sql, (err, result) => {
				if (err) reject(err);
				else resolve(result);
			});
		});
	}

	async end(callback) {
		this.connection.end(callback);
	}

	async getVideo(id) {
		const result = await this.query(`SELECT * FROM Video WHERE Video_id = ${id};`);
		return result;
	}
}

export {
	DB
};