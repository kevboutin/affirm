# affirm

A Node.js containerized service for RESTful APIs using hono for handling authentication and authorization for serverless and plain containerized workloads using zod for validations, and mongoose as an ORM for MongoDB.

## Prerequisites

- Node.js (v18 or higher)
- MongoDB (v6.0 or higher)
- npm, pnpm or yarn

## Getting Started

To install and run the service, you can use NPM:

```
npm install
npm run dev
```

You can send requests to the API via:

```
open http://localhost:3000
```

## Configuration

Copy `.env.example` to `.env` and change the values to suit your environment.

```env
NODE_ENV=development
HOST=localhost
PORT=3000
PROTOCOL=http
AUTHORIZATION_ENDPOINT_PATH=/authorize
DB_NAME=affirm
DB_URL=mongodb://127.0.0.1:27017/
LOG_LEVEL=info
CORS_ORIGIN=http://example.com
INTROSPECTION_ENDPOINT_PATH=/authorize
JWT_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----"
JWT_PUBLIC_KEY="-----BEGIN PUBLIC KEY-----"
SERVICE_DOCUMENTATION_ENDPOINT_PATH=/reference
TOKEN_ALGORITHM=RS256
TOKEN_AUDIENCE=affirm
TOKEN_ENDPOINT_PATH=/token
TOKEN_EXPIRATION_IN_SECONDS=3600
TOKEN_ISSUER=https://auth.affirm.com
USERINFO_ENDPOINT_PATH=/userinfo
```

## TO-DO

- [x] Add roles like user:read, user:modify, user:delete, role:modify, role:read, role:delete, etc. These are permission actions comprised of entityModel:action. https://www.youtube.com/watch?v=6IaEhu8epnA OR https://www.youtube.com/watch?v=wnSArmbI6qw
- [x] Add new seed script for roles (viewer, editor, admin)
- [x] Create public and private asymetric keys
- [x] Add Hono jwk auth middleware https://github.com/honojs/hono/pull/3826 or https://hono.dev/docs/middleware/builtin/jwk
- [ ] Implement SSO auth
- [x] Implement non-SSO auth (oauth2.1) https://datatracker.ietf.org/doc/html/draft-ietf-oauth-v2-1-12
- [x] Add userinfo endpoint
- [x] Add sub, authType, idpClient (client identifier) and idpMetadata (authorization server metadata URL) to user
- [x] Add metadata endpoint "/.well-known/oauth-authorization-server"
- [x] Add token and authorization endpoints
- [ ] Use hono/cookie to set the token to an http-only session cookie https://www.youtube.com/watch?v=uI5JgY7QaaQ @ 52:31

## Setting up for container usage

The following commands should suffice.

```shell
docker pull node:lts-alpine
docker build -t affirm .
#docker run -p 3000:3000 affirm
docker compose up
```

## OAuth

