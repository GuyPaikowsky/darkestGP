// ── DARKEST GRAND PRIX — all the flavor lives here ──────────────────────────

// tiny SVG portrait factory: helmeted bust, parameterized
function helmet(color, visor, extra = '') {
  return `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <ellipse cx="50" cy="92" rx="34" ry="14" fill="#1a1212"/>
    <rect x="28" y="62" width="44" height="32" rx="10" fill="${color}" stroke="#0d0808" stroke-width="3"/>
    <circle cx="50" cy="40" r="26" fill="${color}" stroke="#0d0808" stroke-width="3"/>
    <path d="M27 38 q23 -16 46 0 l0 10 q-23 12 -46 0 z" fill="${visor}" stroke="#0d0808" stroke-width="2.5"/>
    <path d="M30 24 q20 -12 40 0" fill="none" stroke="#0d0808" stroke-width="2" opacity="0.5"/>
    ${extra}
  </svg>`;
}

export const HEROES = [
  {
    id: 'relic',
    name: 'GIANCARLO "THE RELIC" FUMO',
    short: 'The Relic',
    title: 'Seven-Time Champion (allegedly, ask him)',
    bio: 'Won everything in 1997. Has mentioned it daily since. His knees creak louder than the gearbox.',
    maxHp: 34, spd: 3,
    portrait: helmet('#8a1f1f', '#d9b13b', '<text x="50" y="20" font-size="14" text-anchor="middle" fill="#d9b13b">♛</text>'),
    abilities: [
      { id: 'lunge', name: 'Lunge of Desperation', desc: 'A divebomb from 1997. 6–10 dmg, +8 tilt to target.',
        target: 'enemy', dmg: [6, 10], tiltTarget: 8,
        barks: ['THAT is how we did it in MY day!', 'I had that corner. I ALWAYS have that corner.'] },
      { id: 'whine', name: 'Vintage Whine', desc: 'Complains beautifully. Heals own tilt −25, party −5.',
        target: 'self', tiltSelf: -25, tiltParty: -5,
        barks: ['In 1997 the tyres were made of COURAGE.', 'The steering wheel had THREE buttons. Three!'] },
      { id: 'elbows', name: 'Elbows Out', desc: 'Defensive masterclass. 4–7 dmg, −10 own tilt.',
        target: 'enemy', dmg: [4, 7], tiltSelf: -10,
        barks: ['Respect your elders. Or be wall.', 'I leave exactly one car width. Mine.'] },
    ],
  },
  {
    id: 'rookie',
    name: 'PERKY VANTABLACK III',
    short: 'The Rookie',
    title: 'Generational Talent (source: his own podcast)',
    bio: 'Nineteen. Sponsored by an energy drink that is legally a solvent. Has never known fear, or torque.',
    maxHp: 26, spd: 7,
    portrait: helmet('#1f7a4f', '#a8f0c0', '<path d="M40 8 l8 10 l-12 2 z" fill="#a8f0c0"/>'),
    abilities: [
      { id: 'yolo', name: 'YOLO Divebomb', desc: 'Sends it. 9–14 dmg, +18 tilt to self.',
        target: 'enemy', dmg: [9, 14], tiltSelf: 18,
        barks: ['LATE BRAKING IS A SOCIAL CONSTRUCT!', 'If in doubt, ABSOLUTELY send it!'] },
      { id: 'post', name: 'Post About It', desc: 'Engagement heals. −20 own tilt, −8 party tilt.',
        target: 'self', tiltSelf: -20, tiltParty: -8,
        barks: ['Hashtag blessed, hashtag no brakes.', 'This is GREAT content, you guys.'] },
      { id: 'slipstream', name: 'Slipstream Snap', desc: 'Quick jab. 5–8 dmg, acts fast.',
        target: 'enemy', dmg: [5, 8],
        barks: ['DRS? I barely know her!', 'Beep beep, grandpa.'] },
    ],
  },
  {
    id: 'brenda',
    name: 'BRENDA "TORQUE" OKAFOR',
    short: 'The Engineer',
    title: 'Chief Mechanic & Last Sane Person',
    bio: 'Keeps the car alive with duct tape, spite, and a wrench named Gerald. Has seen things in the gearbox.',
    maxHp: 38, spd: 4,
    portrait: helmet('#b0641e', '#3d2c14', '<rect x="62" y="6" width="6" height="20" rx="2" fill="#999" transform="rotate(30 65 16)"/>'),
    abilities: [
      { id: 'percussive', name: 'Percussive Maintenance', desc: 'Heals an ally 7–11 HP via wrench.',
        target: 'ally', heal: [7, 11],
        barks: ['Gerald fixes all. Gerald forgives nothing.', 'It is not broken. It is pre-fixed.'] },
      { id: 'ducttape', name: 'Duct Tape Ritual', desc: 'Heals all allies 3–5 HP. The tape demands faith.',
        target: 'allAllies', heal: [3, 5],
        barks: ['The grey roll provides.', 'Structural? It is now.'] },
      { id: 'wrench', name: 'Gerald, Airborne', desc: 'Throws Gerald. 7–10 dmg. Gerald returns. Somehow.',
        target: 'enemy', dmg: [7, 10],
        barks: ['FETCH, GERALD!', 'Warranty voided. Theirs.'] },
    ],
  },
  {
    id: 'nigel',
    name: 'NIGEL PLOUGHSHARE',
    short: 'The Strategist',
    title: 'Head of Strategy (Currently Under Investigation)',
    bio: 'Once pitted a driver four times in three laps. Calls it "the rhombus strategy." Nobody can prove it was wrong.',
    maxHp: 30, spd: 5,
    portrait: helmet('#3a4a8a', '#cdd6f4', '<circle cx="50" cy="14" r="6" fill="none" stroke="#cdd6f4" stroke-width="2"/>'),
    abilities: [
      { id: 'boxbox', name: 'BOX BOX BOX!', desc: 'Inspires an ally: −20 tilt, +3 HP. Or confuses them. Same thing.',
        target: 'ally', heal: [3, 3], tiltTargetAlly: -20,
        barks: ['Box. BOX. Confirm box?? BOX!', 'We are checking. We are... still checking.'] },
      { id: 'questionable', name: 'Questionable Strategy', desc: 'Wildcard: 2–14 dmg. The rhombus knows no fear.',
        target: 'enemy', dmg: [2, 14],
        barks: ['It worked in the simulation. Once.', 'Plan F. As in, F it.'] },
      { id: 'gantt', name: 'Aggressive Gantt Chart', desc: 'Hits all enemies 3–5 dmg with pure bureaucracy.',
        target: 'allEnemies', dmg: [3, 5],
        barks: ['Per the deliverables: SUFFER.', 'You have been scheduled for defeat.'] },
    ],
  },
];

