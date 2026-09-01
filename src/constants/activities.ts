import { ShiftActivity, ShiftPreset, SlotGroup } from '../types';

export const SLOT_GROUPS: SlotGroup[] = [
  {
    id: 'first-slot',
    name: 'First slot',
    color: '#3b82f6', // blue-500
    badgeBg: 'bg-blue-950/70 border-blue-800/80 text-blue-300',
    slots: [
      '09:00 - 09:15',
      '09:15 - 09:30',
      '09:30 - 10:00',
      '10:00 - 10:30',
      '10:30 - 11:00',
      '11:00 - 11:30',
      '11:30 - 11:45',
      '11:45 - 12:00'
    ]
  },
  {
    id: 'prayer-break',
    name: 'Prayer break',
    color: '#10b981', // emerald-500
    badgeBg: 'bg-emerald-950/70 border-emerald-800/80 text-emerald-300',
    slots: [
      '12:00 - 12:30',
      '12:30 - 12:45',
      '12:45 - 01:00'
    ]
  },
  {
    id: 'second-slot',
    name: 'Second slot',
    color: '#8b5cf6', // purple-500
    badgeBg: 'bg-purple-950/70 border-purple-800/80 text-purple-300',
    slots: [
      '01:00 - 01:30',
      '01:30 - 02:00',
      '02:00 - 02:30',
      '02:30 - 03:00',
      '03:00 - 03:15',
      '03:15 - 03:30'
    ]
  },
  {
    id: 'third-slot',
    name: 'Third slot',
    color: '#f59e0b', // amber-500
    badgeBg: 'bg-amber-950/70 border-amber-800/80 text-amber-300',
    slots: [
      '03:30 - 04:00',
      '04:00 - 04:30',
      '04:30 - 05:00',
      '05:00 - 05:30',
      '05:30 - 06:00',
      '06:00 - 06:30'
    ]
  }
];

export const TIME_SLOTS: string[] = SLOT_GROUPS.flatMap(g => g.slots);

// Normalize slot keys for lookup matching
export const normalizeSlotKey = (slot: string): string => {
  return slot
    .replace(/\s+/g, '')
    .toLowerCase()
    .replace(/^9:/, '09:')
    .replace(/-9:/, '-09:')
    .replace(/^1:/, '01:')
    .replace(/-1:/, '-01:')
    .replace(/^2:/, '02:')
    .replace(/-2:/, '-02:')
    .replace(/^3:/, '03:')
    .replace(/-3:/, '-03:')
    .replace(/^4:/, '04:')
    .replace(/-4:/, '-04:')
    .replace(/^5:/, '05:')
    .replace(/-5:/, '-05:')
    .replace(/^6:/, '06:')
    .replace(/-6:/, '-06:');
};

