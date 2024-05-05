import { calendar_v3, google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import dayjs from 'dayjs';
import MyNedb from '../DB';


export default class MyGoogleCalendar {
    private calendar: calendar_v3.Calendar;
    listOfCalendars!: calendar_v3.Schema$CalendarListEntry[];


    constructor(o2: OAuth2Client) {
        this.calendar = google.calendar({
            version: "v3",
            auth: o2
        })
    }

    async init() {
        await this.refreshListOfCalendars();
    }

    refreshListOfCalendars() {
        return new Promise((resolve, reject) => {
            this.calendar.calendarList.list((err, res) => {
                if (err) return console.error('The API returned an error:', err);
                if (res == null || res.data.items == undefined) return console.error('Res is null');

                this.listOfCalendars = res.data.items;
                resolve(1);
            })
        })
    }

    findCalendar(name: string) {
        return this.listOfCalendars.find(el => el.summary == name);
    }

    getCalendarID(calendar: string) {
        return this.findCalendar(calendar)?.id;
    }

    async addCalendar(calendarSummary: string) {
        if (this.findCalendar(calendarSummary)) return;

        try {
            const response = await this.calendar.calendars.insert({
                requestBody: {
                    summary: calendarSummary,                            
                }
            });
            const newCalendarId = response.data.id;
            console.log(`New calendar added with ID: ${newCalendarId}`);
        } catch (error) {
            console.error('Error adding calendar:', error);
        }
    }

    async setWatch(calendar: string) {
        try {            
            if(await MyNedb.i.getCalendarWatchInfo(calendar) != null){ 
                console.log("Watch exist");
                
                return
            };

            const calendarID = this.getCalendarID(calendar)            
            if (calendarID == null) return;

            const response = await this.calendar.events.watch({
                requestBody: {
                    id: calendar,
                    type: 'web_hook',
                    address: `${process.env.WEB_HOOK_DOMAIN}/watch/${calendar}`,                   
                },
                calendarId: <string>calendarID
            });

            await MyNedb.i.addCalendarWatchInfo(calendar, <string>response.data.resourceId)

            console.log(`created watch: ${calendar}-${calendarID}-${response.data.resourceId}`);
        } catch (e) {
            console.log("Problem with setWatch");

            console.log(e);
        }
    }

    async deleteWatch(id: string, resourceIdParam:string|null = null) {
        try {            
            let resourceId;
            if(resourceIdParam){
                resourceId = resourceIdParam
            }
            else{
                let watchInfo = await MyNedb.i.getCalendarWatchInfo(id);
                if(watchInfo == null) return;
                resourceId = watchInfo.resourceId;
            }            

            await this.calendar.channels.stop({
                requestBody: {
                    id,
                    resourceId,
                },
            });
            await MyNedb.i.removeCalendarWatchInfo(id);
            console.log(`deleted ${id} ${resourceId}`);

        } catch (e) {
            console.log("Usuwanie robi brrr")
            console.log(e);            
        }
    }


   

    async getLastEvents(name: string) {
        const calendarID = this.getCalendarID(name)
        if (calendarID == null) return;

        const event = await this.calendar.events.list({
            calendarId: calendarID,
            // maxResults: 10,
            singleEvents: true,
            orderBy: 'updated',
            showDeleted: true,
            updatedMin: dayjs(new Date()).subtract(4, "minutes").toISOString()
        });

        return event.data.items;
    }

    async getSpecificEvent(outputCalendarName: string, inputCalendarName: string, EventID: string, withDeleted = false) {
        const calendarID = this.getCalendarID(outputCalendarName)
        if (calendarID == null) return;

        const event = await this.calendar.events.list({
            calendarId: calendarID,
            singleEvents: true,
            privateExtendedProperty: [`oldEventID=${EventID}`, `calendarName=${inputCalendarName}`],
            showDeleted: withDeleted
        });

        return event.data.items;
    }

    async insertEvent(
        outputCalendarName: string,
        inputCalendarName: string,
        inputEvent: calendar_v3.Schema$Event
    ) {
        const calendarID = this.getCalendarID(outputCalendarName)

        if (inputEvent.id == null) return;
        if (inputEvent.updated == null) return;
        if (calendarID == null) return;

        try {

            const newEvent = {
                ...inputEvent
            }

            newEvent.id = ""
            newEvent.iCalUID = ""


            await this.calendar.events.insert({
                calendarId: calendarID,
                requestBody: {
                    ...newEvent,
                    extendedProperties: {
                        private: {
                            oldEventID: inputEvent.id,
                            calendarName: inputCalendarName,
                            lastEventUpdate: inputEvent.updated
                        }
                    }
                }
            })
            console.log(`inserted ${outputCalendarName}`)
        } catch (e) {
            console.log("Problem with insert")
            // console.log(e)
        }
    }

    async updateEvent(
        outputCalendarName: string,
        inputCalendarName: string,
        outputEventID: string,
        inputEvent: calendar_v3.Schema$Event,
        outputEvent: calendar_v3.Schema$Event
    ) {
        try {
            const outputCalendarID = this.getCalendarID(outputCalendarName)
            if (inputEvent.id == null) return;
            if (inputEvent.updated == null) return;
            if (outputEvent.updated == null) return;
            if (outputCalendarID == null) return;
            if (outputEvent.extendedProperties == null) return;
            if (outputEvent.extendedProperties.private == null) return;
            if (outputEvent.extendedProperties.private.lastEventUpdate == inputEvent.updated) return;

            await this.calendar.events.update({
                calendarId: outputCalendarID,
                eventId: outputEventID,
                requestBody: {
                    ...inputEvent,
                    extendedProperties: {
                        private: {
                            oldEventID: inputEvent.id,
                            calendarName: inputCalendarName,
                            lastEventUpdate: inputEvent.updated
                        }
                    }
                }
            })
            console.log(`updated ${outputCalendarName}`)
        } catch (e) {
            console.log("Problem with update")
            // console.log(e)
        }
    }

    async deleteEvent(
        calendarName: string,
        outputEventID: string
    ) {
        try {
            const calendarID = this.getCalendarID(calendarName)
            if (calendarID == null) return;

            await this.calendar.events.delete({
                calendarId: calendarID,
                eventId: outputEventID,
            })
            console.log(`deleted ${calendarName}`)
        } catch (e) {
            console.log("Problem with delete")
        }
    }
}