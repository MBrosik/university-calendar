import nedb from "nedb";
import { Credentials } from "google-auth-library/build/src/auth/credentials";

type CredentialDoc = {
   credentials: Credentials
}

type CalendarWatchDoc = {
   summary: string;
   resourceId: string;
}


export default class MyNedb {
   credentialDb: nedb<CredentialDoc>;
   calendarWatchDb: nedb<CalendarWatchDoc>;

   static i: MyNedb = new this();

   constructor() {
      this.credentialDb = new nedb({
         filename: 'db/isi.db',
         autoload: true
      });

      this.calendarWatchDb = new nedb({
         filename: 'db/calendars/calendarWatches.db',
         autoload: true
      })
   }

   async getAuthenticationCode() {
      return new Promise<any>((resolve, reject) => {
         this.credentialDb.find({}, (err: any, result: CredentialDoc[]) => {
            if (result.length == 0) return resolve(null);

            resolve(result[0].credentials)
         })
      })
   }

   async setAuthenticationCode(cred: Credentials) {
      return new Promise<any>((resolve, reject) => {
         this.credentialDb.insert({ credentials: cred }, (err, newDoc) => {
            if (err) resolve(false);
            resolve(true)
         })
      })
   }

   /**
    * calendar watcher db
    */

   async getCalendarWatchInfo(summary: string): Promise<CalendarWatchDoc|null> {
      return new Promise<CalendarWatchDoc|null>((resolve, reject) => {
         this.calendarWatchDb.find({summary}, (err: any, result: CalendarWatchDoc[]) => {
            if (result.length == 0) return resolve(null);

            resolve(result[0])
         })
      })
   }
   async addCalendarWatchInfo(summary: string, resourceId: string){
      return new Promise<any>((resolve, reject) => {
         this.calendarWatchDb.insert({ summary, resourceId }, (err, newDoc) => {
            if (err) {
               console.error('Watchers - Error adding document: ', err);
               resolve(false);
               return;
            }

            resolve(true)
         })
      })
   }

   async removeCalendarWatchInfo(summary: string):Promise<boolean> {
      return new Promise<boolean>((resolve, reject) => {
         this.calendarWatchDb.remove({ summary }, {}, (err, numRemoved) => {
            if (err) {
               console.error('Watchers - Error deleting document: ', err);
               resolve(false);
               return;
            }

            if (numRemoved > 0) {
               console.log('Document deleted');
               resolve(true)
            } else {
               console.log('Document not found');
               resolve(false)
            }          
         })
      })
   }
}