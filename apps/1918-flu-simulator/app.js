const months = [
  "Jan 1918", "Feb 1918", "Mar 1918", "Apr 1918", "May 1918", "Jun 1918",
  "Jul 1918", "Aug 1918", "Sep 1918", "Oct 1918", "Nov 1918", "Dec 1918",
  "Jan 1919", "Feb 1919", "Mar 1919", "Apr 1919", "May 1919", "Jun 1919",
  "Jul 1919", "Aug 1919", "Sep 1919", "Oct 1919", "Nov 1919", "Dec 1919",
  "Jan 1920", "Feb 1920", "Mar 1920", "Apr 1920", "May 1920", "Jun 1920"
];

const sources = {
  cdc1918: {
    title: "CDC: 1918 Pandemic Influenza Historic Timeline",
    url: "https://www.cdc.gov/flu/pandemic-resources/1918-commemoration/1918-pandemic-history.htm",
    note: "Broad chronology, U.S. mortality, public-health context, pandemic waves, and the widely used figures of about 500 million infected and at least 50 million deaths worldwide."
  },
  naturalEarth: {
    title: "Natural Earth: public-domain world map data",
    url: "https://www.naturalearthdata.com/",
    note: "Public-domain 1:110m country boundary data used for the base map."
  },
  cdcOrigin: {
    title: "CDC Emerging Infectious Diseases: The Site of Origin of the 1918 Influenza Pandemic",
    url: "https://wwwnc.cdc.gov/eid/article/10/11/04-0415_article",
    note: "Reviews competing origin hypotheses and the limits of the evidence."
  },
  markel: {
    title: "JAMA: Nonpharmaceutical Interventions Implemented by US Cities During the 1918-1919 Influenza Pandemic",
    url: "https://jamanetwork.com/journals/jama/fullarticle/208354",
    note: "Historical evidence for school closures, gathering bans, isolation, quarantine, and timing."
  },
  barry: {
    title: "PNAS: Public Health Interventions and Epidemic Intensity During the 1918 Influenza Pandemic",
    url: "https://www.pnas.org/doi/10.1073/pnas.0610941104",
    note: "Finds that early, layered interventions were associated with lower peak mortality in U.S. cities."
  },
  johnsonMueller: {
    title: "Bulletin of the History of Medicine: Updating the Accounts, Global Mortality of the 1918-1920 Spanish Influenza Pandemic",
    url: "https://muse.jhu.edu/article/4826",
    note: "Widely cited global mortality estimate range and country-level historical uncertainty."
  },
  ourWorld: {
    title: "Our World in Data: Spanish flu",
    url: "https://ourworldindata.org/spanish-flu-largest-influenza-pandemic-in-history",
    note: "Accessible summary of global mortality, attack rates, and historical comparisons."
  },
  encyclopedia: {
    title: "Influenza Encyclopedia",
    url: "https://www.influenzaarchive.org/",
    note: "Digitized U.S. city records, public-health orders, newspaper material, and mortality data."
  },
  troopships: {
    title: "Imperial War Museums: Transport and Supply in the First World War",
    url: "https://www.iwm.org.uk/history/transport-and-supply-during-the-first-world-war",
    note: "Background on wartime movement systems and military logistics."
  },
  who: {
    title: "WHO: Ten things you need to know about pandemic influenza",
    url: "https://www.who.int/news-room/spotlight/history-of-vaccination/history-of-influenza-vaccination",
    note: "Background context on influenza pandemics and later vaccination history."
  }
};

const originHypotheses = {
  kansas: {
    label: "Kansas / Camp Funston",
    seedMonth: 2,
    seeds: [{ id: "funston", infected: 0.035 }, { id: "boston", infected: 0.006 }],
    summary: "One major hypothesis points to Haskell County, Kansas and nearby Camp Funston, where a large outbreak was reported in March 1918 before troops moved through U.S. camps and Atlantic ports.",
    sources: ["cdcOrigin", "cdc1918"]
  },
  etaples: {
    label: "Étaples / Western Front",
    seedMonth: 0,
    seeds: [{ id: "etaples", infected: 0.02 }, { id: "london", infected: 0.006 }],
    summary: "Another hypothesis emphasizes the enormous British base at Étaples in northern France, where dense troop camps, hospitals, animals, and rail connections created conditions for respiratory disease before 1918.",
    sources: ["cdcOrigin", "troopships"]
  },
  china: {
    label: "Northern China / labor routes",
    seedMonth: 0,
    seeds: [{ id: "beijing", infected: 0.018 }, { id: "shanghai", infected: 0.008 }],
    summary: "A debated hypothesis links earlier outbreaks in northern China with wartime labor recruitment and movement through ports and rail corridors. The evidence is suggestive but incomplete.",
    sources: ["cdcOrigin", "johnsonMueller"]
  }
};

const nodes = [
  {
    id: "funston", name: "Camp Funston", country: "United States", region: "North America",
    lat: 39.1, lon: -96.8, population: 0.45, contact: 1.35, fatality: 0.008,
    historical: "Large U.S. Army camp outbreak reported in March 1918; the U.S. pandemic death toll is usually given as about 675,000.",
    countryData: "United States: about 675,000 deaths; many U.S. city records are available.",
    sources: ["cdc1918", "cdcOrigin", "encyclopedia"]
  },
  {
    id: "boston", name: "Boston", country: "United States", region: "North America",
    lat: 42.36, lon: -71.06, population: 1.6, contact: 1.08, fatality: 0.007,
    historical: "Boston and nearby military facilities were important Atlantic nodes in 1918 spread.",
    countryData: "United States: city mortality records and intervention timelines are unusually well documented.",
    sources: ["cdc1918", "markel", "encyclopedia"]
  },
  {
    id: "newyork", name: "New York", country: "United States", region: "North America",
    lat: 40.71, lon: -74.0, population: 6.0, contact: 1.12, fatality: 0.007,
    historical: "A major port and rail hub with extensive wartime and civilian movement.",
    countryData: "United States: about 675,000 deaths; New York had large but comparatively managed urban outbreaks.",
    sources: ["markel", "barry", "encyclopedia"]
  },
  {
    id: "london", name: "London", country: "United Kingdom", region: "Europe",
    lat: 51.5, lon: -0.12, population: 7.4, contact: 1.1, fatality: 0.011,
    historical: "Britain experienced three waves, with severe mortality in autumn 1918 and early 1919.",
    countryData: "United Kingdom: roughly 200,000-plus deaths are commonly cited, with regional variation.",
    sources: ["johnsonMueller", "ourWorld"]
  },
  {
    id: "etaples", name: "Étaples", country: "France", region: "Europe",
    lat: 50.52, lon: 1.64, population: 0.9, contact: 1.45, fatality: 0.012,
    historical: "A vast British military camp and hospital complex in northern France; central to one origin hypothesis.",
    countryData: "France: estimates are uncertain, often in the hundreds of thousands for the wider pandemic period.",
    sources: ["cdcOrigin", "troopships"]
  },
  {
    id: "brest", name: "Brest", country: "France", region: "Europe",
    lat: 48.39, lon: -4.49, population: 0.9, contact: 1.25, fatality: 0.012,
    historical: "A major port for American Expeditionary Forces arriving in France.",
    countryData: "France: wartime disruption makes national influenza data difficult to compare.",
    sources: ["troopships", "cdc1918"]
  },
  {
    id: "madrid", name: "Madrid", country: "Spain", region: "Europe",
    lat: 40.42, lon: -3.7, population: 1.3, contact: 1.02, fatality: 0.011,
    historical: "Spain was neutral and uncensored reports helped give the pandemic its misleading name.",
    countryData: "Spain: about 250,000 to 300,000 deaths are often cited.",
    sources: ["ourWorld", "johnsonMueller"]
  },
  {
    id: "berlin", name: "Berlin", country: "Germany", region: "Europe",
    lat: 52.52, lon: 13.4, population: 4.2, contact: 1.08, fatality: 0.012,
    historical: "Germany faced outbreaks amid wartime food stress, troop movement, and censorship.",
    countryData: "Germany: national estimates vary widely because wartime mortality records are hard to isolate.",
    sources: ["johnsonMueller", "ourWorld"]
  },
  {
    id: "petrograd", name: "Petrograd", country: "Russia", region: "Europe/Asia",
    lat: 59.93, lon: 30.33, population: 2.4, contact: 1.15, fatality: 0.017,
    historical: "Revolution, civil conflict, rail disruption, and hunger make Russian pandemic data especially uncertain.",
    countryData: "Russia: historical influenza mortality is highly uncertain.",
    sources: ["johnsonMueller"]
  },
  {
    id: "cairo", name: "Cairo", country: "Egypt", region: "Africa",
    lat: 30.04, lon: 31.24, population: 1.5, contact: 1.07, fatality: 0.018,
    historical: "A military and transport node connecting the Mediterranean, Suez Canal, and imperial routes.",
    countryData: "Egypt: data are fragmentary, but Suez-linked movement made the region strategically important.",
    sources: ["troopships", "johnsonMueller"]
  },
  {
    id: "freetown", name: "Freetown", country: "Sierra Leone", region: "Africa",
    lat: 8.48, lon: -13.23, population: 0.28, contact: 1.06, fatality: 0.025,
    historical: "West African ports were important coaling and shipping nodes; imported outbreaks could move inland.",
    countryData: "West Africa: mortality data are patchy, with severe local outbreaks in many colonies.",
    sources: ["johnsonMueller"]
  },
  {
    id: "capetown", name: "Cape Town", country: "South Africa", region: "Africa",
    lat: -33.92, lon: 18.42, population: 1.7, contact: 1.08, fatality: 0.035,
    historical: "South Africa suffered one of the best documented severe national epidemics in Africa.",
    countryData: "South Africa: roughly 300,000 deaths are often cited.",
    sources: ["johnsonMueller", "ourWorld"]
  },
  {
    id: "bombay", name: "Bombay", country: "India", region: "Asia",
    lat: 19.08, lon: 72.88, population: 9.0, contact: 1.2, fatality: 0.055,
    historical: "India suffered catastrophic mortality, likely more than any other country.",
    countryData: "India: estimates commonly range from about 12 million to 17 million deaths.",
    sources: ["johnsonMueller", "ourWorld"]
  },
  {
    id: "calcutta", name: "Calcutta", country: "India", region: "Asia",
    lat: 22.57, lon: 88.36, population: 7.5, contact: 1.17, fatality: 0.052,
    historical: "Rail and port connections helped spread influenza across British India.",
    countryData: "India: mortality was amplified by poverty, crowding, drought, and uneven medical access.",
    sources: ["johnsonMueller", "ourWorld"]
  },
  {
    id: "beijing", name: "Beijing", country: "China", region: "Asia",
    lat: 39.9, lon: 116.4, population: 3.2, contact: 1.1, fatality: 0.018,
    historical: "Northern China appears in one origin hypothesis, but records are incomplete and debated.",
    countryData: "China: mortality estimates are uncertain and contested.",
    sources: ["cdcOrigin", "johnsonMueller"]
  },
  {
    id: "shanghai", name: "Shanghai", country: "China", region: "Asia",
    lat: 31.23, lon: 121.47, population: 3.4, contact: 1.13, fatality: 0.016,
    historical: "A major port linking East Asia, labor routes, and international shipping.",
    countryData: "China: local records exist, but national pandemic estimates remain uncertain.",
    sources: ["cdcOrigin", "johnsonMueller"]
  },
  {
    id: "tokyo", name: "Tokyo", country: "Japan", region: "Asia",
    lat: 35.68, lon: 139.76, population: 5.8, contact: 1.09, fatality: 0.014,
    historical: "Japan experienced large waves with well developed public reporting compared with many countries.",
    countryData: "Japan: hundreds of thousands of deaths are usually cited; estimates vary by definition.",
    sources: ["johnsonMueller", "ourWorld"]
  },
  {
    id: "manila", name: "Manila", country: "Philippines", region: "Asia",
    lat: 14.6, lon: 120.98, population: 1.2, contact: 1.1, fatality: 0.02,
    historical: "A Pacific military and shipping hub under U.S. colonial rule.",
    countryData: "Philippines: historical data are incomplete; port cities show the role of maritime spread.",
    sources: ["johnsonMueller"]
  },
  {
    id: "sydney", name: "Sydney", country: "Australia", region: "Oceania",
    lat: -33.86, lon: 151.21, population: 2.4, contact: 0.96, fatality: 0.008,
    historical: "Australia used maritime quarantine and saw its major wave later than many countries.",
    countryData: "Australia: about 12,000 deaths are commonly cited.",
    sources: ["ourWorld", "johnsonMueller"]
  },
  {
    id: "auckland", name: "Auckland", country: "New Zealand", region: "Oceania",
    lat: -36.85, lon: 174.76, population: 0.55, contact: 1.02, fatality: 0.012,
    historical: "New Zealand's 1918 outbreak was fast and severe, especially for Maori communities.",
    countryData: "New Zealand: about 8,600 deaths are commonly cited.",
    sources: ["johnsonMueller", "ourWorld"]
  },
  {
    id: "rio", name: "Rio de Janeiro", country: "Brazil", region: "South America",
    lat: -22.91, lon: -43.17, population: 2.2, contact: 1.08, fatality: 0.015,
    historical: "Brazilian ports connected South America to Atlantic shipping and imported waves.",
    countryData: "Brazil: estimates vary; urban records document severe outbreaks.",
    sources: ["johnsonMueller"]
  },
  {
    id: "buenosaires", name: "Buenos Aires", country: "Argentina", region: "South America",
    lat: -34.6, lon: -58.38, population: 2.3, contact: 1.04, fatality: 0.011,
    historical: "South Atlantic shipping connected Argentina to Europe, Brazil, and North America.",
    countryData: "Argentina: national estimates are uncertain but urban records show multiple waves.",
    sources: ["johnsonMueller"]
  }
];

