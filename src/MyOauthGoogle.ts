import { calendar_v3, google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { Credentials } from "google-auth-library/build/src/auth/credentials";

export default class MyOauthGoogle {
   oauth2Client: OAuth2Client;

   private scopes = [
      'https://www.googleapis.com/auth/calendar'
   ];

   constructor() {
      this.oauth2Client = new google.auth.OAuth2(
         process.env.CLIENT_ID,
         process.env.CLIENT_SECRET,
         process.env.REDIRECT_URL
      );    
   }

   generateAuthUrl() {
      return this.oauth2Client.generateAuthUrl({
         access_type: "offline",
         scope: this.scopes
      })
   }

   async setCredentialsWithCode(code: string) {
      const { tokens } = await this.oauth2Client.getToken(<string>code);
      this.oauth2Client.setCredentials(tokens);
      return tokens;
   }

   async setCredentials(tokens: Credentials) {
      this.oauth2Client.setCredentials(tokens);
   }
}