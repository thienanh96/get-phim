const api = require('./router');
const express = require('express');
const path = require('path');
const port = 3001;
const cors = require('cors');
//......

var app = express();
app.set('view engine', 'ejs');
app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/api', api);
var server = require('http').Server(app);
server.listen(process.env.PORT || 3001, () => {
    let p = server.address().port;
    console.log('Server is running on port ' + p);
})

