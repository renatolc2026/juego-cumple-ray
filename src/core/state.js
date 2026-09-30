// Estado del juego y guardado automático en localStorage (por escena).
const SAVE_KEY = 'ray-melodia-perdida-v1';
const SETTINGS_KEY = 'ray-melodia-perdida-ajustes';

function fresh() {
  return {
    zone: 'home',
    spawn: null,
    flags: {},
    items: { tallarines: 0, bendicion: 0, bufanda: 0, mapa: 0, llavero: 0, postit: 0 },
    notes: [],
    clues: [],
    startedAt: Date.now(),
  };
}

function safeGet(key) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSet(key, val) {
  try {
    localStorage.setItem(key, val);
  } catch {
    /* sin almacenamiento disponible: el juego sigue igual */
  }
}

export const ITEMS = {
  tallarines: { name: 'Tallarines de mamá', icon: 'tallarines', desc: 'Un táper con los tallarines rojos de mamá. Recupera mucho ánimo en la batalla final.' },
  bendicion: { name: 'Bendición del Abuelo', icon: 'bendicion', desc: 'Una luz cálida que te acompaña. Recupera todo el ánimo en la batalla final.' },
  mapa: { name: 'Mapa de Sullana', icon: 'mapa', desc: 'El mapa que te dejó papá antes de irse a trabajar. Muestra el camino hacia la Torre del Silencio.' },
  bufanda: { name: 'Bufanda del Barça', icon: 'bufanda', desc: 'Se le cayó al Maestro del Silencio en el parque. ¿Quién será hincha del Barça...?' },
  llavero: { name: 'Llavero de Lima', icon: 'llavero', desc: 'Se le cayó al enmascarado en el Salón del Sabor. Dice "Recuerdo de Lima".' },
  postit: { name: 'Nota adhesiva', icon: 'postit', desc: 'Dice: "No olvidar: torta para Ray. Y tallarines." ¿Qué letra es esa...?' },
};

export const NOTES = {
  hogar: { name: 'Nota del Hogar', icon: 'nota_hogar', color: '#f4a93b' },
  fe: { name: 'Nota de la Fe', icon: 'nota_fe', color: '#e8e0ff' },
  sabor: { name: 'Nota del Sabor', icon: 'nota_sabor', color: '#e8505b' },
  amistad: { name: 'Nota de la Amistad', icon: 'nota_amistad', color: '#3fb57a' },
};
export const NOTE_ORDER = ['hogar', 'fe', 'sabor', 'amistad'];

export const state = {
  data: fresh(),
  settings: { music: 0.8, sfx: 0.9 },

  reset() {
    this.data = fresh();
  },

  hasSave() {
    return !!safeGet(SAVE_KEY);
  },

  // Guarda una "foto" del estado al entrar a una escena
  save(zone, spawn = null) {
    this.data.zone = zone;
    this.data.spawn = spawn;
    safeSet(SAVE_KEY, JSON.stringify(this.data));
  },

  load() {
    const raw = safeGet(SAVE_KEY);
    if (!raw) return false;
    try {
      this.data = { ...fresh(), ...JSON.parse(raw) };
      return true;
    } catch {
      return false;
    }
  },

  clearSave() {
    try {
      localStorage.removeItem(SAVE_KEY);
    } catch {
      /* nada */
    }
  },

  loadSettings() {
    const raw = safeGet(SETTINGS_KEY);
    if (raw) {
      try {
        this.settings = { ...this.settings, ...JSON.parse(raw) };
      } catch {
        /* nada */
      }
    }
  },

  saveSettings() {
    safeSet(SETTINGS_KEY, JSON.stringify(this.settings));
  },

  flag(k) {
    return !!this.data.flags[k];
  },

  setFlag(k, v = true) {
    this.data.flags[k] = v;
  },

  item(k) {
    return this.data.items[k] || 0;
  },

  addItem(k, n = 1) {
    this.data.items[k] = (this.data.items[k] || 0) + n;
  },

  useItem(k) {
    if (this.item(k) <= 0) return false;
    this.data.items[k]--;
    return true;
  },

  hasNote(id) {
    return this.data.notes.includes(id);
  },

  addNote(id) {
    if (!this.hasNote(id)) this.data.notes.push(id);
  },

  noteCount() {
    return this.data.notes.length;
  },
};

state.loadSettings();
