/* Business Support workflow — advice and dialogue with premises (not audit, CPIN or concern) */
(function () {
  'use strict';

  const BS_OVERRIDE_KEY = 'biz-support-overrides-v1';
  const BS_CURRENT_INSPECTOR = 'Phil Gower';

  const BS_PREMISES = {
    'Temple Quay House': { ref: 'PRM-0001847', meta: 'Temple Back East, Bristol BS1 6BH  ·  Government office  ·  HMCTS', initials: 'TQ', score: 47 },
    'Royal Courts of Justice': { ref: 'PRM-0000921', meta: 'Strand, London WC2A 2LL  ·  Courts  ·  MoJ', initials: 'RC', score: 22 },
    'MoJ HQ London': { ref: 'PRM-0000102', meta: '102 Petty France, London SW1H 9AJ  ·  Government office  ·  MoJ', initials: 'MJ', score: 19 },
    'HMP Bristol': { ref: 'PRM-0002140', meta: 'Cambridge Grove, Bristol BS7  ·  Prison · Cat B', initials: 'HB', score: 44 }
  };

  /** Duty Holders linked to each premises in the BS directory (aligned with CPIN / Safety Concerns). */
  const BS_DH_BY_PREMISES = {
    'Temple Quay House': ['HMCTS', 'Equans', 'Property Directorate', 'The Property Directorate'],
    'MoJ HQ London': ['Ministry of Justice Property', 'Equans'],
    'Royal Courts of Justice': ['Ministry of Justice Property', 'HMCTS', 'Mitie'],
    'HMP Bristol': ['HMPPS - South West', 'Serco FM']
  };

  let bsPremisesByDhCache = null;

  function normalizeBsDhKey(key) {
    if (!key) return null;
    if (key === 'mojprop') return 'moj-prop';
    return key;
  }

  function getBsPremisesByDhMap() {
    if (bsPremisesByDhCache) return bsPremisesByDhCache;
    const map = {};
    const dhKeyByName = typeof SETUP_DH_KEY_BY_NAME !== 'undefined' ? SETUP_DH_KEY_BY_NAME : {};
    Object.keys(BS_DH_BY_PREMISES).forEach(function (premisesName) {
      if (!BS_PREMISES[premisesName]) return;
      (BS_DH_BY_PREMISES[premisesName] || []).forEach(function (dhName) {
        const key = normalizeBsDhKey(dhKeyByName[dhName]);
        if (!key) return;
        if (!map[key]) map[key] = [];
        if (map[key].indexOf(premisesName) < 0) map[key].push(premisesName);
      });
    });
    bsPremisesByDhCache = map;
    return map;
  }

  function dhKeyLinkedToBsPremises(dhKey, premisesName) {
    if (!dhKey || !premisesName) return false;
    const dhNames = BS_DH_BY_PREMISES[premisesName] || [];
    const dhKeyByName = typeof SETUP_DH_KEY_BY_NAME !== 'undefined' ? SETUP_DH_KEY_BY_NAME : {};
    const norm = normalizeBsDhKey(dhKey);
    return dhNames.some(function (name) { return normalizeBsDhKey(dhKeyByName[name]) === norm; });
  }

  function getBsPremisesNamesForDh(dhKey, rec) {
    const normKey = normalizeBsDhKey(dhKey);
    if (!normKey) return [];
    const fromMap = getBsPremisesByDhMap()[normKey] || [];
    let names = fromMap.filter(function (name) { return BS_PREMISES[name]; });
    const anchor = rec && (rec.anchorPremises || null);
    if (anchor) {
      names = dhKeyLinkedToBsPremises(normKey, anchor) ? names.filter(function (name) { return name === anchor; }) : [];
    }
    return names;
  }

  const BS_MODE_LABELS = { in_person: 'In person', call: 'Phone call', video: 'Video call', email: 'Email / correspondence' };

  const BS_BASE = [
    {
      id: 'bs-0044', ref: 'B-2026-0044', premises: 'Royal Courts of Justice',
      premisesList: [{ id: 'prem-rcj', name: 'Royal Courts of Justice', status: 'accepted', linkedDh: 'moj-prop', fromDh: true }],
      workflow: 'open',
      purpose: 'Fire compartmentation advice ahead of refurbishment',
      openedAt: '7 Jun 2026',
      appointment: { date: '2026-06-25', time: '10:00', mode: 'in_person', duration: 'half', confirmed: true, letterSkipped: false, letterSent: true },
      inspectors: [{ id: 'ins-lead', name: 'Phil Gower', role: 'Lead Fire Safety Inspector', initials: 'PG', isLead: true }],
      dutyHolders: [{ id: 'dh-mojp', key: 'mojprop', name: 'Ministry of Justice Property', role: 'Government department  ·  Property', initials: 'MP', fromPremises: true, status: 'accepted' }],
      responsiblePersons: [{ id: 'rp-jh', key: 'jhowell', name: 'James Howell', role: 'Property Officer  ·  MoJ', initials: 'JH', fromPremises: true, status: 'accepted', linkedDh: 'mojprop' }],
      furtherRequired: null, followUp: null, closeReason: null,
      activityLog: {
        notes: [{ id: 'bn1', text: 'Business support opened — meeting scheduled 25 Jun.', at: '7 Jun 2026', ts: 1717718400000 }],
        times: [], files: []
      }
    },
    {
      id: 'bs-0039', ref: 'B-2026-0039', premises: 'MoJ HQ London',
      premisesList: [{ id: 'prem-moj', name: 'MoJ HQ London', status: 'accepted', linkedDh: 'moj-prop', fromDh: true }],
      workflow: 'open',
      purpose: 'Workshop prep — fire safety initiative for regional leads',
      openedAt: '30 May 2026',
      appointment: { date: '2026-07-12', time: '14:00', mode: 'in_person', duration: 'full', confirmed: true, letterSkipped: true, letterSent: false },
      inspectors: [
        { id: 'ins-lead', name: 'Phil Gower', role: 'Lead Fire Safety Inspector', initials: 'PG', isLead: true },
        { id: 'ins-sc', name: 'Sarah Chen', role: 'Fire Safety Inspector', initials: 'SC', isLead: false }
      ],
      dutyHolders: [{ id: 'dh-moj', key: 'mojprop', name: 'Ministry of Justice Property', role: 'Government department', initials: 'MP', fromPremises: true, status: 'accepted' }],
      responsiblePersons: [],
      furtherRequired: null, followUp: null, closeReason: null,
      conductNotes: 'Slides drafted for workshop. Awaiting DH attendee list.',
      activityLog: {
        notes: [{ id: 'bn2', text: 'Prep call with DH — 12 Jul workshop confirmed.', at: '1 Jun 2026', ts: 1717200000000 }],
        times: [{ id: 'bt1', activity: 'Phone call', minutes: 45, at: '1 Jun 2026', ts: 1717203600000 }],
        files: []
      }
    },
    {
      id: 'bs-tq-closed', ref: 'BS-2026-0088', premises: 'Temple Quay House',
      premisesList: [{ id: 'prem-tq', name: 'Temple Quay House', status: 'accepted', linkedDh: 'equans', fromDh: true }],
      workflow: 'closed',
      purpose: 'Fire door training discussion',
      openedAt: '2 May 2026', closedAt: '2 May 2026',
      appointment: { date: '2026-05-02', time: '11:00', mode: 'call', duration: 'half', confirmed: true, letterSkipped: true, letterSent: false },
      inspectors: [{ id: 'ins-lead', name: 'Phil Gower', role: 'Lead Fire Safety Inspector', initials: 'PG', isLead: true }],
      dutyHolders: [{ id: 'dh-eq', name: 'Equans', role: 'FM company', initials: 'EQ', fromPremises: true, status: 'accepted' }],
      responsiblePersons: [],
      furtherRequired: 'no', closeReason: 'Advice given on fire door maintenance regime — no further action.',
      activityLog: { notes: [{ id: 'bn0', text: 'Call with Equans FM — training materials shared.', at: '2 May 2026', ts: 1714640400000 }], times: [{ id: 'bt0', activity: 'Phone call', minutes: 30, at: '2 May 2026', ts: 1714644000000 }], files: [] }
    }
  ];

  let bsOverrides = {};
  let activeBizSupportId = null;
  let bsLogType = 'time';
  let bsActivityLog = { notes: [], times: [], files: [] };

  function loadBsOverrides() {
    try {
      const raw = localStorage.getItem(BS_OVERRIDE_KEY);
      if (raw) bsOverrides = JSON.parse(raw);
    } catch (e) { bsOverrides = {}; }
  }

  function saveBsOverrides() {
    localStorage.setItem(BS_OVERRIDE_KEY, JSON.stringify(bsOverrides));
  }

  function getAllBsRecords() {
    const seen = new Set();
    const out = [];
    BS_BASE.forEach(function (r) {
      if (seen.has(r.id)) return;
      seen.add(r.id);
      out.push(mergeBsRecord(r));
    });
    Object.keys(bsOverrides).forEach(function (id) {
      if (seen.has(id)) return;
      if (bsOverrides[id]._deleted) return;
      seen.add(id);
      out.push(bsOverrides[id]);
    });
    return out;
  }

  function mergeBsRecord(base) {
    return Object.assign({}, base, bsOverrides[base.id] || {});
  }

  function getBizSupportById(id) {
    const base = BS_BASE.find(function (r) { return r.id === id; });
    if (base) return mergeBsRecord(base);
    return bsOverrides[id] && !bsOverrides[id]._deleted ? Object.assign({}, bsOverrides[id]) : null;
  }

  function persistBsPatch(id, patch) {
    const existing = getBizSupportById(id) || bsOverrides[id] || {};
    bsOverrides[id] = Object.assign({}, existing, patch, { id: id });
    saveBsOverrides();
  }

  function bsIsOpen(rec) {
    return rec && rec.workflow !== 'closed';
  }

  function bsHasAcceptedDutyHolders(rec) {
    return (rec.dutyHolders || []).some(function (d) { return d.status === 'accepted'; });
  }

  function getBsPremisesList(rec) {
    if (!rec) return [];
    if (Array.isArray(rec.premisesList)) return rec.premisesList;
    if (rec.premises) {
      return [{ id: 'prem-legacy', name: rec.premises, status: 'accepted', fromDh: false }];
    }
    return [];
  }

  function bsPrimaryPremises(rec) {
    const accepted = getBsPremisesList(rec).filter(function (p) { return p.status === 'accepted'; });
    if (accepted.length) return accepted[0].name;
    const any = getBsPremisesList(rec)[0];
    return any ? any.name : (rec.anchorPremises || rec.premises || null);
  }

  function bsHasAcceptedPremises(rec) {
    return getBsPremisesList(rec).some(function (p) { return p.status === 'accepted'; });
  }

  function bsMeetingComplete(rec) {
    if (!rec) return false;
    const apt = rec.appointment || {};
    const purpose = (document.getElementById('bs-purpose')?.value || rec.purpose || '').trim();
    const date = document.getElementById('bs-apt-date')?.value || apt.date || '';
    const time = document.getElementById('bs-apt-time')?.value || apt.time || '';
    const confirmed = document.getElementById('bs-apt-confirmed')?.checked ?? !!apt.confirmed;
    return !!(purpose && date && time && confirmed);
  }

  function bsSetupComplete(rec) {
    return bsMeetingComplete(rec) && bsHasAcceptedDutyHolders(rec) && bsHasAcceptedPremises(rec);
  }

  function getBsSetupValidationErrors(rec) {
    if (!rec) return [];
    const errors = [];
    const purpose = (document.getElementById('bs-purpose')?.value || rec.purpose || '').trim();
    const apt = rec.appointment || {};
    const date = document.getElementById('bs-apt-date')?.value || apt.date || '';
    const time = document.getElementById('bs-apt-time')?.value || apt.time || '';
    const confirmed = document.getElementById('bs-apt-confirmed')?.checked ?? !!apt.confirmed;

    if (!purpose) {
      errors.push({
        fieldId: 'bs-purpose',
        wrapperId: 'bs-purpose-wrap',
        errorId: 'bs-purpose-error',
        anchor: '#bs-purpose',
        message: 'Enter the purpose of support',
        summaryLink: 'Enter the purpose of support'
      });
    }
    if (!bsHasAcceptedDutyHolders(rec)) {
      errors.push({
        wrapperId: 'bs-dh-section',
        errorId: 'bs-dh-error',
        anchor: '#bs-dh-section',
        sectionError: true,
        message: 'Approve at least one Duty Holder',
        summaryLink: 'Approve at least one Duty Holder'
      });
    }
    if (!bsHasAcceptedPremises(rec)) {
      errors.push({
        wrapperId: 'bs-premises-list',
        errorId: 'bs-premises-error',
        anchor: '#bs-premises-list',
        sectionError: true,
        message: 'Approve at least one premises',
        summaryLink: 'Approve at least one premises'
      });
    }
    if (!date) {
      errors.push({
        fieldId: 'bs-apt-date',
        wrapperId: 'bs-apt-date-wrap',
        errorId: 'bs-apt-date-error',
        anchor: '#bs-apt-date',
        message: 'Enter an appointment date',
        summaryLink: 'Enter an appointment date'
      });
    }
    if (!time) {
      errors.push({
        fieldId: 'bs-apt-time',
        wrapperId: 'bs-apt-time-wrap',
        errorId: 'bs-apt-time-error',
        anchor: '#bs-apt-time',
        message: 'Enter an appointment time',
        summaryLink: 'Enter an appointment time'
      });
    }
    if (!confirmed) {
      errors.push({
        fieldId: 'bs-apt-confirmed',
        wrapperId: 'bs-apt-confirmed-wrap',
        errorId: 'bs-apt-confirmed-error',
        anchor: '#bs-apt-confirmed',
        message: 'Confirm the appointment is agreed',
        summaryLink: 'Confirm the appointment is agreed'
      });
    }
    return errors;
  }

  function getBsCloseValidationErrors(rec) {
    if (!rec) return [];
    const errors = [];

    if (!rec.furtherRequired) {
      errors.push({
        wrapperId: 'bs-further-required-section',
        errorId: 'bs-further-required-error',
        anchor: '#bs-further-required-section',
        sectionError: true,
        message: 'Select whether anything further is required',
        summaryLink: 'Select whether anything further is required'
      });
    }

    if (rec.furtherRequired === 'yes' && !rec.followOnProcess) {
      errors.push({
        wrapperId: 'bs-close-follow-on',
        errorId: 'bs-follow-on-error',
        anchor: '#bs-close-follow-on',
        sectionError: true,
        message: 'Select the follow-on process required',
        summaryLink: 'Select the follow-on process required'
      });
    }

    const reason = (document.getElementById('bs-close-reason')?.value || '').trim();
    if (!reason) {
      errors.push({
        fieldId: 'bs-close-reason',
        wrapperId: 'bs-close-reason-wrap',
        errorId: 'bs-close-reason-error',
        anchor: '#bs-close-reason',
        message: 'Enter a reason for closing',
        summaryLink: 'Enter a reason for closing'
      });
    }
    return errors;
  }

  function bsCanClose(rec) {
    if (!rec || rec.workflow === 'closed') return false;
    if (!bsSetupComplete(rec)) return false;
    return !!rec.furtherRequired;
  }

  function defaultBsRecord(id, premisesName) {
    const prem = premisesName ? (BS_PREMISES[premisesName] || { ref: '', meta: '', initials: 'PR', score: null }) : null;
    const nextRef = 'B-2026-' + String(450 + Object.keys(bsOverrides).length).padStart(4, '0');
    return {
      id: id,
      ref: nextRef,
      anchorPremises: premisesName || null,
      premises: null,
      premisesList: [],
      workflow: 'open',
      purpose: '',
      openedAt: 'Today',
      appointment: { date: '', time: '', mode: 'in_person', duration: 'half', confirmed: false, letterSkipped: false, letterSent: false },
      inspectors: [{ id: 'ins-lead', name: BS_CURRENT_INSPECTOR, role: 'Lead Fire Safety Inspector', initials: 'PG', isLead: true }],
      dutyHolders: [],
      responsiblePersons: [],
      furtherRequired: null,
      followUp: null,
      followOnProcess: null,
      closeReason: null,
      activityLog: { notes: [{ id: 'bn-new', text: 'Business support process created.', at: 'Today', ts: Date.now() }], times: [], files: [] },
      _premMeta: prem
    };
  }

  function getBsDhKey(dh) {
    if (!dh) return null;
    const key = dh.key || (typeof SETUP_DH_KEY_BY_NAME !== 'undefined' ? SETUP_DH_KEY_BY_NAME[dh.name] : null) || null;
    return normalizeBsDhKey(key);
  }

  function getBsAcceptedDhKeys(rec) {
    return (rec.dutyHolders || []).filter(function (d) { return d.status === 'accepted'; }).map(getBsDhKey).filter(Boolean);
  }

  function getBsDhKeysOnList(rec) {
    return (rec.dutyHolders || []).filter(function (d) { return d.status !== 'rejected'; }).map(getBsDhKey).filter(Boolean);
  }

  function getBsResponsiblePersonsForDutyHolders(rec, opts) {
    opts = opts || {};
    const dhKeys = opts.acceptedOnly ? getBsAcceptedDhKeys(rec) : getBsDhKeysOnList(rec);
    if (!dhKeys.length) return [];
    return (rec.responsiblePersons || []).filter(function (rp) {
      if (rp.status === 'rejected') return false;
      if (opts.acceptedOnly && rp.status !== 'accepted') return false;
      if (!rp.linkedDh) return false;
      return dhKeys.indexOf(rp.linkedDh) >= 0;
    });
  }

  function getBsLetterRecipients(rec) {
    return getBsResponsiblePersonsForDutyHolders(rec, { acceptedOnly: true });
  }

  function getBsSavedLetters(rec) {
    const apt = rec.appointment || {};
    if (apt.letters && apt.letters.length) return apt.letters.slice();
    return [];
  }

  function suggestBsRpsForDh(dhKey) {
    const rec = getBizSupportById(activeBizSupportId);
    if (!rec || !dhKey || typeof SETUP_DH_TO_RP_KEYS === 'undefined') return false;
    const keys = SETUP_DH_TO_RP_KEYS[dhKey] || [];
    const catalog = typeof SETUP_LOOKUP_CATALOG !== 'undefined' ? SETUP_LOOKUP_CATALOG.responsiblePerson : [];
    const rps = (rec.responsiblePersons || []).slice();
    let changed = false;
    keys.forEach(function (rk) {
      const entry = catalog.find(function (e) { return e.key === rk; });
      if (!entry) return;
      const exists = rps.some(function (r) {
        return (r.key === rk || r.name.toLowerCase() === entry.name.toLowerCase()) && r.linkedDh === dhKey;
      });
      if (exists) return;
      rps.push({
        id: 'rp-' + dhKey + '-' + rk,
        key: rk,
        ref: entry.ref,
        name: entry.name,
        role: entry.role,
        initials: entry.initials,
        fromPremises: true,
        status: 'suggested',
        linkedDh: dhKey
      });
      changed = true;
    });
    if (changed) persistBsPatch(rec.id, { responsiblePersons: rps });
    return changed;
  }

  function ensureBsRpSuggestions(rec) {
    if (!rec) return false;
    const holders = (rec.dutyHolders || []).filter(function (d) { return d.status === 'accepted'; });
    if (!holders.length) return false;
    let changed = false;
    holders.forEach(function (dh) {
      const dhKey = getBsDhKey(dh);
      if (dhKey && suggestBsRpsForDh(dhKey)) changed = true;
    });
    return changed;
  }

  function pruneBsResponsiblePersons(rec) {
    if (!rec) return false;
    const dhKeys = getBsDhKeysOnList(rec);
    const rps = (rec.responsiblePersons || []).filter(function (rp) {
      if (!rp.linkedDh) return true;
      return dhKeys.indexOf(rp.linkedDh) >= 0;
    });
    if (rps.length !== (rec.responsiblePersons || []).length) {
      persistBsPatch(rec.id, { responsiblePersons: rps });
      return true;
    }
    return false;
  }

  function suggestBsPremisesForDh(dhKey) {
    const rec = getBizSupportById(activeBizSupportId);
    if (!rec || !dhKey) return false;
    const normKey = normalizeBsDhKey(dhKey);
    const names = getBsPremisesNamesForDh(normKey, rec);
    const list = getBsPremisesList(rec).slice();
    const onList = new Set(list.map(function (p) { return p.name; }));
    let changed = false;
    names.forEach(function (name) {
      if (onList.has(name)) return;
      list.push({
        id: 'prem-' + normKey + '-' + name.replace(/\W+/g, '-').toLowerCase(),
        name: name,
        status: 'suggested',
        linkedDh: normKey,
        fromDh: true
      });
      onList.add(name);
      changed = true;
    });
    if (changed) {
      persistBsPatch(rec.id, { premisesList: list, premises: bsPrimaryPremises(Object.assign({}, rec, { premisesList: list })) });
    }
    return changed;
  }

  function ensureBsPremisesSuggestions(rec) {
    if (!rec) return false;
    const holders = (rec.dutyHolders || []).filter(function (d) { return d.status === 'accepted'; });
    if (!holders.length) return false;
    let changed = false;
    holders.forEach(function (dh) {
      const dhKey = getBsDhKey(dh);
      if (dhKey && suggestBsPremisesForDh(dhKey)) changed = true;
    });
    return changed;
  }

  function pruneBsPremises(rec) {
    if (!rec) return;
    const dhKeys = getBsAcceptedDhKeys(rec);
    const list = getBsPremisesList(rec).filter(function (p) {
      if (!p.linkedDh || !p.fromDh) return true;
      const linked = normalizeBsDhKey(p.linkedDh);
      if (!dhKeys.some(function (k) { return normalizeBsDhKey(k) === linked; })) return false;
      if (!BS_PREMISES[p.name]) return false;
      if (p.status === 'suggested' && p.fromDh) {
        return getBsPremisesNamesForDh(linked, rec).indexOf(p.name) >= 0;
      }
      return true;
    });
    if (list.length !== getBsPremisesList(rec).length) {
      persistBsPatch(rec.id, { premisesList: list, premises: bsPrimaryPremises(Object.assign({}, rec, { premisesList: list })) });
    }
  }

  function appendBsLettersToActivity(letters, stamp) {
    letters.forEach(function (ltr, i) {
      const entryTs = stamp.ts - i;
      bsActivityLog.files.unshift({
        id: 'f-' + ltr.id,
        name: ltr.fileName,
        description: ltr.templateLabel + ' · ' + ltr.recipientName,
        at: ltr.at,
        ts: entryTs
      });
    });
    if (letters.length) {
      const names = letters.map(function (ltr) { return ltr.recipientName; });
      bsActivityLog.notes.unshift({
        id: 'n-ltr-' + stamp.ts,
        text: letters.length === 1
          ? 'Appointment letter saved for ' + names[0] + '.'
          : letters.length + ' appointment letters saved for ' + names.join(', ') + '.',
        at: stamp.at,
        ts: stamp.ts
      });
    }
    persistBsPatch(activeBizSupportId, { activityLog: bsActivityLog });
  }

  function renderBsPremisesList(rec) {
    const listEl = document.getElementById('bs-premises-list');
    if (!listEl) return;
    ensureBsPremisesSuggestions(rec);
    pruneBsPremises(rec);
    rec = getBizSupportById(rec.id) || rec;
    const premises = getBsPremisesList(rec);
    if (!premises.length) {
      listEl.innerHTML = '<p style="color:var(--ink-3);font-size:13px;">Suggested premises appear when Duty Holders are approved. Use + Add to search the directory.</p>';
      return;
    }
    listEl.innerHTML = premises.map(function (p) {
      const meta = BS_PREMISES[p.name] || {};
      const pill = p.status === 'suggested' ? '<span class="pill amber">Suggested</span>' : '<span class="pill blue">Approved</span>';
      const actions = p.status === 'suggested'
        ? '<div class="holder-actions"><button class="btn primary" type="button" onclick="acceptBsPremises(\'' + p.id + '\')">Approve</button><button class="btn" type="button" onclick="removeBsPremises(\'' + p.id + '\')">Reject</button></div>'
        : '<div class="holder-actions"><span class="remove" onclick="removeBsPremises(\'' + p.id + '\')">×</span></div>';
      const scoreHtml = meta.score != null ? '  ·  RBIP ' + meta.score : '';
      return '<div class="holder-card' + (p.status === 'suggested' ? ' is-suggested' : '') + '">' +
        '<div class="avatar-sm" style="background:var(--accent);color:white;">' + escHtml(meta.initials || 'PR') + '</div>' +
        '<div><div class="name">' + escHtml(p.name) + '</div>' +
        '<div class="role">' + escHtml(meta.meta || 'Premises') + (meta.ref ? '  ·  <span class="prem-ref">' + escHtml(meta.ref) + '</span>' : '') + scoreHtml + '</div></div>' +
        pill + actions + '</div>';
    }).join('');
  }

  function renderBsTeam(rec) {
    const extra = document.getElementById('bs-team-extra');
    if (!extra) return;
    const others = (rec.inspectors || []).filter(function (i) { return !i.isLead; });
    extra.innerHTML = others.map(function (ins) {
      return '<div class="holder-card"><div class="avatar-sm">' + escHtml(ins.initials) + '</div>' +
        '<div><div class="name">' + escHtml(ins.name) + '</div><div class="role">' + escHtml(ins.role) + '</div></div>' +
        '<span class="remove" onclick="removeBsInspector(\'' + ins.id + '\')">×</span></div>';
    }).join('');
    const sum = document.getElementById('bs-sum-inspectors');
    if (sum) sum.textContent = others.length ? others.map(function (i) { return i.name; }).join(', ') : 'none';
  }

  function renderBsDutyHolders(rec) {
    const list = document.getElementById('bs-dh-list');
    if (!list) return;
    const holders = (rec.dutyHolders || []).filter(function (d) { return d.status !== 'rejected'; });
    if (!holders.length) {
      list.innerHTML = '<p style="color:var(--ink-3);font-size:13px;">Add Duty Holders for this business support.</p>';
      return;
    }
    list.innerHTML = holders.map(function (dh) {
      const pill = dh.status === 'suggested' ? '<span class="pill amber">Suggested</span>' : '<span class="pill blue">Approved</span>';
      const actions = dh.status === 'suggested'
        ? '<div class="holder-actions"><button class="btn primary" type="button" onclick="acceptBsDutyHolder(\'' + dh.id + '\')">Approve</button><button class="btn" type="button" onclick="removeBsDutyHolder(\'' + dh.id + '\')">Reject</button></div>'
        : '<div class="holder-actions"><span class="remove" onclick="removeBsDutyHolder(\'' + dh.id + '\')">×</span></div>';
      return '<div class="holder-card' + (dh.status === 'suggested' ? ' is-suggested' : '') + '">' +
        '<div class="avatar-sm">' + escHtml(dh.initials || 'DH') + '</div>' +
        '<div><div class="name">' + escHtml(dh.name) + '</div><div class="role">' + escHtml(dh.role || '') + '</div></div>' +
        pill + actions + '</div>';
    }).join('');
    const sum = document.getElementById('bs-sum-dh');
    if (sum) sum.textContent = String(holders.filter(function (d) { return d.status === 'accepted'; }).length);
  }

  function renderBsResponsiblePersons(rec) {
    const list = document.getElementById('bs-rp-list');
    if (!list) return;
    ensureBsRpSuggestions(rec);
    pruneBsResponsiblePersons(rec);
    rec = getBizSupportById(rec.id) || rec;
    const rps = getBsResponsiblePersonsForDutyHolders(rec);
    if (!rps.length) {
      list.innerHTML = '<p style="color:var(--ink-3);font-size:13px;">Suggested contacts appear here for each Duty Holder above. Use + Add to search the directory.</p>';
      return;
    }
    list.innerHTML = rps.map(function (rp) {
      const dhLabel = rp.linkedDh && typeof getDutyHolderLabelForKey === 'function'
        ? getDutyHolderLabelForKey(rp.linkedDh)
        : '';
      const roleLine = escHtml(rp.role || '') + (dhLabel ? '  ·  Contact for ' + escHtml(dhLabel) : '');
      const pill = rp.status === 'suggested' ? '<span class="pill amber">Suggested</span>' : '<span class="pill grey">Approved</span>';
      const actions = rp.status === 'suggested'
        ? '<div class="holder-actions"><button class="btn primary" type="button" onclick="acceptBsResponsiblePerson(\'' + rp.id + '\')">Approve</button><button class="btn" type="button" onclick="removeBsResponsiblePerson(\'' + rp.id + '\')">Reject</button></div>'
        : '<div class="holder-actions"><span class="remove" onclick="removeBsResponsiblePerson(\'' + rp.id + '\')">×</span></div>';
      return '<div class="holder-card' + (rp.status === 'suggested' ? ' is-suggested' : '') + '">' +
        '<div class="avatar-sm">' + escHtml(rp.initials || 'RP') + '</div>' +
        '<div><div class="name">' + escHtml(rp.name) + '</div><div class="role">' + roleLine + '</div></div>' +
        pill + actions + '</div>';
    }).join('');
    const sum = document.getElementById('bs-sum-rp');
    if (sum) sum.textContent = String(rps.filter(function (r) { return r.status === 'accepted'; }).length);
  }

  function renderBsAppointmentLetters(rec) {
    const list = document.getElementById('bs-appointment-letters-list');
    const status = document.getElementById('bs-letter-status');
    if (!list) return;
    const letters = getBsSavedLetters(rec);
    const apt = rec.appointment || {};

    if (!letters.length) {
      list.innerHTML = '<div class="letter-attachment-empty">No letters saved yet. Use Write letter to create templated letters for Responsible Persons on this business support.</div>';
    } else {
      list.innerHTML = letters.map(function (ltr) {
        const meta = (ltr.templateLabel || 'Letter') + ' · ' + (ltr.recipientName || 'Recipient') + (ltr.at ? ' · ' + ltr.at : '');
        return '<div class="letter-attachment-item">' +
          '<div class="letter-attachment-icon is-word">DOC</div>' +
          '<div class="letter-attachment-info"><strong>' + escHtml((ltr.fileName || 'Letter.docx').replace(/\.pdf$/i, '.docx')) + '</strong>' +
          '<span>' + escHtml(meta) + '</span></div>' +
          '<button class="btn" type="button" onclick="viewBsLetter(\'' + escHtml(ltr.id) + '\')">View</button>' +
          '</div>';
      }).join('');
    }

    if (status) {
      if (apt.letterSkipped) status.textContent = 'Skipped — informal call or email';
      else if (letters.length) status.textContent = '✓ ' + letters.length + (letters.length === 1 ? ' letter saved' : ' letters saved');
      else status.textContent = '';
    }
  }

  function renderBsAppointmentFields(rec) {
    const apt = rec.appointment || {};
    const date = document.getElementById('bs-apt-date');
    const time = document.getElementById('bs-apt-time');
    const mode = document.getElementById('bs-apt-mode');
    const dur = document.getElementById('bs-apt-duration');
    const purpose = document.getElementById('bs-purpose');
    const confirmed = document.getElementById('bs-apt-confirmed');
    if (date) date.value = apt.date || '';
    if (time) time.value = apt.time || '';
    if (mode) mode.value = apt.mode || 'in_person';
    if (dur) dur.value = apt.duration || 'half';
    if (purpose) purpose.value = rec.purpose || '';
    if (confirmed) confirmed.checked = !!apt.confirmed;
    const sumAppt = document.getElementById('bs-sum-appt');
    if (sumAppt) {
      if (apt.date && apt.time) {
        const d = new Date(apt.date + 'T' + apt.time);
        sumAppt.textContent = d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }) + ', ' + apt.time + '  ·  ' + (BS_MODE_LABELS[apt.mode] || apt.mode);
      } else {
        sumAppt.textContent = 'Not set';
      }
    }
    renderBsAppointmentLetters(rec);
  }

  function renderBsWorkflowSections(rec) {
    const isClosed = rec.workflow === 'closed';
    const showPremises = bsHasAcceptedDutyHolders(rec);
    const showMeeting = bsHasAcceptedPremises(rec);
    const showLetter = bsMeetingComplete(rec);
    const showConduct = bsSetupComplete(rec);

    const team = document.getElementById('bs-section-team');
    const dh = document.getElementById('bs-section-dh');
    const premises = document.getElementById('bs-section-premises');
    const meeting = document.getElementById('bs-section-meeting');
    const letter = document.getElementById('bs-section-letter');
    const conduct = document.getElementById('bs-section-conduct');
    const closeSec = document.getElementById('bs-section-close');
    const errSummary = document.getElementById('bs-setup-error-summary');

    if (team) team.hidden = isClosed;
    if (dh) dh.hidden = isClosed;
    if (premises) premises.hidden = isClosed || !showPremises;
    if (meeting) meeting.hidden = isClosed || !showMeeting;
    if (letter) letter.hidden = isClosed || !showLetter;
    if (conduct) conduct.hidden = isClosed || !showConduct;
    if (closeSec) closeSec.hidden = isClosed ? false : (!showConduct || !rec.furtherRequired);
    if (errSummary && (!errSummary.innerHTML.trim() || isClosed)) errSummary.hidden = true;

    if (showPremises) renderBsPremisesList(getBizSupportById(rec.id) || rec);
    renderBsCloseSection(rec);
  }

  function renderBsCloseSection(rec) {
    const open = document.getElementById('bs-close-open');
    const done = document.getElementById('bs-close-done');
    const followOn = document.getElementById('bs-close-follow-on');
    const spawned = document.getElementById('bs-close-spawned-links');
    if (rec.workflow === 'closed') {
      if (open) open.hidden = true;
      if (done) {
        done.hidden = false;
        const txt = document.getElementById('bs-close-done-text');
        if (txt) txt.textContent = rec.closeReason || 'Closed.';
      }
      if (spawned && rec.spawnedAuditId) {
        spawned.hidden = false;
        spawned.innerHTML = '<a class="btn primary" href="#" onclick="openAuditSetup(\'' + escHtml(rec.spawnedAuditId) + '\'); return false;">Open audit ' + escHtml(rec.spawnedAuditId) + '</a>';
      } else if (spawned) spawned.hidden = true;
    } else {
      if (open) open.hidden = false;
      if (done) done.hidden = true;
      if (spawned) spawned.hidden = true;
      if (followOn) followOn.hidden = rec.furtherRequired !== 'yes';
    }
  }

  function initBsActivity(rec) {
    if (rec && rec.activityLog) bsActivityLog = JSON.parse(JSON.stringify(rec.activityLog));
    else bsActivityLog = { notes: [], times: [], files: [] };
    renderBsActivity();
  }

  function renderBsActivity() {
    const feed = document.getElementById('bs-activity-feed-list');
    const notesEl = document.getElementById('bs-count-notes');
    const timeEl = document.getElementById('bs-count-time');
    const noteCount = bsActivityLog.notes.length;
    const totalMin = bsActivityLog.times.reduce(function (s, t) { return s + t.minutes; }, 0);
    const notesLabel = noteCount + (noteCount === 1 ? ' note' : ' notes');
    const timeLabel = (typeof formatAuditMinutes === 'function' ? formatAuditMinutes(totalMin) : totalMin + 'm') + ' logged';
    if (notesEl) notesEl.textContent = notesLabel;
    if (timeEl) timeEl.textContent = timeLabel;
    document.querySelectorAll('#bs-recent-on-support .audit-recent-count-notes, #bs-recent-count-notes').forEach(function (el) { el.textContent = notesLabel; });
    document.querySelectorAll('#bs-recent-on-support .audit-recent-count-time, #bs-recent-count-time').forEach(function (el) { el.textContent = timeLabel; });
    if (!feed) return;
    const items = [];
    bsActivityLog.times.forEach(function (t) { items.push({ ts: t.ts || 0, at: t.at, type: 'time', activity: t.activity, minutes: t.minutes }); });
    bsActivityLog.notes.forEach(function (n) { items.push({ ts: n.ts || 0, at: n.at, type: 'note', text: n.text }); });
    bsActivityLog.files.forEach(function (f) { items.push({ ts: f.ts || 0, at: f.at, type: 'file', name: f.name }); });
    items.sort(function (a, b) { return b.ts - a.ts; });
    if (!items.length) {
      feed.innerHTML = '<div class="audit-feed-empty">No activity logged yet on this business support.</div>';
      return;
    }
    feed.innerHTML = items.map(function (item) {
      let pillClass = 'grey', pillLabel = 'Note', textHtml = escHtml(item.text || '');
      if (item.type === 'time') { pillClass = 'blue'; pillLabel = 'Time'; textHtml = escHtml(item.activity) + ' · <strong>' + escHtml(String(item.minutes)) + 'm</strong>'; }
      else if (item.type === 'file') { pillClass = 'purple'; pillLabel = 'File'; textHtml = '<strong>' + escHtml(item.name) + '</strong>'; }
      return '<div class="audit-feed-item"><div class="audit-feed-meta"><span class="audit-feed-when">' + escHtml(item.at) + '</span></div>' +
        '<div class="audit-feed-body"><span class="pill ' + pillClass + '">' + pillLabel + '</span><span class="audit-feed-text">' + textHtml + '</span></div></div>';
    }).join('');
  }

  function initBizSupportPage() {
    loadBsOverrides();
    const rec = getBizSupportById(activeBizSupportId);
    if (!rec) { show('processes'); return; }

    const primaryPrem = bsPrimaryPremises(rec);
    const crumbsPrem = document.getElementById('bs-crumbs-premises');
    if (crumbsPrem) {
      crumbsPrem.textContent = primaryPrem || 'Premises';
      crumbsPrem.onclick = function () {
        if (primaryPrem === 'HMP Bristol') show('premisesdetail-bristol');
        else if (primaryPrem === 'Temple Quay House') show('premisesdetail');
        else show('premises');
        return false;
      };
    }

    const title = document.getElementById('bs-detail-title');
    const meta = document.getElementById('bs-detail-meta');
    if (title) title.textContent = 'Business support  ·  ' + rec.ref;
    if (meta) {
      const statusPill = rec.workflow === 'closed'
        ? '<span class="pill grey">Closed</span>'
        : '<span class="pill blue">Open</span>';
      meta.innerHTML = '<span class="pill grey">Support</span>  ·  ' + statusPill + '  ·  ' + escHtml(rec.openedAt || 'Today');
    }

    const acceptedPrem = getBsPremisesList(rec).filter(function (p) { return p.status === 'accepted'; }).map(function (p) { return p.name; });
    const sumPrem = document.getElementById('bs-sum-premises');
    if (sumPrem) sumPrem.textContent = acceptedPrem.length ? acceptedPrem.join(', ') : '—';

    renderBsTeam(rec);
    renderBsDutyHolders(getBizSupportById(rec.id) || rec);
    renderBsResponsiblePersons(getBizSupportById(rec.id) || rec);
    renderBsPremisesList(getBizSupportById(rec.id) || rec);
    renderBsAppointmentFields(getBizSupportById(rec.id) || rec);

    const conductNotes = document.getElementById('bs-conduct-notes');
    if (conductNotes) conductNotes.value = rec.conductNotes || '';

    const closeReason = document.getElementById('bs-close-reason');
    if (closeReason) closeReason.value = rec.closeReason || '';

    document.querySelectorAll('input[name="bs-further-required"]').forEach(function (inp) {
      inp.checked = rec.furtherRequired === inp.value;
    });
    document.querySelectorAll('input[name="bs-follow-on-process"]').forEach(function (inp) {
      inp.checked = rec.followOnProcess === inp.value;
    });

    const fuPurpose = document.getElementById('bs-followup-purpose');
    if (fuPurpose) fuPurpose.value = (rec.followUp || {}).purpose || '';

    renderBsWorkflowSections(getBizSupportById(rec.id) || rec);
    initBsActivity(getBizSupportById(rec.id) || rec);
    setBsActivityBarVisible(rec.workflow !== 'closed');
  }

  function refreshBsPage() { initBizSupportPage(); }

  function saveBsAppointment() {
    const rec = getBizSupportById(activeBizSupportId);
    if (!rec) return;
    persistBsPatch(activeBizSupportId, {
      purpose: document.getElementById('bs-purpose')?.value || '',
      appointment: Object.assign({}, rec.appointment || {}, {
        date: document.getElementById('bs-apt-date')?.value || '',
        time: document.getElementById('bs-apt-time')?.value || '',
        mode: document.getElementById('bs-apt-mode')?.value || 'in_person',
        duration: document.getElementById('bs-apt-duration')?.value || 'half',
        confirmed: !!document.getElementById('bs-apt-confirmed')?.checked
      })
    });
    refreshBsPage();
  }

  function skipBsLetter() {
    const rec = getBizSupportById(activeBizSupportId);
    if (!rec) return;
    persistBsPatch(activeBizSupportId, { appointment: Object.assign({}, rec.appointment || {}, { letterSkipped: true, letterSent: false }) });
    refreshBsPage();
  }

  function saveBsConductNotes() {
    persistBsPatch(activeBizSupportId, { conductNotes: document.getElementById('bs-conduct-notes')?.value || '' });
  }

  function saveBsFurtherRequired() {
    const picked = document.querySelector('input[name="bs-further-required"]:checked');
    const rec = getBizSupportById(activeBizSupportId);
    if (!picked || !rec) return;
    persistBsPatch(activeBizSupportId, {
      furtherRequired: picked.value,
      followOnProcess: picked.value === 'yes' ? rec.followOnProcess : null
    });
    refreshBsPage();
  }

  function addBsPremisesFromLookup(name) {
    const rec = getBizSupportById(activeBizSupportId);
    if (!rec || !name) return;
    const list = getBsPremisesList(rec).slice();
    if (list.some(function (p) { return p.name === name; })) return;
    list.push({ id: 'prem-' + Date.now(), name: name, status: 'suggested', fromDh: false });
    persistBsPatch(activeBizSupportId, {
      premisesList: list,
      premises: bsPrimaryPremises(Object.assign({}, rec, { premisesList: list }))
    });
    refreshBsPage();
  }

  function saveBsFollowUp() {
    persistBsPatch(activeBizSupportId, {
      followUp: { purpose: document.getElementById('bs-followup-purpose')?.value || '' }
    });
  }

  function saveBsFollowOnProcess() {
    const picked = document.querySelector('input[name="bs-follow-on-process"]:checked');
    if (!picked) return;
    saveBsFollowUp();
    persistBsPatch(activeBizSupportId, { followOnProcess: picked.value });
    refreshBsPage();
  }

  function saveBsProgress() {
    saveBsAppointment();
    saveBsConductNotes();
    saveBsFollowUp();
    const reason = document.getElementById('bs-close-reason')?.value?.trim();
    const picked = document.querySelector('input[name="bs-follow-on-process"]:checked');
    const patch = { activityLog: bsActivityLog };
    if (reason) patch.closeReason = reason;
    if (picked) patch.followOnProcess = picked.value;
    persistBsPatch(activeBizSupportId, patch);
    const btn = document.getElementById('bs-save-progress-btn');
    if (btn) {
      const orig = btn.textContent;
      btn.textContent = 'Saved';
      setTimeout(function () { btn.textContent = orig; }, 1500);
    }
  }

  function closeBsProcess() {
    saveBsFollowUp();
    const rec = getBizSupportById(activeBizSupportId);
    if (!rec) return;
    const summary = document.getElementById('bs-close-error-summary');
    const errors = getBsCloseValidationErrors(rec);
    const workflowCol = document.getElementById('bs-section-close')?.parentElement;
    if (typeof showProcessValidation === 'function' && !showProcessValidation(summary, errors, workflowCol)) return;
    if (!bsCanClose(rec)) return;
    const reason = document.getElementById('bs-close-reason')?.value?.trim();
    if (typeof clearProcessValidation === 'function' && workflowCol) {
      clearProcessValidation(workflowCol);
    }
    const patch = {
      workflow: 'closed',
      closeReason: reason,
      closedAt: new Date().toISOString(),
      activityLog: bsActivityLog
    };
    let spawnedAuditId = null;
    if (rec.furtherRequired === 'yes' && rec.followOnProcess === 'audit') {
      spawnedAuditId = 'A-2026-' + String(3200 + Math.floor(Math.random() * 200));
      patch.spawnedAuditId = spawnedAuditId;
      if (typeof seedAuditSetupFromBizSupport === 'function') {
        seedAuditSetupFromBizSupport(rec, spawnedAuditId);
      }
    }
    persistBsPatch(activeBizSupportId, patch);
    if (rec.furtherRequired === 'yes' && rec.followOnProcess === 'audit' && spawnedAuditId && typeof openAuditSetup === 'function') {
      openAuditSetup(spawnedAuditId);
    } else if (rec.furtherRequired === 'yes' && rec.followOnProcess === 'bizsupport') {
      startBizSupportFromPremises(bsPrimaryPremises(rec));
    } else if (rec.furtherRequired === 'yes' && rec.followOnProcess === 'concern') {
      if (typeof show === 'function') show('concerns');
      if (typeof openScIntakeForm === 'function') openScIntakeForm();
      refreshBsPage();
    } else {
      refreshBsPage();
    }
  }

  function acceptBsDutyHolder(id) {
    const rec = getBizSupportById(activeBizSupportId);
    if (!rec) return;
    const record = (rec.dutyHolders || []).find(function (d) { return d.id === id; });
    const holders = (rec.dutyHolders || []).map(function (d) {
      return d.id === id ? Object.assign({}, d, { status: 'accepted', key: d.key || (typeof SETUP_DH_KEY_BY_NAME !== 'undefined' ? SETUP_DH_KEY_BY_NAME[d.name] : null) }) : d;
    });
    persistBsPatch(activeBizSupportId, { dutyHolders: holders });
    const dhKey = record && getBsDhKey(Object.assign({}, record, { status: 'accepted' }));
    if (dhKey) {
      suggestBsRpsForDh(dhKey);
      suggestBsPremisesForDh(dhKey);
    }
    refreshBsPage();
  }

  function removeBsDutyHolder(id) {
    const rec = getBizSupportById(activeBizSupportId);
    if (!rec) return;
    persistBsPatch(activeBizSupportId, { dutyHolders: (rec.dutyHolders || []).filter(function (d) { return d.id !== id; }) });
    pruneBsResponsiblePersons(getBizSupportById(activeBizSupportId));
    pruneBsPremises(getBizSupportById(activeBizSupportId));
    refreshBsPage();
  }

  function acceptBsPremises(id) {
    const rec = getBizSupportById(activeBizSupportId);
    if (!rec) return;
    const list = getBsPremisesList(rec).map(function (p) {
      return p.id === id ? Object.assign({}, p, { status: 'accepted' }) : p;
    });
    persistBsPatch(activeBizSupportId, {
      premisesList: list,
      premises: bsPrimaryPremises(Object.assign({}, rec, { premisesList: list }))
    });
    refreshBsPage();
  }

  function removeBsPremises(id) {
    const rec = getBizSupportById(activeBizSupportId);
    if (!rec) return;
    const list = getBsPremisesList(rec).filter(function (p) { return p.id !== id; });
    persistBsPatch(activeBizSupportId, {
      premisesList: list,
      premises: bsPrimaryPremises(Object.assign({}, rec, { premisesList: list }))
    });
    refreshBsPage();
  }

  function addBsPremises() {
    if (typeof openSetupLookupModal === 'function') openSetupLookupModal('premises', 'bizsupport');
  }

  function addBsDutyHolder() {
    if (typeof openSetupLookupModal === 'function') openSetupLookupModal('dutyHolder', 'bizsupport');
  }

  function addBsResponsiblePerson() {
    if (typeof openSetupLookupModal === 'function') openSetupLookupModal('responsiblePerson', 'bizsupport');
  }

  function acceptBsResponsiblePerson(id) {
    const rec = getBizSupportById(activeBizSupportId);
    if (!rec) return;
    const rps = (rec.responsiblePersons || []).map(function (r) {
      return r.id === id ? Object.assign({}, r, { status: 'accepted' }) : r;
    });
    persistBsPatch(activeBizSupportId, { responsiblePersons: rps });
    refreshBsPage();
  }

  function removeBsResponsiblePerson(id) {
    const rec = getBizSupportById(activeBizSupportId);
    if (!rec) return;
    persistBsPatch(activeBizSupportId, { responsiblePersons: (rec.responsiblePersons || []).filter(function (r) { return r.id !== id; }) });
    refreshBsPage();
  }

  function addBsInspector() {
    if (typeof openSetupLookupModal === 'function') openSetupLookupModal('inspector', 'bizsupport');
  }

  function removeBsInspector(id) {
    const rec = getBizSupportById(activeBizSupportId);
    if (!rec) return;
    persistBsPatch(activeBizSupportId, { inspectors: (rec.inspectors || []).filter(function (i) { return i.id !== id; }) });
    refreshBsPage();
  }

  function openBizSupport(id) { show('bizsupport/' + id); }

  function startBizSupportFromPremises(premisesName) {
    loadBsOverrides();
    const id = 'bs-new-' + Date.now();
    const rec = defaultBsRecord(id, premisesName);
    bsOverrides[id] = rec;
    saveBsOverrides();
    openBizSupport(id);
  }

  function setBsActivityBarVisible(visible) {
    document.body.classList.toggle('bs-activity-bar', visible);
    if (!visible) document.body.classList.remove('bs-float-panel-open');
  }

  function openBsFloatPanel(mode) {
    const panel = document.getElementById('bs-float-panel');
    if (!panel) return;
    setBsActivityBarVisible(true);
    setBsLogType(mode || bsLogType || 'time');
    if (typeof resetActivityLogDate === 'function') resetActivityLogDate('bs-time-date');
    panel.classList.add('open');
    panel.setAttribute('aria-hidden', 'false');
    document.body.classList.add('bs-float-panel-open');
  }

  function closeBsFloatPanel() {
    const panel = document.getElementById('bs-float-panel');
    if (panel) { panel.classList.remove('open'); panel.setAttribute('aria-hidden', 'true'); }
    document.body.classList.remove('bs-float-panel-open');
  }

  function setBsLogType(type) {
    bsLogType = type;
    ['time', 'note', 'file'].forEach(function (t) {
      const el = document.getElementById('bs-log-fields-' + t);
      if (el) el.hidden = t !== type;
    });
    document.querySelectorAll('#bs-log-type-row .chip').forEach(function (chip) {
      chip.classList.toggle('active', chip.dataset.bsLogType === type);
    });
  }

  function submitBsLog() {
    const stamp = typeof cpinLogTimestamp === 'function' ? cpinLogTimestamp() : { at: 'Today', ts: Date.now() };
    if (bsLogType === 'note') {
      const text = document.getElementById('bs-note-text')?.value?.trim();
      if (!text) { alert('Enter a note.'); return; }
      bsActivityLog.notes.unshift({ id: 'bn' + stamp.ts, text: text, at: stamp.at, ts: stamp.ts });
      document.getElementById('bs-note-text').value = '';
    } else if (bsLogType === 'time') {
      const timeStamp = typeof getActivityLogStampForTime === 'function'
        ? getActivityLogStampForTime('bs-time-date')
        : (typeof cpinLogTimestamp === 'function' ? cpinLogTimestamp() : { at: 'Today', ts: Date.now(), logDate: null });
      if (!timeStamp) return;
      bsActivityLog.times.unshift({
        id: 'bt' + timeStamp.ts,
        activity: document.getElementById('bs-time-activity')?.value || 'Meeting',
        minutes: parseInt(document.getElementById('bs-time-duration')?.value || '30', 10),
        at: timeStamp.at,
        ts: timeStamp.ts,
        logDate: timeStamp.logDate
      });
    } else if (bsLogType === 'file') {
      const desc = document.getElementById('bs-file-desc')?.value?.trim() || 'File';
      const input = document.getElementById('bs-file-input');
      const name = input?.files?.[0]?.name || 'attachment.pdf';
      bsActivityLog.files.unshift({ id: 'bf' + stamp.ts, name: name, description: desc, at: stamp.at, ts: stamp.ts });
      if (input) input.value = '';
      document.getElementById('bs-file-desc').value = '';
    }
    persistBsPatch(activeBizSupportId, { activityLog: bsActivityLog });
    renderBsActivity();
    closeBsFloatPanel();
  }

  window.initBizSupportPage = initBizSupportPage;
  window.openBizSupport = openBizSupport;
  window.startBizSupportFromPremises = startBizSupportFromPremises;
  window.saveBsAppointment = saveBsAppointment;
  window.skipBsLetter = skipBsLetter;
  window.getBsLetterRecipients = getBsLetterRecipients;
  window.getBsSavedLetters = getBsSavedLetters;
  window.appendBsLettersToActivity = appendBsLettersToActivity;
  window.getBsSetupValidationErrors = getBsSetupValidationErrors;
  window.getBsCloseValidationErrors = getBsCloseValidationErrors;
  window.saveBsProgress = saveBsProgress;
  window.saveBsFollowOnProcess = saveBsFollowOnProcess;
  window.acceptBsPremises = acceptBsPremises;
  window.removeBsPremises = removeBsPremises;
  window.addBsPremises = addBsPremises;
  window.addBsPremisesFromLookup = addBsPremisesFromLookup;
  window.saveBsConductNotes = saveBsConductNotes;
  window.saveBsFurtherRequired = saveBsFurtherRequired;
  window.saveBsFollowUp = saveBsFollowUp;
  window.closeBsProcess = closeBsProcess;
  window.acceptBsDutyHolder = acceptBsDutyHolder;
  window.removeBsDutyHolder = removeBsDutyHolder;
  window.addBsDutyHolder = addBsDutyHolder;
  window.addBsResponsiblePerson = addBsResponsiblePerson;
  window.acceptBsResponsiblePerson = acceptBsResponsiblePerson;
  window.removeBsResponsiblePerson = removeBsResponsiblePerson;
  window.addBsInspector = addBsInspector;
  window.removeBsInspector = removeBsInspector;
  window.setBsActivityBarVisible = setBsActivityBarVisible;
  window.openBsFloatPanel = openBsFloatPanel;
  window.closeBsFloatPanel = closeBsFloatPanel;
  window.setBsLogType = setBsLogType;
  window.submitBsLog = submitBsLog;
  window.getBizSupportById = getBizSupportById;
  window.getBsPremisesList = getBsPremisesList;
  window.persistBsPatch = persistBsPatch;
  window.activeBizSupportId = function () { return activeBizSupportId; };
  window.setActiveBizSupportId = function (id) { activeBizSupportId = id; };
})();
