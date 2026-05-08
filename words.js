// ============================================================
// WORD DATA
// ============================================================

// WORDLE WORD LISTS
// -----------------
// Two lists: "answers" (words that can be the secret word) and
// "valid" (additional words the player can type as guesses).
// Keeping them separate means the answer is always a common,
// well-known word, while we still accept obscure guesses.

const WORDLE_ANSWERS = [
  'about','above','abuse','actor','acute','admit','adopt','adult','after','again',
  'agent','agree','ahead','alarm','album','alert','alien','align','alive','alley',
  'allow','alone','along','alter','among','angel','anger','angle','angry','anime',
  'ankle','apart','apple','apply','arena','argue','arise','armor','array','arrow',
  'aside','asset','atlas','avoid','awake','award','aware','badly','baker','basic',
  'basin','basis','batch','beach','beard','beast','begin','being','below','bench',
  'bible','birth','black','blade','blame','blank','blast','blaze','bleed','blend',
  'bless','blind','block','blood','bloom','blown','board','bonus','booth','bound',
  'brain','brand','brave','bread','break','breed','brick','bride','brief','bring',
  'broad','broke','brook','brown','brush','buddy','build','built','bunch','burst',
  'buyer','cabin','cable','camel','candy','cargo','carry','catch','cause','chain',
  'chair','chaos','charm','chart','chase','cheap','check','cheek','cheer','chess',
  'chest','chief','child','china','choir','chunk','civil','claim','clash','class',
  'clean','clear','clerk','click','cliff','climb','cling','clock','clone','close',
  'cloud','coach','coast','color','comet','comic','coral','couch','could','count',
  'court','cover','crack','craft','crane','crash','crazy','cream','crime','crown',
  'cruel','crush','curve','cycle','daily','dance','datum','dealt','decay','debut',
  'delay','dense','depth','derby','devil','dirty','donor','doubt','dough','draft',
  'drain','drama','drank','drawn','dream','dress','drift','drill','drink','drive',
  'drown','dying','eager','early','earth','eight','elect','elite','email','empty',
  'enemy','enjoy','enter','entry','equal','error','essay','event','every','exact',
  'exile','exist','extra','faint','faith','false','fancy','fatal','fault','feast',
  'fence','fever','fiber','field','fifth','fifty','fight','final','first','flame',
  'flash','fleet','flesh','float','flood','floor','flora','flour','fluid','flush',
  'focus','force','forge','forth','forum','found','frame','frank','fraud','fresh',
  'front','fruit','fully','funny','genre','ghost','giant','given','glass','globe',
  'gloom','glory','glove','grace','grade','grain','grand','grant','grape','grasp',
  'grass','grave','great','green','greet','grief','grill','grind','groan','gross',
  'group','grove','grown','guard','guess','guide','guilt','given','happy','harsh',
  'hasn','haven','heart','heavy','hence','herbs','hobby','honey','honor','horse',
  'hotel','house','human','humor','hurry','ideal','image','imply','index','indie',
  'inner','input','irony','ivory','jewel','joint','joker','judge','juice','juicy',
  'knife','knock','known','label','labor','large','laser','later','laugh','layer',
  'learn','least','leave','legal','lemon','level','light','limit','linen','liver',
  'local','lodge','logic','login','loose','lover','lower','loyal','lucky','lunch',
  'magic','major','maker','manor','maple','march','marry','match','mayor','media',
  'mercy','merit','metal','meter','midst','might','minor','minus','miracle','mixed',
  'model','money','month','moral','motor','mount','mouse','mouth','movie','music',
  'naked','nerve','never','night','noble','noise','north','noted','novel','nurse',
  'nylon','occur','ocean','offer','olive','onset','opera','orbit','order','organ',
  'other','outer','ocean','owner','oxide','ozone','paint','panel','panic','patch',
  'pause','peace','peach','pearl','penny','phase','phone','photo','piano','piece',
  'pilot','pitch','pixel','pizza','place','plain','plane','plant','plate','plaza',
  'plead','pluck','point','polar','pound','power','press','price','pride','prime',
  'prince','print','prior','prize','probe','prone','proof','prose','proud','prove',
  'pulse','punch','pupil','queen','query','quest','queue','quick','quiet','quota',
  'quote','radar','radio','raise','rally','range','rapid','ratio','reach','react',
  'realm','rebel','refer','reign','relax','reply','rider','ridge','rifle','right',
  'rigid','rival','river','robot','rocky','roman','rouge','rough','round','route',
  'royal','rugby','ruler','rural','saint','salad','sauce','scale','scare','scene',
  'scope','score','sense','serve','seven','shade','shaft','shake','shall','shame',
  'shape','share','shark','sharp','sheep','sheer','sheet','shelf','shell','shift',
  'shirt','shock','shore','short','shout','sight','since','sixth','sixty','sized',
  'skill','skull','slash','slave','sleep','slice','slide','slope','smart','smell',
  'smile','smoke','snake','solar','solid','solve','sorry','sound','south','space',
  'spare','spark','speak','speed','spend','spice','spine','spite','split','spoke',
  'spoon','sport','spray','squad','stack','staff','stage','stain','stake','stale',
  'stall','stamp','stand','stare','stark','start','state','stays','steal','steam',
  'steel','steep','steer','stick','stiff','still','stock','stone','stood','store',
  'storm','story','stove','stuff','style','sugar','suite','sunny','super','surge',
  'swamp','swear','sweep','sweet','swept','swift','swing','sword','swore','sworn',
  'syrup','table','taste','teach','teeth','thank','theme','there','thick','thing',
  'think','third','thorn','those','three','threw','throw','thumb','tiger','tight',
  'timer','tired','title','toast','today','token','tooth','topic','total','touch',
  'tough','towel','tower','toxic','trace','track','trade','trail','train','trait',
  'trash','treat','trend','trial','tribe','trick','tried','troop','truck','truly',
  'trump','trunk','trust','truth','tumor','twice','twist','ultra','uncle','under',
  'union','unite','unity','until','upper','upset','urban','usage','usual','utter',
  'valid','value','valve','vault','venue','verse','video','vigor','vinyl','virus',
  'visit','vital','vivid','vocal','voice','voter','wagon','waste','watch','water',
  'weary','weave','wedge','weigh','weird','wheat','wheel','where','which','while',
  'white','whole','whose','widow','width','witch','woman','woods','world','worry',
  'worst','worth','would','wound','wrist','write','wrong','wrote','yacht','young',
  'youth','zebra'
];

