const rp = require('request-promise');
const request = require('request');
var express = require('express');
var router = express.Router();
var CryptoJS = require('crypto-js');
var followRedirects = require('follow-redirects');
var http = followRedirects.http;
var https = followRedirects.https;
var cheerio = require('cheerio');
var Crawler = require("crawler");
var Film = require('./model');
var get_ip = require('ipware')().get_ip;
var stringSimilarity = require('string-similarity');
var access_token = 'EAAZA5TUfQPxcBADeYgJY9m45LZCCBzxZBrldWru5VRkrx1RFs7bYiZCZBheZAjFZAAePAvZBLtl86MyNFADoaHlZC6sK30WBgnMqDpLsWllY1NzyEGQ2XiWYkZCP1z9G0xawNATOlAhxwI1cgGQjeNu6lBFddjns6NZBlKCJpQETFpoCZCw8a21VW8fhUWbxfn7IZBZBEZD'
var iplocation = require('iplocation')
var nodemailer = require('nodemailer');
var transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'thienanhnguyen00009@gmail.com',
        pass: '22051996westlife'
    }
});
var filmObjs = [];
router.get('/ip', function (req, res, next) {
    var ip_info = get_ip(req);
    
 
iplocation(ip_info.clientIp, function (error, ress) {
 return res.send(ress);
})
    
})


router.get('/library/adnow-1', function (req, res, next) {
    return res.sendFile('views/adnow-1.js', { root : __dirname})
    
})

router.get('/phim', function (req, res, next) {
    let domain = req.query.domain;
    let url = req.query.url;
    let requestOption = '';
    let server = req.query.server;
    if(server +'' === 'sb'){
        requestOption = 'http://www.phim360.xyz/index.php?url=' +url;
    } else {
        requestOption = url;
    }
    if (domain === 'phimmoi') {
        return chooseTemplate('', res);
    } else {
        let url2 = url + '.html';
        let mId = [];
        let mIdphimbo = url2.match(/e(\d+)\./i);
        let mIdphimle = [];
        if (mIdphimbo === null || mIdphimbo === undefined) {
            mIdphimle = url2.match(/(\d+)\./i);
            mId = mIdphimle;
        } else {
            mIdphimbo = url2.match(/(\d+)\_/i);
            mId = mIdphimbo;
        }
        let passBilu = domain + '.com' + '4590481877' + mId[1];
        request(requestOption, (error, response, body) => {
            body += '';
            if (!error) {
                let arrFile = body.match(/"file":"([^"]+)"/g);
                let arrServer = body.match(/("server":"\w+")/g);
                console.log('check file',arrFile);
                if (arrServer !== null && arrServer !== undefined) {
                    arrServer = arrServer.map(el => {
                        let filter = el.match(/("\w+")/g);
                        filter = filter[1].replace('"', '').replace('"', '').trim();
                        return filter
                    })
                    console.log('server: ',arrServer)
                    let arrLink = [];
                    if (arrFile) {
                        for (let file of arrFile) {
                            let mf = file.match(/"file":"([^"]+)"/i);
                            if (mf && mf[1]) {
                                let encFile = mf[1].replace(/\\\//g, '/');
                                let bytes;
                                try {
                                    bytes = CryptoJS.AES.decrypt(encFile, passBilu);
                                    let plaintext = bytes.toString(CryptoJS.enc.Utf8);
                                    arrLink.push(plaintext);
                                } catch (error) {
                                    console.log('LOI TRONG QUA TRINH DECODE, PASS THAY DOI!___________________- ', error);
                                    return chooseTemplate('', res);

                                }
                            }
                        }
                    }
                    let returnLink;
                    let indexServerSb = '';
                    if (server + '' === 'sb' || server + '' === 'st' || server + '' === 'cs') {
                        if(server+''=== 'sb'){
                            indexServerSb = arrServer.indexOf('st');
                        }
                        if(server+''=== 'st'){
                            if(arrServer.includes('cs')){
                                indexServerSb = arrServer.indexOf('cs'); //fix ở đây
                            } else {
                                indexServerSb = arrServer.indexOf('sb'); //fix ở đây
                            }
                            
                        }
                        if(server + '' === 'cs'){
                            indexServerSb = arrServer.indexOf('cs');
                        }
                        returnLink = arrLink[indexServerSb];
                        if (returnLink && returnLink.includes('http://')) {
                            request(returnLink, (error, response, body) => {
                                let newBody = JSON.parse(body);
                                let linkk = '';
                                if(newBody[2]){
                                    linkk = newBody[2].file
                                } else if(!newBody[2] && newBody[1]){
                                    linkk = newBody[1].file
                                } else if(!newBody[2] && !newBody[1] && newBody[0]){
                                    linkk = newBody[0].file
                                }
                                return chooseTemplate(linkk, res);
                            })
//                             http.get(returnLink, function (response) {
//                                 return chooseTemplate(response.responseUrl, res);
                                  
//                             }).on('error', function (err) {
//                                 return chooseTemplate('', res);

//                             });
                        }
                        if (!returnLink) {
                            return chooseTemplate('', res);

                        }
                        if (returnLink && returnLink.includes('https://')) {
                            request(returnLink, (error, response, body) => {
                                let newBody = JSON.parse(body);
                                let linkk = '';
                                if(newBody[2]){
                                    linkk = newBody[2].file
                                } else if(!newBody[2] && newBody[1]){
                                    linkk = newBody[1].file
                                } else if(!newBody[2] && !newBody[1] && newBody[0]){
                                    linkk = newBody[0].file
                                }
                                return chooseTemplate(link, res);
                            })
//                             https.get(returnLink, function (response) {
//                                 return chooseTemplate(response.responseUrl, res);
//                             }).on('error', function (err) {
//                                 return chooseTemplate('', res);

//                             });
                        }

                    } else {
                        let indexServer = arrServer.indexOf(server);
                        if (indexServer !== -1) {
                            returnLink = arrLink[indexServer];
                            chooseTemplate(returnLink, res);
                        } else {
                            chooseTemplate('',res);
                        }
                        

                    }
                } else {
                    return chooseTemplate('', res);

                }


            } else {
                return chooseTemplate('', res);
            }
        })
    }



});