const routes = [
  { id: "funston-boston", from: "funston", to: "boston", mode: "rail", name: "U.S. camp-to-port rail", baseFlow: 0.72, warFlow: 1.55, laterFlow: 1.65, start: 2, end: 17, bidirectional: true, warSensitive: true, summary: "U.S. rail movement linked army camps to eastern ports.", sources: ["cdc1918", "troopships"] },
  { id: "funston-newyork", from: "funston", to: "newyork", mode: "rail", name: "U.S. troop rail corridor", baseFlow: 0.68, warFlow: 1.5, laterFlow: 1.6, start: 2, end: 17, bidirectional: true, warSensitive: true, summary: "Railroads carried recruits, discharged soldiers, and wartime workers.", sources: ["cdc1918", "troopships"] },
  { id: "boston-brest", from: "boston", to: "brest", mode: "troopship", name: "Atlantic troopship route", baseFlow: 0.4, warFlow: 1.8, laterFlow: 2.05, start: 3, end: 17, bidirectional: true, warSensitive: true, summary: "Crowded troopships and ports connected North America to France.", sources: ["cdc1918", "troopships"] },
  { id: "newyork-brest", from: "newyork", to: "brest", mode: "troopship", name: "New York to Brest troopships", baseFlow: 0.55, warFlow: 1.9, laterFlow: 2.1, start: 3, end: 17, bidirectional: true, warSensitive: true, summary: "Brest was a major landing point for American forces.", sources: ["cdc1918", "troopships"] },
  { id: "brest-etaples", from: "brest", to: "etaples", mode: "rail", name: "French rail to the front", baseFlow: 0.58, warFlow: 1.65, laterFlow: 1.9, start: 0, end: 17, bidirectional: true, warSensitive: true, summary: "Rail moved soldiers, patients, supplies, and workers through France.", sources: ["troopships"] },
  { id: "etaples-london", from: "etaples", to: "london", mode: "troopship", name: "Channel military movement", baseFlow: 0.5, warFlow: 1.65, laterFlow: 1.8, start: 0, end: 17, bidirectional: true, warSensitive: true, summary: "The Channel linked British camps, hospitals, ports, and the Western Front.", sources: ["cdcOrigin", "troopships"] },
  { id: "london-madrid", from: "london", to: "madrid", mode: "ship", name: "European civilian and diplomatic routes", baseFlow: 0.38, warFlow: 0.8, laterFlow: 0.85, start: 0, end: 17, bidirectional: true, warSensitive: false, summary: "Neutral Spain reported outbreaks openly, while many belligerents censored wartime news.", sources: ["ourWorld"] },
  { id: "london-berlin", from: "london", to: "berlin", mode: "rail", name: "European rail network", baseFlow: 0.32, warFlow: 0.75, laterFlow: 0.85, start: 0, end: 17, bidirectional: true, warSensitive: true, summary: "War reduced some civilian movement but intensified military rail movement near fronts.", sources: ["troopships"] },
  { id: "berlin-petrograd", from: "berlin", to: "petrograd", mode: "rail", name: "Eastern Europe rail movement", baseFlow: 0.26, warFlow: 0.85, laterFlow: 0.95, start: 0, end: 17, bidirectional: true, warSensitive: true, summary: "Railways were essential but disrupted by war, revolution, and shortages.", sources: ["johnsonMueller"] },
  { id: "london-cairo", from: "london", to: "cairo", mode: "ship", name: "Mediterranean and Suez route", baseFlow: 0.38, warFlow: 1.25, laterFlow: 1.4, start: 0, end: 17, bidirectional: true, warSensitive: true, summary: "The Suez route connected Europe, Africa, and Asia.", sources: ["troopships"] },
  { id: "cairo-bombay", from: "cairo", to: "bombay", mode: "ship", name: "Suez to India route", baseFlow: 0.48, warFlow: 1.45, laterFlow: 1.65, start: 0, end: 17, bidirectional: true, warSensitive: true, summary: "Imperial shipping and troop routes tied Britain, Egypt, and India together.", sources: ["troopships", "johnsonMueller"] },
  { id: "bombay-calcutta", from: "bombay", to: "calcutta", mode: "rail", name: "Indian rail network", baseFlow: 0.75, warFlow: 1.15, laterFlow: 1.2, start: 0, end: 17, bidirectional: true, warSensitive: false, summary: "Dense rail corridors helped move influenza across the subcontinent.", sources: ["johnsonMueller", "ourWorld"] },
  { id: "calcutta-shanghai", from: "calcutta", to: "shanghai", mode: "ship", name: "Bay of Bengal to China Sea", baseFlow: 0.36, warFlow: 0.95, laterFlow: 1.05, start: 0, end: 17, bidirectional: true, warSensitive: false, summary: "Asian port networks moved people, mail, goods, and infections.", sources: ["johnsonMueller"] },
  { id: "beijing-shanghai", from: "beijing", to: "shanghai", mode: "rail", name: "Chinese rail and coastal links", baseFlow: 0.48, warFlow: 0.95, laterFlow: 1.05, start: 0, end: 17, bidirectional: true, warSensitive: false, summary: "Regional movement is central to the China-origin hypothesis, but evidence is incomplete.", sources: ["cdcOrigin"] },
  { id: "shanghai-etaples", from: "shanghai", to: "etaples", mode: "labor", name: "Chinese Labour Corps route", baseFlow: 0.12, warFlow: 1.5, laterFlow: 1.7, start: 0, end: 14, bidirectional: false, warSensitive: true, summary: "Chinese labor recruitment moved workers toward Allied war zones through long rail and sea routes.", sources: ["cdcOrigin", "troopships"] },
  { id: "shanghai-tokyo", from: "shanghai", to: "tokyo", mode: "ship", name: "East Asia shipping", baseFlow: 0.42, warFlow: 0.95, laterFlow: 1, start: 0, end: 17, bidirectional: true, warSensitive: false, summary: "Commercial shipping connected East Asian ports.", sources: ["johnsonMueller"] },
  { id: "shanghai-manila", from: "shanghai", to: "manila", mode: "ship", name: "China Sea shipping", baseFlow: 0.34, warFlow: 0.9, laterFlow: 0.95, start: 0, end: 17, bidirectional: true, warSensitive: false, summary: "Pacific port routes carried passengers, sailors, colonial officials, and goods.", sources: ["johnsonMueller"] },
  { id: "manila-sydney", from: "manila", to: "sydney", mode: "ship", name: "Pacific shipping route", baseFlow: 0.25, warFlow: 0.75, laterFlow: 0.85, start: 0, end: 17, bidirectional: true, warSensitive: false, summary: "Maritime quarantine could delay island and continental outbreaks.", sources: ["ourWorld"] },
  { id: "sydney-auckland", from: "sydney", to: "auckland", mode: "ship", name: "Tasman shipping", baseFlow: 0.32, warFlow: 0.85, laterFlow: 0.95, start: 0, end: 17, bidirectional: true, warSensitive: false, summary: "New Zealand's outbreak highlights the importance of ships and timing.", sources: ["johnsonMueller", "ourWorld"] },
  { id: "london-freetown", from: "london", to: "freetown", mode: "ship", name: "West Africa shipping route", baseFlow: 0.3, warFlow: 0.9, laterFlow: 1, start: 0, end: 17, bidirectional: true, warSensitive: false, summary: "Imperial shipping linked European ports with West African coaling stations and ports.", sources: ["johnsonMueller"] },
  { id: "freetown-capetown", from: "freetown", to: "capetown", mode: "ship", name: "African Atlantic route", baseFlow: 0.24, warFlow: 0.8, laterFlow: 0.9, start: 0, end: 17, bidirectional: true, warSensitive: false, summary: "Coastal shipping connected port outbreaks along the African Atlantic.", sources: ["johnsonMueller"] },
  { id: "capetown-bombay", from: "capetown", to: "bombay", mode: "ship", name: "Indian Ocean route", baseFlow: 0.22, warFlow: 0.85, laterFlow: 0.95, start: 0, end: 17, bidirectional: true, warSensitive: false, summary: "Indian Ocean movement connected southern Africa, India, and beyond.", sources: ["johnsonMueller"] },
  { id: "newyork-rio", from: "newyork", to: "rio", mode: "ship", name: "Atlantic Americas route", baseFlow: 0.3, warFlow: 0.7, laterFlow: 0.75, start: 0, end: 17, bidirectional: true, warSensitive: false, summary: "Commercial shipping linked North and South Atlantic port cities.", sources: ["johnsonMueller"] },
  { id: "rio-buenosaires", from: "rio", to: "buenosaires", mode: "ship", name: "South Atlantic coastal route", baseFlow: 0.34, warFlow: 0.85, laterFlow: 0.9, start: 0, end: 17, bidirectional: true, warSensitive: false, summary: "Coastal shipping and rail helped move outbreaks through South America.", sources: ["johnsonMueller"] },
  { id: "buenosaires-madrid", from: "buenosaires", to: "madrid", mode: "ship", name: "South Atlantic to Europe", baseFlow: 0.26, warFlow: 0.65, laterFlow: 0.75, start: 0, end: 17, bidirectional: true, warSensitive: false, summary: "Neutral and civilian sea routes still mattered despite wartime disruption.", sources: ["johnsonMueller", "ourWorld"] }
];

