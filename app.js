const express = require('express');
var bodyParser = require('body-parser')
const path = require('path');
const port = 3001;
const cors = require('cors');
var model = require('./model');
//......

var app = express();
app.use(bodyParser.urlencoded());
app.use(bodyParser.json());
const api = require('./router');
app.set('view engine', 'ejs');
app.use(cors());
app.use('/api', api);
var server = require('http').Server(app);
var https = require("https");
setInterval(function() {
    https.get("https://get-phim-tool.herokuapp.com");
    console.log('ping')
}, 300000);




server.listen(process.env.PORT || 3001, () => {
    let p = server.address().port;
    console.log('Server is running on port ' + p);
})

