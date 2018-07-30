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
var access_token = 'EAAZA5TUfQPxcBADeYgJY9m45LZCCBzxZBrldWru5VRkrx1RFs7bYiZCZBheZAjFZAAePAvZBLtl86MyNFADoaHlZC6sK30WBgnMqDpLsWllY1NzyEGQ2XiWYkZCP1z9G0xawNATOlAhxwI1cgGQjeNu6lBFddjns6NZBlKCJpQETFpoCZCw8a21VW8fhUWbxfn7IZBZBEZD'


router.get('/phim', function (req, res, next) {
    let domain = req.query.domain;
    let url = req.query.url;
    let server = req.query.server;

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
        request(url, (error, response, body) => {
            body += '';
            if (!error) {
                let arrFile = body.match(/"file":"([^"]+)"/g);
                let arrServer = body.match(/("server":"\w+")/g);
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
                    if (server + '' === 'sb') {
                        let indexServerSb = arrServer.indexOf(server);
                        returnLink = arrLink[indexServerSb];
                        if (returnLink && returnLink.includes('http://')) {
                            http.get(returnLink, function (response) {
                                if (!response.responseUrl.includes('fbcdn.net')) {
                                    return chooseTemplate('', res);
                                } else {
                                    return chooseTemplate(response.responseUrl, res);

                                }
                            }).on('error', function (err) {
                                return chooseTemplate('', res);

                            });
                        }
                        if (!returnLink) {
                            return chooseTemplate('', res);

                        }
                        if (returnLink && returnLink.includes('https://')) {
                            https.get(returnLink, function (response) {
                                if (!response.responseUrl.includes('fbcdn.net')) {
                                    return chooseTemplate('', res);

                                } else {
                                    return chooseTemplate(response.responseUrl, res);

                                }
                            }).on('error', function (err) {
                                return chooseTemplate('', res);

                            });
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
            if (Date.now() - timeFilm > 1000) {
                getFilmfromFB(idFilm).then(filmObj => {
                    if (filmObj.source) {
                        let newSource = filmObj.source;
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
                        source: film.source,
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



module.exports = router
