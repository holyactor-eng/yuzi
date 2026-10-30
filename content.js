// Programme. parle = forme téhéranaise (audio, reconnaissance vocale) ; ecrit = forme standard (lecture, écriture).
// proches = 3 mots qui servent de leurres et de grammaire pour la reconnaissance.

const m = (id, parle, ecrit, emoji, proches) => [id, { id, parle, ecrit, emoji, proches }];
// Mots d'un même thème : les proches sont les 3 suivants du groupe (en boucle), donc de vrais leurres.
const groupe = (...mots) => mots.map(([id, parle, ecrit, emoji, extra], i) =>
  [id, { id, parle, ecrit, emoji, proches: [1, 2, 3].map((k) => mots[(i + k) % mots.length][0]), ...extra }]);
// Lettre : on la voit telle quelle, on entend son nom. Les voyelles brèves guident la voix IA, la reconnaissance les ignore.
// voix : texte donné à la voix IA quand le nom écrit la fait mal prononcer.
const lettre = (id, nom, forme, extra) => ['l-' + id, nom, forme, forme, { lettre: true, ...extra }];

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
  ...groupe(
    ['ghermez', 'قرمز', 'قرمز', '🔴'], ['abi', 'آبی', 'آبی', '🔵'], ['sabz', 'سبز', 'سبز', '🟢'],
    ['zard', 'زرد', 'زرد', '🟡'], ['narenji', 'نارنجی', 'نارنجی', '🟠'], ['banafsh', 'بنفش', 'بنفش', '🟣'],
    ['siah', 'سیاه', 'سیاه', '⚫'], ['sefid', 'سفید', 'سفید', '⚪'], ['ghahvei', 'قهوه‌ای', 'قهوه‌ای', '🟤'],
  ),
  ...groupe(
    ['yek', 'یک', 'یک', '1️⃣'], ['do', 'دو', 'دو', '2️⃣'], ['seh', 'سه', 'سه', '3️⃣'], ['chahar', 'چهار', 'چهار', '4️⃣'],
    ['panj', 'پنج', 'پنج', '5️⃣'], ['shish', 'شیش', 'شش', '6️⃣'], ['haft', 'هفت', 'هفت', '7️⃣'], ['hasht', 'هشت', 'هشت', '8️⃣'],
    ['noh', 'نُه', 'نه', '9️⃣'], ['dah', 'ده', 'ده', '🔟'],
  ),
  ...groupe(
    ['gorbe', 'گربه', 'گربه', '🐱'], ['sag', 'سگ', 'سگ', '🐶'], ['mahi', 'ماهی', 'ماهی', '🐟'], ['parande', 'پرنده', 'پرنده', '🐦'],
    ['asb', 'اسب', 'اسب', '🐴'], ['gav', 'گاو', 'گاو', '🐮'], ['shir', 'شیر', 'شیر', '🦁'], ['fil', 'فیل', 'فیل', '🐘'],
    ['khargush', 'خرگوش', 'خرگوش', '🐰'], ['yuz', 'یوزپلنگ', 'یوزپلنگ', '🐆'],
  ),
  ...groupe(
    ['ab', 'آب', 'آب', '💧'], ['nun', 'نون', 'نان', '🍞'], ['sib', 'سیب', 'سیب', '🍎'], ['moz', 'موز', 'موز', '🍌'],
    ['berenj', 'برنج', 'برنج', '🍚'], ['panir', 'پنیر', 'پنیر', '🧀'], ['tokhmemorgh', 'تخم‌مرغ', 'تخم‌مرغ', '🥚'],
    ['hendune', 'هندونه', 'هندوانه', '🍉'], ['bastani', 'بستنی', 'بستنی', '🍦'], ['chai', 'چایی', 'چای', '🍵'],
  ),
  ...groupe(
    ['cheshm', 'چشم', 'چشم', '👁️'], ['gush', 'گوش', 'گوش', '👂'], ['damagh', 'دماغ', 'بینی', '👃'], ['dahan', 'دهن', 'دهان', '👄'],
    ['dast', 'دست', 'دست', '✋'], ['pa', 'پا', 'پا', '🦶'], ['dandun', 'دندون', 'دندان', '🦷'], ['zabun', 'زبون', 'زبان', '👅'],
  ),
  ...groupe(
    ['khune', 'خونه', 'خانه', '🏠'], ['dar', 'در', 'در', '🚪'], ['panjere', 'پنجره', 'پنجره', '🪟'], ['takht', 'تخت', 'تخت', '🛏️'],
    ['sandali', 'صندلی', 'صندلی', '🪑'], ['hammum', 'حموم', 'حمام', '🛁'], ['kelid', 'کلید', 'کلید', '🔑'],
    ['cheragh', 'چراغ', 'چراغ', '💡'], ['televizion', 'تلویزیون', 'تلویزیون', '📺'],
  ),
  ...groupe(
    ['bekhab', 'بخواب', 'بخواب', '😴'], ['bokhor', 'بخور', 'بخور', '🍴'], ['bedo', 'بدو', 'بدو', '🏃'], ['bepar', 'بپر', 'بپر', '🤸'],
    ['beraghs', 'برقص', 'برقص', '💃'], ['bekhand', 'بخند', 'بخند', '😂'], ['bekhun', 'بخون', 'بخوان', '📖'],
    ['benevis', 'بنویس', 'بنویس', '✍️'], ['bazikon', 'بازی کن', 'بازی کن', '⚽'],
  ),
  ...groupe(
    ['dustetdaram', 'دوستت دارم', 'دوستت دارم', '❤️'], ['goshname', 'گشنمه', 'گرسنه‌ام', '😋'], ['teshname', 'تشنمه', 'تشنه‌ام', '🥤'],
    ['khaste', 'خسته‌ام', 'خسته‌ام', '🥱'], ['biainja', 'بیا اینجا', 'بیا اینجا', '👉'], ['komakam', 'کمکم کن', 'کمکم کن', '🆘'],
    ['bebakhshid', 'ببخشید', 'ببخشید', '🙇'], ['esmet', 'اسمت چیه؟', 'اسم تو چیست؟', '📛'],
  ),
  // Alphabet : un groupe par leçon, lettres de forme voisine ensemble.
  ...groupe(lettre('alef', 'اَلِف', 'ا'), lettre('be', 'بِه', 'ب'), lettre('pe', 'پِه', 'پ'), lettre('te', 'تِه', 'ت', { dire: false }), lettre('se', 'ثِه', 'ث')),
  ...groupe(lettre('jim', 'جیم', 'ج'), lettre('che', 'چِه', 'چ'), lettre('hejimi', 'حِه جیمی', 'ح'), lettre('khe', 'خِه', 'خ', { voix: 'خ' }), lettre('dal', 'دال', 'د'), lettre('zal', 'ذال', 'ذ')),
  ...groupe(lettre('re', 'رِه', 'ر'), lettre('ze', 'زِه', 'ز', { voix: 'ز' }), lettre('zhe', 'ژِه', 'ژ'), lettre('sin', 'سین', 'س'), lettre('shin', 'شین', 'ش')),
  // « ضاد » manque au vocabulaire de la reconnaissance : « زاد » se prononce pareil.
  ...groupe(lettre('sad', 'صاد', 'ص'), lettre('zad', 'زاد', 'ض'), lettre('ta', 'طا', 'ط'), lettre('za', 'ظا', 'ظ'), lettre('eyn', 'عین', 'ع'), lettre('gheyn', 'غین', 'غ')),
  ...groupe(lettre('fe', 'فِه', 'ف'), lettre('ghaf', 'قاف', 'ق'), lettre('kaf', 'کاف', 'ک'), lettre('gaf', 'گاف', 'گ'), lettre('lam', 'لام', 'ل')),
  // « میم » manque au vocabulaire de la reconnaissance, et « ته » y est pris pour « چه » : pas d'exercice « بگو » pour م ni ت.
  ...groupe(lettre('mim', 'میم', 'م', { dire: false }), lettre('nun', 'نون', 'ن'), lettre('vav', 'واو', 'و'), lettre('hedocheshm', 'هِه دو چشم', 'ه'), lettre('ye', 'یِه', 'ی')),
]);

