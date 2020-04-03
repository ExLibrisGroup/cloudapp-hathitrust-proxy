const middy = require('@middy/core');
const cors = require('@middy/http-cors');
const httpHeaderNormalizer = require('@middy/http-header-normalizer');
const request = require('request-promise');
const errors = require('request-promise/errors');
const OAuth = require('oauth-1.0a');
const crypto = require('crypto');

require('dotenv').config();
 
const oauth = OAuth({
    consumer: {
        key: process.env.HATHITRUST_KEY,
        secret: process.env.HATHITRUST_SECRET
    },
    signature_method: 'HMAC-SHA1',
    hash_function(base_string, key) {
        return crypto
            .createHmac('sha1', key)
            .update(base_string)
            .digest('base64')
    },
})

const extractCharset = header => {
  const re = /charset=([^()<>@,;:\"/[\]?.=\s]*)/i;
  return re.test(header) ? re.exec(header)[1] : null;
}

const toqs = params => Object.keys(params).map(key => key + '=' + params[key]).join('&');

const HATHITRUST_API_URL = 'https://babel.hathitrust.org/cgi/htd';

const handler = middy(async (event) => {
  //console.log('event', JSON.stringify(event));
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, body: null };
  }

  const params = {
    url: HATHITRUST_API_URL + event.path,
    method: event.httpMethod,
    qs: event.queryStringParameters,
    encoding: null,
    resolveWithFullResponse: true  
  }

  try {
    let body;
    const oauthParams = oauth.authorize({
      url: params.url + '?' + toqs(params.qs), 
      method: params.method
    })
    params.qs = Object.assign(params.qs, oauthParams);
    let resp = await request(params);
    let charset = extractCharset(resp.headers['content-type']);
    body = charset ? resp.body.toString(charset) : resp.body.toString('base64');
    return {
      statusCode: 200,
      isBase64Encoded: !!!charset,
      headers: { 'Content-Type': resp.headers['content-type'] },
      body: body
    };
  } catch (e) {
    console.error('An error occurred: ', e.message);
    let response = { statusCode: 400 };
    if (e instanceof errors.StatusCodeError) {
      response.statusCode = e.statusCode;
      response.body = JSON.stringify(e.error.toString('utf8'));
    } else {
      response.body = e.message
    }
    return response;
  }
});

handler
.use(httpHeaderNormalizer())
.use(cors({credentials: true, headers:'authorization'}));

module.exports = { handler };