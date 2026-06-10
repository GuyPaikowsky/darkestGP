// ── DARKEST GRAND PRIX — run orchestration ───────────────────────────────────
import { HEROES, ENCOUNTERS, BOSS_ENCOUNTER, MYSTERY_EVENTS, PIT_OPTIONS, NARRATOR, ROUTE_NODES } from './data.js';
import { initOverworld, setSpeed } from './overworld.js';
import { initBattle, startBattle } from './battle.js';
import { sfx, toggleMute } from './sfx.js';

const $ = (s) => document.querySelector(s);
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const rint = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

const TOTAL_LEGS = 6;
let party = [];
let leg = 1;
let usedEncounters = [];
let usedEvents = [];
let runActive = false;

// modal buttons must fire exactly once, no matter how excitedly the user clicks
function armOnce(container, handler) {
  let fired = false;
  container.querySelectorAll('button').forEach((btn) => {
    btn.onclick = () => {
      if (fired) return;
      fired = true;
      handler(btn);
    };
  });
}

const LEG_NAMES = [
  'The Paddock of Lamentation',
  'Sector 2 (Cursed)',
  'The Long Straight of Doubt',
  'Chicane of a Thousand Regrets',
  'The Hairpin Where Hope Dies',
  'THE FINAL STINT',
];

// ── narrator ─────────────────────────────────────────────────────────────────
let narrTimer = null;
function narrate(text) {
  const box = $('#narrator-text');
  clearInterval(narrTimer);
  box.textContent = '';
  let i = 0;
  narrTimer = setInterval(() => {
    box.textContent = text.slice(0, ++i);
    if (i >= text.length) clearInterval(narrTimer);
  }, 22);
}

// ── HUD ──────────────────────────────────────────────────────────────────────
function renderHud() {
  $('#party-strip').innerHTML = party.map((h) => `
    <div class="hud-unit ${h.hp <= 0 ? 'dnf' : ''} ${h.tilted ? 'tilted' : ''}">
      <div class="hud-portrait">${h.portrait}</div>
      <div class="hud-bars">
        <div class="hud-name">${h.short}</div>
        <div class="bar hp mini"><div style="width:${Math.max(0, h.hp / h.maxHp * 100)}%"></div></div>
        <div class="bar tilt mini"><div style="width:${Math.min(100, h.tilt)}%"></div></div>
      </div>
    </div>`).join('');
  $('#leg-num').textContent = leg;
  $('#run-flavor').textContent = LEG_NAMES[Math.min(leg - 1, LEG_NAMES.length - 1)];
}

// ── run flow ─────────────────────────────────────────────────────────────────
function freshParty() {
  return HEROES.map((h) => ({
    ...h, uid: h.id, hp: h.maxHp, tilt: rint(0, 15), tilted: false, announced: false,
    isEnemy: false, statuses: [],
  }));
}

function showRoster() {
  $('#title').classList.add('hidden');
  $('#roster').classList.remove('hidden');
  $('#roster-cards').innerHTML = party.map((h) => `
    <div class="roster-card">
      <div class="portrait big">${h.portrait}</div>
      <h3>${h.name}</h3>
      <div class="roster-title">${h.title}</div>
      <p>${h.bio}</p>
      <div class="roster-stats">HP ${h.maxHp} &nbsp;·&nbsp; SPD ${h.spd}</div>
    </div>`).join('');
}

async function beginRun() {
  if (runActive) return;
  runActive = true;
  $('#roster').classList.add('hidden');
  $('#hud').classList.remove('hidden');
  $('#narrator').classList.remove('hidden');
  leg = 1;
  usedEncounters = [];
  usedEvents = [];
  renderHud();
  narrate(pick(NARRATOR.intro));
  sfx('rev');
  setSpeed(0.55);
  await wait(4500);
  nextLeg();
}

async function nextLeg() {
  renderHud();
  if (party.every((h) => h.hp <= 0)) return endRun(false);
  if (leg > TOTAL_LEGS) return endRun(true);

  setSpeed(0.55);
  narrate(pick(NARRATOR.ambient));
  await wait(3000);
  presentRoute();
}

function routeOptionsForLeg() {
  if (leg === TOTAL_LEGS) return ['boss'];
  const pool = ['battle', 'battle', 'mystery', 'pit'];
  const a = pick(pool);
  let b = pick(pool);
  while (b === a) b = pick(pool);
  return [a, b];
}

function presentRoute() {
  setSpeed(0.18);
  const types = routeOptionsForLeg();
  const cards = $('#choice-cards');
  cards.innerHTML = types.map((t, i) => {
    const node = pick(ROUTE_NODES[t]);
    return `<button class="route-card ${t}" data-t="${t}" data-i="${i}">
      <div class="route-icon">${node.icon}</div>
      <div class="route-name">${node.title}</div>
      <div class="route-flavor">${node.flavor}</div>
    </button>`;
  }).join('');
  $('#choice-modal').classList.remove('hidden');

  armOnce(cards, async (btn) => {
    sfx('click');
    $('#choice-modal').classList.add('hidden');
    setSpeed(1.1);
    narrate('The engine howls. The road obliges.');
    await wait(2800);
    setSpeed(0.4);
    resolveNode(btn.dataset.t);
  });
}