export const ACTIVITIES: ShiftActivity[] = [
  // Floating & Corridors
  {
    id: 'CORRIDOR',
    name: 'Corridor',
    shortCode: 'Corridor',
    category: 'Hallways',
    color: '#3b82f6', // blue
    bgColor: 'bg-blue-500/15',
    textColor: 'text-blue-300',
    borderColor: 'border-blue-500/40',
    isWorking: true,
    isBreak: false,
    iconName: 'Footprints'
  },
  {
    id: 'CORRIDOR_2',
    name: 'Corridor 2',
    shortCode: 'Corridor 2',
    category: 'Hallways',
    color: '#0284c7', // sky
    bgColor: 'bg-sky-500/15',
    textColor: 'text-sky-300',
    borderColor: 'border-sky-500/40',
    isWorking: true,
    isBreak: false,
    iconName: 'Footprints'
  },
  {
    id: 'FLOATING_234',
    name: 'Floating (2,3,4)',
    shortCode: 'Float (2,3,4)',
    category: 'Floating',
    color: '#8b5cf6', // purple
    bgColor: 'bg-purple-500/15',
    textColor: 'text-purple-300',
    borderColor: 'border-purple-500/40',
    isWorking: true,
    isBreak: false,
    iconName: 'Shuffle'
  },
  {
    id: 'FLOATING_56',
    name: 'Floating (5,6)',
    shortCode: 'Float (5,6)',
    category: 'Floating',
    color: '#a855f7', // fuchsia/purple
    bgColor: 'bg-purple-500/20',
    textColor: 'text-purple-200',
    borderColor: 'border-purple-400/40',
    isWorking: true,
    isBreak: false,
    iconName: 'Shuffle'
  },

  // Doors, Reception & Waiting
  {
    id: 'EXIT_DOOR',
    name: 'Exit Door',
    shortCode: 'Exit Door',
    category: 'Doors & Gates',
    color: '#ef4444', // red
    bgColor: 'bg-red-500/15',
    textColor: 'text-red-300',
    borderColor: 'border-red-500/40',
    isWorking: true,
    isBreak: false,
    iconName: 'DoorOpen'
  },
  {
    id: 'USHERING',
    name: 'Ushering',
    shortCode: 'Ushering',
    category: 'Doors & Gates',
    color: '#f97316', // orange
    bgColor: 'bg-orange-500/15',
    textColor: 'text-orange-300',
    borderColor: 'border-orange-500/40',
    isWorking: true,
    isBreak: false,
    iconName: 'Users'
  },
  {
    id: 'INSIDE_USHER',
    name: 'Inside Usher',
    shortCode: 'Inside Usher',
    category: 'Doors & Gates',
    color: '#fb923c', // orange-400
    bgColor: 'bg-orange-500/20',
    textColor: 'text-orange-200',
    borderColor: 'border-orange-400/40',
    isWorking: true,
    isBreak: false,
    iconName: 'UserCheck'
  },
  {
    id: 'WAITING_AREA',
    name: 'Waiting area',
    shortCode: 'Waiting area',
    category: 'Doors & Gates',
    color: '#14b8a6', // teal
    bgColor: 'bg-teal-500/15',
    textColor: 'text-teal-300',
    borderColor: 'border-teal-500/40',
    isWorking: true,
    isBreak: false,
    iconName: 'Clock'
  },

  // Help Desk & CS Support
  {
    id: 'HELPDESK_CARD',
    name: 'Help desk/ Card creation',
    shortCode: 'Help Desk/Card',
    category: 'Support & Admin',
    color: '#06b6d4', // cyan
    bgColor: 'bg-cyan-500/15',
    textColor: 'text-cyan-300',
    borderColor: 'border-cyan-500/40',
    isWorking: true,
    isBreak: false,
    iconName: 'CreditCard'
  },
  {
    id: 'HELPDESK_CS',
    name: 'Help desk/CS support',
    shortCode: 'Help Desk/CS',
    category: 'Support & Admin',
    color: '#0891b2', // cyan-600
    bgColor: 'bg-cyan-600/15',
    textColor: 'text-cyan-200',
    borderColor: 'border-cyan-400/40',
    isWorking: true,
    isBreak: false,
    iconName: 'Headphones'
  },
  {
    id: 'ATTENDANCE_CALLS',
    name: 'Attendance/Absent Calls',
    shortCode: 'Absent Calls',
    category: 'Support & Admin',
    color: '#eab308', // yellow
    bgColor: 'bg-yellow-500/15',
    textColor: 'text-yellow-300',
    borderColor: 'border-yellow-500/40',
    isWorking: true,
    isBreak: false,
    iconName: 'PhoneCall'
  },
  {
    id: 'CARD_CHECKING_CALLS',
    name: 'Card Checking and Calls',
    shortCode: 'Card Check/Calls',
    category: 'Support & Admin',
    color: '#f59e0b', // amber
    bgColor: 'bg-amber-500/15',
    textColor: 'text-amber-300',
    borderColor: 'border-amber-500/40',
    isWorking: true,
    isBreak: false,
    iconName: 'FileCheck'
  },
  {
    id: 'HOME_ALONE_CARDS',
    name: 'Checking Home alone cards',
    shortCode: 'Home Alone Cards',
    category: 'Support & Admin',
    color: '#d97706', // amber-600
    bgColor: 'bg-amber-600/15',
    textColor: 'text-amber-200',
    borderColor: 'border-amber-500/40',
    isWorking: true,
    isBreak: false,
    iconName: 'ShieldAlert'
  },
  {
    id: 'SIGNS',
    name: 'Signs',
    shortCode: 'Signs',
    category: 'Support & Admin',
    color: '#64748b', // slate
    bgColor: 'bg-slate-500/20',
    textColor: 'text-slate-200',
    borderColor: 'border-slate-400/40',
    isWorking: true,
    isBreak: false,
    iconName: 'MapPin'
  },
  {
    id: 'SIGNS_EXCHANGE',
    name: 'Signs Exchange',
    shortCode: 'Signs Exch',
    category: 'Support & Admin',
    color: '#475569', // slate-600
    bgColor: 'bg-slate-600/20',
    textColor: 'text-slate-300',
    borderColor: 'border-slate-500/40',
    isWorking: true,
    isBreak: false,
    iconName: 'RefreshCw'
  },

  // Line ups
  {
    id: 'LINE_UP_R1',
    name: 'Line up R1',
    shortCode: 'Line up R1',
    category: 'Line Up',
    color: '#10b981', // emerald
    bgColor: 'bg-emerald-500/15',
    textColor: 'text-emerald-300',
    borderColor: 'border-emerald-500/40',
    isWorking: true,
    isBreak: false,
    iconName: 'Users'
  },
  {
    id: 'LINE_UP_R2',
    name: 'Line up R2',
    shortCode: 'Line up R2',
    category: 'Line Up',
    color: '#10b981',
    bgColor: 'bg-emerald-500/15',
    textColor: 'text-emerald-300',
    borderColor: 'border-emerald-500/40',
    isWorking: true,
    isBreak: false,
    iconName: 'Users'
  },
  {
    id: 'LINE_UP_R3',
    name: 'Line up R3',
    shortCode: 'Line up R3',
    category: 'Line Up',
    color: '#10b981',
    bgColor: 'bg-emerald-500/15',
    textColor: 'text-emerald-300',
    borderColor: 'border-emerald-500/40',
    isWorking: true,
    isBreak: false,
    iconName: 'Users'
  },
  {
    id: 'LINE_UP_R4',
    name: 'Line up R4',
    shortCode: 'Line up R4',
    category: 'Line Up',
    color: '#10b981',
    bgColor: 'bg-emerald-500/15',
    textColor: 'text-emerald-300',
    borderColor: 'border-emerald-500/40',
    isWorking: true,
    isBreak: false,
    iconName: 'Users'
  },
  {
    id: 'LINE_UP_R5',
    name: 'Line up R5',
    shortCode: 'Line up R5',
    category: 'Line Up',
    color: '#10b981',
    bgColor: 'bg-emerald-500/15',
    textColor: 'text-emerald-300',
    borderColor: 'border-emerald-500/40',
    isWorking: true,
    isBreak: false,
    iconName: 'Users'
  },
  {
    id: 'LINE_UP_R6',
    name: 'Line up R6',
    shortCode: 'Line up R6',
    category: 'Line Up',
    color: '#10b981',
    bgColor: 'bg-emerald-500/15',
    textColor: 'text-emerald-300',
    borderColor: 'border-emerald-500/40',
    isWorking: true,
    isBreak: false,
    iconName: 'Users'
  },

  // Classroom & Starters
  {
    id: 'PS_A_KHOLOUD',
    name: 'Primary Starter A Fri 09:30-11:30 Room 001 Kholoud Gamal-T3',
    shortCode: 'PS A (Kholoud)',
    category: 'Classroom',
    color: '#ec4899', // pink
    bgColor: 'bg-pink-500/15',
    textColor: 'text-pink-300',
    borderColor: 'border-pink-500/40',
    isWorking: true,
    isBreak: false,
    iconName: 'BookOpen'
  },
  {
    id: 'PS_A_KEVIN',
    name: 'Primary Starter A (LP) Room 1(Kevin Sterling)',
    shortCode: 'PS A (Kevin)',
    category: 'Classroom',
    color: '#ec4899',
    bgColor: 'bg-pink-500/15',
    textColor: 'text-pink-300',
    borderColor: 'border-pink-500/40',
    isWorking: true,
    isBreak: false,
    iconName: 'BookOpen'
  },
  {
    id: 'PS_A_NIHAD',
    name: 'Primary Starter A (LP) Room 1 (Nihad Badr)',
    shortCode: 'PS A (Nihad)',
    category: 'Classroom',
    color: '#ec4899',
    bgColor: 'bg-pink-500/15',
    textColor: 'text-pink-300',
    borderColor: 'border-pink-500/40',
    isWorking: true,
    isBreak: false,
    iconName: 'BookOpen'
  },
  {
    id: 'PS_B_RANDA',
    name: 'Primary Starter B (LP) Room 2 (Randa Mukhtar)',
    shortCode: 'PS B (Randa)',
    category: 'Classroom',
    color: '#db2777', // pink-600
    bgColor: 'bg-pink-600/15',
    textColor: 'text-pink-200',
    borderColor: 'border-pink-400/40',
    isWorking: true,
    isBreak: false,
    iconName: 'BookOpen'
  },
  {
    id: 'PS_B_NIHAD',
    name: 'Primary Starter B (LP) Room 2 (Nihad Badr)',
    shortCode: 'PS B (Nihad)',
    category: 'Classroom',
    color: '#db2777',
    bgColor: 'bg-pink-600/15',
    textColor: 'text-pink-200',
    borderColor: 'border-pink-400/40',
    isWorking: true,
    isBreak: false,
    iconName: 'BookOpen'
  },
  {
    id: 'PS_B_KEVIN',
    name: 'Primary Starter B (LP) Room 2 (Kevin Sterling)',
    shortCode: 'PS B (Kevin)',
    category: 'Classroom',
    color: '#db2777',
    bgColor: 'bg-pink-600/15',
    textColor: 'text-pink-200',
    borderColor: 'border-pink-400/40',
    isWorking: true,
    isBreak: false,
    iconName: 'BookOpen'
  },

  // End of classes
  {
    id: 'END_CLASS_1',
    name: 'End of class 1',
    shortCode: 'End Class 1',
    category: 'Classroom',
    color: '#6366f1', // indigo
    bgColor: 'bg-indigo-500/15',
    textColor: 'text-indigo-300',
    borderColor: 'border-indigo-500/40',
    isWorking: true,
    isBreak: false,
    iconName: 'CheckCircle'
  },
  {
    id: 'END_CLASS_2',
    name: 'End of class 2',
    shortCode: 'End Class 2',
    category: 'Classroom',
    color: '#6366f1',
    bgColor: 'bg-indigo-500/15',
    textColor: 'text-indigo-300',
    borderColor: 'border-indigo-500/40',
    isWorking: true,
    isBreak: false,
    iconName: 'CheckCircle'
  },
  {
    id: 'END_CLASS_3',
    name: 'End of class 3',
    shortCode: 'End Class 3',
    category: 'Classroom',
    color: '#6366f1',
    bgColor: 'bg-indigo-500/15',
    textColor: 'text-indigo-300',
    borderColor: 'border-indigo-500/40',
    isWorking: true,
    isBreak: false,
    iconName: 'CheckCircle'
  },
  {
    id: 'END_CLASS_4',
    name: 'End of class 4',
    shortCode: 'End Class 4',
    category: 'Classroom',
    color: '#6366f1',
    bgColor: 'bg-indigo-500/15',
    textColor: 'text-indigo-300',
    borderColor: 'border-indigo-500/40',
    isWorking: true,
    isBreak: false,
    iconName: 'CheckCircle'
  },
  {
    id: 'END_CLASS_5',
    name: 'End of class 5',
    shortCode: 'End Class 5',
    category: 'Classroom',
    color: '#6366f1',
    bgColor: 'bg-indigo-500/15',
    textColor: 'text-indigo-300',
    borderColor: 'border-indigo-500/40',
    isWorking: true,
    isBreak: false,
    iconName: 'CheckCircle'
  },
  {
    id: 'END_CLASS_6',
    name: 'End of class 6',
    shortCode: 'End Class 6',
    category: 'Classroom',
    color: '#6366f1',
    bgColor: 'bg-indigo-500/15',
    textColor: 'text-indigo-300',
    borderColor: 'border-indigo-500/40',
    isWorking: true,
    isBreak: false,
    iconName: 'CheckCircle'
  },

  // Breaks & Off
  {
    id: 'TCA_BREAK',
    name: 'TCA Break',
    shortCode: 'TCA Break',
    category: 'Breaks',
    color: '#10b981', // emerald
    bgColor: 'bg-emerald-500/20',
    textColor: 'text-emerald-300',
    borderColor: 'border-emerald-500/40',
    isWorking: false,
    isBreak: true,
    iconName: 'Coffee'
  },
  {
    id: 'OFF',
    name: 'Off / Non-working',
    shortCode: 'OFF',
    category: 'Breaks',
    color: '#475569', // slate-600
    bgColor: 'bg-slate-700/30',
    textColor: 'text-slate-400',
    borderColor: 'border-slate-600/30',
    isWorking: false,
    isBreak: false,
    iconName: 'Moon'
  }
];

export const SHIFT_PRESETS: ShiftPreset[] = [];

// Helper to resolve an activity from code/name/id
export const findActivity = (query: string): ShiftActivity | undefined => {
  if (!query) return undefined;
  const q = query.trim().toLowerCase();
  return ACTIVITIES.find(a => 
    a.id.toLowerCase() === q ||
    a.name.toLowerCase() === q ||
    a.shortCode.toLowerCase() === q
  );
};