const landMasses = [
  [[-168, 70], [-142, 72], [-112, 67], [-82, 58], [-60, 50], [-70, 25], [-86, 12], [-110, 18], [-126, 32], [-150, 50]],
  [[-82, 12], [-66, 10], [-48, -5], [-42, -24], [-55, -48], [-72, -54], [-80, -28]],
  [[-18, 35], [10, 70], [54, 70], [84, 58], [132, 56], [166, 46], [154, 24], [114, 18], [78, 8], [46, 26], [18, 34], [-8, 30]],
  [[-18, 32], [8, 36], [34, 30], [50, 10], [42, -18], [28, -34], [14, -35], [-4, -22], [-16, 4]],
  [[44, 28], [78, 28], [96, 8], [83, -4], [62, 6]],
  [[110, -10], [154, -12], [154, -38], [132, -44], [112, -32]],
  [[166, -34], [178, -38], [174, -46], [164, -44]]
];

const nodeById = Object.fromEntries(nodes.map((node) => [node.id, node]));
const routeById = Object.fromEntries(routes.map((route) => [route.id, route]));
const GLOBAL_DISPLAY_POPULATION = 1800;
const HISTORICAL_GLOBAL_CASES = 500;
const HISTORICAL_GLOBAL_DEATHS = 50;
const countryHistoricalData = {
  "United States of America": {
    name: "United States",
    deaths: "about 675,000 deaths",
    infections: "part of the global estimate of about 500 million infections",
    note: "The U.S. has unusually rich city-level records, including public-health orders and mortality data.",
    sources: ["cdc1918", "markel", "encyclopedia"]
  },
  "United States": {
    name: "United States",
    deaths: "about 675,000 deaths",
    infections: "part of the global estimate of about 500 million infections",
    note: "The U.S. has unusually rich city-level records, including public-health orders and mortality data.",
    sources: ["cdc1918", "markel", "encyclopedia"]
  },
  India: {
    name: "India",
    deaths: "commonly estimated at about 12 to 17 million deaths",
    infections: "very large share of global infections; exact national infection counts are uncertain",
    note: "India suffered catastrophic mortality, shaped by poverty, crowding, drought, and colonial-era medical access.",
    sources: ["johnsonMueller", "ourWorld"]
  },
  "United Kingdom": {
    name: "United Kingdom",
    deaths: "roughly 200,000-plus deaths are commonly cited",
    infections: "not precisely known",
    note: "Britain experienced multiple waves while still deeply entangled in wartime military movement.",
    sources: ["johnsonMueller", "ourWorld"]
  },
  France: {
    name: "France",
    deaths: "estimates vary, often in the hundreds of thousands",
    infections: "not precisely known",
    note: "Wartime disruption and front-line movement complicate national estimates.",
    sources: ["johnsonMueller", "cdcOrigin"]
  },
  Spain: {
    name: "Spain",
    deaths: "about 250,000 to 300,000 deaths are often cited",
    infections: "not precisely known",
    note: "Spain's neutral press reported openly, helping attach the misleading name Spanish flu.",
    sources: ["ourWorld", "johnsonMueller"]
  },
  Germany: {
    name: "Germany",
    deaths: "national estimates vary widely",
    infections: "not precisely known",
    note: "Food stress, censorship, and war losses make comparisons difficult.",
    sources: ["johnsonMueller", "ourWorld"]
  },
  China: {
    name: "China",
    deaths: "highly uncertain and contested",
    infections: "not precisely known",
    note: "Incomplete records are one reason the China-origin hypothesis remains debated.",
    sources: ["cdcOrigin", "johnsonMueller"]
  },
  Japan: {
    name: "Japan",
    deaths: "hundreds of thousands of deaths are usually cited",
    infections: "not precisely known",
    note: "Japan had comparatively developed reporting but estimates still vary by definition.",
    sources: ["johnsonMueller", "ourWorld"]
  },
  "South Africa": {
    name: "South Africa",
    deaths: "roughly 300,000 deaths are often cited",
    infections: "not precisely known",
    note: "One of the better documented severe national epidemics in Africa.",
    sources: ["johnsonMueller", "ourWorld"]
  },
  Australia: {
    name: "Australia",
    deaths: "about 12,000 deaths are commonly cited",
    infections: "not precisely known",
    note: "Maritime quarantine delayed Australia's major wave compared with many regions.",
    sources: ["ourWorld", "johnsonMueller"]
  },
  "New Zealand": {
    name: "New Zealand",
    deaths: "about 8,600 deaths are commonly cited",
    infections: "not precisely known",
    note: "The epidemic was fast and severe, especially for Maori communities.",
    sources: ["johnsonMueller", "ourWorld"]
  },
  Brazil: {
    name: "Brazil",
    deaths: "estimates vary; major urban outbreaks are documented",
    infections: "not precisely known",
    note: "Atlantic port cities connected Brazil to global shipping routes.",
    sources: ["johnsonMueller"]
  },
  Argentina: {
    name: "Argentina",
    deaths: "national estimates are uncertain",
    infections: "not precisely known",
    note: "Urban records show multiple waves connected to South Atlantic movement.",
    sources: ["johnsonMueller"]
  }
};
const canvas = document.getElementById("mapCanvas");
const ctx = canvas.getContext("2d");
const chartSvg = document.getElementById("chartSvg");

const controls = {
  playPauseButton: document.getElementById("playPauseButton"),
  playIcon: document.getElementById("playIcon"),
  restartButton: document.getElementById("restartButton"),
  timeSlider: document.getElementById("timeSlider"),
  speedControl: document.getElementById("speedControl"),
  dateLabel: document.getElementById("dateLabel"),
  waveLabel: document.getElementById("waveLabel"),
  originSelect: document.getElementById("originSelect"),
  warSelect: document.getElementById("warSelect"),
  policyTiming: document.getElementById("policyTiming"),
  policyStrength: document.getElementById("policyStrength"),
  portQuarantine: document.getElementById("portQuarantine"),
  schoolClosures: document.getElementById("schoolClosures"),
  maskUse: document.getElementById("maskUse"),
  travelAdvisory: document.getElementById("travelAdvisory"),
  metricsStrip: document.getElementById("metricsStrip"),
  detailTitle: document.getElementById("detailTitle"),
  detailBody: document.getElementById("detailBody"),
  sourcesButton: document.getElementById("sourcesButton"),
  sourcesPanel: document.getElementById("sourcesPanel"),
  sourceList: document.getElementById("sourceList"),
  showSusceptible: document.getElementById("showSusceptible"),
  showInfected: document.getElementById("showInfected"),
  showRecovered: document.getElementById("showRecovered"),
  showDeaths: document.getElementById("showDeaths"),
  showMonthlyDeaths: document.getElementById("showMonthlyDeaths"),
  apiKeyInput: document.getElementById("apiKeyInput"),
  modelInput: document.getElementById("modelInput"),
  allowWebSearch: document.getElementById("allowWebSearch"),
  questionInput: document.getElementById("questionInput"),
  askButton: document.getElementById("askButton"),
  clearAnswerButton: document.getElementById("clearAnswerButton"),
  answerBox: document.getElementById("answerBox")
};

const state = {
  playing: false,
  month: 0,
  speed: 1.5,
  sim: null,
  selected: { type: "origin", id: "kansas" },
  askHistory: [],
  lastTick: 0,
  lastFrameTick: 0,
  particlePhase: 0,
  width: 1200,
  height: 650
};

