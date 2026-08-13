/**
 * Maps free-text exercise names → LegRoutine / ARMATUS boceto asset keys.
 * Only returns a key when a real white/orange-on-black sketch exists.
 * Unmatched → null (never show procedural placeholders).
 *
 * Matching is bilingual (EN + ES) and tolerant of pro specialty prefixes
 * (paused, deficit, weighted, incline, supported…).
 */

export type BocetoKey =
  | 'squat'
  | 'rdl'
  | 'deadlift'
  | 'bulgarian'
  | 'stepup'
  | 'lunge'
  | 'copenhagen'
  | 'nordic'
  | 'legcurl'
  | 'legextension'
  | 'soleus'
  | 'tibialis'
  | 'hacksquat'
  | 'legpress'
  | 'hipthrust'
  | 'pullthrough'
  | 'kickback'
  | 'abductor'
  | 'adductor'
  | 'bandwalk'
  | 'bench'
  | 'chestfly'
  | 'pullover'
  | 'hspu'
  | 'pushup'
  | 'dip'
  | 'straightarm'
  | 'pullup'
  | 'row'
  | 'uprightrow'
  | 'facepull'
  | 'pullapart'
  | 'externalrotation'
  | 'frontraise'
  | 'overhead'
  | 'landmine'
  | 'lateral'
  | 'shrug'
  | 'curl'
  | 'tricep'
  | 'pallof'
  | 'cablecrunch'
  | 'plank'
  | 'abwheel'
  | 'woodchop'
  | 'hangingraise'
  | 'backext'
  | 'reversehyper'
  | 'carry'
  | 'sled'
  | 'swing'
  | 'clean'
  | 'turkish'
  | 'thruster'
  | 'medball'
  | 'battlerope'
  | 'jumprope'
  | 'boxjump'
  | 'snatch'
  | 'jerk'
  | 'muscleup'
  | 'burpee'
  | 'mountainclimber'
  | 'rower'
  | 'airbike'
  | 'run'
  | 'mobility'
  | 'forearm'
  | 'situp'
  | 'bearcrawl'
  | 'skierg'
  | 'superman'
  | 'devilpress'
  | 'clamshell'
  | 'birddog'
  | 'deadbug'
  | 'wallsit'
  | 'anklecircle'

/** Patterns where a larger technique boceto helps in the coaching guide. */
const TECHNIQUE_HEAVY: ReadonlySet<BocetoKey> = new Set([
  'squat',
  'rdl',
  'deadlift',
  'bulgarian',
  'lunge',
  'nordic',
  'overhead',
  'landmine',
  'bench',
  'pullup',
  'dip',
  'hipthrust',
  'legpress',
  'copenhagen',
  'facepull',
  'backext',
  'reversehyper',
  'hangingraise',
  'legcurl',
  'legextension',
  'pullover',
  'abwheel',
  'swing',
  'sled',
  'boxjump',
  'uprightrow',
  'hacksquat',
  'straightarm',
  'hspu',
  'clean',
  'turkish',
  'thruster',
  'externalrotation',
  'pallof',
  'cablecrunch',
  'frontraise',
  'snatch',
  'jerk',
  'muscleup',
  'devilpress',
  'burpee',
  'skierg',
  'bearcrawl',
]);

type BocetoRule = {
  key: BocetoKey;
  /**
   * strong (default): library art depicts THIS exercise → safe to reuse.
   * weak: related family only → generate AI instead of forcing a wrong asset.
   */
  strength?: "strong" | "weak";
  patterns: RegExp[];
};

