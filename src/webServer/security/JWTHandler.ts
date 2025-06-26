import {FastifyRequest} from "fastify";

export class JWTHandler {


  public static checkJWTAvailability(request: FastifyRequest): boolean {
    if (request.headers["authorization"]) {
      //If it starts with "Bearer ", we will extract return true
      if (request.headers["authorization"].startsWith("Bearer ")) {
        return true;
      }
    }
    return false;
  }

  public static extractJwtFromRequest(request: FastifyRequest): any {
    let authHeader = request.headers["authorization"] as string;
    let token = request.headers["authorization"].split(" ")[1]; //We split the header to get the token, the token is after the "Bearer " part of the header
    return token;

  }

  public static verifyJwt(token: string): boolean {
    const jwtHandler = require('jsonwebtoken');
    try {
      jwtHandler.verify(token, public_key, {algorithms: ["RS256"], ignoreExpiration: true});
      return true;
    } catch (e) {
      return false;
    }
  }

  public static decodeJwt(token: string): any {
    const jwtHandler = require('jsonwebtoken');
    return jwtHandler.decode(token);
  }

}

//This is the public key that allows the microservice to verify that a JWT was issued by the main stack
const public_key = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAnqKYoNnFQbvDOQ4+SPZI
fl2RzvnOc4KtYOFOETm+D9VVCsoKBU5m4PMnhteb9g2HbjpgY61sQ8Uwe+/H7F4I
5IIVanzMY70fUARdXZYjSmZO4g0Gi/2jqIo6irjPuxQlTfHCE6ZstKIYcTavlXf0
u8YGZ+AqSK9EZt6FXdgwDiS7+9XzNeqXuvYWMAFn1J1F67eH+jyvQEFTfBkfpmE5
u0QqnqyXI/5UwFbkbyjUkXQFr8YWsKsvwYltP3DXDB5jYX2Be9aNswM5MdKpEGNT
ovflBc0t5wev2u5q+WuvfmcguTcmQo804fazypTvX5V2l/alve/zHtrgVXoDmVDB
zwIDAQAB
-----END PUBLIC KEY-----`;