var chooseTemplate = (url, res) => {
    if (url !== '') {
        if (url.includes('drive.google.com') || url.includes('openload')) {
            return res.render("index2.ejs", {
                src: url +'?start=1'
            });
        } else if (url !== 'error') {
            return res.render("index.ejs", {
                src: url
            });
        }
    } else {
        return res.render("index3.ejs");
    }
}

var getFilmfromFB = (idFilm) => {
    let options = {
        method: 'GET',
        uri: 'https://graph.facebook.com/v3.1/' + idFilm,
        json: true,
        headers: {
            /* 'content-type': 'application/x-www-form-urlencoded' */ // Is set automatically
            'Content-Type': 'application/json'
        },
        qs: {
            access_token: access_token,
            fields: 'source'
        }
    };
    return rp(options);
}

router.get('/getfb', function (req, res, next) {
    let idFilm = req.query.play + '';
    
    Film.getFilm(idFilm).then(film => {
        if (film) {
            let timeFilm = film.time;
            if (Date.now() - timeFilm > 1000*3600*2) {
                getFilmfromFB(idFilm).then(filmObj => {
                    if (filmObj.source) {
                        let newSource = filmObj.source;
                        newSource = newSource.replace('video.xx.fbcdn.net','instagram.fhan5-3.fna.fbcdn.net')
                        Film.updateFilm(idFilm, {
                            source: newSource,
                            time: Date.now()
                        }).then(updatedFilm => {
                            console.log('update thanh cong: ', updatedFilm);
                            return res.render('index.ejs', {
                                src: updatedFilm.source
                            })
                        }, err => {
                            return res.render('index.ejs', {
                                src: film.source
                            })
                        })
                    }
                }, err => {
                    return res.render('index3.ejs', {
                        src: ''
                    })
                })
            } else {
                return res.render('index.ejs', {
                    src: film.source
                })
            }
        } else {
            return res.render('index3.ejs', {
                src: ''
            })
        }
    }, err => {
        console.log('err: ', err);
    })
})