/** Specific patterns first — order matters. */
const RULES: BocetoRule[] = [
  {
    key: 'turkish',
    patterns: [
      /\bturkish\s*get[\s-]?ups?\b/i,
      /\bget[\s-]?up\s*turco\b/i,
      /\btgu\b/i,
      /\blevantada\s+turca\b/i,
    ],
  },
  {
    key: 'devilpress',
    patterns: [
      /\bdevil\s*press(?:es)?\b/i,
      /\bman\s*makers?\b/i,
      /\bpress\s+diablo\b/i,
    ],
  },
  {
    key: 'snatch',
    patterns: [
      /\bsnatch(?:es)?\b/i,
      /\barrancada\b/i,
      /\bsnatch\s*balance\b/i,
      /\b(?:power|hang|muscle|squat)\s*snatch\b/i,
      /\b(?:kb|kettle(?:bell)?|pesa\s*rusa)\s*snatch\b/i,
    ],
  },
  {
    key: 'jerk',
    patterns: [
      /\b(?:push|split|power)\s*jerk\b/i,
      /\benvi[oó]n\b/i,
      /\bclean\s*(and|&)\s*jerk\b/i,
    ],
  },
  {
    key: 'muscleup',
    patterns: [
      /\bmuscle[\s-]?ups?\b/i,
      /\bbar\s*muscle[\s-]?ups?\b/i,
      /\bring\s*muscle[\s-]?ups?\b/i,
      /\bmuscle\s*up\s+en\s+anillas\b/i,
    ],
  },
  {
    key: 'burpee',
    patterns: [
      /\bburpees?\b/i,
      /\bburpee\s*box\b/i,
    ],
  },
  {
    key: 'mountainclimber',
    patterns: [
      /\bmountain\s*climbers?\b/i,
      /\bescaladores?\b/i,
    ],
  },
  {
    key: 'skierg',
    patterns: [
      /\bski\s*erg\b/i,
      /\bskierg\b/i,
      /\bski[\s-]?machine\b/i,
      /\bm[aá]quina\s+de\s+ski\b/i,
    ],
  },
  {
    key: 'airbike',
    patterns: [
      /\bassault\s*bike\b/i,
      /\bair\s*bike\b/i,
      /\becho\s*bike\b/i,
      /\bfan\s*bike\b/i,
      /\bbici(?:cleta)?\s+de\s+aire\b/i,
      /\bbici\s+assault\b/i,
    ],
  },
  {
    // Before generic "row" / "remo".
    key: 'rower',
    patterns: [
      /\browing\s*machine\b/i,
      /\bconcept\s*2\b/i,
      /\bconcept2\b/i,
      /\berg\s*row\b/i,
      /\brower\b/i,
      /\bremoerg[oó]metro\b/i,
      /\bremo\s+erg\b/i,
      /\bcalorie\s*row\b/i,
      /\brow\s*calories\b/i,
    ],
  },
  {
    key: 'run',
    patterns: [
      /\b(?:treadmill|cinta)\b/i,
      /\b(?:sprint|sprints)\b/i,
      /\b(?:jog(?:ging)?|run(?:ning)?)\b/i,
      /\bcorrer\b/i,
      /\bcorrida\b/i,
      /\bshuttle\s*run\b/i,
      /\bhigh\s*knees?\b/i,
      /\brodillas?\s+altas?\b/i,
      /\bbutt\s*kicks?\b/i,
      /\bjumping\s*jacks?\b/i,
      /\bellipti/i,
      /\bstair\s*(climber|master)\b/i,
      /\bswim(?:ming)?\b/i,
      /\bnataci[oó]n\b/i,
      /\bcycl(?:e|ing)\b/i,
      /\bspin\s*bike\b/i,
      /\bbici(?:cleta)?\b/i,
      /\ba[\s-]?skip\b/i,
      /\bb[\s-]?skip\b/i,
    ],
  },
  {
    key: 'anklecircle',
    patterns: [
      /\bankle\s*circles?\b/i,
      /\bc[ií]rculos?\s+de\s+tobillo\b/i,
      /\bmovilidad\s+de\s+tobillo\b/i,
    ],
  },
  {
    // Named floor drills. Generic mobility.jpg is a different stretch —
    // never reuse it for 90/90, hip switch, pigeon, etc. → AI.
    key: 'mobility',
    strength: 'weak',
    patterns: [
      /\b90\s*[/\-]\s*90\b/i,
      /\b90\s*90\b/i,
      /\bhip\s*switch\b/i,
      /\bcambio\s+de\s+cadera\b/i,
      /\bshin\s*box\b/i,
      /\bhip\s*airplane\b/i,
      /\bworld'?s?\s*greatest\s*stretch\b/i,
      /\bpigeon\b/i,
      /\bpaloma\b/i,
      /\bcat[\s-]?cow\b/i,
      /\bgato\s*vaca\b/i,
      /\bcouch\s*stretch\b/i,
      /\bthread\s*the\s*needle\b/i,
      /\binchworm\b/i,
      /\bmovilidad\s+(de\s+)?cadera\b/i,
    ],
  },
  {
    key: 'mobility',
    patterns: [
      /\bmobility\b/i,
      /\bmovilidad\b/i,
      /\bstretch(?:ing|es)?\b/i,
      /\bestiramiento\b/i,
      /\bfoam\s*roll/i,
      /\bankle\s*mobility\b/i,
      /\bwrist\s*mobility\b/i,
      /\bbreath(?:ing)?\s*(drill|work|box)?\b/i,
      /\bbox\s*breathing\b/i,
      /\bnasal\s*breathing\b/i,
      /\brespiraci[oó]n\b/i,
    ],
  },
  {
    // Before biceps "curl".
    key: 'forearm',
    patterns: [
      /\bwrist\s*curl\b/i,
      /\bforearm\b/i,
      /\bantebrazo\b/i,
      /\bcurl\s+de\s+mu[nñ]eca\b/i,
      /\bcurl\s+de\s+antebrazo\b/i,
      /\bwrist\s*roller\b/i,
      /\bplate\s*pinch\b/i,
      /\bgrip\s*(crush|work|train)/i,
      /\bpinza\s+de\s+platos?\b/i,
      /\bagarre\b/i,
      /\bmu[nñ]ecas?\b/i,
    ],
  },
  {
    // Before generic plank / crunch.
    key: 'situp',
    patterns: [
      /\bsit[\s-]?ups?\b/i,
      /\bsitups?\b/i,
      /\bv[\s-]?ups?\b/i,
      /\bbicycle\s*crunch\b/i,
      /\bcrunch\s+bicicleta\b/i,
      /\bbicicleta\s+abdominal\b/i,
    ],
  },
  {
    key: 'bearcrawl',
    patterns: [
      /\bbear\s*crawl\b/i,
      /\bcrab\s*walk\b/i,
      /\bgato\s+oso\b/i,
      /\bcaminata\s+del\s+oso\b/i,
      /\bosito\b/i,
    ],
  },
  {
    // Before backext / hyperextension.
    key: 'superman',
    patterns: [
      /\bsupermans?\b/i,
      /\bsuper\s*mans?\b/i,
      /\bprone\s*cobra\b/i,
    ],
  },
  {
    key: 'clean',
    patterns: [
      /\b(?:power|hang|squat|muscle|goblet|sandbag)\s*clean\b/i,
      /\bclean\s*(and|&)\s*(jerk|press)\b/i,
      /\bcargada\b/i,
      /\bhang\s*clean\b/i,
      /\bkb\s*clean\b/i,
    ],
  },
  {
    key: 'thruster',
    patterns: [
      /\bthrusters?\b/i,
      /\bwall\s*balls?\b/i,
      /\bbal[oó]n\s+a\s+la\s+pared\b/i,
      /\bsentadilla\s+al\s+press\b/i,
    ],
  },
  {
    key: 'medball',
    patterns: [
      /\bmedicine\s*ball\b/i,
      /\bmed\s*ball\b/i,
      /\bslam\s*balls?\b/i,
      /\bball\s*slams?\b/i,
      /\bbal[oó]n\s+medicinal\b/i,
      /\bslams?\s+(de\s+)?bal[oó]n\b/i,
    ],
  },
  {
    key: 'battlerope',
    patterns: [
      /\bbattle\s*ropes?\b/i,
      /\bcuerda[s]?\s+de\s+batalla\b/i,
      /\bcuerdas?\s+ondulatorias?\b/i,
    ],
  },
  {
    key: 'jumprope',
    patterns: [
      /\bjump\s*ropes?\b/i,
      /\bskipping\b/i,
      /\bcuerda\s+para\s+saltar\b/i,
      /\bsaltar\s+la\s+cuerda\b/i,
      /\bsalto\s+de\s+cuerda\b/i,
      /\bdouble\s*unders?\b/i,
      /\bdoble\s*under\b/i,
    ],
  },
  {
    key: 'hspu',
    patterns: [
      /\bhandstand\s*push[\s-]?ups?\b/i,
      /\bhspu\b/i,
      /\bpike\s*push[\s-]?ups?\b/i,
      /\bflexi[oó]n(?:es)?\s+vertical(?:es)?\b/i,
      /\bflexi[oó]n(?:es)?\s+en\s+pino\b/i,
      /\bpress\s+en\s+pino\b/i,
    ],
  },
  {
    // Library JPG = side-lying EXTERNAL rotation with DUMBBELL only.
    // Standing band IR/ER and internal rotation → rejected → AI.
    key: 'externalrotation',
    patterns: [
      /\bexternal\s*rotation\b/i,
      /\binternal\s*rotation\b/i,
      /\brotaci[oó]n\s+(externa|interna)\b/i,
      /\brotator\s*cuff\b/i,
      /\bmanguera?\s+rotadora\b/i,
      /\bmanguito\s+rotador\b/i,
      /\bcuff\s*rotation\b/i,
      /\bw\s*raise\b/i,
      /\bcuban\s*press\b/i,
    ],
  },
  {
    key: 'frontraise',
    patterns: [
      /\bfront\s*raise\b/i,
      /\belevaci[oó]n\s+frontal\b/i,
      /\bfront\s*delt\b/i,
      /\belevaci[oó]n\s+de\s+frente\b/i,
    ],
  },
  {
    key: 'pallof',
    patterns: [
      /\bpallof\b/i,
      /\bpress\s+pallof\b/i,
      /\bpallof\s*press\b/i,
    ],
  },
  {
    key: 'cablecrunch',
    patterns: [
      /\bcable\s*crunch\b/i,
      /\bcrunch\s+en\s+polea\b/i,
      /\bcrunch\s+en\s+cable\b/i,
      /\bcrunch\s+con\s+polea\b/i,
      /\bkneeling\s*crunch\b/i,
      /\babdominal\s+en\s+polea\b/i,
    ],
  },
  {
    key: 'straightarm',
    patterns: [
      /\bstraight[\s-]?arm\s*pulldown\b/i,
      /\bstraight[\s-]?arm\s*lat\b/i,
      /\bjal[oó]n\s+(de\s+)?brazos?\s+rectos?\b/i,
      /\bjal[oó]n\s+con\s+brazos?\s+rectos?\b/i,
      /\bpulldown\s+de\s+brazos?\s+rectos?\b/i,
      /\bstiff[\s-]?arm\s*pulldown\b/i,
    ],
  },
  {
    key: 'bandwalk',
    patterns: [
      /\bmonster\s*walk\b/i,
      /\bbanded?\s*monster\b/i,
      /\blateral\s*band\s*walk\b/i,
      /\bband\s*walk\b/i,
      /\bcaminata\s+lateral\b/i,
      /\bcaminata\s+con\s+banda\b/i,
      /\bside\s*steps?\s*(con\s*)?banda\b/i,
    ],
  },
  {
    key: 'hacksquat',
    patterns: [
      /\bhack\s*squat\b/i,
      /\bhack\s*press\b/i,
      /\bsentadilla\s+hack\b/i,
      /\bpendulum\s*squat\b/i,
      /\bbelt\s*squat\b/i,
      /\bsentadilla\s+en\s+cintur[oó]n\b/i,
      /\bv[\s-]?squat\b/i,
    ],
  },
  {
    key: 'nordic',
    patterns: [
      /\bnordic\b/i,
      /\bn[oó]rdic[oa]?\b/i,
      /\bcurl\s+n[oó]rdic/i,
      /\bnordic\s*(hamstring|curl|isquio)/i,
      /\bglute[\s-]?ham\s*(raise|curl)?\b/i,
      /\bghr\b/i,
    ],
  },
  {
    key: 'legcurl',
    patterns: [
      /\bleg\s*curl\b/i,
      /\bhamstring\s*curl\b/i,
      /\bcurl\s+femoral\b/i,
      /\bcurl\s+(de\s+)?isquios?\b/i,
      /\bcurl\s+de\s+femoral\b/i,
      /\bfemoral\s*(sentado|tumbado|acostado|lying|seated)?\b/i,
      /\blying\s+leg\s*curl\b/i,
      /\bseated\s+leg\s*curl\b/i,
      /\bprone\s+leg\s*curl\b/i,
    ],
  },
  {
    key: 'legextension',
    patterns: [
      /\bleg\s*extension\b/i,
      /\bextensi[oó]n\s+(de\s+)?cu[aá]driceps?\b/i,
      /\bextensi[oó]n\s+de\s+piernas?\b/i,
      /\bquad\s*extension\b/i,
    ],
  },
  {
    key: 'bulgarian',
    patterns: [
      /\bb[uú]lgara\b/i,
      /\bbulgarian\b/i,
      /\brear[- ]?foot[- ]?elevated\b/i,
      /\brfes\b/i,
      /\bpie\s+trasero\s+elevado\b/i,
    ],
  },
  {
    key: 'boxjump',
    patterns: [
      /\bbox\s*jump\b/i,
      /\bsalto\s+al\s+caj[oó]n\b/i,
      /\bplyo\s*box\b/i,
      /\bbroad\s*jump\b/i,
      /\bsalto\s+horizontal\b/i,
      /\bdepth\s*jump\b/i,
      /\bpogo\s*jump\b/i,
      /\btuck\s*jump\b/i,
    ],
  },
  {
    key: 'stepup',
    patterns: [
      /\bstep[- ]?up\b/i,
      /\bstep[- ]?down\b/i,
      /\bsubida\s+al\s+caj[oó]n\b/i,
      /\bknee\s*drive\b/i,
      /\bstep\s*ups?\b/i,
    ],
  },
  {
    key: 'copenhagen',
    patterns: [
      /\bcopenhagen\b/i,
      /\bcopenhague\b/i,
      /\bplancha\s+aductora\b/i,
      /\badductor\s*plank\b/i,
    ],
  },
  {
    key: 'abductor',
    patterns: [
      /\bhip\s*abduct/i,
      /\babductor\b/i,
      /\babducci[oó]n\b/i,
      /\babductores?\b/i,
      /\bm[aá]quina\s+de\s+abduc/i,
      /\bfire\s*hydrant\b/i,
      /\bhidrante\b/i,
      /\bside[- ]?lying\s+leg\s*raise\b/i,
      /\belevaci[oó]n\s+lateral\s+de\s+pierna\b/i,
    ],
  },
  {
    key: 'adductor',
    patterns: [
      /\bhip\s*adduct/i,
      /\badductor\b/i,
      /\baducci[oó]n\b/i,
      /\baductores?\b/i,
      /\bm[aá]quina\s+de\s+aduc/i,
      /\bside[- ]?lying\s+adduct/i,
    ],
  },
  {
    // Before tricep kickback alias.
    key: 'kickback',
    patterns: [
      /\bglute\s*kickback\b/i,
      /\bcable\s*kickback\b/i,
      /\bkickback\s*(de\s*)?gl[uú]teo/i,
      /\bpatada\s+de\s+gl[uú]teo/i,
      /\bdonkey\s*kick\b/i,
      /\bfire\s*hydrant\b/i,
    ],
  },
  {
    key: 'swing',
    patterns: [
      /\b(?:kb|kettle(?:bell)?|pesa\s*rusa)\s*swing\b/i,
      /\bswing\s+(de\s+)?(?:kb|kettle|pesa\s*rusa)\b/i,
      /\bbalanceo\s+(de\s+)?pesa\s*rusa\b/i,
    ],
  },
  {
    key: 'sled',
    patterns: [
      /\bsled\b/i,
      /\bprowler\b/i,
      /\btrineo\b/i,
      /\bsled\s*(push|pull|drag|march)\b/i,
      /\bempuje\s+de\s+trineo\b/i,
      /\btire\s*flip\b/i,
      /\bvolteo\s+de\s+llanta\b/i,
      /\bsledgehammer\b/i,
      /\bmartillo\s+neum[aá]tico\b/i,
    ],
  },
  {
    key: 'landmine',
    patterns: [
      /\blandmine\b/i,
      /\bpress\s+landmine\b/i,
      /\blandmine\s*press\b/i,
      /\bbarra\s+en\s+esquina\b/i,
      /\bpress\s+en\s+esquina\b/i,
    ],
  },
  {
    key: 'pullthrough',
    patterns: [
      /\bpull[\s-]?through\b/i,
      /\bglute\s*pull[\s-]?through\b/i,
      /\bjal[oó]n\s+entre\s+piernas\b/i,
      /\bpull\s*through\b/i,
      /\bcable\s*pull[\s-]?through\b/i,
    ],
  },
  {
    key: 'pullover',
    patterns: [
      /\bpullover\b/i,
      /\bpull[\s-]?over\b/i,
      /\bjala\s*sobre\b/i,
      /\bpull\s*over\b/i,
    ],
  },
  {
    key: 'pullapart',
    patterns: [
      /\bpull[\s-]?apart\b/i,
      /\bband\s*pull[\s-]?apart\b/i,
      /\baperturas?\s+con\s+banda\b/i,
      /\bapertura\s+de\s+banda\b/i,
    ],
  },
  {
    // Before chestfly — "aperturas posteriores" must not become pec fly art.
    key: 'facepull',
    patterns: [
      /\bface\s*pull\b/i,
      /\bpull\s*to\s*face\b/i,
      /\bjal[oó]n\s+a\s+la\s+cara\b/i,
      /\bpull\s+facial\b/i,
      /\bp[áa]jaros?\b/i,
      /\brear\s*delt\b/i,
      /\breverse\s*flye?\b/i,
      /\baperturas?\s+posteriores?\b/i,
    ],
  },
  {
    // Library JPG = standing cable fly / crossover only.
    key: 'chestfly',
    patterns: [
      /\bcable\s*(chest\s*)?flye?s?\b/i,
      /\bcruces?\s+(en|de)\s+poleas?\b/i,
      /\baperturas?\s+(en|de)\s+poleas?\b/i,
      /\bcrossover\b/i,
      /\bcable\s*crossover\b/i,
      /\bcruce\s+de\s+poleas?\b/i,
    ],
  },
  {
    // Pec deck / dumbbell fly ≠ cable art → AI
    key: 'chestfly',
    strength: 'weak',
    patterns: [
      /\bchest\s*flye?s?\b/i,
      /\bpec\s*deck\b/i,
      /\bfly\s*machine\b/i,
      /\baperturas?\s+(de\s+pecho|en\s+m[aá]quina|con\s+mancuernas?)\b/i,
      /\bpec\s*flye?s?\b/i,
      /\bdb\s*flye?s?\b/i,
      /\bdumbbell\s*flye?s?\b/i,
      /\bflye?s?\s+con\s+mancuernas?\b/i,
      /\baperturas?\b/i,
    ],
  },
  {
    key: 'uprightrow',
    patterns: [
      /\bupright\s*row\b/i,
      /\bremo\s+al\s+ment[oó]n\b/i,
      /\bremo\s+vertical\b/i,
      /\bhigh\s*pull\b/i,
    ],
  },
  {
    key: 'shrug',
    patterns: [
      /\bshrugs?\b/i,
      /\bencogimientos?\b/i,
      /\btrap\s*shrug\b/i,
    ],
  },
  {
    key: 'woodchop',
    patterns: [
      /\bwood\s*chops?\b/i,
      /\bwoodchop/i,
      /\bcable\s*chop\b/i,
      /\ble[ñn]ador\b/i,
      /\brussian\s*twist\b/i,
      /\brotaci[oó]n\s+de\s+tronco\b/i,
    ],
  },
  {
    key: 'abwheel',
    patterns: [
      /\bab\s*wheel\b/i,
      /\bwheel\s*rollout\b/i,
      /\brollouts?\b/i,
      /\brueda\s+abdominal\b/i,
      /\brueda\s+de\s+abs?\b/i,
      /\babdominal\s*wheel\b/i,
      /\bab\s*rollout\b/i,
    ],
  },
  {
    // Before generic hyperextension → backext.
    key: 'reversehyper',
    patterns: [
      /\breverse\s*hyper/i,
      /\breverse\s*hyperextension\b/i,
      /\bhiperextensi[oó]n\s+invertida\b/i,
      /\bextensi[oó]n\s+invertida\b/i,
    ],
  },
  {
    key: 'tibialis',
    patterns: [
      /\btibial(?:is)?\b/i,
      /\bdorsiflex/i,
      /\beleva[- ]?puntas?\b/i,
      /\btoe\s*raise\b/i,
    ],
  },
  {
    key: 'soleus',
    patterns: [
      /\bs[oó]leo\b/i,
      /\bcalf\b/i,
      /\bcalves\b/i,
      /\bpantorrilla\b/i,
      /\bgemelos?\b/i,
      /\bgastroc\b/i,
      /\bheel\s*raise\b/i,
      /\belevaci[oó]n\s+de\s+tal[oó]n\b/i,
      /\belevaci[oó]n\s+de\s+(s[oó]leo|gemelos?)\b/i,
      /\bseated\s+calf\b/i,
      /\bstanding\s+calf\b/i,
      /\bdonkey\s+calf\b/i,
      /\bcomplejo\s+de\s+tobillo\b/i,
      /\bankle\s*(complex|circuit|prep|strength)\b/i,
      /\btrabajo\s+de\s+tobillo\b/i,
    ],
  },
  {
    key: 'legpress',
    patterns: [
      /\bleg\s*press\b/i,
      /\bprensa\s*(de\s*)?piernas?\b/i,
    ],
  },
  {
    key: 'hipthrust',
    patterns: [
      /\bhip\s*thrust\b/i,
      /\bglute\s*bridge\b/i,
      /\bpuente\s*(de\s*)?gl[uú]teo/i,
      /\bpuente\s+unipodal\b/i,
      /\bpuente\s+(a\s+)?una\s+pierna\b/i,
      /\bsingle[- ]?leg\s+bridge\b/i,
      /\bbridge\b/i,
      /\bpuente\b/i,
      /\bempuje\s+de\s+cadera\b/i,
    ],
  },
  {
    key: 'backext',
    patterns: [
      /\bback\s*extension\b/i,
      /\bhyperextension\b/i,
      /\bhiperextensi[oó]n\b/i,
      /\bextensi[oó]n\s+de\s+espalda\b/i,
      /\broman\s*chair\b/i,
      /\bgood\s*morning\b/i,
      /\bbuenos?\s*d[ií]as?\b/i,
    ],
  },
  {
    key: 'lateral',
    patterns: [
      /\blateral\s*raise\b/i,
      /\belevaci[oó]n(?:es)?\s+lateral(?:es)?\b/i,
      /\bside\s*raise\b/i,
      /\bdeltoid\s*raise\b/i,
      /\by[\s-]?raise\b/i,
      /\bt[\s-]?raise\b/i,
      /\bscaption\b/i,
      /\blu\s*raise\b/i,
    ],
  },
  {
    key: 'overhead',
    patterns: [
      /\boverhead\s*press\b/i,
      /\bshoulder\s*press\b/i,
      /\bmilitary\s*press\b/i,
      /\bpress\s*militar\b/i,
      /\bohp\b/i,
      /\bpush\s*press\b/i,
      /\bpress\s*de\s*hombro\b/i,
      /\barnold\s*press\b/i,
      /\bpress\s+arnold\b/i,
      /\bpress\s*arriba\b/i,
      /\bpress\s+de\s+hombro\b/i,
      /\bz\s*press\b/i,
      /\bbehind[\s-]?the[\s-]?neck\s*press\b/i,
      /\bbradford\s*press\b/i,
      /\blog\s*press\b/i,
      /\bviking\s*press\b/i,
    ],
  },
  {
    key: 'curl',
    patterns: [
      /\bcurl\b/i,
      /\bbiceps?\b/i,
      /\bb[ií]ceps?\b/i,
      /\bmartillo\b/i,
      /\bhammer\s*curl\b/i,
      /\bpreacher\b/i,
      /\bspider\s*curl\b/i,
      /\bconcentraci[oó]n\b/i,
      /\breverse\s*curl\b/i,
    ],
  },
  {
    key: 'tricep',
    patterns: [
      /\btriceps?\b/i,
      /\btr[ií]ceps?\b/i,
      /\bskull\s*crush/i,
      /\bpushdown\b/i,
      /\bextensi[oó]n\s+de\s+tr[ií]ceps?\b/i,
      /\bpress\s+franc[eé]s\b/i,
      /\btricep(?:s)?\s*kickback\b/i,
      /\bkickback\s+de\s+tr[ií]ceps?\b/i,
    ],
  },
  {
    key: 'hangingraise',
    patterns: [
      /\bhanging\s*(knee|leg)\s*raise\b/i,
      /\btuck\s*raise\b/i,
      /\belevaci[oó]n\s+de\s+(rodillas|piernas)\b/i,
      /\bleg\s*raise\b/i,
      /\btoes?\s*to\s*bar\b/i,
      /\bknees?\s*to\s*(elbows?|chest)\b/i,
      /\belevaci[oó]n\s+.*\bcolgado\b/i,
    ],
  },
  {
    key: 'dip',
    patterns: [
      /\bdips?\b/i,
      /\bfondo[s]?\b/i,
      /\bfondos?\s+en\s+paralelas?\b/i,
    ],
  },
  {
    // Strict: only bodyweight pull-ups. Lat pulldown / jalón al pecho → AI (no library asset).
    key: 'pullup',
    patterns: [
      /\bpull[- ]?ups?\b/i,
      /\bchin[- ]?ups?\b/i,
      /\bdominadas?\b/i,
      /\bscapular\s*(pull[- ]?up|hang)\b/i,
    ],
  },
  {
    // Library art = two-hand barbell bent-over row only.
    key: 'row',
    patterns: [
      /\bpendlay\b/i,
      /\bbarbell\s*row\b/i,
      /\bbent[- ]?over\s*row\b/i,
      /\bremo\s+con\s+barra\b/i,
      /\bremo\s+barra\b/i,
      /\bremo\s+pentlay\b/i,
    ],
  },
  {
    // Bare "row" / "remo" — cable, DB, and mystery names must not steal barbell-row art.
    key: 'row',
    strength: 'weak',
    patterns: [
      /\brows?\b/i,
      /\bremo\b/i,
      /\binvertido\b/i,
      /\binverted\s*row\b/i,
      /\baustralian\s*pull/i,
      /\bseal\s*row\b/i,
      /\bchest[- ]?supported\b/i,
      /\bapoyado\s+en\s+(banco|pecho)\b/i,
      /\bt[\s-]?bar\s*row\b/i,
      /\bmeadows?\s*row\b/i,
    ],
  },
  {
    key: 'bench',
    patterns: [
      /\bbench\b/i,
      /\bpress\s*banca\b/i,
      /\bpress\s+de\s+banca\b/i,
      /\bchest\s*press\b/i,
      /\bpress\s*de\s*pecho\b/i,
      /\bpress\s+pecho\b/i,
      /\bbanca\s+(plana|inclinada|declinada)\b/i,
      /\bpress\s+inclinado\b/i,
      /\bincline\s+(db\s+)?(bench|press)\b/i,
      // "Incline Dumbbell Press" — dumbbell between incline and press
      /\bincline\s+(dumbbell|db|mancuernas?)\s*(bench\s*)?press\b/i,
      /\b(?:dumbbell|db|mancuernas?)\s+incline\s*(bench\s*)?press\b/i,
      /\bpress\s+(?:con\s+)?mancuernas?\s+inclinado\b/i,
      /\bdecline\s+(bench|press)\b/i,
      /\bdecline\s+(dumbbell|db|mancuernas?)\s*(bench\s*)?press\b/i,
      /\bfloor\s*press\b/i,
      /\bspoto\s*press\b/i,
      /\bpin\s*press\b/i,
      /\bboard\s*press\b/i,
      /\bsvend\s*press\b/i,
      /\bclose[\s-]?grip\s*(bench|press)\b/i,
    ],
  },
  {
    key: 'pushup',
    patterns: [
      /\bpush[- ]?ups?\b/i,
      /\bflexi[oó]n(?:es)?\b/i,
      /\blagartijas?\b/i,
      /\bplancha\s*de\s*empuje\b/i,
      /\bscapular\s*push[\s-]?up\b/i,
    ],
  },
  {
    key: 'carry',
    patterns: [
      /\bfarmer\b/i,
      /\bcarry\b/i,
      /\bsuitcase\b/i,
      /\bwaiter\s*carry\b/i,
      /\byoke\b/i,
      /\bsandbag\s*carry\b/i,
      /\bloaded\s*walk\b/i,
      /\bcaminata\s*(con\s*)?(carga|pesas?|kettle)/i,
      /\bmarch\b/i,
      /\bpaseo\s+del\s+granjero\b/i,
      /\brack\s*hold\b/i,
    ],
  },
  {
    key: 'clamshell',
    patterns: [
      /\bclamshell\b/i,
      /\balmeja\b/i,
      /\bside[- ]?lying\s+hip\s+external\s+rotation\b/i,
      /\brotaci[oó]n\s+externa\s+de\s+cadera\b/i,
    ],
  },
  {
    key: 'birddog',
    patterns: [
      /\bbird\s*dog\b/i,
      /\bbirddog\b/i,
      /\bperro\s+de\s+caza\b/i,
      /\bquadruped\s+(reach|extension)\b/i,
    ],
  },
  {
    key: 'deadbug',
    patterns: [
      /\bdead\s*bug\b/i,
      /\bdeadbug\b/i,
      /\bbicho\s*muerto\b/i,
    ],
  },
  {
    key: 'wallsit',
    patterns: [
      /\bwall\s*sit\b/i,
      /\bsentadilla\s+isométrica\b/i,
      /\bsentadilla\s+en\s+pared\b/i,
      /\bisom[eé]trico\s+en\s+pared\b/i,
    ],
  },
  {
    key: 'plank',
    patterns: [
      /\bplank\b/i,
      /\bplancha\b/i,
      /\bhollow\s*(hold|body|rock)?\b/i,
    ],
  },
  {
    // Related core work — do not reuse plank art
    key: 'plank',
    strength: 'weak',
    patterns: [
      /\babdominal\b/i,
      /\bcrunch\b/i,
      /\bcore\s*(anti[- ]?rot|stability|work)\b/i,
    ],
  },
  {
    key: 'lunge',
    patterns: [
      /\blunge\b/i,
      /\bzancada\b/i,
      /\bdesplantes?\b/i,
      /\bsplit\s*squat\b/i,
      /\bsentadilla\s+dividida\b/i,
      /\bcossack\b/i,
    ],
  },
  {
    key: 'rdl',
    patterns: [
      /\brdl\b/i,
      /\brumano\b/i,
      /\bromanian\b/i,
      /\bsingle[- ]?leg\s+deadlift\b/i,
      /\bpeso\s+muerto\s+rumano\b/i,
      /\bpeso\s+muerto\s+a\s+una\s+pierna\b/i,
      /\bhip\s*hinge\b/i,
      /\bstiff[- ]?leg\b/i,
    ],
  },
  {
    key: 'deadlift',
    patterns: [
      /\bdeadlift\b/i,
      /\bpeso\s+muerto\b/i,
      /\btrap\s*bar\b/i,
      /\bhexa\s*bar\b/i,
      /\bsumo\s*(deadlift|peso\s+muerto)\b/i,
      /\brack\s*pull\b/i,
    ],
  },
  {
    key: 'squat',
    // Canonical library asset: barbell / deep back squat only.
    // Variants (goblet, front, DB, etc.) are rejected below → AI.
    patterns: [
      /\bsquat\b/i,
      /\bsentadilla\b/i,
      /\bgoblet\b/i,
      /\bfront\s*squat\b/i,
      /\bsafety[- ]?bar\b/i,
      /\bzercher\b/i,
      /\bsissy\b/i,
    ],
  },
];