export const ENEMIES = {
  backmarker: {
    id: 'backmarker', name: 'The Backmarker', maxHp: 16, spd: 2,
    portrait: helmet('#4a4a52', '#222', '<text x="50" y="18" font-size="13" text-anchor="middle" fill="#6cf">🏳</text>'),
    flavor: 'Has not seen a blue flag, a mirror, or the inside of the points since 2019.',
    abilities: [
      { name: 'Sudden Existence', desc: '', target: 'hero', dmg: [3, 6], tiltTarget: 10,
        barks: ['I am ALSO racing!', 'My race engineer says nothing. Ever.'] },
      { name: 'Defend P19', desc: '', target: 'hero', dmg: [2, 4], tiltTarget: 14,
        barks: ['This is MY corner of despair.'] },
    ],
  },
  steward: {
    id: 'steward', name: "The Stewards' Inquiry", maxHp: 24, spd: 4,
    portrait: helmet('#26262e', '#e8e0c8', '<rect x="36" y="2" width="28" height="12" rx="2" fill="#e8e0c8"/><text x="50" y="12" font-size="9" text-anchor="middle" fill="#222">§4.2</text>'),
    flavor: 'It is noted. It is being investigated. It will be investigated after the heat death of the universe.',
    abilities: [
      { name: 'Five Second Penalty', desc: '', target: 'hero', dmg: [4, 7], tiltTarget: 12,
        barks: ['Car 1, that manoeuvre is NOTED.', 'Incident under investigation. Forever.'] },
      { name: 'Document 47', desc: '', target: 'allHeroes', dmg: [2, 4], tiltTarget: 8,
        barks: ['Please report to the stewards. Bring snacks.'] },
    ],
  },
  gremlin: {
    id: 'gremlin', name: 'Gravel Trap Gremlin', maxHp: 20, spd: 6,
    portrait: helmet('#5a4632', '#9b8460', '<circle cx="38" cy="10" r="4" fill="#9b8460"/><circle cx="60" cy="7" r="3" fill="#9b8460"/>'),
    flavor: 'Lives in the kitty litter at Turn 4. Eats front wings. Collects beached cars like trophies.',
    abilities: [
      { name: 'Gravel Shower', desc: '', target: 'allHeroes', dmg: [2, 5], tiltTarget: 6,
        barks: ['*gravel noises of pure malice*'] },
      { name: 'Beach The Car', desc: '', target: 'hero', dmg: [5, 9], tiltTarget: 10,
        barks: ['Welcome to the beach. No towels.'] },
    ],
  },
  weather: {
    id: 'weather', name: 'A Spot of Weather', maxHp: 30, spd: 5,
    portrait: `<svg viewBox="0 0 100 100"><ellipse cx="50" cy="40" rx="32" ry="20" fill="#3c4254" stroke="#0d0808" stroke-width="3"/><ellipse cx="30" cy="48" rx="18" ry="13" fill="#2e3342"/><ellipse cx="70" cy="48" rx="18" ry="13" fill="#2e3342"/><path d="M38 64 l-6 16 M52 64 l-6 16 M66 64 l-6 16" stroke="#7fa8d9" stroke-width="3" stroke-linecap="round"/></svg>`,
    flavor: 'The radar says it will pass in ten minutes. The radar has said this for three hours.',
    abilities: [
      { name: 'Sudden Monsoon', desc: '', target: 'allHeroes', dmg: [3, 6], tiltTarget: 9,
        barks: ['*the radar shrugs*', 'Inters? Full wets? Wrong either way.'] },
      { name: 'One Dry Line', desc: '', target: 'hero', dmg: [6, 10], tiltTarget: 8,
        barks: ['The dry line is a lie.'] },
    ],
  },
  safetycar: {
    id: 'safetycar', name: 'THE SAFETY CAR', maxHp: 70, spd: 1, boss: true,
    portrait: `<svg viewBox="0 0 100 100"><rect x="14" y="46" width="72" height="26" rx="9" fill="#b8b8c0" stroke="#0d0808" stroke-width="3"/><path d="M28 48 l10 -16 h24 l10 16 z" fill="#9a9aa4" stroke="#0d0808" stroke-width="3"/><rect x="30" y="22" width="40" height="8" rx="4" fill="#e6a23c"/><circle cx="30" cy="74" r="9" fill="#1a1212" stroke="#0d0808" stroke-width="3"/><circle cx="70" cy="74" r="9" fill="#1a1212" stroke="#0d0808" stroke-width="3"/><text x="50" y="64" font-size="11" text-anchor="middle" fill="#222" font-weight="bold">SC</text></svg>`,
    flavor: 'It emerges when you least need it. It lifts not. It brakes for ghosts. It is eternal.',
    abilities: [
      { name: 'Bunch Up The Field', desc: '', target: 'allHeroes', dmg: [4, 7], tiltTarget: 10,
        barks: ['DELTA POSITIVE, MORTALS.', 'Everyone behind me. EVERYONE. ALWAYS.'] },
      { name: 'In This Lap... Maybe', desc: '', target: 'none', selfTiltAura: 12,
        barks: ['Safety car in this lap. (It is not in this lap.)', '*stays out one more lap, smiling*'] },
      { name: 'Mercedes Pace', desc: '', target: 'hero', dmg: [8, 12], tiltTarget: 14,
        barks: ['I am driving FLAT OUT, Michael.', 'These tyres are like ice cubes. YOURS.'] },
    ],
  },
};