router.get('/uploadfilm', function (req, res, next) {
    let idFilm = req.query.id + '';
    getFilmfromFB(idFilm).then(film => {
        if (film.source) {
            console.log('srt: ',film.source)
            Film.getFilm(idFilm).then(filmm => {
                if (!filmm) {
                    Film.createFilm({
                        idFilm: idFilm,
                        source: film.source.replace('video.xx.fbcdn.net','instagram.fhan5-3.fna.fbcdn.net'),
                        time: Date.now()
                    }).then(newFilm => res.json({
                        success: true,
                        msg: 'Upload phim thanh cong!'
                    }),err => res.json({
                        success: false,
                        msg: 'Upload phim that bai!'
                    }))
                } else {
                    return res.json({
                        success: false,
                        msg: 'Phim da ton tai!'
                    })
                }
            },err => res.json({
                success: false,
                msg: 'Xay ra loi tim kiem DB!'
            }))
        } else {
            return res.json({
                success: false,
                msg: 'Xay ra loi tim kiem Facebook!'
            })
        }
    }, err => {
        console.log(err);
        return res.json({
            success: false,
            msg: 'Xay ra loi tim kiem Facebook!'
        })
    })
})


var domainHeroku = "https://get-phim-tool.herokuapp.com/";
var domainLocal = "http://localhost:3030/";

