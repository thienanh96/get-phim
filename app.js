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


const rp = require('request-promise');
var cheerio = require('cheerio');
var stringSimilarity = require('string-similarity');
var nodemailer = require('nodemailer');
var transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'thienanhnguyen00009@gmail.com',
        pass: '22051996westlife'
    }
});
var filmObjs = [];
var domainHeroku = "https://get-phim-tool.herokuapp.com/";
var domainLocal = "http://localhost:3030/";


var getHtml = async () => {
    let option1 = {
        method: 'GET',
        uri: 'http://bilutv.com/danh-sach/phim-bo.html'
    };
    let option2 = {
        method: 'GET',
        uri: 'http://bilutv.com/danh-sach/phim-bo.html?page=2'
    };
    let contentPage1 = await rp(option1).catch(err => console.log(err));
    let contentPage2 = await rp(option2).catch(err => console.log(err));
    let $1 = cheerio.load(contentPage1, {
        decodeEntities: false
    });
    let $2 = cheerio.load(contentPage2, {
        decodeEntities: false
    });
    let listFilm1 = $1('.list-film').first().html();
    let listFilm2 = $2('.list-film').first().html();
    $1 = cheerio.load(listFilm1, {
        decodeEntities: false
    });
    $2 = cheerio.load(listFilm2, {
        decodeEntities: false
    });
    let filmObj1 = [];
    let filmObj2 = [];
    for (let i = 1; i <= 24; i++) {
        let temp1 = $1("li:nth-child(" + i + ")").html() + '';
        let temp2 = $2("li:nth-child(" + i + ")").html() + '';
        let $$1 = cheerio.load(temp1, {
            decodeEntities: false
        });
        let $$2 = cheerio.load(temp2, {
            decodeEntities: false
        });
        let snippet = $$1('.current-status').first().text();
        let title = $$1('a').first().attr('title');
        let href = 'http://bilutv.com' + $$1('a').first().attr('href');
        filmObj1.push({
            episode: processSnippet(snippet),
            snippet: snippet,
            title: title,
            href: href
        });
        snippet = $$2('.current-status').first().text();
        title = $$2('a').first().attr('title');
        href = 'http://bilutv.com' + $$2('a').first().attr('href');
        filmObj2.push({
            episode: processSnippet(snippet),
            snippet: snippet,
            title: title,
            href: href
        })
    }
    return filmObj1.concat(filmObj2);
}

getHtml().then(arr => {
    filmObjs = arr;
    // console.log('reee: ', filmObjs[1]);
});



var listenForChanges = () => {
    let hasChanged = false;
    getHtml().then(arr => {
        // arr[1] = {
        //     episode: '19',
        //     snippet: 'Tập 19 VietSub',
        //     title: 'Bạn Thân Mến',
        //     href: 'http://bilutv.com/phim/ban-than-men-7038.html'
        // }
        let originalArrObjTitle = filmObjs.map(el => el.title);
        let originalArrObjSnippet = filmObjs.map(el => el.episode);
        let currentArrObjTitle = filmObjs.map(el => el.title);
        let currentArrObjSnippet = arr.map(el => el.episode);
        for (let i = 0; i < currentArrObjTitle.length; i++) {
            let checkInclude = checkIncludes(currentArrObjTitle[i], originalArrObjTitle);
            if (!checkInclude.include) {
                hasChanged = true;
                createNewFilm(arr[i]).then(resultSendmail => {
                    console.log(resultSendmail);
                })
            } else {
                let matchIndex = checkInclude.matchIndex;
                if (arr[i].snippet !== filmObjs[matchIndex].snippet) {
                    console.log('update____')
                    hasChanged = true;
                    updateFilm(arr[i], filmObjs[i]);
                } else {
                    console.log('no change!!')
                }
            }
        }
        if (hasChanged) {
            filmObjs = arr;
        }
    })
}

setInterval(function () {
    listenForChanges();
}, 14400000);