function readSettings() {
  return {
    origin: controls.originSelect.value,
    war: controls.warSelect.value,
    policyTiming: controls.policyTiming.value,
    policyStrength: Number(controls.policyStrength.value) / 100,
    portQuarantine: controls.portQuarantine.checked,
    schoolClosures: controls.schoolClosures.checked,
    maskUse: controls.maskUse.checked,
    travelAdvisory: controls.travelAdvisory.checked
  };
}

function waveForMonth(month) {
  if (month < 3) return { name: "Early reports and uncertainty", transmission: 0.48, mortality: 0.45, wave: 0 };
  if (month < 7) return { name: "Wave 1: spring 1918", transmission: 0.92, mortality: 0.62, wave: 1 };
  if (month < 12) return { name: "Wave 2: deadliest autumn 1918", transmission: 1.52, mortality: 1.85, wave: 2 };
  if (month < 17) return { name: "Wave 3: winter-spring 1919", transmission: 1.16, mortality: 1.18, wave: 3 };
  if (month < 21) return { name: "Lower summer tail", transmission: 0.46, mortality: 0.62, wave: 0 };
  if (month < 27) return { name: "Regional recurrences into 1920", transmission: 0.72, mortality: 0.78, wave: 4 };
  return { name: "Classroom run tail, not a hard stop", transmission: 0.38, mortality: 0.52, wave: 0 };
}

function policyMultiplier(settings, month) {
  const timingFactor = settings.policyTiming === "early" ? 1 : settings.policyTiming === "mixed" ? (month >= 6 ? 0.85 : 0.25) : (month >= 8 ? 0.72 : 0.08);
  let reduction = settings.policyStrength * 0.2 * timingFactor;
  if (settings.schoolClosures) reduction += 0.2 * timingFactor;
  if (settings.maskUse) reduction += 0.08 * timingFactor;
  return Math.max(0.48, 1 - reduction);
}

function routeMultiplier(route, settings, month) {
  if (month < route.start) return 0;
  const afterPlannedRoute = month > route.end;
  if (afterPlannedRoute && route.mode === "labor" && settings.war !== "laterWar") return 0;
  if (afterPlannedRoute && route.mode === "troopship" && settings.war !== "laterWar") return 0;
  let multiplier = route.baseFlow;
  if (settings.war === "historical") multiplier *= route.warSensitive ? (month <= 10 ? route.warFlow : 0.95) : 1;
  if (settings.war === "laterWar") multiplier *= route.warSensitive ? route.laterFlow : 1.05;
  if (settings.war === "noWar") multiplier *= route.warSensitive ? 0.22 : 1.1;
  if (afterPlannedRoute) multiplier *= settings.war === "laterWar" && route.warSensitive ? 0.9 : 0.42;
  if (settings.portQuarantine && ["ship", "troopship", "labor"].includes(route.mode)) multiplier *= 0.48;
  if (settings.travelAdvisory && route.mode !== "rail") multiplier *= 0.68;
  if (settings.travelAdvisory && route.mode === "rail" && !route.warSensitive) multiplier *= 0.82;
  return multiplier;
}

function rawSimulation(settings) {
  const current = {};
  nodes.forEach((node) => {
    current[node.id] = { S: node.population, I: 0, R: 0, D: 0 };
  });

  const history = [];
  const origin = originHypotheses[settings.origin];

  for (let month = 0; month < months.length; month += 1) {
    if (month === origin.seedMonth) {
      origin.seeds.forEach((seed) => {
        const cell = current[seed.id];
        const amount = Math.min(cell.S * 0.35, seed.infected);
        cell.S -= amount;
        cell.I += amount;
      });
    }

    history.push(snapshot(current, settings, month));
    if (month === months.length - 1) break;

    const wave = waveForMonth(month);
    const policy = policyMultiplier(settings, month);
    const crowding = settings.war === "noWar" ? 0.86 : settings.war === "laterWar" ? 1.08 : 1;
    const medicalLoad = settings.war === "noWar" ? 0.9 : settings.war === "laterWar" ? 1.08 : 1;
    const routePressure = Object.fromEntries(nodes.map((node) => [node.id, 0]));

    routes.forEach((route) => {
      const flow = routeMultiplier(route, settings, month);
      if (flow <= 0) return;
      addRoutePressure(route.from, route.to, flow);
      if (route.bidirectional) addRoutePressure(route.to, route.from, flow * 0.78);
    });

    function addRoutePressure(fromId, toId, flow) {
      const fromNode = nodeById[fromId];
      const fromCell = current[fromId];
      const sourceShare = fromCell.I / Math.max(fromNode.population, 0.001);
      routePressure[toId] += sourceShare * flow * 0.055;
    }

    const next = {};
    nodes.forEach((node) => {
      const cell = current[node.id];
      const populationAlive = Math.max(node.population - cell.D, 0.001);
      const localNew = 0.88 * wave.transmission * policy * crowding * node.contact * cell.I * (cell.S / populationAlive);
      const importedNew = routePressure[node.id] * cell.S;
      const newInfections = Math.min(cell.S, Math.max(0, localNew + importedNew), cell.S * 0.42);
      const recovered = Math.min(cell.I, cell.I * 0.64);
      const deaths = Math.min(newInfections * node.fatality * wave.mortality * medicalLoad, newInfections * 0.22);
      next[node.id] = {
        S: Math.max(0, cell.S - newInfections),
        I: Math.max(0, cell.I + newInfections - recovered - deaths),
        R: cell.R + recovered,
        D: cell.D + deaths
      };
    });
    Object.assign(current, next);
  }

  return history;
}

let referenceScale = null;

function getReferenceScale() {
  if (!referenceScale) {
    const reference = rawSimulation({
      origin: "kansas",
      war: "historical",
      policyTiming: "late",
      policyStrength: 0.35,
      portQuarantine: false,
      schoolClosures: false,
      maskUse: false,
      travelAdvisory: false
    });
    const final = reference[reference.length - 1].totals;
    referenceScale = {
      cases: HISTORICAL_GLOBAL_CASES / Math.max(final.cases, 0.001),
      deaths: HISTORICAL_GLOBAL_DEATHS / Math.max(final.D, 0.001)
    };
  }
  return referenceScale;
}

function runSimulation(settings) {
  const history = rawSimulation(settings);
  const scale = getReferenceScale();
  return history.map((frame) => {
    const displayNodes = {};
    nodes.forEach((node) => {
      const cell = frame.nodes[node.id];
      const displayCases = (cell.I + cell.R + cell.D) * scale.cases;
      const displayDeaths = cell.D * scale.deaths;
      const displayInfected = cell.I * scale.cases;
      const displayRecovered = Math.max(0, displayCases - displayInfected - displayDeaths);
      const displaySusceptible = Math.max(0, node.population * scale.cases * 0.55 - displayCases);
      displayNodes[node.id] = {
        S: displaySusceptible,
        I: displayInfected,
        R: displayRecovered,
        D: displayDeaths
      };
    });

    const displayCases = frame.totals.cases * scale.cases;
    const displayDeaths = frame.totals.D * scale.deaths;
    const displayInfected = frame.totals.I * scale.cases;
    const displayRecovered = Math.max(0, displayCases - displayInfected - displayDeaths);
    const displaySusceptible = Math.max(0, GLOBAL_DISPLAY_POPULATION - displayCases);
    return {
      ...frame,
      displayNodes,
      displayTotals: {
        S: displaySusceptible,
        I: displayInfected,
        R: displayRecovered,
        D: displayDeaths,
        cases: displayCases
      }
    };
  });
}

function snapshot(cells, settings, month) {
  const nodeStates = {};
  let totals = { S: 0, I: 0, R: 0, D: 0, cases: 0 };
  nodes.forEach((node) => {
    const cell = { ...cells[node.id] };
    nodeStates[node.id] = cell;
    totals.S += cell.S;
    totals.I += cell.I;
    totals.R += cell.R;
    totals.D += cell.D;
    totals.cases += cell.I + cell.R + cell.D;
  });
  const routeActivity = {};
  routes.forEach((route) => {
    const flow = routeMultiplier(route, settings, month);
    const from = nodeStates[route.from];
    const to = nodeStates[route.to];
    const fromShare = from.I / Math.max(nodeById[route.from].population, 0.001);
    const toShare = to.I / Math.max(nodeById[route.to].population, 0.001);
    routeActivity[route.id] = flow * (fromShare + (route.bidirectional ? toShare * 0.72 : 0));
  });
  return { month, nodes: nodeStates, totals, routeActivity, wave: waveForMonth(month) };
}

function resizeCanvas() {
  const rect = canvas.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  state.width = Math.max(320, rect.width);
  state.height = Math.max(320, rect.height);
  canvas.width = Math.floor(state.width * dpr);
  canvas.height = Math.floor(state.height * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  draw();
}

function project(lon, lat) {
  const padX = 32;
  const padY = 28;
  const x = padX + ((lon + 180) / 360) * (state.width - padX * 2);
  const y = padY + ((86 - lat) / 172) * (state.height - padY * 2);
  return { x, y };
}

function draw() {
  const frame = state.sim[state.month];
  ctx.clearRect(0, 0, state.width, state.height);
  drawOcean();
  drawLand();
  drawRoutes(frame);
  drawNodes(frame);
  drawMonthBanner(frame);
}

function drawOcean() {
  const gradient = ctx.createLinearGradient(0, 0, 0, state.height);
  gradient.addColorStop(0, "#d9eef3");
  gradient.addColorStop(1, "#cfe1e7");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, state.width, state.height);
  ctx.strokeStyle = "rgba(23, 32, 42, 0.12)";
  ctx.lineWidth = 1;
  for (let lon = -120; lon <= 120; lon += 60) {
    const a = project(lon, -70);
    const b = project(lon, 80);
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
  }
  for (let lat = -60; lat <= 60; lat += 30) {
    const a = project(-175, lat);
    const b = project(175, lat);
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
  }
}

function drawLand() {
  if (window.WORLD_COUNTRIES) {
    drawNaturalEarthCountries();
    return;
  }
  ctx.fillStyle = "#c9d7bf";
  ctx.strokeStyle = "rgba(23, 32, 42, 0.24)";
  ctx.lineWidth = 1.2;
  landMasses.forEach((land) => {
    ctx.beginPath();
    land.forEach(([lon, lat], index) => {
      const point = project(lon, lat);
      if (index === 0) ctx.moveTo(point.x, point.y);
      else ctx.lineTo(point.x, point.y);
    });
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  });
}