var getHtml = async () => {
    let films = [];
    for (let j = 1; j <= 12; j++) {
        let option1 = {
            method: 'GET',
            uri: 'http://bilutv.com/danh-sach/phim-bo.html?page='+j
        };
        let contentPage1 = await rp(option1).catch(err => console.log(err));
        let $1 = cheerio.load(contentPage1, {
            decodeEntities: false
        });
        let listFilm1 = $1('.list-film').first().html();
        $1 = cheerio.load(listFilm1, {
            decodeEntities: false
        });
        let filmObj1 = [];
        for (let i = 1; i <= 24; i++) {
            let temp1 = $1("li:nth-child(" + i + ")").html() + '';
            let $$1 = cheerio.load(temp1, {
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
        }
        films = films.concat(filmObj1)
    }

    return films;
}

getHtml().then(arr => {
    filmObjs = arr;
    // console.log('reee: ', filmObjs[1]);
});



var savedFilmObj = [];

var listenForChanges = () => {
    let hasChanged = false;
    getHtml().then(arr => {
        let originalArrObjTitle = filmObjs.map(el => el.title);
        let originalArrObjSnippet = filmObjs.map(el => el.episode);
        let currentArrObjTitle = arr.map(el => el.title);
        let currentArrObjSnippet = arr.map(el => el.episode);
        for (let i = 0; i < currentArrObjTitle.length; i++) {
            let checkInclude = checkIncludes(currentArrObjTitle[i], originalArrObjTitle);
            if (!checkInclude.include) {
                createNewFilm(arr[i]).then(resultSendmail => {
                    console.log(resultSendmail);
                })
            } else {
                let matchIndex = checkInclude.matchIndex;
                let oldSnippet = filmObjs[matchIndex].snippet.trim();
                if (arr[i].snippet.trim() !== oldSnippet) {
                    hasChanged = true;
                    savedFilmObj.push(arr[i])
                } else {
                    console.log('no change!!')
                }
            }
        }
        if(hasChanged === true){
                let mailOptions = {
                    from: 'thienanhnguyen00009@gmail.com', // sender address
                    to: 'thienanhnguyen00008@gmail.com', // list of receivers
                    subject: '[PHIM360] - Có sự thay đổi - LẤY TOKEN', // Subject line
                    html: '<p>'+domainHeroku+'api/updatefilm</p>'
                };
                return transporter.sendMail(mailOptions);
        }
        filmObjs = arr;
        
    })
}

setInterval(function () {
    listenForChanges();
}, 1000*3600*5);



var createNewFilm = (objFilm) => {    
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

var updateFilm = async (newObjFilm,token) => {
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
    let resultSearch = await rp(options);
        if (resultSearch.items) { //tim thay
            let searchNames = resultSearch.items.map(el => el.title.split('-')[0].trim());
            let includeSearch = checkIncludes(titleFilm,searchNames);
            if (searchNames && includeSearch.include) {
                let updateId = resultSearch.items[includeSearch.matchIndex].id;
                try{
                   let result = await capnhatPhim(updateId,token,newObjFilm.href,newObjFilm.snippet.trim());
                    return {
                        success: true
                    }
                } catch(error){
                    return {
                        success: false
                    }
                }                
            } else {
                    return {
                        success: true
                    }
            }
        } else {
                    return {
                        success: true
                    }
        }



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


router.get('/createfilm', function (req, res, next) {
    let href = req.query.href + '';
    let snippet = req.query.snippet + '';
    console.log('snippet: ', snippet, href)
    let episode = parseInt(req.query.episode + '');
    createfilm(href, snippet, episode).then(filmObj => {
        return res.render('create.ejs', filmObj);
    })
})

var createfilm = async (href, snippet, episode) => {
    let liIndex;
    if (snippet.includes('/')) {
        liIndex = 0;
    } else {
        liIndex = 1;
    }
    console.log('li: ', liIndex)
    let options = {
        method: 'GET',
        uri: href
    }
    let content1 = await rp(options).catch(err => console.log(err));
    let $1 = cheerio.load(content1, {
        decodeEntities: false
    });
    let poster = $1('.film-info').first().html();
    let $2 = cheerio.load(poster, {
        decodeEntities: false
    });
    let thumbPhoto = $2('img')[0].attribs['data-cfsrc'];
    let vietName = $2('h1').first().text().trim();
    let engName = $2('.real-name').first().text().trim();

    let filmContentDiv = $1('.film-content').first().html();
    let $3 = cheerio.load(filmContentDiv, {
        decodeEntities: false
    });
    let filmContent = $3('p').first().text();
    let coverPhoto;
    if ($3('img').first()) {
        coverPhoto = $3('img')[0].attribs['data-cfsrc'];
    } else {
        coverPhoto = ''
    }
    let metaData = $2('.meta-data').first().html();
    let liCount = 1;
    while (true) {
        metaData = metaData.replace('<li>', '<li id="meta-data-' + liCount + '">');
        liCount++;
        if (!metaData.match(/<li>/g)) break;
    }
    let $4 = cheerio.load(metaData, {
        decodeEntities: false
    });
    let indexDienvien = liIndex + 3;
    let indexTheloai = liIndex + 4;
    let indexQuocgia = liIndex + 5;
    let indexThoiluong = liIndex + 6;
    let indexNamsanxuat = liIndex + 8;
    let indexDanhgia = liIndex + 11;

    let dienvien = $4("#meta-data-" + indexDienvien).text().replace('Diễn viên:', '').split(',').map(el => {
        return el.trim().replace(/\n/g, '')
    })
    dienvien = processDienVien(dienvien); //dienvien
    let theloai = $4("#meta-data-" + indexTheloai).text().replace('Thể loại:', '').split(',').map(el => {
        return el.trim().replace(/\n/g, '')
    })
    theloai = processTheLoai(theloai); //theloai
    let quocgia = $4("#meta-data-" + indexQuocgia).text().replace('Quốc gia:', '').split(',').map(el => {
        return el.trim().replace(/\n/g, '')
    })[0] //quocgia
    let thoiluong = $4("#meta-data-" + indexThoiluong).text().replace('Thời lượng:', '').split(',').map(el => {
        return el.trim().replace(/\n/g, '')
    })[0] // thoiluong
    let namsanxuat = $4("#meta-data-" + indexNamsanxuat).text().replace('Năm xuất bản:', '').split(',').map(el => {
        return el.trim().replace(/\n/g, '')
    })[0] // namsanxuat
    let danhgia = $4("#meta-data-" + indexDanhgia).text().split(' ').map(el => {
        return el.trim()
    })
    danhgia = danhgia.join('').replace('(', '').replace(')', '') + ' đánh giá';
    let linkXem = 'http://bilutv.com' + $2(".btn-see").first().attr("href");
    let options1 = {
        method: 'GET',
        headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/39.0.2171.95 Safari/537.36',
        },
        uri: linkXem
    }
    let contentXem = await rp(options1).catch(err => console.log(err));
    let $5 = cheerio.load(contentXem, {
        decodeEntities: false
    });
    let linkXemArr = [];
    let numberOfLiTag = $5("#list_episodes li").length;
    for (let i = 1; i <= numberOfLiTag; i++) {
        let link = $5("#list_episodes li:nth-child(" + i + ")").html();
        let $$ = cheerio.load(link, {
            decodeEntities: false
        });
        linkXemArr.push({
            href: 'http://bilutv.com' + $$("a").first().attr("href"),
            episode: $$("a").first().text()
        })
    }
    console.log('number: ', linkXemArr);
    let code = '<img id="mvi-thumb-data" src="' +
        thumbPhoto +
        '"/><br/>\n';
    code += '<img id="mvi-cover-data" src="' +
        coverPhoto +
        '"/><br/>\n';
    code += '<div id="mvi-status-data">\n[' +
        snippet +
        ']\n</div>\n';
    code += '<div id="mvi-desc-data">' + filmContent +
        '</div>\n';
    code += '<div id="mvi-genre-data">' + theloai +
        '</div>\n'
    code += '<div id="mvi-actor-data">' + dienvien +
        '</div>\n'
    code +=
        '<div id="mvi-director-data">pp_00_' + danhgia + '</div>\n';
    code += '<div id="mvi-country-data">' + quocgia +
        '</div>\n'
    code += '<div id="mvi-duration-data">' + thoiluong +
        '</div>\n'
    code += '<div id="mvi-res-data">' + snippet +
        '</div>\n'
    code += '<div id="mvi-year-data">' + namsanxuat +
        '</div>\n';
    code += '<div id="mvi-trailer-data"></div>\n';
    let newDiv = '';
    for (let i = 0; i < linkXemArr.length; i++) {
        newDiv += '<id data-src="http://get-phim-tool.herokuapp.com/api/phim?url=' + linkXemArr[i].href + '&domain=bilutv&server=st">Tập ' + linkXemArr[i].episode + '</id>\n'
    }
    code += '<div id="mvi-link-data">\n' + newDiv + '</div>'
    return {
        html: code,
        label: 'phim, phim-bo, aaa, hang-dau, ' + getCountry(quocgia + '') + ' ,' + theloai,
        name: vietName + ' - ' + engName
    }
}

var getCountry = (country) => {
    if (country === 'Âu - Mỹ') {
        return 'phim-au-my';
    }
    if (country === 'Nhật Bản') {
        return 'phim-nhat'
    }
    if (country === 'Trung Quốc' || country === 'Hồng Kông') {
        return 'phim-trung-quoc';
    }
    if (country === 'Hàn Quốc') {
        console.log('han quoc')
        return 'phim-han'
    }
    if (country === 'Thái Lan') {
        return 'phim-thai-lan'
    }
    if (country === 'Việt Nam') {
        return 'phim-viet'
    }
    return 'phim-au-my';
}

var processTheLoai = (theloaiArr) => {
    let tls = [];
    for (let tl of theloaiArr) {
        tl.split('-').map(el => {
            tls.push('Phim ' + el.trim());
        })
    }
    return tls;
}

var processDienVien = (dienvienArr) => {
    let finalDV = [];
    for (let dv of dienvienArr) {
        let orginalDv = dv;
        dv = dv.toLowerCase();
        dv = dv.split(' ').join('-');
        dv = ' pp_' + dv + '_' + orginalDv;
        finalDV.push(dv);
    }
    return finalDV
}

router.get('/updatefilm', function (req, res, next) {
    return res.render('update.ejs');

})

router.get('/getblog', function (req, res, next) {
    let idPost = req.query.idPost;
    let token = req.query.token;
    let href = req.query.href;
    let options = {
        method: 'GET',
        uri: 'https://www.googleapis.com/blogger/v3/blogs/144199127316688870/posts/' + idPost,
        headers: {
            'Content-Type': 'application/json;',
            'Authorization': 'Bearer ' + token,
        },
    };
    rp(options).then(result => {
        result = JSON.parse(result);
        let content = result.content;
        let $ = cheerio.load(content, {
            decodeEntities: false
        });
        let options1 = {
            method: 'GET',
            uri: href
        }
        rp(options1).then(content1 => {
            let $1 = cheerio.load(content1, {
                decodeEntities: false
            });
            let linkXem = 'http://bilutv.com' + $1(".btn-see").first().attr("href");
            let options1 = {
                method: 'GET',
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/39.0.2171.95 Safari/537.36',
                },
                uri: linkXem
            }
            rp(options1).then(contentXem => {
                let $5 = cheerio.load(contentXem, {
                    decodeEntities: false
                });
                let listEpisodes = $5("#list_episodes").html();
                return res.json({
                    success: true,
                    oldData: content,
                    newData: listEpisodes
                })
            }, err => {
                return res.json({
                    success: false,
                    data: err
                })
            })

        }, err => {
            return res.json({
                success: false,
                data: err
            })
        })

    }, err => {
        return res.json({
            success: false,
            data: err
        })
    })

})


router.post('/postblog', function (req, res, next) {
    let body = req.body;
    let token = req.query.token + '';
    let options = {
        method: 'POST',
        uri: 'https://www.googleapis.com/blogger/v3/blogs/144199127316688870/posts',
        body: JSON.stringify(body),
        headers: {
            'Authorization': 'Bearer ' + token,
            'Content-Type': 'application/json;'
        },
    };
    rp(options).then(result => {
        return res.json({
            success: true,
            data: result
        })
    }, err => {
        return res.json({
            success: false,
            data: err
        })
    })

})

router.post('/updateblog', function (req, res, next) {
    let token = req.query.token;
    capnhaPhimRoute(token).then(a => {
        let sum = savedFilmObj.length;
        let mailOptions = {
            from: 'thienanhnguyen00009@gmail.com', // sender address
            to: 'thienanhnguyen00008@gmail.com', // list of receivers
            subject: '[PHIM360] - KẾT QUẢ CẬP NHẬT', // Subject line
            html: '<div>Tổng: <div>' + sum + '</div></div><div>Thành công: <div>' + a.success + '</div></div><div>Thất bại: <div>' + a.fail + '</div></div>'
        };
        transporter.sendMail(mailOptions);
        return res.json({
            sum: sum,
            success: a.success,
            fail: a.fail
        });
    })
})

var capnhaPhimRoute = async (token) => {
    let success = 0;
    let fail = 0;
    let tempSavedFilmObj = [];
    for(let savedPost of savedFilmObj){
        let result = await updateFilm(savedPost,token);
        if(result.success === true){
            success++;
        } else {
            fail++;
            tempSavedFilmObj.push(savedPost);
        }
    }
    savedFilmObj = tempSavedFilmObj;
    return {
        success: success,
        fail: fail
    }
}
var capnhatPhim = async (idPost, token, href, newSnippet) => {
    let options = {
        method: 'GET',
        uri: 'https://www.googleapis.com/blogger/v3/blogs/144199127316688870/posts/' + idPost,
        headers: {
            'Content-Type': 'application/json;',
            'Authorization': 'Bearer ' + token,
        },
    };
    let oldFilm = await rp(options);
    let options1 = {
        method: 'GET',
        uri: href
    }
    let newContent = await rp(options1);
    let $1 = cheerio.load(newContent, {
        decodeEntities: false
    });
    let linkXem = 'http://bilutv.com' + $1(".btn-see").first().attr("href");
    let options2 = {
        method: 'GET',
        headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/39.0.2171.95 Safari/537.36',
        },
        uri: linkXem
    };
    let contentXem = await rp(options2);
    let $2 = cheerio.load(contentXem, {
        decodeEntities: false
    });
    let linkXemArr = [];
    let numberOfLiTag = $2("#list_episodes li").length;
    for (let i = 1; i <= numberOfLiTag; i++) {
        let link = $2("#list_episodes li:nth-child(" + i + ")").html();
        let $$ = cheerio.load(link, {
            decodeEntities: false
        });
        linkXemArr.push({
            href: 'http://bilutv.com' + $$("a").first().attr("href"),
            episode: $$("a").first().text()
        })
    }
    let updateContent = '\n';
    for (let i = linkXemArr.length; i >= 1; i--) {
        updateContent += '<id data-src="http://get-phim-tool.herokuapp.com/api/phim?url=' + linkXemArr[i-1].href.trim() + '&domain=bilutv&server=st">Tập ' + linkXemArr[i-1].episode.trim() + '</id>\n'
    }
    oldFilm = JSON.parse(oldFilm);
    let $6 = cheerio.load(oldFilm.content, {
        decodeEntities: false
    });
    $6('#mvi-status-data').first().text('['+newSnippet.trim()+']');
    $6('#mvi-res-data').first().text(newSnippet.trim()+'');
    $6('#mvi-link-data').first().text(updateContent);
    let date = new Date();
    let options3 = {
        method: 'PATCH',
        rejectUnauthorized: false,
        uri: 'https://www.googleapis.com/blogger/v3/blogs/144199127316688870/posts/' + idPost,
        json: true,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + token
        },
        body: {
            content: $6('body').html()+'',
            published: date.toISOString()
        }
    };
    return await rp(options3);

}

module.exports = router
