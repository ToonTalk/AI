# 1918 Influenza World Simulation

Static single-page educational simulator for exploring the 1918 influenza pandemic.

Open `index.html` in a browser. The page includes:

- origin hypothesis selector: Kansas / Camp Funston, Étaples / Western Front, and northern China / labor routes
- counterfactual controls for war duration, public-health timing, port quarantine, school and gathering policies, mask campaigns, and civilian travel advisories
- animated world map with simplified ship, troopship, rail, and labor-route movement
- clickable city/country markers and transport routes
- public-domain Natural Earth country boundaries
- S/I/R/D graph for susceptible, infected, recovered, and dead subpopulations, with susceptible hidden by default
- optional OpenAI API question panel using a user-provided key in the browser session
- optional Responses API web search for question answering with citations
- linked source panel and per-component evidence notes

## Model Notes

This is a historically grounded classroom model, not a statistical reconstruction. Places are network nodes with population, contact, and fatality assumptions. Routes are weighted links based on historical movement systems rather than exact passenger or troop counts. The graph is rescaled to global historical estimates: the default historical scenario ends near the CDC figures of about 500 million infections and at least 50 million deaths worldwide. Counterfactuals move up or down from that scale.

The base map uses Natural Earth 1:110m Admin 0 country boundaries, which Natural Earth publishes as public-domain map data.

The "Ask" panel calls the OpenAI Responses API directly from the browser. When "Allow web search" is enabled, it attaches the Responses API `web_search` tool so answers can look for historical data and cite sources. That is convenient for local testing, but a public classroom deployment should use a small backend or a ChatGPT app integration so students never handle or see an API key.

Ask keeps a short in-memory conversation history for follow-up questions. Clearing the answer also clears that local history.

Key extension points are in `app.js`:

- `nodes`: city/country markers, population assumptions, historical notes, and source links
- `routes`: ship, troopship, rail, and labor movement links
- `originHypotheses`: competing seed scenarios
- `runSimulation`: monthly S/I/R/D model
- `sources`: public citations used by clickable detail panels
- `map-data.js`: generated Natural Earth country boundary data
