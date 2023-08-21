const express = require("express");
const path = require("path");
const app = express();
const port = process.env.PORT || 3000;

// Serve the static files from the React app
app.use(express.static(path.join(__dirname, 'build')));

// Handles any requests that don't match the ones above
app.get('*', (req,res) => {
    res.sendFile(path.join(__dirname+'/build/index.html'));
});

app.listen(port, () => console.log(`React app being served by Express, listening on port ${port}!`));