// Additional valid guesses (player can type these, but they won't be chosen as answers)
const WORDLE_VALID_GUESSES = new Set([
  ...WORDLE_ANSWERS,
  'aahed','aalii','abaci','aback','abaft','abash','abate','abbey','abbot','abhor',
  'abide','abode','abort','abyss','acorn','acrid','adage','added','adder','adept',
  'admin','adore','adorn','aegis','afoot','afoul','agave','agate','agile','aging',
  'aglow','agony','algae','alibi','allot','alloy','aloft','alpha','altar','amass',
  'amaze','amber','amble','amend','amine','amino','amiss','among','ample','amuse',
  'annex','annoy','anvil','aorta','aphid','aping','apnea','appro','apron','aptly',
  'arbor','ardor','areal','atoll','atone','attic','augur','aunty','avian','await',
  'awash','axial','axiom','azure','badge','bagel','baggy','banal','banjo','barge',
  'baron','bases','basil','baste','baton','bayou','beady','beefy','began','beige',
  'belle','belly','berth','berry','bevel','billy','bingo','biome','birch','blare',
  'bleat','blimp','bliss','blitz','bloat','bloke','blond','bluff','blunt','blurt',
  'blush','bogus','booty','booze','borax','borne','bosom','bossy','botch','bough',
  'bowel','brace','braid','brash','brass','brawn','braze','bride','brine','brink',
  'brisk','broom','broth','budge','buggy','bulge','bulky','bully','bunch','burly',
  'burnt','bylaw','cabal','cache','caddy','cadet','cagey','cairn','cameo','canal',
  'canon','caper','carat','cargo','caste','caulk','cedar','chafe','chaff','chalk',
  'champ','chant','chaps','chard','chewy','chick','chide','chili','chimp','chirp',
  'chose','chute','cider','cigar','cinch','circa','clack','clamp','clang','clank',
  'clasp','caulk','cleft','clerk','clink','cloak','clung','clout','clown','cobra',
  'cocoa','comma','conch','corgi','could','coupe','coven','covet','coyly','cramp',
  'crank','crass','crate','crave','crawl','creak','credo','creek','creep','crest',
  'crimp','crisp','croak','crock','crone','crony','cross','crowd','crude','cruet',
  'crumb','cubic','cumin','curly','curry','demon','denim','dense','depot','detox',
  'deuce','diner','dingy','diode','dirge','disco','ditto','dodge','doing','dolly',
  'donor','donut','doper','dorky','dowdy','dowel','dried','drily','drive','droit',
  'droit','drone','drool','droop','drove','dunce','duple','dwarf','dwell','dwelt',
  'eager','easel','eaten','eater','ebony','edict','eerie','egret','eight','elfin',
  'elope','elude','elves','ember','emcee','emoji','emote','enact','ended','endow',
  'enema','ensue','envoy','epoch','equip','erode','erupt','essay','ether','evade',
  'evict','evoke','exact','exalt','excel','exert','expat','expel','exude','exult',
  'fable','facet','fairy','faker','farce','fatly','fatty','fauna','feign','feint',
  'fella','felon','femur','ferry','fetal','fetch','fetid','fetus','fibre','filmy',
  'filth','finch','fishy','fitly','fixer','fizzy','fjord','flack','flail','flair',
  'flaky','flank','flare','flaxy','fleas','fleck','fling','flint','flock','flora',
  'floss','flout','flown','fluff','fluke','flung','flunk','flux','foamy','foggy',
  'folly','foray','forge','forgo','forte','found','foxes','foyer','frail','fraud',
  'freak','freed','friar','fried','frill','frisk','fritz','frizz','frock','froze',
  'frugal','fugal','fungi','funky','furry','gamma','gaudy','gauge','gauze','gavel',
  'gawky','geeky','giddy','girth','gizmo','gland','glare','gleam','glean','glide',
  'glint','gloat','glyph','gnarly','gnash','gnome','golem','goose','gorge','gouge',
  'gourd','grace','graph','grasp','grate','gravel','graze','grief','grime','grimy',
  'gripe','grits','groin','groom','grope','grove','growl','gruel','gruff','grunt',
  'guava','guild','guise','gulch','gummy','guppy','gusto','gusty','gypsy','habit',
  'haiku','haste','hasty','hatch','haunt','haven','havoc','hazel','heady','heath',
  'heave','hefty','heist','helix','herbs','heron','hippo','hitch','hoard','hobby',
  'holly','homer','horde','horny','hover','howdy','hubby','huffy','hulky','humid',
  'humps','humus','hunch','hunky','hurls','husky','hyena','hyper','idiom','idler',
  'igloo','image','imbue','impel','incur','inert','infer','ingot','inlet','inter',
  'irate','ivory','jaunt','jazzy','jelly','jerky','jewel','jiffy','jimmy','jolly',
  'joust','juice','jumbo','jumpy','juror','karma','kayak','kebab','khaki','kinky',
  'kiosk','knack','knead','kneel','knelt','knoll','known','koala','kudos','llama',
  'latch','lathe','latte','ledge','leech','lefty','leggy','lemma','lemur','lever',
  'lilac','limbo','lingo','lofty','login','loopy','lotus','lousy','lucid','lunge',
  'lusty','lyric','macho','macro','mafia','mange','mango','mania','manor','marsh',
  'mason','maxim','mealy','melee','melon','messy','micro','mimic','mince','mirth',
  'miser','misty','mocha','mogul','moist','moldy','mommy','moose','moral','morph',
  'mossy','motel','motif','motto','mourn','mousy','mover','mucus','muddy','mulch',
  'mummy','mural','murky','mushy','musty','nacho','naive','nanny','nasal','nasty',
  'naval','nerdy','newly','nicer','nifty','ninny','nitty','noisy','notch','nutty',
  'nymph','oaken','oasis','offal','omega','onion','optic','orbit','orcas','organ',
  'otter','ought','ounce','outdo','ovary','ovoid','owing','oxide','paddy','pagan',
  'panda','pansy','papal','parka','parry','parse','party','pasta','paste','pasty',
  'patio','patsy','patty','payee','penal','pence','peppy','perch','peril','perky',
  'pesky','pesto','petal','petty','piety','piggy','pilot','pinch','pinky','pinto',
  'pious','pithy','pivot','plaid','plait','plank','plaza','pleat','plied','plier',
  'plumb','plume','plump','plunk','plush','poach','poker','polar','polka','polyp',
  'pooch','poppy','porch','poser','posit','posse','potty','pouty','prank','prawn',
  'preen','primp','prism','privy','prong','proxy','prude','prune','psalm','pudgy',
  'puppy','puree','pushy','putty','pygmy','qualm','quart','quasi','quash','quasi',
  'queen','queer','quell','query','quirk','quota','rabbi','rabid','racer','radar',
  'radii','radon','ramen','ranch','randy','raven','rayon','razor','rebus','rebut',
  'recap','redux','reedy','refit','regal','rehab','reign','relax','renal','repay',
  'repel','rerun','retry','revel','rigid','rigor','rinse','risky','rival','river',
  'robin','rocky','rodeo','rouge','rowdy','royal','ruddy','rumba','rupee','rusty',
  'savor','savvy','scald','scalp','scant','scarf','scary','scone','scoop','scoot',
  'scorn','scout','scowl','scram','scrap','scrub','sedan','seize','serve','setup',
  'seven','shack','shady','shake','shaky','shale','shank','shawl','shiny','shire',
  'shrub','shrug','shunt','silly','since','sinew','sissy','skate','sketchy','skimp',
  'skirt','skull','skunk','slack','slain','slang','slant','slash','sleek','sleet',
  'slept','slimy','sling','slink','sloop','slosh','sloth','slump','slung','slunk',
  'slurp','smack','small','smart','smear','smelt','smirk','smite','smith','smock',
  'snack','snail','snare','snarl','sneak','sneer','snide','sniff','snipe','snoop',
  'snore','snort','snout','snowy','snuck','soapy','sonic','spade','spank','spool',
  'spout','sprig','spurt','squat','squid','staid','stair','stalk','stamp','stank',
  'stash','stead','steak','steel','steer','stern','sting','stink','stint','stoic',
  'stoke','stomp','stony','stool','stoop','stork','stout','strap','stray','strip',
  'strut','stuck','study','stump','stung','stunk','stunt','surge','swank','swath',
  'sweat','swell','swine','swipe','swirl','swoon','tabby','taboo','tacit','taffy',
  'taint','taker','talon','tamed','tangy','tapir','tardy','tarot','taunt','tawny',
  'tepee','tepid','their','theta','thick','thief','thigh','tidal','tiger','tipsy',
  'titan','toast','toddy','token','tonic','topaz','torso','totem','trout','tubal',
  'tulip','tumor','tuner','tunic','tuple','tutor','twang','tweed','twerk','twine',
  'twirl','tycoon','udder','ulcer','ultra','unbox','uncap','uncle','uncut','undid',
  'undue','unfed','unfit','unify','union','unite','unity','unlit','unmet','unpin',
  'unset','untie','until','unwed','unzip','upper','usher','using','usurp','utile',
  'utter','valet','valid','valve','vapid','vault','vaunt','vegan','venue','verge',
  'verse','vicar','vigor','viper','visor','vista','vivid','vixen','vodka','vogue',
  'voila','vouch','vowel','wacky','waddle','wager','wagon','waist','waltz','warty',
  'watch','water','waver','weary','wedge','weedy','wheat','whack','whale','wharf',
  'wheat','wheel','where','which','while','whine','whirl','whisk','whole','widen',
  'widow','wield','windy','witch','witty','woken','woozy','wordy','world','wrath',
  'wreak','wring','wrist','xenon','yacht','yearn','yeast','yield','young','youth',
  'zappy','zebra','zesty','zippy','zloty','zonal'
]);

