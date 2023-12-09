const express = require('express');
const path = require('path');

const app = express();
const port = 80;

app.get('/', (req, res) => {
	res.send("Hey ! Maybe try to see what's at /index.html ...");
});

app.use(express.static(path.join(__dirname, 'public')));

app.listen(port, () => {
	console.log(`Example app listening on port ${port}`);
});
