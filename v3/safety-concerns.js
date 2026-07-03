/* Safety Concerns workflow — mirrors CPIN patterns with FIS / hazard terminology */
(function () {
  'use strict';

  const SC_PIN_KEY = 'sc-pins-v1';
  const SC_OVERRIDE_KEY = 'sc-overrides-v1';
  const SC_INTAKE_KEY = 'cpfsi-sc-intake-v1';
  const SC_CURRENT_INSPECTOR = 'Phil Gower';
  const SC_IN_PROGRESS_WF = new Set(['assigned', 'triage', 'desk_eval', 'awaiting_info', 'audit_spawned', 'in_review', 'audit']);

  const SC_WORKFLOW_LABELS = {
    incoming: 'Incoming',
    awaiting_premises: 'Awaiting premises',
    unassigned: 'Unassigned',
    assigned: 'Assigned',
    triage: 'Triage',
    desk_eval: 'Examine concern',
    awaiting_info: 'Awaiting info',
    audit_spawned: 'Audit created',
    closed: 'Closed',
    in_review: 'Triage',
    audit: 'Audit created'
  };

  const SC_SEVERITY_LONG = {
    green: 'Green — low risk hazard, no immediate injury concern',
    amber: 'Amber — moderate risk, action may be required',
    red: 'Red — serious hazard, urgent attention required'
  };

  const SC_DH_BY_PREMISES = {
    'MoJ HQ London': ['Ministry of Justice Property', 'Equans'],
    'Charing Cross House refurb': ['MoJ', 'Capita Facilities Management'],
    'Temple Quay House': ['HMCTS', 'Equans', 'Property Directorate'],
    'HMP Bristol': ['HMPPS - South West', 'Serco FM'],
    'DWP Canterbury': ['DWP Estates', 'Mitie'],
    'Reading Job Centre Plus': ['DWP Estates']
  };

  const CONCERNS_INCOMING = [
    { id: 'sc-in-0151', ref: 'SC-2026-0151', severity: 'amber', severityScore: 2, when: '25 min ago', premises: 'MoJ HQ London', summary: 'Combustible storage in basement plant room', patch: false, workflow: 'incoming', assignee: null, intake: { reportRef: 'FIS-3301', reportDate: '10/06/2026', reporter: 'Union safety rep', source: 'FIS direct report', hazardType: 'Combustible materials', description: 'Pallets of packaging stored within 1m of electrical switchgear. Reported by onsite union rep.', premisesFree: '' } },
    { id: 'sc-in-0152', ref: 'SC-2026-0152', severity: 'green', severityScore: 0, when: '1 hr ago', premises: 'Reading Job Centre Plus', summary: 'Fire door wedged open during delivery', patch: false, workflow: 'incoming', assignee: null, intake: { reportRef: 'FIS-3302', reportDate: '10/06/2026', reporter: 'Duty Holder', source: 'Duty Holder portal', hazardType: 'Fire door defect', description: 'Rear fire door propped open for deliveries. DH self-reported and states now closed.', premisesFree: '' } }
  ];

  const CONCERNS_MINE = [
    { id: 'sc-0142', ref: 'SC-2026-0142', severity: 'amber', severityScore: 2, when: '2 days ago', premises: 'MoJ HQ London', summary: 'Blocked fire exit — storage in stairwell', patch: true, workflow: 'triage', assignee: 'Phil Gower', furtherAction: null, intake: { reportRef: 'FIS-3288', reportDate: '08/06/2026', reporter: 'Mark Stevens (Duty Holder)', source: 'FIS intake', hazardType: 'Blocked escape route', description: 'Filing cabinets and archive boxes stored in rear escape stairwell on level 3.', premisesFree: '' } },
    { id: 'sc-0138', ref: 'SC-2026-0138', severity: 'red', severityScore: 5, when: '5 days ago', premises: 'Charing Cross House refurb', summary: 'Hot works without permit — active refurbishment', patch: true, workflow: 'desk_eval', assignee: 'Phil Gower', furtherAction: 'yes', deskOutcome: 'onsite_eval', deskNotes: 'Contractor hot works observed without CPFSI notification. Spoke to MoJ project lead and contractor FM.', dutyHolders: [{ id: 'dh-moj', key: 'propdir', name: 'MoJ', role: 'Government department  ·  Project authority', initials: 'MJ', fromPremises: true, status: 'accepted' }], onsiteEval: { appointmentDate: '2026-06-12', appointmentTime: '14:00', appointmentDuration: 'half', appointmentConfirmed: true, letterSkipped: false, letterSent: true, siteVisitNotes: '', siteVisitDone: false }, intake: { reportRef: 'FIS-3271', reportDate: '05/06/2026', reporter: 'Site manager', source: 'FIS site visit', hazardType: 'Hot works', description: 'Welding on level 4 without hot works permit or fire watch.', premisesFree: '' } },
    { id: 'sc-0131', ref: 'SC-2026-0131', severity: 'green', severityScore: 0, when: '12 Jun', premises: 'Temple Quay House', summary: 'Emergency lighting test failure — one fitting', patch: true, workflow: 'closed', assignee: 'Phil Gower', furtherAction: 'no', auditRequired: 'no', closeReason: 'DH replaced fitting same day — no further action.', intake: { reportRef: 'FIS-3250', reportDate: '11/06/2026', reporter: 'Equans FM', source: 'FM company', hazardType: 'Emergency lighting', description: 'Monthly test log shows one fitting failed on level 2 corridor. Replaced 11 Jun.', premisesFree: '' } },
    { id: 'sc-0125', ref: 'SC-2026-0125', severity: 'amber', severityScore: 3, when: '10 Jun', premises: null, summary: 'Hazard report — premises link required', patch: true, workflow: 'awaiting_premises', assignee: null, intake: { reportRef: 'FIS-3244', reportDate: '09/06/2026', reporter: 'Anonymous', source: 'FIS web form', hazardType: 'Unknown premises', description: 'Smell of burning from government office on high street — address in free text only.', premisesFree: '42 High Street, Guildford' } }
  ];

  const CONCERNS_UNASSIGNED = [
    { id: 'sc-u-0148', ref: 'SC-2026-0148', severity: 'red', severityScore: 6, when: 'Yesterday', premises: 'HMP Bristol', summary: 'Cell door fire seal missing — wing C', patch: false, workflow: 'unassigned', assignee: null, intake: { reportRef: 'FIS-3295', reportDate: '09/06/2026', reporter: 'HMPPS regional lead', source: 'FIS escalation', hazardType: 'Fire compartmentation', description: 'Intumescent seal missing on cell door 14C. Reported during routine inspection.', premisesFree: '' } },
    { id: 'sc-u-0144', ref: 'SC-2026-0144', severity: 'amber', severityScore: 1, when: '8 Jun', premises: 'DWP Canterbury', summary: 'Portable heater near combustibles', patch: false, workflow: 'unassigned', assignee: null, intake: { reportRef: 'FIS-3280', reportDate: '07/06/2026', reporter: 'Staff member', source: 'Duty Holder portal', hazardType: 'Ignition source', description: 'Oil-filled radiator within 30cm of paper store in back office.', premisesFree: '' } }
  ];

  const CONCERNS_COMPLETED = Array.from({ length: 18 }, function (_, i) {
    return {
      id: 'sc-c-' + (100 + i),
      ref: 'SC-2025-' + String(1100 + i).padStart(4, '0'),
      severity: i % 4 === 0 ? 'red' : (i % 2 === 0 ? 'amber' : 'green'),
      when: (i % 10) + 1 + ' ' + ['Jan', 'Feb', 'Mar', 'Apr', 'May'][i % 5] + ' 2026',
      premises: ['MoJ HQ London', 'Temple Quay House', 'DWP Canterbury', 'HMP Bristol'][i % 4],
      summary: ['Closed after DH action', 'No further action', 'Audit spawned', 'Monitoring only'][i % 4],
      patch: true,
      workflow: 'closed',
      assignee: 'Phil Gower'
    };
  });

  let scPins = new Set();
  let scOverrides = {};
  let concernsRagFilter = 'all';
  let concernsQueueFilter = 'all';
  let concernsDeptFilter = 'all';
  let concernsActiveTab = 'all';
  let completedConcernsShown = 20;
  let activeConcernId = null;
  let concernDetailLastId = null;
  let concernSeverityEditing = false;
  let concernsSortMode = 'recent';
  let concernsDateFilter = { type: 'all' };
  let concernActivityLog = { notes: [], times: [], interim: [], files: [] };
  let concernLogType = 'time';
  let concernActivityFeedFilter = 'all';

  function loadScPins() {
    try {
      const raw = localStorage.getItem(SC_PIN_KEY);
      if (raw) scPins = new Set(JSON.parse(raw));
    } catch (e) { scPins = new Set(); }
  }

  function saveScPins() {
    localStorage.setItem(SC_PIN_KEY, JSON.stringify(Array.from(scPins)));
  }

  function loadScOverrides() {
    try {
      const raw = localStorage.getItem(SC_OVERRIDE_KEY);
      if (raw) scOverrides = JSON.parse(raw);
    } catch (e) { scOverrides = {}; }
  }

  function saveScOverrides() {
    localStorage.setItem(SC_OVERRIDE_KEY, JSON.stringify(scOverrides));
  }

  function mergeConcernRecord(base) {
    return Object.assign({}, base, scOverrides[base.id] || {});
  }

  function loadScIntake() {
    try {
      return JSON.parse(localStorage.getItem(SC_INTAKE_KEY) || '[]');
    } catch (e) {
      return [];
    }
  }

  function formatScUkDate(iso) {
    if (!iso) return '';
    const p = String(iso).split('-');
    if (p.length !== 3) return iso;
    return p[2] + '/' + p[1] + '/' + p[0];
  }

  function formatScTime(t) {
    if (!t) return '';
    const parts = String(t).split(':');
    return parts[0] + ':' + (parts[1] || '00');
  }

  function scSeverityScore(sev) {
    if (sev === 'red') return 5;
    if (sev === 'amber') return 2;
    return 0;
  }

  function nextScIntakeRef() {
    const nums = getAllConcernRecords().map(function (c) {
      const part = (c.ref || '').split('-').pop();
      return parseInt(part, 10);
    }).filter(function (n) { return !isNaN(n); });
    const max = nums.length ? Math.max.apply(null, nums) : 159;
    return 'SC-2026-' + String(max + 1).padStart(4, '0');
  }

  function nextScFisRef() {
    return 'FIS-' + String(3300 + Math.floor(Math.random() * 200));
  }

  function saveScIntakeFromForm(formData) {
    const severity = formData.get('severity');
    if (!severity) return null;

    const premises = (formData.get('premises') || '').trim();
    const premisesFree = (formData.get('premisesFree') || '').trim();
    const description = (formData.get('description') || '').trim();
    const hazardType = (formData.get('hazardType') || '').trim();
    const matched = !!premises;
    const summary = hazardType + (description ? ' — ' + (description.length > 48 ? description.slice(0, 48) + '…' : description) : '');

    const record = {
      id: 'sc-in-' + Date.now(),
      ref: nextScIntakeRef(),
      severity: severity,
      severityScore: scSeverityScore(severity),
      when: 'Just now',
      premises: premises || null,
      summary: summary.length > 72 ? summary.slice(0, 72) + '…' : summary,
      patch: false,
      workflow: matched ? 'incoming' : (premisesFree ? 'awaiting_premises' : 'incoming'),
      assignee: null,
      intake: {
        reportRef: (formData.get('reportRef') || '').trim() || nextScFisRef(),
        reportDate: formatScUkDate(formData.get('reportDate')),
        reportTime: formatScTime(formData.get('reportTime')),
        reporter: formData.get('reporter'),
        reporterEmail: formData.get('reporterEmail') || '',
        source: formData.get('source'),
        hazardType: hazardType,
        description: description,
        premisesFree: premisesFree
      }
    };

    const list = loadScIntake();
    list.unshift(record);
    localStorage.setItem(SC_INTAKE_KEY, JSON.stringify(list));
    renderConcernsLists();
    return record;
  }

  function getAllConcernRecords() {
    const seen = new Set();
    const out = [];
    loadScIntake().concat(CONCERNS_INCOMING, CONCERNS_MINE, CONCERNS_UNASSIGNED, CONCERNS_COMPLETED).forEach(function (c) {
      if (seen.has(c.id)) return;
      seen.add(c.id);
      out.push(mergeConcernRecord(c));
    });
    return out;
  }

  function getConcernById(id) {
    const base = getAllConcernRecords().find(function (c) { return c.id === id; });
    return base || null;
  }

  function persistConcernPatch(id, patch) {
    scOverrides[id] = Object.assign({}, scOverrides[id] || {}, patch);
    saveScOverrides();
  }

  function concernNeedsPremises(c) {
    return !c.premises && (c.workflow === 'awaiting_premises' || c.workflow === 'incoming');
  }

  function concernIsInProgress(c) {
    return c.workflow !== 'closed' && SC_IN_PROGRESS_WF.has(c.workflow) && !!c.assignee;
  }

  function concernRowStatusLabel(item) {
    if (item.workflow === 'closed') return '';
    if (concernNeedsPremises(item)) return 'Premises needed';
    if (!item.assignee) return 'Unassigned';
    if (concernIsInProgress(item)) return 'In progress';
    return '';
  }

  function getConcernAdminReview(c) {
    return c && c.adminReview ? c.adminReview : null;
  }

  function concernMatchesFilter(item) {
    if (typeof matchesDateRangeFilter === 'function' && typeof parseCpinWhenDays === 'function') {
      if (!matchesDateRangeFilter(parseCpinWhenDays(item.when), concernsDateFilter)) return false;
    }
    if (concernsRagFilter !== 'all' && item.severity !== concernsRagFilter) return false;
    if (concernsQueueFilter === 'patch' && !item.patch) return false;
    if (concernsQueueFilter === 'in-progress' && !concernIsInProgress(item)) return false;
    if (concernsQueueFilter === 'flagged') {
      const r = getConcernAdminReview(item);
      if (!(r && (r.status === 'pending' || (r.status === 'approved' && r.action === 'flag')))) return false;
    }
    if (concernsDeptFilter === 'gov-dept' && !(typeof isGovernmentDeptPremises === 'function' && isGovernmentDeptPremises(item.premises))) return false;
    return true;
  }

  function getConcernsForTab(tab) {
    const all = getAllConcernRecords();
    if (tab === 'closed') return all.filter(function (c) { return c.workflow === 'closed'; });
    const open = all.filter(function (c) { return c.workflow !== 'closed'; });
    if (tab === 'all') return open;
    if (tab === 'unassigned') {
      return open.filter(function (c) {
        return !c.assignee || c.workflow === 'incoming' || c.workflow === 'unassigned' || c.workflow === 'awaiting_premises';
      });
    }
    if (tab === 'mine') {
      return open.filter(function (c) {
        return c.assignee === SC_CURRENT_INSPECTOR && SC_IN_PROGRESS_WF.has(c.workflow);
      });
    }
    if (tab === 'premises-needed') {
      return open.filter(concernNeedsPremises);
    }
    return open;
  }

  function sortConcernItems(items, mode) {
    const list = items.slice();
    if (mode === 'severity') {
      list.sort(function (a, b) {
        const order = { red: 0, amber: 1, green: 2 };
        return (order[a.severity] || 9) - (order[b.severity] || 9);
      });
    } else if (mode === 'name') {
      list.sort(function (a, b) { return (a.premises || '').localeCompare(b.premises || ''); });
    }
    return list;
  }

  function buildConcernCard(item) {
    const pinned = scPins.has(item.id);
    const pillText = { red: 'Red', amber: 'Amber', green: 'Green' }[item.severity] || 'Green';
    const statusLabel = concernRowStatusLabel(item);
    const premisesHtml = item.premises
      ? '<div class="premises">' + escHtml(item.premises) + '</div>'
      : '<div class="premises" style="color:var(--ink-3);font-weight:500;">No premises linked</div>';
    const assigneeHtml = item.assignee ? '<div class="cpin-assignee">' + escHtml(item.assignee) + '</div>' : '';
    let statusClass = ' is-unassigned';
    if (statusLabel === 'Premises needed') statusClass = ' is-premises';
    else if (statusLabel === 'In progress') statusClass = ' is-progress';
    const statusHtml = statusLabel
      ? '<div class="cpin-status-label' + statusClass + '">' + escHtml(statusLabel) + '</div>'
      : '<div class="cpin-workflow">Closed</div>';

    return '<div class="cpin-card ' + item.severity + (pinned ? ' is-pinned' : '') + '" role="button" tabindex="0" onclick="openConcern(\'' + item.id + '\', event)" onkeydown="if(event.key===\'Enter\'||event.key===\' \'){openConcern(\'' + item.id + '\', event);}">' +
      '<div class="cpin-severity"><span class="pill ' + item.severity + '">' + pillText + '</span></div>' +
      '<div class="cpin-body">' +
        '<div style="font-size:12px;color:var(--ink-3);">' + escHtml(item.ref) + '  ·  ' + escHtml(item.when) + '</div>' +
        premisesHtml +
        '<div class="summary">' + escHtml(item.summary) + '</div>' +
        statusHtml +
      '</div>' +
      '<div class="cpin-meta">' + assigneeHtml +
        '<button type="button" class="cpin-pin' + (pinned ? ' pinned' : '') + '" title="' + (pinned ? 'Unpin' : 'Pin') + '" onclick="toggleConcernPin(\'' + item.id + '\', event)">' + (pinned ? '★' : '☆') + '</button>' +
      '</div></div>';
  }

  function renderConcernCardsHtml(items) {
    const pinned = sortConcernItems(items.filter(function (i) { return scPins.has(i.id); }), concernsSortMode);
    const rest = sortConcernItems(items.filter(function (i) { return !scPins.has(i.id); }), concernsSortMode);
    let html = '';
    if (pinned.length) {
      html += '<section class="cpins-pinned-section" aria-label="Pinned safety concerns">' +
        '<h3 class="cpins-section-label"><span class="star" aria-hidden="true">★</span> Pinned</h3>' +
        '<div class="cpins-card-stack">' + pinned.map(buildConcernCard).join('') + '</div></section>';
    }
    if (rest.length) {
      html += '<div class="cpins-card-stack' + (pinned.length ? ' cpins-card-stack--rest' : '') + '">' + rest.map(buildConcernCard).join('') + '</div>';
    }
    return html;
  }

  function renderConcernPanel(panelId, items, emptyMsg) {
    const el = document.getElementById(panelId);
    if (!el) return;
    const filtered = items.filter(concernMatchesFilter);
    const countEl = document.getElementById('concern-results-count');
    if (countEl && panelId === 'concerns-panel-list') countEl.textContent = String(filtered.length);
    if (!filtered.length) {
      el.innerHTML = '<div class="audit-feed-empty" style="margin:24px 0;">' + escHtml(emptyMsg) + '</div>';
      return;
    }
    el.innerHTML = renderConcernCardsHtml(filtered);
  }

  function renderConcernsLists() {
    const emptyMsgs = {
      all: 'No open safety concerns match this filter.',
      unassigned: 'No unassigned safety concerns match this filter.',
      'premises-needed': 'No safety concerns needing premises match this filter.',
      mine: 'No safety concerns assigned to you match this filter.',
      closed: 'No closed safety concerns match this filter.'
    };
    const closedPanel = document.getElementById('concerns-panel-closed');
    const listPanel = document.getElementById('concerns-panel-list');
    if (concernsActiveTab === 'closed') {
      if (listPanel) listPanel.hidden = true;
      if (closedPanel) closedPanel.hidden = false;
      const el = document.getElementById('concerns-completed-list');
      const filtered = CONCERNS_COMPLETED.map(mergeConcernRecord).filter(concernMatchesFilter);
      const slice = filtered.slice(0, completedConcernsShown);
      if (el) {
        el.innerHTML = slice.length ? renderConcernCardsHtml(slice) : '<div class="audit-feed-empty" style="margin:24px 0;">No closed safety concerns.</div>';
      }
      const countEl = document.getElementById('concern-results-count');
      if (countEl) countEl.textContent = String(filtered.length);
    } else {
      if (listPanel) listPanel.hidden = false;
      if (closedPanel) closedPanel.hidden = true;
      renderConcernPanel('concerns-panel-list', getConcernsForTab(concernsActiveTab), emptyMsgs[concernsActiveTab] || emptyMsgs.all);
    }
    document.querySelectorAll('[data-concern-view-count]').forEach(function (el) {
      const tab = el.dataset.concernViewCount;
      const n = getConcernsForTab(tab).filter(concernMatchesFilter).length;
      el.textContent = n ? String(n) : '';
    });
  }

  function syncConcernFilterChips() {
    document.querySelectorAll('.concern-filters-rag [data-concern-filter]').forEach(function (item) {
      item.classList.toggle('active', item.dataset.concernFilter === concernsRagFilter);
    });
    syncConcernToggleFilterChips('.concern-filters-queue', 'concernFilter', concernsQueueFilter);
    syncConcernToggleFilterChips('.concern-filters-dept', 'concernFilter', concernsDeptFilter);
  }

  function syncConcernToggleFilterChips(containerSelector, filterAttr, activeFilter) {
    document.querySelectorAll(containerSelector + ' .chip').forEach(function (chip) {
      const filter = chip.dataset[filterAttr];
      const label = chip.dataset.chipLabel || chip.textContent.trim();
      const isOn = filter === activeFilter && activeFilter !== 'all';
      chip.classList.toggle('on', isOn);
      if (isOn) {
        chip.innerHTML = '<span class="chip-label">' + escHtml(label) + '</span>' +
          '<span class="chip-dismiss" role="button" tabindex="0" aria-label="Clear ' + escHtml(label) + ' filter">×</span>';
      } else {
        chip.innerHTML = '<span class="chip-label">' + escHtml(label) + '</span>';
      }
    });
  }

  function setConcernRagFilter(filter) {
    if (concernsRagFilter === filter && filter !== 'all') concernsRagFilter = 'all';
    else concernsRagFilter = filter;
    syncConcernFilterChips();
    renderConcernsLists();
  }

  function setConcernQueueFilter(filter) {
    if (concernsQueueFilter === filter && filter !== 'all') concernsQueueFilter = 'all';
    else concernsQueueFilter = filter;
    syncConcernFilterChips();
    renderConcernsLists();
  }

  function setConcernDeptFilter(filter) {
    if (concernsDeptFilter === filter && filter !== 'all') concernsDeptFilter = 'all';
    else concernsDeptFilter = filter;
    syncConcernFilterChips();
    renderConcernsLists();
  }

  const CONCERN_VIEW_LABELS = {
    all: 'All',
    unassigned: 'Unassigned',
    'premises-needed': 'Premises needed',
    mine: 'My concerns',
    closed: 'Closed'
  };

  function closeConcernViewMenu() {
    const menu = document.getElementById('concern-view-menu');
    const btn = document.getElementById('concern-view-toggle');
    if (menu) menu.hidden = true;
    if (btn) btn.setAttribute('aria-expanded', 'false');
  }

  function layoutConcernViews() {
    const stack = document.getElementById('concern-sidebar-stack');
    const sidebar = document.getElementById('concern-views-sidebar');
    const menu = document.getElementById('concern-view-menu');
    if (!stack || !sidebar || !menu) return;
    if (typeof isMobileNavLayout === 'function' && isMobileNavLayout()) {
      if (stack.parentElement !== menu) menu.appendChild(stack);
      sidebar.hidden = true;
    } else {
      if (stack.parentElement !== sidebar) sidebar.appendChild(stack);
      sidebar.hidden = false;
      closeConcernViewMenu();
    }
  }

  function toggleConcernViewMenu() {
    layoutConcernViews();
    const menu = document.getElementById('concern-view-menu');
    const btn = document.getElementById('concern-view-toggle');
    if (!menu || !btn) return;
    const open = menu.hidden;
    menu.hidden = !open;
    btn.setAttribute('aria-expanded', String(open));
  }

  function switchConcernsTab(tab) {
    concernsActiveTab = tab || 'all';
    document.querySelectorAll('[data-concern-view]').forEach(function (el) {
      el.classList.toggle('active', el.dataset.concernView === tab);
    });
    const sel = document.getElementById('concern-view-selected');
    if (sel) sel.textContent = CONCERN_VIEW_LABELS[tab] || tab;
    closeConcernViewMenu();
    renderConcernsLists();
  }

  function toggleConcernPin(id, e) {
    if (e) { e.preventDefault(); e.stopPropagation(); }
    if (scPins.has(id)) scPins.delete(id); else scPins.add(id);
    saveScPins();
    renderConcernsLists();
  }

  function openConcern(id, e) {
    if (e) e.stopPropagation();
    show('concern/' + id);
  }

  function initConcernsPage() {
    layoutConcernViews();
    loadScPins();
    loadScOverrides();
    if (!document.getElementById('concerns')?.dataset.viewsBound) {
      const rail = document.getElementById('concern-views-rail');
      if (rail) {
        rail.addEventListener('click', function (e) {
          const item = e.target.closest('.view-item[data-concern-view]');
          if (item) switchConcernsTab(item.dataset.concernView);
        });
      }
      const ragRail = document.getElementById('concern-rag-rail');
      if (ragRail) {
        ragRail.addEventListener('click', function (e) {
          const item = e.target.closest('[data-concern-filter]');
          if (item && item.closest('.concern-filters-rag')) setConcernRagFilter(item.dataset.concernFilter);
        });
      }
      document.querySelectorAll('.concern-filters-queue .chip, .concern-filters-dept .chip').forEach(function (chip) {
        chip.addEventListener('click', function (e) {
          if (e.target.closest('.chip-dismiss')) {
            e.preventDefault();
            e.stopPropagation();
            if (chip.closest('.concern-filters-queue')) setConcernQueueFilter('all');
            else if (chip.closest('.concern-filters-dept')) setConcernDeptFilter('all');
            return;
          }
          const filter = chip.dataset.concernFilter;
          if (!filter) return;
          if (chip.closest('.concern-filters-queue')) setConcernQueueFilter(filter);
          else if (chip.closest('.concern-filters-dept')) setConcernDeptFilter(filter);
        });
      });
      if (!document.body.dataset.concernViewBound) {
        document.body.dataset.concernViewBound = '1';
        document.addEventListener('mousedown', function (e) {
          if (typeof isMobileNavLayout !== 'function' || !isMobileNavLayout()) return;
          const dropdown = document.querySelector('#concerns .process-view-dropdown');
          if (dropdown && !dropdown.contains(e.target)) closeConcernViewMenu();
        });
      }
      document.getElementById('concerns').dataset.viewsBound = '1';
    }
    switchConcernsTab(concernsActiveTab);
    syncConcernFilterChips();
  }

  /* ---- Detail workflow ---- */

  function concernIsDelegatedAway(c) {
    return !!c && !!c.assignee && c.assignee !== SC_CURRENT_INSPECTOR;
  }

  function concernNeedsDeskEval(c) {
    return c && c.furtherAction === 'yes';
  }

  function concernShowsTriage(c) {
    return !!(c && c.premises && c.assignee && c.workflow !== 'closed');
  }

  function getConcernDutyHolderRecords(c) {
    return (c && c.dutyHolders) ? c.dutyHolders.filter(function (d) { return d.status !== 'rejected'; }) : [];
  }

  function concernHasAcceptedDutyHolders(c) {
    return getConcernDutyHolderRecords(c).some(function (d) { return d.status === 'accepted'; });
  }

  function concernShowsDutyHolders(c) {
    return c && c.furtherAction === 'yes';
  }

  function concernShowsRemoteEval(c) {
    if (!c || c.furtherAction !== 'yes' || c.workflow === 'closed') return false;
    if (!concernNeedsDeskEval(c)) return false;
    if (concernShowsDutyHolders(c) && !concernPeopleGateOk(c)) return false;
    return true;
  }

  function getConcernOnsiteEval(c) {
    if (!c) return {};
    if (c.onsiteEval) return c.onsiteEval;
    if (c.remoteEval) return c.remoteEval;
    return {};
  }

  function getConcernResponsiblePersonsForDutyHolders(c, opts) {
    opts = opts || {};
    const dhKeys = (c.dutyHolders || []).filter(function (d) {
      return opts.acceptedOnly ? d.status === 'accepted' : d.status !== 'rejected';
    }).map(function (d) {
      return d.key || (typeof SETUP_DH_KEY_BY_NAME !== 'undefined' ? SETUP_DH_KEY_BY_NAME[d.name] : null);
    }).filter(Boolean);
    if (!dhKeys.length) return [];
    return (c.responsiblePersons || []).filter(function (rp) {
      if (rp.status === 'rejected') return false;
      if (opts.acceptedOnly && rp.status !== 'accepted') return false;
      return rp.linkedDh && dhKeys.indexOf(rp.linkedDh) >= 0;
    });
  }

  function concernHasAcceptedResponsiblePersons(c) {
    return getConcernResponsiblePersonsForDutyHolders(c, { acceptedOnly: true }).length > 0;
  }

  function concernPeopleGateOk(c) {
    if (!concernHasAcceptedDutyHolders(c)) return false;
    return concernHasAcceptedResponsiblePersons(c);
  }

  function getConcernLetterRecipients(c) {
    return getConcernResponsiblePersonsForDutyHolders(c, { acceptedOnly: true });
  }

  function getConcernSavedLetters(c) {
    const o = getConcernOnsiteEval(c);
    if (o.letters && o.letters.length) return o.letters.slice();
    return [];
  }

  function concernOnsiteLettersComplete(c) {
    const o = getConcernOnsiteEval(c);
    if (o.letterSkipped) return true;
    return getConcernSavedLetters(c).length > 0;
  }

  function concernOnsitePrereqs(c) {
    const o = getConcernOnsiteEval(c);
    const apptOk = !!(o.appointmentConfirmed || (o.appointmentDate && o.appointmentTime));
    return {
      apptOk: apptOk,
      lettersOk: concernOnsiteLettersComplete(c),
      visitOk: !!o.siteVisitDone,
      ready: apptOk && concernOnsiteLettersComplete(c) && !!o.siteVisitDone
    };
  }

  function concernOnsiteAuditDecisionReady(c) {
    return concernOnsitePrereqs(c).ready;
  }

  function concernOnsiteAuditBlockedHint(c) {
    const p = concernOnsitePrereqs(c);
    const missing = [];
    if (!p.apptOk) missing.push('confirm the appointment date and time');
    if (!p.lettersOk) missing.push('save or skip appointment letters');
    if (!p.visitOk) missing.push('mark on site evaluation as completed');
    if (!missing.length) return '';
    if (missing.length === 1) return 'Before deciding whether an audit is required, ' + missing[0] + '.';
    return 'Before deciding whether an audit is required, ' + missing.slice(0, -1).join(', ') + ' and ' + missing[missing.length - 1] + '.';
  }

  function concernAuditRequiredForClose(c) {
    if (!c) return false;
    if (c.deskOutcome === 'audit') return true;
    if (getConcernOnsiteEval(c).auditRequired === 'yes') return true;
    return c.auditRequired === 'yes';
  }

  function concernStage4Ready(c) {
    if (!c || !c.deskOutcome) return false;
    if (c.deskOutcome === 'no_action' || c.deskOutcome === 'audit') return true;
    if (c.deskOutcome === 'onsite_eval') {
      if (!concernOnsiteAuditDecisionReady(c)) return false;
      const o = getConcernOnsiteEval(c);
      return o.auditRequired === 'yes' || o.auditRequired === 'no';
    }
    return false;
  }

  function concernCanClose(c) {
    if (!c || c.workflow === 'closed') return false;
    if (!c.premises || !c.assignee) return false;
    if (!c.furtherAction) return false;
    if (c.furtherAction === 'no') return true;
    if (!concernNeedsDeskEval(c)) return true;
    if (concernShowsDutyHolders(c) && !concernPeopleGateOk(c)) return false;
    return concernStage4Ready(c);
  }

  function concernWorkflowStage(c) {
    if (!c) return 1;
    if (c.workflow === 'closed') return 5;
    if (c.workflow === 'desk_eval') return 4;
    if (c.furtherAction || c.workflow === 'triage') return 3;
    if (c.assignee) return 2;
    return 1;
  }

  function renderConcernRagBanner(c) {
    const banner = document.getElementById('concern-rag-strip');
    const label = document.getElementById('concern-rag-strip-label');
    const detail = document.getElementById('concern-rag-strip-detail');
    if (!banner || !c) return;
    const sev = c.severity || 'green';
    banner.className = 'cpin-rag-strip ' + sev;
    const screen = document.getElementById('concern');
    if (screen) screen.dataset.severity = sev;
    const labels = { red: 'RED CONCERN', amber: 'AMBER CONCERN', green: 'GREEN CONCERN' };
    if (label) label.textContent = labels[sev] || 'CONCERN';
    if (detail) detail.textContent = SC_SEVERITY_LONG[sev] || '';
  }

  function renderConcernIntakeGrid(c) {
    const grid = document.getElementById('concern-intake-grid');
    const section = document.getElementById('concern-intake-section');
    if (!grid || !c || !c.intake) { if (section) section.hidden = true; return; }
    if (section) section.hidden = false;
    const i = c.intake;
    const rows = [
      ['Report reference', i.reportRef],
      ['Date reported', i.reportDate],
      ['Reporter', i.reporter],
      ['Source', i.source || '—'],
      ['Hazard type', i.hazardType],
      ['Premises', c.premises || i.premisesFree || '—']
    ];
    grid.innerHTML = rows.map(function (row) {
      return '<div><div class="k">' + escHtml(row[0]) + '</div><div class="v">' + escHtml(row[1] || '—') + '</div></div>';
    }).join('');
    const desc = document.getElementById('concern-hazard-desc-value');
    if (desc) desc.textContent = i.description || '—';
  }

  function renderConcernPremisesPanel(c) {
    const valueEl = document.getElementById('concern-premises-value');
    const changeBtn = document.getElementById('concern-premises-change-btn');
    const status = document.getElementById('concern-premises-status');
    if (valueEl) {
      if (c.premises) {
        valueEl.className = 'cpin-key-value';
        valueEl.textContent = c.premises;
      } else {
        valueEl.className = 'cpin-key-value is-empty';
        valueEl.textContent = 'No premises linked';
      }
    }
    if (changeBtn) changeBtn.textContent = c.premises ? 'Change' : 'Link';
    if (status) status.textContent = c.premises ? 'Attributed to premises record.' : 'Link a premises to continue.';
  }

  function renderConcernAssigneeHint(c) {
    const el = document.getElementById('concern-assignee-hint');
    if (!el) return;
    if (concernIsDelegatedAway(c)) {
      el.textContent = 'Assigned to a colleague — not in your queue.';
    } else if (c.assignee) {
      el.textContent = 'Inspector responsible for this safety concern.';
    } else {
      el.textContent = 'Assign to a fire safety inspector.';
    }
  }

  function renderConcernKeyFieldHighlights(c) {
    const premisesEl = document.getElementById('concern-field-premises');
    const assigneeEl = document.getElementById('concern-field-assignee');
    if (premisesEl) premisesEl.classList.remove('is-next-action');
    if (assigneeEl) assigneeEl.classList.remove('is-next-action');
    if (!c || c.workflow === 'closed' || concernIsDelegatedAway(c)) return;
    if (concernNeedsPremises(c)) {
      if (premisesEl) premisesEl.classList.add('is-next-action');
    } else if (!c.assignee) {
      if (assigneeEl) assigneeEl.classList.add('is-next-action');
    }
  }

  function renderConcernSeverityField(c) {
    const sel = document.getElementById('concern-severity-select');
    const valueEl = document.getElementById('concern-severity-value');
    const sev = c.severity || 'green';
    if (sel) sel.value = sev;
    if (valueEl) valueEl.textContent = SC_SEVERITY_LONG[sev] || sev;
    const edit = document.getElementById('concern-severity-edit');
    const display = document.getElementById('concern-severity-display');
    if (edit) edit.hidden = !concernSeverityEditing;
    if (display) display.hidden = concernSeverityEditing;
  }

  function renderConcernDutyHolders(c) {
    const list = document.getElementById('concern-dh-list');
    if (!list || !concernShowsDutyHolders(c)) return;
    const holders = getConcernDutyHolderRecords(c);
    if (!holders.length) {
      list.innerHTML = '<p style="color:var(--ink-3);font-size:13px;">Add Duty Holders for this premises.</p>';
      return;
    }
    list.innerHTML = holders.map(function (dh) {
      const pill = dh.status === 'suggested' ? '<span class="pill amber">Suggested</span>' : '<span class="pill blue">Approved</span>';
      const actions = dh.status === 'suggested'
        ? '<div class="holder-actions"><button class="btn primary" type="button" onclick="acceptConcernDutyHolder(\'' + dh.id + '\')">Approve</button><button class="btn" type="button" onclick="removeConcernDutyHolder(\'' + dh.id + '\')">Reject</button></div>'
        : '<div class="holder-actions"><span class="remove" onclick="removeConcernDutyHolder(\'' + dh.id + '\')">×</span></div>';
      return '<div class="holder-card' + (dh.status === 'suggested' ? ' is-suggested' : '') + '">' +
        '<div class="avatar-sm">' + escHtml(dh.initials || 'DH') + '</div>' +
        '<div><div class="name">' + escHtml(dh.name) + '</div><div class="role">' + escHtml(dh.role || '') + '</div></div>' +
        pill + actions + '</div>';
    }).join('');
  }

  function ensureConcernDutyHolderSuggestions(c) {
    const fromMap = SC_DH_BY_PREMISES[c.premises] || [];
    const holders = getConcernDutyHolderRecords(c).slice();
    const onList = new Set(holders.map(function (d) { return d.name; }));
    let changed = false;
    fromMap.forEach(function (name) {
      if (onList.has(name)) return;
      holders.push({
        id: 'dh-' + name.replace(/\W+/g, '-').toLowerCase(),
        key: typeof SETUP_DH_KEY_BY_NAME !== 'undefined' ? SETUP_DH_KEY_BY_NAME[name] : null,
        name: name,
        role: 'Duty Holder',
        initials: typeof setupInitials === 'function' ? setupInitials(name) : 'DH',
        fromPremises: true,
        status: 'suggested'
      });
      onList.add(name);
      changed = true;
    });
    if (changed) persistConcernPatch(c.id, { dutyHolders: holders });
  }

  function getConcernDhKey(dh) {
    if (!dh) return null;
    return dh.key || (typeof SETUP_DH_KEY_BY_NAME !== 'undefined' ? SETUP_DH_KEY_BY_NAME[dh.name] : null) || null;
  }

  function ensureConcernRpSuggestions(c) {
    if (!c || !concernShowsDutyHolders(c)) return false;
    const holders = getConcernDutyHolderRecords(c);
    if (!holders.length) return false;
    let changed = false;
    holders.forEach(function (dh) {
      const dhKey = getConcernDhKey(dh);
      if (dhKey && suggestConcernRpsForDh(dhKey)) changed = true;
    });
    return changed;
  }

  function suggestConcernRpsForDh(dhKey) {
    const c = getConcernById(activeConcernId);
    if (!c || !dhKey || typeof SETUP_DH_TO_RP_KEYS === 'undefined') return false;
    const keys = SETUP_DH_TO_RP_KEYS[dhKey] || [];
    const catalog = typeof SETUP_LOOKUP_CATALOG !== 'undefined' ? SETUP_LOOKUP_CATALOG.responsiblePerson : [];
    const rps = (c.responsiblePersons || []).slice();
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
    if (changed) persistConcernPatch(c.id, { responsiblePersons: rps });
    return changed;
  }

  function pruneConcernResponsiblePersons(c) {
    if (!c) return;
    const dhKeys = getConcernDutyHolderRecords(c).map(getConcernDhKey).filter(Boolean);
    const rps = (c.responsiblePersons || []).filter(function (rp) {
      if (!rp.linkedDh) return true;
      return dhKeys.indexOf(rp.linkedDh) >= 0;
    });
    if (rps.length !== (c.responsiblePersons || []).length) {
      persistConcernPatch(c.id, { responsiblePersons: rps });
    }
  }

  function renderConcernResponsiblePersons(c) {
    const list = document.getElementById('concern-rp-list');
    const hint = document.getElementById('concern-rp-hint');
    if (!list || !concernShowsDutyHolders(c)) return;
    ensureConcernRpSuggestions(c);
    c = getConcernById(c.id) || c;
    pruneConcernResponsiblePersons(c);
    c = getConcernById(c.id) || c;
    const rps = getConcernResponsiblePersonsForDutyHolders(c);
    if (!rps.length) {
      list.innerHTML = '<p style="color:var(--ink-3);font-size:13px;margin:0;">Suggested contacts appear here for each Duty Holder above. Use + Add to search the directory.</p>';
    } else {
      list.innerHTML = rps.map(function (rp) {
        const dhLabel = rp.linkedDh && typeof getDutyHolderLabelForKey === 'function' ? getDutyHolderLabelForKey(rp.linkedDh) : '';
        const pill = rp.status === 'suggested' ? '<span class="pill amber">Suggested</span>' : '<span class="pill grey">Approved</span>';
        const actions = rp.status === 'suggested'
          ? '<div class="holder-actions"><button class="btn primary" type="button" onclick="acceptConcernResponsiblePerson(\'' + rp.id + '\')">Approve</button><button class="btn" type="button" onclick="removeConcernResponsiblePerson(\'' + rp.id + '\')">Reject</button></div>'
          : '<div class="holder-actions"><span class="remove" onclick="removeConcernResponsiblePerson(\'' + rp.id + '\')">×</span></div>';
        return '<div class="holder-card' + (rp.status === 'suggested' ? ' is-suggested' : '') + '">' +
          '<div class="avatar-sm">' + escHtml(rp.initials || 'RP') + '</div>' +
          '<div><div class="name">' + escHtml(rp.name) + '</div><div class="role">' + escHtml(rp.role || '') +
          (dhLabel ? '  ·  Contact for ' + escHtml(dhLabel) : '') + '</div></div>' +
          pill + actions + '</div>';
      }).join('');
    }
    if (hint) {
      if (concernPeopleGateOk(c)) hint.textContent = '';
      else if (concernHasAcceptedDutyHolders(c) && rps.some(function (r) { return r.status === 'suggested'; })) {
        hint.textContent = 'Approve at least one Responsible Person linked to an approved Duty Holder to continue.';
      } else if (!concernHasAcceptedDutyHolders(c)) {
        hint.textContent = 'Approve Duty Holders above first — contacts are suggested for each organisation.';
      } else {
        hint.textContent = 'Add and approve at least one Responsible Person before examination.';
      }
    }
  }

  function renderConcernOnsiteSection(c) {
    const o = getConcernOnsiteEval(c);
    const date = document.getElementById('concern-onsite-date');
    const time = document.getElementById('concern-onsite-time');
    const dur = document.getElementById('concern-onsite-duration');
    const findings = document.getElementById('concern-onsite-findings');
    const done = document.getElementById('concern-onsite-visit-done');
    if (date) date.value = o.appointmentDate || '';
    if (time) time.value = o.appointmentTime || '';
    if (dur) dur.value = o.appointmentDuration || 'half';
    if (findings) findings.value = o.siteVisitNotes || '';
    if (done) done.checked = !!o.siteVisitDone;

    document.querySelectorAll('input[name="concern-onsite-audit"]').forEach(function (inp) {
      inp.checked = o.auditRequired === inp.value;
    });

    const auditReady = concernOnsiteAuditDecisionReady(c);
    const auditSection = document.getElementById('concern-onsite-audit-decision');
    const auditBlocked = document.getElementById('concern-onsite-audit-blocked');
    const auditBlockedText = document.getElementById('concern-onsite-audit-blocked-text');
    if (auditSection) auditSection.hidden = !auditReady;
    if (auditBlocked) auditBlocked.hidden = auditReady;
    if (auditBlockedText) auditBlockedText.textContent = concernOnsiteAuditBlockedHint(c) || 'Complete the steps above before deciding whether an audit is required.';

    if (typeof renderConcernOnsiteLetters === 'function') renderConcernOnsiteLetters(c);
  }

  function renderConcernWorkflowSections(c) {
    const triage = document.getElementById('concern-section-triage');
    const dh = document.getElementById('concern-section-dh');
    const remote = document.getElementById('concern-section-remote');
    const outcome = document.getElementById('concern-section-outcome');
    const auditDirect = document.getElementById('concern-section-audit-direct');
    const onsite = document.getElementById('concern-section-onsite');
    const closeSec = document.getElementById('concern-section-close');
    const canWork = !concernIsDelegatedAway(c);
    const showTriage = canWork && concernShowsTriage(c);
    const showDh = canWork && showTriage && concernShowsDutyHolders(c);
    const showRemote = canWork && concernShowsRemoteEval(c);
    const showOutcome = showRemote;
    const showAuditDirect = showRemote && c.deskOutcome === 'audit';
    const showOnsite = showRemote && c.deskOutcome === 'onsite_eval';
    const showClose = c.workflow === 'closed' || (canWork && concernCanClose(c));

    if (triage) triage.hidden = !showTriage;
    if (dh) {
      dh.hidden = !showDh;
      if (showDh) {
        ensureConcernDutyHolderSuggestions(c);
        renderConcernDutyHolders(getConcernById(c.id) || c);
        renderConcernResponsiblePersons(getConcernById(c.id) || c);
      }
    }
    if (remote) remote.hidden = !showRemote;
    if (outcome) outcome.hidden = !showOutcome;
    if (auditDirect) auditDirect.hidden = !showAuditDirect;
    if (onsite) onsite.hidden = !showOnsite;
    if (closeSec) closeSec.hidden = !showClose;

    const outcomeHint = document.getElementById('concern-outcome-hint');
    if (outcomeHint) {
      if (c.deskOutcome === 'no_action') outcomeHint.textContent = 'No further action — close with a reason when ready.';
      else if (c.deskOutcome === 'audit') outcomeHint.textContent = 'Audit will be created automatically on close.';
      else if (c.deskOutcome === 'onsite_eval') outcomeHint.textContent = 'Complete the on-site evaluation section below.';
      else outcomeHint.textContent = '';
    }

    if (showOnsite) renderConcernOnsiteSection(c);
    renderConcernCloseSection(c);

    const stageHint = document.getElementById('concern-detail-stage-hint');
    if (stageHint && c.workflow !== 'closed') {
      const stages = ['', 'Submission and intake', 'Assignment', 'Triage and decision', 'Examine the concern', 'Close'];
      stageHint.textContent = 'Stage ' + concernWorkflowStage(c) + ' of 5  ·  ' + stages[concernWorkflowStage(c)];
    }
  }

  function renderConcernCloseSection(c) {
    const open = document.getElementById('concern-close-open');
    const done = document.getElementById('concern-close-done');
    const blocked = document.getElementById('concern-close-blocked');
    const closeBtn = document.getElementById('concern-close-btn');
    if (!c || !open || !done) return;

    const isClosed = c.workflow === 'closed';
    open.hidden = isClosed;
    done.hidden = !isClosed;

    if (isClosed) {
      const txt = document.getElementById('concern-close-done-text');
      if (txt) txt.textContent = (c.closeReason || 'Closed.') + ' Default time 0.5h logged.';
      return;
    }

    const auditReq = concernAuditRequiredForClose(c);
    const helpEl = document.getElementById('concern-close-help');
    if (helpEl) {
      helpEl.textContent = auditReq
        ? 'Close this safety concern with a reason, then go straight to audit setup — premises and Duty Holders are pre-filled from this concern.'
        : 'Close with a reason. Default time 0.5h logged to this concern automatically.';
    }
    if (closeBtn) {
      closeBtn.disabled = !concernCanClose(c);
      closeBtn.textContent = auditReq ? 'Close and start audit →' : 'Close safety concern';
    }
    if (blocked) {
      blocked.hidden = concernCanClose(c);
      if (!concernCanClose(c)) blocked.textContent = 'Complete premises, assignment, triage and evaluation steps first.';
    }
  }

  function initConcernActivity() {
    const c = getConcernById(activeConcernId);
    if (c && c.activityLog) concernActivityLog = JSON.parse(JSON.stringify(c.activityLog));
    else if (!concernActivityLog.notes.length) {
      concernActivityLog = {
        notes: [{ id: 'sn1', text: 'Safety concern received via FIS intake.', at: 'Today', ts: Date.now() }],
        times: [], interim: [], files: []
      };
    }
    renderConcernActivity();
  }

  function renderConcernActivity() {
    const feed = document.getElementById('concern-activity-feed-list');
    const notesEl = document.getElementById('concern-count-notes');
    const timeEl = document.getElementById('concern-count-time');
    const noteCount = concernActivityLog.notes.length + concernActivityLog.interim.length;
    const totalMin = concernActivityLog.times.reduce(function (s, t) { return s + t.minutes; }, 0);
    const notesLabel = noteCount + (noteCount === 1 ? ' note' : ' notes');
    const timeLabel = (typeof formatAuditMinutes === 'function' ? formatAuditMinutes(totalMin) : totalMin + 'm') + ' logged';
    if (notesEl) notesEl.textContent = notesLabel;
    if (timeEl) timeEl.textContent = timeLabel;
    document.querySelectorAll('#concern-recent-on-concern .audit-recent-count-notes, #concern-recent-count-notes').forEach(function (el) { el.textContent = notesLabel; });
    document.querySelectorAll('#concern-recent-on-concern .audit-recent-count-time, #concern-recent-count-time').forEach(function (el) { el.textContent = timeLabel; });
    if (!feed) return;
    const items = [];
    concernActivityLog.times.forEach(function (t) { items.push({ ts: t.ts || 0, at: t.at, type: 'time', activity: t.activity, minutes: t.minutes }); });
    concernActivityLog.notes.forEach(function (n) { items.push({ ts: n.ts || 0, at: n.at, type: 'note', text: n.text }); });
    concernActivityLog.interim.forEach(function (n) { items.push({ ts: n.ts || 0, at: n.at, type: 'interim', title: n.title, text: n.text }); });
    concernActivityLog.files.forEach(function (f) { items.push({ ts: f.ts || 0, at: f.at, type: 'file', name: f.name, description: f.description }); });
    items.sort(function (a, b) { return b.ts - a.ts; });
    const filtered = concernActivityFeedFilter === 'all' ? items : items.filter(function (i) { return i.type === concernActivityFeedFilter; });
    if (!filtered.length) {
      feed.innerHTML = '<div class="audit-feed-empty">No activity logged yet on this safety concern.</div>';
      return;
    }
    feed.innerHTML = filtered.map(function (item) {
      let pillClass = 'grey', pillLabel = 'Note', textHtml = escHtml(item.text || '');
      if (item.type === 'time') { pillClass = 'blue'; pillLabel = 'Time'; textHtml = escHtml(item.activity) + ' · <strong>' + escHtml(String(item.minutes)) + 'm</strong>'; }
      else if (item.type === 'interim') { pillClass = 'amber'; pillLabel = 'Interim'; textHtml = '<strong>' + escHtml(item.title) + '</strong>'; }
      else if (item.type === 'file') { pillClass = 'purple'; pillLabel = 'File'; textHtml = '<strong>' + escHtml(item.name) + '</strong>'; }
      return '<div class="audit-feed-item"><div class="audit-feed-meta"><span class="audit-feed-when">' + escHtml(item.at) + '</span></div>' +
        '<div class="audit-feed-body"><span class="pill ' + pillClass + '">' + pillLabel + '</span><span class="audit-feed-text">' + textHtml + '</span></div></div>';
    }).join('');
  }

  function initConcernDetailPage() {
    loadScOverrides();
    const c = getConcernById(activeConcernId);
    if (!c) { show('concerns'); return; }

    const title = document.getElementById('concern-detail-title');
    const meta = document.getElementById('concern-detail-meta');
    if (title) title.textContent = c.ref;
    if (meta) {
      meta.innerHTML = '<span class="pill ' + c.severity + '">' + ({ red: 'Red', amber: 'Amber', green: 'Green' }[c.severity]) + '</span> ' +
        escHtml(SC_WORKFLOW_LABELS[c.workflow] || c.workflow) + '  ·  ' + escHtml(c.when) +
        (c.assignee ? '  ·  ' + escHtml(c.assignee) : '');
    }

    renderConcernRagBanner(c);
    renderConcernIntakeGrid(c);
    renderConcernPremisesPanel(c);
    renderConcernSeverityField(c);
    renderConcernAssigneeHint(c);
    renderConcernKeyFieldHighlights(c);

    const assignee = document.getElementById('concern-assignee');
    const review = document.getElementById('concern-review-notes');
    const desk = document.getElementById('concern-desk-notes');
    if (assignee) assignee.value = c.assignee || '';
    if (review) review.value = c.reviewNotes || '';
    if (desk) desk.value = c.deskNotes || '';

    document.querySelectorAll('input[name="concern-further-action"]').forEach(function (inp) {
      inp.checked = c.furtherAction === inp.value;
    });
    document.querySelectorAll('input[name="concern-desk-outcome"]').forEach(function (inp) {
      inp.checked = c.deskOutcome === inp.value;
    });

    if (concernDetailLastId !== activeConcernId) concernSeverityEditing = false;
    concernDetailLastId = activeConcernId;
    initConcernActivity();
    renderConcernWorkflowSections(c);
    setConcernActivityBarVisible(c.workflow !== 'closed' && !concernIsDelegatedAway(c));
  }

  function refreshConcernDetailPage() {
    initConcernDetailPage();
  }

  function saveConcernAssignment() {
    const c = getConcernById(activeConcernId);
    if (!c) return;
    const assignee = document.getElementById('concern-assignee')?.value || '';
    let workflow = c.workflow;
    if (assignee && (workflow === 'unassigned' || workflow === 'incoming')) workflow = 'assigned';
    if (assignee && workflow === 'assigned') workflow = 'triage';
    if (!assignee) workflow = c.premises ? 'unassigned' : c.workflow;
    persistConcernPatch(activeConcernId, { assignee: assignee || null, workflow: workflow });
    refreshConcernDetailPage();
    renderConcernsLists();
  }

  function saveConcernPremises(name) {
    const c = getConcernById(activeConcernId);
    if (!c) return;
    const premises = name || null;
    let workflow = c.workflow;
    if (premises && workflow === 'awaiting_premises') workflow = 'unassigned';
    if (!premises) workflow = 'awaiting_premises';
    persistConcernPatch(activeConcernId, { premises: premises, workflow: workflow, dutyHolders: [] });
    refreshConcernDetailPage();
    renderConcernsLists();
  }

  function openConcernPremisesEdit() {
    if (typeof setupLookupTarget !== 'undefined') setupLookupTarget = 'concern';
    if (typeof openSetupLookupModal === 'function') openSetupLookupModal('premises');
  }

  function saveConcernSeverity() {
    const sev = document.getElementById('concern-severity-select')?.value;
    if (!sev) return;
    persistConcernPatch(activeConcernId, { severity: sev });
    concernSeverityEditing = false;
    refreshConcernDetailPage();
  }

  function openConcernSeverityEdit() { concernSeverityEditing = true; renderConcernSeverityField(getConcernById(activeConcernId)); }
  function cancelConcernSeverityEdit() { concernSeverityEditing = false; renderConcernSeverityField(getConcernById(activeConcernId)); }

  function saveConcernFurtherAction() {
    const picked = document.querySelector('input[name="concern-further-action"]:checked');
    if (!picked) return;
    const val = picked.value;
    let workflow = 'triage';
    if (val === 'yes') workflow = 'desk_eval';
    persistConcernPatch(activeConcernId, { furtherAction: val, workflow: workflow });
    refreshConcernDetailPage();
  }

  function saveConcernReviewNotes() {
    const text = document.getElementById('concern-review-notes')?.value || '';
    persistConcernPatch(activeConcernId, { reviewNotes: text });
  }

  function saveConcernDeskNotes() {
    const text = document.getElementById('concern-desk-notes')?.value || '';
    persistConcernPatch(activeConcernId, { deskNotes: text, workflow: 'desk_eval' });
  }

  function saveConcernDeskOutcome() {
    const picked = document.querySelector('input[name="concern-desk-outcome"]:checked');
    if (!picked) return;
    persistConcernPatch(activeConcernId, { deskOutcome: picked.value, workflow: 'desk_eval' });
    refreshConcernDetailPage();
  }

  function saveConcernOnsiteEval() {
    const c = getConcernById(activeConcernId);
    if (!c) return;
    const o = Object.assign({}, getConcernOnsiteEval(c), {
      appointmentDate: document.getElementById('concern-onsite-date')?.value || '',
      appointmentTime: document.getElementById('concern-onsite-time')?.value || '',
      appointmentDuration: document.getElementById('concern-onsite-duration')?.value || 'half',
      appointmentConfirmed: true,
      siteVisitNotes: document.getElementById('concern-onsite-findings')?.value || '',
      siteVisitDone: !!document.getElementById('concern-onsite-visit-done')?.checked
    });
    persistConcernPatch(activeConcernId, { onsiteEval: o, workflow: 'desk_eval' });
    refreshConcernDetailPage();
  }

  function saveConcernOnsiteAuditDecision() {
    const picked = document.querySelector('input[name="concern-onsite-audit"]:checked');
    if (!picked) return;
    const c = getConcernById(activeConcernId);
    if (!c) return;
    const o = Object.assign({}, getConcernOnsiteEval(c), { auditRequired: picked.value });
    persistConcernPatch(activeConcernId, {
      onsiteEval: o,
      workflow: 'desk_eval',
      auditRequired: picked.value === 'yes' ? 'yes' : 'no'
    });
    refreshConcernDetailPage();
  }

  function skipConcernOnsiteLetter() {
    const c = getConcernById(activeConcernId);
    if (!c) return;
    const o = Object.assign({}, getConcernOnsiteEval(c), { letterSkipped: true, letterSent: false });
    persistConcernPatch(activeConcernId, { onsiteEval: o });
    refreshConcernDetailPage();
  }

  function appendConcernLettersToActivity(letters, stamp) {
    letters.forEach(function (ltr, i) {
      concernActivityLog.files.unshift({
        id: 'cf-' + (stamp.ts - i),
        name: ltr.fileName,
        description: ltr.templateLabel + ' · ' + ltr.recipientName,
        at: ltr.at,
        ts: stamp.ts - i
      });
    });
    if (letters.length) {
      concernActivityLog.notes.unshift({
        id: 'cn-ltr-' + stamp.ts,
        text: letters.length === 1
          ? 'Appointment letter saved for ' + letters[0].recipientName + '.'
          : letters.length + ' appointment letters saved.',
        at: stamp.at,
        ts: stamp.ts
      });
    }
    persistConcernPatch(activeConcernId, { activityLog: concernActivityLog });
  }

  function closeConcernOneClick() {
    const c = getConcernById(activeConcernId);
    if (!c || !concernCanClose(c)) {
      alert('Complete required steps before closing.');
      return;
    }
    const reason = document.getElementById('concern-close-reason')?.value?.trim();
    if (!reason) { alert('Enter a reason for closing.'); return; }
    const startAudit = concernAuditRequiredForClose(c);
    const patch = {
      workflow: 'closed',
      closeReason: reason,
      closedAt: new Date().toISOString(),
      activityLog: concernActivityLog
    };
    let spawnedAuditId = null;
    if (startAudit) {
      spawnedAuditId = 'A-2026-' + String(3300 + Math.floor(Math.random() * 100));
      patch.spawnedAuditId = spawnedAuditId;
      patch.auditRequired = 'yes';
    } else if (c.furtherAction === 'no') {
      patch.auditRequired = 'no';
    }
    persistConcernPatch(activeConcernId, patch);
    renderConcernsLists();
    if (startAudit && spawnedAuditId && typeof seedAuditSetupFromConcern === 'function') {
      seedAuditSetupFromConcern(Object.assign({}, c, patch), spawnedAuditId);
      if (typeof openAuditSetup === 'function') openAuditSetup(spawnedAuditId);
    } else {
      refreshConcernDetailPage();
    }
  }

  function acceptConcernDutyHolder(id) {
    const c = getConcernById(activeConcernId);
    if (!c) return;
    const record = getConcernDutyHolderRecords(c).find(function (d) { return d.id === id; });
    const holders = getConcernDutyHolderRecords(c).map(function (d) {
      if (d.id === id) {
        return Object.assign({}, d, {
          status: 'accepted',
          key: d.key || (typeof SETUP_DH_KEY_BY_NAME !== 'undefined' ? SETUP_DH_KEY_BY_NAME[d.name] : null)
        });
      }
      return d;
    });
    persistConcernPatch(activeConcernId, { dutyHolders: holders });
    const dhKey = record && getConcernDhKey(Object.assign({}, record, { status: 'accepted' }));
    if (dhKey) suggestConcernRpsForDh(dhKey);
    refreshConcernDetailPage();
  }

  function acceptConcernResponsiblePerson(id) {
    const c = getConcernById(activeConcernId);
    if (!c) return;
    const rps = (c.responsiblePersons || []).map(function (r) {
      return r.id === id ? Object.assign({}, r, { status: 'accepted' }) : r;
    });
    persistConcernPatch(activeConcernId, { responsiblePersons: rps });
    refreshConcernDetailPage();
  }

  function removeConcernResponsiblePerson(id) {
    const c = getConcernById(activeConcernId);
    if (!c) return;
    persistConcernPatch(activeConcernId, {
      responsiblePersons: (c.responsiblePersons || []).filter(function (r) { return r.id !== id; })
    });
    refreshConcernDetailPage();
  }

  function removeConcernDutyHolder(id) {
    const c = getConcernById(activeConcernId);
    if (!c) return;
    persistConcernPatch(activeConcernId, { dutyHolders: getConcernDutyHolderRecords(c).filter(function (d) { return d.id !== id; }) });
    refreshConcernDetailPage();
  }

  function addConcernDutyHolder() {
    if (typeof setupLookupTarget !== 'undefined') setupLookupTarget = 'concern';
    if (typeof openSetupLookupModal === 'function') openSetupLookupModal('dutyHolder');
  }

  function addConcernResponsiblePerson() {
    if (typeof setupLookupTarget !== 'undefined') setupLookupTarget = 'concern';
    if (typeof openSetupLookupModal === 'function') openSetupLookupModal('responsiblePerson');
  }

  function setConcernActivityBarVisible(visible) {
    document.body.classList.toggle('concern-activity-bar', visible);
    if (!visible) document.body.classList.remove('concern-float-panel-open');
  }

  function openConcernFloatPanel(mode) {
    const panel = document.getElementById('concern-float-panel');
    if (!panel) return;
    setConcernActivityBarVisible(true);
    setConcernLogType(mode || concernLogType || 'time');
    if (typeof resetActivityLogDate === 'function') resetActivityLogDate('concern-time-date');
    panel.classList.add('open');
    panel.setAttribute('aria-hidden', 'false');
    document.body.classList.add('concern-float-panel-open');
  }

  function closeConcernFloatPanel() {
    const panel = document.getElementById('concern-float-panel');
    if (panel) { panel.classList.remove('open'); panel.setAttribute('aria-hidden', 'true'); }
    document.body.classList.remove('concern-float-panel-open');
  }

  function submitConcernLog() {
    const stamp = typeof cpinLogTimestamp === 'function' ? cpinLogTimestamp() : { at: 'Today', ts: Date.now() };
    if (concernLogType === 'note') {
      const text = document.getElementById('concern-note-text')?.value?.trim();
      if (!text) { alert('Enter a note.'); return; }
      concernActivityLog.notes.unshift({ id: 'sn' + stamp.ts, text: text, at: stamp.at, ts: stamp.ts });
      document.getElementById('concern-note-text').value = '';
    } else if (concernLogType === 'time') {
      const timeStamp = typeof getActivityLogStampForTime === 'function'
        ? getActivityLogStampForTime('concern-time-date')
        : (typeof cpinLogTimestamp === 'function' ? cpinLogTimestamp() : { at: 'Today', ts: Date.now(), logDate: null });
      if (!timeStamp) return;
      concernActivityLog.times.unshift({
        id: 'st' + timeStamp.ts,
        activity: document.getElementById('concern-time-activity')?.value || 'Desk-based investigation',
        minutes: parseInt(document.getElementById('concern-time-duration')?.value || '30', 10),
        at: timeStamp.at,
        ts: timeStamp.ts,
        logDate: timeStamp.logDate
      });
    }
    persistConcernPatch(activeConcernId, { activityLog: concernActivityLog });
    renderConcernActivity();
    closeConcernFloatPanel();
  }

  function setConcernLogType(type) {
    concernLogType = type;
    ['time', 'note', 'interim', 'file'].forEach(function (t) {
      const el = document.getElementById('concern-log-fields-' + t);
      if (el) el.hidden = t !== type;
    });
    document.querySelectorAll('#concern-log-type-row .chip').forEach(function (chip) {
      chip.classList.toggle('active', chip.dataset.concernLogType === type);
    });
  }

  /* Expose globals */
  window.initConcernsPage = initConcernsPage;
  window.switchConcernsTab = switchConcernsTab;
  window.layoutConcernViews = layoutConcernViews;
  window.toggleConcernViewMenu = toggleConcernViewMenu;
  window.initConcernDetailPage = initConcernDetailPage;
  window.openConcern = openConcern;
  window.toggleConcernPin = toggleConcernPin;
  window.saveConcernAssignment = saveConcernAssignment;
  window.saveConcernPremises = saveConcernPremises;
  window.openConcernPremisesEdit = openConcernPremisesEdit;
  window.saveConcernSeverity = saveConcernSeverity;
  window.openConcernSeverityEdit = openConcernSeverityEdit;
  window.cancelConcernSeverityEdit = cancelConcernSeverityEdit;
  window.saveConcernFurtherAction = saveConcernFurtherAction;
  window.saveConcernReviewNotes = saveConcernReviewNotes;
  window.saveConcernDeskNotes = saveConcernDeskNotes;
  window.saveConcernDeskOutcome = saveConcernDeskOutcome;
  window.saveConcernOnsiteEval = saveConcernOnsiteEval;
  window.saveConcernOnsiteAuditDecision = saveConcernOnsiteAuditDecision;
  window.skipConcernOnsiteLetter = skipConcernOnsiteLetter;
  window.closeConcernOneClick = closeConcernOneClick;
  window.acceptConcernDutyHolder = acceptConcernDutyHolder;
  window.removeConcernDutyHolder = removeConcernDutyHolder;
  window.addConcernDutyHolder = addConcernDutyHolder;
  window.addConcernResponsiblePerson = addConcernResponsiblePerson;
  window.acceptConcernResponsiblePerson = acceptConcernResponsiblePerson;
  window.removeConcernResponsiblePerson = removeConcernResponsiblePerson;
  window.getConcernOnsiteEval = getConcernOnsiteEval;
  window.getConcernSavedLetters = getConcernSavedLetters;
  window.getConcernLetterRecipients = getConcernLetterRecipients;
  window.appendConcernLettersToActivity = appendConcernLettersToActivity;
  window.concernOnsiteLettersComplete = concernOnsiteLettersComplete;
  window.setConcernActivityBarVisible = setConcernActivityBarVisible;
  window.openConcernFloatPanel = openConcernFloatPanel;
  window.closeConcernFloatPanel = closeConcernFloatPanel;
  window.submitConcernLog = submitConcernLog;
  window.setConcernLogType = setConcernLogType;
  window.getConcernById = getConcernById;
  window.persistConcernPatch = persistConcernPatch;
  window.activeConcernId = function () { return activeConcernId; };
  window.setActiveConcernId = function (id) { activeConcernId = id; };
  window.saveScIntakeFromForm = saveScIntakeFromForm;
})();