function drawNaturalEarthCountries() {
  const palette = ["#cbd8bf", "#d6d2b9", "#bfd4c8", "#d5c9b8", "#c3d2bc", "#c9d8d4", "#d6d7bf"];
  ctx.strokeStyle = "rgba(23, 32, 42, 0.18)";
  ctx.lineWidth = 0.75;
  window.WORLD_COUNTRIES.forEach((country, index) => {
    ctx.beginPath();
    country.polygons.forEach((polygon) => {
      polygon.forEach((ring) => {
        ring.forEach(([lon, lat], pointIndex) => {
          const point = project(lon, lat);
          if (pointIndex === 0) ctx.moveTo(point.x, point.y);
          else ctx.lineTo(point.x, point.y);
        });
        ctx.closePath();
      });
    });
    ctx.fillStyle = palette[((country.mapcolor || index) - 1) % palette.length];
    ctx.fill("evenodd");
    ctx.stroke();
  });
}

function routeColor(mode) {
  if (mode === "rail") return "#c9872b";
  if (mode === "labor") return "#6d5a9c";
  if (mode === "troopship") return "#1d6792";
  return "#2877a7";
}

function routeCurve(route) {
  const from = project(nodeById[route.from].lon, nodeById[route.from].lat);
  const to = project(nodeById[route.to].lon, nodeById[route.to].lat);
  const midX = (from.x + to.x) / 2;
  const midY = (from.y + to.y) / 2;
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const arc = Math.min(115, Math.max(28, Math.hypot(dx, dy) * 0.14));
  const control = { x: midX - dy * 0.08, y: midY + dx * 0.08 - arc };
  return { from, to, control };
}

function bezier(curve, t) {
  const x = (1 - t) ** 2 * curve.from.x + 2 * (1 - t) * t * curve.control.x + t ** 2 * curve.to.x;
  const y = (1 - t) ** 2 * curve.from.y + 2 * (1 - t) * t * curve.control.y + t ** 2 * curve.to.y;
  return { x, y };
}

function drawRoutes(frame) {
  routes.forEach((route) => {
    const curve = routeCurve(route);
    const activity = frame.routeActivity[route.id];
    const active = Math.min(1, activity * 8);
    ctx.strokeStyle = routeColor(route.mode);
    ctx.globalAlpha = 0.16 + active * 0.58;
    ctx.lineWidth = 1.3 + active * 3.2;
    ctx.setLineDash(route.mode === "rail" ? [8, 7] : route.mode === "labor" ? [3, 5] : []);
    ctx.beginPath();
    ctx.moveTo(curve.from.x, curve.from.y);
    ctx.quadraticCurveTo(curve.control.x, curve.control.y, curve.to.x, curve.to.y);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.globalAlpha = 1;

    if (active > 0.02 && state.playing) {
      const particleCount = active > 0.65 ? 2 : 1;
      for (let i = 0; i < particleCount; i += 1) {
        const routeOffset = routeHash(route.id) + i / particleCount;
        const t = (state.particlePhase * (0.18 + active * 0.24) + routeOffset) % 1;
        const p = bezier(curve, t);
        ctx.save();
        ctx.font = `${route.mode === "labor" ? 10 : 11}px "Segoe UI Emoji", "Apple Color Emoji", system-ui`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.globalAlpha = 0.78;
        ctx.shadowColor = "rgba(255,253,248,0.85)";
        ctx.shadowBlur = 3;
        ctx.fillText(routeEmoji(route.mode), p.x, p.y);
        ctx.restore();
      }
    }
  });
}

function routeHash(value) {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) % 997;
  }
  return (hash % 100) / 100;
}

function routeEmoji(mode) {
  if (mode === "rail") return "🚂";
  if (mode === "labor") return "🧳";
  return "🚢";
}

