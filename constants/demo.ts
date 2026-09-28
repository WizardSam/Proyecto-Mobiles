import type { IconName } from '@/components/ui/icons';

/**
 * Cifras y textos del recorrido de Cancún.
 * Son contenido demostrativo del caparazón visual.
 * El motor financiero todavía no existe y no debe inferirse de estos valores.
 */

export const accounts = ['Efectivo', 'Débito', 'Ahorro'] as const;
export type AccountName = (typeof accounts)[number];

export const frequencies = ['Semanal', 'Quincenal', 'Mensual'] as const;
export type IncomeFrequency = (typeof frequencies)[number];

export const fortnightModes = ['Días 15 y último día', 'Cada 14 días'] as const;
export type FortnightMode = (typeof fortnightModes)[number];

export const weekdays = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'] as const;
export type Weekday = (typeof weekdays)[number];

export const contributionFrequencies = ['Semana', 'Quincena', 'Mes'] as const;
export type ContributionFrequency = (typeof contributionFrequencies)[number];

export type MovementKind = 'ingreso' | 'gasto';

export type MovementDraft = {
  kind: MovementKind;
  amount: string;
  category: string;
  date: string;
  account: AccountName;
  note: string;
};

export const expenseCategories = ['Transporte', 'Comida', 'Suscripciones', 'Hogar', 'Otros'];
export const incomeCategories = ['Nómina', 'Otro ingreso'];

export const defaultDraft: MovementDraft = {
  kind: 'gasto',
  amount: '$350',
  category: 'Transporte',
  date: '27 de septiembre',
  account: 'Débito',
  note: 'Gasolina',
};

export const voiceDraft: MovementDraft = {
  kind: 'gasto',
  amount: '$350',
  category: 'Transporte',
  date: '26 de septiembre',
  account: 'Débito',
  note: 'Gasolina',
};

export type SetupChoice = {
  frequency: IncomeFrequency;
  fortnightMode: FortnightMode;
  weekday: Weekday;
  anchorDate: string;
  income: string;
  estimatedExpense: string;
  balances: Record<AccountName, string>;
};

export const defaultSetup: SetupChoice = {
  frequency: 'Quincenal',
  fortnightMode: 'Días 15 y último día',
  weekday: 'Viernes',
  anchorDate: '15 de octubre de 2026',
  income: '$12,000',
  estimatedExpense: '$6,500',
  balances: {
    Efectivo: '',
    Débito: '',
    Ahorro: '',
  },
};

export type DemoMovement = {
  id: string;
  title: string;
  subtitle: string;
  kind: MovementKind;
  amount: string;
  category: string;
  destination: 'corregir' | 'suscripciones';
};

export const demoMovements: DemoMovement[] = [
  {
    id: 'nomina',
    title: 'Nómina',
    subtitle: 'Ingreso',
    kind: 'ingreso',
    amount: '+$12,000',
    category: 'Nómina',
    destination: 'corregir',
  },
  {
    id: 'netflix',
    title: 'Netflix',
    subtitle: 'Suscripción',
    kind: 'gasto',
    amount: '-$219',
    category: 'Suscripciones',
    destination: 'suscripciones',
  },
  {
    id: 'super',
    title: 'Supermercado',
    subtitle: 'Comida',
    kind: 'gasto',
    amount: '-$840',
    category: 'Comida',
    destination: 'corregir',
  },
];

export const homeSnapshots = {
  beforeExpense: {
    disponible: '$8,450',
    ingresos: '$12,000',
    gastos: '$3,550',
    metas: '$2,400',
    status: 'Sigues en ruta',
  },
  afterExpense: {
    disponible: '$8,100',
    ingresos: '$12,000',
    gastos: '$3,900',
    metas: '$2,400',
    status: 'Sigues en ruta',
  },
} as const;

export const cancun = {
  name: 'Viaje a Cancún',
  saved: '$5,000',
  target: '$30,000',
  percentLabel: '17%',
  percent: 17,
  deadline: '30 de mayo de 2027',
  nextDate: '15 de octubre',
  nextAmount: '$1,250',
  status: 'Vas en ruta',
};

export const emergency = {
  name: 'Fondo de emergencia',
  saved: '$8,000',
  target: '$20,000',
  percentLabel: '40%',
  percent: 40,
  status: 'Vas en ruta',
};

export const milestones = [
  { id: 'vuelos', icon: 'navigation' as IconName, title: 'Vuelos', when: '15 de enero', amount: '$12,000' },
  { id: 'hotel', icon: 'home' as IconName, title: 'Hotel', when: '1 de abril', amount: '$10,000' },
  { id: 'actividades', icon: 'camera' as IconName, title: 'Actividades', when: '30 de mayo', amount: '$8,000' },
];

export type AdjustmentId = 'aumentar' | 'mover' | 'reducir';

export const adjustmentOptions: {
  id: AdjustmentId;
  title: string;
  detail: string;
  icon: IconName;
}[] = [
  {
    id: 'aumentar',
    title: 'Aumentar próximas aportaciones',
    detail: '$1,375 por quincena',
    icon: 'trending-up',
  },
  {
    id: 'mover',
    title: 'Mover la fecha',
    detail: 'Nueva fecha: 15 de junio',
    icon: 'calendar',
  },
  {
    id: 'reducir',
    title: 'Reducir el presupuesto',
    detail: 'Nuevo total: $28,750',
    icon: 'pie-chart',
  },
];

