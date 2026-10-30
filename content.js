// Programme. parle = forme téhéranaise (audio, reconnaissance vocale) ; ecrit = forme standard (lecture, écriture).
// proches = 3 mots qui servent de leurres et de grammaire pour la reconnaissance.

const m = (id, parle, ecrit, emoji, proches) => [id, { id, parle, ecrit, emoji, proches }];

export const MOTS = Object.fromEntries([
  // Salutations
  m('salam', 'سلام', 'سلام', '🙋', ['khodahafez', 'merci', 'khubi']),
  m('khodahafez', 'خداحافظ', 'خداحافظ', '👋', ['salam', 'shabbekheir', 'merci']),
  m('merci', 'مرسی', 'مرسی', '🙏', ['salam', 'bale', 'na']),
  m('bale', 'آره', 'بله', '👍', ['na', 'merci', 'salam']),
  m('na', 'نه', 'نه', '👎', ['bale', 'merci', 'khubi']),
  m('khubi', 'خوبی؟', 'خوبی؟', '😊', ['salam', 'merci', 'bale']),
  m('sobhbekheir', 'صبح بخیر', 'صبح بخیر', '🌅', ['shabbekheir', 'salam', 'khodahafez']),
  m('shabbekheir', 'شب بخیر', 'شب بخیر', '🌙', ['sobhbekheir', 'khodahafez', 'salam']),
  // Famille
  m('maman', 'مامان', 'مامان', '👩', ['baba', 'mamanbozorg', 'abji']),
  m('baba', 'بابا', 'بابا', '👨', ['maman', 'bababozorg', 'dadash']),
  m('dadash', 'داداش', 'برادر', '👦', ['abji', 'baba', 'bache']),
  m('abji', 'آبجی', 'خواهر', '👧', ['dadash', 'maman', 'bache']),
  m('mamanbozorg', 'مامان‌بزرگ', 'مادربزرگ', '👵', ['bababozorg', 'maman', 'abji']),
  m('bababozorg', 'بابابزرگ', 'پدربزرگ', '👴', ['mamanbozorg', 'baba', 'dadash']),
  m('bache', 'بچه', 'بچه', '👶', ['dadash', 'abji', 'maman']),
  m('khanevade', 'خونواده', 'خانواده', '👨‍👩‍👧‍👦', ['maman', 'baba', 'bache']),
]);

export const UNITES = [
  {
    id: 'salutations', titre: 'سلام و احوالپرسی', emoji: '🙋',
    lecons: [
      { id: 'salutations-1', items: ['salam', 'khodahafez', 'merci', 'bale'] },
      { id: 'salutations-2', items: ['na', 'khubi', 'salam', 'merci'] },
      { id: 'salutations-3', items: ['sobhbekheir', 'shabbekheir', 'khubi', 'khodahafez', 'bale', 'na'] },
    ],
  },
  {
    id: 'famille', titre: 'خانواده', emoji: '👨‍👩‍👧‍👦',
    lecons: [
      { id: 'famille-1', items: ['maman', 'baba', 'dadash', 'abji'] },
      { id: 'famille-2', items: ['mamanbozorg', 'bababozorg', 'bache', 'maman', 'baba'] },
      { id: 'famille-3', items: ['khanevade', 'dadash', 'abji', 'mamanbozorg', 'bababozorg', 'bache'] },
    ],
  },
];
