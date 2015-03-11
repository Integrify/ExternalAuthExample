var http = require('http');
var url = require('url');
var querystring = require('querystring');


var integrifyconfig = require('./config.js'); // config settings pointing to your Integrify instance

var runOnPort = process.env.PORT || integrifyconfig.port; //supports running under IISNode - picks up the port from the IIS Site.


// use this to store the Redirect parameter keyed by the token passed to this page from Integrify
// it will be use to redirect the user back to the Integrify site if successful.
var  tokenCache = {};


http.createServer(function (req, res) {





    //render login form
    if  (req.method == "GET") {

        //use the url module to get the token from the querystring. This was passed from Integrify
        var parsedUrl = url.parse(req.url, true);
        var token = parsedUrl.query.token;
        var redirect = parsedUrl.query.redirect;

        //cache the redirect URL for this token;
        tokenCache[token] = redirect;


        res.writeHead(200, {'Content-Type': 'text/html'});
        var loginform = '<form action="/" method="POST">' +
            'token: <input type="text" name="token" value="' + token + '"\/> ' + // we will pass this through to the login form so that it is posted back for use in the call to /access/impersonate.
            'user name:<input type="text" name="username"\/> ' +
            'password: <input type="password" name="password"\/> <input type="submit"\/></form>';
        res.end(loginform);
    } else { //this is post from our login form

        var postBody = '';
        req.on('data', function (chunk) {
            postBody += chunk;
        });
        req.on('end', function () {

            //do your login logic
            console.log('Login Info Posted: ' + postBody);
            var credentials = querystring.parse(postBody);

            //fake logic to authenticate your user
            if (credentials.username == credentials.username && credentials.password == credentials.password) {
                //user is valid ;-)

                //now call Integrify to activate the token
                var accessTokenURL = integrifyconfig.impersonateUrl + '?key=' + integrifyconfig.key + '&user=' + credentials.username + '&token=' + credentials.token + '&request-token=true';

                //console.log(accessTokenURL);

                http.get(accessTokenURL, function (res2) {
                    console.log("Got response: " + res2.statusCode);
                    if (res2.statusCode == 200) {

                        var body = '';
                        res2.setEncoding('utf8');
                        res2.on("data", function (chunk) {
                            body = chunk;
                        });

                        res2.on("end", function (chunk) {
                           console.log('Response from impersonate call: ' + body );

                            //make sure we have a valid response
                            try {
                                var access = JSON.parse(body);
                                if (access.key) {
                                    console.log("Success!");
                                    //redirect the user back to Integrify
                                    res.writeHead(302,
                                        {Location: tokenCache[credentials.token]}
                                    );
                                    //clean up the token cache
                                    delete tokenCache[credentials.token];
                                    res.end();

                                }
                            }
                            catch (e) {

                                res.writeHead(500);
                                res.end('invalid login');
                            }

                        });


                    }
                    else {

                        res.writeHead(500);
                        res.end('invalid login');

                    }

                }).on('error', function (e) {
                    console.log("Got error: " + e.message);
                    res.writeHead(500);
                    res.end('invalid login');
                });


            }

        });


    }

}).listen(runOnPort, '127.0.0.1');
console.log('Server running at http://127.0.0.1:' + runOnPort);
