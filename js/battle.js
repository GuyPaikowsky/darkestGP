// ── 2D turn-based combat, Darkest-Dungeon-side-view style ───────────────────
import { ENEMIES, NARRATOR, MELTDOWN_BARKS } from './data.js';

const $ = (s) => document.querySelector(s);
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const rint = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

let deps = { narrate: () => {}, sfx: () => {} };
export function initBattle(d) { deps = d; }

let heroes = [], enemies = [], resolveBattle = null;

export function startBattle(encounter, party) {
  heroes = party; // live references — hp/tilt persist across battles
  enemies = encounter.enemies.map((id, i) => {
    const def = ENEMIES[id];
    return {
      ...def, uid: `e${i}`, hp: def.maxHp, tilt: 0, isEnemy: true,
      statuses: [],
    };
  });

  $('#battle').classList.remove('hidden');
  banner(encounter.name);
  deps.narrate(pick(encounter.enemies.includes('safetycar') ? NARRATOR.bossIntro : NARRATOR.battleStart));
  deps.sfx('battle');

  renderAll();
  return new Promise((resolve) => {
    resolveBattle = resolve;
    setTimeout(roundLoop, 1400);
  });
}

function banner(text) {
  const b = $('#battle-banner');
  b.textContent = text;
  b.classList.remove('show');
  void b.offsetWidth;
  b.classList.add('show');
}

// ── rendering ────────────────────────────────────────────────────────────────

function unitCard(u) {
  const hpPct = Math.max(0, (u.hp / u.maxHp) * 100);
  const tiltPct = Math.min(100, u.tilt);
  const dead = u.hp <= 0;
  const drs = u.statuses?.some((s) => s.id === 'drs');
  return `
  <div class="unit ${u.isEnemy ? 'enemy' : 'hero'} ${dead ? 'dnf' : ''} ${u.tilted ? 'tilted' : ''}" data-uid="${u.uid}">
    <div class="bark" data-bark></div>
    <div class="portrait">${u.portrait}</div>
    <div class="unit-name">${u.isEnemy ? u.name : u.short}${drs ? ' <span class="drs-tag">DRS</span>' : ''}</div>
    <div class="bar hp"><div style="width:${hpPct}%"></div><span>${Math.max(0, u.hp)}/${u.maxHp}</span></div>
    ${u.isEnemy ? '' : `<div class="bar tilt"><div style="width:${tiltPct}%"></div><span>TILT ${u.tilt}</span></div>`}
    ${dead ? `<div class="dnf-stamp">${u.isEnemy ? 'RETIRED' : 'DNF'}</div>` : ''}
  </div>`;
}

function renderAll() {
  $('#hero-row').innerHTML = heroes.map(unitCard).join('');
  $('#enemy-row').innerHTML = enemies.map(unitCard).join('');
}

function el(uid) { return document.querySelector(`.unit[data-uid="${uid}"]`); }

function floatText(uid, text, cls) {
  const node = el(uid);
  if (!node) return;
  const f = document.createElement('div');
  f.className = `float ${cls}`;
  f.textContent = text;
  node.appendChild(f);
  setTimeout(() => f.remove(), 1300);
}

async function bark(uid, text) {
  const node = el(uid)?.querySelector('[data-bark]');
  if (!node) return;
  node.textContent = text;
  node.classList.add('show');
  await wait(2100);
  node.classList.remove('show');
}

function shake() {
  $('#arena').classList.remove('shake');
  void $('#arena').offsetWidth;
  $('#arena').classList.add('shake');
}

// ── core combat math ─────────────────────────────────────────────────────────

function applyDamage(target, amount, crit) {
  target.hp -= amount;
  floatText(target.uid, `−${amount}${crit ? '!!' : ''}`, crit ? 'crit' : 'dmg');
  if (crit) shake();
  deps.sfx(crit ? 'crit' : 'hit');
  if (target.hp <= 0 && !target.isEnemy && !target.announced) {
    target.announced = true;
    deps.narrate(pick(NARRATOR.heroDown));
  }
}

function applyTilt(unit, amount) {
  if (unit.isEnemy || unit.hp <= 0) return;
  unit.tilt = Math.max(0, Math.min(100, unit.tilt + amount));
  if (amount !== 0) floatText(unit.uid, `${amount > 0 ? '+' : ''}${amount} tilt`, amount > 0 ? 'tilt-up' : 'tilt-down');
  if (unit.tilt >= 100 && !unit.tilted) {
    unit.tilted = true;
    unit.tilt = 100;
    deps.narrate(pick(NARRATOR.meltdown));
    deps.sfx('meltdown');
    bark(unit.uid, pick(MELTDOWN_BARKS));
  }
  if (unit.tilted && unit.tilt <= 45) unit.tilted = false; // composure regained
}

function heal(unit, amount) {
  if (unit.hp <= 0) return;
  unit.hp = Math.min(unit.maxHp, unit.hp + amount);
  floatText(unit.uid, `+${amount}`, 'heal');
  deps.sfx('heal');
}

function aliveHeroes() { return heroes.filter((h) => h.hp > 0); }
function aliveEnemies() { return enemies.filter((e) => e.hp > 0); }

// ── turn loop ────────────────────────────────────────────────────────────────

