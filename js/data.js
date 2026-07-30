const ROLES = [
  { id: 'tank', label: 'Tank', icon: '\u{1F6E1}\uFE0F', color: '#4a9eff' },
  { id: 'healer', label: 'Healer', icon: '\u{1F49A}', color: '#22c55e' },
  { id: 'melee', label: 'Melee DPS', icon: '\u2694\uFE0F', color: '#ef4444' },
  { id: 'range', label: 'Range DPS', icon: '\u{1F3F9}', color: '#eab308' }
]

const CLASS_LIST = [
  { name: 'Barbarian',      color: '#B77C70', specs: ['Headhunting', 'Brutality', 'Ancestry'] },
  { name: 'Bloodmage',       color: '#CF686E', specs: ['Blood', 'Cinder', 'Singe'] },
  { name: 'Chronomancer',    color: '#D8D47A', specs: ['Time', 'Infinite', 'Artificer'] },
  { name: 'Cultist',         color: '#B976E6', specs: ['Heretic', 'Corruption', 'Godblade', 'Dreadnought'] },
  { name: 'Felsworn',        color: '#8ED36D', specs: ['Infernal', 'Slayer', 'Tyrant'] },
  { name: 'Guardian',        color: '#B9C2B9', specs: ['Gladiator', 'Inspiration', 'Vanguard'] },
  { name: 'Knight of Xoroth',color: '#E07372', specs: ['War', 'Hellfire', 'Defiance'] },
  { name: 'Necromancer',     color: '#8BC9B7', specs: ['Death', 'Animation', 'Rhyme'] },
  { name: 'Primalist',       color: '#CCAB91', specs: ['Geomancy', 'Grove Keeper', 'Wild Walker', 'Mountain King'] },
  { name: 'Pyromancer',      color: '#DF765F', specs: ['Flame Weaving', 'Incineration', 'Draconic'] },
  { name: 'Ranger',          color: '#B7CF83', specs: ['Archery', 'Brigand', 'Farstrider'] },
  { name: 'Reaper',          color: '#73B9B8', specs: ['Harvest', 'Souls', 'Domination'] },
  { name: 'Runemaster',      color: '#7FB9E4', specs: ['Rift Blade', 'Glyphic', 'Engravement'] },
  { name: 'Starcaller',      color: '#87BBD1', specs: ['Moon Priest', 'Sentinel', 'Warden', 'Moon Guard'] },
  { name: 'Stormbringer',    color: '#68C7EF', specs: ['Wind', 'Maelstrom', 'Lightning'] },
  { name: 'Sun Cleric',      color: '#E2C67D', specs: ['Piety', 'Valkyrie', 'Blessings', 'Seraphim'] },
  { name: 'Templar',         color: '#DD8C96', specs: ['Oathkeeper', 'Zealot', 'Crusader'] },
  { name: 'Tinker',          color: '#C5A5A7', specs: ['Mechanics', 'Inventor', 'Demolition'] },
  { name: 'Venomancer',      color: '#98C477', specs: ['Fortitude', 'Stalking', 'Rotweaving', 'Vizier'] },
  { name: 'Witch Doctor',    color: '#DD75D3', specs: ['Voodoo', 'Brewing', 'Shadow Hunting'] },
  { name: 'Witch Hunter',    color: '#A791E5', specs: ['Boltser', 'Inquisitor', 'Black Knight', 'Darkness'] }
]

const CLASS_COLOR_MAP = {}
CLASS_LIST.forEach(c => { CLASS_COLOR_MAP[c.name] = c.color })

function getClassSpecs(className) {
  const cls = CLASS_LIST.find(c => c.name === className)
  return cls ? cls.specs : []
}
