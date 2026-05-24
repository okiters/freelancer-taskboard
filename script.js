/* ============================================================
   Freelancer Taskboard
   Publish-ready standalone script
   ============================================================ */

/* ── ICONS (inline SVG helpers) ── */
const SVG = {
  chevron:  `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 6l4 4 4-4"/></svg>`,
  plus:     `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 3v10M3 8h10"/></svg>`,
  edit:     `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 2l3 3-9 9H2v-3L11 2z"/></svg>`,
  trash:    `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 4h10M6 4V2h4v2M5 4l.5 9h5L11 4"/></svg>`,
  collapse: `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 6l4 4 4-4"/></svg>`,
  moon:     `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M13.2 10.7A5.8 5.8 0 015.3 2.8 6.1 6.1 0 1013.2 10.7z"/></svg>`,
  sun:      `<svg viewBox="0 0 16 16" fill="currentColor"><circle cx="8" cy="8" r="3"/><path fill="none" stroke="currentColor" stroke-width="1.5" d="M8 1v2M8 13v2M1 8h2M13 8h2M3.22 3.22l1.41 1.41M11.37 11.37l1.41 1.41M3.22 12.78l1.41-1.41M11.37 4.63l1.41-1.41"/></svg>`,
  export:   `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 2H4a1 1 0 00-1 1v10a1 1 0 001 1h8a1 1 0 001-1V6L9 2z"/><path d="M9 2v4h4M6 9l2 2 2-2M8 11V7"/></svg>`,
  compact:  `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 5h12M2 8h12M2 11h12"/></svg>`,
  clock:    `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="8" cy="8" r="6"/><path d="M8 5v3.5l2 1.5"/></svg>`,
  check:    `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 8l4 4 6-6"/></svg>`,
  stop:     `<svg viewBox="0 0 16 16" fill="currentColor"><rect x="4" y="4" width="8" height="8" rx="1.4"/></svg>`,
  translate:`<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M2 4h7M5.5 2v2M8 4c-.5 1.7-1.6 3.2-3.4 4.7M3.2 5.8c.7 1.1 1.7 2 3 2.8M9 14l2.8-7h.4L15 14M10 11.6h4"/></svg>`,
};

/* ── INITIAL DATA ── */
function taskCard(id, title, category, hours, checklist, options = {}) {
  return {
    id,
    title,
    description: options.description || "",
    category,
    labels: options.labels || ["inbox"],
    priority: options.priority || "Medium",
    status: options.status || "Not Started",
    hours,
    checklist: checklist.map(text => ({ text, done: false })),
    notes: options.notes || "",
    assets: options.assets || [],
    expanded: Boolean(options.expanded),
  };
}

const DEFAULT_SETTINGS = {
  studioName: "Your Studio",
  projectName: "Freelancer Taskboard",
  projectSubtitle: "Plan tasks, track time, invoice completed work, and keep project assets in one place.",
  clientName: "Your Client / Project",
  projectStatus: "Planning",
  defaultHourlyRate: 30,
  currency: "EUR",
  invoicePrefix: "INV",
  senderName: "Your Name or Studio",
  senderAddress: "Your address\nCity, Country",
  clientBillingName: "Client Name",
  clientBillingAddress: "Client billing address",
  paymentInfo: "Add your payment details here before sending invoices.",
};

const INITIAL_DATA = {
  settings: { ...DEFAULT_SETTINGS },
  columns: [
    {
      id: "col-getting-started",
      name: "Getting Started",
      sub: "Starter cards you can edit or delete",
      cards: [
        taskCard("starter-01", "Rename this workspace", "Getting Started", "0.25", [
          "Click the studio name in the top left to rename it",
          "Click the project title, client, subtitle, or status to edit the header",
          "Your changes are saved in this browser automatically",
        ], {
          labels: ["strategy"],
          priority: "High",
          description: "Make the board yours first. The header fields are editable, so freelancers can adapt the tool to any client project.",
          notes: "Use Reset Board only when you want to return to this starter template.",
          expanded: true,
        }),
        taskCard("starter-02", "Create your first real task", "Getting Started", "1-2", [
          "Click Add card at the bottom of this column",
          "Add estimated hours, labels, priority, and checklist items",
          "Drag cards between columns as your workflow grows",
        ], {
          labels: ["uxui"],
          description: "Cards can track status, checklists, notes, needed assets, billable hours, and invoice readiness.",
        }),
        taskCard("starter-03", "Track time and prepare invoices", "Getting Started", "0.5", [
          "Use the timer on a card while you work",
          "Mark completed billable cards as Ready to Invoice",
          "Open Generate Invoice and edit sender, client, and payment details in settings",
        ], {
          labels: ["handoff"],
          priority: "Medium",
          description: "The earnings panel and invoice generator use each card actual hours, revision hours, and hourly rate.",
        }),
      ],
    },
  ],
  invoiceHistory: [],
};

/* ── STATE ── */
let state = { columns: [] };
let dragCard = null, dragSource = null, placeholder = null;
let editingCardId = null, editingColumnId = null;
let compactMode = false;
let invoiceSelectedTaskIds = new Set();
let lastTranslationColumnId = null;

/* ── STORAGE ── */
const STORAGE_KEY = 'freelancer-taskboard-state-v1';
const LAST_SAVED_KEY = 'freelancer-taskboard-last-saved-at';
const LAST_IMPORTED_KEY = 'freelancer-taskboard-last-imported-at';

function loadState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      state = JSON.parse(saved);
    } else {
      state = JSON.parse(JSON.stringify(INITIAL_DATA));
    }
  } catch {
    state = JSON.parse(JSON.stringify(INITIAL_DATA));
  }
  state = normalizeBoardState(state) || JSON.parse(JSON.stringify(INITIAL_DATA));
  state.settings = normalizeSettings(state.settings);
}

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    localStorage.setItem(LAST_SAVED_KEY, new Date().toISOString());
    updateBackupTimestamps();
    return true;
  } catch {
    return false;
  }
}

function normalizeSettings(settings = {}) {
  const normalized = { ...DEFAULT_SETTINGS, ...(settings || {}) };
  normalized.defaultHourlyRate = num(normalized.defaultHourlyRate) || DEFAULT_SETTINGS.defaultHourlyRate;
  normalized.currency = getSupportedCurrency(normalized.currency);
  return normalized;
}

function getSettings() {
  state.settings = normalizeSettings(state.settings);
  return state.settings;
}

function updateEditableSetting(id, value) {
  const settings = getSettings();
  settings[id] = value.trim() || DEFAULT_SETTINGS[id] || '';
  saveState();
  renderHeaderSettings();
}

function renderHeaderSettings() {
  const settings = getSettings();
  setText('studio-name', settings.studioName);
  setText('project-name', settings.projectName);
  setText('project-subtitle', settings.projectSubtitle);
  setText('client-name', settings.clientName);
  setText('project-status', settings.projectStatus);
  document.title = settings.projectName || 'Freelancer Taskboard';
}

function initEditableSettings() {
  const bindings = [
    ['studio-name', 'studioName'],
    ['project-name', 'projectName'],
    ['project-subtitle', 'projectSubtitle'],
    ['client-name', 'clientName'],
    ['project-status', 'projectStatus'],
  ];

  bindings.forEach(([elementId, settingKey]) => {
    const el = document.getElementById(elementId);
    if (!el) return;

    el.addEventListener('blur', () => updateEditableSetting(settingKey, el.textContent));
    el.addEventListener('keydown', e => {
      if (e.key === 'Enter') {
        e.preventDefault();
        el.blur();
      }
    });
  });
}

function getDefaultHourlyRate() {
  return num(getSettings().defaultHourlyRate) || DEFAULT_SETTINGS.defaultHourlyRate;
}

const SUPPORTED_CURRENCIES = ['EUR', 'USD', 'GBP', 'TRY', 'CAD', 'AUD', 'CHF', 'SEK', 'NOK', 'DKK', 'JPY'];

function getSupportedCurrency(value) {
  const code = String(value || '').toUpperCase();
  return SUPPORTED_CURRENCIES.includes(code) ? code : DEFAULT_SETTINGS.currency;
}

function getCurrency() {
  return getSupportedCurrency(getSettings().currency);
}

/* ── ID GENERATOR ── */
function uid() { return 'id-' + Math.random().toString(36).slice(2, 9); }

/* ── LABEL CONFIG ── */
const LABEL_META = {
  strategy: { text: 'Strategy', cls: 'label-strategy' },
  brand:    { text: 'Brand',    cls: 'label-brand' },
  uxui:     { text: 'UX/UI',   cls: 'label-uxui' },
  assets:   { text: 'Assets',  cls: 'label-assets' },
  content:  { text: 'Content', cls: 'label-content' },
  handoff:  { text: 'Handoff', cls: 'label-handoff' },
  future:   { text: 'Future',  cls: 'label-future' },
  inbox:    { text: 'Inbox',   cls: 'label-inbox' },
  feedback: { text: 'Feedback',cls: 'label-feedback' },
};

const ALL_LABELS = Object.keys(LABEL_META);
const INVOICE_STATUSES = ['Not Ready', 'Ready to Invoice', 'Invoiced'];

const DE_TEXT = {};

