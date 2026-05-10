export const C = {
  navy:  '#0B1F3A',
  teal:  '#2A9D8F',
  tealL: '#52C5B6',
  gold:  '#E9C46A',
  coral: '#E76F51',
  pale:  '#E8F4F8',
  seq:   ['#2A9D8F','#E76F51','#E9C46A','#52C5B6','#8ECAE6','#264653','#F4A261'],
}

export const BL = {
  paper_bgcolor: 'white',
  plot_bgcolor:  C.pale,
  font: { family: 'Inter, sans-serif', color: C.navy, size: 11 },
  margin: { t: 40, b: 36, l: 52, r: 18 },
  xaxis: { gridcolor: '#D0DDE6', linecolor: '#C4D3DC', zeroline: false },
  yaxis: { gridcolor: '#D0DDE6', linecolor: '#C4D3DC', zeroline: false },
  hoverlabel: { bgcolor: 'white', bordercolor: '#D0DDE6', font: { family: 'Inter', size: 12 } },
  colorway: ['#2A9D8F','#E76F51','#E9C46A','#52C5B6','#8ECAE6','#264653','#F4A261'],
}

export const CFG = { displayModeBar: false, responsive: true }

export const PROVINCE_LABELS = new Set([
  'Ontario','British Columbia','Alberta','Nova Scotia','New Brunswick',
  'Manitoba','Saskatchewan','Newfoundland and Labrador','Prince Edward Island',
  'NWT','Yukon','Nunavut','Quebec',
])

export const CITY_TO_PROVINCE: Record<string, string> = {
  'Toronto':   'Ontario',
  'Ottawa':    'Ontario',
  'Hamilton':  'Ontario',
  'Vancouver': 'British Columbia',
  'Calgary':   'Alberta',
  'Edmonton':  'Alberta',
  'Halifax':   'Nova Scotia',
  'Winnipeg':  'Manitoba',
  'Montréal':  'Quebec',
}

export const CITY_LABELS = new Set([
  'Toronto','Vancouver','Montréal','Calgary','Edmonton','Ottawa',
  'Winnipeg','Halifax','Hamilton',
])

export const GEO_COORDS: Record<string, [number, number]> = {
  'Ontario':                 [51.25, -85.32],
  'British Columbia':        [53.73, -127.65],
  'Alberta':                 [53.93, -116.58],
  'Nova Scotia':             [44.68, -63.74],
  'Newfoundland and Labrador': [53.14, -57.66],
  'Saskatchewan':            [52.94, -106.45],
  'Manitoba':                [53.76, -98.81],
  'New Brunswick':           [46.57, -66.46],
  'Ottawa':                  [45.42, -75.70],
  'Vancouver':               [49.28, -123.12],
  'Halifax':                 [44.65, -63.58],
  'Winnipeg':                [49.90, -97.14],
  'Calgary':                 [51.04, -114.07],
  'Edmonton':                [53.55, -113.49],
  'Toronto':                 [43.65, -79.38],
}

export const TOPIC_COLORS: Record<string, string> = {
  'Contact / Access':  '#E76F51',
  'General Discussion':'#8ECAE6',
  'Comprehensiveness': '#52C5B6',
  'Care Coordination': '#E9C46A',
  'Care Continuity':   '#2A9D8F',
}

export const TOPICS_LIST = [
  'Contact / Access', 'General Discussion', 'Comprehensiveness', 'Care Coordination', 'Care Continuity',
]

export const FOUR_C_LIST = ['Contact / Access', 'Continuity', 'Coordination', 'Comprehensiveness'] as const

export const FOUR_C_COLORS: Record<string, string> = {
  'Contact / Access':   '#E76F51',
  'Continuity':         '#2A9D8F',
  'Coordination':       '#E9C46A',
  'Comprehensiveness':  '#52C5B6',
  'unclear_or_other':   '#CBD5E1',
}

export const KEYWORDS = [
  'Family Doctor','Family Physician','Primary Care','Walk-In Clinic','Urgent Care',
  'No Family Doctor','Waitlist','Nurse Practitioner','Referral','Follow-Up',
  'Appointment','Continuity',
]
