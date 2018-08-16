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
var access_token = 'EAAZA5TUfQPxcBADeYgJY9m45LZCCBzxZBrldWru5VRkrx1RFs7bYiZCZBheZAjFZAAePAvZBLtl86MyNFADoaHlZC6sK30WBgnMqDpLsWllY1NzyEGQ2XiWYkZCP1z9G0xawNATOlAhxwI1cgGQjeNu6lBFddjns6NZBlKCJpQETFpoCZCw8a21VW8fhUWbxfn7IZBZBEZD'
var iplocation = require('iplocation')

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
                    if (server + '' === 'sb' || server + '' === 'st') {
                        let indexServerSb = '';
                        if(server+''=== 'sb'){
                            indexServerSb = arrServer.indexOf('st');
                        }
                        if(server+''=== 'st'){
                            indexServerSb = arrServer.indexOf('sb');
                        }
                        returnLink = arrLink[indexServerSb];
                        if (returnLink && returnLink.includes('http://')) {
                            http.get(returnLink, function (response) {
                                return chooseTemplate(response.responseUrl.replace('http:','https:'), res);
//                                 if (!response.responseUrl.includes('fbcdn.net')) {
//                                     return chooseTemplate('', res);
//                                 } else {
//                                     return chooseTemplate(response.responseUrl, res);

//                                 }
                            }).on('error', function (err) {
                                return chooseTemplate('', res);

                            });
                        }
                        if (!returnLink) {
                            return chooseTemplate('', res);

                        }
                        if (returnLink && returnLink.includes('https://')) {
                            https.get(returnLink, function (response) {
                                return chooseTemplate(response.responseUrl.replace('http:','https:'), res);
//                                 if (!response.responseUrl.includes('fbcdn.net')) {
//                                     return chooseTemplate('', res);

//                                 } else {
//                                     return chooseTemplate(response.responseUrl, res);

//                                 }
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
            if (Date.now() - timeFilm > 1000*3600*2) {
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


var domainHeroku = "https://get-phim-tool.herokuapp.com/";
var domainLocal = "http://localhost:3030/";

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
    let newContent = req.body.html;
    let date = new Date();
    let token = req.query.token + '';
    let idPost = req.query.idPost;
    let options = {
        method: 'PATCH',
        rejectUnauthorized: false,
        uri: 'https://www.googleapis.com/blogger/v3/blogs/144199127316688870/posts/' + idPost,
        json: true,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + token
        },
        body: {
            content: newContent,
            published: date.toISOString()
        }
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


module.exports = router