function tText(value, lang) {
  if (lang !== 'de' || !value) return value || '';
  return DE_TEXT[value] || value;
}

function getColumnLang(col) {
  return col?.translationLang === 'de' ? 'de' : 'en';
}

function getColumnTitle(col) {
  return getColumnLang(col) === 'de' ? (col.nameDe || col.name) : col.name;
}

function getCardTitle(card, col) {
  return getColumnLang(col) === 'de' ? (card.titleDe || card.title) : card.title;
}

function getCardDescription(card, col) {
  if (getColumnLang(col) === 'de' && card.descriptionDe) return card.descriptionDe;
  return tText(card.description || card.desc || '', getColumnLang(col));
}

function getCardNotes(card, col) {
  if (getColumnLang(col) === 'de' && card.notesDe) return card.notesDe;
  return tText(card.notes || '', getColumnLang(col));
}

function getCardAssets(card, col) {
  const lang = getColumnLang(col);
  if (lang === 'de' && Array.isArray(card.assetsDe) && card.assetsDe.length) return card.assetsDe;
  return Array.isArray(card.assets) ? card.assets.map(asset => tText(asset, lang)) : [];
}

/* ============================================================
   RENDER
   ============================================================ */
function render() {
  const board = document.getElementById('board');
  board.innerHTML = '';
  renderHeaderSettings();

  state.columns.forEach(col => {
    board.appendChild(buildColumn(col));
  });

  // add-column button
  const addColBtn = document.createElement('button');
  addColBtn.id = 'add-column-btn';
  addColBtn.innerHTML = SVG.plus + ' New Column';
  addColBtn.addEventListener('click', addColumn);
  board.appendChild(addColBtn);

  updateStats();
  updateEarningsPanel();
  applySearch();
  updateTranslationToggleAnchor();
}

function renderPreservingViewport() {
  const board = document.getElementById('board');
  const anchorCard = document.activeElement?.closest?.('.card');
  const scrollState = {
    windowX: window.scrollX,
    windowY: window.scrollY,
    boardX: board ? board.scrollLeft : 0,
    anchorCardId: anchorCard?.dataset.cardId || '',
    anchorTop: anchorCard ? anchorCard.getBoundingClientRect().top : 0,
    activeElement: document.activeElement,
  };

  render();

  const restore = () => {
    if (board) board.scrollLeft = scrollState.boardX;
    const newAnchor = scrollState.anchorCardId
      ? document.querySelector(`.card[data-card-id="${CSS.escape(scrollState.anchorCardId)}"]`)
      : null;

    if (newAnchor) {
      const delta = newAnchor.getBoundingClientRect().top - scrollState.anchorTop;
      window.scrollBy(0, delta);
    } else {
      window.scrollTo(scrollState.windowX, scrollState.windowY);
    }

    if (scrollState.activeElement && document.body.contains(scrollState.activeElement)) {
      scrollState.activeElement.focus?.({ preventScroll: true });
    }
    updateTranslationToggleAnchor();
  };

  restore();
  requestAnimationFrame(restore);
}

/* ── COLUMN TRANSLATION TOGGLE ── */
function initTranslationToggle() {
  if (document.getElementById('column-translation-toggle')) return;

  const btn = document.createElement('button');
  btn.id = 'column-translation-toggle';
  btn.type = 'button';
  btn.innerHTML = `${SVG.translate}<span>DE</span>`;
  btn.title = 'Toggle this column title language';
  btn.setAttribute('aria-label', 'Toggle this column title language');
  btn.addEventListener('click', () => {
    const col = state.columns.find(item => item.id === lastTranslationColumnId);
    if (!col) return;
    col.translationLang = getColumnLang(col) === 'de' ? 'en' : 'de';
    saveState();
    render();
  });
  document.body.appendChild(btn);
  window.addEventListener('resize', updateTranslationToggleAnchor);
}

function moveTranslationToggleToColumn(colId) {
  lastTranslationColumnId = colId;
  updateTranslationToggleAnchor();
}

function updateTranslationToggleAnchor() {
  const btn = document.getElementById('column-translation-toggle');
  if (!btn) return;

  let colId = lastTranslationColumnId;
  if (!colId && state.columns.length) colId = state.columns[0].id;
  const col = state.columns.find(item => item.id === colId);
  const colEl = colId ? document.querySelector(`.column[data-col-id="${CSS.escape(colId)}"]`) : null;
  if (!col || !colEl) return;

  lastTranslationColumnId = colId;
  const rect = colEl.getBoundingClientRect();
  const x = rect.right - btn.offsetWidth;
  const y = rect.top - btn.offsetHeight;

  btn.style.left = `${x}px`;
  btn.style.top = `${y}px`;
  btn.classList.add('is-attached');
  btn.dataset.lang = getColumnLang(col);
  btn.querySelector('span').textContent = getColumnLang(col) === 'de' ? 'EN' : 'DE';
  btn.title = `Show ${getColumnLang(col) === 'de' ? 'English' : 'German'} titles for ${col.name}`;
  btn.setAttribute('aria-label', btn.title);
}

/* ── BUILD COLUMN ── */
function buildColumn(col) {
  const el = document.createElement('div');
  el.className = 'column' + (col.collapsed ? ' collapsed' : '');
  el.dataset.colId = col.id;
  el.dataset.lang = getColumnLang(col);

  el.innerHTML = `
    <div class="column-header">
      <div class="column-title-wrap">
        <div class="column-name" contenteditable="true" spellcheck="false">${escHtml(getColumnTitle(col))}</div>
      </div>
      <span class="column-count">${col.cards.length}</span>
      <button class="column-toggle" title="${col.collapsed ? 'Expand column' : 'Collapse column'}" aria-label="${col.collapsed ? 'Expand column' : 'Collapse column'}">${SVG.collapse}</button>
      <button class="column-delete-btn" title="Delete column">${SVG.trash}</button>
    </div>
    <div class="column-body"></div>
    <div class="column-footer">
      <button class="add-card-btn">${SVG.plus} Add card</button>
    </div>
  `;

  const header   = el.querySelector('.column-header');
  const nameEl   = el.querySelector('.column-name');
  const body     = el.querySelector('.column-body');
  const toggle   = el.querySelector('.column-toggle');
  const delBtn   = el.querySelector('.column-delete-btn');
  const addBtn   = el.querySelector('.add-card-btn');

  el.addEventListener('pointerenter', () => moveTranslationToggleToColumn(col.id));

  // collapse toggle
  toggle.addEventListener('click', e => {
    e.stopPropagation();
    col.collapsed = !col.collapsed;
    el.classList.toggle('collapsed', col.collapsed);
    toggle.title = col.collapsed ? 'Expand column' : 'Collapse column';
    toggle.setAttribute('aria-label', toggle.title);
    saveState();
  });

  // rename column
  nameEl.addEventListener('blur', () => {
    const oldName = col.name;
    const newName = nameEl.textContent.trim();
    if (getColumnLang(col) === 'de') {
      col.nameDe = newName || col.nameDe || col.name;
    } else {
      col.name = newName || col.name;
      col.cards.forEach(card => {
        if (!card.category || card.category === oldName) card.category = col.name;
      });
    }
    saveState();
  });
  nameEl.addEventListener('keydown', e => {
    if (e.key === 'Enter') { e.preventDefault(); nameEl.blur(); }
  });
  nameEl.addEventListener('click', e => e.stopPropagation());

  // delete column
  delBtn.addEventListener('click', e => {
    e.stopPropagation();
    if (confirm(`Delete column "${col.name}" and all its cards?`)) {
      state.columns = state.columns.filter(c => c.id !== col.id);
      saveState();
      render();
    }
  });

  // add card
  addBtn.addEventListener('click', () => openNewCardModal(col.id));

  // cards
  col.cards.forEach(card => {
    const cardEl = buildCard(card, col.id, col);
    body.appendChild(cardEl);
  });

  // drag-over column
  el.addEventListener('dragover', e => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    el.classList.add('drag-over');
    if (placeholder) {
      const afterEl = getDragAfterElement(body, e.clientY);
      if (afterEl) {
        body.insertBefore(placeholder, afterEl);
      } else {
        body.appendChild(placeholder);
      }
    }
  });
  el.addEventListener('dragleave', e => {
    if (!el.contains(e.relatedTarget)) el.classList.remove('drag-over');
  });
  el.addEventListener('drop', e => {
    e.preventDefault();
    el.classList.remove('drag-over');
    if (!dragCard || !dragSource) return;

    const afterEl = getDragAfterElement(body, e.clientY);
    const afterCardId = afterEl ? afterEl.dataset.cardId : null;

    // remove from source
    const srcCol = state.columns.find(c => c.id === dragSource);
    if (!srcCol) return;
    const cardIdx = srcCol.cards.findIndex(c => c.id === dragCard);
    if (cardIdx === -1) return;
    const [card] = srcCol.cards.splice(cardIdx, 1);

    // insert into target
    const tgtCol = state.columns.find(c => c.id === col.id);
    if (!tgtCol) return;
    card.category = tgtCol.name;
    if (afterCardId) {
      const insertIdx = tgtCol.cards.findIndex(c => c.id === afterCardId);
      if (insertIdx === -1) {
        tgtCol.cards.push(card);
      } else {
        tgtCol.cards.splice(insertIdx, 0, card);
      }
    } else {
      tgtCol.cards.push(card);
    }

    dragCard = null; dragSource = null;
    document.body.classList.remove('is-dragging-card');
    saveState();
    render();
  });

  return el;
}