async function roundLoop() {
  while (true) {
    const order = [...aliveHeroes(), ...aliveEnemies()]
      .sort((a, b) => (b.spd + Math.random() * 3) - (a.spd + Math.random() * 3));

    for (const unit of order) {
      if (unit.hp <= 0) continue;
      if (aliveHeroes().length === 0 || aliveEnemies().length === 0) break;

      el(unit.uid)?.classList.add('active');
      $('#turn-label').textContent = unit.isEnemy ? `${unit.name} acts...` : `${unit.short}'s move`;

      if (!unit.isEnemy && unit.tilted && Math.random() < 0.4) {
        await bark(unit.uid, pick(MELTDOWN_BARKS));
        floatText(unit.uid, 'too tilted!', 'tilt-up');
        await wait(500);
      } else if (unit.isEnemy) {
        await wait(700);
        await enemyAct(unit);
      } else {
        await heroAct(unit);
      }

      el(unit.uid)?.classList.remove('active');
      renderAll();
      await wait(350);

      if (aliveEnemies().length === 0) return endBattle('win');
      if (aliveHeroes().length === 0) return endBattle('lose');
    }
  }
}

async function enemyAct(unit) {
  const ab = pick(unit.abilities);
  await bark(unit.uid, pick(ab.barks));
  if (ab.target === 'none') {
    // safety car stalls dramatically; everyone stews
    for (const h of aliveHeroes()) applyTilt(h, ab.selfTiltAura ?? 8);
    renderAll();
    return;
  }
  const targets = ab.target === 'allHeroes' ? aliveHeroes() : [pick(aliveHeroes())];
  for (const t of targets) {
    if (ab.dmg) {
      const crit = Math.random() < 0.08;
      let dmg = rint(...ab.dmg);
      if (crit) { dmg = Math.ceil(dmg * 1.5); deps.narrate(pick(NARRATOR.crit)); }
      applyDamage(t, dmg, crit);
    }
    if (ab.tiltTarget) applyTilt(t, ab.tiltTarget + (Math.random() < 0.08 ? 8 : 0));
  }
  renderAll();
}

function heroDamageMult(hero) {
  let m = 1;
  if (hero.tilted) m *= 0.75;
  if (hero.statuses?.some((s) => s.id === 'drs')) m *= 1.2;
  return m;
}

function heroAct(hero) {
  return new Promise((resolve) => {
    const bar = $('#ability-bar');
    bar.innerHTML = hero.abilities.map((ab, i) =>
      `<button class="ability" data-i="${i}"><b>${ab.name}</b><small>${ab.desc}</small></button>`).join('');
    bar.classList.add('show');

    const turn = { acted: false }; // shared guard: switching abilities is fine, acting twice is not
    bar.querySelectorAll('.ability').forEach((btn) => {
      btn.onclick = () => {
        if (turn.acted) return;
        selectAbility(hero, hero.abilities[+btn.dataset.i], turn, resolve);
      };
    });
  });
}

function clearTargeting() {
  document.querySelectorAll('.unit.targetable').forEach((n) => {
    n.classList.remove('targetable');
    n.onclick = null;
  });
}

function selectAbility(hero, ab, turn, resolve) {
  clearTargeting();
  const finish = async (fn) => {
    if (turn.acted) return;
    turn.acted = true;
    $('#ability-bar').classList.remove('show');
    $('#ability-bar').innerHTML = '';
    clearTargeting();
    await bark(hero.uid, pick(ab.barks));
    fn();
    renderAll();
    resolve();
  };

  const needsTarget =
    ab.target === 'enemy' ? aliveEnemies()
    : ab.target === 'ally' ? aliveHeroes()
    : null;

  if (!needsTarget) {
    finish(() => execute(hero, ab, null));
    return;
  }

  $('#turn-label').textContent = `${hero.short}: choose a target`;
  for (const t of needsTarget) {
    const node = el(t.uid);
    node.classList.add('targetable');
    node.onclick = () => finish(() => execute(hero, ab, t));
  }
}

function execute(hero, ab, target) {
  const mult = heroDamageMult(hero);

  const hitOne = (t) => {
    const crit = Math.random() < 0.12;
    let dmg = Math.max(1, Math.round(rint(...ab.dmg) * mult * (crit ? 1.6 : 1)));
    if (crit) deps.narrate(pick(NARRATOR.crit));
    applyDamage(t, dmg, crit);
    if (ab.tiltTarget) applyTilt(t, ab.tiltTarget);
  };

  switch (ab.target) {
    case 'enemy': hitOne(target); break;
    case 'allEnemies': aliveEnemies().forEach(hitOne); break;
    case 'ally':
      if (ab.heal) heal(target, rint(...ab.heal));
      if (ab.tiltTargetAlly) applyTilt(target, ab.tiltTargetAlly);
      break;
    case 'allAllies':
      aliveHeroes().forEach((h) => ab.heal && heal(h, rint(...ab.heal)));
      break;
    case 'self': break;
  }
  if (ab.tiltSelf) applyTilt(hero, ab.tiltSelf);
  if (ab.tiltParty) aliveHeroes().filter((h) => h !== hero).forEach((h) => applyTilt(h, ab.tiltParty));
}

async function endBattle(result) {
  $('#ability-bar').classList.remove('show');
  $('#turn-label').textContent = '';
  // battle buffs expire
  for (const h of heroes) h.statuses = [];
  if (result === 'win') {
    deps.narrate(pick(NARRATOR.victory));
    banner('VICTORY — CHEQUERED FLAG');
    deps.sfx('win');
  } else {
    banner('DOUBLE DNF — ALL IS LOST');
    deps.sfx('lose');
  }
  await wait(2600);
  $('#battle').classList.add('hidden');
  resolveBattle(result);
}