export type BocetoMatch = {
  key: BocetoKey;
  strength: "strong" | "weak";
};

/**
 * Each library JPG shows ONE canonical variation. If the exercise text
 * (name + caption + intro…) contradicts that, skip library → AI.
 */
/** Shared rejects when the library JPG shows a barbell (not DB/cable/machine). */
const BARBELL_ASSET_REJECTS = [
  /\bmancuernas?\b/i,
  /\bdumbbells?\b/i,
  /\bdb\b/i,
  /\bkettle\b/i,
  /\bkettlebells?\b/i,
  /\bcable\b/i,
  /\bpolea\b/i,
  /\bm[aá]quina\b/i,
  /\bsmith\b/i,
  /\bbanda\b/i,
  /\bbands?\b/i,
];

const LIBRARY_ASSET_REJECT: Partial<Record<BocetoKey, RegExp[]>> = {
  // Asset: two-hand barbell bent-over row
  row: [
    /\buna\s+mano\b/i,
    /\ba\s+una\s+mano\b/i,
    /\bsingle[- ]?arm\b/i,
    /\bone[- ]?arm\b/i,
    /\bunilateral\b/i,
    /\bunipodal\b/i,
    ...BARBELL_ASSET_REJECTS,
    /\binvertido\b/i,
    /\binverted\b/i,
    /\baustralian\b/i,
    /\bseal\s*row\b/i,
    /\bchest[- ]?supported\b/i,
    /\bmeadows?\b/i,
    /\bt[\s-]?bar\b/i,
    /\bapoyado\s+en\s+(banco|pecho)\b/i,
  ],
  // Asset: bodyweight pull-up on fixed bar
  pullup: [
    /\bjal[oó]n\b/i,
    /\bpulldown\b/i,
    /\blat\s*pull/i,
    /\bpolea\b/i,
    /\bcable\b/i,
    /\bm[aá]quina\b/i,
    /\bassisted\b/i,
  ],
  // Asset: barbell back / deep squat — NEVER reuse for DB/goblet/front/etc.
  squat: [
    /\bb[uú]lgara\b/i,
    /\bbulgarian\b/i,
    /\bhack\b/i,
    /\bwall\s*sit\b/i,
    /\bsentadilla\s+en\s+pared\b/i,
    /\bpistol\b/i,
    /\bcossack\b/i,
    ...BARBELL_ASSET_REJECTS,
    /\bgoblet\b/i,
    /\bfront\s*squat\b/i,
    /\bsentadilla\s+frontal\b/i,
    /\bsentadilla\s+con\s+(mancuerna|pesa|kettle)/i,
    /\bsafety[- ]?bar\b/i,
    /\bzercher\b/i,
    /\bsissy\b/i,
    /\bbox\s*squat\b/i,
    /\bpause\s*squat\b/i,
  ],
  // Asset: barbell bench press (flat)
  bench: [
    ...BARBELL_ASSET_REJECTS,
    /\bfloor\s*press\b/i,
    /\bpush[- ]?ups?\b/i,
    /\blagartijas?\b/i,
    /\bincline\b/i,
    /\bdeclin/i,
    /\binclinad/i,
  ],
  // Asset: standing cable fly — reject machine/dumbbell variants
  chestfly: [
    /\bpec\s*deck\b/i,
    /\bfly\s*machine\b/i,
    /\bmancuernas?\b/i,
    /\bdumbbells?\b/i,
    /\bdb\s*fly/i,
    /\ben\s+m[aá]quina\b/i,
    /\ben\s+banco\b/i,
    /\btumbado\b/i,
    /\blying\b/i,
    /\bsentado\b/i,
    /\bseated\b/i,
  ],
  // Asset: conventional barbell deadlift
  deadlift: [
    /\brdl\b/i,
    /\brumano\b/i,
    /\bromanian\b/i,
    /\bsingle[- ]?leg\b/i,
    /\btrap\s*bar\b/i,
    /\bhexa\s*bar\b/i,
    /\bsumo\b/i,
    ...BARBELL_ASSET_REJECTS,
  ],
  lunge: [
    /\bbulgarian\b/i,
    /\bb[uú]lgara\b/i,
    ...BARBELL_ASSET_REJECTS,
    /\bwalking\b/i,
    /\bcaminando\b/i,
    /\breversa\b/i,
    /\breverse\b/i,
  ],
  // Asset: barbell overhead / military press
  overhead: [
    /\blandmine\b/i,
    /\barnold\b/i,
    /\bz\s*press\b/i,
    ...BARBELL_ASSET_REJECTS,
    /\bpush\s*press\b/i,
    /\bbehind[\s-]?the[\s-]?neck\b/i,
    /\btras\s+nuca\b/i,
    /\bsentado\b/i,
    /\bseated\b/i,
  ],
  hipthrust: [
    /\buna\s+pierna\b/i,
    /\bsingle[- ]?leg\b/i,
    /\bglute\s*bridge\b/i,
    /\bpuente\b/i,
    /\bmancuernas?\b/i,
    /\bdumbbells?\b/i,
  ],
  rdl: [
    /\bmancuernas?\b/i,
    /\bdumbbells?\b/i,
    /\bdb\b/i,
    /\bkettle\b/i,
    /\bsingle[- ]?leg\b/i,
    /\buna\s+pierna\b/i,
  ],
  // Asset: side-lying DB external rotation — reject band / IR / standing
  externalrotation: [
    /\binterna\b/i,
    /\binternal\b/i,
    /\bbanda\b/i,
    /\bband\b/i,
    /\bligas?\b/i,
    /\btheraband\b/i,
    /\belastic/i,
    /\bde\s+pie\b/i,
    /\bstanding\b/i,
    /\bpolea\b/i,
    /\bcable\b/i,
  ],
  // Generic mobility JPG — reject named floor drills and hip rotation copy
  mobility: [
    /\b90\s*[/\-]\s*90\b/i,
    /\bhip\s*switch\b/i,
    /\bcambio\s+de\s+cadera\b/i,
    /\babducci/i,
    /\bdesplante/i,
    /\blunge/i,
    /\bpiernas?\s+de\s+un\s+lado\b/i,
    /\bside[\s-]?to[\s-]?side\b/i,
  ],
  curl: [/\bm[aá]quina\b/i, /\bcable\b/i, /\bpolea\b/i],
  lateral: [/\bcable\b/i, /\bpolea\b/i, /\bm[aá]quina\b/i],
};

