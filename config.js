integrifyconfig = {
    key: 'integrifyinstance', //your integrify consumer key. you can create one by adding a row to your OAUTH_CONSUMERS table and activating it: https://developer.integrify.com/external-auth/activation
    impersonateUrl: 'http://localhost:3000/access/impersonate', //point this to your Integrify instance
    port: 8080 //port to run on not required under IISNODE
};
module.exports  = integrifyconfig;