var createNewFilm = (objFilm) => {
    console.log('create', objFilm);
    let link = domainHeroku + 'api/createfilm?snippet=' + objFilm.snippet + '&href=' + objFilm.href + '&episode=' + objFilm.episode;
    link = encodeURI(link);
    let mailOptions = {
        from: 'thienanhnguyen00009@gmail.com', // sender address
        to: 'thienanhnguyen00008@gmail.com', // list of receivers
        subject: '[PHIM360] - Có sự thay đổi - TẠO MỚI PHIM', // Subject line
        html: '<h1>Link: </h1><p>'+objFilm.href+'</p><h1>CLICK:</h1><p>' + link + '</p>'
    };
    return transporter.sendMail(mailOptions);
}

var updateFilm = (newObjFilm, oldObjFilm) => {
    console.log('update roi`')
    let titleFilm = newObjFilm.title;
    if (titleFilm) {
        titleFilm = titleFilm.replace(/\\\//g, '').replace(/\?/g, '').replace(/&/g, '').replace(/#/g, '');
    }
    console.log('filmm: ', titleFilm)
    let options = {
        method: 'GET',
        uri: encodeURI('https://www.googleapis.com/blogger/v3/blogs/144199127316688870/posts/search?q=' + titleFilm + '&key=AIzaSyDg6ATJymGVqn1N1G-_nvdsGvN_HsC4AGc&fetchBodies=true'),
        json: true,
        headers: {
            'Content-Type': 'application/json; charset=utf-8',
        }
    }
    rp(options).then(resultSearch => {
        if (resultSearch.items) { //tim thay
            let searchNames = resultSearch.items.map(el => el.title.split('-')[0].trim());
            let includeSearch = checkIncludes(titleFilm,searchNames);
            if (searchNames && includeSearch.include) {
                let updateId = resultSearch.items[includeSearch.matchIndex].id;
                let contentSearch = resultSearch.items[includeSearch.matchIndex].content;
                let $ = cheerio.load(contentSearch, {
                    decodeEntities: false
                });
                let fromEpisode = '';
                if(contentSearch.includes('mvi-status-data')){
                    fromEpisode = $('#mvi-status-data').text().replace(']','');
                }
                fromEpisode = processSnippet(fromEpisode);
                let link = domainHeroku + 'api/updatefilm?idPost=' + updateId + '&fromEpisode=' + fromEpisode + '&toEpisode=' + newObjFilm.episode;
                link = encodeURI(link);
                let mailOptions = {
                    from: 'thienanhnguyen00009@gmail.com', // sender address
                    to: 'thienanhnguyen00008@gmail.com', // list of receivers
                    subject: '[PHIM360] - Có sự thay đổi - CẬP NHẬT PHIM, THÊM TẬP MỚI', // Subject line
                    html: '<h1>Tên phim: '+newObjFilm.title+'</h1><h1>Link phim: '+newObjFilm.href+'</h1<h1>CLICK:</h1><p>' + link + '</p>'
                };
                return transporter.sendMail(mailOptions);
            } else {
                createNewFilm(newObjFilm);
            }
        } else {
            createNewFilm(newObjFilm);
        }
    }, err => {
        console.log('errrr: ', err)
    })


}

var checkIncludes = (element, arrFilm) => {
    let include = false;
    let index = 0;
    for (let el of arrFilm) {
        if (stringSimilarity.compareTwoStrings(el, element) > 0.85) {
            include = true;
            break;
        }
        index++;
    }
    if (include) {
        return {
            include: true,
            matchIndex: index
        }
    } else {
        return {
            include: false,
            matchIndex: -1
        }
    }
}

var processSnippet = (snippet) => {
    let arrSnippet = snippet.split(' ');
    for (let el of arrSnippet) {
        if (!isNaN(el)) {
            return el
        };
        if (el.includes('/')) {
            return el.split('/')[0];
        }
    }
    return '';
}

server.listen(process.env.PORT || 3001, () => {
    let p = server.address().port;
    console.log('Server is running on port ' + p);
})