export type BocetoTextContext = {
  nameEn?: string | null;
  sketchCaption?: string | null;
  intro?: string | null;
  purpose?: string | null;
};

function exerciseTextBlob(
  name: string,
  ctx?: BocetoTextContext | null,
): string {
  return [name, ctx?.nameEn, ctx?.sketchCaption, ctx?.intro, ctx?.purpose]
    .filter(Boolean)
    .join("\n");
}

/** False when coaching text describes a different variation than the JPG. */
export function isCompatibleWithLibraryAsset(
  key: BocetoKey,
  name: string,
  ctx?: BocetoTextContext | null,
): boolean {
  const rejects = LIBRARY_ASSET_REJECT[key];
  if (!rejects?.length) return true;
  const blob = exerciseTextBlob(name, ctx);
  return !rejects.some((re) => re.test(blob));
}

/** First matching rule (any strength). Uses name + nameEn. */
export function resolveBocetoMatch(
  name: string | undefined | null,
  ctx?: BocetoTextContext | null,
): BocetoMatch | null {
  const n = [name, ctx?.nameEn].filter(Boolean).join(" | ").trim();
  if (!n) return null;
  for (const rule of RULES) {
    if (rule.patterns.some((re) => re.test(n))) {
      return { key: rule.key, strength: rule.strength ?? "strong" };
    }
  }
  return null;
}