function getDragAfterElement(container, y) {
  const cards = [...container.querySelectorAll('.card:not(.dragging):not(.drag-placeholder)')];
  let closest = null, closestOffset = Number.NEGATIVE_INFINITY;
  cards.forEach(el => {
    const box = el.getBoundingClientRect();
    const offset = y - box.top - box.height / 2;
    if (offset < 0 && offset > closestOffset) {
      closestOffset = offset;
      closest = el;
    }
  });
  return closest;
}

/* ── BUILD CARD ── */
function buildCard(card, colId, col) {
  const el = document.createElement('div');
  el.className = 'card' + (!compactMode && card.expanded ? ' expanded' : '');
  el.dataset.cardId = card.id;
  el.dataset.colId  = colId;
  el.draggable = true;

  const checkTotal = card.checklist.length;
  const checkDone  = card.checklist.filter(i => i.done).length;
  const pct        = checkTotal ? Math.round(checkDone / checkTotal * 100) : 0;
  const lang       = getColumnLang(col);
  const notesText  = getCardNotes(card, col);
  const assetList  = getCardAssets(card, col);
  const billableHours = getCardBillableHours(card);
  const isTimerRunning = Boolean(card.timerStartedAt);
  const canTrackTime = card.status !== 'Done';

  const labelsHtml = (card.labels || []).map(l => {
    const meta = LABEL_META[l];
    return meta ? `<span class="label ${meta.cls}">${meta.text}</span>` : '';
  }).join('');

  const checklistHtml = card.checklist.map((item, idx) => `
    <div class="checklist-item${item.done ? ' checked' : ''}" data-idx="${idx}">
      <input type="checkbox" id="ci-${card.id}-${idx}" ${item.done ? 'checked' : ''}>
      <label for="ci-${card.id}-${idx}">${escHtml(tText(item.text, lang))}</label>
    </div>
  `).join('');

  const assetFiles = Array.isArray(card.assetFiles) ? card.assetFiles : [];
  const assetsHtml = assetList.length
    ? `<div class="asset-tags">${assetList.map(a => `<span class="asset-tag">${escHtml(a)}</span>`).join('')}</div>` : '';
  const assetFilesHtml = assetFiles.length
    ? `<div class="asset-preview-grid">${assetFiles.map(file => `
        <div class="asset-preview" title="${escHtml(file.name)}">
          ${file.thumbnail
            ? `<img src="${escHtml(file.thumbnail)}" alt="${escHtml(file.name)} preview">`
            : `<div class="asset-file-icon">${escHtml(getFileExtension(file.name))}</div>`}
          <div class="asset-preview-meta">
            <span>${escHtml(file.name)}</span>
            <small>${escHtml(formatFileSize(file.size))}</small>
          </div>
          <button class="asset-remove-btn" data-asset-id="${escHtml(file.id)}" title="Remove asset">✕</button>
        </div>
      `).join('')}</div>` : '';

  el.innerHTML = `
    <div class="card-top">
      <div class="card-title">${escHtml(getCardTitle(card, col))}</div>
      <div class="card-actions">
        <button class="card-action-btn edit" title="Edit">${SVG.edit}</button>
        <button class="card-action-btn delete" title="Delete">${SVG.trash}</button>
      </div>
    </div>
    <div class="card-labels">${labelsHtml}</div>
    <div class="card-desc">${escHtml(getCardDescription(card, col))}</div>
    ${checkTotal ? `
    <div class="card-checklist">
      <div class="checklist-header">
        <span class="checklist-label">Checklist</span>
        <span class="checklist-progress">${checkDone}/${checkTotal}</span>
      </div>
      <div class="checklist-bar"><div class="checklist-bar-fill" style="width:${pct}%"></div></div>
      ${checklistHtml}
      <input class="add-checklist-item" placeholder="+ Add item…" type="text">
    </div>` : ''}
    <div class="card-meta">
      <span class="priority-dot priority-${(card.priority || 'medium').toLowerCase()}"></span>
      <span class="meta-tag">${(card.priority || 'Medium')}</span>
      ${card.hours ? `<span class="meta-tag">${SVG.clock} ${card.hours}h</span>` : ''}
      ${billableHours > 0 ? `<span class="meta-tag worked-hours-tag">${SVG.check} Worked ${formatHours(billableHours)}h</span>` : ''}
      <select class="status-select" data-status="${card.status || 'Not Started'}">
        <option ${card.status === 'Not Started' ? 'selected':''}>Not Started</option>
        <option ${card.status === 'In Progress' ? 'selected':''}>In Progress</option>
        <option ${card.status === 'Waiting'     ? 'selected':''}>Waiting</option>
        <option ${card.status === 'Review'      ? 'selected':''}>Review</option>
        <option ${card.status === 'Done'        ? 'selected':''}>Done</option>
      </select>
    </div>
    ${canTrackTime ? `
    <div class="card-timer${isTimerRunning ? ' running' : ''}">
      <button class="timer-btn" type="button" data-card-id="${escHtml(card.id)}" title="${isTimerRunning ? 'Stop timer and add worked hours' : 'Start timer'}" aria-label="${isTimerRunning ? 'Stop timer and add worked hours' : 'Start timer'}">
        ${isTimerRunning ? SVG.stop : SVG.clock}
      </button>
      <span class="timer-readout" data-card-id="${escHtml(card.id)}">${isTimerRunning ? formatElapsedTime(getRunningTimerMs(card)) : 'Start timer'}</span>
    </div>` : ''}
    ${notesText ? `<div class="card-notes has-content">${escHtml(notesText)}</div>` : '<div class="card-notes"></div>'}
    <div class="card-assets">
      <div class="asset-header">Needed / Linked Assets</div>
      <div class="asset-drop-zone" tabindex="0">Drop files here or click to choose</div>
      ${assetsHtml}
      ${assetFilesHtml}
    </div>
  `;

  /* events */

  // expand / collapse when clicking the card surface
  el.addEventListener('click', e => {
    if (e.target.closest('button, select, input, textarea, label, .card-assets')) return;
    card.expanded = !card.expanded;
    el.classList.toggle('expanded', card.expanded);
    saveState();
  });

  // edit
  el.querySelector('.card-action-btn.edit').addEventListener('click', e => {
    e.stopPropagation();
    openEditModal(card.id, colId);
  });

  // delete
  el.querySelector('.card-action-btn.delete').addEventListener('click', e => {
    e.stopPropagation();
    if (confirm(`Delete card "${card.title}"?`)) {
      const col = state.columns.find(c => c.id === colId);
      if (col) col.cards = col.cards.filter(c => c.id !== card.id);
      saveState();
      render();
    }
  });

  // status select
  const sel = el.querySelector('.status-select');
  sel.addEventListener('change', () => {
    if (sel.value === 'Done' && card.timerStartedAt) {
      stopCardTimer(card, { renderAfter: false });
    }
    card.status = sel.value;
    sel.dataset.status = sel.value;
    saveState();
    renderPreservingViewport();
  });

  const timerBtn = el.querySelector('.timer-btn');
  if (timerBtn) {
    timerBtn.addEventListener('click', e => {
      e.stopPropagation();
      toggleCardTimer(card.id);
    });
  }

  // checklist
  el.querySelectorAll('.checklist-item input[type="checkbox"]').forEach((cb, idx) => {
    cb.addEventListener('change', () => {
      card.checklist[idx].done = cb.checked;
      cb.closest('.checklist-item').classList.toggle('checked', cb.checked);
      // update bar
      const done = card.checklist.filter(i => i.done).length;
      const total = card.checklist.length;
      const fill = el.querySelector('.checklist-bar-fill');
      const prog = el.querySelector('.checklist-progress');
      if (fill) fill.style.width = total ? (done/total*100)+'%' : '0%';
      if (prog) prog.textContent = `${done}/${total}`;
      saveState();
      updateStats();
    });
  });

  // add checklist item inline
  const addCi = el.querySelector('.add-checklist-item');
  if (addCi) {
    addCi.addEventListener('keydown', e => {
      if (e.key === 'Enter' && addCi.value.trim()) {
        card.checklist.push({ text: addCi.value.trim(), done: false });
        saveState();
        // re-render just this card's checklist section — easiest to just re-render
        const colEl = el.closest('.column-body');
        const newEl = buildCard(card, colId, col);
        el.parentNode.replaceChild(newEl, el);
      }
    });
  }

  initAssetDropZone(el, card);

  /* drag */
  el.addEventListener('dragstart', e => {
    if (e.target.closest('button, select, input, textarea, label')) {
      e.preventDefault();
      return;
    }
    dragCard   = card.id;
    dragSource = colId;
    document.body.classList.add('is-dragging-card');
    el.classList.add('dragging');
    placeholder = document.createElement('div');
    placeholder.className = 'card drag-placeholder';
    placeholder.style.height = el.offsetHeight + 'px';
    e.dataTransfer.setData('text/plain', card.id);
    e.dataTransfer.effectAllowed = 'move';
    setTimeout(() => el.classList.add('dragging'), 0);
  });

  el.addEventListener('dragend', () => {
    el.classList.remove('dragging');
    document.body.classList.remove('is-dragging-card');
    if (placeholder && placeholder.parentNode) placeholder.parentNode.removeChild(placeholder);
    placeholder = null;
    document.querySelectorAll('.column').forEach(c => c.classList.remove('drag-over'));
  });

  return el;
}

