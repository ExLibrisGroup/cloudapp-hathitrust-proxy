const jwt = require('jsonwebtoken');
const algorithm = process.env.CLOUDAPP_AUTHORIZER_ALGORITHM || 'RS256';
const ignoreExpiration = (process.env.CLOUDAPP_AUTHORIZER_IGNORE_EXPIRATION=='true');

// Policy helper function
const generatePolicy = (principalId, effect, resource) => {
  const authResponse = {};
  authResponse.principalId = principalId;
  if (effect && resource) {
    const policyDocument = {};
    policyDocument.Version = '2012-10-17';
    policyDocument.Statement = [];
    const statementOne = {};
    statementOne.Action = 'execute-api:Invoke';
    statementOne.Effect = effect;
    statementOne.Resource = resource;
    policyDocument.Statement[0] = statementOne;
    authResponse.policyDocument = policyDocument;
  }
  return authResponse;
};

module.exports.auth = (event, context, callback) => {
  console.log('event', event);

  if (!event.authorizationToken) {
    return callback('Unauthorized');
  }

  const tokenParts = event.authorizationToken.split(' ');
  const tokenValue = tokenParts[1];

  if (!(tokenParts[0].toLowerCase() === 'bearer' && tokenValue)) {
    return callback('Unauthorized');
  }

  const publicKey = require('fs').readFileSync(__dirname + '/public-key.pem');
  try {
    const verified = jwt.verify(tokenValue, publicKey, {ignoreExpiration, algorithm});
    // Verify issuer
    if (!verified.iss.startsWith('ExlCloudApp')) throw new Error('Invalid issuer.');
    console.log('valid from customAuthorizer', verified);
    return callback(null, generatePolicy(verified.sub, 'Allow', '*'));
  } catch (e) {
    console.log('invalid token', e.message);
    return callback('Unauthorized');
  }   
};