function drawNodes(frame) {
  const labelOffsets = {
    funston: { x: 8, y: -14 },
    boston: { x: 8, y: -18 },
    newyork: { x: 10, y: 15 },
    etaples: { x: 8, y: -13 },
    london: { x: -44, y: -10 },
    brest: { x: -36, y: 14 },
    bombay: { x: 8, y: -10 }
  };
  nodes.forEach((node) => {
    const p = project(node.lon, node.lat);
    const cell = frame.nodes[node.id];
    const infectedShare = cell.I / Math.max(node.population, 0.001);
    const deathShare = cell.D / Math.max(node.population, 0.001);
    const radius = 4.5 + Math.sqrt(Math.max(cell.I, 0)) * 9 + Math.sqrt(deathShare) * 20;
    ctx.fillStyle = infectedShare > 0.01 ? "#b6463f" : infectedShare > 0.001 ? "#c9872b" : "#2f7d57";
    ctx.strokeStyle = "rgba(255, 253, 248, 0.95)";
    ctx.lineWidth = 2;
    ctx.globalAlpha = 0.9;
    ctx.beginPath();
    ctx.arc(p.x, p.y, Math.min(18, radius), 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.globalAlpha = 1;
    if (infectedShare > 0.006 || node.id === "funston" || node.id === "etaples" || node.id === "bombay") {
      const offset = labelOffsets[node.id] || { x: 8, y: -8 };
      ctx.fillStyle = "rgba(23, 32, 42, 0.86)";
      ctx.font = "700 11px system-ui, sans-serif";
      ctx.fillText(node.name, p.x + offset.x, p.y + offset.y);
    }
  });
}

function drawMonthBanner(frame) {
  const bannerWidth = Math.max(150, Math.min(190, state.width - 28));
  const bannerX = state.width - bannerWidth - 14;
  ctx.fillStyle = "rgba(255, 253, 248, 0.85)";
  ctx.fillRect(bannerX, 14, bannerWidth, 58);
  ctx.save();
  ctx.beginPath();
  ctx.rect(bannerX + 10, 14, bannerWidth - 18, 58);
  ctx.clip();
  ctx.fillStyle = "#17202a";
  ctx.font = "800 18px system-ui, sans-serif";
  ctx.fillText(months[frame.month], bannerX + 14, 39);
  ctx.fillStyle = "#617080";
  ctx.font = "700 11px system-ui, sans-serif";
  drawFittedText(frame.wave.name, bannerX + 14, 58, bannerWidth - 28);
  ctx.restore();
}

function drawFittedText(text, x, y, maxWidth) {
  if (ctx.measureText(text).width <= maxWidth) {
    ctx.fillText(text, x, y);
    return;
  }
  let shortened = text;
  while (shortened.length > 8 && ctx.measureText(`${shortened}...`).width > maxWidth) {
    shortened = shortened.slice(0, -1);
  }
  ctx.fillText(`${shortened}...`, x, y);
}

function renderChart() {
  const rect = chartSvg.getBoundingClientRect();
  const width = Math.max(360, rect.width || chartSvg.clientWidth || 900);
  const height = 320;
  const compactLegend = width < 620;
  const pad = { left: 54, right: 22, top: 18, bottom: compactLegend ? 86 : 64 };
  const innerW = width - pad.left - pad.right;
  const innerH = height - pad.top - pad.bottom;
  const visibleEnd = state.month;
  chartSvg.setAttribute("viewBox", `0 0 ${width} ${height}`);
  chartSvg.innerHTML = "";

  const totals = state.sim.map((frame) => frame.displayTotals);
  const monthlyDeaths = totals.map((total, index) => Math.max(0, total.D - (index > 0 ? totals[index - 1].D : 0)));
  const series = [
    { key: "S", label: "Susceptible", color: "#617080" },
    { key: "I", label: "Infected", color: "#b6463f" },
    { key: "R", label: "Recovered", color: "#2f7d57" },
    { key: "D", label: "Total deaths", color: "#17202a" },
    { key: "newD", label: "Deaths/month", color: "#7b3956", values: monthlyDeaths }
  ].filter((s) => {
    if (s.key === "S") return controls.showSusceptible.checked;
    if (s.key === "I") return controls.showInfected.checked;
    if (s.key === "R") return controls.showRecovered.checked;
    if (s.key === "newD") return controls.showMonthlyDeaths.checked;
    return controls.showDeaths.checked;
  });
  if (!series.length) series.push({ key: "I", label: "Infected", color: "#b6463f" });
  const maxY = Math.max(1, ...series.flatMap((s) => s.values || totals.map((t) => t[s.key]))) * 1.08;

  const x = (i) => pad.left + (i / (months.length - 1)) * innerW;
  const y = (value) => pad.top + innerH - (value / maxY) * innerH;
  const ns = "http://www.w3.org/2000/svg";
  const yUnit = maxY >= 1000 ? "billions" : "millions";
  const yScale = maxY >= 1000 ? 1000 : 1;

  for (let i = 0; i <= 4; i += 1) {
    const yy = pad.top + (i / 4) * innerH;
    const line = document.createElementNS(ns, "line");
    line.setAttribute("x1", pad.left);
    line.setAttribute("x2", width - pad.right);
    line.setAttribute("y1", yy);
    line.setAttribute("y2", yy);
    line.setAttribute("stroke", "rgba(23,32,42,0.12)");
    chartSvg.appendChild(line);
    const label = document.createElementNS(ns, "text");
    label.setAttribute("x", pad.left - 10);
    label.setAttribute("y", yy + 4);
    label.setAttribute("fill", "#617080");
    label.setAttribute("font-size", "10");
    label.setAttribute("font-weight", "700");
    label.setAttribute("text-anchor", "end");
    const value = ((maxY * (1 - i / 4)) / yScale);
    label.textContent = value >= 10 ? value.toFixed(0) : value.toFixed(1);
    chartSvg.appendChild(label);
  }

  const axisTitle = document.createElementNS(ns, "text");
  axisTitle.setAttribute("x", 14);
  axisTitle.setAttribute("y", pad.top + 4);
  axisTitle.setAttribute("fill", "#617080");
  axisTitle.setAttribute("font-size", "11");
  axisTitle.setAttribute("font-weight", "800");
  axisTitle.setAttribute("transform", `rotate(-90 14 ${pad.top + 4})`);
  axisTitle.textContent = `people (${yUnit})`;
  chartSvg.appendChild(axisTitle);

  drawWaveBands(ns, pad, innerW, innerH, visibleEnd);

  const labelMonths = [0, 6, 12, 18, 24, 29].filter((monthIndex) => monthIndex <= visibleEnd);
  if (!labelMonths.includes(visibleEnd)) labelMonths.push(visibleEnd);
  labelMonths.forEach((monthIndex) => {
    const tick = document.createElementNS(ns, "line");
    tick.setAttribute("x1", x(monthIndex));
    tick.setAttribute("x2", x(monthIndex));
    tick.setAttribute("y1", height - pad.bottom);
    tick.setAttribute("y2", height - pad.bottom + 6);
    tick.setAttribute("stroke", "rgba(23,32,42,0.42)");
    chartSvg.appendChild(tick);
    const label = document.createElementNS(ns, "text");
    label.setAttribute("x", x(monthIndex));
    label.setAttribute("y", height - pad.bottom + 22);
    label.setAttribute("fill", "#617080");
    label.setAttribute("font-size", compactLegend ? "10" : "11");
    label.setAttribute("font-weight", "750");
    label.setAttribute("text-anchor", "middle");
    label.textContent = months[monthIndex];
    chartSvg.appendChild(label);
  });

  series.forEach((s) => {
    const path = document.createElementNS(ns, "path");
    const values = s.values || totals.map((t) => t[s.key]);
    const visibleValues = values.slice(0, visibleEnd + 1);
    if (visibleValues.length === 1) {
      const dot = document.createElementNS(ns, "circle");
      dot.setAttribute("cx", x(0));
      dot.setAttribute("cy", y(visibleValues[0]));
      dot.setAttribute("r", 4);
      dot.setAttribute("fill", s.color);
      chartSvg.appendChild(dot);
    } else {
      const d = visibleValues.map((value, i) => `${i === 0 ? "M" : "L"} ${x(i).toFixed(1)} ${y(value).toFixed(1)}`).join(" ");
      path.setAttribute("d", d);
      path.setAttribute("fill", "none");
      path.setAttribute("stroke", s.color);
      path.setAttribute("stroke-width", s.key === "I" || s.key === "newD" ? "3.3" : "2.4");
      if (s.key === "newD") path.setAttribute("stroke-dasharray", "7 4");
      path.setAttribute("stroke-linejoin", "round");
      chartSvg.appendChild(path);
    }
  });

  const cursor = document.createElementNS(ns, "line");
  cursor.setAttribute("x1", x(state.month));
  cursor.setAttribute("x2", x(state.month));
  cursor.setAttribute("y1", pad.top);
  cursor.setAttribute("y2", height - pad.bottom);
  cursor.setAttribute("stroke", "#17202a");
  cursor.setAttribute("stroke-width", "1.5");
  cursor.setAttribute("stroke-dasharray", "5 5");
  chartSvg.appendChild(cursor);

  const legendCols = compactLegend ? 2 : Math.max(4, series.length);
  const legendStep = compactLegend ? (width - pad.left - pad.right) / 2 : 145;
  series.forEach((s, index) => {
    const g = document.createElementNS(ns, "g");
    const cx = pad.left + (index % legendCols) * legendStep;
    const cy = height - (compactLegend ? (index < legendCols ? 34 : 14) : 18);
    g.innerHTML = `<circle cx="${cx}" cy="${cy - 4}" r="5" fill="${s.color}"></circle><text x="${cx + 10}" y="${cy}" fill="#17202a" font-size="12" font-weight="700">${s.label}</text>`;
    chartSvg.appendChild(g);
  });
}

function drawWaveBands(ns, pad, innerW, innerH, visibleEnd) {
  const bands = [
    { start: 3, end: 6, label: "Wave 1", color: "rgba(201,135,43,0.12)" },
    { start: 7, end: 11, label: "Wave 2 (deadliest)", color: "rgba(182,70,63,0.14)" },
    { start: 12, end: 16, label: "Wave 3", color: "rgba(109,90,156,0.12)" },
    { start: 21, end: 26, label: "Regional 1920", color: "rgba(47,125,87,0.09)" }
  ];
  bands.forEach((band) => {
    if (visibleEnd < band.start) return;
    const clippedEnd = Math.min(band.end, visibleEnd);
    const x1 = pad.left + (band.start / (months.length - 1)) * innerW;
    const x2 = pad.left + (clippedEnd / (months.length - 1)) * innerW;
    const rect = document.createElementNS(ns, "rect");
    rect.setAttribute("x", x1);
    rect.setAttribute("y", pad.top);
    rect.setAttribute("width", Math.max(2, x2 - x1));
    rect.setAttribute("height", innerH);
    rect.setAttribute("fill", band.color);
    chartSvg.appendChild(rect);

    const text = document.createElementNS(ns, "text");
    text.setAttribute("x", x1 + 6);
    text.setAttribute("y", pad.top + 14);
    text.setAttribute("fill", "#617080");
    text.setAttribute("font-size", "10");
    text.setAttribute("font-weight", "800");
    text.textContent = band.label;
    chartSvg.appendChild(text);
  });
}

function renderMetrics() {
  const totals = state.sim[state.month].displayTotals;
  const metrics = [
    ["Active infected", totals.I, "red"],
    ["Recovered", totals.R, "green"],
    ["Deaths", totals.D, "ink"],
    ["Still susceptible", totals.S, "muted"]
  ];
  controls.metricsStrip.innerHTML = metrics.map(([label, value]) => (
    `<div class="metric"><span>${label}</span><strong>${formatMillions(value)}</strong></div>`
  )).join("");
}

function formatMillions(value) {
  if (value >= 1000) return `${(value / 1000).toFixed(value >= 10000 ? 0 : 1)}B`;
  if (value >= 1) return `${value.toFixed(value >= 10 ? 0 : 1)}M`;
  return `${Math.round(value * 1000).toLocaleString()}k`;
}

function renderDetail() {
  if (state.selected.type === "node") return renderNodeDetail(nodeById[state.selected.id]);
  if (state.selected.type === "route") return renderRouteDetail(routeById[state.selected.id]);
  if (state.selected.type === "country") return renderCountryDetail(state.selected.id);
  if (state.selected.type === "topic") return renderTopicDetail(state.selected.id);
  renderOriginDetail(originHypotheses[readSettings().origin]);
}

function sourceLinks(ids) {
  return ids.map((id) => {
    const source = sources[id];
    return `<a class="source-link" href="${source.url}" target="_blank" rel="noreferrer">${source.title}</a>`;
  }).join("<br>");
}

function renderOriginDetail(origin) {
  controls.detailTitle.textContent = origin.label;
  controls.detailBody.innerHTML = `
    <p>${origin.summary}</p>
    <div class="pill-row">
      <span class="pill">Seed month: ${months[origin.seedMonth]}</span>
      <span class="pill">Evidence: debated</span>
      <span class="pill">Default scale: 500M infected / 50M deaths</span>
    </div>
    <p>Try switching origin hypotheses while keeping the same counterfactual settings. The early map changes, but the autumn 1918 wave often dominates once movement and crowding connect distant regions. The graph uses historical global estimates so classroom discussions can stay attached to real scale.</p>
    <p>${sourceLinks(origin.sources)}</p>
  `;
}

function renderNodeDetail(node) {
  const cell = state.sim[state.month].displayNodes[node.id];
  const wave = state.sim[state.month].wave;
  const settings = readSettings();
  const warText = settings.war === "laterWar" ? "continued-war" : settings.war === "noWar" ? "no-war" : "historical-war";
  const policyText = `${controls.policyTiming.options[controls.policyTiming.selectedIndex].text.toLowerCase()}, ${Math.round(settings.policyStrength * 100)}% policy strength`;
  const phaseText = describeWaveForDetail(wave);
  controls.detailTitle.textContent = `${node.name}, ${node.country}`;
  controls.detailBody.innerHTML = `
    <div class="pill-row">
      <span class="pill">${months[state.month]}</span>
      <span class="pill">Active infected: ${formatMillions(cell.I)}</span>
      <span class="pill">Deaths: ${formatMillions(cell.D)}</span>
    </div>
    <p>${node.historical}</p>
    <p><strong>Country data:</strong> ${node.countryData}</p>
    <p><strong>What this marker means:</strong> ${node.name} represents a regional model point centered on this place, not just the modern city boundary. The model uses a starting local population of ${formatMillions(node.population)} here, then rescales the graph to historical global estimates.</p>
    <p><strong>Current phase:</strong> ${phaseText}</p>
    <p><strong>Scenario effects:</strong> The current ${warText} setting and public-health choices (${policyText}) change how much people move, how crowded conditions are, how much transmission is reduced, and how strained care is.</p>
    <p><strong>Model details:</strong> for this month the simulation applies transmission ${wave.transmission.toFixed(2)}x and mortality-pressure ${wave.mortality.toFixed(2)}x compared with its baseline.</p>
    <p>${sourceLinks(node.sources)}</p>
  `;
}

function describeWaveForDetail(wave) {
  if (wave.wave === 1) return "The model is in the first spring 1918 wave, which is shown as widespread but usually less deadly than the later autumn wave.";
  if (wave.wave === 2) return "The model is in the autumn 1918 wave, treated here as the deadliest global wave.";
  if (wave.wave === 3) return "The model is in the winter-spring 1919 wave, still serious but generally lower than the autumn 1918 peak in this global classroom model.";
  if (wave.wave === 4) return "The model is showing smaller regional recurrences into 1920 rather than a single global peak.";
  if (wave.name.includes("tail")) return "The classroom run is tapering off. June 1920 is just where this simulation stops, not a claim that influenza disappeared.";
  return "The model is in an early or lower-pressure period before the main global waves dominate the graph.";
}

function renderCountryDetail(countryName) {
  const data = countryHistoricalData[countryName];
  controls.detailTitle.textContent = data ? data.name : countryName;
  if (data) {
    controls.detailBody.innerHTML = `
      <div class="pill-row">
        <span class="pill">Historical country data</span>
        <span class="pill">Deaths: ${data.deaths}</span>
      </div>
      <p><strong>Infections:</strong> ${data.infections}.</p>
      <p>${data.note}</p>
      <p>${sourceLinks(data.sources)}</p>
    `;
    return;
  }
  controls.detailBody.innerHTML = `
    <p>This country is part of the public-domain Natural Earth base map, but this prototype does not yet include a specific 1918 influenza country estimate for it.</p>
    <p>That is intentional for now: country-level pandemic records vary a lot in quality, definition, and survival. Later versions can attach a richer historical dataset here.</p>
    <p>${sourceLinks(["naturalEarth", "johnsonMueller", "ourWorld"])}</p>
  `;
}

function renderRouteDetail(route) {
  const frame = state.sim[state.month];
  const activity = frame.routeActivity[route.id];
  controls.detailTitle.textContent = route.name;
  controls.detailBody.innerHTML = `
    <div class="pill-row">
      <span class="pill">${nodeById[route.from].name} to ${nodeById[route.to].name}</span>
      <span class="pill">${route.mode}</span>
      <span class="pill">Current activity ${Math.round(activity * 1000)}</span>
    </div>
    <p>${route.summary}</p>
    <p>The animation brightens this route when either endpoint has active infection. Counterfactual port quarantine and travel advisories reduce maritime movement; no-war settings sharply reduce military-sensitive links.</p>
    <p>${sourceLinks(route.sources)}</p>
  `;
}

function renderTopicDetail(topic) {
  if (topic === "movement") {
    controls.detailTitle.textContent = "Why movement matters";
    controls.detailBody.innerHTML = `
      <p>Influenza spreads person to person, so the pandemic map follows people: troops in camps, soldiers on trains, sailors and passengers on ships, laborers, nurses, prisoners, and families in crowded cities.</p>
      <p>This model treats each route as a weighted connection. The weights are educational assumptions based on known wartime logistics and shipping geography, not exact passenger counts.</p>
      <p>${sourceLinks(["troopships", "cdc1918", "johnsonMueller"])}</p>
    `;
    return;
  }
  if (topic === "model") {
    controls.detailTitle.textContent = "How the model works";
    controls.detailBody.innerHTML = `
      <p>Each place has susceptible, infected, recovered, and dead groups. Local transmission is stronger during the autumn 1918 wave, and movement can import infections along ship, rail, labor, and troopship links.</p>
      <p>The graph rescales the model to historical global estimates: about 500 million infections and at least 50 million deaths under the default historical scenario. Counterfactuals move up or down from that real-world scale.</p>
      <p>The shaded graph bands mark the first spring 1918 wave, the much deadlier autumn 1918 wave, a winter 1918-1919 wave, and smaller regional recurrences into 1920. June 1920 is just the end of this classroom run, not a claim that influenza vanished on that date.</p>
      <p>${sourceLinks(["cdc1918", "markel", "barry", "ourWorld"])}</p>
    `;
  }
}

function renderSources() {
  controls.sourceList.innerHTML = Object.values(sources).map((source) => `
    <article class="source-item">
      <h3>${source.title}</h3>
      <p>${source.note}</p>
      <a class="source-link" href="${source.url}" target="_blank" rel="noreferrer">Open source</a>
    </article>
  `).join("");
}

function buildQuestionContext() {
  const settings = readSettings();
  const frame = state.sim[state.month];
  const totals = frame.displayTotals;
  const topNodes = nodes
    .map((node) => ({ node, cell: frame.displayNodes[node.id] }))
    .sort((a, b) => b.cell.I - a.cell.I)
    .slice(0, 6)
    .map(({ node, cell }) => `${node.name}, ${node.country}: active ${formatMillions(cell.I)}, deaths ${formatMillions(cell.D)}`)
    .join("; ");
  const sourceSummary = Object.values(sources)
    .slice(0, 8)
    .map((source) => `${source.title}: ${source.url}`)
    .join("\n");
  return `Current simulator state:
Month: ${months[state.month]}
Wave: ${frame.wave.name}; transmission multiplier ${frame.wave.transmission}; mortality multiplier ${frame.wave.mortality}
Origin hypothesis: ${originHypotheses[settings.origin].label}
War setting: ${settings.war}
Public-health timing: ${settings.policyTiming}; strength ${Math.round(settings.policyStrength * 100)}%
Policies: port quarantine ${settings.portQuarantine}, schools/gatherings ${settings.schoolClosures}, masks ${settings.maskUse}, travel advisories ${settings.travelAdvisory}
Displayed global-scale totals: active infected ${formatMillions(totals.I)}, recovered ${formatMillions(totals.R)}, deaths ${formatMillions(totals.D)}, susceptible ${formatMillions(totals.S)}, cumulative cases ${formatMillions(totals.cases)}
Most active nodes: ${topNodes}
Model caveat: this is a historically grounded classroom model, not a full statistical reconstruction. The graph is rescaled so the default historical scenario ends near about 500 million infections and at least 50 million deaths worldwide.
Sources:
${sourceSummary}`;
}

function buildConversationContext() {
  if (!state.askHistory.length) return "";
  return state.askHistory.slice(-4).map((turn, index) => (
    `Previous turn ${index + 1}\nQuestion: ${turn.question}\nAnswer: ${turn.answer}`
  )).join("\n\n");
}

function extractResponseText(data) {
  if (data.output_text) return data.output_text;
  if (Array.isArray(data.output)) {
    return data.output.flatMap((item) => item.content || [])
      .map((content) => content.text || "")
      .filter(Boolean)
      .join("\n");
  }
  return "";
}

function extractResponseSources(data) {
  const sources = [];
  const seen = new Set();
  function add(url, title = "Source") {
    if (!url || seen.has(url)) return;
    seen.add(url);
    sources.push({ url, title });
  }
  (data.output || []).forEach((item) => {
    (item.action?.sources || []).forEach((source) => add(source.url, source.title));
    (item.content || []).forEach((content) => {
      (content.annotations || []).forEach((annotation) => {
        if (annotation.type === "url_citation") add(annotation.url, annotation.title);
      });
    });
  });
  return sources;
}

function appendSourcesMarkdown(text, sourceList) {
  if (!sourceList.length) return text;
  const list = sourceList.slice(0, 8).map((source) => `- [${source.title || source.url}](${source.url})`).join("\n");
  return `${text}\n\n### Sources searched\n${list}`;
}

function compactForHistory(value) {
  return cleanLatex(value)
    .replace(/```[\s\S]*?```/g, "[diagram or code omitted]")
    .replace(/cite[^]+/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 1200);
}

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function renderInlineMarkdown(value) {
  return escapeHtml(cleanLatex(value))
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, '<a class="source-link" href="$2" target="_blank" rel="noreferrer">$1</a>');
}