/* ============================================================
   MODAL
   ============================================================ */
function openNewCardModal(colId) {
  editingCardId  = null;
  editingColumnId = colId;
  renderModal(null);
}

function openEditModal(cardId, colId) {
  editingCardId  = cardId;
  editingColumnId = colId;
  const col  = state.columns.find(c => c.id === colId);
  const card = col ? col.cards.find(c => c.id === cardId) : null;
  renderModal(card);
}

function initAssetDropZone(cardEl, card) {
  const dropZone = cardEl.querySelector('.asset-drop-zone');
  if (!dropZone) return;

  const chooseFiles = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.accept = 'image/*,.pdf,.ai,.eps,.svg,.fig,.sketch,.zip';
    input.addEventListener('change', () => addAssetFilesToCard(card, input.files));
    input.click();
  };

  dropZone.addEventListener('click', e => {
    e.stopPropagation();
    chooseFiles();
  });

  dropZone.addEventListener('keydown', e => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    e.preventDefault();
    e.stopPropagation();
    chooseFiles();
  });

  ['dragenter', 'dragover'].forEach(eventName => {
    dropZone.addEventListener(eventName, e => {
      e.preventDefault();
      e.stopPropagation();
      dropZone.classList.add('is-over');
      e.dataTransfer.dropEffect = 'copy';
    });
  });

  ['dragleave', 'drop'].forEach(eventName => {
    dropZone.addEventListener(eventName, e => {
      e.preventDefault();
      e.stopPropagation();
      dropZone.classList.remove('is-over');
    });
  });

  dropZone.addEventListener('drop', e => {
    addAssetFilesToCard(card, e.dataTransfer.files);
  });

  cardEl.querySelectorAll('.asset-remove-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const id = btn.dataset.assetId;
      card.assetFiles = (card.assetFiles || []).filter(file => file.id !== id);
      saveState();
      render();
    });
  });
}

async function addAssetFilesToCard(card, fileList) {
  const files = [...(fileList || [])];
  if (!files.length) return;

  const processed = await Promise.all(files.map(createAssetFilePreview));
  card.assetFiles = [...(card.assetFiles || []), ...processed.filter(Boolean)];
  if (!saveState()) {
    card.assetFiles = card.assetFiles.slice(0, -(processed.filter(Boolean).length));
    alert('That asset preview is too large to save in this browser. Try a smaller image or fewer files.');
  }
  render();
}

async function createAssetFilePreview(file) {
  const base = {
    id: uid(),
    name: file.name,
    type: file.type || 'application/octet-stream',
    size: file.size || 0,
    addedAt: new Date().toISOString(),
  };

  if (!file.type.startsWith('image/')) return base;

  try {
    const thumbnail = await createImageThumbnail(file);
    return { ...base, thumbnail };
  } catch (error) {
    return base;
  }
}

function createImageThumbnail(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      const image = new Image();
      image.onerror = reject;
      image.onload = () => {
        const max = 160;
        const scale = Math.min(1, max / Math.max(image.width, image.height));
        const width = Math.max(1, Math.round(image.width * scale));
        const height = Math.max(1, Math.round(image.height * scale));
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(image, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.72));
      };
      image.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

function renderModal(card) {
  const overlay = document.getElementById('modal-overlay');
  const modal   = document.getElementById('modal');

  const isNew = !card;
  const currentCol = state.columns.find(c => c.id === editingColumnId);
  const currentCategory = card?.category || currentCol?.name || '';
  const c = card || {
    title: '', description: '', category: currentCategory, labels: [], priority: 'Medium',
    status: 'Not Started', hours: '', actualHours: '', revisionHours: '', hourlyRate: getDefaultHourlyRate(),
    invoiceStatus: 'Not Ready', checklist: [], notes: '', assets: [],
  };

  const categoryOptionsHtml = state.columns.map(col => `
    <option value="${escHtml(col.name)}"></option>
  `).join('');

  const labelsCheckHtml = ALL_LABELS.map(l => {
    const meta = LABEL_META[l];
    return `<label style="display:flex;align-items:center;gap:5px;font-size:11px;color:var(--ink-mid);cursor:pointer;margin-bottom:3px;">
      <input type="checkbox" data-label="${l}" ${c.labels && c.labels.includes(l) ? 'checked' : ''}> ${meta.text}
    </label>`;
  }).join('');

  const invoiceOptionsHtml = INVOICE_STATUSES.map(status => `
    <option ${((c.invoiceStatus || 'Not Ready') === status) ? 'selected' : ''}>${status}</option>
  `).join('');

  modal.innerHTML = `
    <div class="modal-header">
      <h2>${isNew ? 'New Card' : 'Edit Card'}</h2>
      <button class="modal-close" id="modal-close-btn">✕</button>
    </div>

    <div class="modal-section">
      <label class="modal-label">Title</label>
      <input class="modal-input" id="m-title" type="text" value="${escHtml(c.title)}" placeholder="Card title…">
    </div>

    <div class="modal-section">
      <label class="modal-label">Description</label>
      <textarea class="modal-textarea" id="m-desc" placeholder="Short description…">${escHtml(c.description || c.desc)}</textarea>
    </div>

    <div class="modal-row">
      <div class="modal-section">
        <label class="modal-label">Category</label>
        <input class="modal-input" id="m-category" list="category-options" type="text" value="${escHtml(currentCategory)}" placeholder="e.g. Brand & Visual System">
        <datalist id="category-options">
          ${categoryOptionsHtml}
        </datalist>
      </div>
      <div class="modal-section">
        <label class="modal-label">Estimated Hours</label>
        <input class="modal-input" id="m-hours" type="text" value="${escHtml(c.hours || '')}" placeholder="e.g. 3–5">
      </div>
    </div>

    <div class="modal-row">
      <div class="modal-section">
        <label class="modal-label">Priority</label>
        <select class="modal-select" id="m-priority">
          <option ${c.priority==='High'?'selected':''}>High</option>
          <option ${c.priority==='Medium'?'selected':''}>Medium</option>
          <option ${c.priority==='Low'?'selected':''}>Low</option>
        </select>
      </div>
      <div class="modal-section">
        <label class="modal-label">Status</label>
        <select class="modal-select" id="m-status">
          <option ${c.status==='Not Started'?'selected':''}>Not Started</option>
          <option ${c.status==='In Progress'?'selected':''}>In Progress</option>
          <option ${c.status==='Waiting'?'selected':''}>Waiting</option>
          <option ${c.status==='Review'?'selected':''}>Review</option>
          <option ${c.status==='Done'?'selected':''}>Done</option>
        </select>
      </div>
    </div>

    <div class="modal-section modal-billing-section">
      <label class="modal-label">Billing</label>
      <div class="modal-billing-grid">
        <div>
          <span class="modal-mini-label">Actual Hours</span>
          <input class="modal-input" id="m-actual-hours" type="number" min="0" step="0.25" value="${escHtml(c.actualHours ?? '')}" placeholder="0">
        </div>
        <div>
          <span class="modal-mini-label">Revision Hours</span>
          <input class="modal-input" id="m-revision-hours" type="number" min="0" step="0.25" value="${escHtml(c.revisionHours ?? '')}" placeholder="0">
        </div>
        <div>
          <span class="modal-mini-label">Hourly Rate</span>
          <input class="modal-input" id="m-hourly-rate" type="number" min="0" step="1" value="${escHtml(c.hourlyRate || getDefaultHourlyRate())}" placeholder="${escHtml(getDefaultHourlyRate())}">
        </div>
        <div>
          <span class="modal-mini-label">Invoice Status</span>
          <select class="modal-select" id="m-invoice-status">
            ${invoiceOptionsHtml}
          </select>
        </div>
      </div>
    </div>

    <div class="modal-section">
      <label class="modal-label">Card Labels</label>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:2px;">${labelsCheckHtml}</div>
    </div>

    <div class="modal-section">
      <label class="modal-label">Checklist</label>
      <div id="m-checklist">
        ${c.checklist.map((item, i) => `
          <div class="modal-checklist-item" data-idx="${i}">
            <input type="checkbox" ${item.done ? 'checked' : ''}>
            <input type="text" value="${escHtml(item.text)}">
            <button class="remove-ci" title="Remove">✕</button>
          </div>
        `).join('')}
      </div>
      <button id="m-add-ci" class="btn-secondary" style="margin-top:6px;font-size:11px;padding:5px 10px;">+ Add item</button>
    </div>

    <div class="modal-section">
      <label class="modal-label">Notes</label>
      <textarea class="modal-textarea" id="m-notes" placeholder="Internal notes…">${escHtml(c.notes || '')}</textarea>
    </div>

    <div class="modal-section">
      <label class="modal-label">Asset References <span style="font-weight:400;color:var(--ink-ghost)">(comma-separated)</span></label>
      <input class="modal-input" id="m-assets" type="text" value="${(c.assets || []).join(', ')}" placeholder="e.g. Brief, wireframes, logo files">
    </div>

    <div class="modal-actions">
      <button class="btn-secondary" id="m-cancel">Cancel</button>
      <button class="btn-primary" id="m-save">Save Card</button>
    </div>
  `;

  overlay.classList.add('open');
  document.getElementById('m-title').focus();

  // close
  document.getElementById('modal-close-btn').addEventListener('click', closeModal);
  document.getElementById('m-cancel').addEventListener('click', closeModal);
  overlay.addEventListener('click', e => { if (e.target === overlay) closeModal(); });

  // remove checklist item
  modal.querySelectorAll('.remove-ci').forEach(btn => {
    btn.addEventListener('click', () => btn.closest('.modal-checklist-item').remove());
  });

  // add checklist item
  document.getElementById('m-add-ci').addEventListener('click', () => {
    const cl = document.getElementById('m-checklist');
    const div = document.createElement('div');
    div.className = 'modal-checklist-item';
    div.innerHTML = `<input type="checkbox"><input type="text" placeholder="Item…"><button class="remove-ci">✕</button>`;
    div.querySelector('.remove-ci').addEventListener('click', () => div.remove());
    cl.appendChild(div);
    div.querySelector('input[type=text]').focus();
  });

  // save
  document.getElementById('m-save').addEventListener('click', () => {
    const title = document.getElementById('m-title').value.trim();
    if (!title) { alert('Card title is required.'); return; }

    const checklist = [...document.querySelectorAll('#m-checklist .modal-checklist-item')].map(row => ({
      text: row.querySelector('input[type=text]').value.trim(),
      done: row.querySelector('input[type=checkbox]').checked,
    })).filter(i => i.text);

    const selectedLabels = [...modal.querySelectorAll('input[data-label]:checked')].map(cb => cb.dataset.label);
    const selectedCategory = document.getElementById('m-category').value.trim();
    const actualHours = parseNumberInput('m-actual-hours');
    const revisionHours = parseNumberInput('m-revision-hours');
    const hourlyRate = parseNumberInput('m-hourly-rate') || getDefaultHourlyRate();
    const totalBillableHours = actualHours + revisionHours;
    const taskTotal = totalBillableHours * hourlyRate;

    const rawAssets = document.getElementById('m-assets').value;
    const assets = rawAssets.split(',').map(s => s.trim()).filter(Boolean);

    const col = state.columns.find(c => c.id === editingColumnId);
    if (!col) return;
    const targetCol = state.columns.find(c => c.name === selectedCategory) || col;
    const cardCategory = selectedCategory || targetCol.name;

    if (isNew) {
      targetCol.cards.push({
        id: uid(),
        title,
        category: cardCategory,
        description: document.getElementById('m-desc').value.trim(),
        labels: selectedLabels,
        priority: document.getElementById('m-priority').value,
        status: document.getElementById('m-status').value,
        hours: document.getElementById('m-hours').value.trim(),
        actualHours,
        revisionHours,
        hourlyRate,
        totalBillableHours,
        taskTotal,
        invoiceStatus: document.getElementById('m-invoice-status').value,
        checklist,
        notes: document.getElementById('m-notes').value.trim(),
        assets,
        expanded: false,
      });
    } else {
      const card = col.cards.find(c => c.id === editingCardId);
      if (!card) return;
      card.title    = title;
      card.category = cardCategory;
      card.description = document.getElementById('m-desc').value.trim();
      delete card.desc;
      card.labels   = selectedLabels;
      card.priority = document.getElementById('m-priority').value;
      card.status   = document.getElementById('m-status').value;
      card.hours    = document.getElementById('m-hours').value.trim();
      card.actualHours = actualHours;
      card.revisionHours = revisionHours;
      card.hourlyRate = hourlyRate;
      card.totalBillableHours = totalBillableHours;
      card.taskTotal = taskTotal;
      card.invoiceStatus = document.getElementById('m-invoice-status').value;
      card.checklist = checklist;
      card.notes    = document.getElementById('m-notes').value.trim();
      card.assets   = assets;

      if (targetCol.id !== col.id) {
        col.cards = col.cards.filter(c => c.id !== editingCardId);
        targetCol.cards.push(card);
      }
    }

    saveState();
    closeModal();
    render();
  });
}