/**
 * Strong + compatible library match only.
 * Pass coaching text so "remo a una mano" does not reuse barbell-row art.
 * If equipment/variation is not an exact fit for the JPG → null (AI).
 */
export function resolveBocetoKey(
  name: string | undefined | null,
  ctx?: BocetoTextContext | null,
): BocetoKey | null {
  const match = resolveBocetoMatch(name, ctx);
  if (!match || match.strength !== "strong") return null;
  if (!isCompatibleWithLibraryAsset(match.key, name || "", ctx)) return null;
  return match.key;
}

/** True when the lift benefits from a larger technique sketch in the guide. */
export function isTechniqueHeavyBoceto(
  name: string | undefined | null,
  ctx?: BocetoTextContext | null,
): boolean {
  const key = resolveBocetoKey(name, ctx);
  return key != null && TECHNIQUE_HEAVY.has(key);
}

/** Strong + compatible library match available. */
export function hasBocetoArt(
  name: string | undefined | null,
  ctx?: BocetoTextContext | null,
): boolean {
  return resolveBocetoKey(name, ctx) != null;
}

/** Public URL for a library boceto (ARMATUS white/orange line art). */
export function bocetoPublicPath(key: BocetoKey): string {
  return `/bocetos/${key}.jpg`;
}

/**
 * Resolve exercise name → library image path.
 * Returns null when unmatched, weak, or text contradicts the asset (→ AI).
 */
