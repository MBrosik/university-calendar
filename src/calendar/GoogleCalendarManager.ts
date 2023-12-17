import MyGoogleCalendar from "./MyGoogleCalendar";
import MyOauthGoogle from "../MyOauthGoogle";
import { calendar_v3 } from "googleapis";

export default class GoogleCalendarManager{
   private googleCalendar: MyGoogleCalendar;   
   listOfCalendars!: calendar_v3.Schema$CalendarListEntry[];

 

   constructor(private auth: MyOauthGoogle){
      this.googleCalendar = new MyGoogleCalendar(auth.oauth2Client)
      
      this.init();
   }

   async init(){
      this.listOfCalendars = await this.googleCalendar.getListOfCalendars();
   }

   fillCalendars(){
      
   }

   fillOutputCalendars(){
      
   }
}