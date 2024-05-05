import dotenv from 'dotenv';
import bodyParser from "body-parser";
import express from "express";
import MyNedb from './DB';
import MyOauthGoogle from './MyOauthGoogle';
import GoogleCalendarManager from './calendar/GoogleCalendarManager';
import { reportMissingEnvVars } from "./enviroment/reportMissingEnvVars";
import useSleep from './utils/useSleep';


// ---------
// config
// ---------
dotenv.config();
dotenv.config({ path: `.env.local`, override: true });
reportMissingEnvVars();

const app = express();
const port = process.env.PORT || 8000;

app.use(express.json());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const myGoogleAuth = new MyOauthGoogle();
let googleCalendarManager: GoogleCalendarManager | null = null;


async function checkForToken() {
   const token = await MyNedb.i.getAuthenticationCode();
   if (token != null) {
      myGoogleAuth.setCredentials(token)
      let tempGoogleCalendarManager = new GoogleCalendarManager(myGoogleAuth);
      await tempGoogleCalendarManager.init();
      googleCalendarManager = tempGoogleCalendarManager;

      // googleCalendarManager.removeAllWatches();  
   }
   else {
      console.log("Token is null");
   }
}

checkForToken();

async function checkForMyGoogleCalendar(){
   const token = await MyNedb.i.getAuthenticationCode();
   if(token == null) return false;

   while(googleCalendarManager == null){
      await useSleep(500);
   }

   return true;
}



setInterval(async ()=>{
   if(!await checkForMyGoogleCalendar()) return;
   if(googleCalendarManager == null) return;

   await googleCalendarManager.refreshWatches();
}, 2 * 24 * 60 * 60 * 1000)

// --------------
// endpoints
// --------------

app.get("/google", async (req, res) => {
   const auth = await MyNedb.i.getAuthenticationCode();

   if (auth != null) {
      res.status(403)
      res.send("Google id exists");
      return
   }

   const url = myGoogleAuth.generateAuthUrl();
   res.redirect(url);
})

app.get("/google/redirect", async (req, res) => {
   const code = req.query.code;

   if (code == undefined) {
      res.send({
         msg: "No redirect code"
      });
      return
   };

   MyNedb.i.setAuthenticationCode(await myGoogleAuth.setCredentialsWithCode(<string>code));
   googleCalendarManager = new GoogleCalendarManager(myGoogleAuth);
   await googleCalendarManager.init();

   res.send({
      msg: "Nice bro. You have been logged in"
   });
})

// app.get("/refresh_watchers", async(req, res)=>{ 
//    if(!await checkForMyGoogleCalendar()) {
//       res.status(403);
//       return;
//    }
//    await googleCalendarManager!.refreshWatches();
//    console.log(req.query);
   
//    res.send("ok");
// })

app.post("/watch/:calendarID", async (req, res) => {
   const { calendarID } = req.params;
   const resourceId = req.headers['x-goog-resource-id'];
   const channelToken = req.headers['x-goog-channel-token'];
   const channelId = req.headers['x-goog-channel-id'];
   const resourceState = req.headers['x-goog-resource-state'];   

   if (resourceState == "sync") {
      res.send("ok");
      return;
   };

   console.log(req.query);
   console.log(calendarID);
   console.log(resourceId);
   console.log(channelToken);
   console.log(channelId);
   console.log(resourceState);


   if(!await checkForMyGoogleCalendar()) {
      res.send("ok");
      return;
   }
   if(googleCalendarManager == null) {
      res.send("ok");
      return
   }

   // if (googleCalendarManager == null) {
   //    await checkForToken();
   //    if (googleCalendarManager == null) return;
   // }  

   // await googleCalendarManager.googleCalendar.deleteWatch(calendarID, <string>resourceId)
   // return;

   if (!(calendarID in googleCalendarManager.calendarRelations)) {
      await googleCalendarManager.googleCalendar.deleteWatch(calendarID, <string>resourceId)
      res.send("ok")
      return;
   }


   const lastEvents = await googleCalendarManager.googleCalendar.getLastEvents(calendarID)
   if (lastEvents == null) {
      res.send("ok");
      return;
   };
   console.log(lastEvents)
   await googleCalendarManager.manageEvents(calendarID, lastEvents);
   res.send("ok");
})

app.listen(port, () => console.info(`start serwera na porcie ${port}`))