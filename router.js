const rp = require('request-promise');
const request = require('request');
var express = require('express');
var router = express.Router();
var CryptoJS = require('crypto-js');
var followRedirects = require('follow-redirects');
var http = followRedirects.http;
var https = followRedirects.https;

router.get('/phim', function (req, res, next) {
    let domain = req.query.domain + '.com';
    let url = req.query.url;
    let server = req.query.server;
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
    let passBilu = domain + '4590481877' + mId[1];
    console.log('md', mId[1]);
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
                                return res.render("index.ejs", {
                                    src: 'error'
                                });
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
                                return res.render("index.ejs", {
                                    src: 'error'
                                });
                            } else {
                                return res.render("index.ejs", {
                                    src: response.responseUrl
                                });
                            }
                        }).on('error', function (err) {
                            return res.render("index.ejs", {
                                src: 'error'
                            });
                        });
                    }
                    if (!returnLink) {
                        return res.render("index.ejs", {
                            src: 'error'
                        });
                    }
                    if (returnLink && returnLink.includes('https://')) {
                        https.get(returnLink, function (response) {
                            if (!response.responseUrl.includes('fbcdn.net')) {
                                return res.render("index.ejs", {
                                    src: 'error'
                                });
                            } else {
                                return res.render("index.ejs", {
                                    src: response.responseUrl
                                });
                            }
                        }).on('error', function (err) {
                            return res.render("index.ejs", {
                                src: 'error'
                            });
                        });
                    }

                } else {
                    let indexServer = arrServer.indexOf(server);
                    if (indexServer !== -1) {
                        returnLink = arrLink[indexServer];
                    }
                    console.log('check phim: ', returnLink)
                    return res.render("index.ejs", {
                        src: returnLink
                    });
                }
            } else {
                return res.render("index.ejs", {
                    src: 'error'
                });

            }


        } else {
            return res.json({})
        }
    })


});

module.exports = router
