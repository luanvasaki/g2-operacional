export const INITIAL_POSTS = [
  { id: 'diadema', name: 'Diadema', address: 'Posto Diadema - SP', active: true },
  { id: 'confianca', name: 'Confiança', address: 'Posto Confiança - SP', active: true },
  { id: 'penha', name: 'Penha', address: 'Posto Penha - SP', active: true },
  { id: 'santo-andre', name: 'Santo André', address: 'Posto Santo André - SP', active: true },
  { id: 'zona-norte', name: 'Zona Norte', address: 'Posto Zona Norte - SP', active: true },
]

export const INITIAL_GUARDS = [
  {
    id: 'g-carvalho',
    name: 'Carvalho',
    fullName: 'Carvalho',
    postId: null,
    phone: '(11) 98765-4321',
    pixKey: '11987654321',
    pixType: 'Celular',
    defaultShiftHours: 3,
    hourlyRate: 40,
    active: true,
  },
  {
    id: 'g-novaes',
    name: 'Novaes',
    fullName: 'Novaes',
    postId: null,
    phone: '(11) 98765-4322',
    pixKey: 'novaes.pix@gmail.com',
    pixType: 'E-mail',
    defaultShiftHours: 3,
    hourlyRate: 40,
    active: true,
  },
  {
    id: 'g-marinho',
    name: 'Marinho',
    fullName: 'Marinho',
    postId: null,
    phone: '(11) 98765-4323',
    pixKey: '234.567.890-12',
    pixType: 'CPF',
    defaultShiftHours: 3,
    hourlyRate: 40,
    active: true,
  },
  {
    id: 'g-gomes',
    name: 'Gomes',
    fullName: 'Gomes',
    postId: null,
    phone: '(11) 98765-4324',
    pixKey: 'gomes.pix@gmail.com',
    pixType: 'E-mail',
    defaultShiftHours: 3,
    hourlyRate: 40,
    active: true,
  },
  {
    id: 'g-barbosa',
    name: 'Barbosa',
    fullName: 'Barbosa',
    postId: null,
    phone: '(11) 98765-4325',
    pixKey: '345.678.901-23',
    pixType: 'CPF',
    defaultShiftHours: 3,
    hourlyRate: 40,
    active: true,
  },
  {
    id: 'g-miranda',
    name: 'Miranda',
    fullName: 'Miranda',
    postId: null,
    phone: '(11) 98765-4326',
    pixKey: '11977665544',
    pixType: 'Celular',
    defaultShiftHours: 3,
    hourlyRate: 40,
    active: true,
  },
  {
    id: 'g-neto',
    name: 'Neto',
    fullName: 'Neto',
    postId: null,
    phone: '(11) 98765-4327',
    pixKey: 'neto.pix@outlook.com',
    pixType: 'E-mail',
    defaultShiftHours: 3,
    hourlyRate: 40,
    active: true,
  },
  {
    id: 'g-felipe',
    name: 'Felipe',
    fullName: 'Felipe',
    postId: null,
    phone: '(11) 98765-4328',
    pixKey: '456.789.012-34',
    pixType: 'CPF',
    defaultShiftHours: 3,
    hourlyRate: 40,
    active: true,
  },
  {
    id: 'g-oliveira',
    name: 'Oliveira',
    fullName: 'Oliveira',
    postId: null,
    phone: '(11) 98765-4329',
    pixKey: 'oliveira.pix@gmail.com',
    pixType: 'E-mail',
    defaultShiftHours: 3,
    hourlyRate: 40,
    active: true,
  },
  {
    id: 'g-pereira',
    name: 'Pereira',
    fullName: 'Pereira',
    postId: null,
    phone: '(11) 98765-4330',
    pixKey: '11966554433',
    pixType: 'Celular',
    defaultShiftHours: 3,
    hourlyRate: 40,
    active: true,
  },
  {
    id: 'g-david',
    name: 'David',
    fullName: 'David',
    postId: null,
    phone: '(11) 98765-4331',
    pixKey: 'david.pix@gmail.com',
    pixType: 'E-mail',
    defaultShiftHours: 3,
    hourlyRate: 40,
    active: true,
  },
  {
    id: 'g-alex',
    name: 'Alex',
    fullName: 'Alex',
    postId: null,
    phone: '(11) 98765-4332',
    pixKey: '567.890.123-45',
    pixType: 'CPF',
    defaultShiftHours: 3,
    hourlyRate: 40,
    active: true,
  },
  // Folguista
  {
    id: 'g-folguista',
    name: 'Folguista',
    fullName: 'Folguista',
    postId: null,
    phone: '',
    pixKey: 'A Definir',
    pixType: 'Chave Aleatória',
    defaultShiftHours: 3,
    hourlyRate: 40,
    active: true,
  },
]

// Current Month/Year key e.g. "2026-10"
export const CURRENT_MONTH_KEY = '2026-10'