export const ENCOUNTERS = [
  { name: 'Traffic in the Sector of Sorrow', enemies: ['backmarker', 'backmarker'] },
  { name: 'A Knock at the Motorhome', enemies: ['steward'] },
  { name: 'The Kitty Litter Beckons', enemies: ['gremlin', 'backmarker'] },
  { name: 'Forecast: Doom, Clearing Later', enemies: ['weather'] },
  { name: 'Full Course Despair', enemies: ['steward', 'gremlin'] },
  { name: 'Rain and Paperwork', enemies: ['weather', 'steward'] },
];

export const BOSS_ENCOUNTER = { name: 'THE NEUTRALIZER OF JOY', enemies: ['safetycar', 'backmarker'] };

export const MYSTERY_EVENTS = [
  {
    title: 'The Fan at the Fence',
    text: 'A devoted fan in a 1997 replica cap offers your team a homemade energy drink. It is glowing. It is slightly humming.',
    options: [
      { label: 'Drink it. All of it.', result: (rng) => rng() < 0.5
          ? { text: 'Liquid courage! The whole crew feels ALIVE. Possibly too alive.', healAll: 6, tiltAll: -10 }
          : { text: 'It was mostly brake fluid. The crew sees sounds now.', dmgAll: 3, tiltAll: 12 } },
      { label: 'Politely decline', result: () => ({ text: 'The fan nods slowly and whispers "1997..." The Relic tears up. Everyone bonds, weirdly.', tiltAll: -6 }) },
    ],
  },
  {
    title: 'Abandoned Hospitality Suite',
    text: 'A rival team\'s hospitality unit stands empty. Inside: untouched canapés and a suspiciously warm espresso machine.',
    options: [
      { label: 'Feast like champions', result: (rng) => rng() < 0.65
          ? { text: 'Tiny sandwiches restore the soul. The espresso machine respects you now.', healAll: 7, tiltAll: -8 }
          : { text: 'The prawns had been there since the last sponsor event. In 2022.', dmgAll: 4, tiltAll: 8 } },
      { label: 'Too dignified for this', result: () => ({ text: 'You leave hungry but pure. The Strategist takes the espresso machine anyway. For strategy.', tiltAll: -3 }) },
    ],
  },
  {
    title: 'The Tyre Whisperer',
    text: 'A hooded figure by the road claims they can "read the compounds." They want one (1) lug nut as payment.',
    options: [
      { label: 'Pay the lug nut', result: (rng) => rng() < 0.7
          ? { text: '"The mediums... they speak of victory." The crew feels strangely calm.', tiltAll: -15 }
          : { text: 'The figure takes the lug nut and simply sprints into the fog. That was a load-bearing lug nut.', dmgAll: 3, tiltAll: 6 } },
      { label: 'Keep the lug nut', result: () => ({ text: '"So be it," the figure whispers. Somewhere, a tyre delaminates out of spite.', tiltAll: 5 }) },
    ],
  },
  {
    title: 'A Podcast Opportunity',
    text: 'The Rookie has been invited onto a podcast called "Absolute Scenes." Recording would take all night.',
    options: [
      { label: 'Let him do it', result: () => ({ text: 'He talks for four hours about "the grind." He returns radiating confidence. The crew, less so.', heroTilt: { rookie: -30 }, tiltAll: 8 }) },
      { label: 'Forbid it', result: () => ({ text: 'The Rookie sulks magnificently but gets eight hours of sleep for the first time since age twelve.', heroTilt: { rookie: 10 }, healAll: 4 }) },
    ],
  },
];