async function resolveNode(type) {
  if (type === 'battle') {
    let enc = pick(ENCOUNTERS.filter((e) => !usedEncounters.includes(e.name)));
    if (!enc) enc = pick(ENCOUNTERS);
    usedEncounters.push(enc.name);
    const result = await startBattle(enc, party);
    renderHud();
    if (result === 'lose') return endRun(false);
    leg++;
    nextLeg();
  } else if (type === 'boss') {
    const result = await startBattle(BOSS_ENCOUNTER, party);
    renderHud();
    return endRun(result === 'win');
  } else if (type === 'pit') {
    showPit();
  } else {
    showMystery();
  }
}

// ── pit stop ─────────────────────────────────────────────────────────────────
function showPit() {
  $('#event-title').textContent = 'Pit Lane Sanctuary';
  $('#event-text').textContent = 'The air guns sing their soothing song. The crew may rest. Briefly. Choose one indulgence:';
  $('#event-options').innerHTML = PIT_OPTIONS.map((o, i) =>
    `<button class="event-btn" data-i="${i}"><b>${o.label}</b><small>${o.desc}</small></button>`).join('');
  $('#event-modal').classList.remove('hidden');

  armOnce($('#event-options'), (btn) => {
    sfx('heal');
    const eff = PIT_OPTIONS[+btn.dataset.i].effect;
    for (const h of party) {
      if (h.hp <= 0) continue;
      if (eff.healAll) h.hp = Math.min(h.maxHp, h.hp + rint(...eff.healAll));
      if (eff.tiltAll) h.tilt = Math.max(0, Math.min(100, h.tilt + eff.tiltAll));
      if (eff.buff) h.statuses.push({ id: eff.buff });
      if (h.tilt <= 45) h.tilted = false;
    }
    $('#event-modal').classList.add('hidden');
    narrate('Rested. Repaired. Re-sponsored. The road calls again.');
    renderHud();
    leg++;
    setTimeout(nextLeg, 1500);
  });
}

// ── mystery events ───────────────────────────────────────────────────────────
function showMystery() {
  let ev = pick(MYSTERY_EVENTS.filter((e) => !usedEvents.includes(e.title)));
  if (!ev) ev = pick(MYSTERY_EVENTS);
  usedEvents.push(ev.title);

  $('#event-title').textContent = ev.title;
  $('#event-text').textContent = ev.text;
  $('#event-options').innerHTML = ev.options.map((o, i) =>
    `<button class="event-btn" data-i="${i}"><b>${o.label}</b></button>`).join('');
  $('#event-modal').classList.remove('hidden');

  armOnce($('#event-options'), async (btn) => {
    sfx('click');
    const res = ev.options[+btn.dataset.i].result(Math.random);
    $('#event-text').textContent = res.text;
    $('#event-options').innerHTML = '';
    applyEventResult(res);
    renderHud();
    await wait(4200);
    $('#event-modal').classList.add('hidden');
    leg++;
    nextLeg();
  });
}

function applyEventResult(res) {
  for (const h of party) {
    if (h.hp <= 0) continue;
    if (res.healAll) h.hp = Math.min(h.maxHp, h.hp + res.healAll);
    if (res.dmgAll) h.hp = Math.max(1, h.hp - res.dmgAll); // events never kill — battles get that honor
    if (res.tiltAll) h.tilt = Math.max(0, Math.min(100, h.tilt + res.tiltAll));
    if (res.heroTilt && res.heroTilt[h.id] !== undefined)
      h.tilt = Math.max(0, Math.min(100, h.tilt + res.heroTilt[h.id]));
    if (h.tilt >= 100) h.tilted = true;
    if (h.tilt <= 45) h.tilted = false;
  }
}

// ── ending ───────────────────────────────────────────────────────────────────
function endRun(won) {
  runActive = false;
  $('#hud').classList.add('hidden');
  $('#narrator').classList.add('hidden');
  $('#end').classList.remove('hidden');
  setSpeed(won ? 1.2 : 0.05);
  if (won) {
    $('#end-title').innerHTML = '<span>CHEQUERED</span><span class="gp">FLAG</span>';
    $('#end-text').textContent = 'Against all telemetry, you survive the season. The trophy is plastic. The glory, eternal. The Relic claims he did it better in 1997.';
    sfx('win');
  } else {
    $('#end-title').innerHTML = '<span>DOUBLE</span><span class="gp">DNF</span>';
    $('#end-text').textContent = 'The team retires to the motorhome to stare at walls. Ruin has come to your paddock. Again. There is always next season — there is ALWAYS next season.';
    sfx('lose');
  }
}

// ── boot ─────────────────────────────────────────────────────────────────────
initOverworld(document.getElementById('world'));
initBattle({ narrate, sfx });

$('#btn-start').onclick = () => {
  sfx('rev');
  party = freshParty();
  showRoster();
};
$('#btn-race').onclick = () => { sfx('click'); beginRun(); };
$('#btn-again').onclick = () => {
  sfx('click');
  $('#end').classList.add('hidden');
  party = freshParty();
  showRoster();
};
$('#btn-mute').onclick = (e) => {
  e.target.textContent = toggleMute() ? 'SOUND: OFF' : 'SOUND: ON';
};