// ============================================================
// CONNECTIONS PUZZLE DATA
// ============================================================
// Each puzzle has 4 groups. Each group has:
//   - name: the category
//   - words: the 4 words that belong to it
//   - difficulty: 0-3 (yellow, green, blue, purple)
//
// Difficulty determines the reveal color and hints at how
// tricky the connection is to find.

const CONNECTIONS_PUZZLES = [
  {
    id: 1,
    groups: [
      { name: 'Fruits', words: ['APPLE', 'MANGO', 'PEACH', 'GRAPE'], difficulty: 0 },
      { name: 'Card games', words: ['POKER', 'BRIDGE', 'HEARTS', 'SPADES'], difficulty: 1 },
      { name: 'Things that are round', words: ['GLOBE', 'WHEEL', 'CLOCK', 'PEARL'], difficulty: 2 },
      { name: '___ tree', words: ['PALM', 'FAMILY', 'DECISION', 'PINE'], difficulty: 3 }
    ]
  },
  {
    id: 2,
    groups: [
      { name: 'Kitchen utensils', words: ['WHISK', 'LADLE', 'TONGS', 'SPATULA'], difficulty: 0 },
      { name: 'Shades of blue', words: ['NAVY', 'AZURE', 'COBALT', 'TEAL'], difficulty: 1 },
      { name: 'Dance styles', words: ['WALTZ', 'SALSA', 'TANGO', 'SWING'], difficulty: 2 },
      { name: 'Double ___', words: ['DUTCH', 'AGENT', 'CHECK', 'VISION'], difficulty: 3 }
    ]
  },
  {
    id: 3,
    groups: [
      { name: 'Dog breeds', words: ['POODLE', 'BOXER', 'HUSKY', 'COLLIE'], difficulty: 0 },
      { name: 'Planets', words: ['VENUS', 'MARS', 'SATURN', 'PLUTO'], difficulty: 1 },
      { name: 'Music genres', words: ['JAZZ', 'BLUES', 'METAL', 'PUNK'], difficulty: 2 },
      { name: 'Also a fabric', words: ['SILK', 'DENIM', 'JERSEY', 'COTTON'], difficulty: 3 }
    ]
  },
  {
    id: 4,
    groups: [
      { name: 'Body parts', words: ['ELBOW', 'ANKLE', 'WRIST', 'KNEE'], difficulty: 0 },
      { name: 'Weather', words: ['THUNDER', 'BREEZE', 'FROST', 'HAIL'], difficulty: 1 },
      { name: 'Board games', words: ['CHESS', 'RISK', 'CLUE', 'SORRY'], difficulty: 2 },
      { name: 'Starts with a silent letter', words: ['KNIGHT', 'PSALM', 'GNOME', 'WRECK'], difficulty: 3 }
    ]
  },
  {
    id: 5,
    groups: [
      { name: 'Breakfast foods', words: ['WAFFLE', 'BAGEL', 'CEREAL', 'TOAST'], difficulty: 0 },
      { name: 'Ocean creatures', words: ['SHARK', 'SQUID', 'CORAL', 'WHALE'], difficulty: 1 },
      { name: 'Units of measurement', words: ['METER', 'POUND', 'GALLON', 'KELVIN'], difficulty: 2 },
      { name: 'Words before "house"', words: ['WARE', 'GREEN', 'FIRE', 'LIGHT'], difficulty: 3 }
    ]
  },
  {
    id: 6,
    groups: [
      { name: 'Vegetables', words: ['ONION', 'CARROT', 'PEPPER', 'CELERY'], difficulty: 0 },
      { name: 'Currencies', words: ['DOLLAR', 'FRANC', 'CROWN', 'POUND'], difficulty: 1 },
      { name: 'Types of jacket', words: ['BLAZER', 'PARKA', 'BOMBER', 'DENIM'], difficulty: 2 },
      { name: 'Words that follow "fire"', words: ['WORK', 'PLACE', 'TRUCK', 'FLY'], difficulty: 3 }
    ]
  },
  {
    id: 7,
    groups: [
      { name: 'Colors', words: ['SCARLET', 'AMBER', 'IVORY', 'VIOLET'], difficulty: 0 },
      { name: 'Gemstones', words: ['RUBY', 'OPAL', 'TOPAZ', 'PEARL'], difficulty: 1 },
      { name: 'Pasta shapes', words: ['PENNE', 'RIGATONI', 'FUSILLI', 'ORZO'], difficulty: 2 },
      { name: 'Also a name', words: ['GRACE', 'CHASE', 'HUNTER', 'BROOK'], difficulty: 3 }
    ]
  },
  {
    id: 8,
    groups: [
      { name: 'Footwear', words: ['SANDAL', 'BOOT', 'LOAFER', 'CLOG'], difficulty: 0 },
      { name: 'Parts of a book', words: ['SPINE', 'CHAPTER', 'INDEX', 'COVER'], difficulty: 1 },
      { name: 'Things with keys', words: ['PIANO', 'LAPTOP', 'LOCK', 'MAP'], difficulty: 2 },
      { name: 'Words after "back"', words: ['FIRE', 'BONE', 'TRACK', 'YARD'], difficulty: 3 }
    ]
  },
  {
    id: 9,
    groups: [
      { name: 'Steal', words: ['SWIPE', 'LIFT', 'PINCH', 'NICK'], difficulty: 0 },
      { name: 'Small amount', words: ['DASH', 'DROP', 'TOUCH', 'HINT'], difficulty: 1 },
      { name: '___ light', words: ['FLASH', 'LIME', 'HIGH', 'STOP'], difficulty: 2 },
      { name: 'Cocktails', words: ['GIMLET', 'SLING', 'JULEP', 'FIZZ'], difficulty: 3 }
    ]
  },
  {
    id: 10,
    groups: [
      { name: 'Trust as real', words: ['ACCEPT', 'BELIEVE', 'BUY', 'SWALLOW'], difficulty: 0 },
      { name: 'Power issues', words: ['OUTAGE', 'SHORT', 'SPIKE', 'SURGE'], difficulty: 1 },
      { name: 'Summary', words: ['ABSTRACT', 'BRIEF', 'DIGEST', 'OUTLINE'], difficulty: 2 },
      { name: 'Sounds like a first name', words: ['CURT', 'HAIRY', 'KNEEL', 'WANE'], difficulty: 3 }
    ]
  },
  {
    id: 11,
    groups: [
      { name: 'Old saying', words: ['ADAGE', 'CHESTNUT', 'MAXIM', 'SAW'], difficulty: 0 },
      { name: 'Fuel for grilling', words: ['CHARCOAL', 'ELECTRIC', 'GAS', 'WOOD'], difficulty: 1 },
      { name: 'Also a tree', words: ['ASH', 'CHERRY', 'EBONY', 'GUM'], difficulty: 2 },
      { name: 'Hot tub parts', words: ['FILTER', 'HEATER', 'JET', 'PUMP'], difficulty: 3 }
    ]
  },
  {
    id: 12,
    groups: [
      { name: 'Deplete', words: ['DRAIN', 'EMPTY', 'EXHAUST', 'SAP'], difficulty: 0 },
      { name: 'Play music with passion', words: ['GROOVE', 'JAM', 'ROCK', 'SHRED'], difficulty: 1 },
      { name: 'On a restaurant receipt', words: ['SIGNATURE', 'TAX', 'TIP', 'TOTAL'], difficulty: 2 },
      { name: 'Forms of sugar', words: ['CUBE', 'GRAIN', 'POWDER', 'SYRUP'], difficulty: 3 }
    ]
  },
  {
    id: 13,
    groups: [
      { name: 'Reward from hard work', words: ['FRUIT', 'RETURN', 'REWARD', 'YIELD'], difficulty: 0 },
      { name: 'Types of bagels', words: ['EGG', 'EVERYTHING', 'PLAIN', 'POPPY'], difficulty: 1 },
      { name: 'Contribute to a movie', words: ['ACT', 'DIRECT', 'PRODUCE', 'WRITE'], difficulty: 2 },
      { name: 'Start of a classic monster', words: ['FRANK', 'MUM', 'VAMP', 'WERE'], difficulty: 3 }
    ]
  },
  {
    id: 14,
    groups: [
      { name: 'Embodiment', words: ['EXAMPLE', 'IDEAL', 'MODEL', 'SYMBOL'], difficulty: 0 },
      { name: 'Related to trains', words: ['CAR', 'CONDUCTOR', 'STATION', 'TRACK'], difficulty: 1 },
      { name: 'Electric ___', words: ['CHAIR', 'EEL', 'FENCE', 'SLIDE'], difficulty: 2 },
      { name: 'Ear___', words: ['DRUM', 'MARK', 'WAX', 'WIG'], difficulty: 3 }
    ]
  },
  {
    id: 15,
    groups: [
      { name: 'Effortless', words: ['FLUID', 'GRACEFUL', 'NATURAL', 'SMOOTH'], difficulty: 0 },
      { name: 'Exertion', words: ['EFFORT', 'LABOR', 'SWEAT', 'WORK'], difficulty: 1 },
      { name: 'Energy for a device', words: ['BATTERY', 'CHARGE', 'JUICE', 'POWER'], difficulty: 2 },
      { name: 'What "pop" might mean', words: ['BURST', 'DAD', 'MAINSTREAM', 'SODA'], difficulty: 3 }
    ]
  },
  {
    id: 16,
    groups: [
      { name: 'Slang for head', words: ['COCONUT', 'CROWN', 'DOME', 'NOGGIN'], difficulty: 0 },
      { name: 'Palindromes', words: ['KAYAK', 'LEVEL', 'CIVIC', 'RADAR'], difficulty: 1 },
      { name: 'TV police procedurals', words: ['BONES', 'CASTLE', 'MONK', 'COLUMBO'], difficulty: 2 },
      { name: 'First in a comedy duo', words: ['ABBOTT', 'KEY', 'LAUREL', 'PENN'], difficulty: 3 }
    ]
  },
  {
    id: 17,
    groups: [
      { name: 'Yellow-brown shades', words: ['BEIGE', 'CAMEL', 'KHAKI', 'TAN'], difficulty: 0 },
      { name: 'Fail to attend', words: ['CUT', 'DITCH', 'MISS', 'SKIP'], difficulty: 1 },
      { name: 'Decisive victory', words: ['BLOWOUT', 'ROMP', 'ROUT', 'SWEEP'], difficulty: 2 },
      { name: '___ wheel', words: ['CHEESE', 'COLOR', 'HAMSTER', 'PRAYER'], difficulty: 3 }
    ]
  },
  {
    id: 18,
    groups: [
      { name: 'Sanctuary', words: ['HAVEN', 'PORT', 'RETREAT', 'SHELTER'], difficulty: 0 },
      { name: 'Football gear', words: ['CLEATS', 'HELMET', 'JERSEY', 'PADS'], difficulty: 1 },
      { name: 'Candy brands', words: ['CHARMS', 'KINDER', 'WONKA', 'YORK'], difficulty: 2 },
      { name: 'Free ___', words: ['BIRD', 'FALL', 'SOLO', 'WILLY'], difficulty: 3 }
    ]
  }
];
