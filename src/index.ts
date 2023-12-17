import dotenv from 'dotenv';
import bodyParser from "body-parser";
import express, { Request } from "express";
import { google } from 'googleapis';
import axios from "axios";
import dayjs from "dayjs";
import MyNedb from './DB';
import MyOauthGoogle from './MyOauthGoogle';
import MyGoogleCalendar from './calendar/MyGoogleCalendar';
import GoogleCalendarManager from './calendar/GoogleCalendarManager';


// ---------
// config
// ---------
dotenv.config({});
const app = express();
const port = process.env.PORT || 8000;

app.use(express.json());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const db = new MyNedb();
const myGoogleAuth = new MyOauthGoogle();
let googleCalendarManager: GoogleCalendarManager | null= null;

(async()=>{
   const token = await db.getAuthenticationCode();
   if(token != null){
      myGoogleAuth.setCredentials(token)
      googleCalendarManager = new GoogleCalendarManager(myGoogleAuth);      
   }
   else{
      console.log("Token is null");
      
   }

})()



// --------------
// endpoints
// --------------

app.get("/google", async (req, res) => {
   const auth = await db.getAuthenticationCode();

   if(auth != null){      
      res.status(403)
      res.send("Google id exists");
      return
   }

   const url = myGoogleAuth.generateAuthUrl();
   res.redirect(url);
})

app.get("/google/redirect", async (req, res) => {
   const code = req.query.code;

   if (code == undefined) return;

   db.setAuthenticationCode(await myGoogleAuth.setCredentialsWithCode(<string>code));
   
   res.send({
      msg: "Nice bro. You have been logged in"
   });
})

// APP.get("/schedule_event", async (req, res) => {
//    const auth = await DB.getAuthenticationCode();

//    if(auth == null){      
//       res.status(403)
//       res.send("Google id not exists");
//       return
//    }

//    const result = await calendar.events.insert({
//       calendarId: "primary",
//       auth: oauth2Client,
//       requestBody: {
//          summary: "This event is test",
//          description: "Some event that is very important",
//          start: {
//             dateTime: dayjs(new Date()).add(1, "day").toISOString(),
//             timeZone: "Etc/GMT+1"
//          },
//          end: {
//             dateTime: dayjs(new Date()).add(3, "day").toISOString(),
//             timeZone: "Etc/GMT+1"
//          }
//       }
//    })

//    res.send({ msg: "Noiceeeeeee" })
// })

app.listen(port, () => console.info(`start serwera na porcie ${port}`))