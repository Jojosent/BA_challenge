export type Relation =
  | 'self' | 'father' | 'mother' | 'brother' | 'sister'
  | 'grandfather' | 'grandmother' | 'son' | 'daughter'
  | 'husband' | 'wife' | 'uncle' | 'aunt' | 'cousin' | 'other';

export interface FamilyMember {
  id: number;
  userId: number;
  name: string;
  relation: Relation;
  birthYear?: number;
  bio?: string;
  avatarUrl?: string;
  parentId?: number;
  appUserId?: number;
  createdAt: string;
}

export interface FamilyEvent {
  id: number;
  userId: number;
  title: string;
  description?: string;
  year: number;
  month?: number;
  day?: number;
  emoji?: string;
  createdAt: string;
}

export const RELATION_LABELS: Record<Relation, string> = {
  self:        '👤 Я',
  father:      '👨 Отец',
  mother:      '👩 Мать',
  brother:     '👦 Брат',
  sister:      '👧 Сестра',
  grandfather: '👴 Дедушка',
  grandmother: '👵 Бабушка',
  son:         '👶 Сын',
  daughter:    '👶 Дочь',
  husband:     '💑 Муж',
  wife:        '💑 Жена',
  uncle:       '👨 Дядя',
  aunt:        '👩 Тётя',
  cousin:      '🧑 Двоюродный',
  other:       '🧑 Другое',
};

export const RELATION_COLORS: Record<Relation, string> = {
  self:        '#6C63FF',
  father:      '#378ADD',
  mother:      '#D4537E',
  brother:     '#1D9E75',
  sister:      '#ED93B1',
  grandfather: '#BA7517',
  grandmother: '#EF9F27',
  son:         '#5DCAA5',
  daughter:    '#F0997B',
  husband:     '#534AB7',
  wife:        '#993556',
  uncle:       '#639922',
  aunt:        '#97C459',
  cousin:      '#888780',
  other:       '#5F5E5A',
};