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

function unpack(p) {
    c = p;
    var a = 5,
        x = 1;
    while (x < a) {
        c = unescape(c);
        if (/eval\(+function\(/.test(c)) {
            c = depack(c);
            x++
        } else {
            break
        }
    };
    c = unescape(c);
    return c;
}

function depack(p) {
    if (p != "") {
        c = unescape(p);
        var _e = eval,
            s = "eval=function(v){c=v;};" + c + ";eval=_e;";
        eval(s)
    } else {
        c = p
    };
    return c
}

router.get('/phim', function (req, res, next) {
    let domain = req.query.domain;
    let url = req.query.url;
    let server = req.query.server;

    if (domain === 'phimmoi') {
        request({
            method: 'GET',
            url: url,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/39.0.2171.95 Safari/537.36',
            }
        }, (error, response, body) => {
            body += '';
            var $ = cheerio.load(body, {
                decodeEntities: false
            });
            let elsScript = $('script').toArray();
            let target = '';
            for (el of elsScript) {
                if (el.children[0]) {
                    let data = el.children[0].data;
                    if (data && data.includes('eval')) {
                        target = data.slice(1, data.length);
                        break;
                    }
                }
            }
            if (target && target !== '') {
                let decodedText = unpack(target);
                let urlPM = decodedText.match(/http:\/\/episode.*"/g)[0].split('"')[0];
                console.log('episode: ', urlPM)
                request({
                    method: 'POST',
                    url: 'http://phim360.xyz/index.php',
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/39.0.2171.95 Safari/537.36',
                    },
                    json: true,
                    body: {
                        'bodyy': urlPM +''
                    }
                }, (error, response, bodyy) => {
                    console.log('RTT" ',bodyy);
                    bodyy += '';
                    let match = bodyy.match(/https:\\\/\\\/video.*"/g);
                    if(match !== null){
                        let finalUrl = match[0].split('"')[0];
                        finalUrl = finalUrl.replace(/\\\//g, '/')
                        return chooseTemplate(finalUrl, res);
                    } else {
                        return chooseTemplate('', res);
                    }


                })
            } else {
                return chooseTemplate('', res);
            }

        })
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

module.exports = router
