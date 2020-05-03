# Cloud App Authorizer

Implementation of an [AWS API Gateway Lambda Authorizer](https://docs.aws.amazon.com/apigateway/latest/developerguide/apigateway-use-lambda-authorizer.html) which validates an [Ex Libris Cloud App](https://developers.exlibrisgrop.com/cloudapps) [authorization token](https://developers.exlibrisgroup.com/cloudapps).

The following environment variables are available:
* `CLOUDAPP_AUTHORIZER_ALGORITHM`: Defauilt `RS256`
* `CLOUDAPP_AUTHORIZER_IGNORE_EXPIRATION`: For development, default false
* `CLOUDAPP_AUTHORIZER_ALLOWED_APPS`: Comma separated list of allowed apps