export const PIT_OPTIONS = [
  { label: 'Fresh Tyres & Bandages', desc: 'Heal every crew member 8–12 HP.', effect: { healAll: [8, 12] } },
  { label: 'Team Talk (Shouting)', desc: 'Everyone vents. −25 tilt for all.', effect: { tiltAll: -25 } },
  { label: 'Sponsor Photoshoot', desc: 'Soul-crushing but lucrative. +10 tilt, but +20% damage next battle.', effect: { tiltAll: 10, buff: 'drs' } },
];

export const NARRATOR = {
  intro: [
    'Ruin has come to our paddock. Six legs of cursed tarmac stand between this team and the checkered flag.',
    'The season begins as all seasons do: with hope, fresh rubber, and a contractual obligation to suffer.',
  ],
  ambient: [
    'The highway stretches on, indifferent to your downforce.',
    'Overconfidence is a slow and insidious killer. So is Turn One.',
    'Remind yourself that "box box box" is as much a prayer as an instruction.',
    'The fog ahead conceals apexes both real and imagined.',
    'Somewhere, a strategist updates a spreadsheet no one will believe.',
    'The engine hums a dirge in V6 minor.',
  ],
  battleStart: [
    'Wheel to wheel with the unspeakable.',
    'The marshals wave a flag for which no color exists.',
    'An encounter. Deploy courage. And ideally, DRS.',
  ],
  crit: [
    'A masterstroke of controlled violence!',
    'Precision! Aggression! Possibly a penalty!',
    'The apex, seized like a birthright!',
  ],
  heroDown: [
    'DNF. The cruelest acronym.',
    'They will be remembered. Mostly in compound montages.',
    'The garage grows quieter. The invoice, larger.',
  ],
  meltdown: [
    'The radio crackles with raw, unfiltered despair.',
    'Composure, like soft tyres, lasts only so long.',
  ],
  victory: [
    'Victorious. A fleeting respite on the long road to the podium.',
    'They survive. The championship table cares little, but they survive.',
  ],
  bossIntro: [
    'And then, from the gloom: bunched traffic. Yellow lights. IT has come.',
  ],
};

