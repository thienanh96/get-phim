var mongoose = require('mongoose');
var uriLocal = 'mongodb://localhost:27017/phim360';
var uriMlab = 'mongodb://thienanhnguyen06:Anh22051996@ds259241.mlab.com:59241/heroku_lplqzd1d'
//Lets connect to our database using the DB server URL.
mongoose.connect(uriMlab,{ useNewUrlParser: true });
mongoose.connection.on('connected',() => {
    console.log('Connect thanh cong!')
})
mongoose.connection.on('error',() => {
    console.log('Connect that bai!')
})
var Film = mongoose.model('Film', {
    idFilm: String,
    time: Number,
    source: String
});



module.exports.createFilm = (film) => {
    let newFilm = new Film(film);
    return newFilm.save();
}

module.exports.getFilm = (idFilm) => {
    return Film.findOne({
        idFilm: idFilm
    })
}

module.exports.updateFilm = (idFilm, updatedObj) => {
    return Film.findOneAndUpdate({
        idFilm: idFilm
    }, {
        $set: {
            source: updatedObj.source,
            time: updatedObj.time
        }
    }, {
        new: true
    })
}