export function resolveBocetoPath(
  name: string | undefined | null,
  ctx?: BocetoTextContext | null,
): string | null {
  const key = resolveBocetoKey(name, ctx);
  return key ? bocetoPublicPath(key) : null;
}

export function resolveBocetoCaption(
  name: string | undefined | null,
  ctx?: BocetoTextContext | null,
): string | null {
  const key = resolveBocetoKey(name, ctx);
  if (!key) return null;
  return BOCETO_LABELS[key]?.es ?? null;
}

export const BOCETO_LABELS: Record<BocetoKey, { en: string; es: string }> = {
  squat: { en: 'Deep squat', es: 'Posición profunda' },
  rdl: { en: 'Hip hinge', es: 'Bisagra en T' },
  deadlift: { en: 'Deadlift', es: 'Peso muerto' },
  bulgarian: { en: 'Rear foot elevated', es: 'Pie trasero elevado' },
  stepup: { en: 'Knee drive', es: 'Subida al cajón' },
  lunge: { en: 'Lunge', es: 'Zancada' },
  copenhagen: { en: 'Adductor plank', es: 'Plancha lateral aductora' },
  nordic: { en: 'Nordic curl', es: 'Curl nórdico' },
  legcurl: { en: 'Leg curl', es: 'Curl femoral' },
  legextension: { en: 'Leg extension', es: 'Extensión de cuádriceps' },
  soleus: { en: 'Seated soleus', es: 'Sóleo sentado' },
  tibialis: { en: 'Tibialis raise', es: 'Tibial anterior' },
  hacksquat: { en: 'Hack squat', es: 'Sentadilla hack' },
  legpress: { en: 'Leg press', es: 'Prensa de piernas' },
  hipthrust: { en: 'Hip thrust', es: 'Empuje de cadera' },
  pullthrough: { en: 'Cable pull-through', es: 'Jalón entre piernas' },
  kickback: { en: 'Glute kickback', es: 'Patada de glúteo' },
  abductor: { en: 'Hip abductor', es: 'Abductores' },
  adductor: { en: 'Hip adductor', es: 'Aductores' },
  bandwalk: { en: 'Band walk', es: 'Caminata con banda' },
  bench: { en: 'Bench press', es: 'Press banca' },
  chestfly: { en: 'Chest fly', es: 'Aperturas' },
  pullover: { en: 'Pullover', es: 'Pullover' },
  hspu: { en: 'Handstand push-up', es: 'Flexión vertical' },
  pushup: { en: 'Push-up', es: 'Flexión' },
  dip: { en: 'Dip', es: 'Fondos' },
  straightarm: { en: 'Straight-arm pulldown', es: 'Jalón brazos rectos' },
  pullup: { en: 'Pull-up', es: 'Dominada' },
  row: { en: 'Row', es: 'Remo' },
  uprightrow: { en: 'Upright row', es: 'Remo al mentón' },
  facepull: { en: 'Face pull', es: 'Jalón a la cara' },
  pullapart: { en: 'Band pull-apart', es: 'Aperturas con banda' },
  externalrotation: { en: 'External rotation', es: 'Rotación externa' },
  frontraise: { en: 'Front raise', es: 'Elevación frontal' },
  overhead: { en: 'Overhead press', es: 'Press militar' },
  landmine: { en: 'Landmine press', es: 'Press landmine' },
  lateral: { en: 'Lateral raise', es: 'Elevación lateral' },
  shrug: { en: 'Shrug', es: 'Encogimientos' },
  curl: { en: 'Curl', es: 'Curl de bíceps' },
  tricep: { en: 'Triceps', es: 'Tríceps' },
  pallof: { en: 'Pallof press', es: 'Press Pallof' },
  cablecrunch: { en: 'Cable crunch', es: 'Crunch en polea' },
  plank: { en: 'Plank / core', es: 'Plancha / core' },
  abwheel: { en: 'Ab wheel', es: 'Rueda abdominal' },
  woodchop: { en: 'Woodchop', es: 'Leñador' },
  hangingraise: { en: 'Hanging raise', es: 'Elevación colgado' },
  backext: { en: 'Back extension', es: 'Extensión de espalda' },
  reversehyper: { en: 'Reverse hyper', es: 'Hiperextensión invertida' },
  carry: { en: 'Loaded carry', es: 'Paseo del granjero' },
  sled: { en: 'Sled push', es: 'Trineo' },
  swing: { en: 'Kettlebell swing', es: 'Balanceo con pesa rusa' },
  clean: { en: 'Power clean', es: 'Cargada' },
  turkish: { en: 'Turkish get-up', es: 'Levantada turca' },
  thruster: { en: 'Thruster', es: 'Thruster' },
  medball: { en: 'Med ball slam', es: 'Slam con balón' },
  battlerope: { en: 'Battle ropes', es: 'Cuerda de batalla' },
  jumprope: { en: 'Jump rope', es: 'Cuerda para saltar' },
  boxjump: { en: 'Box jump', es: 'Salto al cajón' },
  snatch: { en: 'Snatch', es: 'Arrancada' },
  jerk: { en: 'Jerk', es: 'Envión' },
  muscleup: { en: 'Muscle-up', es: 'Muscle-up' },
  burpee: { en: 'Burpee', es: 'Burpee' },
  mountainclimber: { en: 'Mountain climber', es: 'Escaladores' },
  rower: { en: 'Row erg', es: 'Remoergómetro' },
  airbike: { en: 'Air bike', es: 'Bici de aire' },
  run: { en: 'Run / cardio', es: 'Correr / cardio' },
  mobility: { en: 'Mobility', es: 'Movilidad' },
  forearm: { en: 'Forearm / grip', es: 'Antebrazo / agarre' },
  situp: { en: 'Sit-up', es: 'Sit-up' },
  bearcrawl: { en: 'Bear crawl', es: 'Caminata del oso' },
  skierg: { en: 'SkiErg', es: 'SkiErg' },
  superman: { en: 'Superman', es: 'Superman' },
  devilpress: { en: 'Devil press', es: 'Devil press' },
  clamshell: { en: 'Clamshell', es: 'Almeja' },
  birddog: { en: 'Bird dog', es: 'Perro de caza' },
  deadbug: { en: 'Dead bug', es: 'Bicho muerto' },
  wallsit: { en: 'Wall sit', es: 'Sentadilla en pared' },
  anklecircle: { en: 'Ankle circles', es: 'Círculos de tobillo' },
};
