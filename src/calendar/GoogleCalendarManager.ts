import MyGoogleCalendar from "./MyGoogleCalendar";
import MyOauthGoogle from "../MyOauthGoogle";
import {calendar_v3} from "googleapis";

type CalendarRelations = {
    [x: string]: string[]
}

export default class GoogleCalendarManager {
    readonly outputCalendar = "ISI";
    readonly devCalendar = "Dev_ISI";

    googleCalendar: MyGoogleCalendar;
    calendarRelations: CalendarRelations = {};

    constructor(private auth: MyOauthGoogle) {
        this.googleCalendar = new MyGoogleCalendar(auth.oauth2Client)        
    }

    async init() {
        await this.googleCalendar.init();
        await this.fillCalendars();
        await this.setWatches();
    }

    private async fillCalendars() {
        // await this.googleCalendar.refreshListOfCalendars();
        await this.fillOutputCalendars();
        await this.fillDevCalendars();        
    }

    private async fillOutputCalendars() {
        for (let i = 1; i <= 8; i++) {
            const name = this.getOutputCalendarName(i);
            await this.googleCalendar.addCalendar(name)
        }
    }

    private async fillDevCalendars() {
        for (let i = 1; i <= 8; i++) {
            const name = `${this.devCalendar}_lab_${i}`;
            await this.googleCalendar.addCalendar(name)
            this.calendarRelations[name] = [this.getOutputCalendarName(i)]
        }

        for (let i = 1; i <= 4; i++) {
            const name = `${this.devCalendar}_aud_${i}`;
            await this.googleCalendar.addCalendar(name)
            this.calendarRelations[name] = [this.getOutputCalendarName(2 * i - 1), this.getOutputCalendarName(2 * i)]
        }

        const name = `${this.devCalendar}_isi`;
        await this.googleCalendar.addCalendar(name)
        this.calendarRelations[name] = []

        for (let i = 1; i <= 8; i++) {
            this.calendarRelations[name].push(this.getOutputCalendarName(i))
        }

        console.log("All done")
    }

    private getOutputCalendarName(iter: number) {
        return `${this.outputCalendar} lab ${iter}`;
    }

    private async setWatches() {
        for (const key in this.calendarRelations) {
            await this.googleCalendar.setWatch(key)
        }
    }
    async removeAllWatches() {
        for (const key in this.calendarRelations) {                       
            await this.googleCalendar.deleteWatch(key);
        }        
    }

    async refreshWatches(){
        await this.removeAllWatches();
        await this.setWatches();
    }

    public async manageEvents(inputCalendarName: string, events: calendar_v3.Schema$Event[]) {
        for (const inputEvent of events) {
            if (
                inputEvent.id == null
            ) continue;

            for (const outputCalendarName of this.calendarRelations[inputCalendarName]) {
                const outputEvents = await this.googleCalendar.getSpecificEvent(outputCalendarName, inputCalendarName, inputEvent.id);

                if (outputEvents != null && outputEvents.length != 0) {
                    const outputID = outputEvents[0].id;
                    if (
                        outputID == null
                    ) continue;

                    if (inputEvent.status == "cancelled" ) {
                        this.googleCalendar.deleteEvent(outputCalendarName, outputID)
                    } else {
                        this.googleCalendar.updateEvent(outputCalendarName, inputCalendarName, outputID, inputEvent, outputEvents[0])
                    }
                } else if (inputEvent.status != "cancelled") {
                    this.googleCalendar.insertEvent(outputCalendarName, inputCalendarName, inputEvent)
                }
            }
        }
    }
}