// Trois leçons : 4 mots, 4 mots, puis les derniers mêlés à des mots déjà vus de l'unité (6 en tout).
const troisLecons = (unite, ids) => [ids.slice(0, 4), ids.slice(4, 8), [...ids.slice(8), ...[1, 5, 2, 6, 3, 7].map((i) => ids[i])].slice(0, 6)]
  .map((items, i) => ({ id: `${unite}-${i + 1}`, items }));

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
  ...[
    ['couleurs', 'رنگ‌ها', '🎨', ['ghermez', 'abi', 'sabz', 'zard', 'narenji', 'banafsh', 'siah', 'sefid', 'ghahvei']],
    ['chiffres', 'عددها', '🔢', ['yek', 'do', 'seh', 'chahar', 'panj', 'shish', 'haft', 'hasht', 'noh', 'dah']],
    ['animaux', 'حیوان‌ها', '🐾', ['gorbe', 'sag', 'mahi', 'parande', 'asb', 'gav', 'shir', 'fil', 'khargush', 'yuz']],
    ['nourriture', 'خوراکی‌ها', '🍽️', ['ab', 'nun', 'sib', 'moz', 'berenj', 'panir', 'tokhmemorgh', 'hendune', 'bastani', 'chai']],
    ['corps', 'بدن', '🧍', ['cheshm', 'gush', 'damagh', 'dahan', 'dast', 'pa', 'dandun', 'zabun']],
    ['maison', 'خانه', '🏡', ['khune', 'dar', 'panjere', 'takht', 'sandali', 'hammum', 'kelid', 'cheragh', 'televizion']],
    ['verbes', 'کارهای روزانه', '🏃', ['bekhab', 'bokhor', 'bedo', 'bepar', 'beraghs', 'bekhand', 'bekhun', 'benevis', 'bazikon']],
    ['phrases', 'جمله‌های کاربردی', '💬', ['dustetdaram', 'goshname', 'teshname', 'khaste', 'biainja', 'komakam', 'bebakhshid', 'esmet']],
  ].map(([id, titre, emoji, ids]) => ({ id, titre, emoji, lecons: troisLecons(id, ids) })),
  {
    // Les petits (4-7 ans) ne lisent pas encore : l'alphabet n'apparaît qu'à partir de 8 ans.
    id: 'alphabet', titre: 'الفبا', emoji: '🔤', groupes: ['moyen', 'grand'],
    lecons: [
      ['alef', 'be', 'pe', 'te', 'se'], ['jim', 'che', 'hejimi', 'khe', 'dal', 'zal'], ['re', 'ze', 'zhe', 'sin', 'shin'],
      ['sad', 'zad', 'ta', 'za', 'eyn', 'gheyn'], ['fe', 'ghaf', 'kaf', 'gaf', 'lam'], ['mim', 'nun', 'vav', 'hedocheshm', 'ye'],
    ].map((l, i) => ({ id: `alphabet-${i + 1}`, items: l.map((x) => 'l-' + x) })),
  },
];

// Consignes dites par le guépard (audio ui-<type>).
export const CONSIGNES = {
  ecoute: 'گوش کن و انتخاب کن',
  lis: 'بخون و انتخاب کن',
  paires: 'جفت‌ها رو پیدا کن',
  blocs: 'جمله رو بساز',
  ecris: 'بنویس',
  dis: 'بگو',
};