function cleanLatex(value) {
  return value
    .replace(/\\\((.*?)\\\)/g, (_, expr) => latexToPlain(expr))
    .replace(/\\\[(.*?)\\\]/gs, (_, expr) => latexToPlain(expr))
    .replace(/\$\$(.*?)\$\$/gs, (_, expr) => latexToPlain(expr))
    .replace(/\$(.*?)\$/g, (_, expr) => latexToPlain(expr));
}

function latexToPlain(expr) {
  return expr
    .replace(/\\text\{([^}]+)\}/g, "$1")
    .replace(/\\mathrm\{([^}]+)\}/g, "$1")
    .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, "($1 / $2)")
    .replace(/\\div/g, "÷")
    .replace(/\\times/g, "×")
    .replace(/\\approx/g, "≈")
    .replace(/\\,/g, ",")
    .replace(/\\%/g, "%")
    .replace(/\\[a-zA-Z]+/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function sanitizeSvg(svg) {
  const trimmed = svg.trim();
  if (!/^<svg[\s>]/i.test(trimmed) || !/<\/svg>$/i.test(trimmed)) return `<pre><code>${escapeHtml(svg)}</code></pre>`;
  const doc = new DOMParser().parseFromString(trimmed, "image/svg+xml");
  if (doc.querySelector("parsererror") || doc.querySelector("script, foreignObject, iframe, object, embed")) {
    return `<pre><code>${escapeHtml(svg)}</code></pre>`;
  }
  doc.querySelectorAll("*").forEach((element) => {
    [...element.attributes].forEach((attribute) => {
      const name = attribute.name.toLowerCase();
      const value = attribute.value.toLowerCase();
      if (name.startsWith("on") || value.includes("javascript:") || value.includes("data:text/html")) {
        element.removeAttribute(attribute.name);
      }
    });
  });
  return new XMLSerializer().serializeToString(doc.documentElement);
}

function markdownToHtml(markdown) {
  const blocks = [];
  let text = markdown
    .replace(/\r\n/g, "\n")
    .replace(/cite[^]+/g, "")
    .replace(/\[?cite\]?turn\d+(?:search|news|open|fetch)\d+(?:\[?turn\d+(?:search|news|open|fetch)\d+\]?)*\]?/gi, "");
  text = text.replace(/```svg\n([\s\S]*)$/i, (_, svg) => {
    const token = `@@SVG_${blocks.length}@@`;
    const maybeClosed = svg.includes("</svg>");
    if (maybeClosed) {
      const end = svg.indexOf("</svg>") + "</svg>".length;
      blocks.push(sanitizeSvg(svg.slice(0, end)));
    } else {
      blocks.push(`<div class="diagram-warning"><strong>Diagram cut off.</strong> The answer was truncated before the SVG finished. Try asking again with “answer briefly” or “no SVG”.</div>`);
    }
    return token;
  });
  text = text.replace(/```svg\n([\s\S]*?)```/gi, (_, svg) => {
    const token = `@@SVG_${blocks.length}@@`;
    blocks.push(sanitizeSvg(svg));
    return token;
  });
  text = text.replace(/```([\s\S]*?)```/g, (_, code) => {
    const token = `@@SVG_${blocks.length}@@`;
    blocks.push(`<pre><code>${escapeHtml(code.trim())}</code></pre>`);
    return token;
  });

  const lines = text.split("\n");
  const html = [];
  let list = null;

  function closeList() {
    if (list) {
      html.push(`</${list}>`);
      list = null;
    }
  }

  lines.forEach((line) => {
    const trimmed = line.trim();
    const svgMatch = trimmed.match(/^@@SVG_(\d+)@@$/);
    if (svgMatch) {
      closeList();
      html.push(blocks[Number(svgMatch[1])]);
      return;
    }
    if (!trimmed) {
      closeList();
      return;
    }
    if (/^#{2,4}\s+/.test(trimmed)) {
      closeList();
      html.push(`<h3>${renderInlineMarkdown(trimmed.replace(/^#{2,4}\s+/, ""))}</h3>`);
      return;
    }
    const bullet = trimmed.match(/^[-*]\s+(.+)/);
    if (bullet) {
      if (list !== "ul") {
        closeList();
        list = "ul";
        html.push("<ul>");
      }
      html.push(`<li>${renderInlineMarkdown(bullet[1])}</li>`);
      return;
    }
    const numbered = trimmed.match(/^\d+\.\s+(.+)/);
    if (numbered) {
      if (list !== "ol") {
        closeList();
        list = "ol";
        html.push("<ol>");
      }
      html.push(`<li>${renderInlineMarkdown(numbered[1])}</li>`);
      return;
    }
    closeList();
    html.push(`<p>${renderInlineMarkdown(trimmed)}</p>`);
  });
  closeList();
  return html.join("");
}

async function askOpenAI() {
  const apiKey = controls.apiKeyInput.value.trim();
  const question = controls.questionInput.value.trim();
  const model = controls.modelInput.value.trim() || "gpt-5.4-mini";
  const allowWebSearch = controls.allowWebSearch.checked;
  if (!apiKey) {
    controls.answerBox.innerHTML = markdownToHtml("Please enter an OpenAI API key. For a public hosted version, use a backend so students never see a key.");
    return;
  }
  if (!question) {
    controls.answerBox.innerHTML = markdownToHtml("Type a question first.");
    return;
  }
  controls.askButton.disabled = true;
  controls.answerBox.innerHTML = markdownToHtml("Asking OpenAI...");
  try {
    const payload = {
      model,
      input: [
        {
          role: "system",
          content: `You are a careful, classroom-friendly history and epidemiology tutor. Answer from the supplied simulator context and recent conversation. Treat short follow-up questions as referring to the previous answer unless the user changes topic. Be clear about uncertainty. Do not pretend the model is a full reconstruction. Keep answers concise and useful for high-school students. Use Markdown. Do not use LaTeX; write formulas in plain text, for example "5.0 million ÷ 44 million × 1000 ≈ 114 deaths per 1,000". Do not end with offers like 'If you want...'. ${allowWebSearch ? "When the student asks for data not already in the simulator, use web search to find trustworthy historical data and cite sources. If you make a graph, use only values from the simulator context or from cited searched sources, label units, and state when data are approximate." : "Use only the supplied simulator context; say when the simulator does not contain enough data."} Usually answer with text only. If the user explicitly asks for a diagram or graph, include one very small self-contained SVG in a fenced \`\`\`svg block, under 40 SVG lines, with no scripts, no external resources, clear labels, and visible units.`
        },
        {
          role: "user",
          content: `${buildQuestionContext()}\n\nRecent conversation:\n${buildConversationContext() || "No previous Ask turns in this page session."}\n\nStudent question: ${question}`
        }
      ],
      max_output_tokens: 1200
    };
    if (allowWebSearch) {
      payload.tools = [{ type: "web_search" }];
      payload.tool_choice = "auto";
      payload.include = ["web_search_call.action.sources"];
    }
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify(payload)
    });
    const data = await response.json();
    if (!response.ok) {
      const message = data.error?.message || `Request failed with status ${response.status}`;
      throw new Error(message);
    }
    const answer = extractResponseText(data) || "The API returned no text.";
    state.askHistory.push({ question, answer: compactForHistory(answer) });
    state.askHistory = state.askHistory.slice(-6);
    controls.answerBox.innerHTML = markdownToHtml(appendSourcesMarkdown(answer, extractResponseSources(data)));
  } catch (error) {
    controls.answerBox.innerHTML = markdownToHtml(`Could not get an answer: ${error.message}`);
  } finally {
    controls.askButton.disabled = false;
  }
}

