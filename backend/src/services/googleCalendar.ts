import { google } from 'googleapis';

type CalendarInsertInput = {
  refreshToken: string;
  summary: string;
  description?: string | null;
  startIso: string;
  endIso: string;
  attendeeEmails: string[];
  meetingLink?: string | null;
};

function getOAuthClient() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_CALENDAR_REDIRECT_URI || 'postmessage';

  if (!clientId || !clientSecret) {
    throw new Error('Google Calendar OAuth env vars are missing (GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET).');
  }

  return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
}

export async function exchangeGoogleCalendarCode(code: string) {
  const oauth2Client = getOAuthClient();
  const { tokens } = await oauth2Client.getToken(code);
  oauth2Client.setCredentials(tokens);

  let email: string | null = null;
  try {
    const oauth2Api = google.oauth2({ version: 'v2', auth: oauth2Client });
    const userInfo = await oauth2Api.userinfo.get();
    email = userInfo.data.email || null;
  } catch {
    // Some accounts can deny profile/email while granting calendar scopes.
    email = null;
  }

  return {
    email,
    refreshToken: tokens.refresh_token || null,
  };
}

export async function createCalendarEvent(input: CalendarInsertInput) {
  const oauth2Client = getOAuthClient();
  oauth2Client.setCredentials({ refresh_token: input.refreshToken });

  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
  const timezone = process.env.GOOGLE_CALENDAR_TIMEZONE || 'Asia/Kolkata';

  const attendees = input.attendeeEmails
    .filter((email) => !!email)
    .map((email) => ({ email }));

  const eventBody: any = {
    summary: input.summary,
    description: input.description || undefined,
    attendees,
    start: {
      dateTime: input.startIso,
      timeZone: timezone,
    },
    end: {
      dateTime: input.endIso,
      timeZone: timezone,
    },
  };

  if (input.meetingLink) {
    eventBody.location = input.meetingLink;
    eventBody.description = `${input.description || ''}\n\nMeeting Link: ${input.meetingLink}`.trim();
  } else {
    eventBody.conferenceData = {
      createRequest: {
        requestId: `eco-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
        conferenceSolutionKey: { type: 'hangoutsMeet' },
      },
    };
  }

  const event = await calendar.events.insert({
    calendarId: 'primary',
    conferenceDataVersion: input.meetingLink ? 0 : 1,
    sendUpdates: 'all',
    requestBody: eventBody,
  });

  return {
    eventId: event.data.id || null,
    htmlLink: event.data.htmlLink || null,
    meetLink: event.data.hangoutLink || input.meetingLink || null,
  };
}

type CalendarListInput = {
  refreshToken: string;
  timeMinIso?: string;
  timeMaxIso?: string;
  maxResults?: number;
};

export async function listPrimaryCalendarEvents(input: CalendarListInput) {
  const oauth2Client = getOAuthClient();
  oauth2Client.setCredentials({ refresh_token: input.refreshToken });

  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

  const now = new Date();
  const defaultMin = new Date(now.getFullYear(), now.getMonth() - 2, 1).toISOString();
  const defaultMax = new Date(now.getFullYear(), now.getMonth() + 6, 0, 23, 59, 59).toISOString();

  const resp = await calendar.events.list({
    calendarId: 'primary',
    singleEvents: true,
    orderBy: 'startTime',
    showDeleted: false,
    maxResults: Math.min(input.maxResults || 250, 1000),
    timeMin: input.timeMinIso || defaultMin,
    timeMax: input.timeMaxIso || defaultMax,
  });

  return (resp.data.items || [])
    .filter((e) => !!e.start?.dateTime || !!e.start?.date)
    .map((e) => {
      const startIso = e.start?.dateTime || `${e.start?.date}T00:00:00.000Z`;
      const endIso = e.end?.dateTime || `${e.end?.date}T00:00:00.000Z`;
      return {
        id: e.id || null,
        summary: e.summary || 'Google Calendar Event',
        startIso,
        endIso,
        htmlLink: e.htmlLink || null,
        organizerEmail: e.organizer?.email || null,
      };
    });
}