function closeModal() {
  document.getElementById('modal-overlay').classList.remove('open');
  editingCardId = null;
  editingColumnId = null;
}

/* ============================================================
   ADD COLUMN
   ============================================================ */
function addColumn() {
  const name = prompt('Column name:');
  if (!name || !name.trim()) return;
  state.columns.push({ id: uid(), name: name.trim(), sub: '', cards: [], collapsed: false });
  saveState();
  render();
}

/* ============================================================
   STATS
   ============================================================ */
function updateStats() {
  let total = 0, done = 0, inprog = 0;
  state.columns.forEach(col => {
    col.cards.forEach(c => {
      total++;
      if (c.status === 'Done') done++;
      if (c.status === 'In Progress') inprog++;
    });
  });
  document.getElementById('stat-total').textContent  = total;
  document.getElementById('stat-done').textContent   = done;
  document.getElementById('stat-prog').textContent   = inprog;
}

/* ============================================================
   EARNINGS
   ============================================================ */
function getAllCards() {
  return (state.columns || []).flatMap(col => col.cards || []);
}

function getCardBillableHours(card) {
  return num(card.totalBillableHours ?? (num(card.actualHours) + num(card.revisionHours)));
}

function getCardHourlyRate(card) {
  return num(card.hourlyRate) || getDefaultHourlyRate();
}

function getCardTaskTotal(card) {
  return getCardBillableHours(card) * getCardHourlyRate(card);
}

function getCardEstimatedHoursRange(card) {
  const value = String(card.hours ?? '').trim();
  if (!value) return { min: 0, max: 0 };

  const numbers = value
    .replace(/,/g, '.')
    .match(/\d+(?:\.\d+)?/g)
    ?.map(Number)
    .filter(Number.isFinite) || [];

  if (!numbers.length) return { min: 0, max: 0 };
  if (numbers.length === 1) return { min: numbers[0], max: numbers[0] };

  return {
    min: Math.min(numbers[0], numbers[1]),
    max: Math.max(numbers[0], numbers[1]),
  };
}

function calculateEarnings() {
  return getAllCards().reduce((acc, card) => {
    const billableHours = getCardBillableHours(card);
    const taskTotal = getCardTaskTotal(card);
    const estimatedHours = getCardEstimatedHoursRange(card);
    const hourlyRate = getCardHourlyRate(card);

    if (billableHours > 0) {
      acc.billableHours += billableHours;
      acc.earned += taskTotal;
    }
    acc.estimatedMin += estimatedHours.min * hourlyRate;
    acc.estimatedMax += estimatedHours.max * hourlyRate;
    if (card.status === 'Done') acc.completedBillableHours += billableHours;
    if (card.invoiceStatus === 'Ready to Invoice') acc.readyToInvoice += taskTotal;
    if (card.invoiceStatus === 'Invoiced') acc.invoiced += taskTotal;

    return acc;
  }, {
    billableHours: 0,
    completedBillableHours: 0,
    earned: 0,
    estimatedMin: 0,
    estimatedMax: 0,
    readyToInvoice: 0,
    invoiced: 0,
  });
}

function updateEarningsPanel() {
  const panel = document.getElementById('earnings-panel');
  if (!panel) return;

  const totals = calculateEarnings();
  const earnedTotal = totals.earned;
  const uninvoiced = Math.max(earnedTotal - totals.invoiced, 0);
  const remaining = Math.max(totals.estimatedMax - earnedTotal, 0);

  setText('earnings-collapsed-total', formatEuro(earnedTotal));
  setText('earnings-billable-hours', `${formatHours(totals.billableHours)}h`);
  setText('earnings-completed-hours', `${formatHours(totals.completedBillableHours)}h`);
  setText('earnings-total', formatEuro(earnedTotal));
  setText('earnings-uninvoiced', formatEuro(uninvoiced));
  setText('earnings-ready', formatEuro(totals.readyToInvoice));
  setText('earnings-invoiced', formatEuro(totals.invoiced));
  setText('earnings-remaining', formatEuro(remaining));
  setText('earnings-estimated-range', `Estimated range: ${formatEuro(totals.estimatedMin)}-${formatEuro(totals.estimatedMax)}`);
  const rateInput = document.getElementById('default-hourly-rate');
  if (rateInput && document.activeElement !== rateInput) rateInput.value = getDefaultHourlyRate();
  const currencySelect = document.getElementById('currency-select');
  if (currencySelect && document.activeElement !== currencySelect) currencySelect.value = getCurrency();
}

function refreshMoneyDisplays() {
  updateEarningsPanel();

  if (document.getElementById('invoice-overlay')?.classList.contains('open')) {
    renderInvoiceTaskList();
    renderInvoicePreview();
    renderInvoiceHistory();
  }
}