function updateAll({ recalc = false } = {}) {
  if (recalc) state.sim = runSimulation(readSettings());
  controls.timeSlider.value = String(state.month);
  controls.dateLabel.textContent = months[state.month];
  controls.waveLabel.textContent = state.sim[state.month].wave.name;
  controls.playIcon.textContent = state.playing ? "Ⅱ" : "▶";
  controls.playPauseButton.setAttribute("aria-label", state.playing ? "Pause simulation" : "Play simulation");
  draw();
  renderChart();
  renderMetrics();
  renderDetail();
}

function nearestNode(x, y) {
  let best = null;
  nodes.forEach((node) => {
    const p = project(node.lon, node.lat);
    const distance = Math.hypot(x - p.x, y - p.y);
    if (!best || distance < best.distance) best = { node, distance };
  });
  return best && best.distance < 18 ? best.node : null;
}

function distanceToRoute(x, y, route) {
  const curve = routeCurve(route);
  let min = Infinity;
  for (let i = 0; i <= 32; i += 1) {
    const p = bezier(curve, i / 32);
    min = Math.min(min, Math.hypot(x - p.x, y - p.y));
  }
  return min;
}

function nearestRoute(x, y) {
  let best = null;
  routes.forEach((route) => {
    const distance = distanceToRoute(x, y, route);
    if (!best || distance < best.distance) best = { route, distance };
  });
  return best && best.distance < 12 ? best.route : null;
}

function unproject(x, y) {
  const padX = 32;
  const padY = 28;
  const lon = ((x - padX) / (state.width - padX * 2)) * 360 - 180;
  const lat = 86 - ((y - padY) / (state.height - padY * 2)) * 172;
  return { lon, lat };
}

function pointInRing(lon, lat, ring) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i, i += 1) {
    const xi = ring[i][0];
    const yi = ring[i][1];
    const xj = ring[j][0];
    const yj = ring[j][1];
    const intersects = ((yi > lat) !== (yj > lat)) && (lon < ((xj - xi) * (lat - yi)) / ((yj - yi) || 0.000001) + xi);
    if (intersects) inside = !inside;
  }
  return inside;
}

function countryAtPoint(x, y) {
  if (!window.WORLD_COUNTRIES) return null;
  const { lon, lat } = unproject(x, y);
  for (const country of window.WORLD_COUNTRIES) {
    for (const polygon of country.polygons) {
      if (!polygon.length || !pointInRing(lon, lat, polygon[0])) continue;
      const inHole = polygon.slice(1).some((ring) => pointInRing(lon, lat, ring));
      if (!inHole) return country;
    }
  }
  return null;
}

function resetSelectionToOrigin() {
  state.selected = { type: "origin", id: readSettings().origin };
}

function handleSettingsChange() {
  state.month = Math.min(state.month, months.length - 1);
  resetSelectionToOrigin();
  updateAll({ recalc: true });
}

controls.playPauseButton.addEventListener("click", () => {
  state.playing = !state.playing;
  state.lastTick = performance.now();
  state.lastFrameTick = state.lastTick;
  updateAll();
});

controls.restartButton.addEventListener("click", () => {
  state.month = 0;
  state.playing = false;
  updateAll();
});

controls.timeSlider.addEventListener("input", (event) => {
  state.month = Number(event.target.value);
  state.playing = false;
  updateAll();
});

controls.speedControl.addEventListener("input", (event) => {
  state.speed = Number(event.target.value);
});

[
  controls.originSelect,
  controls.warSelect,
  controls.policyTiming,
  controls.policyStrength,
  controls.portQuarantine,
  controls.schoolClosures,
  controls.maskUse,
  controls.travelAdvisory
].forEach((control) => control.addEventListener("input", handleSettingsChange));

[
  controls.showSusceptible,
  controls.showInfected,
  controls.showRecovered,
  controls.showDeaths,
  controls.showMonthlyDeaths
].forEach((control) => control.addEventListener("input", renderChart));

document.querySelectorAll("[data-info-topic]").forEach((button) => {
  button.addEventListener("click", () => {
    state.selected = { type: "topic", id: button.dataset.infoTopic };
    renderDetail();
  });
});

controls.sourcesButton.addEventListener("click", () => {
  controls.sourcesPanel.classList.toggle("visible");
  if (controls.sourcesPanel.classList.contains("visible")) {
    controls.sourcesPanel.scrollIntoView({ behavior: "smooth", block: "start" });
  }
});

controls.askButton.addEventListener("click", askOpenAI);
controls.clearAnswerButton.addEventListener("click", () => {
  controls.questionInput.value = "";
  controls.answerBox.innerHTML = "";
  state.askHistory = [];
});

canvas.addEventListener("click", (event) => {
  const rect = canvas.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;
  const node = nearestNode(x, y);
  if (node) {
    state.selected = { type: "node", id: node.id };
    renderDetail();
    return;
  }
  const route = nearestRoute(x, y);
  if (route) {
    state.selected = { type: "route", id: route.id };
    renderDetail();
    return;
  }
  const country = countryAtPoint(x, y);
  if (country) {
    state.selected = { type: "country", id: country.name };
    renderDetail();
  }
});

chartSvg.addEventListener("click", (event) => {
  const rect = chartSvg.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const width = rect.width || 1;
  const month = Math.round(((x - 54) / Math.max(1, width - 76)) * (months.length - 1));
  state.month = Math.max(0, Math.min(months.length - 1, month));
  state.selected = { type: "topic", id: "model" };
  state.playing = false;
  updateAll();
});

function tick(now) {
  const frameElapsed = now - state.lastFrameTick;
  state.lastFrameTick = now;
  const monthElapsed = now - state.lastTick;
  if (state.playing) state.particlePhase = (state.particlePhase + frameElapsed / 9000) % 1;
  if (state.playing && monthElapsed > 2800 / state.speed) {
    state.month += 1;
    if (state.month >= months.length) {
      state.month = months.length - 1;
      state.playing = false;
    }
    state.lastTick = now;
    updateAll();
  } else {
    draw();
  }
  requestAnimationFrame(tick);
}

function init() {
  renderSources();
  state.sim = runSimulation(readSettings());
  resizeCanvas();
  updateAll();
  window.addEventListener("resize", () => {
    resizeCanvas();
    renderChart();
  });
  requestAnimationFrame((now) => {
    state.lastTick = now;
    state.lastFrameTick = now;
    tick(now);
  });
}

init();
