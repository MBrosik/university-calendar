import { calendar_v3, google } from 'googleapis';
import {Credentials} from "google-auth-library/build/src/auth/credentials";
import { OAuth2Client } from 'google-auth-library';

export default class MyGoogleCalendar {
   private calendar: calendar_v3.Calendar;

   constructor(o2: OAuth2Client) {
      this.calendar = google.calendar({
         version: "v3",
         auth: o2
      })
   }

   getListOfCalendars() {
      return new Promise<calendar_v3.Schema$CalendarListEntry[]>((resolve, reject)=>{
         this.calendar.calendarList.list((err, res) => {
            if (err) return console.error('The API returned an error:', err);
            if(res == null || res == undefined || res.data.items == undefined) return console.error('Res is null');
   
            const calendars = res.data.items;
            resolve(calendars);

            // if (calendars.length) {
            //    console.log('Calendars:');
            //    calendars.forEach((calendar) => {
            //       console.log(`${calendar.summary} - ${calendar.id}`);
            //    });
            // } else {
            //    console.log('No calendars found.');
            // }
         })
         console.log();
      })      
   }

   async addCalendar(calendarSummary: string){
      try {
         const calendarData: calendar_v3.Params$Resource$Calendarlist$Insert = {
           requestBody: {
             summary: calendarSummary,
           },
         };
     
         const response = await this.calendar.calendarList.insert(calendarData);
         const newCalendarId = response.data.id;
         console.log(`New calendar added with ID: ${newCalendarId}`);
       } catch (error) {
         console.error('Error adding calendar:', error);
       }
   }

   insertEvent() {

   }
}