function initEarningsPanel() {
  const panel = document.getElementById('earnings-panel');
  const toggle = document.getElementById('earnings-toggle');
  if (!panel || !toggle) return;

  toggle.addEventListener('click', () => {
    const collapsed = panel.classList.toggle('collapsed');
    toggle.setAttribute('aria-expanded', String(!collapsed));
  });

  const rateInput = document.getElementById('default-hourly-rate');
  if (rateInput) {
    rateInput.value = getDefaultHourlyRate();
    rateInput.addEventListener('input', () => {
      getSettings().defaultHourlyRate = num(rateInput.value) || DEFAULT_SETTINGS.defaultHourlyRate;
      getAllCards().forEach(syncCardBilling);
      saveState();
      updateEarningsPanel();
    });
  }

  const currencySelect = document.getElementById('currency-select');
  if (currencySelect) {
    currencySelect.value = getCurrency();
    currencySelect.addEventListener('change', () => {
      getSettings().currency = getSupportedCurrency(currencySelect.value);
      getAllCards().forEach(syncCardBilling);
      saveState();
      refreshMoneyDisplays();
    });
  }
}

/* ============================================================
   CARD TIMERS
   ============================================================ */
function findCardById(cardId) {
  for (const col of state.columns || []) {
    const card = (col.cards || []).find(item => item.id === cardId);
    if (card) return card;
  }
  return null;
}

function getRunningTimerMs(card) {
  if (!card?.timerStartedAt) return 0;
  const startedAt = new Date(card.timerStartedAt).getTime();
  if (!Number.isFinite(startedAt)) return 0;
  return Math.max(0, Date.now() - startedAt);
}

function formatElapsedTime(ms) {
  const totalSeconds = Math.floor(Math.max(0, ms) / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return [hours, minutes, seconds].map(value => String(value).padStart(2, '0')).join(':');
}

function elapsedMsToHours(ms) {
  if (ms <= 0) return 0;
  const hours = ms / 3600000;
  return Math.max(0.01, Math.round(hours * 100) / 100);
}

function syncCardBilling(card) {
  const actualHours = num(card.actualHours);
  const revisionHours = num(card.revisionHours);
  card.actualHours = actualHours;
  card.revisionHours = revisionHours;
  card.totalBillableHours = actualHours + revisionHours;
  card.taskTotal = card.totalBillableHours * getCardHourlyRate(card);
}

function updateCardTimerDom(card) {
  const cardEl = document.querySelector(`.card[data-card-id="${CSS.escape(card.id)}"]`);
  if (!cardEl) return;

  const statusSelect = cardEl.querySelector('.status-select');
  if (statusSelect) {
    statusSelect.value = card.status || 'Not Started';
    statusSelect.dataset.status = statusSelect.value;
  }

  const timer = cardEl.querySelector('.card-timer');
  const timerBtn = cardEl.querySelector('.timer-btn');
  const readout = cardEl.querySelector('.timer-readout');
  const isRunning = Boolean(card.timerStartedAt);

  timer?.classList.toggle('running', isRunning);
  if (timerBtn) {
    const label = isRunning ? 'Stop timer and add worked hours' : 'Start timer';
    timerBtn.innerHTML = isRunning ? SVG.stop : SVG.clock;
    timerBtn.title = label;
    timerBtn.setAttribute('aria-label', label);
  }
  if (readout) {
    readout.textContent = isRunning ? formatElapsedTime(getRunningTimerMs(card)) : 'Start timer';
  }
}

function startCardTimer(card) {
  if (!card || card.status === 'Done') return;
  card.timerStartedAt = new Date().toISOString();
  card.status = 'In Progress';
  syncCardBilling(card);
  saveState();
  updateCardTimerDom(card);
  updateStats();
  updateEarningsPanel();
}

function stopCardTimer(card, options = {}) {
  if (!card?.timerStartedAt) return;
  const elapsedHours = elapsedMsToHours(getRunningTimerMs(card));
  card.actualHours = Math.round((num(card.actualHours) + elapsedHours) * 100) / 100;
  card.timerStartedAt = '';
  syncCardBilling(card);
  saveState();
  if (options.renderAfter !== false) renderPreservingViewport();
}

function toggleCardTimer(cardId) {
  const card = findCardById(cardId);
  if (!card) return;
  if (card.timerStartedAt) {
    stopCardTimer(card);
  } else {
    startCardTimer(card);
  }
}

function refreshTimerDisplays() {
  document.querySelectorAll('.timer-readout[data-card-id]').forEach(readout => {
    const card = findCardById(readout.dataset.cardId);
    if (card?.timerStartedAt) {
      readout.textContent = formatElapsedTime(getRunningTimerMs(card));
    }
  });
}

function initCardTimers() {
  window.setInterval(refreshTimerDisplays, 1000);
}

/* ============================================================
   SEARCH
   ============================================================ */
function applySearch() {
  const q = (document.getElementById('search-input').value || '').toLowerCase().trim();
  const activeFilter = document.querySelector('.filter-btn.active')?.dataset.filter || 'all';

  document.querySelectorAll('.card').forEach(el => {
    const colId  = el.dataset.colId;
    const cardId = el.dataset.cardId;
    const col    = state.columns.find(c => c.id === colId);
    const card   = col ? col.cards.find(c => c.id === cardId) : null;
    if (!card) return;

    const matchSearch = !q
      || card.title.toLowerCase().includes(q)
      || (card.titleDe || '').toLowerCase().includes(q)
      || (card.description || card.desc || '').toLowerCase().includes(q)
      || (card.labels || []).some(l => l.includes(q));

    const matchFilter = activeFilter === 'all'
      || (card.labels || []).includes(activeFilter)
      || card.status === activeFilter;

    el.classList.toggle('hidden', !(matchSearch && matchFilter));
  });
}

/* ============================================================
   FILTERS
   ============================================================ */
function initFilters() {
  const strip = document.getElementById('filter-strip');
  const filters = [
    { key: 'all', label: 'All' },
    { key: 'strategy', label: 'Strategy' },
    { key: 'brand',    label: 'Brand' },
    { key: 'uxui',     label: 'UX/UI' },
    { key: 'assets',   label: 'Assets' },
    { key: 'content',  label: 'Content' },
    { key: 'handoff',  label: 'Handoff' },
    { key: 'future',   label: 'Future' },
    { key: 'In Progress', label: 'In Progress' },
    { key: 'Waiting',   label: 'Waiting' },
    { key: 'Done',      label: 'Done' },
  ];

  filters.forEach(f => {
    const btn = document.createElement('button');
    btn.className = 'filter-btn' + (f.key === 'all' ? ' active' : '');
    btn.textContent = f.label;
    btn.dataset.filter = f.key;
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      applySearch();
    });
    strip.appendChild(btn);
  });
}

/* ============================================================
   BOARD PANNING
   ============================================================ */
function initBoardPanning() {
  const board = document.getElementById('board');
  let isPanning = false;
  let startX = 0;
  let startScrollLeft = 0;

  const interactiveSelector = [
    '.card',
    'button',
    'input',
    'textarea',
    'select',
    'label',
    '[contenteditable="true"]',
  ].join(',');

  const canStartPan = e => {
    if (e.button !== 0 && e.button !== 1) return false;
    if (e.target.closest(interactiveSelector)) return false;
    return board.scrollWidth > board.clientWidth;
  };

  board.addEventListener('wheel', e => {
    if (!e.shiftKey || Math.abs(e.deltaX) >= Math.abs(e.deltaY)) return;
    e.preventDefault();
    board.scrollLeft += e.deltaY;
    updateTranslationToggleAnchor();
  }, { passive: false });
  board.addEventListener('scroll', updateTranslationToggleAnchor, { passive: true });

  board.addEventListener('pointerdown', e => {
    if (!canStartPan(e)) return;
    isPanning = true;
    startX = e.clientX;
    startScrollLeft = board.scrollLeft;
    board.classList.add('is-panning');
    board.setPointerCapture(e.pointerId);
    e.preventDefault();
  });

  board.addEventListener('pointermove', e => {
    if (!isPanning) return;
    board.scrollLeft = startScrollLeft - (e.clientX - startX);
    updateTranslationToggleAnchor();
  });

  const stopPan = e => {
    if (!isPanning) return;
    isPanning = false;
    board.classList.remove('is-panning');
    if (board.hasPointerCapture(e.pointerId)) board.releasePointerCapture(e.pointerId);
  };

  board.addEventListener('pointerup', stopPan);
  board.addEventListener('pointercancel', stopPan);
  board.addEventListener('lostpointercapture', () => {
    isPanning = false;
    board.classList.remove('is-panning');
  });
}

/* ============================================================
   DARK MODE
   ============================================================ */
function initDarkMode() {
  const btn = document.getElementById('dark-toggle');
  const saved = localStorage.getItem('freelancer-taskboard-dark');
  const setDarkButton = isDark => {
    btn.innerHTML = isDark ? SVG.sun + ' Light' : SVG.moon + ' Dark';
  };

  if (saved === '1') document.body.classList.add('dark');
  setDarkButton(document.body.classList.contains('dark'));

  btn.addEventListener('click', () => {
    const isDark = document.body.classList.toggle('dark');
    localStorage.setItem('freelancer-taskboard-dark', isDark ? '1' : '0');
    setDarkButton(isDark);
  });
}

/* ============================================================
   COMPACT MODE
   ============================================================ */
function initCompact() {
  document.getElementById('compact-toggle').addEventListener('click', () => {
    compactMode = !compactMode;
    document.body.classList.toggle('compact', compactMode);
    if (compactMode) {
      getAllCards().forEach(card => { card.expanded = false; });
      saveState();
      render();
    }
  });
}

