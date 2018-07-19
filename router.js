const rp = require('request-promise');
const request = require('request');
var express = require('express');
var router = express.Router();
var CryptoJS = require('crypto-js');
var followRedirects = require('follow-redirects');
var http = followRedirects.http;
var https = followRedirects.https;
followRedirects.maxRedirects = 50;

router.get('/phim', function (req, res, next) {
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
    let pass = 'bilutv.com' + '4590481877' + mId[1];
    console.log('md', mId[1]);
    request(url, (error, response, body) => {
        body += '';
        if (!error) {
            let arrFile = body.match(/"file":"([^"]+)"/g);
            let arrServer = body.match(/("server":"\w+")/g);
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
                        let bytes = CryptoJS.AES.decrypt(encFile, pass);
                        let plaintext = bytes.toString(CryptoJS.enc.Utf8);
                        arrLink.push(plaintext);
                    }
                }
            }
            let returnLink;
            if (server + '' === 'sb' || server + '' === 'st') {
                let indexServerSb1 = arrServer.indexOf(server);
                let indexServerSb2 = arrServer.indexOf(server, indexServerSb1 + 1);
                if (indexServerSb2 !== -1) {
                    returnLink = arrLink[indexServerSb2]
                } else {
                    returnLink = arrLink[indexServerSb1];
                }
                if (returnLink && returnLink.includes('http://')) {
                    console.log('http is running');
                    http.get(returnLink, function (response) {
                          response.on('data', function (chunk) {
                            console.log(chunk.toString('utf8'));
                          });
                        return res.render("index.ejs", {
                            src: response.responseUrl
                        });
                    }).on('error', function (err) {
                        console.log('loi roi!!', err);
                        return res.render("index.ejs", {
                            src: 'error'
                        });
                    });
                }
                if(!returnLink){
                    return res.render("index.ejs", {
                        src: 'error'
                    });
                }
//                 if (returnLink) {
//                     returnLink = returnLink.replace('http://', 'https://');
//                     console.log('https: ', returnLink)
//                 }
                if (returnLink && returnLink.includes('https://')) {
                    https.get(returnLink, function (response) {
                        console.log('https resp: , ',response.responseUrl);
                        return res.render("index.ejs", {
                            src: response.responseUrl
                        });
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
                return res.render("index.ejs", {
                    src: returnLink
                });
            }

        } else {
            return res.json({})
        }
    })


});

module.exports = router
