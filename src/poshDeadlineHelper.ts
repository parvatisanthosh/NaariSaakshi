import { Incident } from './types';

export interface PoshDeadlineInfo {
  daysRemaining: number;
  isPast3Months: boolean;
  baseIncidentDate: Date;
  personName?: string;
  isSeries: boolean;
  displayText: string;
}

export const POSH_DISCLAIMER_TEXT =
  "General guidance based on the POSH Act, 2013 — confirm current deadlines with your organization's ICC or a legal professional, as processes can vary. General informational guidance only — not legal advice.";

export const calculatePoshDeadline = (
  incident: Incident,
  allIncidents: Incident[] = []
): PoshDeadlineInfo => {
  const incDate = new Date(incident.incident_datetime);
  let baseDate = incDate;
  let personName: string | undefined = undefined;
  let isSeries = false;

  // Incident-Series Awareness: If multiple incidents involve the same person,
  // use the DATE OF THE MOST RECENT incident in the series as the base.
  const primaryPerson = incident.people_involved[0]?.name;
  if (primaryPerson && primaryPerson.trim().length > 0 && allIncidents.length > 0) {
    const personLower = primaryPerson.trim().toLowerCase();
    const matchingSeries = allIncidents.filter(i =>
      i.people_involved.some(p => p.name.trim().toLowerCase() === personLower)
    );

    if (matchingSeries.length > 1) {
      isSeries = true;
      personName = primaryPerson;
      const dates = matchingSeries.map(i => new Date(i.incident_datetime).getTime());
      const maxTime = Math.max(...dates);
      baseDate = new Date(maxTime);
    }
  }

  // POSH 3-month window calculation
  const deadlineDate = new Date(baseDate);
  deadlineDate.setMonth(deadlineDate.getMonth() + 3);

  const now = new Date();
  const diffTime = deadlineDate.getTime() - now.getTime();
  const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  const isPast3Months = daysRemaining <= 0;

  let displayText = '';
  if (!isPast3Months) {
    displayText = `POSH filing window: ${daysRemaining} day${daysRemaining === 1 ? '' : 's'} remaining`;
  } else {
    displayText = `Extension may be needed — POSH allows a further 3 months with justification`;
  }

  return {
    daysRemaining,
    isPast3Months,
    baseIncidentDate: baseDate,
    personName,
    isSeries,
    displayText
  };
};