/* ============================================================
   BOARD BACKUP
   ============================================================ */
function initBackupTools() {
  const exportBtn = document.getElementById('export-board-btn');
  const importBtn = document.getElementById('import-board-btn');
  const fileInput = document.getElementById('import-board-file');

  exportBtn?.addEventListener('click', exportBoardJson);
  importBtn?.addEventListener('click', () => fileInput?.click());
  fileInput?.addEventListener('change', importBoardJsonFile);
  updateBackupTimestamps();
}

function buildBoardBackup() {
  return {
    ...state,
    backupVersion: 1,
    exportedAt: new Date().toISOString(),
  };
}

function exportBoardJson() {
  const backup = buildBoardBackup();
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const stamp = new Date().toISOString().slice(0, 10);

  link.href = url;
  link.download = `freelancer-taskboard-${stamp}.json`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function importBoardJsonFile(event) {
  const file = event.target.files?.[0];
  event.target.value = '';
  if (!file) return;

  if (!confirm('This will replace the current board data. Continue?')) return;

  const reader = new FileReader();
  reader.onload = () => {
    try {
      const parsed = JSON.parse(String(reader.result || ''));
      const importedState = normalizeImportedBoard(parsed);

      if (!importedState) {
        alert('Invalid board JSON.');
        return;
      }

      state = importedState;
      localStorage.setItem(LAST_IMPORTED_KEY, new Date().toISOString());
      saveState();
      render();
    } catch {
      alert('Invalid JSON file.');
    }
  };
  reader.readAsText(file);
}

function normalizeImportedBoard(parsed) {
  const board = parsed?.board && parsed.board.columns ? parsed.board : parsed;
  return normalizeBoardState(board);
}

function normalizeBoardState(board) {
  if (!board || !Array.isArray(board.columns)) return null;

  const normalized = {
    ...board,
    settings: normalizeSettings(board.settings),
    columns: board.columns.map((col, colIndex) => ({
      id: col.id || uid(),
      name: col.name || `Column ${colIndex + 1}`,
      nameDe: col.nameDe || '',
      sub: col.sub || '',
      collapsed: Boolean(col.collapsed),
      translationLang: col.translationLang === 'de' ? 'de' : 'en',
      cards: Array.isArray(col.cards)
        ? col.cards.map(card => normalizeCard(card, col.name || `Column ${colIndex + 1}`))
        : [],
    })),
    invoiceHistory: Array.isArray(board.invoiceHistory) ? board.invoiceHistory : [],
  };

  return normalized;
}

function normalizeCard(card, fallbackCategory) {
  card = card || {};
  const actualHours = num(card.actualHours);
  const revisionHours = num(card.revisionHours);
  const hourlyRate = card.hourlyRate === '' || card.hourlyRate === undefined || card.hourlyRate === null
    ? ''
    : num(card.hourlyRate);
  const totalBillableHours = num(card.totalBillableHours ?? (actualHours + revisionHours));

  return {
    ...card,
    id: card.id || uid(),
    title: card.title || 'Untitled card',
    titleDe: card.titleDe || '',
    descriptionDe: card.descriptionDe || '',
    description: card.description || card.desc || '',
    category: card.category || fallbackCategory,
    labels: Array.isArray(card.labels) ? card.labels : [],
    priority: card.priority || 'Medium',
    status: card.status || 'Not Started',
    hours: card.hours ?? '',
    actualHours,
    revisionHours,
    hourlyRate,
    totalBillableHours,
    taskTotal: totalBillableHours * (hourlyRate || getDefaultHourlyRate()),
    invoiceStatus: INVOICE_STATUSES.includes(card.invoiceStatus) ? card.invoiceStatus : 'Not Ready',
    checklist: Array.isArray(card.checklist)
      ? card.checklist.map(item => ({ text: item.text || '', done: Boolean(item.done) })).filter(item => item.text)
      : [],
    notes: card.notes || '',
    notesDe: card.notesDe || '',
    assets: Array.isArray(card.assets) ? card.assets : [],
    assetsDe: Array.isArray(card.assetsDe) ? card.assetsDe : [],
    assetFiles: Array.isArray(card.assetFiles)
      ? card.assetFiles.map(file => ({
          id: file.id || uid(),
          name: file.name || 'Untitled asset',
          type: file.type || '',
          size: num(file.size),
          thumbnail: file.thumbnail || '',
          addedAt: file.addedAt || '',
        }))
      : [],
    expanded: Boolean(card.expanded),
  };
}

/* ============================================================
   RESET BOARD
   ============================================================ */
function resetBoard() {
  if (!confirm('Reset board to initial state? All changes will be lost.')) return;
  getLocalStorageKeys()
    .filter(key => key.startsWith('freelancer-taskboard-'))
    .forEach(key => localStorage.removeItem(key));
  localStorage.removeItem(LAST_IMPORTED_KEY);
  state = JSON.parse(JSON.stringify(INITIAL_DATA));
  state.invoiceHistory = [];
  saveState();
  render();
}

function initResetBoard() {
  const btn = document.getElementById('reset-board-btn');
  if (!btn) return;
  btn.addEventListener('click', () => resetBoard());
}

/* ============================================================
   INVOICE GENERATOR
   ============================================================ */
function initInvoiceGenerator() {
  const btn = document.getElementById('invoice-btn');
  const overlay = document.getElementById('invoice-overlay');
  if (!btn || !overlay) return;

  btn.addEventListener('click', openInvoiceModal);
  document.getElementById('invoice-close-btn').addEventListener('click', closeInvoiceModal);
  overlay.addEventListener('click', e => { if (e.target === overlay) closeInvoiceModal(); });

  ['invoice-number', 'invoice-date'].forEach(id => {
    document.getElementById(id).addEventListener('input', renderInvoicePreview);
  });
  document.querySelectorAll('.invoice-setting-input').forEach(input => {
    input.addEventListener('input', () => {
      const settingKey = input.dataset.setting;
      if (!settingKey) return;
      getSettings()[settingKey] = input.value;
      saveState();
      renderInvoicePreview();
    });
  });
  document.querySelectorAll('input[name="invoice-mode"]').forEach(input => {
    input.addEventListener('change', renderInvoicePreview);
  });

  document.getElementById('invoice-select-ready').addEventListener('click', () => {
    invoiceSelectedTaskIds = new Set(getInvoiceTasks()
      .filter(card => card.invoiceStatus === 'Ready to Invoice')
      .map(card => card.id));
    renderInvoiceTaskList();
    renderInvoicePreview();
  });

  document.getElementById('invoice-clear-selection').addEventListener('click', () => {
    invoiceSelectedTaskIds.clear();
    renderInvoiceTaskList();
    renderInvoicePreview();
  });

  document.getElementById('invoice-print-btn').addEventListener('click', () => {
    printInvoice();
  });

  document.getElementById('invoice-mark-invoiced-btn').addEventListener('click', markSelectedTasksAsInvoiced);

  document.getElementById('invoice-preview').addEventListener('click', e => {
    if (e.target.closest('#invoice-preview-print-btn')) printInvoice();
  });

  window.addEventListener('afterprint', () => {
    document.body.classList.remove('printing-invoice');
  });
}

function openInvoiceModal() {
  const today = new Date();
  const date = today.toISOString().slice(0, 10);
  const settings = getSettings();
  const number = `${settings.invoicePrefix || 'INV'}-${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`;

  document.getElementById('invoice-number').value = number;
  document.getElementById('invoice-date').value = date;
  document.getElementById('invoice-sender-name').value = settings.senderName;
  document.getElementById('invoice-client-name').value = settings.clientBillingName;
  document.getElementById('invoice-sender-address').value = settings.senderAddress;
  document.getElementById('invoice-client-address').value = settings.clientBillingAddress;
  document.getElementById('invoice-payment-info').value = settings.paymentInfo;
  document.querySelector('input[name="invoice-mode"][value="detailed"]').checked = true;
  invoiceSelectedTaskIds = new Set(getInvoiceTasks()
    .filter(card => card.invoiceStatus === 'Ready to Invoice')
    .map(card => card.id));

  renderInvoiceTaskList();
  renderInvoiceHistory();
  renderInvoicePreview();
  document.getElementById('invoice-overlay').classList.add('open');
}

function closeInvoiceModal() {
  document.getElementById('invoice-overlay').classList.remove('open');
}

function getInvoiceTasks() {
  return getAllCards().filter(card => {
    return card.status === 'Done'
      || card.invoiceStatus === 'Ready to Invoice'
      || card.invoiceStatus === 'Invoiced';
  });
}

function getSelectedInvoiceTasks() {
  return getInvoiceTasks().filter(card => invoiceSelectedTaskIds.has(card.id));
}

function renderInvoiceTaskList() {
  const list = document.getElementById('invoice-task-list');
  const tasks = getInvoiceTasks();

  if (!tasks.length) {
    list.innerHTML = '<div class="invoice-empty">No completed or ready-to-invoice billable tasks yet.</div>';
    return;
  }

  list.innerHTML = tasks.map(card => `
    <label class="invoice-task-option">
      <input type="checkbox" data-task-id="${escHtml(card.id)}" ${invoiceSelectedTaskIds.has(card.id) ? 'checked' : ''}>
      <span>
        <strong>${escHtml(card.title)}</strong>
        <small>${escHtml(card.category || 'Uncategorized')} · ${formatHours(getCardBillableHours(card))}h · ${formatEuro(getCardTaskTotal(card))} · ${escHtml(card.invoiceStatus || 'Not Ready')}</small>
      </span>
    </label>
  `).join('');

  list.querySelectorAll('input[data-task-id]').forEach(input => {
    input.addEventListener('change', () => {
      if (input.checked) {
        invoiceSelectedTaskIds.add(input.dataset.taskId);
      } else {
        invoiceSelectedTaskIds.delete(input.dataset.taskId);
      }
      renderInvoicePreview();
    });
  });
}

function renderInvoicePreview() {
  const preview = document.getElementById('invoice-preview');
  if (!preview) return;

  const tasks = getSelectedInvoiceTasks();
  const mode = document.querySelector('input[name="invoice-mode"]:checked')?.value || 'detailed';
  const invoiceNumber = document.getElementById('invoice-number')?.value || '';
  const invoiceDate = document.getElementById('invoice-date')?.value || '';
  const rows = mode === 'grouped' ? buildGroupedInvoiceRows(tasks) : buildDetailedInvoiceRows(tasks);
  const subtotal = rows.reduce((sum, row) => sum + row.total, 0);
  const settings = getSettings();

  preview.innerHTML = `
    <button class="invoice-preview-print-btn" id="invoice-preview-print-btn">Print / Save A4 PDF</button>
    <div class="invoice-doc">
      <div class="invoice-doc-head">
        <h1>INVOICE</h1>
        <div>
          <div><strong>Invoice No.</strong> ${escHtml(invoiceNumber)}</div>
          <div><strong>Date</strong> ${escHtml(formatInvoiceDate(invoiceDate))}</div>
        </div>
      </div>

      <div class="invoice-parties">
        <div>
          <span>Sender</span>
          <strong>${escHtml(settings.senderName)}</strong>
          <p>${formatMultiline(settings.senderAddress)}</p>
        </div>
        <div>
          <span>Billed to</span>
          <strong>${escHtml(settings.clientBillingName)}</strong>
          <p>${formatMultiline(settings.clientBillingAddress)}</p>
        </div>
      </div>

      <table class="invoice-table">
        <thead>
          <tr>
            <th>Item</th>
            <th>Hours</th>
            <th>Hourly Rate</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          ${rows.length ? rows.map(row => `
            <tr>
              <td>${escHtml(row.item)}</td>
              <td>${formatHours(row.hours)}</td>
              <td>${formatEuro(row.rate)}</td>
              <td>${formatEuro(row.total)}</td>
            </tr>
          `).join('') : '<tr><td colspan="4" class="invoice-empty-row">Select tasks to preview the invoice.</td></tr>'}
        </tbody>
      </table>

      <div class="invoice-totals">
        <div><span>Subtotal</span><strong>${formatEuro(subtotal)}</strong></div>
        <div><span>Tax 0%</span><strong>${formatEuro(0)}</strong></div>
        <div class="invoice-total-row"><span>Total</span><strong>${formatEuro(subtotal)}</strong></div>
      </div>

      <div class="invoice-payment">
        <strong>Payment information</strong>
        <p>${formatMultiline(settings.paymentInfo)}</p>
      </div>

      <div class="invoice-thanks">Thank you!</div>
    </div>
  `;
}

function printInvoice() {
  document.body.classList.add('printing-invoice');
  window.print();
}

function markSelectedTasksAsInvoiced() {
  const tasks = getSelectedInvoiceTasks();
  if (!tasks.length) {
    alert('Select at least one task before marking an invoice.');
    return;
  }

  const invoiceNumber = document.getElementById('invoice-number').value.trim();
  const invoiceDate = document.getElementById('invoice-date').value;
  if (!invoiceNumber || !invoiceDate) {
    alert('Invoice number and invoice date are required.');
    return;
  }

  const totalHours = tasks.reduce((sum, card) => sum + getCardBillableHours(card), 0);
  const totalAmount = tasks.reduce((sum, card) => sum + getCardTaskTotal(card), 0);

  tasks.forEach(card => {
    card.invoiceStatus = 'Invoiced';
    card.invoiceNumber = invoiceNumber;
    card.invoiceDate = invoiceDate;
  });

  state.invoiceHistory = Array.isArray(state.invoiceHistory) ? state.invoiceHistory : [];
  const existingIndex = state.invoiceHistory.findIndex(entry => entry.invoiceNumber === invoiceNumber);
  const historyEntry = {
    id: `inv-${Date.now()}`,
    invoiceNumber,
    date: invoiceDate,
    totalHours,
    totalAmount,
    taskCount: tasks.length,
    taskIds: tasks.map(card => card.id),
  };

  if (existingIndex >= 0) {
    state.invoiceHistory[existingIndex] = { ...state.invoiceHistory[existingIndex], ...historyEntry };
  } else {
    state.invoiceHistory.unshift(historyEntry);
  }

  saveState();
  updateEarningsPanel();
  renderInvoiceTaskList();
  renderInvoiceHistory();
  renderInvoicePreview();
  render();
}

function renderInvoiceHistory() {
  const list = document.getElementById('invoice-history-list');
  if (!list) return;

  const history = Array.isArray(state.invoiceHistory) ? state.invoiceHistory : [];
  if (!history.length) {
    list.innerHTML = '<div class="invoice-empty">No invoices marked yet.</div>';
    return;
  }

  list.innerHTML = history.map(entry => `
    <div class="invoice-history-entry">
      <div>
        <strong>${escHtml(entry.invoiceNumber)}</strong>
        <span>${escHtml(formatInvoiceDate(entry.date))}</span>
      </div>
      <div>
        <span>${formatHours(entry.totalHours)}h</span>
        <span>${formatEuro(entry.totalAmount)}</span>
        <span>${entry.taskCount} tasks</span>
      </div>
    </div>
  `).join('');
}

function buildDetailedInvoiceRows(tasks) {
  return tasks.map(card => ({
    item: card.title,
    hours: getCardBillableHours(card),
    rate: getCardHourlyRate(card),
    total: getCardTaskTotal(card),
  }));
}

function buildGroupedInvoiceRows(tasks) {
  const groups = new Map();
  tasks.forEach(card => {
    const key = card.category || 'Uncategorized';
    const existing = groups.get(key) || { item: key, hours: 0, total: 0 };
    existing.hours += getCardBillableHours(card);
    existing.total += getCardTaskTotal(card);
    groups.set(key, existing);
  });

  return [...groups.values()].map(group => ({
    ...group,
    rate: group.hours ? group.total / group.hours : getDefaultHourlyRate(),
  }));
}

/* ============================================================
   HELPERS
   ============================================================ */
function escHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatMultiline(value) {
  return escHtml(value || '').replace(/\n/g, '<br>');
}

function num(value) {
  const n = Number.parseFloat(value);
  return Number.isFinite(n) ? n : 0;
}

function parseNumberInput(id) {
  return num(document.getElementById(id)?.value);
}

function formatEuro(value) {
  const currency = getCurrency();
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: value % 1 === 0 ? 0 : 2,
  }).format(value);
}