There are four distinct roles defined in the [OAuth 2.1 specification](https://datatracker.ietf.org/doc/html/draft-ietf-oauth-v2-1-12).

### resource owner:

    An entity capable of granting access to a protected resource. When the resource owner is a person, it is referred to as an end user. This is sometimes abbreviated as "RO".

### resource server:

    The server hosting the protected resources, capable of accepting and responding to protected resource requests using access tokens. The resource server is often accessible via an API. This is sometimes abbreviated as "RS".

### client:

    An application making protected resource requests on behalf of the resource owner and with its authorization. The term "client" does not imply any particular implementation characteristics (e.g., whether the application executes on a server, a desktop, or other devices).

### authorization server:

    The server issuing access tokens to the client after successfully authenticating the resource owner and obtaining authorization. This is sometimes abbreviated as "AS".

Most of this specification defines the interaction between the client and the authorization server, as well as between the client and resource server.

## Protocol Flow

     +--------+                               +---------------+
     |        |--(1)- Authorization Request ->|   Resource    |
     |        |                               |     Owner     |
     |        |<-(2)-- Authorization Grant ---|               |
     |        |                               +---------------+
     |        |
     |        |                               +---------------+
     |        |--(3)-- Authorization Grant -->| Authorization |
     | Client |                               |     Server    |
     |        |<-(4)----- Access Token -------|               |
     |        |                               +---------------+
     |        |
     |        |                               +---------------+
     |        |--(5)----- Access Token ------>|    Resource   |
     |        |                               |     Server    |
     |        |<-(6)--- Protected Resource ---|               |
     +--------+                               +---------------+

Figure 1: Abstract Protocol Flow

The abstract OAuth 2.1 flow illustrated in Figure 1 describes the interaction between the four roles and includes the following steps:

(1) The client requests authorization from the resource owner. The authorization request can be made directly to the resource owner (as shown), or preferably indirectly via the authorization server as an intermediary.

(2) The client receives an authorization grant, which is a credential representing the resource owner's authorization, expressed using one of the authorization grant types defined in this specification or using an extension grant type. The authorization grant type depends on the method used by the client to request authorization and the types supported by the authorization server.

(3) The client requests an access token by authenticating with the authorization server and presenting the authorization grant.

(4) The authorization server authenticates the client and validates the authorization grant, and if valid, issues an access token.

(5) The client requests the protected resource from the resource server and authenticates by presenting the access token.

(6) The resource server validates the access token, and if valid, serves the request.

The preferred method for the client to obtain an authorization grant from the resource owner (depicted in steps (1) and (2)) is to use the authorization server as an intermediary.

## Authorization Grant

An authorization grant represents the resource owner's authorization (to access its protected resources) used by the client to obtain an access token. This specification defines three grant types -- authorization code, refresh token, and client credentials -- as well as an extensibility mechanism for defining additional types. This implementation focuses on client credentials, but will use OpenID-Connect (OIDC) for SSO purposes.

### Client Credentials

The client credentials or other forms of client authentication (e.g., a private key used to sign a JWT, as described in [RFC7523](https://www.rfc-editor.org/info/rfc7523)) can be used as an authorization grant when the authorization scope is limited to the protected resources under the control of the client, or to protected resources previously arranged with the authorization server. Client credentials are used when the client is requesting access to protected resources based on an authorization previously arranged with the authorization server.

## Access Token

Access tokens are credentials used to access protected resources. An access token is a string representing an authorization issued to the client.

The string is considered opaque to the client, even if it has a structure. The client MUST NOT expect to be able to parse the access token value. The authorization server is not required to use a consistent access token encoding or format other than what is expected by the resource server.

Access tokens represent specific scopes and durations of access, granted by the resource owner, and enforced by the resource server and authorization server.

Access tokens (as well as any confidential access token attributes) MUST be kept confidential in transit and storage, and only shared among the authorization server, the resource servers the access token is valid for, and the client to which the access token is issued.

The authorization server MUST ensure that access tokens cannot be generated, modified, or guessed to produce valid access tokens by unauthorized parties.

## Transit Security

Implementations MUST use a mechanism to provide communication authentication, integrity and confidentiality such as Transport-Layer Security [RFC8446](https://www.rfc-editor.org/info/rfc8446), to protect the exchange of clear-text credentials and tokens either in the content or in header fields from eavesdropping, tampering, and message forgery.

OAuth URLs MUST use the https scheme except for loopback interface redirect URIs, which MAY use the http scheme. When using https, TLS certificates MUST be checked according to [RFC9110](https://www.rfc-editor.org/info/rfc9110).

## Interoperability

Interoperability is handled by using an authorization server metadata describing their configuration. This is defined in [RFC8414](https://www.rfc-editor.org/rfc/rfc8414.txt) and are registered in the IANA "OAuth Authorization Server Metadata" registry.

### Obtaining Authorization Server Metadata

Authorization servers supporting metadata MUST make a JSON document containing metadata as specified in Section 2 available at a path formed by inserting a well-known URI string into the authorization server's issuer identifier between the host component and the path component, if any. By default, the well-known URI string used is "/.well-known/oauth-authorization-server". This path MUST use the "https" scheme. The syntax and semantics of ".well-known" are defined in [RFC5785](https://www.rfc-editor.org/rfc/rfc5785.txt). The well-known URI suffix used MUST be registered in the IANA "Well-Known URIs" registry.

Different applications utilizing OAuth authorization servers in application-specific ways may define and register different well-known URI suffixes used to publish authorization server metadata as used by those applications. For instance, if the example application uses an OAuth authorization server in an example-specific way, and there are example-specific metadata values that it needs to publish, then it might register and use the "example-configuration" URI suffix and publish the metadata document at the path formed by inserting "/.well-known/example-configuration" between the host and path components of the authorization server's issuer identifier. Alternatively, many such applications will use the default well-known URI string "/.well-known/oauth-authorization-server", which is the right choice for general-purpose OAuth authorization servers, and not register an application-specific one.

An OAuth 2 application using this specification MUST specify what well-known URI suffix it will use for this purpose. The same authorization server MAY choose to publish its metadata at multiple well-known locations derived from its issuer identifier, for example, publishing metadata at both "/.well-known/example-configuration" and "/.well-known/oauth-authorization-server".

Some OAuth applications will choose to use the well-known URI suffix "openid-configuration". As described in Section 5, despite the identifier "/.well-known/openid-configuration", appearing to be OpenID specific, its usage in the specification is actually referring to a general OAuth 2 feature that is not specific to OpenID Connect.

## Client Types

This service has been designed around the following client profiles:

### web application:

    A web application is a client running on a web server. Resource owners access the client via an HTML user interface rendered in a user agent on the device used by the resource owner. The client credentials as well as any access tokens issued to the client are stored on the web server and are not exposed to or accessible by the resource owner.

### browser-based application:

    A browser-based application is a client in which the client code is downloaded from a web server and executes within a user agent (e.g., web browser) on the device used by the resource owner. Protocol data and credentials are easily accessible (and often visible) to the resource owner. If such applications wish to use client credentials, it is recommended to utilize the backend for frontend pattern. Since such applications reside within the user agent, they can make seamless use of the user agent capabilities when requesting authorization.

### native application:

    A native application is a client installed and executed on the device used by the resource owner. Protocol data and credentials are accessible to the resource owner. It is assumed that any client authentication credentials included in the application can be extracted. Dynamically issued access tokens and refresh tokens can receive an acceptable level of protection. On some platforms, these credentials are protected from other applications residing on the same device. If such applications wish to use client credentials, it is recommended to utilize the backend for frontend pattern, or issue the credentials at runtime using Dynamic Client Registration [RFC7591](https://www.rfc-editor.org/info/rfc7591).

## Client Identifier

Every client is identified in the context of an authorization server by a client identifier -- a unique string representing the registration information provided by the client. While the Authorization Server typically issues the client identifier itself, it may also serve clients whose client identifier was created by a party other than the Authorization Server. The client identifier is not a secret; it is exposed to the resource owner and MUST NOT be used alone for client authentication. The client identifier is unique in the context of an authorization server.

The client identifier is an opaque string whose size is defined by the identity provider (the authorization server). The client should avoid making assumptions about the identifier size. The authorization server SHOULD document the size of any identifier it issues.

If the authorization server supports clients with client identifiers issued by parties other than the authorization server, the authorization server SHOULD take precautions to avoid clients impersonating resource owners.

## Client Redirection Endpoint

The client redirection endpoint (also referred to as "redirect endpoint") is the URI of the client that the authorization server redirects the user agent back to after completing its interaction with the resource owner.

The authorization server redirects the user agent to one of the client's redirection endpoints previously established with the authorization server during the client registration process.

The redirect URI MUST be an absolute URI. The redirect URI MAY include an query string component, which MUST be retained when adding additional query parameters. The redirect URI MUST NOT include a fragment component.

Without requiring registration of redirect URIs, attackers can use the authorization endpoint as an open redirector.

## Client Authentication

All clients using this authorization server must be confidential.

It is RECOMMENDED to use asymmetric (public-key based) methods for client authentication such as signed JWTs ("Private Key JWT") in accordance with [RFC7523](https://www.rfc-editor.org/info/rfc7523).

## Client Secret

To support clients in possession of a client secret, the authorization server MUST support the client including the client credentials in the request body content using the following parameters:

### client_id:

    REQUIRED. The client identifier issued to the client during the registration process described by Section 2.2.

### client_secret:

    REQUIRED. The client secret.

The parameters can only be transmitted in the request content and MUST NOT be included in the request URI.

For example, a request to authenticate using the content parameters (with extra line breaks for display purposes only):

POST /token HTTP/1.1
Host: server.example.com
Content-Type: application/x-www-form-urlencoded

grant_type=client_credentials&client_id=s6BhdRkqt3&client_secret=7Fjfp0ZBr1KtDRbnfVdmIw

The authorization server MAY support the HTTP Basic authentication scheme for authenticating clients that were issued a client secret.

When using the HTTP Basic authentication scheme as defined in Section 11 of [RFC9110](https://www.rfc-editor.org/info/rfc9110) to authenticate with the authorization server, the client identifier is encoded using the application/x-www-form-urlencoded encoding algorithm and the encoded value is used as the username. The client secret is encoded using the same algorithm and used as the password.

For example (with extra line breaks for display purposes only):

Authorization: Basic czZCaGRSa3F0Mzo3RmpmcDBaQnIxS3REUmJuZlZkbUl3

Note: This method of initially form-encoding the client identifier and secret, and then using the encoded values as the HTTP Basic authentication username and password, has led to many interoperability problems in the past. Some implementations have missed the encoding step, or decided to only encode certain characters, or ignored the encoding requirement when validating the credentials, leading to clients having to special-case how they present the credentials to individual authorization servers. Including the credentials in the request body content avoids the encoding issues and leads to more interoperable implementations.

Since the client secret authentication method involves a password, the authorization server MUST protect any endpoint utilizing it against brute force attacks.

## Protocol Endpoints

The authorization process utilizes two authorization server endpoints (HTTP resources):

- Authorization endpoint - used by the client to obtain authorization from the resource owner via user agent redirection.

- Token endpoint - used by the client to exchange an authorization grant for an access token, typically with client authentication.

As well as one client endpoint:

- Redirection endpoint - used by the authorization server to return responses containing authorization credentials to the client via the resource owner user agent.

### Authorization Endpoint

The authorization endpoint is used to interact with the resource owner and obtain an authorization grant. The authorization server MUST first authenticate the resource owner.

The client should obtain this URL from the metadata endpoint.

The authorization server MUST support the use of the HTTP GET method Section 9.3.1 of [RFC9110](https://www.rfc-editor.org/info/rfc9110) for the authorization endpoint and MAY support the POST method (Section 9.3.3 of [RFC9110](https://www.rfc-editor.org/info/rfc9110)) as well.

Cross-Origin Resource Sharing [WHATWG.CORS](https://fetch.spec.whatwg.org/#http-cors-protocol) MUST NOT be supported at the Authorization Endpoint as the client does not access this endpoint directly, instead the client redirects the user agent to it.

### Token Endpoint

The token endpoint is used by the client to obtain an access token using a grant.

The client should obtain this URL from the metadata endpoint.

The client MUST use the HTTP POST method when making requests to the token endpoint.

Authorization servers that wish to support browser-based applications (applications running exclusively in client-side JavaScript without access to a supporting backend server) will need to ensure the token endpoint supports the necessary CORS [WHATWG.CORS](https://fetch.spec.whatwg.org/#http-cors-protocol) headers to allow the responses to be visible to the application.

## Token Request

The client makes a request to the token endpoint by sending the following parameters using the form-encoded serialization format (application/x-www-form-urlencoded) with a character encoding of UTF-8 in the HTTP request content:

### grant_type:

    REQUIRED. Identifier of the grant type the client uses with the particular token request. This authorization server uses the value of client_credentials. The grant type determines the further parameters required or supported by the token request.

### client_id:

    REQUIRED. The client identifier is needed when a form of client authentication that relies on the parameter is used, or the grant_type requires identification of public clients.

For example, the client makes the following HTTP request:

POST /token HTTP/1.1
Host: server.example.com
Authorization: Basic czZCaGRSa3F0MzpnWDFmQmF0M2JW
Content-Type: application/x-www-form-urlencoded

grant_type=client_credentials

## Token response

If the access token request is valid and authorized, the authorization server issues an access token.

If the request client authentication failed or is not valid, the authorization server returns an error response.

The authorization server issues an access token by creating an HTTP response, using the application/json media type as defined by [RFC8259](https://www.rfc-editor.org/info/rfc8259), with the following parameters and an HTTP 200 (OK) status code:

### access_token:

    REQUIRED. The access token issued by the authorization server.

### token_type:

    REQUIRED. The type of the access token issued. Value is case insensitive.

### expires_in:

    RECOMMENDED. A JSON number that represents the lifetime in seconds of the access token. For example, the value 3600 denotes that the access token will expire in one hour from the time the response was generated. If omitted, the authorization server SHOULD provide the expiration time via other means or document the default value.

### scope:

    RECOMMENDED, if identical to the scope requested by the client; otherwise, REQUIRED.

### refresh_token:

    OPTIONAL. The refresh token, which can be used to obtain new access tokens based on the grant passed in the corresponding token request.

The authorization server MUST include the HTTP Cache-Control response header field (see Section 5.2 of [RFC9111](https://www.rfc-editor.org/info/rfc9111)) with a value of no-store in any response containing tokens, credentials, or other sensitive information.

For example:

HTTP/1.1 200 OK
Content-Type: application/json
Cache-Control: no-store

{
"access_token": "2YotnFZFEjr1zCsicMWpAA",
"token_type": "Bearer",
"expires_in": 3600
}

## Error Response

The authorization server responds with an HTTP 400 (Bad Request) status code (unless specified otherwise) and includes the following parameters with the response:

### error:

    REQUIRED. A single ASCII [USASCII] error code from the following:

#### invalid_request:

    The request is missing a required parameter, includes an unsupported parameter value (other than grant type), repeats a parameter, includes multiple credentials, utilizes more than one mechanism for authenticating the client, or is otherwise malformed.

#### invalid_client:

    Client authentication failed (e.g., unknown client, no client authentication included, or unsupported authentication method). The authorization server MAY return an HTTP 401 (Unauthorized) status code to indicate which HTTP authentication schemes are supported. If the client attempted to authenticate via the Authorization request header field, the authorization server MUST respond with an HTTP 401 (Unauthorized) status code and include the WWW-Authenticate response header field matching the authentication scheme used by the client.

#### invalid_grant:

    The provided authorization grant is not valid.

#### unauthorized_client:

    The authenticated client is not authorized to use this authorization grant type.

#### unsupported_grant_type:

    The authorization grant type is not supported by the authorization server.

#### invalid_scope:

    The requested scope is invalid, unknown, malformed, or exceeds the scope granted by the resource owner.

Values for the error parameter MUST NOT include characters outside the set %x20-21 / %x23-5B / %x5D-7E.

### error_description:

    OPTIONAL. Human-readable ASCII [USASCII] text providing additional information, used to assist the client developer in understanding the error that occurred. Values for the error_description parameter MUST NOT include characters outside the set %x20-21 / %x23-5B / %x5D-7E.

### error_uri:

    OPTIONAL. A URI identifying a human-readable web page with information about the error, used to provide the client developer with additional information about the error. Values for the error_uri parameter MUST conform to the URI-reference syntax and thus MUST NOT include characters outside the set %x21 / %x23-5B / %x5D-7E.

The parameters are included in the content of the HTTP response using the application/json media type.

For example:

HTTP/1.1 400 Bad Request
Content-Type: application/json
Cache-Control: no-store

{
"error": "invalid_request"
}

## Client Credentials Grant

The client can request an access token using only its client credentials (or other supported means of authentication) when the client is requesting access to the protected resources under its control, or those of another resource owner that have been previously arranged with the authorization server.

The client credentials grant type MUST only be used by confidential clients.

     +---------+                                  +---------------+
     |         |                                  |               |
     |         |>--(1)- Client Authentication --->| Authorization |
     | Client  |                                  |     Server    |
     |         |<--(2)---- Access Token ---------<|               |
     |         |                                  |               |
     +---------+                                  +---------------+

Figure 2: Client Credentials Grant

The use of the client credentials grant illustrated in Figure 2 includes the following steps:

(1) The client authenticates with the authorization server and requests an access token from the token endpoint.

(2) The authorization server authenticates the client, and if valid, issues an access token.

## Bearer Token Requests

The specification allows for two different methods of sending Bearer tokens in resource requests. These are the Authorization request header field and the Form-Encoded content parameter. Only the former will be used by this Authorization server implementation.

### Authorization request header field

When sending the access token in the Authorization request header field defined by HTTP/1.1 [RFC7235](https://www.rfc-editor.org/info/rfc7235), the client uses the Bearer scheme to transmit the access token.

For example:

GET /resource HTTP/1.1
Host: server.example.com
Authorization: Bearer mF_9.B5f-4.1JqM

As described in Section 11.1 of [RFC9110](https://www.rfc-editor.org/info/rfc9110), the string bearer is case-insensitive. This means all of the following are valid uses of the Authorization header:

Authorization: Bearer mF_9.B5f-4.1JqM

Authorization: bearer mF_9.B5f-4.1JqM

Authorization: BEARER mF_9.B5f-4.1JqM

Authorization: bEaReR mF_9.B5f-4.1JqM

### Form-Encoded content parameter

When sending the access token in the HTTP request content, the client adds the access token to the request content using the access_token parameter. The client MUST NOT use this method unless all of the following conditions are met:

The HTTP request includes the Content-Type header field set to application/x-www-form-urlencoded.

The content follows the encoding requirements of the application/x-www-form-urlencoded content-type as defined by the URL Living Standard [WHATWG.URL](https://url.spec.whatwg.org/).

The HTTP request content is single-part.

The content to be encoded in the request MUST consist entirely of ASCII [USASCII](https://datatracker.ietf.org/doc/html/draft-ietf-oauth-v2-1-12#USASCII) characters.

The HTTP request method is one for which the content has defined semantics. In particular, this means that the GET method MUST NOT be used. This requirement has forced this Authorization server implementation to use the Authorization request header field for Bearer token use.

For example, the client makes the following HTTP request using transport-layer security:

POST /resource HTTP/1.1
Host: server.example.com
Content-Type: application/x-www-form-urlencoded

access_token=mF_9.B5f-4.1JqM

## Access Token Validation

After receiving the access token, the resource server MUST check that the access token is not yet expired, is authorized to access the requested resource, was issued with the appropriate scope, and meets other policy requirements of the resource server to access the protected resource.

A standardized method to query the authorization server to check the validity of an access token is defined in Token Introspection [RFC7662](https://www.rfc-editor.org/info/rfc7662).

A standardized method of encoding information in a token string is defined in JWT Profile for Access Tokens [RFC9068](https://www.rfc-editor.org/info/rfc9068).

## Error Response

If a resource access request fails, the resource server SHOULD inform the client of the error.

### The WWW-Authenticate Response Header Field

If the protected resource request does not include authentication credentials or does not contain an access token that enables access to the protected resource, the resource server MUST include the HTTP WWW-Authenticate response header field; it MAY include it in response to other conditions as well. The WWW-Authenticate header field uses the framework defined by HTTP/1.1 [RFC7235](https://www.rfc-editor.org/info/rfc7235).

All challenges for this token type MUST use the auth-scheme value Bearer. This scheme MUST be followed by one or more auth-param values. The auth-param attributes used or defined by this specification for this token type are as follows. Other auth-param attributes MAY be used as well.

#### realm:

    A realm attribute MAY be included to indicate the scope of protection in the manner described in HTTP/1.1 [RFC7235](https://www.rfc-editor.org/info/rfc7235). The realm attribute MUST NOT appear more than once.

#### scope:

    The scope attribute is a space-delimited list of case-sensitive scope values indicating the required scope of the access token for accessing the requested resource. Scope values are implementation defined; there is no centralized registry for them; allowed values are defined by the authorization server. The order of scope values is not significant. In some cases, the scope value will be used when requesting a new access token with sufficient scope of access to utilize the protected resource. Use of the scope attribute is OPTIONAL. The scope attribute MUST NOT appear more than once. The scope value is intended for programmatic use and is not meant to be displayed to end users.

Two example scope values follow; these are taken from the OpenID Connect [OpenID.Messages](http://openid.net/specs/openid-connect-messages-1_0.html) and the Open Authentication Technology Committee (OATC) Online Multimedia Authorization Protocol [OMAP](https://www.svta.org/product/online-multimedia-authorization-protocol/) OAuth 2.0 use cases, respectively:

scope="openid profile email"

scope="urn:example:channel=HBO&urn:example:rating=G,PG-13"

#### error:

    If the protected resource request included an access token and failed authentication, the resource server SHOULD include the error attribute to provide the client with the reason why the access request was declined.

#### error_description:

    The resource server MAY include the error_description attribute to provide developers a human-readable explanation that is not meant to be displayed to end users.

#### error_uri:

    The resource server MAY include the error_uri attribute with an absolute URI identifying a human-readable web page explaining the error.

The error, error_description, and error_uri attributes MUST NOT appear more than once.

## Error Codes

When a request fails, the resource server responds using the appropriate HTTP status code (typically, 400, 401, 403, or 405) and includes one of the following error codes in the response:

### invalid_request:

    The request is missing a required parameter, includes an unsupported parameter or parameter value, repeats the same parameter, uses more than one method for including an access token, or is otherwise malformed. The resource server SHOULD respond with the HTTP 400 (Bad Request) status code.

### invalid_token:

    The access token provided is expired, revoked, malformed, or invalid for other reasons. The resource server SHOULD respond with the HTTP 401 (Unauthorized) status code. The client MAY request a new access token and retry the protected resource request.

### insufficient_scope:

    The request requires higher privileges (scopes) than provided by the scopes granted to the client and represented by the access token. The resource server SHOULD respond with the HTTP 403 (Forbidden) status code and MAY include the scope attribute with the scope necessary to access the protected resource.

Extensions may define additional error codes or specify additional circumstances in which the above error codes are retured.

If the request lacks any authentication information (e.g., the client was unaware that authentication is necessary or attempted using an unsupported authentication method), the resource server SHOULD NOT include an error code or other error information.For example:

HTTP/1.1 401 Unauthorized
WWW-Authenticate: Bearer realm="example"

And in response to a protected resource request with an authentication attempt using an expired access token:

HTTP/1.1 401 Unauthorized
WWW-Authenticate: Bearer realm="example",
error="invalid_token",
error_description="The access token expired"

## Recommendations

### Safeguard Bearer Tokens

Client implementations MUST ensure that bearer tokens are not leaked to unintended parties, as they will be able to use them to gain access to protected resources. This is the primary security consideration when using bearer tokens and underlies all the more specific recommendations that follow.

### Validate TLS Certificate Chains

The client MUST validate the TLS certificate chain when making requests to protected resources. Failing to do so may enable DNS hijacking attacks to steal the token and gain unintended access.

### Always Use TLS (https)

Clients MUST always use TLS (https) or equivalent transport security when making requests with bearer tokens. Failing to do so exposes the token to numerous attacks that could give attackers unintended access.

### Access Token Storage in Cookies

Implementations MUST NOT store bearer tokens within cookies that can be sent in the clear (which is the default transmission mode for cookies). Implementations that do store bearer tokens in cookies MUST take precautions against cross-site request forgery.

### Issue Short-Lived Bearer Tokens

Authorization servers SHOULD issue short-lived bearer tokens, particularly when issuing tokens to clients that run within a web browser or other environments where information leakage may occur. Using short-lived bearer tokens can reduce the impact of them being leaked.

### Issue Scoped Bearer Tokens

Authorization servers SHOULD issue bearer tokens that contain an audience restriction, scoping their use to the intended relying party or set of relying parties.

### Do Not Use Bearer Tokens in URLs

Bearer tokens MUST NOT be passed in page URLs (for example, as query string parameters). Instead, bearer tokens SHOULD be passed in HTTP message headers or message bodies for which confidentiality measures are taken. Browsers, web servers, and other software may not adequately secure URLs in the browser history, web server logs, and other data structures. If bearer tokens are passed in page URLs, attackers might be able to steal them from the history data, logs, or other unsecured locations.

## Documentation

API documentation can be found at http://localhost:3000/reference with the raw OpenAPI specification at http://localhost:3000/doc. I would recommend using the reference URL to use the API.

## Testing

To run unit tests, use the following:

```
npm run test
```

## Project Structure

```
├── src/
│   ├── db/                # Data schemas
│   │   ├── models/        # Database models
│   │   └── repositories/  # Database models
│   ├── middleware/        # Middleware
│   ├── openapi/
│   │   ├── helpers/       # Documentation helpers
│   │   └── schemas/       # Schemas
│   ├── routes/            # API routes
│   │   ├── roles/         # Role CRUD
│   │   └── users/         # User CRUD
│   └── app.mjs            # App entry point
└── .env                   # Environment variables
```

## Available Scripts

- `npm run dev` - Start the development server with hot-reload
- `npm start` - Start the production server
- `npm run lint` - Run the linter
- `npm run test` - Run tests

## Features

### Core Technologies

- **[Hono](https://hono.dev/)** - Lightweight, ultrafast web framework
- **[MongoDB](https://www.mongodb.com/)** with **[Mongoose](https://mongoosejs.com/)** - NoSQL database with elegant ODM
- **[Zod](https://zod.dev/)** - Schema validation

### API Features

- RESTful API architecture
- OpenAPI + Scalar documentation
- Request validation and sanitization
- Error handling middleware
- Security response headers
- GZip compression
- JWT authentication (WIP)
- Role-based access control (RBAC) (WIP)
- Rate limiting (WIP)
- CORS support

### Developer Experience

- Hot reload development server
- Prettier code formatting
- Vitest testing setup
- Environment variable management
- Comprehensive logging system

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Style Guide

### Code Style

- We use Prettier for code formatting
- Max line length is 120 characters
- Use 4 spaces for indentation
- Use double quotes for strings
- Always use semicolons
- Use camelCase for variables and functions
- Use PascalCase for classes
- Use UPPER_SNAKE_CASE for constants

### Naming Conventions

- **Files**: Use camelCase for filenames (e.g., `userController.mjs`)
- **Folders**: Use kebab-case for folder names (e.g., `api-routes`)
- **Classes**: Use PascalCase (e.g., `UserController`)
- **Types**: Use PascalCase (e.g., `UserResponse`)
- **Constants**: Use UPPER_SNAKE_CASE (e.g., `MAX_RETRY_ATTEMPTS`)
- **Variables**: Use camelCase (e.g., `userData`)
- **Functions**: Use camelCase (e.g., `getUserById`)

### API Endpoints

- Use plural nouns for resources (e.g., `/users`, `/items`)
- Use kebab-case for multi-word resources (e.g., `/user-profiles`)
- Use proper HTTP methods:
    - GET: Retrieve resources
    - POST: Create resources
    - PUT: Update resources (full updates only)
    - PATCH: Partially update resources
    - DELETE: Remove resources

### Git Commit Messages

- Use the present tense ("Add feature" not "Added feature")
- Use the imperative mood ("Move cursor to..." not "Moves cursor to...")
- Limit the first line to 72 characters or less
- Structure commits as follows:

    ```
    <type>(<scope>): <subject>

    <body>

    <footer>
    ```

- Types:
    - feat: New feature
    - fix: Bug fix
    - docs: Documentation changes
    - style: Code style changes (formatting, etc)
    - refactor: Code refactoring
    - test: Adding or updating tests
    - chore: Maintenance tasks

### Documentation

- All public APIs must be documented
- Use JSDoc for function and class documentation
- Include examples in documentation when helpful
- Keep documentation up to date with code changes

### Testing

- Write unit tests for all new features
- Follow AAA pattern (Arrange, Act, Assert)
- Test files should mirror the file structure of the code
- Name test files with `.test.mjs` suffix
- Use meaningful test descriptions

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details
