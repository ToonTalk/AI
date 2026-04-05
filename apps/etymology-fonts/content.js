/* Etymology Fonts — content.js */
(function () {
  'use strict';
  if (window.__etymologyFontsLoaded) return;
  window.__etymologyFontsLoaded = true;

  /* =====================================================================
     WORD AGE DATABASE
     Approximate year each word first appeared in English.
     Sources: OED, etymonline.com, scholarly word-dating research.
     ===================================================================== */
  const WORD_AGES = {
    /* ── ERA 1: Pre-900 AD  (Old English / Proto-Germanic core) ─────────── */
    the:700,a:700,an:700,and:700,or:700,but:700,if:700,be:700,is:700,was:700,
    are:700,were:700,have:700,had:700,do:700,did:700,can:700,could:700,will:700,
    would:700,shall:700,should:700,may:700,might:700,must:700,to:700,of:700,
    in:700,on:700,at:700,by:700,for:700,with:700,from:700,as:700,it:700,he:700,
    she:700,we:700,they:700,i:700,you:700,me:700,him:700,her:700,us:700,them:700,
    my:700,his:700,its:700,our:700,your:700,their:700,this:700,that:700,
    these:700,those:700,what:700,which:700,who:700,how:700,when:700,where:700,
    why:700,all:700,one:700,two:700,three:700,four:700,five:700,six:700,
    seven:700,eight:700,nine:700,ten:700,not:700,no:700,yes:700,up:700,down:700,
    out:700,old:700,new:700,man:700,woman:700,child:700,father:700,mother:700,
    brother:700,sister:700,hand:700,foot:700,eye:700,ear:700,nose:700,mouth:700,
    head:700,heart:700,arm:700,leg:700,back:700,neck:700,water:700,fire:700,
    earth:700,wood:700,stone:700,sun:700,moon:700,star:700,sky:700,wind:700,
    rain:700,snow:700,day:700,night:700,time:700,year:700,life:700,death:700,
    name:700,word:700,home:700,house:700,door:700,road:700,tree:700,fish:700,
    bird:700,dog:700,cat:700,cow:700,horse:700,sheep:700,pig:700,hen:700,
    blood:700,bone:700,skin:700,eat:700,drink:700,sleep:700,walk:700,run:700,
    come:700,go:700,see:700,hear:700,feel:700,know:700,think:700,love:700,
    hate:700,make:700,take:700,give:700,get:700,put:700,stand:700,sit:700,
    fall:700,grow:700,live:700,die:700,call:700,help:700,hold:700,turn:700,
    begin:700,end:700,look:700,speak:700,say:700,tell:700,ask:700,try:700,
    keep:700,let:700,need:700,start:700,good:700,bad:700,big:700,small:700,
    long:700,short:700,high:700,low:700,hot:700,cold:700,hard:700,soft:700,
    fast:700,slow:700,light:700,dark:700,white:700,black:700,red:700,green:700,
    blue:700,yellow:700,first:700,last:700,next:700,over:700,under:700,
    after:700,before:700,here:700,there:700,now:700,then:700,still:700,yet:700,
    both:700,each:700,some:700,any:700,other:700,more:700,most:700,such:700,
    even:700,much:700,well:700,also:700,just:700,than:700,into:700,only:700,
    like:700,so:700,very:700,through:700,than:700,own:700,same:700,
    same:700,work:700,play:700,read:700,write:700,move:700,show:700,
    floor:700,wall:700,roof:700,gate:700,bridge:700,hill:700,field:700,
    gold:700,iron:700,bread:700,milk:700,meat:700,beer:700,town:700,
    true:700,free:700,wise:700,strong:700,bold:700,glad:700,folk:700,
    friend:700,song:700,dream:700,storm:700,frost:700,fog:700,sea:700,
    land:700,lake:700,brook:700,oak:700,ash:700,elm:700,nut:700,worm:700,
    fly:700,bee:700,mouse:700,wolf:700,bear:700,deer:700,fox:700,
    left:700,right:700,north:700,south:700,east:700,west:700,
    self:700,thing:700,way:700,place:700,part:700,world:700,
    though:700,while:700,among:700,within:700,without:700,between:700,
    along:700,around:700,upon:700,below:700,above:700,behind:700,
    together:700,never:700,ever:700,always:700,often:700,away:700,
    already:700,almost:700,again:700,often:700,far:700,near:700,
    indeed:700,enough:700,soon:700,late:700,early:700,full:700,half:700,
    whole:700,open:700,shut:700,few:700,many:700,great:700,little:700,

    /* ── ERA 2: 900–1200 AD  (Late Old English / Early Middle English) ──── */
    battle:1000,castle:1050,army:1000,war:900,peace:950,king:900,queen:900,
    knight:1000,lord:900,lady:900,sword:900,shield:900,crown:1000,throne:1050,
    guard:1000,enemy:1000,nation:1100,church:900,priest:900,faith:1000,soul:900,
    heaven:900,hell:900,angel:950,devil:900,sin:900,mercy:1050,glory:1050,
    honor:1050,silver:900,trade:1050,market:1050,wine:900,table:1050,
    tower:1050,river:950,valley:1000,garden:1050,fruit:1050,flower:1050,
    story:1050,book:900,letter:1050,sorrow:900,joy:1050,anger:1100,fear:900,
    hope:900,kind:900,strong:900,weak:950,holy:900,dead:900,alive:950,
    poor:950,rich:1100,clean:900,cruel:1150,wild:900,tame:950,loud:950,
    gentle:1050,false:1050,proud:1050,brave:1100,cruel:1150,honest:1100,
    servant:1100,master:1050,daughter:900,son:700,wife:700,husband:900,
    sailor:1100,hunter:950,miller:950,shepherd:900,farmer:900,baker:950,
    winter:700,summer:700,spring:900,autumn:1100,harvest:900,
    garden:1050,flower:1050,root:900,seed:900,fruit:1050,branch:1050,
    river:950,shore:1000,cliff:1000,cave:1050,sand:900,mud:1050,
    wool:900,cloth:900,thread:900,needle:900,loom:900,silk:1100,

    /* ── ERA 3: 1200–1400 AD  (Middle English, French/Latin influx) ──────── */
    adventure:1300,beauty:1300,color:1300,comfort:1300,company:1300,
    courage:1300,danger:1300,desire:1300,grace:1250,grant:1250,horror:1300,
    image:1300,innocent:1350,island:1300,journey:1300,judge:1250,justice:1300,
    labor:1350,language:1300,liberty:1375,manner:1300,noble:1300,obey:1350,
    opinion:1380,pain:1250,perfect:1350,person:1300,pleasure:1375,point:1300,
    prince:1300,prison:1250,protect:1375,pure:1350,question:1350,reason:1250,
    remember:1375,royal:1350,scene:1375,secret:1350,service:1250,simple:1300,
    soldier:1300,strange:1300,suffer:1300,tender:1350,trouble:1300,virtue:1340,
    vision:1300,voice:1300,wonder:1200,wealth:1250,valor:1375,ancient:1380,
    common:1300,certain:1300,change:1300,charge:1300,choice:1300,clear:1300,
    close:1300,course:1300,cover:1300,create:1375,custom:1300,damage:1300,
    degree:1350,demand:1350,divide:1375,effort:1375,employ:1375,estate:1350,
    event:1375,example:1380,face:1300,force:1300,form:1300,fortune:1350,
    govern:1300,human:1380,interest:1380,issue:1375,large:1300,measure:1300,
    member:1300,message:1375,moment:1375,nature:1340,number:1300,object:1380,
    order:1250,party:1375,pass:1300,power:1300,present:1300,proper:1350,
    purpose:1350,receive:1350,remain:1380,rich:1200,round:1300,sense:1380,
    spirit:1300,state:1350,suit:1375,treat:1375,trial:1350,use:1300,
    usual:1375,value:1380,various:1380,view:1375,visit:1375,subject:1375,
    uncle:1250,truth:900,type:1375,repair:1375,public:1375,province:1375,
    minute:1380,mere:1300,method:1380,large:1300,ground:1200,fortune:1350,
    final:1380,special:1350,single:1300,section:1300,scene:1375,ready:1200,
    promise:1350,produce:1380,possible:1380,noble:1300,nature:1340,motion:1375,
    moral:1380,moment:1375,matter:1250,mercy:1050,major:1380,lord:900,
    honor:1050,human:1380,humble:1350,house:700,history:1380,grief:1300,
    gentle:1050,general:1380,garden:1050,force:1300,famous:1380,false:1050,
    estate:1350,error:1380,equal:1380,empire:1380,emotion:1380,

    /* ── ERA 4: 1400–1600 AD  (Early Modern English, Renaissance) ─────────── */
    academy:1475,accurate:1540,adapt:1530,analyze:1580,attitude:1580,
    capacity:1450,circumstance:1450,civil:1450,colony:1540,commerce:1540,
    concept:1550,conflict:1460,contribute:1560,control:1450,debate:1400,
    define:1450,describe:1530,design:1580,discipline:1450,discover:1530,
    discuss:1560,dominant:1550,drama:1515,economy:1530,education:1530,
    effect:1450,examine:1450,exhibit:1450,expand:1560,experience:1450,
    explain:1450,explore:1560,express:1450,factor:1460,focus:1580,
    function:1530,generate:1560,indicate:1560,individual:1520,influence:1560,
    initial:1530,intellectual:1450,involve:1530,major:1450,military:1470,
    modern:1500,multiple:1450,physical:1490,policy:1450,possible:1450,
    potential:1540,practice:1450,principal:1450,process:1470,project:1530,
    prove:1300,provide:1450,publish:1430,relate:1530,rely:1560,require:1450,
    respond:1530,review:1460,role:1530,select:1560,significant:1580,
    similar:1560,source:1450,specific:1530,structure:1530,task:1530,
    theory:1550,transfer:1450,universal:1450,version:1580,volume:1450,
    visible:1480,unique:1560,survey:1540,support:1450,suggest:1530,
    stress:1450,status:1530,statement:1540,standard:1450,solution:1540,
    section:1530,resource:1540,region:1530,reduce:1460,realize:1520,
    proportion:1450,principal:1450,produce:1460,prime:1450,pressure:1450,
    precise:1550,original:1450,maintain:1470,legal:1490,identify:1570,
    global:1590,external:1540,essential:1500,entire:1490,emerge:1570,
    effort:1375,efficient:1580,document:1450,domestic:1520,direct:1450,
    distinct:1470,consider:1450,complex:1560,compare:1540,comment:1540,
    challenge:1480,central:1530,capital:1450,brief:1450,balance:1450,
    affect:1450,achieve:1580,abstract:1540,

    /* ── ERA 5: 1600–1800 AD  (Scientific Revolution, Enlightenment) ───────── */
    analysis:1580,anatomy:1540,atmosphere:1640,bacteria:1780,biology:1802,
    chemistry:1600,circulation:1620,coefficient:1710,cosmos:1650,data:1640,
    diameter:1570,dynamics:1780,electricity:1650,element:1600,energy:1807,
    equation:1570,evolution:1650,experiment:1600,formula:1640,friction:1700,
    galaxy:1690,geometry:1570,gravity:1640,hypothesis:1640,latitude:1600,
    longitude:1600,microscope:1650,molecule:1790,nucleus:1750,objective:1620,
    orbit:1640,oxygen:1790,phenomenon:1660,physics:1590,radius:1650,
    revolution:1600,science:1340,scientific:1590,solar:1590,spectrum:1670,
    telescope:1610,temperature:1600,tension:1630,thermometer:1670,velocity:1680,
    vacuum:1640,rational:1640,empirical:1650,liberal:1640,constitution:1610,
    democracy:1574,republic:1600,parliament:1300,statistics:1770,
    taxonomy:1760,fossil:1728,geology:1735,chromosome:1888,protein:1838,
    carbon:1789,nitrogen:1790,hydrogen:1792,oxygen:1790,
    calculus:1666,algebra:1550,logarithm:1614,probability:1650,
    hypothesis:1640,mechanism:1680,momentum:1699,inertia:1690,
    particle:1560,atom:1600,molecule:1790,element:1600,compound:1530,
    catalyst:1835,reaction:1644,solution:1540,mixture:1530,
    revolution:1600,republic:1600,parliament:1300,senate:1300,

    /* ── ERA 6: 1800–1900 AD  (Industrial Revolution, Victorian era) ──────── */
    automobile:1885,aviation:1866,bicycle:1869,capitalism:1850,communism:1843,
    detective:1843,dinosaur:1842,feminist:1895,locomotive:1829,magazine:1731,
    newspaper:1667,photograph:1839,photography:1839,psychology:1840,
    railroad:1825,romanticism:1844,socialism:1837,telegram:1852,telephone:1876,
    vaccination:1800,vaccine:1800,vegetarian:1839,
    electromagnetic:1840,engineering:1800,petroleum:1526,gasoline:1865,
    microbe:1878,genetics:1905,hormone:1905,vitamin:1912,calorie:1865,
    carbohydrate:1869,antibiotic:1943,antiseptic:1876,anesthetic:1846,
    underground:1810,university:1362,electricity:1650,
    evolution:1832,fossil:1728,geology:1735,paleontology:1838,
    archaeology:1824,anthropology:1839,sociology:1843,economics:1792,
    typewriter:1868,phonograph:1877,telephone:1876,telegraph:1837,
    dynamite:1867,aspirin:1897,morphine:1828,caffeine:1820,
    algebra:1550,statistics:1770,probability:1650,theorem:1551,
    chloroform:1831,ether:1540,ozone:1840,nitrogen:1790,

    /* ── ERA 7: 1900–1960 AD  (Early modern technology) ─────────────────── */
    astronaut:1929,atomic:1901,bikini:1946,brainwash:1950,cartoon:1843,
    cinema:1909,clone:1959,computer:1945,documentary:1926,ecosystem:1935,
    electron:1891,film:1845,helicopter:1920,insulin:1922,laser:1960,
    microwave:1948,nylon:1938,pandemic:1666,penicillin:1929,plastic:1905,
    quantum:1900,radar:1941,robot:1920,semiconductor:1838,software:1958,
    transistor:1948,nuclear:1846,radioactive:1898,isotope:1913,
    relativity:1905,spaceship:1930,satellite:1936,television:1907,
    broadcast:1921,radio:1907,refrigerator:1611,airplane:1907,airport:1919,
    superhero:1917,antibiotic:1943,penicillin:1929,insulin:1922,
    nylon:1938,plastic:1905,acrylic:1936,polyester:1929,
    fission:1939,fusion:1909,neutron:1921,proton:1920,photon:1926,
    allergy:1906,hormone:1905,vitamin:1912,chromosome:1888,gene:1909,
    ecology:1873,ecosystem:1935,evolution:1832,mutation:1901,
    psychology:1840,psychiatry:1847,neurology:1843,therapy:1846,
    algorithm:1926,programming:1945,processor:1955,memory:1374,
    accelerator:1922,reactor:1945,uranium:1797,plutonium:1942,
    cybernetics:1948,bionics:1958,robotics:1941,aeronautics:1836,

    /* ── ERA 8: 1960–1990 AD  (Digital dawn, counterculture) ─────────────── */
    arcade:1970,awesome:1975,cellphone:1983,console:1960,database:1962,
    debug:1945,desktop:1963,digital:1938,disk:1946,download:1977,
    email:1978,gigabyte:1982,graphics:1965,hacker:1976,hardware:1947,
    interface:1962,internet:1974,keyboard:1946,laptop:1983,login:1963,
    microchip:1959,modem:1958,monitor:1540,network:1560,online:1950,
    pixel:1965,printer:1588,program:1633,protocol:1586,scanner:1960,
    server:1977,spreadsheet:1979,terminal:1440,upload:1980,video:1937,
    virtual:1460,byte:1956,bit:1948,cursor:1967,cyberspace:1982,
    glitch:1962,automation:1948,mainframe:1963,semiconductor:1838,
    megabyte:1970,kilobyte:1970,binary:1570,

    /* ── ERA 9: 1990–2010 AD  (World Wide Web, early social) ─────────────── */
    app:1988,avatar:1986,blog:1999,broadband:1992,browser:1993,
    cache:1988,chatroom:1994,clickbait:2006,cloud:1994,codec:1983,
    cookie:1994,emoji:1999,firewall:1990,google:1998,hashtag:2007,
    hotspot:2000,hyperlink:1988,inbox:1994,meme:1976,multimedia:1966,
    podcast:2004,popup:1997,router:1966,selfie:2002,smartphone:1997,
    spam:1978,startup:1976,streaming:1990,tablet:2002,tweet:2006,
    url:1992,username:1981,viral:1990,vlog:2002,wifi:1999,wiki:1995,
    texting:1994,lol:1989,photoshop:1989,googling:1998,unfriend:2003,
    webinar:1998,'e-commerce':1993,dotcom:1994,bandwidth:1930,malware:1990,
    phishing:1996,ransomware:1989,trojan:1982,worm:1982,

    /* ── ERA 10: 2010+ AD  (Social media, AI, crypto era) ───────────────── */
    bitcoin:2009,blockchain:2008,chatbot:2016,deepfake:2017,
    drone:2010,esports:2000,fintech:2012,influencer:2015,
    livestream:2011,metaverse:2021,nft:2014,cryptocurrency:2011,
    retweet:2009,vaping:2010,woke:2010,youtube:2005,tiktok:2016,
    instagram:2010,snapchat:2011,uber:2010,airbnb:2008,
    binge:2012,swipe:2012,ghosting:2015,catfish:2010,
    doomscrolling:2020,fomo:2004,gaslighting:2015,cancel:2015,
    deeplearning:2012,machinelearning:2005,chatgpt:2022,llm:2020,
    generative:1950,prompt:1489,multimodal:1990,transformer:1994,
  };

  /* ===================================================================
     ERA CONFIGURATION — fonts mapped to historical periods
     =================================================================== */
  const ERAS = [
    { max:900,  cls:'ef1', name:'Old English (pre-900)',        year:'before 900 AD' },
    { max:1200, cls:'ef2', name:'Late Old English (900–1200)',  year:'900–1200 AD' },
    { max:1400, cls:'ef3', name:'Middle English (1200–1400)',   year:'1200–1400 AD' },
    { max:1600, cls:'ef4', name:'Early Modern (1400–1600)',     year:'1400–1600 AD' },
    { max:1750, cls:'ef5', name:'Enlightenment (1600–1750)',    year:'1600–1750 AD' },
    { max:1850, cls:'ef6', name:'Industrial Era (1750–1850)',   year:'1750–1850 AD' },
    { max:1920, cls:'ef7', name:'Early Modern (1850–1920)',     year:'1850–1920 AD' },
    { max:1980, cls:'ef8', name:'Mid-Century (1920–1980)',      year:'1920–1980 AD' },
    { max:2010, cls:'ef9', name:'Digital Age (1980–2010)',      year:'1980–2010 AD' },
    { max:9999, cls:'ef10',name:'Contemporary (2010+)',         year:'2010 onwards' },
  ];

  function getEra(year) {
    for (const e of ERAS) if (year <= e.max) return e;
    return ERAS[ERAS.length - 1];
  }

  /* ===================================================================
     INJECT GOOGLE FONTS + CSS
     =================================================================== */
  const FONT_URL =
    'https://fonts.googleapis.com/css2?'
    + 'family=UnifrakturMaguntia'
    + '&family=IM+Fell+English:ital@0;1'
    + '&family=Cinzel'
    + '&family=Cormorant+Garamond:ital,wght@0,400;1,400'
    + '&family=Libre+Baskerville'
    + '&family=Playfair+Display:ital@0;1'
    + '&family=Merriweather'
    + '&family=Raleway'
    + '&family=Exo+2'
    + '&family=Orbitron'
    + '&display=swap';

  function injectFontsAndStyles() {
    if (document.getElementById('ef-font-link')) return;
    const link = document.createElement('link');
    link.id = 'ef-font-link';
    link.rel = 'stylesheet';
    link.href = FONT_URL;
    document.head.appendChild(link);

    const style = document.createElement('style');
    style.id = 'ef-styles';
    style.textContent = `
      .ef1 { font-family: 'UnifrakturMaguntia', cursive !important; }
      .ef2 { font-family: 'IM Fell English', serif !important; font-style: italic !important; }
      .ef3 { font-family: 'Cinzel', serif !important; letter-spacing: 0.03em !important; }
      .ef4 { font-family: 'Cormorant Garamond', serif !important; font-size: 1.05em !important; }
      .ef5 { font-family: 'Libre Baskerville', serif !important; }
      .ef6 { font-family: 'Playfair Display', serif !important; }
      .ef7 { font-family: 'Merriweather', serif !important; }
      .ef8 { font-family: 'Raleway', sans-serif !important; letter-spacing: 0.02em !important; }
      .ef9 { font-family: 'Exo 2', sans-serif !important; }
      .ef10{ font-family: 'Orbitron', sans-serif !important; font-size: 0.9em !important; letter-spacing: 0.04em !important; }

      [data-ef-year] { cursor: help; }
    `;
    document.head.appendChild(style);

    // JS floating tooltip — avoids overflow:hidden clipping that breaks ::after
    if (!document.getElementById('ef-tooltip')) {
      const tip = document.createElement('div');
      tip.id = 'ef-tooltip';
      tip.style.cssText = [
        'position:fixed','background:rgba(20,20,20,0.9)','color:#f0e8d0',
        'font-family:Georgia,serif','font-style:normal','font-size:12px',
        'font-weight:normal','letter-spacing:0','white-space:nowrap',
        'padding:4px 9px','border-radius:4px','pointer-events:none',
        'z-index:2147483647','opacity:0','transition:opacity 0.12s',
        'top:0','left:0',
      ].join('!important;') + '!important';
      document.body.appendChild(tip);

      document.addEventListener('mouseover', (e) => {
        const el = e.target.closest('[data-ef-year]');
        if (!el) return;
        tip.textContent = el.dataset.efLabel;
        tip.style.setProperty('opacity', '1', 'important');
      }, true);

      document.addEventListener('mousemove', (e) => {
        tip.style.setProperty('left', (e.clientX + 12) + 'px', 'important');
        tip.style.setProperty('top',  (e.clientY - 28) + 'px', 'important');
      }, true);

      document.addEventListener('mouseout', (e) => {
        if (e.target.closest('[data-ef-year]')) {
          tip.style.setProperty('opacity', '0', 'important');
        }
      }, true);
    }
  }

  /* ===================================================================
     SUFFIX HEURISTICS — guess era for unknown words
     =================================================================== */
  function guessYear(word) {
    const w = word.toLowerCase();
    // Very modern tech suffixes
    if (/(?:blockchain|crypto|bitcoin|nft|defi|dao|web3)/.test(w)) return 2010;
    if (/(?:ware|tech|bot|hack|app|net|byte|code|dev|git|api|sdk|ui|ux|ai)$/.test(w)) return 1990;
    if (/(?:phone|cast|stream|tube|gram|book|chat|snap|tok)$/.test(w)) return 2000;
    // Modern scientific endings
    if (/(?:ology|ometry|ometry|ics|tion|ment|ance|ence)$/.test(w) && w.length > 10) return 1700;
    // Old English patterns: common short OE words
    if (/^(un|be|for|out|over|under|with)/.test(w) && w.length < 8) return 750;
    return null;
  }

  /* ===================================================================
     DOM PROCESSING — wrap known words in styled spans
     =================================================================== */
  const SKIP_TAGS = new Set([
    'SCRIPT','STYLE','INPUT','TEXTAREA','SELECT','BUTTON',
    'CODE','PRE','KBD','VAR','SAMP','MATH','SVG','NOSCRIPT',
    'IFRAME','CANVAS','VIDEO','AUDIO','OBJECT','EMBED',
  ]);

  function processTextNode(node) {
    const text = node.nodeValue;
    if (!text || !text.trim()) return;

    // Split keeping word tokens vs non-word tokens
    const parts = text.split(/(\b[a-zA-Z]{2,}\b)/);
    if (parts.length <= 1) return;

    let hasChange = false;
    const frag = document.createDocumentFragment();

    for (const part of parts) {
      if (/^[a-zA-Z]{2,}$/.test(part)) {
        const lower = part.toLowerCase();
        let year = WORD_AGES[lower] ?? guessYear(part);
        if (year != null) {
          const era = getEra(year);
          const span = document.createElement('span');
          span.className = era.cls;
          span.dataset.efYear = year;
          span.dataset.efLabel = `${era.name} · ~${year} AD`;
          span.textContent = part;
          frag.appendChild(span);
          hasChange = true;
        } else {
          frag.appendChild(document.createTextNode(part));
        }
      } else {
        frag.appendChild(document.createTextNode(part));
      }
    }

    if (hasChange) {
      node.parentNode.replaceChild(frag, node);
    }
  }

  function walkDOM(root) {
    const walker = document.createTreeWalker(
      root,
      NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT,
      {
        acceptNode(node) {
          if (node.nodeType === Node.ELEMENT_NODE) {
            if (SKIP_TAGS.has(node.tagName)) return NodeFilter.FILTER_REJECT;
            if (node.isContentEditable) return NodeFilter.FILTER_REJECT;
            if (node.closest('[data-ef-year]')) return NodeFilter.FILTER_REJECT;
            return NodeFilter.FILTER_SKIP;
          }
          // Text node
          const p = node.parentElement;
          if (!p || SKIP_TAGS.has(p.tagName)) return NodeFilter.FILTER_REJECT;
          if (p.isContentEditable) return NodeFilter.FILTER_REJECT;
          return NodeFilter.FILTER_ACCEPT;
        }
      }
    );

    const textNodes = [];
    let n;
    while ((n = walker.nextNode())) textNodes.push(n);
    textNodes.forEach(processTextNode);
  }

  /* ===================================================================
     CHECK ENABLED STATE & INITIALISE
     =================================================================== */
  function init() {
    try {
      chrome.storage.local.get(['efEnabled'], (result) => {
        if (chrome.runtime.lastError) {
          // Storage unavailable — run anyway (default on)
          runExtension();
          return;
        }
        if (result.efEnabled !== false) runExtension();
      });
    } catch (e) {
      runExtension(); // fallback: storage API not available
    }
  }

  function runExtension() {
    try {
      injectFontsAndStyles();
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
          try { walkDOM(document.body); } catch(e) { console.warn('[EF]', e); }
        });
      } else {
        walkDOM(document.body);
      }
    } catch(e) {
      console.warn('[EtymologyFonts]', e);
    }
  }

  init();

  /* ===================================================================
     LISTEN FOR TOGGLE MESSAGES FROM POPUP
     =================================================================== */
  chrome.runtime.onMessage.addListener((msg, _sender, _sendResponse) => {
    if (msg.type === 'EF_TOGGLE') {
      if (msg.enabled) {
        runExtension();
      } else {
        document.querySelectorAll('[data-ef-year]').forEach(span => {
          span.replaceWith(document.createTextNode(span.textContent));
        });
        const s = document.getElementById('ef-styles');
        if (s) s.remove();
        const t = document.getElementById('ef-tooltip');
        if (t) t.remove();
      }
    }
    return false;
  });

})();
