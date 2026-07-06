/* Building Control Consultation — mirrors Safety Concern / CPIN workflow patterns */
(function () {
  'use strict';

  const BCC_PIN_KEY = 'bcc-pins-v1';
  const BCC_OVERRIDE_KEY = 'bcc-overrides-v1';
  const BCC_INTAKE_KEY = 'cpfsi-bcc-intake-v1';
  const BCC_CURRENT_INSPECTOR = 'Phil Gower';
  const BCC_SLA_DAYS = 15;
  const BCC_SLA_ALERT_DAYS = 5;
  const BCC_IN_PROGRESS_WF = new Set(['assigned', 'review', 'awaiting_info', 'outcome']);

  const BCC_WORKFLOW_LABELS = {
    incoming: 'Incoming',
    awaiting_premises: 'Awaiting premises',
    unassigned: 'Unassigned',
    assigned: 'Assigned',
    review: 'Review',
    awaiting_info: 'Awaiting information',
    outcome: 'Issue outcome',
    closed: 'Closed'
  };

  const BCC_DH_BY_PREMISES = {
    'Bristol Crown Court': ['HMCTS', 'Equans', 'Bristol City Council Building Control'],
    'Charing Cross House refurb': ['MoJ', 'Capita Facilities Management', 'Westminster Building Control'],
    'Temple Quay House': ['HMCTS', 'Equans', 'Property Directorate'],
    'MoJ HQ London': ['Ministry of Justice Property', 'Equans'],
    'HMP Bristol': ['HMPPS - South West', 'Serco FM']
  };

  const BCC_INCOMING = [
    {
      id: 'cons-in-0093',
      ref: 'C-2026-0093',
      when: '2 hr ago',
      premises: null,
      summary: 'Fire strategy — premises not auto-matched',
      patch: false,
      workflow: 'awaiting_premises',
      assignee: null,
      slaDaysRemaining: 15,
      intake: {
        submissionRef: 'BCC-EMAIL-8841',
        receivedDate: '06/07/2026',
        buildingControlBody: 'Private building control (LABC member)',
        projectType: 'Refurbishment',
        sharePointUrl: 'https://sharepoint.example/sites/bcc/inbox/8841',
        premisesFree: 'Government office, Victoria Street, London SW1'
      }
    }
  ];

  const BCC_MINE = [
    {
      id: 'cons-0089',
      ref: 'C-2026-0089',
      when: '10 days ago',
      premises: 'Charing Cross House refurb',
      summary: 'MoJ refurbishment — fire strategy and compartmentation plans',
      patch: true,
      workflow: 'review',
      assignee: 'Phil Gower',
      teamMembers: ['Sarah Chen'],
      slaDaysRemaining: 5,
      reviewNotes: 'Plans received via email. Compartmentation drawings on levels 3–5 under review.',
      infoDecision: 'yes',
      dutyHolders: [
        { id: 'dh-moj', key: 'propdir', name: 'MoJ', role: 'Government department  ·  Project authority', initials: 'MJ', fromPremises: true, status: 'accepted' },
        { id: 'dh-bc', name: 'Westminster Building Control', role: 'Building Control body  ·  Consultation submitter', initials: 'BC', fromPremises: true, status: 'accepted' }
      ],
      responsiblePersons: [
        { id: 'rp-moj-1', key: 'moj-fm', name: 'Capita FM — Charing Cross', role: 'Facilities manager', initials: 'CF', fromPremises: true, status: 'accepted', linkedDh: 'propdir' }
      ],
      intake: {
        submissionRef: 'BCC-2026-0089',
        receivedDate: '26/06/2026',
        buildingControlBody: 'Westminster City Council Building Control',
        projectType: 'Refurbishment',
        sharePointUrl: 'https://sharepoint.example/sites/bcc/C-2026-0089',
        description: 'Full fire strategy, compartmentation drawings and evacuation strategy for MoJ refurbishment.'
      }
    }
  ];

  const BCC_UNASSIGNED = [
    {
      id: 'cons-0075',
      ref: 'C-2026-0075',
      when: '1 day ago',
      premises: 'Bristol Crown Court',
      summary: 'New build extension — architect plans and consultation form',
      patch: false,
      workflow: 'unassigned',
      assignee: null,
      slaDaysRemaining: 3,
      intake: {
        submissionRef: 'BCC-2026-0075',
        receivedDate: '05/07/2026',
        buildingControlBody: 'Bristol City Council Building Control',
        projectType: 'New build',
        sharePointUrl: 'https://sharepoint.example/sites/bcc/C-2026-0075',
        description: 'Proposed extension to rear court building — fire strategy, plans and site map attached to SharePoint folder.'
      }
    }
  ];

  const BCC_COMPLETED = [
    {
      id: 'cons-c-0062',
      ref: 'C-2026-0062',
      when: '18 May 2026',
      premises: 'Temple Quay House',
      summary: 'Plant room relocation — no comments letter issued',
      patch: true,
      workflow: 'closed',
      assignee: 'Phil Gower',
      closeReason: 'No comments — plans satisfactory. No comments letter sent 16 May.',
      outcomeDecision: 'no_comments',
      intake: { buildingControlBody: 'Private approved inspector', projectType: 'Refurbishment' }
    }
  ];

  let bccPins = new Set();
  let bccOverrides = {};
  let consultationsSlaFilter = 'all';
  let consultationsQueueFilter = 'all';
  let consultationsActiveTab = 'all';
  let activeConsultationId = null;
  let consultationDetailLastId = null;
  let consultationsSortMode = 'recent';
  let consultationActivityLog = { notes: [], times: [], interim: [], files: [] };
  let consultationLogType = 'time';
  let consultationActivityFeedFilter = 'all';

  function loadBccPins() {
    try {
      const raw = localStorage.getItem(BCC_PIN_KEY);
      if (raw) bccPins = new Set(JSON.parse(raw));
    } catch (e) { bccPins = new Set(); }
  }

  function saveBccPins() {
    localStorage.setItem(BCC_PIN_KEY, JSON.stringify(Array.from(bccPins)));
  }

  function loadBccOverrides() {
    try {
      const raw = localStorage.getItem(BCC_OVERRIDE_KEY);
      if (raw) bccOverrides = JSON.parse(raw);
    } catch (e) { bccOverrides = {}; }
  }

  function saveBccOverrides() {
    localStorage.setItem(BCC_OVERRIDE_KEY, JSON.stringify(bccOverrides));
  }

  function mergeConsultationRecord(base) {
    return Object.assign({}, base, bccOverrides[base.id] || {});
  }

  function loadBccIntake() {
    try {
      return JSON.parse(localStorage.getItem(BCC_INTAKE_KEY) || '[]');
    } catch (e) {
      return [];
    }
  }

  function saveBccIntake(records) {
    localStorage.setItem(BCC_INTAKE_KEY, JSON.stringify(records));
  }

  function getAllConsultationRecords() {
    const seen = new Set();
    const out = [];
    loadBccIntake().concat(BCC_INCOMING, BCC_MINE, BCC_UNASSIGNED, BCC_COMPLETED).forEach(function (c) {
      if (seen.has(c.id)) return;
      seen.add(c.id);
      out.push(mergeConsultationRecord(c));
    });
    return out;
  }

  function getConsultationById(id) {
    return getAllConsultationRecords().find(function (c) { return c.id === id; }) || null;
  }

  function getConsultationByRef(ref) {
    return getAllConsultationRecords().find(function (c) { return c.ref === ref; }) || null;
  }

  function consultationRouteForRef(ref) {
    const part = String(ref || '').replace(/^C-2026-/, '');
    return part ? 'consultation/cons-' + part : 'consultations';
  }

  function persistConsultationPatch(id, patch) {
    bccOverrides[id] = Object.assign({}, bccOverrides[id] || {}, patch);
    saveBccOverrides();
  }

  function bccNeedsPremises(c) {
    return !c.premises && (c.workflow === 'awaiting_premises' || c.workflow === 'incoming');
  }

  function bccIsInProgress(c) {
    return c.workflow !== 'closed' && BCC_IN_PROGRESS_WF.has(c.workflow) && !!c.assignee;
  }

  function bccSlaPaused(c) {
    return c && c.workflow === 'awaiting_info';
  }

  function bccSlaClass(c) {
    if (!c || c.workflow === 'closed') return 'green';
    if (bccSlaPaused(c)) return 'grey';
    const days = c.slaDaysRemaining == null ? BCC_SLA_DAYS : c.slaDaysRemaining;
    if (days <= 0) return 'red';
    if (days <= BCC_SLA_ALERT_DAYS) return 'amber';
    return 'green';
  }

  function bccSlaLabel(c) {
    if (!c || c.workflow === 'closed') return '';
    if (bccSlaPaused(c)) return 'SLA paused — awaiting information';
    const days = c.slaDaysRemaining == null ? BCC_SLA_DAYS : c.slaDaysRemaining;
    if (days <= 0) return 'SLA overdue';
    if (days === 1) return '1 day remaining';
    return days + ' days remaining';
  }

  function bccSlaDetail(c) {
    if (!c || c.workflow === 'closed') return '';
    if (bccSlaPaused(c)) return '15-day SLA timer paused while building control responds to insufficient information request.';
    return BCC_SLA_DAYS + '-day consultation SLA  ·  Alert at ' + BCC_SLA_ALERT_DAYS + ' days';
  }

  function consultationRowStatusLabel(item) {
    if (item.workflow === 'closed') return '';
    if (bccNeedsPremises(item)) return 'Premises needed';
    if (!item.assignee) return 'Unassigned';
    if (bccIsInProgress(item)) return 'In progress';
    return '';
  }

  function consultationMatchesFilter(item) {
    if (consultationsSlaFilter !== 'all') {
      const cls = bccSlaClass(item);
      if (consultationsSlaFilter === 'urgent' && cls !== 'red' && cls !== 'amber') return false;
      if (consultationsSlaFilter === 'paused' && !bccSlaPaused(item)) return false;
      if (consultationsSlaFilter === 'ok' && cls !== 'green') return false;
    }
    if (consultationsQueueFilter === 'patch' && !item.patch) return false;
    if (consultationsQueueFilter === 'in-progress' && !bccIsInProgress(item)) return false;
    if (consultationsQueueFilter === 'sla' && bccSlaClass(item) === 'green' && !bccSlaPaused(item)) return false;
    return true;
  }

  function getConsultationsForTab(tab) {
    const all = getAllConsultationRecords();
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
        return c.assignee === BCC_CURRENT_INSPECTOR && BCC_IN_PROGRESS_WF.has(c.workflow);
      });
    }
    if (tab === 'premises-needed') return open.filter(bccNeedsPremises);
    return open;
  }

  function sortConsultationItems(items, mode) {
    const list = items.slice();
    if (mode === 'sla') {
      list.sort(function (a, b) {
        const sa = a.slaDaysRemaining == null ? 999 : a.slaDaysRemaining;
        const sb = b.slaDaysRemaining == null ? 999 : b.slaDaysRemaining;
        return sa - sb;
      });
    } else if (mode === 'name') {
      list.sort(function (a, b) { return (a.premises || '').localeCompare(b.premises || ''); });
    }
    return list;
  }

  function buildConsultationCard(item) {
    const pinned = bccPins.has(item.id);
    const slaCls = bccSlaClass(item);
    const slaText = bccSlaLabel(item) || 'Closed';
    const statusLabel = consultationRowStatusLabel(item);
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

    return '<div class="cpin-card ' + slaCls + (pinned ? ' is-pinned' : '') + '" role="button" tabindex="0" onclick="openConsultation(\'' + item.id + '\', event)" onkeydown="if(event.key===\'Enter\'||event.key===\' \'){openConsultation(\'' + item.id + '\', event);}">' +
      '<div class="cpin-severity"><span class="pill ' + slaCls + '">' + escHtml(slaText) + '</span></div>' +
      '<div class="cpin-body">' +
        '<div style="font-size:12px;color:var(--ink-3);">' + escHtml(item.ref) + '  ·  ' + escHtml(item.when) + '</div>' +
        premisesHtml +
        '<div class="summary">' + escHtml(item.summary) + '</div>' +
        statusHtml +
      '</div>' +
      '<div class="cpin-meta">' + assigneeHtml +
        '<button type="button" class="cpin-pin' + (pinned ? ' pinned' : '') + '" title="' + (pinned ? 'Unpin' : 'Pin') + '" onclick="toggleConsultationPin(\'' + item.id + '\', event)">' + (pinned ? '★' : '☆') + '</button>' +
      '</div></div>';
  }

  function renderConsultationCardsHtml(items) {
    const pinned = sortConsultationItems(items.filter(function (i) { return bccPins.has(i.id); }), consultationsSortMode);
    const rest = sortConsultationItems(items.filter(function (i) { return !bccPins.has(i.id); }), consultationsSortMode);
    let html = '';
    if (pinned.length) {
      html += '<section class="cpins-pinned-section" aria-label="Pinned consultations">' +
        '<h3 class="cpins-section-label"><span class="star" aria-hidden="true">★</span> Pinned</h3>' +
        '<div class="cpins-card-stack">' + pinned.map(buildConsultationCard).join('') + '</div></section>';
    }
    if (rest.length) {
      html += '<div class="cpins-card-stack' + (pinned.length ? ' cpins-card-stack--rest' : '') + '">' + rest.map(buildConsultationCard).join('') + '</div>';
    }
    return html;
  }

  function renderConsultationPanel(panelId, items, emptyMsg) {
    const el = document.getElementById(panelId);
    if (!el) return;
    const filtered = items.filter(consultationMatchesFilter);
    const countEl = document.getElementById('consultation-results-count');
    if (countEl && panelId === 'consultations-panel-list') countEl.textContent = String(filtered.length);
    if (!filtered.length) {
      el.innerHTML = '<div class="audit-feed-empty" style="margin:24px 0;">' + escHtml(emptyMsg) + '</div>';
      return;
    }
    el.innerHTML = renderConsultationCardsHtml(filtered);
  }

  function renderConsultationsLists() {
    const emptyMsgs = {
      all: 'No open consultations match this filter.',
      unassigned: 'No unassigned consultations match this filter.',
      'premises-needed': 'No consultations needing premises match this filter.',
      mine: 'No consultations assigned to you match this filter.',
      closed: 'No closed consultations match this filter.'
    };
    const closedPanel = document.getElementById('consultations-panel-closed');
    const listPanel = document.getElementById('consultations-panel-list');
    if (consultationsActiveTab === 'closed') {
      if (listPanel) listPanel.hidden = true;
      if (closedPanel) closedPanel.hidden = false;
      const el = document.getElementById('consultations-completed-list');
      const filtered = BCC_COMPLETED.map(mergeConsultationRecord).filter(consultationMatchesFilter);
      if (el) {
        el.innerHTML = filtered.length ? renderConsultationCardsHtml(filtered) : '<div class="audit-feed-empty" style="margin:24px 0;">No closed consultations.</div>';
      }
      const countEl = document.getElementById('consultation-results-count');
      if (countEl) countEl.textContent = String(filtered.length);
    } else {
      if (listPanel) listPanel.hidden = false;
      if (closedPanel) closedPanel.hidden = true;
      renderConsultationPanel('consultations-panel-list', getConsultationsForTab(consultationsActiveTab), emptyMsgs[consultationsActiveTab] || emptyMsgs.all);
    }
    document.querySelectorAll('[data-consultation-view-count]').forEach(function (el) {
      const tab = el.dataset.consultationViewCount;
      const n = getConsultationsForTab(tab).filter(consultationMatchesFilter).length;
      el.textContent = n ? String(n) : '';
    });
  }

  function syncConsultationFilterChips() {
    document.querySelectorAll('.consultation-filters-sla [data-consultation-filter]').forEach(function (item) {
      item.classList.toggle('active', item.dataset.consultationFilter === consultationsSlaFilter);
    });
    syncConsultationToggleFilterChips('.consultation-filters-queue', 'consultationFilter', consultationsQueueFilter);
  }

  function syncConsultationToggleFilterChips(containerSelector, filterAttr, activeFilter) {
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

  function setConsultationSlaFilter(filter) {
    if (consultationsSlaFilter === filter && filter !== 'all') consultationsSlaFilter = 'all';
    else consultationsSlaFilter = filter;
    syncConsultationFilterChips();
    renderConsultationsLists();
  }

  function setConsultationQueueFilter(filter) {
    if (consultationsQueueFilter === filter && filter !== 'all') consultationsQueueFilter = 'all';
    else consultationsQueueFilter = filter;
    syncConsultationFilterChips();
    renderConsultationsLists();
  }

  const CONSULTATION_VIEW_LABELS = {
    all: 'All',
    unassigned: 'Unassigned',
    'premises-needed': 'Premises needed',
    mine: 'My consultations',
    closed: 'Closed'
  };

  function closeConsultationViewMenu() {
    const menu = document.getElementById('consultation-view-menu');
    const btn = document.getElementById('consultation-view-toggle');
    if (menu) menu.hidden = true;
    if (btn) btn.setAttribute('aria-expanded', 'false');
  }

  function layoutConsultationViews() {
    const stack = document.getElementById('consultation-sidebar-stack');
    const sidebar = document.getElementById('consultation-views-sidebar');
    const menu = document.getElementById('consultation-view-menu');
    if (!stack || !sidebar || !menu) return;
    if (typeof isMobileNavLayout === 'function' && isMobileNavLayout()) {
      if (stack.parentElement !== menu) menu.appendChild(stack);
      sidebar.hidden = true;
    } else {
      if (stack.parentElement !== sidebar) sidebar.appendChild(stack);
      sidebar.hidden = false;
      closeConsultationViewMenu();
    }
  }

  function toggleConsultationViewMenu() {
    layoutConsultationViews();
    const menu = document.getElementById('consultation-view-menu');
    const btn = document.getElementById('consultation-view-toggle');
    if (!menu || !btn) return;
    const open = menu.hidden;
    menu.hidden = !open;
    btn.setAttribute('aria-expanded', String(open));
  }

  function switchConsultationsTab(tab) {
    consultationsActiveTab = tab || 'all';
    document.querySelectorAll('[data-consultation-view]').forEach(function (el) {
      el.classList.toggle('active', el.dataset.consultationView === tab);
    });
    const sel = document.getElementById('consultation-view-selected');
    if (sel) sel.textContent = CONSULTATION_VIEW_LABELS[tab] || tab;
    closeConsultationViewMenu();
    renderConsultationsLists();
  }

  function toggleConsultationPin(id, e) {
    if (e) { e.preventDefault(); e.stopPropagation(); }
    if (bccPins.has(id)) bccPins.delete(id); else bccPins.add(id);
    saveBccPins();
    renderConsultationsLists();
  }

  function openConsultation(id, e) {
    if (e) e.stopPropagation();
    show('consultation/' + id);
  }

  function initConsultationsPage() {
    layoutConsultationViews();
    loadBccPins();
    loadBccOverrides();
    if (!document.getElementById('consultations')?.dataset.viewsBound) {
      const rail = document.getElementById('consultation-views-rail');
      if (rail) {
        rail.addEventListener('click', function (e) {
          const item = e.target.closest('.view-item[data-consultation-view]');
          if (item) switchConsultationsTab(item.dataset.consultationView);
        });
      }
      document.querySelectorAll('.consultation-filters-sla [data-consultation-filter]').forEach(function (el) {
        el.addEventListener('click', function () { setConsultationSlaFilter(el.dataset.consultationFilter); });
      });
      document.querySelectorAll('.consultation-filters-queue .chip').forEach(function (chip) {
        chip.addEventListener('click', function (e) {
          if (e.target.closest('.chip-dismiss')) {
            setConsultationQueueFilter('all');
            return;
          }
          setConsultationQueueFilter(chip.dataset.consultationFilter);
        });
      });
      document.getElementById('consultations').dataset.viewsBound = '1';
    }
    syncConsultationFilterChips();
    renderConsultationsLists();
  }

  function getConsultationDutyHolderRecords(c) {
    return (c && c.dutyHolders) ? c.dutyHolders.filter(function (d) { return d.status !== 'rejected'; }) : [];
  }

  function bccHasAcceptedDutyHolders(c) {
    return getConsultationDutyHolderRecords(c).some(function (d) { return d.status === 'accepted'; });
  }

  function bccShowsContacts(c) {
    return c && c.assignee && c.workflow !== 'closed' && !bccNeedsPremises(c);
  }

  function getConsultationDhKey(dh) {
    if (!dh) return null;
    return dh.key || (typeof SETUP_DH_KEY_BY_NAME !== 'undefined' ? SETUP_DH_KEY_BY_NAME[dh.name] : null) || null;
  }

  function getConsultationResponsiblePersonsForDutyHolders(c, opts) {
    opts = opts || {};
    const dhKeys = (c.dutyHolders || []).filter(function (d) {
      return opts.acceptedOnly ? d.status === 'accepted' : d.status !== 'rejected';
    }).map(getConsultationDhKey).filter(Boolean);
    if (!dhKeys.length) return (c.responsiblePersons || []).filter(function (rp) { return rp.status !== 'rejected'; });
    return (c.responsiblePersons || []).filter(function (rp) {
      if (rp.status === 'rejected') return false;
      if (opts.acceptedOnly && rp.status !== 'accepted') return false;
      if (!rp.linkedDh) return true;
      return dhKeys.indexOf(rp.linkedDh) >= 0;
    });
  }

  function bccPeopleGateOk(c) {
    return bccHasAcceptedDutyHolders(c) && getConsultationResponsiblePersonsForDutyHolders(c, { acceptedOnly: true }).length > 0;
  }

  function bccCanReview(c) {
    return c && c.assignee && c.premises && !bccNeedsPremises(c) && bccPeopleGateOk(c);
  }

  function bccCanOutcome(c) {
    return bccCanReview(c) && c.infoDecision === 'yes' && (c.workflow === 'review' || c.workflow === 'outcome');
  }

  function bccOutcomeLettersComplete(c) {
    return !!(c.outcomeLetters && c.outcomeLetters.length) || !!c.outcomeLetterSkipped;
  }

  function bccCanClose(c) {
    if (!c || c.workflow === 'closed') return false;
    if (!c.assignee || !c.premises) return false;
    if (!c.outcomeDecision) return false;
    return bccOutcomeLettersComplete(c);
  }

  function bccWorkflowStage(c) {
    if (!c) return 1;
    if (c.workflow === 'closed') return 4;
    if (c.outcomeDecision || c.workflow === 'outcome') return 3;
    if (c.infoDecision || c.workflow === 'review' || c.workflow === 'awaiting_info') return 2;
    return 1;
  }

  function renderConsultationSlaBanner(c) {
    const banner = document.getElementById('consultation-sla-strip');
    const label = document.getElementById('consultation-sla-strip-label');
    const detail = document.getElementById('consultation-sla-strip-detail');
    const screen = document.getElementById('consultation');
    if (!banner || !c) return;
    const cls = bccSlaClass(c);
    banner.className = 'cpin-rag-strip ' + cls;
    if (screen) screen.dataset.sla = cls;
    if (label) {
      if (c.workflow === 'closed') label.textContent = 'CLOSED';
      else label.textContent = bccSlaLabel(c).toUpperCase();
    }
    if (detail) detail.textContent = c.workflow === 'closed' ? (c.closeReason || '') : bccSlaDetail(c);
  }

  function renderConsultationIntakeGrid(c) {
    const grid = document.getElementById('consultation-intake-grid');
    const section = document.getElementById('consultation-intake-section');
    if (!grid || !c || !c.intake) { if (section) section.hidden = true; return; }
    if (section) section.hidden = false;
    const i = c.intake;
    const rows = [
      ['Submission reference', i.submissionRef],
      ['Received', i.receivedDate],
      ['Building Control body', i.buildingControlBody],
      ['Project type', i.projectType],
      ['Premises', c.premises || i.premisesFree || '—']
    ];
    grid.innerHTML = rows.map(function (row) {
      return '<div><div class="k">' + escHtml(row[0]) + '</div><div class="v">' + escHtml(row[1] || '—') + '</div></div>';
    }).join('');
    const desc = document.getElementById('consultation-intake-desc-value');
    if (desc) desc.textContent = i.description || '—';
    const docs = document.getElementById('consultation-sharepoint-link');
    if (docs) {
      if (i.sharePointUrl) {
        docs.innerHTML = '<a href="' + escHtml(i.sharePointUrl) + '" target="_blank" rel="noopener" style="word-break:break-all;">' + escHtml(i.sharePointUrl) + '</a>';
      } else {
        docs.textContent = 'No SharePoint folder linked yet.';
      }
    }
  }

  function renderConsultationPremisesPanel(c) {
    const valueEl = document.getElementById('consultation-premises-value');
    const changeBtn = document.getElementById('consultation-premises-change-btn');
    const status = document.getElementById('consultation-premises-status');
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
    if (status) status.textContent = c.premises ? 'Matched to premises record.' : 'Match submission to the correct Crown premises.';
  }

  function renderConsultationAssigneeHint(c) {
    const el = document.getElementById('consultation-assignee-hint');
    if (!el) return;
    if (c.assignee) el.textContent = 'Lead inspector for this consultation.';
    else el.textContent = 'Assign lead inspector — team members can be added below.';
  }

  function renderConsultationKeyFieldHighlights(c) {
    const premisesEl = document.getElementById('consultation-field-premises');
    const assigneeEl = document.getElementById('consultation-field-assignee');
    if (premisesEl) premisesEl.classList.remove('is-next-action');
    if (assigneeEl) assigneeEl.classList.remove('is-next-action');
    if (!c || c.workflow === 'closed') return;
    if (bccNeedsPremises(c)) {
      if (premisesEl) premisesEl.classList.add('is-next-action');
    } else if (!c.assignee) {
      if (assigneeEl) assigneeEl.classList.add('is-next-action');
    }
  }

  function ensureConsultationDutyHolderSuggestions(c) {
    const fromMap = BCC_DH_BY_PREMISES[c.premises] || [];
    const holders = getConsultationDutyHolderRecords(c).slice();
    const onList = new Set(holders.map(function (d) { return d.name; }));
    let changed = false;
    fromMap.forEach(function (name) {
      if (onList.has(name)) return;
      holders.push({
        id: 'dh-' + name.replace(/\W+/g, '-').toLowerCase(),
        key: typeof SETUP_DH_KEY_BY_NAME !== 'undefined' ? SETUP_DH_KEY_BY_NAME[name] : null,
        name: name,
        role: name.indexOf('Building Control') >= 0 ? 'Building Control body  ·  Consultation submitter' : 'Duty Holder',
        initials: typeof setupInitials === 'function' ? setupInitials(name) : 'DH',
        fromPremises: true,
        status: 'suggested'
      });
      onList.add(name);
      changed = true;
    });
    if (changed) persistConsultationPatch(c.id, { dutyHolders: holders });
  }

  function renderConsultationDutyHolders(c) {
    const list = document.getElementById('consultation-dh-list');
    if (!list || !bccShowsContacts(c)) return;
    const holders = getConsultationDutyHolderRecords(c);
    if (!holders.length) {
      list.innerHTML = '<p style="color:var(--ink-3);font-size:13px;">Add Building Control body and premises Duty Holders.</p>';
      return;
    }
    list.innerHTML = holders.map(function (dh) {
      const pill = dh.status === 'suggested' ? '<span class="pill amber">Suggested</span>' : '<span class="pill blue">Approved</span>';
      const actions = dh.status === 'suggested'
        ? '<div class="holder-actions"><button class="btn primary" type="button" onclick="acceptConsultationDutyHolder(\'' + dh.id + '\')">Approve</button><button class="btn" type="button" onclick="removeConsultationDutyHolder(\'' + dh.id + '\')">Reject</button></div>'
        : '<div class="holder-actions"><span class="remove" onclick="removeConsultationDutyHolder(\'' + dh.id + '\')">×</span></div>';
      return '<div class="holder-card' + (dh.status === 'suggested' ? ' is-suggested' : '') + '">' +
        '<div class="avatar-sm">' + escHtml(dh.initials || 'DH') + '</div>' +
        '<div><div class="name">' + escHtml(dh.name) + '</div><div class="role">' + escHtml(dh.role || '') + '</div></div>' +
        pill + actions + '</div>';
    }).join('');
  }

  function renderConsultationResponsiblePersons(c) {
    const list = document.getElementById('consultation-rp-list');
    const hint = document.getElementById('consultation-rp-hint');
    if (!list || !bccShowsContacts(c)) return;
    const rps = getConsultationResponsiblePersonsForDutyHolders(c);
    if (!rps.length) {
      list.innerHTML = '<p style="color:var(--ink-3);font-size:13px;margin:0;">Add contacts for Building Control and premises organisations.</p>';
    } else {
      list.innerHTML = rps.map(function (rp) {
        const pill = rp.status === 'suggested' ? '<span class="pill amber">Suggested</span>' : '<span class="pill grey">Approved</span>';
        const actions = rp.status === 'suggested'
          ? '<div class="holder-actions"><button class="btn primary" type="button" onclick="acceptConsultationResponsiblePerson(\'' + rp.id + '\')">Approve</button><button class="btn" type="button" onclick="removeConsultationResponsiblePerson(\'' + rp.id + '\')">Reject</button></div>'
          : '<div class="holder-actions"><span class="remove" onclick="removeConsultationResponsiblePerson(\'' + rp.id + '\')">×</span></div>';
        return '<div class="holder-card' + (rp.status === 'suggested' ? ' is-suggested' : '') + '">' +
          '<div class="avatar-sm">' + escHtml(rp.initials || 'RP') + '</div>' +
          '<div><div class="name">' + escHtml(rp.name) + '</div><div class="role">' + escHtml(rp.role || '') + '</div></div>' +
          pill + actions + '</div>';
      }).join('');
    }
    if (hint) {
      if (bccPeopleGateOk(c)) hint.textContent = '';
      else hint.textContent = 'Approve Building Control and at least one premises contact before review unlocks.';
    }
  }

  function renderConsultationTeamMembers(c) {
    const el = document.getElementById('consultation-team-value');
    if (!el) return;
    const team = (c.teamMembers || []).slice();
    el.textContent = team.length ? team.join(', ') : 'None added';
  }

  function renderConsultationOutcomeLetters(c) {
    const list = document.getElementById('consultation-outcome-letters-list');
    const status = document.getElementById('consultation-outcome-letter-status');
    if (!list) return;
    const letters = c.outcomeLetters || [];
    if (!letters.length) {
      list.innerHTML = '<p class="help" style="margin:0;">No outcome letters saved yet.</p>';
    } else {
      list.innerHTML = letters.map(function (l) {
        return '<div class="letter-attachment"><strong>' + escHtml(l.title) + '</strong><span>' + escHtml(l.sentAt || '') + '</span></div>';
      }).join('');
    }
    if (status) {
      if (c.outcomeLetterSkipped) status.textContent = 'Letter step skipped.';
      else if (letters.length) status.textContent = letters.length + ' letter(s) saved.';
      else status.textContent = '';
    }
  }

  function renderConsultationWorkflowSections(c) {
    const contacts = document.getElementById('consultation-section-contacts');
    const review = document.getElementById('consultation-section-review');
    const holding = document.getElementById('consultation-section-holding');
    const outcome = document.getElementById('consultation-section-outcome');
    const closeSec = document.getElementById('consultation-section-close');

    const showContacts = bccShowsContacts(c);
    const showReview = showContacts && bccCanReview(c) && c.workflow !== 'awaiting_info' && c.workflow !== 'outcome' && !c.outcomeDecision;
    const showHolding = c.workflow === 'awaiting_info';
    const showOutcome = bccCanOutcome(c) || c.workflow === 'outcome' || !!c.outcomeDecision;
    const showClose = c.workflow === 'closed' || (bccCanClose(c) || (showOutcome && c.outcomeDecision));

    if (contacts) {
      contacts.hidden = !showContacts;
      if (showContacts) {
        ensureConsultationDutyHolderSuggestions(c);
        c = getConsultationById(c.id) || c;
        renderConsultationDutyHolders(c);
        renderConsultationResponsiblePersons(c);
      }
    }
    if (review) review.hidden = !showReview;
    if (holding) holding.hidden = !showHolding;
    if (outcome) {
      outcome.hidden = !showOutcome;
      if (showOutcome) renderConsultationOutcomeLetters(c);
    }
    if (closeSec) {
      closeSec.hidden = !(c.workflow === 'closed' || (c.outcomeDecision && (bccOutcomeLettersComplete(c) || c.workflow === 'outcome')));
      renderConsultationCloseSection(c);
    }

    const reviewBlocked = document.getElementById('consultation-review-blocked');
    if (reviewBlocked) {
      reviewBlocked.hidden = bccCanReview(c) || c.workflow === 'closed' || bccNeedsPremises(c);
      reviewBlocked.textContent = c.assignee && !bccPeopleGateOk(c)
        ? 'Approve contacts above before reviewing documents.'
        : 'Link premises and assign lead inspector first.';
    }
  }

  function renderConsultationCloseSection(c) {
    const open = document.getElementById('consultation-close-open');
    const done = document.getElementById('consultation-close-done');
    const closeBtn = document.getElementById('consultation-close-btn');
    const blocked = document.getElementById('consultation-close-blocked');
    if (!c || !open || !done) return;

    const isClosed = c.workflow === 'closed';
    open.hidden = isClosed;
    done.hidden = !isClosed;

    if (isClosed) {
      const txt = document.getElementById('consultation-close-done-text');
      if (txt) txt.textContent = c.closeReason || 'Consultation closed.';
      return;
    }

    const canClose = bccCanClose(c);
    if (closeBtn) closeBtn.disabled = !canClose;
    if (blocked) {
      blocked.hidden = canClose;
      if (!canClose) {
        if (!c.outcomeDecision) blocked.textContent = 'Select an outcome and save an outcome letter first.';
        else if (!bccOutcomeLettersComplete(c)) blocked.textContent = 'Write or skip the outcome letter before closing.';
      }
    }
  }

  function initConsultationActivity() {
    const c = getConsultationById(activeConsultationId);
    if (!c) return;
    if (c.activityLog) consultationActivityLog = JSON.parse(JSON.stringify(c.activityLog));
    else consultationActivityLog = { notes: [], times: [], interim: [], files: [] };
    renderConsultationActivityFeed();
    updateConsultationActivityCounts();
    const dateEl = document.getElementById('consultation-time-date');
    if (dateEl && !dateEl.value) dateEl.valueAsDate = new Date();
  }

  function updateConsultationActivityCounts() {
    const notes = consultationActivityLog.notes.length;
    const mins = consultationActivityLog.times.reduce(function (s, t) { return s + (parseInt(t.minutes, 10) || 0); }, 0);
    ['consultation-count-notes', 'consultation-recent-count-notes'].forEach(function (id) {
      const el = document.getElementById(id);
      if (el) el.textContent = notes + ' note' + (notes === 1 ? '' : 's');
    });
    ['consultation-count-time', 'consultation-recent-count-time'].forEach(function (id) {
      const el = document.getElementById(id);
      if (el) el.textContent = mins + 'm logged';
    });
  }

  function renderConsultationActivityFeed() {
    const feed = document.getElementById('consultation-activity-feed-list');
    if (!feed) return;
    const items = [];
    consultationActivityLog.notes.forEach(function (n) { items.push({ ts: n.ts || 0, at: n.at, type: 'note', text: n.text }); });
    consultationActivityLog.times.forEach(function (t) { items.push({ ts: t.ts || 0, at: t.at, type: 'time', activity: t.activity, minutes: t.minutes }); });
    consultationActivityLog.interim.forEach(function (x) { items.push({ ts: x.ts || 0, at: x.at, type: 'interim', title: x.title }); });
    items.sort(function (a, b) { return b.ts - a.ts; });
    if (!items.length) {
      feed.innerHTML = '<div class="audit-feed-empty">No activity logged yet on this consultation.</div>';
      return;
    }
    feed.innerHTML = items.map(function (item) {
      let pillClass = 'grey', pillLabel = 'Note', textHtml = escHtml(item.text || '');
      if (item.type === 'time') { pillClass = 'blue'; pillLabel = 'Time'; textHtml = escHtml(item.activity) + ' · <strong>' + escHtml(String(item.minutes)) + 'm</strong>'; }
      else if (item.type === 'interim') { pillClass = 'amber'; pillLabel = 'Interim'; textHtml = '<strong>' + escHtml(item.title) + '</strong>'; }
      return '<div class="audit-feed-item"><div class="audit-feed-meta"><span class="audit-feed-when">' + escHtml(item.at) + '</span></div>' +
        '<div class="audit-feed-body"><span class="pill ' + pillClass + '">' + pillLabel + '</span><span class="audit-feed-text">' + textHtml + '</span></div></div>';
    }).join('');
  }

  function setConsultationActivityBarVisible(visible) {
    document.body.classList.toggle('consultation-activity-bar', !!visible);
    if (!visible) document.body.classList.remove('consultation-float-panel-open');
  }

  function openConsultationFloatPanel() {
    const panel = document.getElementById('consultation-float-panel');
    if (!panel) return;
    setConsultationActivityBarVisible(true);
    setConsultationLogType(consultationLogType || 'time');
    if (typeof resetActivityLogDate === 'function') resetActivityLogDate('consultation-time-date');
    initConsultationActivity();
    panel.classList.add('open');
    panel.setAttribute('aria-hidden', 'false');
    document.body.classList.add('consultation-float-panel-open');
  }

  function closeConsultationFloatPanel() {
    const panel = document.getElementById('consultation-float-panel');
    if (panel) {
      panel.classList.remove('open');
      panel.setAttribute('aria-hidden', 'true');
    }
    document.body.classList.remove('consultation-float-panel-open');
  }

  function submitConsultationLog() {
    const now = Date.now();
    const at = typeof formatActivityTimestamp === 'function' ? formatActivityTimestamp(new Date()) : 'Just now';
    if (consultationLogType === 'time') {
      consultationActivityLog.times.push({
        ts: now,
        at: at,
        activity: document.getElementById('consultation-time-activity')?.value || 'Review',
        minutes: parseInt(document.getElementById('consultation-time-duration')?.value, 10) || 30
      });
    } else if (consultationLogType === 'note') {
      const text = document.getElementById('consultation-note-text')?.value || '';
      if (!text.trim()) return;
      consultationActivityLog.notes.push({ ts: now, at: at, text: text.trim() });
      document.getElementById('consultation-note-text').value = '';
    } else {
      const title = document.getElementById('consultation-interim-title')?.value || '';
      if (!title.trim()) return;
      consultationActivityLog.interim.push({ ts: now, at: at, title: title.trim() });
      document.getElementById('consultation-interim-title').value = '';
    }
    persistConsultationPatch(activeConsultationId, { activityLog: consultationActivityLog });
    renderConsultationActivityFeed();
    updateConsultationActivityCounts();
    closeConsultationFloatPanel();
  }

  function setConsultationLogType(type) {
    consultationLogType = type;
    ['time', 'note', 'interim'].forEach(function (t) {
      const el = document.getElementById('consultation-log-fields-' + t);
      if (el) el.hidden = t !== type;
    });
    document.querySelectorAll('#consultation-log-type-row .chip').forEach(function (chip) {
      chip.classList.toggle('active', chip.dataset.consultationLogType === type);
    });
  }

  function initConsultationDetailPage() {
    loadBccOverrides();
    const c = getConsultationById(activeConsultationId);
    if (!c) { show('processes'); return; }

    const title = document.getElementById('consultation-detail-title');
    const meta = document.getElementById('consultation-detail-meta');
    const stageHint = document.getElementById('consultation-detail-stage-hint');
    if (title) title.textContent = c.ref;
    if (meta) {
      const slaCls = bccSlaClass(c);
      const slaPills = { red: 'SLA overdue', amber: 'SLA alert', green: 'On track', grey: 'SLA paused' };
      if (c.workflow === 'closed') {
        meta.innerHTML = escHtml(BCC_WORKFLOW_LABELS[c.workflow] || c.workflow) + '  ·  ' + escHtml(c.when) +
          (c.assignee ? '  ·  ' + escHtml(c.assignee) : '');
      } else {
        meta.innerHTML = '<span class="pill ' + slaCls + '">' + escHtml(slaPills[slaCls] || 'SLA') + '</span> ' +
          escHtml(BCC_WORKFLOW_LABELS[c.workflow] || c.workflow) + '  ·  ' + escHtml(c.when) +
          (c.assignee ? '  ·  ' + escHtml(c.assignee) : '');
      }
    }
    if (stageHint) {
      if (c.workflow === 'closed') {
        stageHint.textContent = 'Closed — sections below show the record at close.';
      } else {
        const stages = ['', 'Intake and setup', 'Review (15-day SLA)', 'Issue outcome letter', 'Close'];
        stageHint.textContent = 'Stage ' + bccWorkflowStage(c) + ' of 4  ·  ' + stages[bccWorkflowStage(c)];
      }
    }

    renderConsultationSlaBanner(c);
    renderConsultationIntakeGrid(c);
    renderConsultationPremisesPanel(c);
    renderConsultationAssigneeHint(c);
    renderConsultationKeyFieldHighlights(c);
    renderConsultationTeamMembers(c);

    const assignee = document.getElementById('consultation-assignee');
    const review = document.getElementById('consultation-review-notes');
    if (assignee) assignee.value = c.assignee || '';
    if (review) review.value = c.reviewNotes || '';

    document.querySelectorAll('input[name="consultation-info-decision"]').forEach(function (inp) {
      inp.checked = c.infoDecision === inp.value;
    });
    document.querySelectorAll('input[name="consultation-outcome-decision"]').forEach(function (inp) {
      inp.checked = c.outcomeDecision === inp.value;
    });

    if (consultationDetailLastId !== activeConsultationId) consultationActivityLog = { notes: [], times: [], interim: [], files: [] };
    consultationDetailLastId = activeConsultationId;
    initConsultationActivity();
    renderConsultationWorkflowSections(c);
    setConsultationActivityBarVisible(c.workflow !== 'closed');
  }

  function refreshConsultationDetailPage() {
    initConsultationDetailPage();
  }

  function saveConsultationAssignment() {
    const c = getConsultationById(activeConsultationId);
    if (!c) return;
    const assignee = document.getElementById('consultation-assignee')?.value || '';
    let workflow = c.workflow;
    if (assignee && (workflow === 'unassigned' || workflow === 'incoming')) workflow = 'assigned';
    if (!assignee && c.premises) workflow = 'unassigned';
    persistConsultationPatch(activeConsultationId, { assignee: assignee || null, workflow: workflow });
    refreshConsultationDetailPage();
    renderConsultationsLists();
  }

  function saveConsultationPremises(name) {
    const c = getConsultationById(activeConsultationId);
    if (!c) return;
    const premises = name || null;
    let workflow = c.workflow;
    if (premises && workflow === 'awaiting_premises') workflow = 'unassigned';
    if (!premises) workflow = 'awaiting_premises';
    persistConsultationPatch(activeConsultationId, { premises: premises, workflow: workflow, dutyHolders: [] });
    refreshConsultationDetailPage();
    renderConsultationsLists();
  }

  function openConsultationPremisesEdit() {
    if (typeof setupLookupTarget !== 'undefined') setupLookupTarget = 'consultation';
    if (typeof openSetupLookupModal === 'function') openSetupLookupModal('premises');
  }

  function saveConsultationReviewNotes() {
    const text = document.getElementById('consultation-review-notes')?.value || '';
    persistConsultationPatch(activeConsultationId, { reviewNotes: text, workflow: 'review' });
  }

  function saveConsultationInfoDecision() {
    const picked = document.querySelector('input[name="consultation-info-decision"]:checked');
    if (!picked) return;
    const val = picked.value;
    let workflow = val === 'no' ? 'awaiting_info' : 'review';
    persistConsultationPatch(activeConsultationId, { infoDecision: val, workflow: workflow });
    refreshConsultationDetailPage();
  }

  function saveConsultationOutcomeDecision() {
    const picked = document.querySelector('input[name="consultation-outcome-decision"]:checked');
    if (!picked) return;
    persistConsultationPatch(activeConsultationId, { outcomeDecision: picked.value, workflow: 'outcome' });
    refreshConsultationDetailPage();
  }

  function saveConsultationOutcomeLetter() {
    const c = getConsultationById(activeConsultationId);
    if (!c || !c.outcomeDecision) return;
    const titles = {
      no_comments: 'No comments letter',
      comments: 'Comments letter — advisory points',
      insufficient: 'Insufficient information letter'
    };
    const letters = (c.outcomeLetters || []).slice();
    letters.push({
      title: titles[c.outcomeDecision] || 'Outcome letter',
      sentAt: typeof formatActivityTimestamp === 'function' ? formatActivityTimestamp(new Date()) : 'Just now'
    });
    persistConsultationPatch(activeConsultationId, { outcomeLetters: letters, outcomeLetterSkipped: false });
    refreshConsultationDetailPage();
  }

  function skipConsultationOutcomeLetter() {
    persistConsultationPatch(activeConsultationId, { outcomeLetterSkipped: true });
    refreshConsultationDetailPage();
  }

  function closeConsultationOneClick() {
    const c = getConsultationById(activeConsultationId);
    if (!c || !bccCanClose(c)) return;
    const reason = document.getElementById('consultation-close-reason')?.value || '';
    persistConsultationPatch(activeConsultationId, {
      workflow: 'closed',
      closeReason: reason || 'Consultation closed.',
      slaDaysRemaining: null
    });
    refreshConsultationDetailPage();
    renderConsultationsLists();
  }

  function acceptConsultationDutyHolder(id) {
    const c = getConsultationById(activeConsultationId);
    if (!c) return;
    const holders = (c.dutyHolders || []).map(function (d) {
      return d.id === id ? Object.assign({}, d, { status: 'accepted' }) : d;
    });
    persistConsultationPatch(activeConsultationId, { dutyHolders: holders });
    refreshConsultationDetailPage();
  }

  function removeConsultationDutyHolder(id) {
    const c = getConsultationById(activeConsultationId);
    if (!c) return;
    const holders = (c.dutyHolders || []).filter(function (d) { return d.id !== id; });
    persistConsultationPatch(activeConsultationId, { dutyHolders: holders });
    refreshConsultationDetailPage();
  }

  function addConsultationDutyHolder() {
    if (typeof setupLookupTarget !== 'undefined') setupLookupTarget = 'consultation';
    if (typeof openSetupLookupModal === 'function') openSetupLookupModal('dutyHolder');
  }

  function addConsultationResponsiblePerson() {
    if (typeof setupLookupTarget !== 'undefined') setupLookupTarget = 'consultation';
    if (typeof openSetupLookupModal === 'function') openSetupLookupModal('responsiblePerson');
  }

  function acceptConsultationResponsiblePerson(id) {
    const c = getConsultationById(activeConsultationId);
    if (!c) return;
    const rps = (c.responsiblePersons || []).map(function (r) {
      return r.id === id ? Object.assign({}, r, { status: 'accepted' }) : r;
    });
    persistConsultationPatch(activeConsultationId, { responsiblePersons: rps });
    refreshConsultationDetailPage();
  }

  function removeConsultationResponsiblePerson(id) {
    const c = getConsultationById(activeConsultationId);
    if (!c) return;
    const rps = (c.responsiblePersons || []).filter(function (r) { return r.id !== id; });
    persistConsultationPatch(activeConsultationId, { responsiblePersons: rps });
    refreshConsultationDetailPage();
  }

  function formatBccUkDate(iso) {
    if (!iso) return '';
    const p = String(iso).split('-');
    if (p.length !== 3) return iso;
    return p[2] + '/' + p[1] + '/' + p[0];
  }

  function nextBccRef() {
    const nums = getAllConsultationRecords().map(function (c) {
      const part = (c.ref || '').split('-').pop();
      return parseInt(part, 10);
    }).filter(function (n) { return !isNaN(n); });
    const max = nums.length ? Math.max.apply(null, nums) : 93;
    return 'C-2026-' + String(max + 1).padStart(4, '0');
  }

  function saveBccIntakeFromForm(formData) {
    const premises = formData.get('premises') || '';
    const premisesFree = formData.get('premisesFree') || '';
    const ref = nextBccRef();
    const id = 'cons-' + ref.replace('C-2026-', '');
    const record = {
      id: id,
      ref: ref,
      when: 'Just now',
      premises: premises || null,
      summary: (formData.get('summary') || 'Building control submission').trim(),
      patch: false,
      workflow: premises ? 'unassigned' : 'awaiting_premises',
      assignee: null,
      slaDaysRemaining: BCC_SLA_DAYS,
      intake: {
        submissionRef: formData.get('submissionRef') || '',
        receivedDate: formatBccUkDate(formData.get('receivedDate') || ''),
        buildingControlBody: formData.get('buildingControlBody') || '',
        projectType: formData.get('projectType') || '',
        sharePointUrl: formData.get('sharePointUrl') || '',
        description: formData.get('description') || '',
        premisesFree: premisesFree
      }
    };
    const intake = loadBccIntake();
    intake.unshift(record);
    saveBccIntake(intake);
    return record;
  }

  function resumeConsultationFromInfoHold() {
    const c = getConsultationById(activeConsultationId);
    if (!c || c.workflow !== 'awaiting_info') return;
    persistConsultationPatch(activeConsultationId, { workflow: 'review', infoDecision: 'yes' });
    refreshConsultationDetailPage();
  }

  window.initConsultationsPage = initConsultationsPage;
  window.switchConsultationsTab = switchConsultationsTab;
  window.layoutConsultationViews = layoutConsultationViews;
  window.toggleConsultationViewMenu = toggleConsultationViewMenu;
  window.initConsultationDetailPage = initConsultationDetailPage;
  window.openConsultation = openConsultation;
  window.toggleConsultationPin = toggleConsultationPin;
  window.saveConsultationAssignment = saveConsultationAssignment;
  window.saveConsultationPremises = saveConsultationPremises;
  window.openConsultationPremisesEdit = openConsultationPremisesEdit;
  window.saveConsultationReviewNotes = saveConsultationReviewNotes;
  window.saveConsultationInfoDecision = saveConsultationInfoDecision;
  window.saveConsultationOutcomeDecision = saveConsultationOutcomeDecision;
  window.saveConsultationOutcomeLetter = saveConsultationOutcomeLetter;
  window.skipConsultationOutcomeLetter = skipConsultationOutcomeLetter;
  window.closeConsultationOneClick = closeConsultationOneClick;
  window.acceptConsultationDutyHolder = acceptConsultationDutyHolder;
  window.removeConsultationDutyHolder = removeConsultationDutyHolder;
  window.addConsultationDutyHolder = addConsultationDutyHolder;
  window.addConsultationResponsiblePerson = addConsultationResponsiblePerson;
  window.acceptConsultationResponsiblePerson = acceptConsultationResponsiblePerson;
  window.removeConsultationResponsiblePerson = removeConsultationResponsiblePerson;
  window.setConsultationActivityBarVisible = setConsultationActivityBarVisible;
  window.openConsultationFloatPanel = openConsultationFloatPanel;
  window.closeConsultationFloatPanel = closeConsultationFloatPanel;
  window.submitConsultationLog = submitConsultationLog;
  window.setConsultationLogType = setConsultationLogType;
  window.getConsultationById = getConsultationById;
  window.getConsultationByRef = getConsultationByRef;
  window.consultationRouteForRef = consultationRouteForRef;
  window.persistConsultationPatch = persistConsultationPatch;
  window.saveBccIntakeFromForm = saveBccIntakeFromForm;
  window.renderConsultationsLists = renderConsultationsLists;
  window.resumeConsultationFromInfoHold = resumeConsultationFromInfoHold;
  window.activeConsultationId = function () { return activeConsultationId; };
  window.setActiveConsultationId = function (id) { activeConsultationId = id; };
})();