function formatHours(value) {
  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 2,
  }).format(value);
}

function formatFileSize(bytes) {
  const size = num(bytes);
  if (!size) return '0 KB';
  if (size < 1024 * 1024) return `${Math.max(1, Math.round(size / 1024))} KB`;
  return `${(size / (1024 * 1024)).toFixed(size < 10 * 1024 * 1024 ? 1 : 0)} MB`;
}

function getFileExtension(name) {
  const ext = String(name || '').split('.').pop();
  return ext && ext !== name ? ext.slice(0, 4).toUpperCase() : 'FILE';
}

function formatInvoiceDate(value) {
  if (!value) return '';
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('en-GB', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
}

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

function getLocalStorageKeys() {
  if (typeof localStorage.length === 'number' && typeof localStorage.key === 'function') {
    return Array.from({ length: localStorage.length }, (_, index) => localStorage.key(index)).filter(Boolean);
  }
  return Object.keys(localStorage);
}

function formatTimestamp(value) {
  if (!value) return 'Never';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Never';
  return new Intl.DateTimeFormat('en-GB', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

function updateBackupTimestamps() {
  setText('last-saved-label', `Last saved: ${formatTimestamp(localStorage.getItem(LAST_SAVED_KEY))}`);
  setText('last-imported-label', `Last imported: ${formatTimestamp(localStorage.getItem(LAST_IMPORTED_KEY))}`);
}

/* ============================================================
   BOOT
   ============================================================ */
document.addEventListener('DOMContentLoaded', () => {
  loadState();
  renderHeaderSettings();
  initEditableSettings();
  initFilters();
  initDarkMode();
  initCompact();
  initBackupTools();
  initResetBoard();
  initEarningsPanel();
  initInvoiceGenerator();
  initCardTimers();
  initBoardPanning();
  render();

  // search
  document.getElementById('search-input').addEventListener('input', applySearch);

  // keyboard: Escape closes modal
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      closeModal();
      closeInvoiceModal();
    }
  });
});
