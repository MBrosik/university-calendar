import nedb from "nedb";
import {Credentials} from "google-auth-library/build/src/auth/credentials";

type doc = {
   credentials: Credentials
}

export default class MyNedb {
   db: nedb<doc>;

   constructor() {
      this.db = new nedb({
         filename: 'db/isi.db',
         autoload: true
      });
   }

   async getAuthenticationCode() {
      return new Promise<any>((resolve, reject) => {
         this.db.find({}, (err: any, result: doc[]) => {
            if (result.length == 0) return resolve(null);

            resolve(result[0].credentials)
         })
      })
   }

   async setAuthenticationCode(cred: Credentials) {
      return new Promise<any>((resolve, reject) => {
         this.db.insert({ credentials: cred }, (err, newDoc) => {
            if(err) resolve(false);
            resolve(true)
         })
      })
   }
}