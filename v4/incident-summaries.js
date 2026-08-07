/* Incident Summaries — monthly HMPPS fire incident feed for prisons */
(function () {
  'use strict';

  const IS_STORAGE_KEY = 'cpfsi-incident-summaries-v4';
  const IS_SEED_VERSION = 5;
  const IS_OVERRIDE_KEY = 'cpfsi-incident-summary-overrides-v1';
  const IS_UPLOADS_KEY = 'cpfsi-incident-summary-uploads-v1';
  const IS_REVIEWER = 'Phil Gower';
  const IS_LIST_PAGE = 50;
  const IS_DEMO_TODAY = new Date(2026, 5, 22, 12, 0, 0);

  const IS_STATUS_LABELS = {
    needs_review: 'Needs review',
    investigating: 'Investigating',
    reviewed: 'Reviewed'
  };

  const IS_VIEWS = [
    { id: 'needs-review', label: 'Needs review' },
    { id: 'injury', label: 'Injury flagged' },
    { id: 'fatality', label: 'Fatalities' },
    { id: 'linked', label: 'Linked to CPIN' },
    { id: 'no-cpin', label: 'No CPIN match' },
    { id: 'reviewed', label: 'Reviewed' },
    { id: 'all', label: 'All' }
  ];

  const IS_PREMISES = [
    { name: 'HMP Bristol', ref: 'PRM-0002140' },
    { name: 'HMP Belmarsh', ref: 'PRM-0002088' },
    { name: 'HMP Lewes', ref: 'PRM-0002103' },
    { name: 'HMP Maidstone', ref: 'PRM-0002118' },
    { name: 'HMP Swaleside', ref: 'PRM-0002131' },
    { name: 'HMP Pentonville', ref: 'PRM-0002099' },
    { name: 'HMP Isis', ref: 'PRM-0002155' },
    { name: 'HMP Durham', ref: 'PRM-0002122' },
    { name: 'HMP Wandsworth', ref: 'PRM-0002095' },
    { name: 'HMP Rochester', ref: 'PRM-0002108' },
    { name: 'HMP Ford', ref: 'PRM-0002160' },
    { name: 'HMP Cookham Wood', ref: 'PRM-0002171' }
  ];

  const IS_FIRE_TYPES = [
    'Fire in cell or dormitory',
    'Fire in kitchen',
    'Fire in industrial premises',
    'Fire in other residential',
    'Fire in store or stock',
    'Smoking materials — cell',
    'False alarm — no fire'
  ];

  const IS_LOCATIONS = [
    'Cell', 'Kitchen', 'Workshop', 'Association room', 'Laundry', 'Store', 'Landing', 'Education block'
  ];

  const IS_DEMO_CPINS = [
    { ref: 'CPIN-2026-0418', premises: 'HMP Lewes', date: '2026-06-22', routeId: 'cpin-0418' },
    { ref: 'CPIN-2026-0412', premises: 'HMP Belmarsh', date: '2026-06-21', routeId: 'cpin-0412' },
    { ref: 'CPIN-2026-0398', premises: 'HMP Maidstone', date: '2026-06-17', routeId: 'cpin-0398' },
    { ref: 'CPIN-2026-0440', premises: 'HMP Wandsworth', date: '2026-06-22', routeId: 'cpin-u-0440' },
    { ref: 'CPIN-2026-0447', premises: 'HMP Wandsworth', date: '2026-06-02', routeId: 'cpin-in-0447' },
    { ref: 'CPIN-2026-0392', premises: 'HMP Rochester', date: '2026-06-15', routeId: 'cpin-0392' },
    { ref: 'CPIN-2026-0385', premises: 'HMP Bristol', date: '2026-06-10', routeId: 'cpin-0385' },
    { ref: 'CPIN-2026-0401', premises: 'HMP Swaleside', date: '2026-05-28', routeId: 'cpin-0401' },
    { ref: 'CPIN-2026-0376', premises: 'HMP Pentonville', date: '2026-05-19', routeId: 'cpin-0376' },
    { ref: 'CPIN-2026-0368', premises: 'HMP Isis', date: '2026-04-24', routeId: 'cpin-0368' },
    { ref: 'CPIN-2026-0359', premises: 'HMP Durham', date: '2026-04-08', routeId: 'cpin-0359' },
    { ref: 'CPIN-2026-0344', premises: 'HMP Ford', date: '2026-03-22', routeId: 'cpin-0344' },
    { ref: 'CPIN-2026-0331', premises: 'HMP Cookham Wood', date: '2026-02-18', routeId: 'cpin-0331' },
    { ref: 'CPIN-2026-0425', premises: 'HMP Lewes', date: '2026-05-12', routeId: 'cpin-0425' },
    { ref: 'CPIN-2026-0433', premises: 'HMP Belmarsh', date: '2026-04-15', routeId: 'cpin-0433' },
    { ref: 'CPIN-2026-0415', premises: 'HMP Bristol', date: '2026-03-08', routeId: 'cpin-0415' }
  ];
  const IS_CPIN_LINK_RATE = 0.82;

  const IS_BATCHES = [
    { label: 'June 2026', year: 2026, month: 5, count: 142 },
    { label: 'May 2026', year: 2026, month: 4, count: 118 },
    { label: 'April 2026', year: 2026, month: 3, count: 96 },
    { label: 'March 2026', year: 2026, month: 2, count: 89 },
    { label: 'February 2026', year: 2026, month: 1, count: 74 }
  ];

  const SEED_SUMMARIES = [
    {
      id: 'is-17205',
      ref: 'IS202606-17205',
      eventId: 'Upload June 2026',
      incidentDate: '2026-06-18',
      premises: 'HMP Wandsworth',
      premisesRef: 'PRM-0002095',
      specificLocation: 'Cell 14, E wing',
      typeOfFire: 'Fire in cell or dormitory',
      alarmRaised: 'Staff',
      ignitionSource: 'Smoking materials — prohibited',
      intent: 'Deliberate',
      howDetected: 'Staff observation',
      fireExtinguishedBy: 'Fire service',
      prisonersInjured: 0,
      staffInjured: 0,
      prisonersMinor: 0,
      staffMinor: 0,
      seriousInjuries: 0,
      fatalities: 1,
      relatedCpin: 'CPIN-2026-0440',
      suggestedCpin: null,
      cpinAutoLinked: true,
      cpinLinkManual: false,
      status: 'investigating',
      uploadBatch: 'June 2026',
      historic: false,
      notes: 'Fatality confirmed by prison. CPIN cross-check and escalation in progress.',
      activityLog: {
        notes: [{ id: 'isn-wan-fat', text: 'Fatality confirmed by prison. CPIN cross-check and escalation in progress.', at: '2 Jul 2026, 09:15', ts: 1751442900000 }],
        times: [{ id: 'ist-wan-fat', activity: 'Review incident summary', minutes: 60, at: '2 Jul 2026, 08:30', ts: 1751440200000 }],
        interim: [{ id: 'isi-wan-fat', title: 'Fatality escalation', text: 'Notified regional lead. Awaiting formal CPIN alignment with London Fire Brigade submission.', at: '2 Jul 2026, 09:20', ts: 1751443200000 }],
        files: []
      }
    },
    {
      id: 'is-17151',
      ref: 'IS202605-17151',
      eventId: 'Upload April 2026',
      incidentDate: '2026-04-28',
      premises: 'HMP Bristol',
      premisesRef: 'PRM-0002140',
      specificLocation: 'Cell 4, Wing B',
      typeOfFire: 'Fire in cell or dormitory',
      alarmRaised: 'Staff',
      ignitionSource: 'Battery — malfunction, mechanical failure',
      intent: 'Unintentional / accidental',
      howDetected: 'Fire detection device — domestic smoke detection (DSD)',
      fireExtinguishedBy: 'Staff',
      prisonersInjured: 0,
      staffInjured: 0,
      prisonersMinor: 0,
      staffMinor: 1,
      seriousInjuries: 0,
      relatedCpin: null,
      suggestedCpin: 'CPIN-2026-0398',
      status: 'needs_review',
      uploadBatch: 'April 2026',
      historic: false,
      notes: ''
    },
    {
      id: 'is-17142',
      ref: 'IS202605-17142',
      eventId: 'Upload April 2026',
      incidentDate: '2026-04-22',
      premises: 'HMP Belmarsh',
      premisesRef: 'PRM-0002088',
      specificLocation: 'Kitchen store, B wing',
      typeOfFire: 'Fire in kitchen',
      alarmRaised: 'Automatic fire alarm',
      ignitionSource: 'Cooking appliance — unattended',
      intent: 'Unintentional / accidental',
      howDetected: 'Automatic fire detection system',
      fireExtinguishedBy: 'Fire service',
      prisonersInjured: 0,
      staffInjured: 1,
      prisonersMinor: 0,
      staffMinor: 0,
      seriousInjuries: 1,
      fatalities: 0,
      relatedCpin: 'CPIN-2026-0412',
      suggestedCpin: null,
      cpinAutoLinked: true,
      cpinLinkManual: false,
      status: 'investigating',
      uploadBatch: 'April 2026',
      historic: false,
      notes: 'Linked to existing CPIN from FRS notification. Confirm injury details match.',
      activityLog: {
        notes: [{ id: 'isn-bel', text: 'Linked to existing CPIN from FRS notification. Confirm injury details match.', at: '2 May 2026, 10:30', ts: 1746178200000 }],
        times: [{ id: 'ist-bel', activity: 'CPIN cross-check', minutes: 30, at: '2 May 2026, 10:00', ts: 1746176400000 }],
        interim: [],
        files: []
      }
    },
    {
      id: 'is-17138',
      ref: 'IS202605-17138',
      eventId: 'Upload April 2026',
      incidentDate: '2026-04-19',
      premises: 'HMP Lewes',
      premisesRef: 'PRM-0002103',
      specificLocation: 'Cell 12, C wing',
      typeOfFire: 'Fire in cell or dormitory',
      alarmRaised: 'Staff',
      ignitionSource: 'Smoking materials — prohibited',
      intent: 'Deliberate',
      howDetected: 'Staff observation',
      fireExtinguishedBy: 'Staff',
      prisonersInjured: 1,
      staffInjured: 0,
      prisonersMinor: 0,
      staffMinor: 0,
      seriousInjuries: 1,
      relatedCpin: null,
      suggestedCpin: null,
      status: 'needs_review',
      uploadBatch: 'April 2026',
      historic: false,
      notes: ''
    },
    {
      id: 'is-17129',
      ref: 'IS202605-17129',
      eventId: 'Upload April 2026',
      incidentDate: '2026-04-14',
      premises: 'HMP Maidstone',
      premisesRef: 'PRM-0002118',
      specificLocation: 'Workshop store',
      typeOfFire: 'Fire in industrial premises',
      alarmRaised: 'Automatic fire alarm',
      ignitionSource: 'Electrical distribution — faulty wiring',
      intent: 'Unintentional / accidental',
      howDetected: 'Automatic fire detection system',
      fireExtinguishedBy: 'Staff',
      prisonersInjured: 0,
      staffInjured: 0,
      prisonersMinor: 0,
      staffMinor: 0,
      seriousInjuries: 0,
      relatedCpin: null,
      suggestedCpin: null,
      status: 'reviewed',
      uploadBatch: 'April 2026',
      historic: false,
      notes: 'Minor smoke logging only — no CPIN required. Recorded for audit evidence.',
      reviewedAt: '2026-05-02',
      reviewedBy: 'Steve France'
    },
    {
      id: 'is-17120',
      ref: 'IS202605-17120',
      eventId: 'Upload April 2026',
      incidentDate: '2026-04-08',
      premises: 'HMP Swaleside',
      premisesRef: 'PRM-0002131',
      specificLocation: 'Association room',
      typeOfFire: 'Fire in other residential',
      alarmRaised: 'Staff',
      ignitionSource: 'Unknown — under investigation',
      intent: 'Unknown',
      howDetected: 'Staff observation',
      fireExtinguishedBy: 'Staff',
      prisonersInjured: 0,
      staffInjured: 0,
      prisonersMinor: 2,
      staffMinor: 0,
      seriousInjuries: 0,
      relatedCpin: 'CPIN-2026-0398',
      suggestedCpin: null,
      status: 'reviewed',
      uploadBatch: 'April 2026',
      historic: false,
      notes: 'Matched to CPIN-2026-0398 on upload.',
      reviewedAt: '2026-04-30',
      reviewedBy: 'Phil Gower'
    },
    {
      id: 'is-17098',
      ref: 'IS202604-17098',
      eventId: 'Upload March 2026',
      incidentDate: '2026-03-26',
      premises: 'HMP Pentonville',
      premisesRef: 'PRM-0002099',
      specificLocation: 'Cell 8',
      typeOfFire: 'Fire in cell or dormitory',
      alarmRaised: 'Staff',
      ignitionSource: 'Linen — deliberate ignition',
      intent: 'Deliberate',
      howDetected: 'Domestic smoke detection (DSD)',
      fireExtinguishedBy: 'Staff',
      prisonersInjured: 0,
      staffInjured: 0,
      prisonersMinor: 0,
      staffMinor: 0,
      seriousInjuries: 0,
      relatedCpin: null,
      suggestedCpin: null,
      status: 'reviewed',
      uploadBatch: 'March 2026',
      historic: false,
      notes: 'No injury — logged for monthly trend reporting only.',
      reviewedAt: '2026-04-04',
      reviewedBy: 'Phil Gower'
    },
    {
      id: 'is-17085',
      ref: 'IS202604-17085',
      eventId: 'Upload March 2026',
      incidentDate: '2026-03-18',
      premises: 'HMP Isis',
      premisesRef: 'PRM-0002155',
      specificLocation: 'Education block store',
      typeOfFire: 'Fire in industrial premises',
      alarmRaised: 'Automatic fire alarm',
      ignitionSource: 'Portable heater — too close to combustibles',
      intent: 'Unintentional / accidental',
      howDetected: 'Automatic fire detection system',
      fireExtinguishedBy: 'Fire service',
      prisonersInjured: 0,
      staffInjured: 0,
      prisonersMinor: 0,
      staffMinor: 1,
      seriousInjuries: 0,
      relatedCpin: null,
      suggestedCpin: null,
      status: 'needs_review',
      uploadBatch: 'March 2026',
      historic: false,
      notes: ''
    },
    {
      id: 'is-17071',
      ref: 'IS202604-17071',
      eventId: 'Upload March 2026',
      incidentDate: '2026-03-11',
      premises: 'HMP Durham',
      premisesRef: 'PRM-0002122',
      specificLocation: 'Cell 22',
      typeOfFire: 'Fire in cell or dormitory',
      alarmRaised: 'Staff',
      ignitionSource: 'Smoking materials — prohibited',
      intent: 'Deliberate',
      howDetected: 'Staff observation',
      fireExtinguishedBy: 'Staff',
      prisonersInjured: 0,
      staffInjured: 0,
      prisonersMinor: 0,
      staffMinor: 0,
      seriousInjuries: 0,
      relatedCpin: null,
      suggestedCpin: null,
      status: 'reviewed',
      uploadBatch: 'March 2026',
      historic: true,
      notes: 'Historic record carried forward from prior Themis import.',
      reviewedAt: '2026-03-20',
      reviewedBy: 'Justin Cole'
    },
    {
      id: 'is-17055',
      ref: 'IS202604-17055',
      eventId: 'Upload March 2026',
      incidentDate: '2026-03-05',
      premises: 'HMP Wandsworth',
      premisesRef: 'PRM-0002095',
      specificLocation: 'Landing, D wing',
      typeOfFire: 'Fire in other residential',
      alarmRaised: 'Automatic fire alarm',
      ignitionSource: 'Electrical distribution — faulty wiring',
      intent: 'Unintentional / accidental',
      howDetected: 'Automatic fire detection system',
      fireExtinguishedBy: 'Fire service',
      prisonersInjured: 1,
      staffInjured: 0,
      prisonersMinor: 0,
      staffMinor: 0,
      seriousInjuries: 1,
      relatedCpin: null,
      suggestedCpin: null,
      status: 'investigating',
      uploadBatch: 'March 2026',
      historic: false,
      notes: 'Prison contacted — awaiting confirmation whether FRS submitted CPIN.',
      activityLog: {
        notes: [{ id: 'isn-wan', text: 'Prison contacted — awaiting confirmation whether FRS submitted CPIN.', at: '28 Mar 2026, 14:15', ts: 1743174900000 }],
        times: [{ id: 'ist-wan', activity: 'Phone call — prison', minutes: 45, at: '28 Mar 2026, 13:30', ts: 1743172200000 }],
        interim: [{ id: 'isi-wan', title: 'Awaiting FRS CPIN confirmation', text: 'Duty governor to confirm whether London Fire Brigade submitted a CPIN.', at: '28 Mar 2026, 14:20', ts: 1743175200000 }],
        files: []
      }
    },
    {
      id: 'is-17041',
      ref: 'IS202603-17041',
      eventId: 'Upload February 2026',
      incidentDate: '2026-02-27',
      premises: 'HMP Bristol',
      premisesRef: 'PRM-0002140',
      specificLocation: 'Laundry',
      typeOfFire: 'Fire in industrial premises',
      alarmRaised: 'Automatic fire alarm',
      ignitionSource: 'Hot work — sparks to combustibles',
      intent: 'Unintentional / accidental',
      howDetected: 'Automatic fire detection system',
      fireExtinguishedBy: 'Staff',
      prisonersInjured: 0,
      staffInjured: 0,
      prisonersMinor: 0,
      staffMinor: 0,
      seriousInjuries: 0,
      relatedCpin: null,
      suggestedCpin: null,
      status: 'reviewed',
      uploadBatch: 'February 2026',
      historic: false,
      notes: 'Contained quickly — evidence for RBIP trend only.',
      reviewedAt: '2026-03-08',
      reviewedBy: 'Phil Gower'
    }
  ];

  function pseudoRand(seed) {
    let x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
  }

  function pad2(n) { return String(n).padStart(2, '0'); }

  function isoDate(y, m, d) {
    return y + '-' + pad2(m + 1) + '-' + pad2(d);
  }

  function parseIsoDate(iso) {
    const p = (iso || '').split('-');
    return new Date(parseInt(p[0], 10), parseInt(p[1], 10) - 1, parseInt(p[2], 10));
  }

  function daysBetween(a, b) {
    const ms = Math.abs(parseIsoDate(a) - parseIsoDate(b));
    return Math.round(ms / 86400000);
  }

  function autoMatchCpin(summary) {
    if (!summary || !summary.premises || !summary.incidentDate) return null;
    let best = null;
    IS_DEMO_CPINS.forEach(function (c) {
      if (c.premises !== summary.premises) return;
      const days = daysBetween(summary.incidentDate, c.date);
      if (days > 30) return;
      if (!best || days < best.days) best = { ref: c.ref, routeId: c.routeId, days: days };
    });
    return best;
  }

  function defaultCpinForPremises(premises) {
    return IS_DEMO_CPINS.find(function (c) { return c.premises === premises; }) || null;
  }

  function applyAutoCpinLink(record, seed) {
    if (record.relatedCpin || record.cpinLinkManual) return record;
    const match = autoMatchCpin(record);
    if (match) {
      record.relatedCpin = match.ref;
      record.cpinAutoLinked = true;
      record.suggestedCpin = null;
      if (record.status === 'needs_review') record.status = 'investigating';
      return record;
    }
    const linkSeed = typeof seed === 'number' ? seed : 0;
    if (pseudoRand(linkSeed + 99) < IS_CPIN_LINK_RATE) {
      const fallback = defaultCpinForPremises(record.premises);
      if (fallback) {
        record.relatedCpin = fallback.ref;
        record.cpinAutoLinked = true;
        record.suggestedCpin = null;
        if (record.status === 'needs_review') record.status = 'investigating';
      }
    }
    return record;
  }

  function generateBulkSeedSummaries() {
    const records = JSON.parse(JSON.stringify(SEED_SUMMARIES));
    let seq = 17200;
    IS_BATCHES.forEach(function (batch, bi) {
      const existingInBatch = records.filter(function (r) { return r.uploadBatch === batch.label; }).length;
      const need = Math.max(0, batch.count - existingInBatch);
      const daysInMonth = new Date(batch.year, batch.month + 1, 0).getDate();
      for (let i = 0; i < need; i++) {
        const seed = bi * 10000 + i;
        const r = pseudoRand(seed);
        const prem = IS_PREMISES[Math.floor(r * IS_PREMISES.length)];
        const day = 1 + Math.floor(pseudoRand(seed + 1) * daysInMonth);
        const fireType = IS_FIRE_TYPES[Math.floor(pseudoRand(seed + 2) * IS_FIRE_TYPES.length)];
        const locBase = IS_LOCATIONS[Math.floor(pseudoRand(seed + 3) * IS_LOCATIONS.length)];
        const injuryRoll = pseudoRand(seed + 4);
        const hasInjury = injuryRoll < 0.14;
        const hasFatality = injuryRoll < 0.004;
        const prisonersInjured = hasFatality ? 0 : (hasInjury && pseudoRand(seed + 5) < 0.4 ? 1 : 0);
        const staffInjured = hasFatality ? 0 : (hasInjury && prisonersInjured === 0 ? 1 : 0);
        const prisonersMinor = (!hasInjury && !hasFatality && pseudoRand(seed + 6) < 0.08) ? 1 : 0;
        const staffMinor = (!hasInjury && !hasFatality && prisonersMinor === 0 && pseudoRand(seed + 7) < 0.06) ? 1 : 0;
        const seriousInjuries = hasInjury ? 1 : 0;
        const fatalities = hasFatality ? 1 : 0;
        const statusRoll = pseudoRand(seed + 8);
        const status = statusRoll < 0.55 ? 'reviewed' : (statusRoll < 0.78 ? 'needs_review' : 'investigating');
        const incidentDate = isoDate(batch.year, batch.month, day);
        const ref = 'IS' + batch.year + pad2(batch.month + 1) + '-' + seq;
        seq++;
        const rec = applyAutoCpinLink({
          id: 'is-' + seq,
          ref: ref,
          eventId: 'Upload ' + batch.label,
          incidentDate: incidentDate,
          premises: prem.name,
          premisesRef: prem.ref,
          specificLocation: locBase + ' ' + (1 + Math.floor(pseudoRand(seed + 9) * 24)),
          typeOfFire: fireType,
          alarmRaised: pseudoRand(seed + 10) < 0.5 ? 'Staff' : 'Automatic fire alarm',
          ignitionSource: 'Various — see HMPPS feed',
          intent: pseudoRand(seed + 11) < 0.12 ? 'Deliberate' : 'Unintentional / accidental',
          howDetected: 'Staff observation',
          fireExtinguishedBy: pseudoRand(seed + 12) < 0.7 ? 'Staff' : 'Fire service',
          prisonersInjured: prisonersInjured,
          staffInjured: staffInjured,
          prisonersMinor: prisonersMinor,
          staffMinor: staffMinor,
          seriousInjuries: seriousInjuries,
          fatalities: fatalities,
          relatedCpin: null,
          suggestedCpin: null,
          cpinAutoLinked: false,
          cpinLinkManual: false,
          status: status,
          uploadBatch: batch.label,
          historic: false,
          notes: ''
        }, seed);
        if (status === 'reviewed') {
          rec.reviewedAt = formatIsDate(incidentDate);
          rec.reviewedBy = IS_REVIEWER;
        }
        records.push(rec);
      }
    });
    return records.map(function (r, idx) { return applyAutoCpinLink(r, idx); });
  }

  let summaries = [];
  let overrides = {};
  let uploads = [];
  let activeView = 'needs-review';
  let activeSummaryId = null;
  let isDateFilter = { type: 'all' };
  let activeBatch = '';
  let premisesSearch = '';
  let premisesSearchOpen = false;
  let listShown = IS_LIST_PAGE;
  let isBatchDraft = '';
  let isActivityLog = { notes: [], times: [], interim: [], files: [] };
  let isLogType = 'note';
  let isActivityFeedFilter = 'all';
  let isActivityFiltersBound = false;

  const IS_ACTIVITY_FILTER_LABELS = {
    all: 'activity',
    time: 'time entries',
    note: 'notes',
    interim: 'interim reports',
    file: 'files'
  };

  function loadJson(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) {
      return fallback;
    }
  }

  function saveOverrides() {
    localStorage.setItem(IS_OVERRIDE_KEY, JSON.stringify(overrides));
  }

  function saveUploads() {
    localStorage.setItem(IS_UPLOADS_KEY, JSON.stringify(uploads));
  }

  function initIncidentSummaryStore() {
    const versionKey = IS_STORAGE_KEY + '-seed-version';
    const storedVersion = parseInt(localStorage.getItem(versionKey) || '0', 10);
    summaries = loadJson(IS_STORAGE_KEY, null);
    if (!summaries || !summaries.length || storedVersion < IS_SEED_VERSION) {
      summaries = generateBulkSeedSummaries();
      localStorage.setItem(IS_STORAGE_KEY, JSON.stringify(summaries));
      localStorage.setItem(versionKey, String(IS_SEED_VERSION));
    }
    overrides = loadJson(IS_OVERRIDE_KEY, {});
    uploads = loadJson(IS_UPLOADS_KEY, [
      { id: 'u-jun-2026', label: 'June 2026', uploadedAt: '1 Jul 2026', uploadedBy: 'Paul Mitchell', recordCount: 142, status: 'complete' },
      { id: 'u-may-2026', label: 'May 2026', uploadedAt: '2 Jun 2026', uploadedBy: 'Justin Cole', recordCount: 118, status: 'complete' },
      { id: 'u-apr-2026', label: 'April 2026', uploadedAt: '1 May 2026', uploadedBy: 'Paul Mitchell', recordCount: 96, status: 'complete' },
      { id: 'u-mar-2026', label: 'March 2026', uploadedAt: '2 Apr 2026', uploadedBy: 'Justin Cole', recordCount: 89, status: 'complete' },
      { id: 'u-feb-2026', label: 'February 2026', uploadedAt: '3 Mar 2026', uploadedBy: 'Paul Mitchell', recordCount: 74, status: 'complete' }
    ]);
  }

  function getSummaryById(id) {
    return summaries.find(function (s) { return s.id === id; }) || null;
  }

  function mergeSummary(base) {
    const o = overrides[base.id] || {};
    return Object.assign({}, base, o);
  }

  function getAllSummaries() {
    return summaries.map(mergeSummary);
  }

  function activeIncidentSummaryId() {
    return activeSummaryId;
  }

  function setActiveIncidentSummaryId(id) {
    activeSummaryId = id;
  }

  function hasFatalityFlag(s) {
    return (s.fatalities || 0) > 0;
  }

  function hasInjuryFlag(s) {
    return hasFatalityFlag(s) ||
      (s.prisonersInjured || 0) + (s.staffInjured || 0) + (s.seriousInjuries || 0) > 0 ||
      (s.prisonersMinor || 0) + (s.staffMinor || 0) > 0;
  }

  function incidentDaysAgo(iso) {
    if (!iso) return 9999;
    const d = parseIsoDate(iso);
    return Math.max(0, Math.floor((IS_DEMO_TODAY - d) / (24 * 60 * 60 * 1000)));
  }

  function matchesIsDateFilter(s) {
    if (typeof matchesDateRangeFilter !== 'function') return true;
    return matchesDateRangeFilter(incidentDaysAgo(s.incidentDate), isDateFilter);
  }

  function matchesBatchFilter(s) {
    if (!activeBatch) return true;
    return s.uploadBatch === activeBatch;
  }

  function matchesPremisesSearch(s) {
    if (!premisesSearch) return true;
    return (s.premises || '').toLowerCase().indexOf(premisesSearch.toLowerCase()) >= 0;
  }

  function matchesView(s, view) {
    if (view === 'all') return true;
    if (view === 'needs-review') return s.status === 'needs_review' || s.status === 'investigating';
    if (view === 'injury') return hasInjuryFlag(s) && !hasFatalityFlag(s);
    if (view === 'fatality') return hasFatalityFlag(s);
    if (view === 'no-cpin') return !s.relatedCpin;
    if (view === 'linked') return !!s.relatedCpin;
    if (view === 'reviewed') return s.status === 'reviewed';
    return true;
  }

  function filterSummaries(items) {
    return items.filter(function (s) {
      return matchesView(s, activeView) &&
        matchesIsDateFilter(s) &&
        matchesBatchFilter(s) &&
        matchesPremisesSearch(s);
    });
  }

  function statsBaseItems() {
    return getAllSummaries().filter(function (s) {
      return matchesIsDateFilter(s) && matchesBatchFilter(s) && matchesPremisesSearch(s);
    });
  }

  function computeIsStats(items) {
    return {
      total: items.length,
      injuries: items.filter(function (s) { return hasInjuryFlag(s) && !hasFatalityFlag(s); }).length,
      fatalities: items.filter(hasFatalityFlag).length,
      linked: items.filter(function (s) { return !!s.relatedCpin; }).length,
      autoLinked: items.filter(function (s) { return !!s.relatedCpin && s.cpinAutoLinked; }).length,
      needsReview: items.filter(function (s) { return s.status === 'needs_review' || s.status === 'investigating'; }).length,
      reviewed: items.filter(function (s) { return s.status === 'reviewed'; }).length
    };
  }

  function setIsDateFilter(filter) {
    isDateFilter = filter && filter.type ? filter : { type: 'all' };
    reconcileActiveBatch();
    listShown = IS_LIST_PAGE;
    renderIncidentSummariesPage();
  }

  function getIsDateFilter() {
    return isDateFilter;
  }

  function getIsDateRangeLabel() {
    if (typeof formatDateRangeLabel === 'function') {
      return formatDateRangeLabel(isDateFilter, 'incident-summaries');
    }
    return 'All dates';
  }

  function getAvailableBatches() {
    const byBatch = {};
    getAllSummaries().forEach(function (s) {
      if (!s.uploadBatch || !matchesIsDateFilter(s)) return;
      byBatch[s.uploadBatch] = (byBatch[s.uploadBatch] || 0) + 1;
    });
    return IS_BATCHES
      .map(function (b) { return { label: b.label, count: byBatch[b.label] || 0 }; })
      .filter(function (b) { return b.count > 0; });
  }

  function reconcileActiveBatch() {
    if (!activeBatch) return;
    const available = getAvailableBatches();
    if (!available.some(function (b) { return b.label === activeBatch; })) {
      activeBatch = '';
    }
  }

  function syncIsBatchTrigger() {
    const trigger = document.getElementById('is-batch-trigger');
    if (!trigger) return;
    const strong = trigger.querySelector('strong');
    if (strong) {
      if (!activeBatch) {
        strong.textContent = 'All batches';
      } else {
        const match = getAvailableBatches().find(function (b) { return b.label === activeBatch; });
        strong.textContent = match ? (activeBatch + ' · ' + match.count) : activeBatch;
      }
    }
  }

  function renderIsBatchModal() {
    const el = document.getElementById('is-batch-presets');
    const subEl = document.getElementById('is-batch-modal-sub');
    if (!el) return;
    const batches = getAvailableBatches();
    const totalInRange = batches.reduce(function (n, b) { return n + b.count; }, 0);
    if (subEl) {
      subEl.textContent = batches.length
        ? 'Upload batches with incidents in ' + getIsDateRangeLabel().toLowerCase() + '.'
        : 'No upload batches match the current incident date range.';
    }
    if (isBatchDraft && !batches.some(function (b) { return b.label === isBatchDraft; })) {
      isBatchDraft = '';
    }
    if (!batches.length) {
      el.innerHTML = '<div class="help" style="margin:0;">Try widening the incident date range to see upload batches.</div>';
      return;
    }
    el.innerHTML =
      '<button type="button" class="date-range-preset' + (isBatchDraft === '' ? ' active' : '') + '" data-is-batch-draft="">All batches · ' + totalInRange + '</button>' +
      batches.map(function (b) {
        return '<button type="button" class="date-range-preset' + (isBatchDraft === b.label ? ' active' : '') + '" data-is-batch-draft="' + esc(b.label) + '">' + esc(b.label) + ' · ' + b.count + '</button>';
      }).join('');
  }

  let isBatchModalBound = false;

  function bindIsBatchModal() {
    if (isBatchModalBound) return;
    const el = document.getElementById('is-batch-presets');
    if (!el) return;
    el.addEventListener('click', function (e) {
      const btn = e.target.closest('[data-is-batch-draft]');
      if (!btn) return;
      selectIsBatchDraft(btn.getAttribute('data-is-batch-draft') || '');
    });
    isBatchModalBound = true;
  }

  function openIsBatchModal() {
    bindIsBatchModal();
    reconcileActiveBatch();
    isBatchDraft = activeBatch;
    renderIsBatchModal();
    const modal = document.getElementById('is-batch-modal');
    if (modal) {
      modal.classList.add('open');
      document.body.style.overflow = 'hidden';
    }
  }

  function closeIsBatchModal() {
    const modal = document.getElementById('is-batch-modal');
    if (modal) modal.classList.remove('open');
    document.body.style.overflow = '';
  }

  function selectIsBatchDraft(batch) {
    isBatchDraft = batch || '';
    renderIsBatchModal();
  }

  function applyIsBatchModal() {
    activeBatch = isBatchDraft || '';
    listShown = IS_LIST_PAGE;
    closeIsBatchModal();
    renderIncidentSummariesPage();
  }

  function setIsBatchFilter(batch) {
    activeBatch = batch || '';
    listShown = IS_LIST_PAGE;
    renderIncidentSummariesPage();
  }

  function setIsPremisesSearch(q) {
    premisesSearch = q || '';
    listShown = IS_LIST_PAGE;
    syncIsPremisesSearchUi();
    renderIncidentSummaryList();
    renderIncidentSummaryStats();
    renderIncidentSummaryViews();
  }

  function syncIsPremisesSearchUi() {
    const wrap = document.getElementById('is-premises-search-wrap');
    const input = document.getElementById('is-premises-search');
    const toggle = document.getElementById('is-premises-search-toggle');
    const open = premisesSearchOpen || !!premisesSearch;
    if (wrap) {
      wrap.classList.toggle('open', open);
      wrap.classList.toggle('has-value', !!premisesSearch);
    }
    if (toggle) toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    if (input && input.value !== premisesSearch) input.value = premisesSearch;
  }

  function toggleIsPremisesSearch() {
    premisesSearchOpen = !premisesSearchOpen;
    if (!premisesSearchOpen && premisesSearch) {
      setIsPremisesSearch('');
      return;
    }
    syncIsPremisesSearchUi();
    if (premisesSearchOpen) {
      const input = document.getElementById('is-premises-search');
      if (input) input.focus();
    }
  }

  function loadMoreIsList() {
    listShown += IS_LIST_PAGE;
    renderIncidentSummaryList();
  }

  function renderIncidentSummaryStats() {
    const el = document.getElementById('is-stats-hero');
    if (!el) return;
    const stats = computeIsStats(statsBaseItems());
    el.innerHTML =
      '<div class="cpin-tile blue"><div class="lbl"><span class="dot"></span>Incidents</div><div class="big">' + stats.total + '</div><div class="sub">In selected range</div></div>' +
      '<div class="cpin-tile amber"><div class="lbl"><span class="dot"></span>Injury flagged</div><div class="big">' + stats.injuries + '</div><div class="sub">Review required</div></div>' +
      '<div class="cpin-tile red"><div class="lbl"><span class="dot"></span>Fatalities</div><div class="big">' + stats.fatalities + '</div><div class="sub">Escalate immediately</div></div>';
  }

  function renderIncidentSummaryFilterControls() {
    reconcileActiveBatch();
    syncIsBatchTrigger();
    syncIsPremisesSearchUi();
    if (typeof syncDateRangeTrigger === 'function') syncDateRangeTrigger('incident-summaries');
  }

  function countByView(view) {
    return getAllSummaries().filter(function (s) {
      return matchesView(s, view) &&
        matchesIsDateFilter(s) &&
        matchesBatchFilter(s) &&
        matchesPremisesSearch(s);
    }).length;
  }

  function formatIsDate(iso) {
    if (!iso) return '—';
    const d = new Date(iso + 'T12:00:00');
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function statusPill(status) {
    const map = { needs_review: 'amber', investigating: 'blue', reviewed: 'green' };
    return map[status] || 'grey';
  }

  function renderIncidentSummaryCard(s) {
    const injury = hasInjuryFlag(s);
    const fatality = hasFatalityFlag(s);
    const cardTone = fatality ? 'red' : (injury ? 'amber' : (s.status === 'reviewed' ? 'green' : 'amber'));
    const cpinTags = [
      '<span class="pill ' + statusPill(s.status) + '">' + esc(IS_STATUS_LABELS[s.status] || s.status) + '</span>'
    ];
    if (s.relatedCpin) {
      cpinTags.push('<span class="pill blue">' + esc(s.relatedCpin) + (s.cpinAutoLinked ? ' · auto' : '') + '</span>');
    } else {
      cpinTags.push('<span class="pill grey">No CPIN</span>');
    }
    if (fatality) cpinTags.push('<span class="pill red">Fatality</span>');
    else if (injury) cpinTags.push('<span class="pill red">Injury flagged</span>');
    return '<div class="cpin-card is-summary-card ' + cardTone + '" role="button" tabindex="0" onclick="show(\'incident-summary/' + esc(s.id) + '\')" onkeydown="if(event.key===\'Enter\'||event.key===\' \'){show(\'incident-summary/' + esc(s.id) + '\')}">' +
      '<div class="cpin-body">' +
        '<div style="font-size:12px;color:var(--ink-3);">' + esc(s.ref) + ' · ' + esc(formatIsDate(s.incidentDate)) + '</div>' +
        '<div class="premises">' + esc(s.premises) + '</div>' +
        '<div class="summary">' + esc(s.typeOfFire) + ' · ' + esc(s.specificLocation) + '</div>' +
        '<div class="is-card-tags">' + cpinTags.join('') + '</div>' +
      '</div>' +
      '<div class="cpin-meta">' +
        '<div class="cpin-assignee">' + esc(s.uploadBatch) + '</div>' +
      '</div>' +
    '</div>';
  }

  function renderIncidentSummaryList() {
    const list = document.getElementById('is-summary-list');
    const countEl = document.getElementById('is-results-count');
    if (!list) return;
    const items = filterSummaries(getAllSummaries())
      .sort(function (a, b) { return (b.incidentDate || '').localeCompare(a.incidentDate || ''); });
    if (countEl) {
      countEl.textContent = String(items.length) + (items.length !== getAllSummaries().length ? ' (filtered)' : '');
    }
    if (!items.length) {
      list.innerHTML = '<div class="audit-feed-empty" style="margin:24px 0;">No incident summaries match this view and filter.</div>';
      return;
    }
    const slice = items.slice(0, listShown);
    list.innerHTML =
      '<div class="cpins-card-stack">' + slice.map(renderIncidentSummaryCard).join('') + '</div>' +
      (items.length > listShown
        ? '<button type="button" class="btn" style="margin-top:12px;" onclick="loadMoreIsList()">Load more (' + (items.length - listShown) + ' remaining)</button>'
        : '');
  }

  function renderIncidentSummaryViews() {
    const rail = document.getElementById('is-views-rail');
    if (!rail) return;
    rail.innerHTML = '<h4>Views</h4>' + IS_VIEWS.map(function (v) {
      const active = v.id === activeView ? ' active' : '';
      const count = countByView(v.id);
      return '<div class="view-item' + active + '" data-is-view="' + esc(v.id) + '" role="menuitem" tabindex="0">' +
        '<span class="view-item-label">' + esc(v.label) + '</span>' +
        '<span class="pin">' + count + '</span></div>';
    }).join('');
    rail.querySelectorAll('[data-is-view]').forEach(function (el) {
      function activate() {
        activeView = el.dataset.isView;
        renderIncidentSummariesPage();
      }
      el.addEventListener('click', activate);
      el.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          activate();
        }
      });
    });
  }

  function renderIncidentSummaryUploads() {
    const el = document.getElementById('is-upload-history');
    if (!el) return;
    if (!uploads.length) {
      el.innerHTML = '<div class="audit-feed-empty">No uploads yet.</div>';
      return;
    }
    el.innerHTML = '<table class="data"><thead><tr><th>Batch</th><th>Uploaded</th><th>By</th><th>Records</th><th>Status</th></tr></thead><tbody>' +
      uploads.map(function (u) {
        return '<tr><td><strong>' + esc(u.label) + '</strong></td><td>' + esc(u.uploadedAt) + '</td><td>' + esc(u.uploadedBy) + '</td><td>' + esc(String(u.recordCount)) + '</td><td><span class="pill green">Imported</span></td></tr>';
      }).join('') +
      '</tbody></table>';
  }

  function renderIncidentSummariesPage() {
    renderIncidentSummaryFilterControls();
    renderIncidentSummaryStats();
    renderIncidentSummaryViews();
    renderIncidentSummaryList();
  }

  function initIncidentSummariesPage() {
    initIncidentSummaryStore();
    renderIncidentSummariesPage();
    renderIncidentSummaryUploads();
    const intro = document.getElementById('is-queue-hint');
    if (intro) {
      const stats = computeIsStats(statsBaseItems());
      intro.innerHTML = 'Monthly fire incident records from <strong>HMPPS</strong>. ' +
        '<strong>' + stats.total + '</strong> incidents in the selected range — ' +
        '<strong>' + stats.injuries + '</strong> injury flagged, <strong>' + stats.fatalities + '</strong> fatalities. ' +
        'CPIN links are auto-matched by premises and date where possible.';
    }
  }

  function createEmptyIsActivityLog() {
    return { notes: [], times: [], interim: [], files: [] };
  }

  function loadIsActivityFromRecord(merged) {
    if (!merged) return createEmptyIsActivityLog();
    if (merged.activityLog) {
      return {
        notes: (merged.activityLog.notes || []).slice(),
        times: (merged.activityLog.times || []).slice(),
        interim: (merged.activityLog.interim || []).slice(),
        files: (merged.activityLog.files || []).slice()
      };
    }
    if (merged.notes) {
      return {
        notes: [{ id: 'legacy-n', text: merged.notes, at: merged.reviewedAt || 'Earlier', ts: Date.now() - 86400000 }],
        times: [],
        interim: [],
        files: []
      };
    }
    return createEmptyIsActivityLog();
  }

  function saveIsActivityLogToRecord() {
    if (!activeSummaryId) return;
    patchSummary(activeSummaryId, { activityLog: isActivityLog });
  }

  function isLogTimestamp() {
    if (typeof cpinLogTimestamp === 'function') return cpinLogTimestamp();
    const now = new Date();
    return {
      at: now.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) + ', ' +
        now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
      ts: Date.now()
    };
  }

  function formatIsMinutes(totalMin) {
    if (typeof formatAuditMinutes === 'function') return formatAuditMinutes(totalMin);
    if (totalMin >= 60) {
      const h = Math.floor(totalMin / 60);
      const m = totalMin % 60;
      return h + 'h' + (m ? ' ' + m + 'm' : '');
    }
    return totalMin + 'm';
  }

  function formatIsDurationLabel(minutes) {
    if (typeof formatDurationLabel === 'function') return formatDurationLabel(minutes);
    return minutes + 'm';
  }

  function bindIsActivityFilterHandlers() {
    if (isActivityFiltersBound) return;
    document.querySelectorAll('.is-activity-filters .chip').forEach(function (chip) {
      chip.addEventListener('click', function () {
        setIsActivityFeedFilter(chip.dataset.isActivityFilter || 'all');
      });
    });
    isActivityFiltersBound = true;
  }

  function setIsActivityFeedFilter(filter) {
    isActivityFeedFilter = filter || 'all';
    document.querySelectorAll('.is-activity-filters .chip').forEach(function (chip) {
      chip.classList.toggle('on', chip.dataset.isActivityFilter === isActivityFeedFilter);
    });
    renderIsActivity();
  }

  function setIsActivityBarVisible(visible) {
    document.body.classList.toggle('is-activity-bar', visible);
    if (!visible) document.body.classList.remove('is-float-panel-open');
  }

  function setIsLogType(type) {
    isLogType = type || 'time';
    document.querySelectorAll('#is-log-type-row .chip').forEach(function (chip) {
      chip.classList.toggle('active', chip.dataset.isLogType === isLogType);
    });
    ['time', 'note', 'interim', 'file'].forEach(function (t) {
      const el = document.getElementById('is-log-fields-' + t);
      if (el) el.hidden = t !== isLogType;
    });
  }

  function syncIsFloatLogFields() {
    const merged = mergeSummary(getSummaryById(activeSummaryId) || {});
    const what = document.getElementById('is-time-what');
    const hint = document.getElementById('is-float-log-hint');
    if (what) {
      what.value = merged.ref + (merged.premises ? ' · ' + merged.premises : '');
    }
    if (hint) {
      hint.textContent = 'Logged against ' + IS_REVIEWER + ' on this incident summary. Choose a date for time entries — defaults to today.';
    }
  }

  function openIsFloatPanel(mode) {
    const panel = document.getElementById('is-float-panel');
    if (!panel) return;
    setIsActivityBarVisible(true);
    setIsLogType(mode || isLogType || 'note');
    syncIsFloatLogFields();
    if (typeof resetActivityLogDate === 'function') resetActivityLogDate('is-time-date');
    panel.classList.add('open');
    panel.setAttribute('aria-hidden', 'false');
    document.body.classList.add('is-float-panel-open');
    if (isLogType === 'note') {
      requestAnimationFrame(function () { document.getElementById('is-note-text')?.focus(); });
    } else if (isLogType === 'time') {
      requestAnimationFrame(function () { document.getElementById('is-time-duration')?.focus(); });
    }
  }

  function closeIsFloatPanel() {
    const panel = document.getElementById('is-float-panel');
    if (panel) {
      panel.classList.remove('open');
      panel.setAttribute('aria-hidden', 'true');
    }
    document.body.classList.remove('is-float-panel-open');
  }

  function renderIsActivityFeedItem(item) {
    let pillClass = 'grey';
    let pillLabel = 'Note';
    let textHtml = esc(item.text || '');
    if (item.type === 'time') {
      pillClass = 'blue';
      pillLabel = 'Time';
      textHtml = esc(item.activity) + ' · <strong>' + esc(formatIsDurationLabel(item.minutes)) + '</strong>';
    } else if (item.type === 'interim') {
      pillClass = 'amber';
      pillLabel = 'Interim';
      textHtml = '<strong>' + esc(item.title) + '</strong>' + (item.text ? ' — ' + esc(item.text) : '');
    } else if (item.type === 'file') {
      pillClass = 'purple';
      pillLabel = 'File';
      textHtml = '<strong>' + esc(item.name) + '</strong>' + (item.description ? ' — ' + esc(item.description) : '');
    }
    return '<div class="audit-feed-item">' +
      '<div class="audit-feed-meta"><span class="audit-feed-when">' + esc(item.at) + '</span></div>' +
      '<div class="audit-feed-body">' +
        '<span class="pill ' + pillClass + '">' + pillLabel + '</span>' +
        '<span class="audit-feed-text">' + textHtml + '</span>' +
      '</div></div>';
  }

  function renderIsActivity() {
    bindIsActivityFilterHandlers();
    const notesEl = document.getElementById('is-count-notes');
    const filesEl = document.getElementById('is-count-files');
    const timeEl = document.getElementById('is-count-time');
    const recentNotesEl = document.getElementById('is-recent-count-notes');
    const recentTimeEl = document.getElementById('is-recent-count-time');
    const feed = document.getElementById('is-activity-feed-list');

    const noteCount = isActivityLog.notes.length + isActivityLog.interim.length;
    const fileCount = isActivityLog.files.length;
    const totalMin = isActivityLog.times.reduce(function (s, t) { return s + (t.minutes || 0); }, 0);
    const notesLabel = noteCount + (noteCount === 1 ? ' note' : ' notes');
    const filesLabel = fileCount + (fileCount === 1 ? ' file' : ' files');
    const timeLabel = formatIsMinutes(totalMin) + ' logged';

    if (notesEl) notesEl.textContent = notesLabel;
    if (filesEl) filesEl.textContent = filesLabel;
    if (timeEl) timeEl.textContent = timeLabel;
    if (recentNotesEl) recentNotesEl.textContent = notesLabel;
    if (recentTimeEl) recentTimeEl.textContent = timeLabel;

    if (!feed) return;

    const items = [];
    isActivityLog.times.forEach(function (t) {
      items.push({ ts: t.ts || 0, at: t.at, type: 'time', activity: t.activity, minutes: t.minutes });
    });
    isActivityLog.notes.forEach(function (n) {
      items.push({ ts: n.ts || 0, at: n.at, type: 'note', text: n.text });
    });
    isActivityLog.interim.forEach(function (n) {
      items.push({ ts: n.ts || 0, at: n.at, type: 'interim', title: n.title, text: n.text });
    });
    isActivityLog.files.forEach(function (f) {
      items.push({ ts: f.ts || 0, at: f.at, type: 'file', name: f.name, description: f.description });
    });
    items.sort(function (a, b) { return b.ts - a.ts; });

    const filtered = isActivityFeedFilter === 'all'
      ? items
      : items.filter(function (item) { return item.type === isActivityFeedFilter; });

    if (!items.length) {
      feed.innerHTML = '<div class="audit-feed-empty">No activity logged yet on this incident summary. Use <strong>+ Log</strong> in the activity bar to add notes or time.</div>';
      return;
    }
    if (!filtered.length) {
      const label = IS_ACTIVITY_FILTER_LABELS[isActivityFeedFilter] || 'entries';
      feed.innerHTML = '<div class="audit-feed-empty">No ' + label + ' on this incident summary yet.</div>';
      return;
    }
    feed.innerHTML = filtered.map(renderIsActivityFeedItem).join('');
  }

  function initIsActivity() {
    const s = getSummaryById(activeSummaryId);
    isActivityLog = loadIsActivityFromRecord(mergeSummary(s || {}));
    renderIsActivity();
    setIsActivityBarVisible(true);
  }

  function submitIsLog() {
    if (!activeSummaryId) return;
    const stamp = isLogTimestamp();

    if (isLogType === 'time') {
      const durEl = document.getElementById('is-time-duration');
      const actEl = document.getElementById('is-time-activity');
      const timeStamp = typeof getActivityLogStampForTime === 'function'
        ? getActivityLogStampForTime('is-time-date')
        : stamp;
      if (!timeStamp) return;
      isActivityLog.times.unshift({
        id: 'ist' + timeStamp.ts,
        activity: actEl?.value || 'Review incident summary',
        minutes: parseInt(durEl?.value || '30', 10),
        at: timeStamp.at,
        ts: timeStamp.ts,
        logDate: timeStamp.logDate
      });
    } else if (isLogType === 'note') {
      const text = document.getElementById('is-note-text')?.value?.trim();
      if (!text) {
        window.alert('Enter a note before saving.');
        return;
      }
      isActivityLog.notes.unshift({ id: 'isn' + stamp.ts, text: text, at: stamp.at, ts: stamp.ts });
      document.getElementById('is-note-text').value = '';
    } else if (isLogType === 'interim') {
      const desc = document.getElementById('is-interim-desc')?.value?.trim();
      if (!desc) {
        window.alert('Enter a description for this interim activity.');
        return;
      }
      isActivityLog.interim.unshift({
        id: 'isi' + stamp.ts,
        title: desc,
        text: document.getElementById('is-interim-text')?.value?.trim() || '',
        at: stamp.at,
        ts: stamp.ts
      });
      document.getElementById('is-interim-desc').value = '';
      document.getElementById('is-interim-text').value = '';
    } else if (isLogType === 'file') {
      const desc = document.getElementById('is-file-desc')?.value?.trim();
      const fileInput = document.getElementById('is-file-input');
      const file = fileInput?.files?.[0];
      if (!desc) {
        window.alert('Enter a description for this file.');
        return;
      }
      if (!file) {
        window.alert('Choose a file to attach.');
        return;
      }
      isActivityLog.files.unshift({
        id: 'isf' + stamp.ts,
        name: file.name,
        description: desc,
        at: stamp.at,
        ts: stamp.ts
      });
      document.getElementById('is-file-desc').value = '';
      if (fileInput) fileInput.value = '';
    }

    saveIsActivityLogToRecord();
    renderIsActivity();
    closeIsFloatPanel();
  }

  function intakeCell(label, value) {
    return '<div><div class="k">' + esc(label) + '</div><div class="v">' + value + '</div></div>';
  }

  function renderIncidentSummaryDetail() {
    initIncidentSummaryStore();
    const s = getSummaryById(activeSummaryId);
    if (!s) {
      show('incident-summaries');
      return;
    }
    const merged = mergeSummary(s);
    const title = document.getElementById('is-detail-title');
    const meta = document.getElementById('is-detail-meta');
    const kicker = document.getElementById('is-detail-kicker');
    const body = document.getElementById('is-detail-body');
    const actions = document.getElementById('is-detail-actions');
    if (title) title.textContent = merged.ref;
    if (meta) {
      meta.textContent = formatIsDate(merged.incidentDate) + ' · ' + merged.premises + ' · Batch ' + merged.uploadBatch;
    }
    if (kicker) {
      const tags = ['<span class="pill ' + statusPill(merged.status) + '">' + esc(IS_STATUS_LABELS[merged.status]) + '</span>'];
      if (hasFatalityFlag(merged)) tags.push('<span class="pill red">Fatality</span>');
      else if (hasInjuryFlag(merged)) tags.push('<span class="pill red">Injury flagged</span>');
      if (merged.relatedCpin) {
        tags.push('<span class="pill blue">' + esc(merged.relatedCpin) + (merged.cpinAutoLinked ? ' · auto-matched' : '') + '</span>');
      }
      if (merged.reviewedAt) {
        tags.push('<span class="pill green">Reviewed ' + esc(merged.reviewedAt) + (merged.reviewedBy ? ' · ' + esc(merged.reviewedBy) : '') + '</span>');
      }
      kicker.innerHTML = tags.join('');
    }
    if (body) {
      const injuryRows = [
        ['Prisoners — significant injury', merged.prisonersInjured],
        ['Staff — significant injury', merged.staffInjured],
        ['Serious injuries (total)', merged.seriousInjuries],
        ['Prisoners — minor injury', merged.prisonersMinor],
        ['Staff — minor injury', merged.staffMinor],
        ['Fatalities', merged.fatalities || 0]
      ];
      body.innerHTML =
        '<div class="setup-section">' +
        '<h3>Incident details</h3>' +
        '<div class="help">From the monthly HMPPS incident summary spreadsheet.</div>' +
        '<div class="cpin-intake-grid">' +
        intakeCell('Premises', '<a onclick="showPremisesByName(' + JSON.stringify(merged.premises) + ')">' + esc(merged.premises) + '</a> <span style="color:var(--ink-3);">(' + esc(merged.premisesRef) + ')</span>') +
        intakeCell('Incident date', esc(formatIsDate(merged.incidentDate))) +
        intakeCell('Specific location', esc(merged.specificLocation)) +
        intakeCell('Type of fire', esc(merged.typeOfFire)) +
        intakeCell('Alarm raised', esc(merged.alarmRaised)) +
        intakeCell('Ignition source', esc(merged.ignitionSource)) +
        intakeCell('Intent', esc(merged.intent)) +
        intakeCell('How detected', esc(merged.howDetected)) +
        intakeCell('Extinguished by', esc(merged.fireExtinguishedBy)) +
        intakeCell('Upload batch', esc(merged.eventId || merged.uploadBatch)) +
        (merged.historic ? intakeCell('Historic record', 'Yes — carried from prior system') : '') +
        '</div></div>' +
        '<div class="setup-section">' +
        '<h3>Injuries</h3>' +
        '<div class="help">Counts from the HMPPS feed — use to decide whether a CPIN should exist.</div>' +
        '<table class="data"><thead><tr><th>Category</th><th>Count</th></tr></thead><tbody>' +
        injuryRows.map(function (r) {
          const highlight = r[1] > 0 ? ' style="font-weight:600;color:var(--red);"' : '';
          return '<tr><td>' + esc(r[0]) + '</td><td' + highlight + '>' + esc(String(r[1])) + '</td></tr>';
        }).join('') +
        '</tbody></table>' +
        (hasFatalityFlag(merged)
          ? '<div class="info-banner info-banner--severe" style="margin-top:12px;margin-bottom:0;"><strong>Fatality recorded.</strong> Escalate per CPFSI procedure and confirm CPIN / investigation status.</div>'
          : (hasInjuryFlag(merged) ? '<div class="info-banner" style="margin-top:12px;margin-bottom:0;"><strong>Injury flagged.</strong> Review whether a CPIN exists and what action was taken.</div>' : '')) +
        '</div>' +
        '<div class="setup-section">' +
        '<h3>CPIN linkage</h3>' +
        (merged.relatedCpin
          ? '<div class="help">' +
            (merged.cpinAutoLinked
              ? 'Auto-matched to <a onclick="show(\'cpin/' + esc(getCpinRouteId(merged.relatedCpin)) + '\')">' + esc(merged.relatedCpin) + '</a> by premises and incident date (within 14 days).'
              : 'Manually linked to <a onclick="show(\'cpin/' + esc(getCpinRouteId(merged.relatedCpin)) + '\')">' + esc(merged.relatedCpin) + '</a>.') +
            '</div>'
          : '<div class="help">No CPIN auto-match found for this premises and date. Most links are created automatically on upload — override below only if needed.</div>') +
        '<details class="is-cpin-override"><summary>Override CPIN link</summary>' +
        '<div class="is-link-row" style="margin-top:10px;">' +
        '<div class="field">' +
        '<label for="is-link-cpin-select">Link CPIN</label>' +
        '<select id="is-link-cpin-select">' +
        '<option value="">— Select CPIN —</option>' +
        ['CPIN-2026-0412', 'CPIN-2026-0398', 'CPIN-2026-0418', 'CPIN-2026-0440'].map(function (ref) {
          return '<option value="' + esc(ref) + '"' + (merged.relatedCpin === ref ? ' selected' : '') + '>' + esc(ref) + '</option>';
        }).join('') +
        '</select></div>' +
        '<button type="button" class="btn" onclick="linkIncidentSummaryCpin()">Save override</button>' +
        '</div></details></div>';
    }
    if (actions) {
      actions.innerHTML =
        (merged.status !== 'reviewed'
          ? '<button type="button" class="btn primary" onclick="markIncidentSummaryReviewed()">Mark as reviewed</button>'
          : '<button type="button" class="btn" onclick="reopenIncidentSummary()">Reopen for review</button>') +
        '<button type="button" class="btn" onclick="openIsFloatPanel(\'note\')">+ Log note</button>';
    }
    initIsActivity();
  }

  function getCpinRouteId(ref) {
    const found = IS_DEMO_CPINS.find(function (c) { return c.ref === ref; });
    if (found) return found.routeId;
    const map = {
      'CPIN-2026-0412': 'cpin-0412',
      'CPIN-2026-0398': 'cpin-0398',
      'CPIN-2026-0418': 'cpin-0418-tq',
      'CPIN-2026-0440': 'cpin-u-0440',
      'CPIN-2026-0447': 'cpin-in-0447'
    };
    return map[ref] || 'cpin-0418-tq';
  }

  function patchSummary(id, patch) {
    if (!overrides[id]) overrides[id] = {};
    Object.assign(overrides[id], patch);
    saveOverrides();
  }

  function markIncidentSummaryReviewed() {
    const stamp = isLogTimestamp();
    isActivityLog.notes.unshift({
      id: 'isr' + stamp.ts,
      text: 'Marked as reviewed.',
      at: stamp.at,
      ts: stamp.ts
    });
    patchSummary(activeSummaryId, {
      status: 'reviewed',
      reviewedAt: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
      reviewedBy: IS_REVIEWER,
      activityLog: isActivityLog
    });
    renderIncidentSummaryDetail();
    initIncidentSummariesPage();
  }

  function reopenIncidentSummary() {
    patchSummary(activeSummaryId, { status: 'needs_review', reviewedAt: null, reviewedBy: null });
    renderIncidentSummaryDetail();
    initIncidentSummariesPage();
  }

  function linkIncidentSummaryCpin() {
    const sel = document.getElementById('is-link-cpin-select');
    const val = sel && sel.value;
    if (!val) {
      window.alert('Select a CPIN to link.');
      return;
    }
    const stamp = isLogTimestamp();
    isActivityLog.notes.unshift({
      id: 'isc' + stamp.ts,
      text: 'Linked to ' + val + '.',
      at: stamp.at,
      ts: stamp.ts
    });
    patchSummary(activeSummaryId, {
      relatedCpin: val,
      suggestedCpin: null,
      cpinAutoLinked: false,
      cpinLinkManual: true,
      status: 'investigating',
      activityLog: isActivityLog
    });
    renderIncidentSummaryDetail();
    initIncidentSummariesPage();
  }

  function openIncidentSummaryUploadModal() {
    const modal = document.getElementById('is-upload-modal');
    if (modal) modal.classList.add('open');
    document.body.style.overflow = 'hidden';
    const batch = document.getElementById('is-upload-batch');
    if (batch && !batch.value) {
      const now = new Date();
      batch.value = now.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
    }
  }

  function closeIncidentSummaryUploadModal() {
    const modal = document.getElementById('is-upload-modal');
    if (modal) modal.classList.remove('open');
    if (!document.querySelector('.modal-backdrop.open')) document.body.style.overflow = '';
  }

  function submitIncidentSummaryUpload() {
    const file = document.getElementById('is-upload-file');
    const batch = document.getElementById('is-upload-batch')?.value || 'New batch';
    if (!file || !file.files || !file.files.length) {
      window.alert('Choose the HMPPS spreadsheet to upload.');
      return;
    }
    const label = batch.indexOf('Upload') === 0 ? batch : batch;
    const importCount = 120 + Math.floor(Math.random() * 40);
    uploads.unshift({
      id: 'u-' + Date.now(),
      label: label,
      uploadedAt: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }),
      uploadedBy: IS_REVIEWER,
      recordCount: importCount,
      status: 'processing'
    });
    saveUploads();
    closeIncidentSummaryUploadModal();
    window.alert('Upload received. ' + importCount + ' incident summaries imported from ' + label + '. CPIN links auto-matched where premises and dates align. Review injury and fatality flags first.');
    if (file) file.value = '';
    initIncidentSummariesPage();
  }

  function renderPremisesIncidentSummariesBlock(premisesName, containerId) {
    initIncidentSummaryStore();
    const el = document.getElementById(containerId);
    if (!el) return;
    const items = getAllSummaries().filter(function (s) { return s.premises === premisesName; })
      .sort(function (a, b) { return (b.incidentDate || '').localeCompare(a.incidentDate || ''); });
    if (!items.length) {
      el.hidden = true;
      el.innerHTML = '';
      return;
    }
    el.hidden = false;
    el.innerHTML =
      '<div class="setup-section" style="margin-top:20px;">' +
      '<h3>Incident summaries</h3>' +
      '<div class="help">Fire incidents from the monthly HMPPS feed linked to this prison.</div>' +
      '<table class="data" style="margin-top:12px;"><thead><tr><th>Reference</th><th>Date</th><th>Summary</th><th>Status</th></tr></thead><tbody>' +
      items.slice(0, 6).map(function (s) {
        return '<tr style="cursor:pointer;" onclick="show(\'incident-summary/' + esc(s.id) + '\')">' +
          '<td><strong>' + esc(s.ref) + '</strong></td>' +
          '<td>' + esc(formatIsDate(s.incidentDate)) + '</td>' +
          '<td>' + esc(s.typeOfFire) + '</td>' +
          '<td><span class="pill ' + statusPill(s.status) + '">' + esc(IS_STATUS_LABELS[s.status]) + '</span></td></tr>';
      }).join('') +
      '</tbody></table>' +
      (items.length > 6 ? '<a style="display:inline-block;margin-top:8px;font-size:13px;cursor:pointer;" onclick="show(\'incident-summaries\')">View all incident summaries →</a>' : '') +
      '</div>';
  }

  window.initIncidentSummariesPage = initIncidentSummariesPage;
  window.initIncidentSummaryDetailPage = renderIncidentSummaryDetail;
  window.openIncidentSummaryUploadModal = openIncidentSummaryUploadModal;
  window.closeIncidentSummaryUploadModal = closeIncidentSummaryUploadModal;
  window.submitIncidentSummaryUpload = submitIncidentSummaryUpload;
  window.setActiveIncidentSummaryId = setActiveIncidentSummaryId;
  window.activeIncidentSummaryId = activeIncidentSummaryId;
  window.markIncidentSummaryReviewed = markIncidentSummaryReviewed;
  window.reopenIncidentSummary = reopenIncidentSummary;
  window.linkIncidentSummaryCpin = linkIncidentSummaryCpin;
  window.renderPremisesIncidentSummariesBlock = renderPremisesIncidentSummariesBlock;
  window.setIsActivityBarVisible = setIsActivityBarVisible;
  window.openIsFloatPanel = openIsFloatPanel;
  window.closeIsFloatPanel = closeIsFloatPanel;
  window.setIsLogType = setIsLogType;
  window.setIsActivityFeedFilter = setIsActivityFeedFilter;
  window.submitIsLog = submitIsLog;
  window.getIsDateFilter = getIsDateFilter;
  window.setIsDateFilter = setIsDateFilter;
  window.setIsBatchFilter = setIsBatchFilter;
  window.setIsPremisesSearch = setIsPremisesSearch;
  window.toggleIsPremisesSearch = toggleIsPremisesSearch;
  window.openIsBatchModal = openIsBatchModal;
  window.closeIsBatchModal = closeIsBatchModal;
  window.selectIsBatchDraft = selectIsBatchDraft;
  window.applyIsBatchModal = applyIsBatchModal;
  window.loadMoreIsList = loadMoreIsList;

  initIncidentSummaryStore();
})();
