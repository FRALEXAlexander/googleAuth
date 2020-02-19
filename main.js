var fs = require('fs');
var https = require('https');
var express = require('express');
const request = require('request')


const { client_secret, client_id, redirect_uris } = JSON.parse(fs.readFileSync("credentials.json")).web;



let scopes = "https://www.googleapis.com/auth/youtube.readonly"

let getAccessCodeUrl = 'https://accounts.google.com/o/oauth2/auth?client_id=' + client_id + '&redirect_uri=' + redirect_uris + '&scope=' + scopes + '&response_type=code&access_type=offline';

console.log(getAccessCodeUrl)


var privateKey = fs.readFileSync('sslcert/host.key', 'utf8');
var certificate = fs.readFileSync('sslcert/host.cert', 'utf8');

var credentials = { key: privateKey, cert: certificate };

var app = express();

let currentToken = JSON.parse(fs.readFileSync("token.json"));


// POST method route
app.post('/auth', function (req, res) {
    res.send('POST request to the homepage');
    console.log(req)

});

app.get('/auth', function (req, res) {
    res.send('GET request to the homepage');
    var query = req.query;

    console.log(query.code)
    generateToken(query.code)
});

let port = 2000

var httpsServer = https.createServer(credentials, app);

httpsServer.listen(2000);

console.log('RESTful API server started on: ' + port);


function generateToken(code) {

    let url = 'https://accounts.google.com/o/oauth2/token?code=' + code + '&client_id=' + client_id + '&client_secret=' + client_secret + '&redirect_uri=' + redirect_uris + '&grant_type=authorization_code'

    request.post(url, (error, res, body) => {
        if (error) {
            console.error(error)
            return
        }
        console.log(`statusCode: ${res.statusCode}`)
        //console.log(body)
        currentToken = JSON.parse(body);
        console.log(currentToken)

        fs.writeFileSync("token.json",JSON.stringify(currentToken))

    })
}
function refreshToken(token) {
    let url = "https://accounts.google.com/o/oauth2/token?client_id=" + client_id + "&client_secret=" + client_secret + "&refresh_token=" + token + "&grant_type=refresh_token";
    request.post(url, (error, res, body) => {
        if (error) {
            console.error(error)
            return
        }
        console.log(`statusCode: ${res.statusCode}`)
        console.log(body)
        //currentToken = body;
    })
}

setInterval(async () => {
    let expires_in = JSON.parse(await checkAccessToken(currentToken.access_token)).expires_in;
    console.log(expires_in)
    if(expires_in <= 500){
        console.log("refresh")
        refreshToken(currentToken.refresh_token);
    }
    
}, 10000)



function checkAccessToken(accesstoken) {

    
    let url = 'https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=' + accesstoken

    console.log(accesstoken)

    return new Promise(function (resolve, reject) {
        request.post(url, (error, res, body) => {
            if (error) {
                //  console.error(error)
                return
            }
            // console.log(`statusCode: ${res.statusCode}`)
            resolve(body)
        })
    })

}