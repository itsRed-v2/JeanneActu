const express = require('express');
const app = express();
const port = 3000;

app.get('/', (req, res) => {
	res.send("Hey ! Maybe try to see what's at /index.html ...");
});

app.use(express.static('files'));

app.listen(port, () => {
	console.log(`Example app listening on port ${port}`);
});