// Pre-fill shifts exactly as in user's image
export const INITIAL_SHIFTS = {
  '2026-09': {
    // Carvalho
    'g-carvalho': {
      2: 4, 4: 4, 6: 4, 8: 4, 10: 4, 12: 4,
      16: 4, 18: 0, 20: 0, 22: 0, 24: 4, 25: 4, 26: 7, 28: 4, 30: 4
    },
    // Novaes
    'g-novaes': {
      1: 4, 3: 4, 13: 4, 14: 4, 15: 4,
      18: 4, 21: 4, 23: 4, 27: 4, 29: 4, 31: 4
    },
    // Marinho
    'g-marinho': {
      5: 4, 7: 4, 9: 4, 11: 4,
      19: 4
    },

    // Gomes
    'g-gomes': {
      1: 3, 3: 3, 5: 3, 7: 3, 9: 3, 11: 3, 13: 3, 15: 3,
      17: 3, 19: 3, 21: 3, 23: 3, 24: 3, 25: 3, 27: 3, 29: 3, 31: 3
    },
    // Barbosa
    'g-barbosa': {
      4: 3, 6: 3, 8: 3, 10: 3, 14: 3,
      16: 3, 20: 3, 22: 3, 28: 3
    },
    // Miranda
    'g-miranda': {
      2: 3, 12: 3,
      18: 3, 26: 3, 30: 3
    },

    // Neto
    'g-neto': {
      2: 3, 4: 3, 6: 3, 8: 0, 10: 3, 12: 3, 14: 3,
      16: 3, 18: 3, 20: 3, 22: 3, 24: 3, 26: 3, 28: 3, 30: 3
    },
    // Felipe
    'g-felipe': {
      1: 3, 3: 3, 5: 0, 7: 3, 9: 0, 11: 3, 13: 3,
      17: 3, 19: 3, 21: 3, 23: 3, 25: 3, 27: 3, 29: 0, 31: 0
    },

    // Oliveira
    'g-oliveira': {
      2: 3, 4: 3, 6: 3, 8: 3, 10: 3, 12: 0, 14: 3,
      16: 3, 20: 0, 22: 3, 24: 3, 26: 0, 28: 3, 30: 0
    },
    // Pereira
    'g-pereira': {
      1: 3, 3: 3, 5: 3, 7: 3, 9: 3, 11: 3, 13: 3, 15: 3,
      17: 3, 18: 3, 19: 3, 21: 3, 23: 3, 25: 3, 27: 3, 29: 0, 31: 0
    },

    // David
    'g-david': {
      2: 3, 4: 3, 6: 3, 8: 3, 10: 3, 12: 3, 14: 3,
      16: 3, 18: 3, 20: 3, 22: 3, 24: 3, 28: 3, 29: 3, 30: 3, 31: 3
    },
    // Alex
    'g-alex': {
      1: 3, 3: 3, 5: 3, 7: 3, 9: 3, 11: 3, 13: 3, 15: 3,
      17: 3, 19: 3, 20: 3, 21: 3, 23: 3, 25: 3, 26: 3, 27: 3, 28: 3, 29: 3, 30: 3
    }
  },
  '2026-10': {
    // Carvalho (dias pares)
    'g-carvalho': {
      2: 4, 4: 4, 6: 4, 8: 4, 10: 4, 12: 4, 14: 4, 16: 4, 18: 4, 20: 4, 22: 4, 24: 4, 26: 4, 28: 4, 30: 4
    },
    // Novaes (dias ímpares)
    'g-novaes': {
      1: 4, 3: 4, 5: 4, 7: 4, 9: 4, 11: 4, 13: 4, 15: 4, 17: 4, 19: 4, 21: 4, 23: 4, 25: 4, 27: 4, 29: 4, 31: 4
    },
    // Gomes (dias ímpares)
    'g-gomes': {
      1: 3, 3: 3, 5: 3, 7: 3, 9: 3, 11: 3, 13: 3, 15: 3, 17: 3, 19: 3, 21: 3, 23: 3, 25: 3, 27: 3, 29: 3, 31: 3
    },
    // Barbosa (dias pares)
    'g-barbosa': {
      2: 3, 4: 3, 6: 3, 8: 3, 10: 3, 12: 3, 14: 3, 16: 3, 18: 3, 20: 3, 22: 3, 24: 3, 26: 3, 28: 3, 30: 3
    },
    // Neto (dias pares)
    'g-neto': {
      2: 3, 4: 3, 6: 3, 8: 3, 10: 3, 12: 3, 14: 3, 16: 3, 18: 3, 20: 3, 22: 3, 24: 3, 26: 3, 28: 3, 30: 3
    },
    // Felipe (dias ímpares)
    'g-felipe': {
      1: 3, 3: 3, 5: 3, 7: 3, 9: 3, 11: 3, 13: 3, 15: 3, 17: 3, 19: 3, 21: 3, 23: 3, 25: 3, 27: 3, 29: 3, 31: 3
    },
    // Oliveira (dias pares)
    'g-oliveira': {
      2: 3, 4: 3, 6: 3, 8: 3, 10: 3, 12: 3, 14: 3, 16: 3, 18: 3, 20: 3, 22: 3, 24: 3, 26: 3, 28: 3, 30: 3
    },
    // Pereira (dias ímpares)
    'g-pereira': {
      1: 3, 3: 3, 5: 3, 7: 3, 9: 3, 11: 3, 13: 3, 15: 3, 17: 3, 19: 3, 21: 3, 23: 3, 25: 3, 27: 3, 29: 3, 31: 3
    },
    // David (dias pares)
    'g-david': {
      2: 3, 4: 3, 6: 3, 8: 3, 10: 3, 12: 3, 14: 3, 16: 3, 18: 3, 20: 3, 22: 3, 24: 3, 26: 3, 28: 3, 30: 3
    },
    // Alex (dias ímpares)
    'g-alex': {
      1: 3, 3: 3, 5: 3, 7: 3, 9: 3, 11: 3, 13: 3, 15: 3, 17: 3, 19: 3, 21: 3, 23: 3, 25: 3, 27: 3, 29: 3, 31: 3
    }
  }
}

export const INITIAL_PAYMENTS = {
  // Key: `${monthKey}_${guardId}_q1` or `q2`
  ['2026-09_g-carvalho_q1']: { status: 'PAID', paidAt: '2026-09-16T10:00:00Z', notes: 'PIX Realizado' },
}