export const MELTDOWN_BARKS = [
  '"I CANNOT DRIVE THIS CAR ANYMORE!!"',
  '"WHY ARE WE ON THESE TYRES?? WHO DECIDED THIS??"',
  '"NO MICHAEL NO! THAT WAS SO NOT RIGHT!"',
  '"LEAVE ME ALONE, I KNOW WHAT I AM DOING!!"',
  '"THE STEERING WHEEL CAME OFF. I AM HOLDING IT. EMOTIONALLY."',
];

export const ROUTE_NODES = {
  battle: [
    { icon: '⚔', title: 'Contested Sector', flavor: 'Telemetry shows hostiles. And poor grip. And dread.' },
    { icon: '⚔', title: 'Yellow Flag Zone', flavor: 'Double waved yellows. Something stirs in the runoff.' },
  ],
  mystery: [
    { icon: '?', title: 'Unscheduled Stop', flavor: 'Something odd by the roadside. Probably fine. Probably.' },
    { icon: '?', title: 'Strange Lights Ahead', flavor: 'Not the podium kind. The other kind.' },
  ],
  pit: [
    { icon: '⛽', title: 'Pit Lane Sanctuary', flavor: 'Warm garages. Working air guns. Brief, beautiful peace.' },
  ],
  boss: [
    { icon: '☠', title: 'THE FINAL STINT', flavor: 'The yellow lights. The bunched field. The end of all deltas.' },
  ],
};