export const adjustmentResults: Record<
  AdjustmentId,
  { status: string; nextAmount: string; nextDate: string; target: string; deadline: string }
> = {
  aumentar: {
    status: 'Ruta ajustada',
    nextAmount: '$1,375',
    nextDate: '15 de octubre',
    target: '$30,000',
    deadline: '30 de mayo de 2027',
  },
  mover: {
    status: 'Fecha movida',
    nextAmount: '$1,250',
    nextDate: '15 de octubre',
    target: '$30,000',
    deadline: '15 de junio de 2027',
  },
  reducir: {
    status: 'Presupuesto reducido',
    nextAmount: '$1,250',
    nextDate: '15 de octubre',
    target: '$28,750',
    deadline: '30 de mayo de 2027',
  },
};

export type BudgetTone = 'normal' | 'near' | 'over';

export type BudgetItem = {
  id: string;
  name: string;
  icon: IconName;
  limit: string;
  used: string;
  left: string;
  percent: number;
  tone: BudgetTone;
  message: string;
};

export const budgetsBefore: BudgetItem[] = [
  {
    id: 'comida',
    name: 'Comida',
    icon: 'coffee',
    limit: '$2,000',
    used: '$1,340',
    left: '$660',
    percent: 67,
    tone: 'normal',
    message: 'Vas dentro del límite.',
  },
  {
    id: 'transporte',
    name: 'Transporte',
    icon: 'navigation',
    limit: '$900',
    used: '$750',
    left: '$150',
    percent: 83,
    tone: 'near',
    message: 'Estás cerca del límite de transporte.',
  },
  {
    id: 'suscripciones',
    name: 'Suscripciones',
    icon: 'repeat',
    limit: '$700',
    used: '$668',
    left: '$32',
    percent: 95,
    tone: 'near',
    message: 'Queda poco margen en suscripciones.',
  },
  {
    id: 'otros',
    name: 'Otros',
    icon: 'more-horizontal',
    limit: '$1,000',
    used: '$792',
    left: '$208',
    percent: 79,
    tone: 'normal',
    message: 'Esta categoría sigue con margen.',
  },
];

export const budgetsAfter: BudgetItem[] = budgetsBefore.map((item) =>
  item.id === 'transporte'
    ? {
        ...item,
        used: '$1,100',
        left: '$0',
        percent: 100,
        tone: 'over',
        message: 'El límite de transporte ya se cubrió. Puedes ajustarlo cuando quieras.',
      }
    : item,
);

export const summaryCategories = {
  before: [
    { id: 'comida', name: 'Comida', icon: 'coffee' as IconName, share: '38% del gasto', amount: '$1,340' },
    { id: 'transporte', name: 'Transporte', icon: 'navigation' as IconName, share: '21% del gasto', amount: '$750' },
    { id: 'suscripciones', name: 'Suscripciones', icon: 'repeat' as IconName, share: '19% del gasto', amount: '$668' },
    { id: 'otros', name: 'Otros', icon: 'more-horizontal' as IconName, share: '22% del gasto', amount: '$792' },
  ],
  after: [
    { id: 'comida', name: 'Comida', icon: 'coffee' as IconName, share: '38% del gasto', amount: '$1,340' },
    { id: 'transporte', name: 'Transporte', icon: 'navigation' as IconName, share: '21% del gasto', amount: '$1,100' },
    { id: 'suscripciones', name: 'Suscripciones', icon: 'repeat' as IconName, share: '19% del gasto', amount: '$668' },
    { id: 'otros', name: 'Otros', icon: 'more-horizontal' as IconName, share: '22% del gasto', amount: '$792' },
  ],
} as const;

export type SubscriptionItem = {
  id: string;
  name: string;
  amount: string;
  when: string;
  icon: IconName;
};

export const initialSubscriptions: SubscriptionItem[] = [
  { id: 'netflix', name: 'Netflix', amount: '$219', when: '14 oct', icon: 'tv' },
  { id: 'spotify', name: 'Spotify', amount: '$129', when: '18 oct', icon: 'music' },
  { id: 'internet', name: 'Internet', amount: '$549', when: '22 oct', icon: 'wifi' },
  { id: 'gym', name: 'Gimnasio', amount: '$320', when: '28 oct', icon: 'activity' },
];

export const calendarMarks = [14, 22, 30];

export type CalendarItem = {
  day: number;
  title: string;
  amount: string;
  icon: IconName;
  href: '/suscripciones' | '/detalle-meta' | null;
};

export function calendarItems(nextAmount: string): CalendarItem[] {
  return [
    { day: 14, title: 'Netflix', amount: '$219', icon: 'tv', href: '/suscripciones' },
    { day: 15, title: 'Ahorro Cancún', amount: nextAmount, icon: 'target', href: '/detalle-meta' },
    { day: 22, title: 'Internet', amount: '$549', icon: 'wifi', href: '/suscripciones' },
    { day: 30, title: 'Renta', amount: '$6,500', icon: 'home', href: null },
  ];
}

export function maskMoney(value: string, hidden: boolean) {
  if (!hidden) {
    return value;
  }
  return value.replace(/\$\s?\d[\d,]*(?:\.\d+)?/g, '$••••');
}
