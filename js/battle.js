// ── 2D turn-based combat, Darkest-Dungeon-side-view style ───────────────────
import { ENEMIES, NARRATOR, MELTDOWN_BARKS, AFFLICTIONS, FLOW_STATE } from './data.js';

const $ = (s) => document.querySelector(s);
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const rint = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

let deps = { narrate: () => {}, sfx: () => {} };
export function initBattle(d) { deps = d; }

let heroes = [], enemies = [], resolveBattle = null;

export function startBattle(encounter, party) {
  heroes = party; // live references — hp/tilt persist across battles
  for (const h of heroes) h.cds = {};
  enemies = encounter.enemies.map((id, i) => {
    const def = ENEMIES[id];
    const eliteMult = encounter.elite ? 1.3 : 1;
    const e = {
      ...def, uid: `e${i}`, isEnemy: true, statuses: [], tilt: 0,
      maxHp: Math.round(def.maxHp * eliteMult), eliteBonus: encounter.elite ? 1 : 0,
      shifted: false,
    };
    e.hp = e.maxHp;
    e.intent = pick(e.abilities);
    return e;
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

// ── trinket-aware stats ──────────────────────────────────────────────────────

function fx(unit) { return unit.trinket?.fx ?? {}; }
function unitSpd(unit) { return unit.spd + (fx(unit).spd ?? 0); }
function critChance(unit) { return 0.12 + (fx(unit).crit ?? 0); }
function tiltGainMult(unit) { return fx(unit).tiltGain ?? 1; }

function heroDamageMult(hero) {
  let m = fx(hero).dmg ?? 1;
  if (hero.affliction === 'defeatist') m *= 0.7;
  else if (hero.affliction) m *= 0.85;
  if (hero.flow) m *= 1.3;
  if (hero.statuses?.some((s) => s.id === 'drs')) m *= 1.2;
  return m;
}

// ── rendering ────────────────────────────────────────────────────────────────

function intentLabel(e) {
  if (!e.intent) return '';
  const icon = e.intent.target === 'allHeroes' ? '☄ ALL' : e.intent.target === 'none' ? '⏱' : '🗡';
  return `<div class="intent" title="enemy intent">${icon} ${e.intent.name}</div>`;
}

function stateTag(u) {
  if (u.flow) return `<div class="state-tag flow">★ ${FLOW_STATE.name}</div>`;
  if (u.affliction) {
    const a = AFFLICTIONS[u.affliction];
    return `<div class="state-tag affl" style="--affl:${a.color}">${a.name}</div>`;
  }
  return '';
}

function unitCard(u) {
  const hpPct = Math.max(0, (u.hp / u.maxHp) * 100);
  const tiltPct = Math.min(100, u.tilt);
  const dead = u.hp <= 0;
  const drs = u.statuses?.some((s) => s.id === 'drs');
  return `
  <div class="unit ${u.isEnemy ? 'enemy' : 'hero'} ${dead ? 'dnf' : ''} ${u.affliction ? 'afflicted' : ''} ${u.flow ? 'flowing' : ''}" data-uid="${u.uid}">
    <div class="bark" data-bark></div>
    ${u.isEnemy && !dead ? intentLabel(u) : ''}
    <div class="portrait">${u.portrait}</div>
    <div class="unit-name">${u.isEnemy ? u.name : u.short}${drs ? ' <span class="drs-tag">DRS</span>' : ''}</div>
    ${stateTag(u)}
    <div class="bar hp"><div style="width:${hpPct}%"></div><span>${Math.max(0, u.hp)}/${u.maxHp}</span></div>
    ${u.isEnemy ? '' : `<div class="bar tilt"><div style="width:${tiltPct}%"></div><span>TILT ${u.tilt}</span></div>`}
    ${u.trinket && !u.isEnemy ? `<div class="trinket-tag" title="${u.trinket.desc}">◈ ${u.trinket.name}</div>` : ''}
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

// ── juice: lunges, sparks, smoke ─────────────────────────────────────────────

async function lunge(attacker) {
  const node = el(attacker.uid);
  if (!node) return;
  node.classList.add(attacker.isEnemy ? 'lunge-left' : 'lunge-right');
  await wait(220);
}

function settle(attacker) {
  el(attacker.uid)?.classList.remove('lunge-left', 'lunge-right');
}

function sparks(uid, color = '#ff6a4a') {
  const node = el(uid);
  if (!node) return;
  for (let i = 0; i < 7; i++) {
    const s = document.createElement('div');
    s.className = 'spark';
    s.style.setProperty('--dx', `${(Math.random() - 0.5) * 130}px`);
    s.style.setProperty('--dy', `${-20 - Math.random() * 90}px`);
    s.style.background = color;
    s.style.left = `${35 + Math.random() * 30}%`;
    s.style.top = `${30 + Math.random() * 20}%`;
    node.appendChild(s);
    setTimeout(() => s.remove(), 700);
  }
}

function hitFlash(uid) {
  const node = el(uid);
  if (!node) return;
  node.classList.remove('hit-flash');
  void node.offsetWidth;
  node.classList.add('hit-flash');
}

function smoke(uid) {
  const node = el(uid);
  if (!node) return;
  for (let i = 0; i < 5; i++) {
    const p = document.createElement('div');
    p.className = 'smoke';
    p.style.left = `${20 + Math.random() * 60}%`;
    p.style.animationDelay = `${i * 0.12}s`;
    node.appendChild(p);
    setTimeout(() => p.remove(), 1600);
  }
}

// ── core combat math ─────────────────────────────────────────────────────────

function applyDamage(target, amount, crit) {
  const wasAlive = target.hp > 0;
  target.hp -= amount;
  floatText(target.uid, `−${amount}${crit ? '!!' : ''}`, crit ? 'crit' : 'dmg');
  hitFlash(target.uid);
  sparks(target.uid, crit ? '#e10600' : '#ff9a5a');
  if (crit) shake();
  deps.sfx(crit ? 'crit' : 'hit');
  if (target.hp <= 0 && wasAlive) {
    smoke(target.uid);
    if (!target.isEnemy && !target.announced) {
      target.announced = true;
      deps.narrate(pick(NARRATOR.heroDown));
    }
  }
  checkPhaseShift(target);
}

async function checkPhaseShift(enemy) {
  if (!enemy.isEnemy || !enemy.phase2 || enemy.shifted) return;
  if (enemy.hp <= 0 || enemy.hp > enemy.maxHp / 2) return;
  enemy.shifted = true;
  const p2 = enemy.phase2;
  enemy.name = p2.name;
  enemy.spd = p2.spd;
  enemy.abilities = p2.abilities;
  enemy.intent = pick(p2.abilities);
  enemy.hp = Math.min(enemy.maxHp, enemy.hp + p2.healOnShift);
  banner(p2.banner);
  shake();
  deps.sfx('meltdown');
  deps.narrate('The lights blink out. The menace remains — now invisible, omnipresent, and pettier.');
  renderAll();
  await bark(enemy.uid, p2.bark);
}

function applyTilt(unit, amount) {
  if (unit.isEnemy || unit.hp <= 0) return;
  if (amount > 0) {
    if (unit.flow) amount = 0; // flow state: serenity is armor
    else amount = Math.round(amount * tiltGainMult(unit));
  }
  if (amount === 0) return;
  unit.tilt = Math.max(0, Math.min(100, unit.tilt + amount));
  floatText(unit.uid, `${amount > 0 ? '+' : ''}${amount} tilt`, amount > 0 ? 'tilt-up' : 'tilt-down');

  if (unit.tilt >= 100 && !unit.affliction && !unit.flow) {
    if (Math.random() < 0.2) {
      unit.flow = true;
      deps.narrate(`${unit.short} transcends. The radio falls silent. The lap times turn purple.`);
      deps.sfx('heal');
      bark(unit.uid, pick(FLOW_STATE.barks));
    } else {
      unit.affliction = pick(Object.keys(AFFLICTIONS));
      deps.narrate(pick(NARRATOR.meltdown));
      deps.sfx('meltdown');
      bark(unit.uid, pick(MELTDOWN_BARKS));
    }
  }
  // composure regained at low tilt
  if (unit.tilt < 30) { unit.affliction = null; unit.flow = false; }
}

function heal(unit, amount) {
  if (unit.hp <= 0) return;
  unit.hp = Math.min(unit.maxHp, unit.hp + amount);
  floatText(unit.uid, `+${amount}`, 'heal');
  sparks(unit.uid, '#5fae6e');
  deps.sfx('heal');
}

function aliveHeroes() { return heroes.filter((h) => h.hp > 0); }
function aliveEnemies() { return enemies.filter((e) => e.hp > 0); }

// ── afflicted behavior: returns true if the unit's turn was consumed ────────

async function afflictionActs(hero) {
  if (hero.flow) {
    // flow decays toward composure and soothes the garage
    hero.tilt = Math.max(0, hero.tilt - 8);
    if (hero.tilt < 30) hero.flow = false;
    if (Math.random() < 0.4) await bark(hero.uid, pick(FLOW_STATE.barks));
    return false;
  }
  if (!hero.affliction) return false;
  const a = AFFLICTIONS[hero.affliction];

  if (hero.affliction === 'furious' && Math.random() < 0.35 && aliveEnemies().length) {
    await bark(hero.uid, pick(a.barks));
    const target = pick(aliveEnemies());
    await lunge(hero);
    applyDamage(target, rint(3, 6), false);
    settle(hero);
    aliveHeroes().filter((h) => h !== hero).forEach((h) => applyTilt(h, 3));
    return true;
  }
  if (hero.affliction === 'paranoid' && Math.random() < 0.3) {
    await bark(hero.uid, pick(a.barks));
    floatText(hero.uid, 'refuses orders!', 'tilt-up');
    aliveHeroes().filter((h) => h !== hero).forEach((h) => applyTilt(h, 4));
    return true;
  }
  if (hero.affliction === 'defeatist' && Math.random() < 0.25) {
    await bark(hero.uid, pick(a.barks));
    floatText(hero.uid, 'gives up this turn', 'tilt-up');
    return true;
  }
  return false;
}

// ── turn loop ────────────────────────────────────────────────────────────────

async function roundLoop() {
  while (true) {
    const order = [...aliveHeroes(), ...aliveEnemies()]
      .sort((a, b) => (unitSpd(b) + Math.random() * 3) - (unitSpd(a) + Math.random() * 3));

    for (const unit of order) {
      if (unit.hp <= 0) continue;
      if (aliveHeroes().length === 0 || aliveEnemies().length === 0) break;

      el(unit.uid)?.classList.add('active');
      $('#turn-label').textContent = unit.isEnemy ? `${unit.name} acts...` : `${unit.short}'s move`;

      if (unit.isEnemy) {
        await wait(700);
        await enemyAct(unit);
      } else {
        // tick down cooldowns at the start of the hero's turn
        for (const k of Object.keys(unit.cds)) unit.cds[k] = Math.max(0, unit.cds[k] - 1);
        const consumed = await afflictionActs(unit);
        if (!consumed) await heroAct(unit);
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
  const ab = unit.intent ?? pick(unit.abilities);
  await bark(unit.uid, pick(ab.barks));
  if (ab.target === 'none') {
    for (const h of aliveHeroes()) applyTilt(h, ab.selfTiltAura ?? 8);
  } else {
    await lunge(unit);
    const targets = ab.target === 'allHeroes' ? aliveHeroes() : [pick(aliveHeroes())];
    for (const t of targets) {
      if (ab.dmg) {
        const crit = Math.random() < 0.08;
        let dmg = rint(...ab.dmg) + unit.eliteBonus;
        if (crit) { dmg = Math.ceil(dmg * 1.5); deps.narrate(pick(NARRATOR.crit)); }
        applyDamage(t, dmg, crit);
      }
      if (ab.tiltTarget) applyTilt(t, ab.tiltTarget + (Math.random() < 0.08 ? 8 : 0));
    }
    settle(unit);
  }
  unit.intent = pick(unit.abilities); // telegraph the next move
  renderAll();
}

function heroAct(hero) {
  return new Promise((resolve) => {
    const bar = $('#ability-bar');
    bar.innerHTML = hero.abilities.map((ab, i) => {
      const onCd = (hero.cds[i] ?? 0) > 0;
      return `<button class="ability ${onCd ? 'on-cd' : ''}" data-i="${i}" ${onCd ? 'disabled' : ''}>
        <b>${ab.name}</b><small>${ab.desc}</small>
        ${onCd ? `<span class="cd-badge">${hero.cds[i]}</span>` : (ab.cd ? `<span class="cd-note">CD ${ab.cd}</span>` : '')}
      </button>`;
    }).join('');
    bar.classList.add('show');

    const turn = { acted: false }; // shared guard: switching abilities is fine, acting twice is not
    bar.querySelectorAll('.ability:not(.on-cd)').forEach((btn) => {
      btn.onclick = () => {
        if (turn.acted) return;
        selectAbility(hero, +btn.dataset.i, turn, resolve);
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

function selectAbility(hero, abIndex, turn, resolve) {
  const ab = hero.abilities[abIndex];
  clearTargeting();
  const finish = async (fn) => {
    if (turn.acted) return;
    turn.acted = true;
    if (ab.cd) hero.cds[abIndex] = ab.cd + 1; // +1 because it ticks down this same turn cycle
    $('#ability-bar').classList.remove('show');
    $('#ability-bar').innerHTML = '';
    clearTargeting();
    await bark(hero.uid, pick(ab.barks));
    await fn();
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

async function execute(hero, ab, target) {
  const mult = heroDamageMult(hero);

  const hitOne = (t) => {
    const crit = Math.random() < critChance(hero);
    let dmg = Math.max(1, Math.round(rint(...ab.dmg) * mult * (crit ? 1.6 : 1)));
    if (crit) deps.narrate(pick(NARRATOR.crit));
    applyDamage(t, dmg, crit);
    if (ab.tiltTarget) applyTilt(t, ab.tiltTarget);
  };

  if (ab.target === 'enemy' || ab.target === 'allEnemies') {
    await lunge(hero);
    if (ab.target === 'enemy') hitOne(target);
    else aliveEnemies().forEach(hitOne);
    settle(hero);
  } else if (ab.target === 'ally') {
    if (ab.heal) heal(target, rint(...ab.heal));
    if (ab.tiltTargetAlly) applyTilt(target, ab.tiltTargetAlly);
  } else if (ab.target === 'allAllies') {
    aliveHeroes().forEach((h) => ab.heal && heal(h, rint(...ab.heal)));
  }
  if (ab.tiltSelf) applyTilt(hero, ab.tiltSelf);
  if (ab.tiltParty) aliveHeroes().filter((h) => h !== hero).forEach((h) => applyTilt(h, ab.tiltParty));
}

async function endBattle(result) {
  clearTargeting();
  $('#ability-bar').classList.remove('show');
  $('#ability-bar').innerHTML = '';
  $('#turn-label').textContent = '';
  // battle buffs expire; afflictions cool slightly between encounters
  for (const h of heroes) {
    h.statuses = [];
    h.cds = {};
    if (h.affliction && h.tilt >= 100) h.tilt = 85;
  }
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
