// MIT AI Lab Archive Explorer App Controller

// Global App State
let appState = {
  data: {
    emails: [],
    letters: [],
    docs: [],
    lisp_files: []
  },
  activeTab: 'dashboard',
  selectedEmailId: null,
  selectedLetterId: null,
  selectedDocId: null,
  selectedLispId: null,
  directorInterpreter: null
};

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
  setupNavigation();
  initDirectorSimulator();
  initDiagramerWidget();
  initAniPlanner();
  initLogoSimulator();
  loadArchiveData();
});

// Load JSON Database
async function loadArchiveData() {
  try {
    const response = await fetch('mit_archive.json');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    appState.data = data;
    
    // Parse folders for email dropdown
    const folders = [...new Set(data.emails.map(e => e.folder))].sort();
    const folderFilter = document.getElementById('email-folder-filter');
    folders.forEach(folder => {
      const option = document.createElement('option');
      option.value = folder;
      option.textContent = folder;
      folderFilter.appendChild(option);
    });

    updateCountersAndStats();
    
    // Initial renders
    renderEmailsList();
    renderLettersList();
    renderDocsList();
    renderLispList();
    
    setupSearchFilters();
  } catch (error) {
    console.error("Failed to load archive database:", error);
    alert("Error loading mit_archive.json. Make sure you are running a local web server (e.g. python -m http.server 8000) inside the scratch/mit_archive directory.");
  }
}

// Update UI Badge Counts & Dashboard
function updateCountersAndStats() {
  const counts = {
    emails: appState.data.emails.length,
    letters: appState.data.letters.length,
    docs: appState.data.docs.length,
    lisp: appState.data.lisp_files.length
  };

  // Sidebar badges
  document.getElementById('badge-emails').textContent = counts.emails;
  document.getElementById('badge-letters').textContent = counts.letters;
  document.getElementById('badge-docs').textContent = counts.docs;
  document.getElementById('badge-lisp').textContent = counts.lisp;

  // Dashboard stats
  document.getElementById('stat-emails').textContent = counts.emails;
  document.getElementById('stat-letters').textContent = counts.letters;
  document.getElementById('stat-docs').textContent = counts.docs;
  document.getElementById('stat-lisp').textContent = counts.lisp;
}

// Sidebar & Tab Switch Logic
function setupNavigation() {
  const navItems = document.querySelectorAll('.nav-item');
  const tabContents = document.querySelectorAll('.tab-content');

  function switchTab(tabId) {
    appState.activeTab = tabId;
    
    // Update active nav item
    navItems.forEach(item => {
      if (item.getAttribute('data-tab') === tabId) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });

    // Update active tab content
    tabContents.forEach(tab => {
      if (tab.id === `tab-${tabId}`) {
        tab.classList.add('active');
      } else {
        tab.classList.remove('active');
      }
    });
    
    // Canvas specific resizing/resets if entering director tab
    if (tabId === 'director' && appState.directorInterpreter) {
      appState.directorInterpreter.clearCanvas();
      // Restart frame loop
      appState.directorInterpreter.start();
    } else if (appState.directorInterpreter) {
      // Pause drawing if leaving director tab
      appState.directorInterpreter.stop();
    }

    // Redraw Diagramer links when switching back to dashboard
    if (tabId === 'dashboard') {
      setTimeout(drawDiagramerLinks, 100);
    }
  }

  navItems.forEach(item => {
    item.addEventListener('click', () => {
      switchTab(item.getAttribute('data-tab'));
    });
  });

  const backToDashboardBtn = document.getElementById('btn-back-to-dashboard');
  if (backToDashboardBtn) {
    backToDashboardBtn.addEventListener('click', () => {
      switchTab('dashboard');
    });
  }

  const backToDashboardLogoBtn = document.getElementById('btn-back-to-dashboard-logo');
  if (backToDashboardLogoBtn) {
    backToDashboardLogoBtn.addEventListener('click', () => {
      switchTab('dashboard');
    });
  }

  // Bind dashboard stat cards
  const statCards = document.querySelectorAll('.stat-card');
  statCards.forEach(card => {
    card.addEventListener('click', () => {
      switchTab(card.getAttribute('data-tab-trigger'));
    });
  });

  // Launch Director button on dashboard
  document.getElementById('go-to-director-btn').addEventListener('click', () => {
    switchTab('director');
  });

  // Launch Logo button on dashboard
  const goToLogoBtn = document.getElementById('go-to-logo-btn');
  if (goToLogoBtn) {
    goToLogoBtn.addEventListener('click', () => {
      switchTab('logo');
    });
  }
}

// Setup Live Filtering for Searches
function setupSearchFilters() {
  // Emails Tab
  const emailSearch = document.getElementById('email-search');
  const emailFolder = document.getElementById('email-folder-filter');
  const handleEmailFilter = () => {
    renderEmailsList(emailSearch.value, emailFolder.value);
  };
  emailSearch.addEventListener('input', handleEmailFilter);
  emailFolder.addEventListener('change', handleEmailFilter);

  // Letters Tab
  const letterSearch = document.getElementById('letter-search');
  letterSearch.addEventListener('input', () => {
    renderLettersList(letterSearch.value);
  });

  // Docs Tab
  const docSearch = document.getElementById('doc-search');
  docSearch.addEventListener('input', () => {
    renderDocsList(docSearch.value);
  });

  // Lisp Tab
  const lispSearch = document.getElementById('lisp-search');
  lispSearch.addEventListener('input', () => {
    renderLispList(lispSearch.value);
  });
}

// ==========================================
// RENDERING COMPONENT HELPERS
// ==========================================

// --- Emails list rendering ---
function renderEmailsList(search = '', folder = '') {
  const container = document.getElementById('email-list-container');
  container.innerHTML = '';
  
  const searchLower = search.toLowerCase();
  
  const filtered = appState.data.emails.filter(e => {
    const matchesSearch = e.subject.toLowerCase().includes(searchLower) || 
                          e.from.toLowerCase().includes(searchLower) || 
                          e.body.toLowerCase().includes(searchLower);
    const matchesFolder = !folder || e.folder === folder;
    return matchesSearch && matchesFolder;
  });

  if (filtered.length === 0) {
    container.innerHTML = '<div class="no-results" style="padding: 20px; text-align: center; color: var(--text-secondary);">No matching emails found.</div>';
    return;
  }

  filtered.forEach(email => {
    const item = document.createElement('div');
    item.className = `list-item ${appState.selectedEmailId === email.id ? 'selected' : ''}`;
    
    // Extract short name for From field
    const fromShort = email.from.split('(')[0].trim().replace(/at/g, '@');
    
    item.innerHTML = `
      <div class="list-item-meta">
        <span>${fromShort}</span>
        <span>${email.date.split(' ')[0]}</span>
      </div>
      <div class="list-item-title">${email.subject}</div>
      <div class="list-item-desc">${email.body.substring(0, 60)}...</div>
    `;
    
    item.addEventListener('click', () => {
      appState.selectedEmailId = email.id;
      // Re-render list to update selection border
      renderEmailsList(search, folder);
      renderEmailDetail(email);
    });
    
    container.appendChild(item);
  });
}

function renderEmailDetail(email) {
  const container = document.getElementById('email-detail-container');
  container.innerHTML = `
    <div class="email-header-table">
      <div class="hdr-label">FROM:</div>
      <div class="hdr-val">${email.from}</div>
      <div class="hdr-label">TO:</div>
      <div class="hdr-val">${email.to}</div>
      <div class="hdr-label">DATE:</div>
      <div class="hdr-val">${email.date}</div>
      <div class="hdr-label">SUBJ:</div>
      <div class="hdr-val hdr-val-sub">${email.subject}</div>
      <div class="hdr-label">DIR:</div>
      <div class="hdr-val" style="font-family: var(--font-mono); font-size: 11px; color: var(--text-secondary);">${email.folder}</div>
    </div>
    <div class="email-body-text">${cleanEmailBody(email.body)}</div>
  `;
}

function cleanEmailBody(body) {
  // Replace references like CARL at MIT-AI with clickable elements or clean text
  return body.replace(/([A-Z0-9\-]+)\s+at\s+([A-Z\-]+)/gi, '$1@$2');
}

// --- Letters list rendering ---
function renderLettersList(search = '') {
  const container = document.getElementById('letter-list-container');
  container.innerHTML = '';
  
  const searchLower = search.toLowerCase();
  
  const filtered = appState.data.letters.filter(l => {
    return l.recipient.toLowerCase().includes(searchLower) || 
           l.body.toLowerCase().includes(searchLower) ||
           l.salutation.toLowerCase().includes(searchLower);
  });

  if (filtered.length === 0) {
    container.innerHTML = '<div class="no-results" style="padding: 20px; text-align: center; color: var(--text-secondary);">No matching letters found.</div>';
    return;
  }

  filtered.forEach(letter => {
    const item = document.createElement('div');
    item.className = `list-item ${appState.selectedLetterId === letter.id ? 'selected' : ''}`;
    
    // Extract first line of recipient as title
    const recipientTitle = letter.recipient.split('\n')[0] || "Unknown Recipient";
    
    item.innerHTML = `
      <div class="list-item-meta">
        <span>TO: ${recipientTitle}</span>
      </div>
      <div class="list-item-title">${letter.salutation}</div>
      <div class="list-item-desc">${letter.body.substring(0, 60)}...</div>
    `;
    
    item.addEventListener('click', () => {
      appState.selectedLetterId = letter.id;
      renderLettersList(search);
      renderLetterDetail(letter);
    });
    
    container.appendChild(item);
  });
}

function renderLetterDetail(letter) {
  const container = document.getElementById('letter-detail-container');
  container.innerHTML = `
    <div class="email-header-table">
      <div class="hdr-label">RECIPIENT:</div>
      <div class="hdr-val" style="white-space: pre-line;">${letter.recipient}</div>
      <div class="hdr-label">GREETING:</div>
      <div class="hdr-val hdr-val-sub">${letter.salutation}</div>
      <div class="hdr-label">SOURCE:</div>
      <div class="hdr-val" style="font-family: var(--font-mono); font-size: 11px; color: var(--text-secondary);">${letter.folder}/ar8.letter</div>
    </div>
    <div class="email-body-text" style="font-size: 15px; line-height: 1.6; padding-top: 10px;">${letter.body}</div>
  `;
}

// --- Documents list rendering ---
function renderDocsList(search = '') {
  const container = document.getElementById('doc-list-container');
  container.innerHTML = '';
  
  const searchLower = search.toLowerCase();
  
  const filtered = appState.data.docs.filter(d => {
    return d.title.toLowerCase().includes(searchLower) || 
           d.filename.toLowerCase().includes(searchLower) ||
           d.body.toLowerCase().includes(searchLower);
  });

  if (filtered.length === 0) {
    container.innerHTML = '<div class="no-results" style="padding: 20px; text-align: center; color: var(--text-secondary);">No matching documents.</div>';
    return;
  }

  filtered.forEach(doc => {
    const item = document.createElement('div');
    item.className = `list-item ${appState.selectedDocId === doc.id ? 'selected' : ''}`;
    
    item.innerHTML = `
      <div class="list-item-meta">
        <span>${doc.filename}</span>
        <span>${Math.round(doc.body.length / 1024)} KB</span>
      </div>
      <div class="list-item-title">${doc.title}</div>
      <div class="list-item-desc">${doc.body.substring(0, 60)}...</div>
    `;
    
    item.addEventListener('click', () => {
      appState.selectedDocId = doc.id;
      renderDocsList(search);
      renderDocDetail(doc);
    });
    
    container.appendChild(item);
  });
}

function renderDocDetail(doc) {
  const container = document.getElementById('doc-detail-container');
  
  // Format body by removing pub commands or rendering them in a cleaner way
  let formattedBody = doc.body;
  
  // Simple regex cleaning of PUB tags if they are in the content
  formattedBody = formattedBody.replace(/\.begin center/gi, '\n');
  formattedBody = formattedBody.replace(/\.end/gi, '\n');
  formattedBody = formattedBody.replace(/\.subsec/gi, '\n###');
  formattedBody = formattedBody.replace(/\.sec/gi, '\n##');
  
  container.innerHTML = `
    <div class="doc-viewer-card">
      <h1>${doc.title}</h1>
      <div class="doc-meta-info">
        FILENAME: ${doc.filename} | DIRECTORY: ${doc.folder} | SIZE: ${doc.body.length} bytes
      </div>
      <div class="doc-body-content">${formattedBody}</div>
    </div>
  `;
}

// --- Lisp list rendering ---
function renderLispList(search = '') {
  const container = document.getElementById('lisp-list-container');
  container.innerHTML = '';
  
  const searchLower = search.toLowerCase();
  
  const filtered = appState.data.lisp_files.filter(f => {
    return f.filename.toLowerCase().includes(searchLower) || 
           f.folder.toLowerCase().includes(searchLower) ||
           f.code.toLowerCase().includes(searchLower);
  });

  if (filtered.length === 0) {
    container.innerHTML = '<div class="no-results" style="padding: 20px; text-align: center; color: var(--text-secondary);">No matching Lisp files.</div>';
    return;
  }

  const categories = [
    { key: 'Director', label: 'Director Source Code' },
    { key: 'Ani', label: 'Ani Source Code' },
    { key: 'Diagrammer', label: 'Diagrammer Source Code' }
  ];

  categories.forEach(cat => {
    const catFiles = filtered.filter(f => f.category === cat.key);
    if (catFiles.length === 0) return;

    const header = document.createElement('div');
    header.className = 'lisp-group-header';
    header.innerText = cat.label.toUpperCase();
    container.appendChild(header);

    catFiles.forEach(file => {
      const item = document.createElement('div');
      item.className = `list-item ${appState.selectedLispId === file.id ? 'selected' : ''}`;
      
      item.innerHTML = `
        <div class="list-item-meta">
          <span>${file.folder}</span>
          <span>${file.functions.length} funcs</span>
        </div>
        <div class="list-item-title">${file.filename}</div>
        <div class="list-item-desc">${file.description || ''}</div>
      `;
      
      item.addEventListener('click', () => {
        appState.selectedLispId = file.id;
        renderLispList(search);
        renderLispDetail(file);
      });
      
      container.appendChild(item);
    });
  });
}

function renderLispDetail(file) {
  const container = document.getElementById('lisp-detail-container');
  
  // Highlighting key functions tag list
  let tagListHTML = '';
  file.functions.forEach(func => {
    tagListHTML += `<span class="func-tag" onclick="searchLispCode('${func}')">${func}</span>`;
  });

  container.innerHTML = `
    <div class="lisp-meta-box">
      <h2>Lisp File: ${file.filename}</h2>
      <p><strong>Directory:</strong> ${file.folder} | <strong>Size:</strong> ${file.code.length} bytes</p>
      <p class="lisp-description" style="margin-top: 8px; font-style: italic; color: var(--text-secondary); border-left: 2px solid var(--primary); padding-left: 8px;">${file.description || ''}</p>
      ${file.functions.length > 0 ? `
        <div style="margin-top:10px;"><strong>Function/Form Declarations (${file.functions.length}):</strong></div>
        <div class="function-tag-list">${tagListHTML}</div>
      ` : ''}
    </div>
    <div class="code-container">
      <pre><code>${highlightLispCode(file.code)}</code></pre>
    </div>
  `;
}

// Function tag click to search inside code
window.searchLispCode = function(keyword) {
  const container = document.querySelector('.code-container');
  if (!container) return;
  
  const codeText = container.textContent;
  const keywordIndex = codeText.indexOf(`(${keyword}`);
  
  if (keywordIndex !== -1) {
    // Scroll to the line
    const preElement = container.querySelector('pre');
    const beforeText = codeText.substring(0, keywordIndex);
    const lineCount = beforeText.split('\n').length;
    
    // Rough estimate scrolling
    const scrollAmount = (lineCount - 3) * 19.5; // Line height approx 19.5px
    container.scrollTo({
      top: scrollAmount,
      behavior: 'smooth'
    });
    
    // Temporarily highlight the text
    const codeElement = container.querySelector('code');
    const escapedKwd = keyword.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    const regex = new RegExp(`(\\(${escapedKwd})`, 'g');
    
    // Simple temporary overlay flash
    codeElement.innerHTML = highlightLispCode(codeText).replace(
      new RegExp(`<span class="lisp-keyword">(${escapedKwd})</span>`, 'g'),
      `<span class="lisp-keyword" style="background-color: rgba(255, 176, 0, 0.4); box-shadow: 0 0 10px var(--amber); transition: background-color 2s;">$1</span>`
    );
  }
};

// Custom Lisp Syntax Highlighter
function highlightLispCode(code) {
  // Escape html characters
  let escaped = code
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Muted comments (green)
  escaped = escaped.replace(/(;.*)/g, '<span class="lisp-comment">$1</span>');

  // String literals
  escaped = escaped.replace(/(".*?")/g, '<span class="lisp-string">$1</span>');
  escaped = escaped.replace(/('.*?')/g, '<span class="lisp-string">$1</span>');

  // Lisp keywords and builtins
  const keywords = [
    'defun', 'define-function', 'define-form', 'define-synonym', 'defmacro', 'define', 
    'declare', 'special', 'unspecial', 'special-of', 'cases-of',
    'let', 'do', 'cond', 'and', 'or', 'funcall', 'eval', 'symeval', 'quote', 'progn', 'lambda', 
    'setq', 'insert-receive', 'coutput', 'caddr', 'cadr', 'car', 'cdr', 'cddr', 'getl', 'putprop', 'get',
    'ask', 'simultaneously', 'sequentially', 'repeat', 'parent-of', 'parent.of'
  ];

  // Regex compile keywords
  keywords.forEach(keyword => {
    const regex = new RegExp(`\\b(${keyword})\\b`, 'g');
    escaped = escaped.replace(regex, '<span class="lisp-keyword">$1</span>');
  });

  return escaped;
}

// Add CSS classes for highlighted Lisp components in DOM
const highlighterStyles = document.createElement('style');
highlighterStyles.innerHTML = `
  .lisp-comment { color: #5a7d5a; font-style: italic; }
  .lisp-keyword { color: #ffb000; font-weight: bold; }
  .lisp-string { color: #38bdf8; }
`;
document.head.appendChild(highlighterStyles);


// ==========================================
// DIRECTOR SIMULATOR INTERFACE BINDINGS
// ==========================================

function initDirectorSimulator() {
  const canvas = document.getElementById('director-canvas');
  const interpreter = new DirectorInterpreter(canvas);
  appState.directorInterpreter = interpreter;
  
  // Set up initial state (Grid drawing, etc.)
  interpreter.reset();
  
  // Update actors list panel periodically
  setInterval(updateActorsUI, 500);

  // Bind buttons
  const runBtn = document.getElementById('btn-run-interpreter');
  const clearBtn = document.getElementById('btn-clear-canvas');
  const resetBtn = document.getElementById('btn-reset-interpreter');
  const editor = document.getElementById('director-editor');
  const speedRange = document.getElementById('speed-range');
  const statusLabel = document.getElementById('interpreter-status');

  runBtn.addEventListener('click', () => {
    const code = editor.value.trim();
    if (!code) return;

    try {
      statusLabel.textContent = "RUNNING";
      statusLabel.classList.add('running');
      
      interpreter.run(code);
    } catch (e) {
      alert(`Lisp parsing / execution error: ${e.message}`);
      statusLabel.textContent = "ERROR";
      statusLabel.classList.remove('running');
    }
  });

  clearBtn.addEventListener('click', () => {
    interpreter.drawHistory = [];
    interpreter.clearCanvas();
  });

  resetBtn.addEventListener('click', () => {
    interpreter.reset();
    statusLabel.textContent = "IDLE";
    statusLabel.classList.remove('running');
    updateActorsUI();
  });

  speedRange.addEventListener('input', (e) => {
    const speed = Number(e.target.value);
    // Dynamically adjust move speed of actors
    for (const name in interpreter.actors) {
      // Just adjust base speed if tasks exist
    }
    // We can also bind interpreter tasks speed multiplier
    interpreter.activeTasks.forEach(task => {
      if (task.speed !== undefined) {
        task.speed = speed;
      }
    });
  });

  // Bind Demos load
  document.getElementById('btn-demo-star').addEventListener('click', () => {
    editor.value = `(ask turtle 
  (repeat 5 
    (sequentially 
      (move forward 150) 
      (turn right 144) 
      (wait 5))))`;
  });

  document.getElementById('btn-demo-spiral').addEventListener('click', () => {
    editor.value = `(ask turtle 
  (repeat 36 
    (sequentially 
      (move forward 40) 
      (turn right 45) 
      (move forward 80) 
      (turn right 90)
      (wait 3))))`;
  });

  document.getElementById('btn-demo-race').addEventListener('click', () => {
    editor.value = `(simultaneously
  (ask racer1 
    (sequentially 
      (set color '#ff3333')
      (set x 150) (set y 350)
      (repeat 4 
        (sequentially 
          (move forward 120) 
          (turn right 90) 
          (wait 6)))))
  (ask racer2 
    (sequentially 
      (set color '#3333ff')
      (set x 450) (set y 350)
      (repeat 3 
        (sequentially 
          (move forward 140) 
          (turn left 120) 
          (wait 8))))))`;
  });

  document.getElementById('btn-demo-cinderella').addEventListener('click', () => {
    editor.value = `(sequentially
  ;; 1. Introduction & Setup
  (simultaneously
    (ask cinderella (sequentially (hide) (pen up) (set color '#ff69b4') (set x 200) (set y 250) (set shape 'cinderella') (set size 15) (set heading 90) (show)))
    (ask stepmother (sequentially (hide) (pen up) (set color '#7c3aed') (set x 120) (set y 230) (set shape 'stepmother') (set size 16) (set heading 90) (show)))
    (ask prince (sequentially (hide) (pen up) (set color '#3b82f6') (set x 600) (set y 250) (set shape 'prince') (set size 15) (set heading 270) (show)))
    (ask fairy_godmother (sequentially (hide) (pen up) (set color '#a855f7') (set x 200) (set y 80) (set shape 'fairy_godmother') (set size 14) (set heading 180))))

  (wait 20)

  ;; 2. Kept-Apart (Cinderella sweeps, Stepmother scolds)
  (simultaneously
    (ask cinderella (repeat 3 (sequentially (move forward 15) (wait 5) (move backward 15) (wait 5))))
    (ask stepmother (sequentially (move forward 30) (wait 10) (turn left 30) (wait 10) (turn right 30))))

  (wait 10)

  ;; Cinderella gets pushed back by Stepmother
  (simultaneously
    (ask stepmother (move forward 30))
    (ask cinderella (move backward 50)))

  (wait 20)

  ;; 3. Fairy Godmother appears to help (No-Longer-Kept-Apart)
  (ask fairy_godmother (show))
  (wait 10)
  (ask fairy_godmother (move forward 60))
  (wait 15)
  ;; Magic transformation!
  (simultaneously
    (ask fairy_godmother (repeat 4 (sequentially (turn right 90) (wait 2))))
    (ask cinderella (sequentially (set color '#ffffff') (set size 18) (wait 10))))

  (wait 15)
  ;; Fairy godmother leaves
  (ask fairy_godmother (sequentially (turn left 180) (move forward 60) (hide)))

  (wait 15)

  ;; 4. Meeting & The Ball
  ;; They walk to the center
  (simultaneously
    (ask cinderella (sequentially (turn left 90) (move forward 80) (turn right 90) (move forward 100)))
    (ask prince (sequentially (move forward 150))))

  (wait 20)

  ;; They dance!
  (simultaneously
    (ask cinderella (repeat 18 (sequentially (move forward 10) (turn right 40) (wait 3))))
    (ask prince (repeat 18 (sequentially (move forward 10) (turn right 40) (wait 3)))))

  (wait 20)

  ;; 5. Justice (Stepmother angry, Cinderella & Prince together)
  (simultaneously
    (ask stepmother (sequentially (set color '#ef4444') (repeat 6 (sequentially (turn left 45) (wait 2) (turn right 45) (wait 2))) (turn left 180) (move forward 100)))
    (ask cinderella (sequentially (set x 360) (set y 220) (set heading 90)))
    (ask prince (sequentially (set x 400) (set y 220) (set heading 270)))))`;
  });

  document.getElementById('btn-demo-flower').addEventListener('click', () => {
    editor.value = `(sequentially
  ;; Draw a beautiful background hill using arc
  (ask hillmaker (sequentially
    (hide) (pen up) (set color '#142c14') (set x 380) (set y 380) (set heading 270)
    (arc 250 180)
    (set x 500) (set y 380)
    (arc 150 180)))
  
  (wait 10)

  ;; Setup Sally (parent flower)
  (ask sally (sequentially (hide) (pen up) (set color '#ec4899') (set x 200) (set y 320) (set shape 'flower') (set size 15) (show)))
  (wait 30)
  
  ;; Sally spawns a seed s1
  (ask s1 (sequentially (hide) (pen up) (set color '#34d399') (set x 200) (set y 260) (set shape 'seed') (set size 10) (show) (set heading 135) (move forward 180) (wait 10) (hide)))
  
  ;; Seed lands and sprouts into sally2 (child flower)
  (ask sally2 (sequentially (hide) (pen up) (set color '#8b5cf6') (set x 327) (set y 320) (set shape 'flower') (set size 2) (show) (wait 10) (set size 6) (wait 10) (set size 10) (wait 10) (set size 14)))
  
  (wait 20)
  
  ;; Sally2 spawns its own seed s2
  (ask s2 (sequentially (hide) (pen up) (set color '#34d399') (set x 327) (set y 260) (set shape 'seed') (set size 10) (show) (set heading 135) (move forward 160) (wait 10) (hide)))
  
  ;; Seed lands and sprouts into sally3
  (ask sally3 (sequentially (hide) (pen up) (set color '#3b82f6') (set x 440) (set y 320) (set shape 'flower') (set size 2) (show) (wait 10) (set size 6) (wait 10) (set size 10) (wait 10) (set size 14)))
  
  (wait 20)
  
  ;; Sally3 spawns seed s3
  (ask s3 (sequentially (hide) (pen up) (set color '#34d399') (set x 440) (set y 260) (set shape 'seed') (set size 10) (show) (set heading 135) (move forward 140) (wait 10) (hide)))
  
  ;; Seed lands and sprouts into sally4
  (ask sally4 (sequentially (hide) (pen up) (set color '#f59e0b') (set x 539) (set y 320) (set shape 'flower') (set size 2) (show) (wait 10) (set size 6) (wait 10) (set size 10) (wait 10) (set size 14))))`;
  });

  document.getElementById('btn-demo-blocks').addEventListener('click', () => {
    editor.value = `(sequentially
  ;; Setup environment
  (simultaneously
    (ask table (sequentially (hide) (pen up) (set color '#78350f') (set x 380) (set y 360) (set shape 'table') (set size 30) (show)))
    (ask a (sequentially (hide) (pen up) (set color '#facc15') (set x 300) (set y 322) (set shape 'block') (set size 15) (set heading 0) (show)))
    (ask b (sequentially (hide) (pen up) (set color '#38bdf8') (set x 420) (set y 322) (set shape 'block') (set size 15) (set heading 0) (show)))
    (ask c (sequentially (hide) (pen up) (set color '#f43f5e') (set x 300) (set y 277) (set shape 'block') (set size 15) (set heading 0) (show))))

  (wait 20)

  ;; Step 1: Clear c to the table
  (ask c (sequentially
    (move forward 77)
    (turn left 90)
    (move forward 100)
    (turn left 90)
    (move forward 122)
    (set heading 0)))

  (wait 15)

  ;; Step 2: Stack a on b
  (ask a (sequentially
    (move forward 122)
    (turn right 90)
    (move forward 120)
    (turn right 90)
    (move forward 77)
    (set heading 0)))

  (wait 15)

  ;; Step 3: Stack c on a
  (ask c (sequentially
    (move forward 172)
    (turn right 90)
    (move forward 220)
    (turn right 90)
    (move forward 82)
    (set heading 0))))`;
  });

  document.getElementById('btn-demo-rocket').addEventListener('click', () => {
    editor.value = `(sequentially
  ;; Setup rocket
  (ask fred (sequentially (hide) (pen up) (set color '#cbd5e1') (set x 100) (set y 350) (set heading 45) (set size 15) (show)))
  (wait 10)
  
  ;; Move rocket forward
  (ask fred (move forward 150))
  (wait 10)
  
  ;; Grow rocket
  (ask fred (sequentially (set size 22) (wait 5) (set size 30)))
  (wait 10)
  
  ;; Spawn and launch missile from the rocket's current location (approx 206, 244)
  (simultaneously
    (ask fred (sequentially (repeat 5 (sequentially (move forward 10) (wait 2)))))
    (ask missile (sequentially (hide) (pen up) (set color '#fef08a') (set x 206) (set y 244) (set heading 45) (set size 8) (show) (move forward 350) (hide)))))`;
  });
}

// Update Active Actors UI Panel in Simulator tab
function updateActorsUI() {
  const container = document.getElementById('actors-list');
  if (!container || appState.activeTab !== 'director') return;

  const interpreter = appState.directorInterpreter;
  if (!interpreter) return;

  const actors = Object.keys(interpreter.actors);
  const statusLabel = document.getElementById('interpreter-status');

  if (interpreter.activeTasks.length > 0) {
    statusLabel.textContent = "RUNNING";
    statusLabel.classList.add('running');
  } else {
    statusLabel.textContent = "IDLE";
    statusLabel.classList.remove('running');
  }

  if (actors.length === 0) {
    container.innerHTML = '<div class="no-actors">No active actors. Run a script to create one!</div>';
    return;
  }

  container.innerHTML = '';
  actors.forEach(name => {
    const actor = interpreter.actors[name];
    const card = document.createElement('div');
    card.className = 'actor-card';
    card.innerHTML = `
      <div class="actor-card-header">
        <span class="actor-name-indicator">
          <span class="actor-color-dot" style="background-color: ${actor.color}; box-shadow: 0 0 5px ${actor.color};"></span>
          ${actor.name}
        </span>
        <span class="badge" style="font-size: 8px;">${actor.penDown ? 'PEN DOWN' : 'PEN UP'}</span>
      </div>
      <div class="actor-details-grid">
        <div>X: ${Math.round(actor.x)}</div>
        <div>Y: ${Math.round(actor.y)}</div>
        <div>Heading: ${Math.round(actor.heading)}°</div>
        <div>Size: ${actor.size}</div>
      </div>
    `;
    container.appendChild(card);
  });
}

// ============================================================================
// DIAGRAMER SOLVER WIDGET CONTROLLER
// ============================================================================

// Corner coordinate systems (Responsive styles matching index.html)
const diagramerCorners = [
  { name: 'TL', left: '20px', top: '15px' },                  // 0: Top-Left
  { name: 'TR', left: 'calc(100% - 115px)', top: '15px' },     // 1: Top-Right
  { name: 'BL', left: '20px', top: '120px' },                 // 2: Bottom-Left
  { name: 'BR', left: 'calc(100% - 115px)', top: '120px' }     // 3: Bottom-Right
];

// Interactive Diagramer State
let diagramerState = {
  nodeCorners: {
    'node-maclisp': 0,   // TL
    'node-ani': 1,        // TR
    'node-diagramer': 2,  // BL
    'node-director': 3    // BR
  },
  links: [
    { from: 'node-maclisp', to: 'node-director', label: 'implements', isCrossing: false },
    { from: 'node-director', to: 'node-ani', label: 'runs', isCrossing: false },
    { from: 'node-director', to: 'node-diagramer', label: 'runs', isCrossing: false },
    { from: 'node-ani', to: 'node-diagramer', label: 'coordinates', isCrossing: false }
  ],
  drawInterval: null
};

// Initialize Diagramer widget
function initDiagramerWidget() {
  const viewport = document.getElementById('diagramer-viewport');
  if (!viewport) return; // Exit if elements do not exist yet (e.g. on other pages)

  // 1. Event Listeners
  const shuffleBtn = document.getElementById('btn-diagramer-shuffle');
  const solveBtn = document.getElementById('btn-diagramer-solve');
  const selectEl = document.getElementById('diagramer-select');

  if (shuffleBtn) {
    shuffleBtn.addEventListener('click', shuffleDiagramer);
  }
  if (solveBtn) {
    solveBtn.addEventListener('click', solveDiagramerConstraints);
  }
  if (selectEl) {
    selectEl.addEventListener('change', (e) => {
      loadDiagramerConfig(e.target.value);
    });
  }

  // 2. Initial Setup
  if (selectEl) {
    loadDiagramerConfig(selectEl.value);
  } else {
    updateDiagramerNodeDOM();
    checkDiagramerCrossings();
    setTimeout(() => {
      drawDiagramerLinks();
    }, 100);
  }

  // 3. Redraw on window resize to ensure lines stay aligned
  window.addEventListener('resize', () => {
    if (appState.activeTab === 'dashboard') {
      drawDiagramerLinks();
    }
  });
}

// Apply corner coordinate styles to elements
function updateDiagramerNodeDOM() {
  for (const nodeId in diagramerState.nodeCorners) {
    const el = document.getElementById(nodeId);
    if (!el) continue;
    const cornerIdx = diagramerState.nodeCorners[nodeId];
    const corner = diagramerCorners[cornerIdx];
    el.style.left = corner.left;
    el.style.top = corner.top;
  }
}

// Helper: 2D Line-segment intersection checks (CCW)
function ccwDiagramer(A, B, C) {
  return (C.y - A.y) * (B.x - A.x) > (B.y - A.y) * (C.x - A.x);
}

function intersectDiagramer(A, B, C, D) {
  return ccwDiagramer(A, C, D) !== ccwDiagramer(B, C, D) && 
         ccwDiagramer(A, B, C) !== ccwDiagramer(A, B, D);
}

// Evaluates crossings and updates states
function checkDiagramerCrossings() {
  const viewport = document.getElementById('diagramer-viewport');
  if (!viewport) return false;

  const viewRect = viewport.getBoundingClientRect();
  const getCenter = (nodeId) => {
    const el = document.getElementById(nodeId);
    if (!el) return { x: 0, y: 0 };
    const rect = el.getBoundingClientRect();
    return {
      x: rect.left - viewRect.left + rect.width / 2,
      y: rect.top - viewRect.top + rect.height / 2
    };
  };

  let hasCrossing = false;
  
  // Clear crossings first
  diagramerState.links.forEach(l => l.isCrossing = false);

  // Compare each link pair
  for (let i = 0; i < diagramerState.links.length; i++) {
    for (let j = i + 1; j < diagramerState.links.length; j++) {
      const l1 = diagramerState.links[i];
      const l2 = diagramerState.links[j];

      // Ignore links sharing a common node
      if (l1.from === l2.from || l1.from === l2.to || l1.to === l2.from || l1.to === l2.to) {
        continue;
      }

      const pA = getCenter(l1.from);
      const pB = getCenter(l1.to);
      const pC = getCenter(l2.from);
      const pD = getCenter(l2.to);

      if (intersectDiagramer(pA, pB, pC, pD)) {
        l1.isCrossing = true;
        l2.isCrossing = true;
        hasCrossing = true;
      }
    }
  }

  return hasCrossing;
}

// Redraw SVG connections and labels
function drawDiagramerLinks() {
  const svg = document.getElementById('diagramer-svg');
  const viewport = document.getElementById('diagramer-viewport');
  if (!svg || !viewport) return;

  const viewRect = viewport.getBoundingClientRect();

  // Clear existing paths/text elements (keeping marker defs)
  svg.querySelectorAll('path:not(defs path), text').forEach(el => el.remove());

  diagramerState.links.forEach(link => {
    const fromNode = document.getElementById(link.from);
    const toNode = document.getElementById(link.to);
    if (!fromNode || !toNode) return;

    const fromRect = fromNode.getBoundingClientRect();
    const toRect = toNode.getBoundingClientRect();

    // Node center coordinates
    const x1 = fromRect.left - viewRect.left + fromRect.width / 2;
    const y1 = fromRect.top - viewRect.top + fromRect.height / 2;
    const x2 = toRect.left - viewRect.left + toRect.width / 2;
    const y2 = toRect.top - viewRect.top + toRect.height / 2;

    // Create Path
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', `M ${x1} ${y1} L ${x2} ${y2}`);
    path.setAttribute('marker-end', 'url(#arrow)');
    if (link.isCrossing) {
      path.classList.add('crossing');
    }
    svg.appendChild(path);

    // Create Text Label
    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    const mx = (x1 + x2) / 2;
    const my = (y1 + y2) / 2;
    text.setAttribute('x', mx);
    text.setAttribute('y', my - 6);
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('fill', link.isCrossing ? 'var(--amber)' : 'var(--text-secondary)');
    text.style.fontFamily = 'var(--font-mono)';
    text.style.fontSize = '9px';
    text.style.textShadow = '0 0 3px #030503';
    text.textContent = link.label;
    svg.appendChild(text);
  });
}

// Animate lines synchronously with CSS sliding transition
function animateDiagramerLinks(duration = 600) {
  if (diagramerState.drawInterval) {
    clearInterval(diagramerState.drawInterval);
  }
  const startTime = Date.now();
  diagramerState.drawInterval = setInterval(() => {
    drawDiagramerLinks();
    if (Date.now() - startTime >= duration) {
      clearInterval(diagramerState.drawInterval);
      diagramerState.drawInterval = null;
      drawDiagramerLinks(); // Final precision redraw
    }
  }, 16); // 60fps redraw
}

// Action: Shuffle node corner placements
function shuffleDiagramer() {
  const cornersArray = [0, 1, 2, 3];
  
  // Fisher-Yates shuffle
  for (let i = cornersArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [cornersArray[i], cornersArray[j]] = [cornersArray[j], cornersArray[i]];
  }

  const nodeIds = ['node-maclisp', 'node-ani', 'node-diagramer', 'node-director'];
  nodeIds.forEach((id, idx) => {
    diagramerState.nodeCorners[id] = cornersArray[idx];
  });

  // Slide nodes
  updateDiagramerNodeDOM();

  // Run line crossing checker & animate redraw
  setTimeout(() => {
    const hasCrossing = checkDiagramerCrossings();
    animateDiagramerLinks(600);

    const consoleEl = document.getElementById('diagramer-console');
    if (hasCrossing) {
      consoleEl.innerHTML = `ITS: Nodes shuffled.\n<span style="color:var(--amber);">WARNING: Layout constraint violated! Line crossings detected.</span>\nClick 'Solve Layout' to invoke Diagrammer solver.`;
    } else {
      consoleEl.innerHTML = `ITS: Nodes shuffled.\n<span style="color:var(--text-bright);">SUCCESS: Constraint check passed. No crossings detected.</span>`;
    }
  }, 50);
}

// Action: Solve layout constraints based on diagrm.92 rules
function solveDiagramerConstraints() {
  const consoleEl = document.getElementById('diagramer-console');
  
  // Recheck crossings at current position
  let hasCrossing = checkDiagramerCrossings();
  
  if (!hasCrossing) {
    consoleEl.innerHTML = `ITS: Executing Diagrammer layout constraints...\nNo crossings detected. All nodes are placed correctly.`;
    drawDiagramerLinks();
    return;
  }

  consoleEl.innerHTML = `ITS: Executing Diagrammer layout constraints...\nLine crossings detected. Running Lisp expert solver...`;

  // Swap Bottom-Left (2) and Bottom-Right (3) nodes to resolve crossing
  setTimeout(() => {
    const nodeAtBL = Object.keys(diagramerState.nodeCorners).find(k => diagramerState.nodeCorners[k] === 2);
    const nodeAtBR = Object.keys(diagramerState.nodeCorners).find(k => diagramerState.nodeCorners[k] === 3);

    if (nodeAtBL && nodeAtBR) {
      // Swap corners in state
      diagramerState.nodeCorners[nodeAtBL] = 3;
      diagramerState.nodeCorners[nodeAtBR] = 2;

      consoleEl.innerHTML = `ITS: Swap detected for (CORNER LOWER LEFT) and (CORNER LOWER RIGHT).\nSwapping <span style="color:var(--text-bright);">${document.getElementById(nodeAtBL).textContent}</span> and <span style="color:var(--text-bright);">${document.getElementById(nodeAtBR).textContent}</span>.`;

      // Update positions on page
      updateDiagramerNodeDOM();

      // Trigger line animations during translation
      animateDiagramerLinks(600);

      // Verify layout is resolved after animation completes
      setTimeout(() => {
        const stillCrossing = checkDiagramerCrossings();
        drawDiagramerLinks(); // Precision redraw
        if (!stillCrossing) {
          consoleEl.innerHTML = `ITS: Swap executed successfully.\n<span style="color:var(--text-bright);">SUCCESS: Constraint solver complete. No crossings remain.</span>`;
        } else {
          consoleEl.innerHTML = `ITS: Swap executed.\nSome crossings remain. Running solver iteration...`;
        }
      }, 650);
    }
  }, 1000); // 1s delay for read-time pacing
}

// ============================================================================
// DIAGRAMER DYNAMIC SCHEMAS
// ============================================================================

const diagramerConfigs = {
  'mit-ai': {
    nodes: {
      'node-maclisp': 'MacLisp',
      'node-ani': 'Ani',
      'node-diagramer': 'Diagramer',
      'node-director': 'Director'
    },
    links: [
      { from: 'node-maclisp', to: 'node-director', label: 'impl. in', isCrossing: false },
      { from: 'node-director', to: 'node-ani', label: 'compiled by', isCrossing: false },
      { from: 'node-director', to: 'node-diagramer', label: 'used by', isCrossing: false },
      { from: 'node-ani', to: 'node-diagramer', label: 'uses', isCrossing: false }
    ],
    code: `;; MIT AI Lab System Schema
(define maclisp boxed-text
  (set your text to |MacLisp|))
(define director boxed-text
  (set your text to |Director|))
(define ani boxed-text
  (set your text to |Ani|))
(define diagramer boxed-text
  (set your text to |Diagramer|))

(define maclisp-to-director link
  (label link from maclisp to director with |impl. in|))
(define director-to-diagramer link
  (label link from director to diagramer with |used by|))
(define director-to-ani link
  (label link from director to ani with |compiled by|))
(define ani-to-diagramer link
  (label link from ani to diagramer with |uses|))`
  },
  'd10': {
    nodes: {
      'node-maclisp': 'Ani',
      'node-ani': 'Director',
      'node-diagramer': 'Comp. Anim',
      'node-director': 'Education'
    },
    links: [
      { from: 'node-maclisp', to: 'node-ani', label: 'written in', isCrossing: false },
      { from: 'node-ani', to: 'node-diagramer', label: 'used for', isCrossing: false },
      { from: 'node-ani', to: 'node-director', label: 'used for', isCrossing: false },
      { from: 'node-maclisp', to: 'node-diagramer', label: 'makes', isCrossing: false }
    ],
    code: `;; D10 Computer Animation Concept (diguse.21)
(define ani boxed-text)
(define director boxed-text)
(define ca boxed-text
  (set your text to |Computer Animation|))
(define ed boxed-text
  (set your text to |Education|))

(define ani-to-director link 
  (label link from ani to director with |written in|))
(define director-to-ca link
  (label link from director to ca with |used for|))
(define director-to-ed link
  (label link from director to ed with |used for|))
(define ani-to-ca link
  (label link from ani to ca with |makes|))`
  },
  'chcho': {
    nodes: {
      'node-maclisp': 'Gather Sugs',
      'node-ani': 'Combine Sugs',
      'node-diagramer': 'Resolve Confl',
      'node-director': 'Choose Value'
    },
    links: [
      { from: 'node-maclisp', to: 'node-ani', label: 'some found', isCrossing: false },
      { from: 'node-ani', to: 'node-maclisp', label: 'not enough', isCrossing: false },
      { from: 'node-ani', to: 'node-diagramer', label: 'conflicts', isCrossing: false },
      { from: 'node-diagramer', to: 'node-director', label: 'compromise', isCrossing: false },
      { from: 'node-ani', to: 'node-director', label: 'OK', isCrossing: false },
      { from: 'node-diagramer', to: 'node-maclisp', label: 'need info', isCrossing: false }
    ],
    code: `;; chcho: DANI Solver Decision Flow (choose.198)
(define-form (chcho)
 (link |Gather Suggestions| |some found| |Combine Suggestions|)
 (link |Combine Suggestions| |not good enough| |Gather Suggestions|)
 (link |Combine Suggestions| |conflicts found| |Resolve Conflicts|)
 (link |Resolve Conflicts| |compromise or reject| |Choose Value|)
 (link |Combine Suggestions| |OK| |Choose Value|)
 (link |Resolve Conflicts| |need more information| |Gather Suggestions|))`
  }
};

function loadDiagramerConfig(configKey) {
  const config = diagramerConfigs[configKey];
  if (!config) return;

  // 1. Update DOM node text labels
  for (const nodeId in config.nodes) {
    const el = document.getElementById(nodeId);
    if (el) {
      el.textContent = config.nodes[nodeId];
    }
  }

  // 2. Load deep copy of connections list into active state
  diagramerState.links = JSON.parse(JSON.stringify(config.links));

  // 3. Reset corners to defaults (0=TL, 1=TR, 2=BL, 3=BR)
  const nodeIds = ['node-maclisp', 'node-ani', 'node-diagramer', 'node-director'];
  nodeIds.forEach((id, idx) => {
    diagramerState.nodeCorners[id] = idx;
  });

  // 4. Update element positions with transition animations
  updateDiagramerNodeDOM();

  // 5. Update right-hand source code container
  const codeBlock = document.getElementById('diagramer-code-block');
  if (codeBlock) {
    codeBlock.innerHTML = highlightLispCode(config.code);
  }

  // 6. Reset solver feedback log
  const consoleEl = document.getElementById('diagramer-console');
  if (consoleEl) {
    consoleEl.innerHTML = `ITS: DIAGRAMER LOADED SCHEMA [${configKey.toUpperCase()}]. READY.`;
  }

  // 7. Check for line crossovers and draw
  setTimeout(() => {
    const hasCrossing = checkDiagramerCrossings();
    drawDiagramerLinks();
    if (hasCrossing && consoleEl) {
      consoleEl.innerHTML = `ITS: DIAGRAMER LOADED SCHEMA [${configKey.toUpperCase()}].\n<span style="color:var(--amber);">WARNING: Crossing detected in default layout. Click 'Solve Layout' to untangle.</span>`;
    }
  }, 50);
}


// ============================================================================
// DANI / ANI PLANNER COMPILER IMPLEMENTATION
// ============================================================================

const aniScenesData = {
  intro: {
    code: `;; Cinderella Scene 1: Introduction (cindy.46)
(define introduction scene
  (process initial description
     (and (establish (personality cinderella))
          (establish (emotional-state cinderella (joy (positive low))))
          (establish (personality step-mother))
          (establish (emotional-state step-mother (joy (positive low))))
          (establish (relationship (relationship-of step-mother cinderella)))
          (establish (relationship (relationship-of cinderella step-mother)))))
  (set your rhythm to normal)
  (set your length to long))`,
    traces: [
      "ITS: Loading CINDY.46 scene definition 'introduction'...",
      "ITS: Resolving character attributes & roles:\n  - cinderella: beautiful, shabby, friendly, shy\n  - stepmother: ugly, mean, selfish, strong, evil\n  - prince: beautiful, strong, stubborn, determined",
      "ITS: Creating choice point [cinderella-intro-position]...\n  - absolute suggestion: x=200, y=250, heading=90\n  - priority weights check: OK\n  - Result: cinderella placed at (200, 250)",
      "ITS: Creating choice point [stepmother-intro-position]...\n  - neighbor suggestion: step-mother resides left-of cinderella\n  - relative coordinates: x=120, y=230, heading=90\n  - Result: stepmother placed at (120, 230)",
      "ITS: Establishing initial relationships:\n  - (relationship-of step-mother cinderella): dominates, hates\n  - (relationship-of cinderella step-mother): is-obedient-to, is-tolerant-of",
      "ITS: Character 'prince' placed at background (x=600, y=250, heading=270).",
      "ITS: DANI compile-actors succeeded.\nGenerated Director S-expressions. Ready to animate."
    ],
    directorScript: `(sequentially
  ;; 1. Introduction & Setup
  (simultaneously
    (ask cinderella (sequentially (hide) (pen up) (set color '#ff69b4') (set x 200) (set y 250) (set shape 'cinderella') (set size 15) (set heading 90) (show)))
    (ask stepmother (sequentially (hide) (pen up) (set color '#7c3aed') (set x 120) (set y 230) (set shape 'stepmother') (set size 16) (set heading 90) (show)))
    (ask prince (sequentially (hide) (pen up) (set color '#3b82f6') (set x 600) (set y 250) (set shape 'prince') (set size 15) (set heading 270) (show)))
    (ask fairy_godmother (sequentially (hide) (pen up) (set color '#a855f7') (set x 200) (set y 80) (set shape 'fairy_godmother') (set size 14) (hide))))
  (wait 25))`
  },
  'kept-apart': {
    code: `;; Cinderella Scene 2: Kept-Apart (cindy.46)
(define kept-apart scene
  (process initial description
     (sequence: (convey (wants cinderella (meets cinderella prince)))
                (convey (prevents step-mother (meets cinderella prince)))
                (and (establish (emotional-state cinderella (joy (negative high))))
                     (establish (emotional-state step-mother
                                               (and (joy (positive medium))
                                                    (pride (positive medium))))))))
  (set your mood to (changes hopeful depressing))
  (set your rhythm to (changes fast slow))
  (set your length to long))`,
    traces: [
      "ITS: Loading CINDY.46 scene definition 'kept-apart'...",
      "ITS: Analyzing subscene goals:\n  - (convey (wants cinderella (meets cinderella prince))) -> cinderella steps forward\n  - (convey (prevents step-mother (meets cinderella prince))) -> stepmother blocks path",
      "ITS: Conflict detected! [stepmother-blocks-cinderella]\n  - S-expression source: (prevents step-mother (meets cinderella prince))\n  - Creating choice point: [stepmother-conflict-resolution]\n  - Gathering suggestions:\n    * absolute suggestion: (scold cinderella) [weight: 4]\n    * relative suggestion: (stay-between cinderella prince) [weight: 8]",
      "ITS: Running CHOOSE.198 solver [resolve-on-suggestion-strengths]...\n  - Suggestion (stay-between) has weight 8 (much-greater-than 4).\n  - Winner: stepmother blocks path. Stepmother scolds, cinderella pushed back.",
      "ITS: Generating emotional expression animations:\n  - cinderella: (joy (negative high)) -> sweep floor, shrink size\n  - stepmother: (joy (positive medium)) -> strut, turn back and forth",
      "ITS: DANI compile-actors succeeded.\nGenerated Director S-expressions. Ready to animate."
    ],
    directorScript: `(sequentially
  ;; 2. Kept-Apart (Cinderella sweeps, Stepmother scolds)
  (simultaneously
    (ask cinderella (repeat 3 (sequentially (move forward 15) (wait 5) (move backward 15) (wait 5))))
    (ask stepmother (sequentially (move forward 30) (wait 10) (turn left 30) (wait 10) (turn right 30))))
  (wait 10)
  ;; Cinderella gets pushed back by Stepmother
  (simultaneously
    (ask stepmother (move forward 30))
    (ask cinderella (move backward 50)))
  (wait 20))`
  },
  'no-longer-kept-apart': {
    code: `;; Cinderella Scene 3: No-Longer-Kept-Apart (cindy.46)
(define no-longer-kept-apart scene
  (process initial description
     (convey (undoes fairy-godmother
             (from-scene kept-apart
                  (convey (prevents step-mother
                            (meets cinderella prince)))))))
  (set your mood to (and joyous anticipatory))
  (set your rhythm to fast)
  (set your length to short))`,
    traces: [
      "ITS: Loading CINDY.46 scene definition 'no-longer-kept-apart'...",
      "ITS: Resolving action: (convey (undoes fairy-godmother (prevents step-mother ...)))\n  - Character 'fairy-godmother' is protective and generous.",
      "ITS: Creating choice point [fairy-godmother-arrival]...\n  - Result: fairy_godmother descends from (200, 80) to (200, 140) and becomes visible.",
      "ITS: Planning Cinderella transformation: (change (physical cinderella shabby) (physical cinderella elegant))\n  - Creating choice point [transformation-effect]\n  - Suggestions gathered:\n    * magic-glow (strength=high)\n    * color-swap (strength=medium)\n  - Combining suggestions: (magic-glow and color-swap)\n  - Result: Fairy-godmother rotates, Cinderella turns white/silver and increases size.",
      "ITS: Stepmother actor deactivated during magic intervention.",
      "ITS: DANI compile-actors succeeded.\nGenerated Director S-expressions. Ready to animate."
    ],
    directorScript: `(sequentially
  ;; 3. Fairy Godmother appears to help (No-Longer-Kept-Apart)
  (ask fairy_godmother (show))
  (wait 10)
  (ask fairy_godmother (move forward 60))
  (wait 15)
  ;; Magic transformation!
  (simultaneously
    (ask fairy_godmother (repeat 4 (sequentially (turn right 90) (wait 2))))
    (ask cinderella (sequentially (set color '#ffffff') (set size 18) (wait 10))))
  (wait 15)
  ;; Fairy godmother leaves
  (ask fairy_godmother (sequentially (turn left 180) (move forward 60) (hide)))
  (wait 15))`
  },
  meeting: {
    code: `;; Cinderella Scene 4: Meeting (cindy.46)
(define meeting scene
 (process initial description
    (sequence:
     (convey (alone cinderella prince))
     (convey (getting-it-on cinderella prince))
     (and (establish (relationship (relationship-of prince cinderella)))
          (establish (relationship (relationship-of cinderella prince))))
     (and (establish (emotional-state prince (joy (positive high))))
          (establish (emotional-state cinderella (joy (positive high)))))))
 (set your mood to (very joyous))
 (set your rhythm to fast)
 (set your length to long))`,
    traces: [
      "ITS: Loading CINDY.46 scene definition 'meeting'...",
      "ITS: Resolving constraint: (convey (alone cinderella prince))\n  - Hiding other actors (fairy_godmother, stepmother).",
      "ITS: Resolving action: (convey (getting-it-on cinderella prince))\n  - 'getting-it-on' maps to (meets cinderella prince) + (dance cinderella prince).\n  - Creating choice point [meeting-point-coordinates]...\n    * suggestion: center of dance hall (380, 220)\n  - Result: Cinderella and Prince walk to center.",
      "ITS: Planning dance choreography (joy (positive high)):\n  - Heuristics suggest waltz movement (repeat angular steps in sync).\n  - Result: Simultaneously rotate around center offset by 40px.",
      "ITS: Establishing dual relationship: loves (cinderella prince) & loves (prince cinderella).",
      "ITS: DANI compile-actors succeeded.\nGenerated Director S-expressions. Ready to animate."
    ],
    directorScript: `(sequentially
  ;; 4. Meeting & The Ball
  ;; They walk to the center
  (simultaneously
    (ask cinderella (sequentially (turn left 90) (move forward 80) (turn right 90) (move forward 100)))
    (ask prince (sequentially (move forward 150))))
  (wait 20)
  ;; They dance!
  (simultaneously
    (ask cinderella (repeat 18 (sequentially (move forward 10) (turn right 40) (wait 3))))
    (ask prince (repeat 18 (sequentially (move forward 10) (turn right 40) (wait 3)))))
  (wait 20))`
  },
  justice: {
    code: `;; Cinderella Scene 5: Justice (cindy.46)
(define justice scene
  (process initial description
     (and (convey (aware step-mother (getting-it-on prince cinderella)))
          (convey (getting-it-on prince cinderella))
          (establish (emotional-state step-mother (joy (negative high))))))
  (set your mood to joyous)
  (set your length to medium))`,
    traces: [
      "ITS: Loading CINDY.46 scene definition 'justice'...",
      "ITS: Resolving constraint: (convey (aware step-mother ...))\n  - Stepmother walks back in to discover cinderella and prince together.",
      "ITS: Planning emotional state: (emotional-state step-mother (joy (negative high)))\n  - Stepmother is evil/selfish -> anger (negative-joy) action.\n  - Anger maps to red color flashing and aggressive turning.\n  - Result: stepmother turns red (#ef4444), shakes, and exits left in defeat.",
      "ITS: Establishing final frame alignment:\n  - Cinderella and prince stand next to each other at center.",
      "ITS: DANI compile-actors succeeded.\nGenerated Director S-expressions. Ready to animate."
    ],
    directorScript: `(sequentially
  ;; 5. Justice (Stepmother angry, Cinderella & Prince together)
  (simultaneously
    (ask stepmother (sequentially (set color '#ef4444') (repeat 6 (sequentially (turn left 45) (wait 2) (turn right 45) (wait 2))) (turn left 180) (move forward 100)))
    (ask cinderella (sequentially (set x 360) (set y 220) (set heading 90)))
    (ask prince (sequentially (set x 400) (set y 220) (set heading 270))))
  (wait 25))`
  },
  all: {
    code: `;; -*-lisp-*-

(include |ai:ken;declar >|)

(defcomment cindy) ;for tags

(define cinderella character
	(process initial description
		 (physical (and beautiful shabby))
		 (personality (and good friendly hard-working shy))
		 (role-in-story most-important)))

(define step-mother character
	(process initial description
		 (physical ugly)
		 (personality (and mean selfish strong evil))))

(define (relationship-of step-mother cinderella) relationship
	(process initial description
		 (and dominates hates)))

(define (relationship-of cinderella step-mother) relationship
	(process initial description
		 (and is-obedient-to is-tolerant-of)))


(define fairy-godmother character
	(process initial description
		 (physical (and pretty magical))
		 (personality (and good kind strong))))

(define (relationship-of cinderella fairy-godmother) relationship
	(process initial description
		 (and is-polite-to is-grateful-to)))

(define (relationship-of fairy-godmother cinderella) relationship
	(process initial description
		 (and is-protective-of is-generous-towards is-helpful-towards)))

(define prince character
	(process initial description
		 (physical (and beautiful strong)) 
		 (personality (and good stubborn determined))))

(define (relationship-of cinderella prince) relationship
	(process initial description
		 loves))

(define (relationship-of prince cinderella) relationship
	(process initial description
		 loves))

(define introduction scene
	(process initial description
		 (and (establish (personality cinderella))
		      (establish (emotional-state cinderella (joy (positive low))))
		      (establish (personality step-mother))
		      (establish (emotional-state step-mother (joy (positive low))))
		      (establish (relationship (relationship-of step-mother cinderella)))
		      (establish (relationship (relationship-of cinderella step-mother)))))
	(set your rhythm to normal);this is relative to the film's rhythm
	(set your length to long))

(define kept-apart scene
	(process initial description
		 (sequence: (convey (wants cinderella (meets cinderella prince)))
			    (convey (prevents step-mother (meets cinderella prince)))
			    (and (establish (emotional-state cinderella (joy (negative high))))
				 (establish
				  (emotional-state step-mother
						   (and (joy (positive medium))
							(pride (positive medium))))))))
	(set your mood to (changes hopeful depressing))
	(set your rhythm to (changes fast slow))
	(set your length to long))


;;(define step-mother-goes scene
;;	(process initial description (display (exit-by step-mother)))
;;	(set your mood to depressing)
;;	(set your rhythm to slow)
;;	(set your length to short))
;;
;;;;skip this one for a while (or forever?)
;;
;;(define introduce-fairy-godmother scene
;;	(process initial description
;;		 (establish (personality fairy-godmother)))
;;	(set your mood to depressing)
;;	(set your rhythm to picking-up))
;;
;;;;this might never get done --- ho well
;;
;;(define cinderella-beautified scene
;;	(process initial description
;;		 (sequence:
;;		  (convey (causes fairy-godmother 
;;				  (change (physical cinderella shabby)
;;					  (physical cinderella elegant))))
;;		  (and
+;;		   (establish (emotional-state cinderella (joy (positive high))))
+;;		   (establish (emotional-state fairy-godmother (joy (positive medium)))))))
;;	(set your mood to (changes depressing joyous))
;;	(set your rhythm to picking-up)
;;	(set your length to long))

(define no-longer-kept-apart scene
	(process initial description
		 (convey (undoes fairy-godmother
				 (from-scene kept-apart
					     (convey (prevents step-mother
							       (meets cinderella prince)))))))
	(set your mood to (and joyous anticipatory))
	(set your rhythm to fast)
	(set your length to short))



;;(define pre-meeting scene
;;	(process initial description
;;		 (and (establish (emotional-state cinderella (anticipation high)))
;;		      (establish (personality prince))
;;		      (establish (emotional-state prince (and (joy (negative low))
;;							      (loneliness high))))))
;;	(set your mood to anticipatory))

;;gota say that they meet first

(define meeting scene
 (process initial description
	  (sequence:
	   (convey (alone cinderella prince))
	   ;;gets rid of fairy-godmother and step-mother
	   (convey (getting-it-on cinderella prince))
	   (and (establish (relationship (relationship-of prince cinderella)))
		(establish (relationship (relationship-of cinderella prince))))
	   (and (establish (emotional-state prince (joy (positive high))))
		(establish (emotional-state cinderella (joy (positive high)))))))
 (set your mood to (very joyous))
 (set your rhythm to fast)
 (set your length to long))

 
(define justice scene
	(process initial description
		 (and (convey (aware step-mother (getting-it-on prince cinderella)))
		      (convey (getting-it-on prince cinderella))
		      (establish (emotional-state step-mother (joy (negative high))))))
	(set your mood to joyous)
	(set your length to medium))

;;add focus and point, a few others to this

(declare (coutput (read))) ;;dont want the side effects upon (... level) lost

(define cinderella-film film
	(set your level of variety to medium)
	(set your level of complexity to low)
	(set your level of originality to low)
	(set your film-length to (interval (minutes 2) (minutes 5)))
	(set your level of rhythm to high) ;; medium-fast was here but not supported so...
	(set your mood to scene-dependent)
	(set your level of coherence to high)
	(set your level of obviousness to high)
	(set your level of flashiness to low)
	(set your level of energy to high)
	(set your focus to the-films-focus))

;;more to come for focus

(define the-films-focus focus
 (set your order-of-character+element-type+element to (characters element-types elements))
 (set your parts-of-the-focus to
      (cinderella no-longer-kept-apart kept-apart
                 (relationship-of cinderella step-mother)
                 (relationship-of step-mother cinderella))))
						  
(compile-actors)
`,
    traces: [
      "ITS: Starting full film compile for 'cinderella-film'...",
      "ITS: Initializing character database from CINDY.46...",
      "ITS: Compiling Scene 1: Introduction...\n  - Establishing initial character descriptors... OK.\n  - Placing initial actor layouts... OK.",
      "ITS: Compiling Scene 2: Kept-Apart...\n  - Analyzing wants vs prevents conflicts...\n  - Running CHOOSE.198 conflict resolution heuristics... OK.",
      "ITS: Compiling Scene 3: No-Longer-Kept-Apart...\n  - Resolving fairy-godmother transformation script... OK.",
      "ITS: Compiling Scene 4: Meeting...\n  - Compiling alone and dance waltz steps... OK.",
      "ITS: Compiling Scene 5: Justice...\n  - Handling stepmother awareness conflict and exit... OK.",
      "ITS: Stitching scene Director Lisp commands sequentially...",
      "ITS: Compilation complete! Total compiled actors: 4. Compiled frames: 180. Size: 2.3KB.",
      "ITS: ANI/DANI compiled film ready for Director Simulator."
    ],
    directorScript: `(sequentially
  ;; 1. Introduction & Setup
  (simultaneously
    (ask cinderella (sequentially (hide) (pen up) (set color '#ff69b4') (set x 200) (set y 250) (set shape 'cinderella') (set size 15) (set heading 90) (show)))
    (ask stepmother (sequentially (hide) (pen up) (set color '#7c3aed') (set x 120) (set y 230) (set shape 'stepmother') (set size 16) (set heading 90) (show)))
    (ask prince (sequentially (hide) (pen up) (set color '#3b82f6') (set x 600) (set y 250) (set shape 'prince') (set size 15) (set heading 270) (show)))
    (ask fairy_godmother (sequentially (hide) (pen up) (set color '#a855f7') (set x 200) (set y 80) (set shape 'fairy_godmother') (set size 14) (hide))))

  (wait 20)

  ;; 2. Kept-Apart (Cinderella sweeps, Stepmother scolds)
  (simultaneously
    (ask cinderella (repeat 3 (sequentially (move forward 15) (wait 5) (move backward 15) (wait 5))))
    (ask stepmother (sequentially (move forward 30) (wait 10) (turn left 30) (wait 10) (turn right 30))))

  (wait 10)

  ;; Cinderella gets pushed back by Stepmother
  (simultaneously
    (ask stepmother (move forward 30))
    (ask cinderella (move backward 50)))

  (wait 20)

  ;; 3. Fairy Godmother appears to help (No-Longer-Kept-Apart)
  (ask fairy_godmother (show))
  (wait 10)
  (ask fairy_godmother (move forward 60))
  (wait 15)
  ;; Magic transformation!
  (simultaneously
    (ask fairy_godmother (repeat 4 (sequentially (turn right 90) (wait 2))))
    (ask cinderella (sequentially (set color '#ffffff') (set size 18) (wait 10))))

  (wait 15)
  ;; Fairy godmother leaves
  (ask fairy_godmother (sequentially (turn left 180) (move forward 60) (hide)))

  (wait 15)

  ;; 4. Meeting & The Ball
  ;; They walk to the center
  (simultaneously
    (ask cinderella (sequentially (turn left 90) (move forward 80) (turn right 90) (move forward 100)))
    (ask prince (sequentially (move forward 150))))

  (wait 20)

  ;; They dance!
  (simultaneously
    (ask cinderella (repeat 18 (sequentially (move forward 10) (turn right 40) (wait 3))))
    (ask prince (repeat 18 (sequentially (move forward 10) (turn right 40) (wait 3)))))

  (wait 20)

  ;; 5. Justice (Stepmother angry, Cinderella & Prince together)
  (simultaneously
    (ask stepmother (sequentially (set color '#ef4444') (repeat 6 (sequentially (turn left 45) (wait 2) (turn right 45) (wait 2))) (turn left 180) (move forward 100)))
    (ask cinderella (sequentially (set x 360) (set y 220) (set heading 90)))
    (ask prince (sequentially (set x 400) (set y 220) (set heading 270)))))`
  }
};

function initAniPlanner() {
  const sceneSelect = document.getElementById('ani-scene-select');
  const codeBlock = document.getElementById('ani-code-block');
  const consoleEl = document.getElementById('ani-console');
  const compileBtn = document.getElementById('btn-ani-compile');
  const runBtn = document.getElementById('btn-ani-run-sim');

  if (!sceneSelect || !codeBlock || !consoleEl || !compileBtn || !runBtn) return;

  let activeCompiledScript = "";

  function loadActiveScene() {
    const sceneKey = sceneSelect.value;
    const scene = aniScenesData[sceneKey];
    if (scene) {
      codeBlock.innerHTML = highlightLispCode(scene.code);
      consoleEl.innerHTML = `ITS: SCENE [${sceneKey.toUpperCase()}] LOADED.\nCLICK 'COMPILE & PLAN STORY' TO RUN DANI COMPILER.`;
      runBtn.disabled = true;
      activeCompiledScript = "";
    }
  }

  sceneSelect.addEventListener('change', loadActiveScene);
  loadActiveScene(); // initial load

  compileBtn.addEventListener('click', () => {
    const sceneKey = sceneSelect.value;
    const scene = aniScenesData[sceneKey];
    if (!scene) return;

    compileBtn.disabled = true;
    compileBtn.textContent = "⚡ Planning...";
    runBtn.disabled = true;
    consoleEl.textContent = "";

    let traceIdx = 0;
    function printNextTrace() {
      if (traceIdx < scene.traces.length) {
        consoleEl.textContent += (traceIdx > 0 ? "\n" : "") + scene.traces[traceIdx];
        consoleEl.scrollTop = consoleEl.scrollHeight;
        traceIdx++;
        setTimeout(printNextTrace, 400); // 400ms pace for cool scrolling effect
      } else {
        compileBtn.disabled = false;
        compileBtn.textContent = "⚡ Compile & Plan Story";
        runBtn.disabled = false;
        activeCompiledScript = scene.directorScript;
      }
    }

    printNextTrace();
  });

  runBtn.addEventListener('click', () => {
    if (!activeCompiledScript) return;

    // 1. Switch to Director Simulator tab
    const directorTabButton = document.querySelector('.nav-item[data-tab="director"]');
    if (directorTabButton) {
      directorTabButton.click();
    }

    // 2. Load compiled script into editor
    const editor = document.getElementById('director-editor');
    const runInterpreterBtn = document.getElementById('btn-run-interpreter');
    if (editor && runInterpreterBtn) {
      editor.value = activeCompiledScript;
      
      // Auto run simulation after a short delay so the tab transition finishes
      setTimeout(() => {
        runInterpreterBtn.click();
      }, 300);
    }
  });
}

// ============================================================================
// TURTLE TERMINAL (TT2500) LOGO SIMULATOR IMPLEMENTATION
// ============================================================================
const LOGO_SOURCE = `
MAKE 'RT '2340
 
TO PAR :L :S :ANGLE :COUNT
1 IF :COUNT = 0 THEN STOP
10 IF :COUNT \\ 2 = 0 THEN SPIN :S ELSE SPIN $-$ :S
20 FD :L
30 RT :ANGLE
40 PAR :L :S :ANGLE :COUNT - 1
END
 
TO MSF :MV :SP :FD :COUNT :FD.INC
5 IF :COUNT = 0 THEN STOP
10 MOVE :MV
20 SPIN :SP
30 FD :FD
35 MOVE *$* (-2) :MV
37 SPIN -2 * :SP
40 MSF :MV :SP :FD + :FD.INC :COUNT - 1 :FD.INC
END
 
TO FACE :N
10 IF :N = 0 THEN STOP
20 RT 30 PU FD 95 PD FD 5 PU BK 100
30 FACE :N - 1
END
 
TO LIN :S :S2 :D1 :D2
10 SPIN :S
20 FD :D1
30 SPIN :S2
40 FD :D2
50 HM
END
 
TO LINES :RT :I :T
10 IF :T = 0 THEN STOP
15 LIN 40
20 RT :RT
30 LINES (:RT + :I) :I (:T - 1)
END
 
TO FOO :I :INC :SP
10 FD :I
20 SPIN :SP
30 FOO :I + :INC :INC :SP
END
 
TO FAN :T :R :I :S1 :S2 :D1 :D2
10 IF :T = 0 THEN STOP
20 RT :R
30 LIN :S1 :S2 :D1 :D2
40 FAN (:T - 1) (:R + :I) :I :S1 :S2 :D1 :D2
END

TO CLOCK
FACE 12
HOUR
MINUTE
SECOND
END

TO FACE :N
10 IF :N = 0 THEN STOP
20 RT 30 PU FD 95 PD FD 5 PU BK 100
30 FACE :N - 1
END

TO HOUR
HM
PD
SPIN 1 / 3600
FD 60
END

TO MINUTE
HM
SPIN 1 / 60
FD 90
END

TO SECOND
HM
SPIN 1
FD 100
END
`;
 
// ----------------------------------------------------------------------------
// Tokenizer
//   FIX vs. original: the regex now recognises the genuine MIT operator forms
//   `$-$` (verbalised unary minus) and `$*$` (verbalised multiply), as well as
//   the `-$-` / `*$*` variants. The old regex matched `-$-`/`*$*` but NOT
//   `$-$`, so `SPIN $-$ :S` in PAR silently tokenised to ['$','-','$'] and the
//   spin rate evaluated to the string "$". PAR's odd levels therefore never
//   counter-rotated.
// ----------------------------------------------------------------------------
function tokenize(str) {
  const tokenRegex = /(:[a-zA-Z_][a-zA-Z0-9_\.]*|[0-9]+(?:\.[0-9]+)?|'?[a-zA-Z_][a-zA-Z0-9_\.]*|\$-\$|\$\*\$|-\$-|\*\$\*|[-\+\*\/\(\)=\\\$'])/g;
  let matches = str.match(tokenRegex) || [];
  return matches.map(t => t.trim()).filter(t => t.length > 0);
}
 
// ---- Expression parser -----------------------------------------------------
function parseExpression(tokens, state) { return parseCompare(tokens, state); }
 
function parseCompare(tokens, state) {
  let expr = parseAddSub(tokens, state);
  while (state.index < tokens.length && tokens[state.index] === '=') {
    state.index++;
    expr = { type: 'binary', op: '=', left: expr, right: parseAddSub(tokens, state) };
  }
  return expr;
}
 
function parseAddSub(tokens, state) {
  let expr = parseMulDivMod(tokens, state);
  while (state.index < tokens.length && (tokens[state.index] === '+' || tokens[state.index] === '-')) {
    const op = tokens[state.index]; state.index++;
    expr = { type: 'binary', op, left: expr, right: parseMulDivMod(tokens, state) };
  }
  return expr;
}
 
function parseMulDivMod(tokens, state) {
  let expr = parsePrefix(tokens, state);
  while (state.index < tokens.length && (tokens[state.index] === '*' || tokens[state.index] === '/' || tokens[state.index] === '\\')) {
    const op = tokens[state.index]; state.index++;
    expr = { type: 'binary', op, left: expr, right: parsePrefix(tokens, state) };
  }
  return expr;
}
 
function parsePrefix(tokens, state) {
  if (state.index >= tokens.length) throw new Error("Unexpected end of expression");
  const token = tokens[state.index];
 
  if (token === '$-$' || token === '-$-') {           // verbalised unary minus
    state.index++;
    return { type: 'unary', op: '$-$', operand: parsePrefix(tokens, state) };
  }
  if (token === '-') {
    state.index++;
    return { type: 'unary', op: '-', operand: parsePrefix(tokens, state) };
  }
  if (token === '$*$' || token === '*$*') {            // verbalised multiply (prefix, 2 operands)
    state.index++;
    const left = parsePrefix(tokens, state);
    const right = parsePrefix(tokens, state);
    return { type: 'binary', op: '*', left, right };
  }
  return parsePrimary(tokens, state);
}
 
function parsePrimary(tokens, state) {
  if (state.index >= tokens.length) throw new Error("Unexpected end of expression");
  const token = tokens[state.index];
 
  if (token === '(') {
    state.index++;
    const expr = parseExpression(tokens, state);
    if (state.index >= tokens.length || tokens[state.index] !== ')') throw new Error("Expected closing parenthesis");
    state.index++;
    return expr;
  }
  if (token.startsWith(':')) { state.index++; return { type: 'variable', name: token }; }
  if (token.startsWith("'")) { state.index++; return { type: 'literal', value: token.substring(1) }; }
  if (/^[0-9]+(?:\.[0-9]+)?$/.test(token)) { state.index++; return { type: 'number', value: parseFloat(token) }; }
  state.index++;
  return { type: 'word', value: token };
}
 
function evalExpr(expr, env) {
  switch (expr.type) {
    case 'number': return expr.value;
    case 'variable': {
      const val = env[expr.name];
      if (val !== undefined) return val;
      const g = env.global[expr.name.substring(1).toUpperCase()];
      if (g !== undefined) return g;
      return 0; // tolerate unbound (e.g. LIN's missing inputs) instead of throwing mid-build
    }
    case 'literal':
    case 'word': {
      const val = env[expr.value] !== undefined ? env[expr.value] : env.global[expr.value.toUpperCase()];
      return val !== undefined ? val : expr.value;
    }
    case 'unary': {
      const v = evalExpr(expr.operand, env);
      if (expr.op === '-' || expr.op === '$-$') return -v;
      throw new Error(`Unknown unary operator ${expr.op}`);
    }
    case 'binary': {
      const l = evalExpr(expr.left, env), r = evalExpr(expr.right, env);
      switch (expr.op) {
        case '+': return l + r;
        case '-': return l - r;
        case '*': return l * r;
        case '/': return l / r;
        case '\\': return l % r;
        case '=': return l === r ? 1 : 0;
        default: throw new Error(`Unknown binary operator ${expr.op}`);
      }
    }
  }
  throw new Error("Unknown expression type");
}
 
// ---- Command parser --------------------------------------------------------
function parseCommandLine(tokens) {
  const commands = [];
  const state = { index: 0 };
  while (state.index < tokens.length) commands.push(parseCommand(tokens, state));
  return commands;
}
 
function parseCommand(tokens, state) {
  if (state.index >= tokens.length) throw new Error("Expected command");
  const token = tokens[state.index].toUpperCase();
 
  if (token === 'IF') {
    state.index++;
    const cond = parseExpression(tokens, state);
    if (state.index >= tokens.length || tokens[state.index].toUpperCase() !== 'THEN') throw new Error("Expected THEN after IF");
    state.index++;
    const thenCommands = [];
    while (state.index < tokens.length && tokens[state.index].toUpperCase() !== 'ELSE') thenCommands.push(parseCommand(tokens, state));
    const elseCommands = [];
    if (state.index < tokens.length && tokens[state.index].toUpperCase() === 'ELSE') {
      state.index++;
      while (state.index < tokens.length) elseCommands.push(parseCommand(tokens, state));
    }
    return { type: 'if', cond, thenPart: thenCommands, elsePart: elseCommands };
  }
  if (token === 'STOP') { state.index++; return { type: 'stop' }; }
  if (token === 'PU' || token === 'PENUP') { state.index++; return { type: 'penup' }; }
  if (token === 'PD' || token === 'PENDOWN') { state.index++; return { type: 'pendown' }; }
  if (token === 'HM' || token === 'HOME') { state.index++; return { type: 'home' }; }
 
  const unaryCommands = ['SPIN', 'MOVE', 'FD', 'FORWARD', 'BK', 'BACK', 'BACKWARD', 'RT', 'RIGHT', 'LT', 'LEFT'];
  if (unaryCommands.includes(token)) {
    state.index++;
    return { type: token.toLowerCase(), arg: parseExpression(tokens, state) };
  }
  if (token === 'MAKE') {
    state.index++;
    const varName = parseExpression(tokens, state);
    const value = parseExpression(tokens, state);
    return { type: 'make', varName, value };
  }
 
  const procName = tokens[state.index]; state.index++;
  const args = [];
  const stoppers = ['IF', 'THEN', 'ELSE', 'STOP', 'PU', 'PD', 'HM', 'SPIN', 'MOVE', 'FD', 'BK', 'RT', 'LT', 'MAKE'];
  while (state.index < tokens.length && !stoppers.includes(tokens[state.index].toUpperCase())) {
    args.push(parseExpression(tokens, state));
  }
  return { type: 'call', name: procName, args };
}
 
function parseLogoProcedures(source) {
  const lines = source.split('\n');
  const procedures = {};
  let currentProc = null;
 
  for (let rawLine of lines) {
    let line = rawLine.trim();
    if (!line || line.startsWith(';')) continue;
 
    const lineNumMatch = line.match(/^(\d+)\s+(.*)$/);
    if (lineNumMatch) line = lineNumMatch[2].trim();
 
    if (line.toUpperCase().startsWith('TO ')) {
      const parts = line.split(/\s+/);
      currentProc = { name: parts[1].toUpperCase(), params: parts.slice(2), body: [], rawLines: [rawLine] };
      procedures[currentProc.name] = currentProc;
      continue;
    }
    if (line.toUpperCase() === 'END') {
      if (currentProc) { currentProc.rawLines.push(rawLine); currentProc = null; }
      continue;
    }
    if (currentProc) {
      currentProc.rawLines.push(rawLine);
      const tokens = tokenize(line);
      if (tokens.length > 0) {
        try { currentProc.body.push(...parseCommandLine(tokens)); }
        catch (e) { console.error(`Error parsing Logo line "${line}":`, e); }
      }
    }
  }
  return procedures;
}
 
// ============================================================================
// 2D affine matrix helpers  (canvas convention: x' = a*x + c*y + e, etc.)
// ============================================================================
function matIdentity() { return { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 }; }
 
// Compose m∘n  (apply n first, then m)
function matMul(m, n) {
  return {
    a: m.a * n.a + m.c * n.b,
    b: m.b * n.a + m.d * n.b,
    c: m.a * n.c + m.c * n.d,
    d: m.b * n.c + m.d * n.d,
    e: m.a * n.e + m.c * n.f + m.e,
    f: m.b * n.e + m.d * n.f + m.f,
  };
}
function matApplyX(m, x, y) { return m.a * x + m.c * y + m.e; }
function matApplyY(m, x, y) { return m.b * x + m.d * y + m.f; }
 
// Rotation by `deg` about pivot (px,py)  ==  T(p)·R(deg)·T(-p)
function matRotAbout(deg, px, py) {
  const r = deg * Math.PI / 180, cs = Math.cos(r), sn = Math.sin(r);
  return { a: cs, b: sn, c: -sn, d: cs, e: px - cs * px + sn * py, f: py - sn * px - cs * py };
}
function matTranslate(dx, dy) { return { a: 1, b: 0, c: 0, d: 1, e: dx, f: dy }; }
 
// Per-frame, time-varying transform. `t` is virtual time in "steps".
//   SPIN: rotate about the frame's pivot at rate deg/step
//   MOVE: translate along the heading captured when MOVE ran, at rate units/step
function frameTransform(frame, t) {
  if (frame.type === 'spin') return matRotAbout(frame.rate * t, frame.pivot.x, frame.pivot.y);
  if (frame.type === 'move') return matTranslate(frame.dir.cx * frame.rate * t, frame.dir.cy * frame.rate * t);
  return matIdentity(); // root
}
 
const HOME_X = 380, HOME_Y = 210, HOME_HEADING = -90;
const STOP_SIGNAL = Symbol('STOP');
class BudgetExceeded extends Error {}
 
// ============================================================================
// LogoVM  —  builds the display-list tree (phase 1) then renders it (phase 2)
// ============================================================================
class LogoVM {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.procedures = parseLogoProcedures(LOGO_SOURCE);
    // Build caps. maxSegments bounds non-terminating procedures (e.g. FOO) and
    // keeps recursion under the JS stack limit; a RangeError backstop catches
    // anything deeper and keeps the partial tree (children are attached before
    // we recurse, so a truncated tree is always self-consistent).
    this.maxSegments = 3000;
    this.maxDepth = 3000;
    this.reset();
  }
 
  reset() {
    // turtle/manual-mode state (manual freehand sandbox keeps the simple model)
    this.x = HOME_X; this.y = HOME_Y; this.heading = HOME_HEADING;
    this.omega = 0; this.v = 0; this.penDown = true;
    this.trails = [];
    this.manualDrift = false;
 
    // program-mode (display-list) state
    this.scene = null;     // root frame of the built display list
    this.t = 0;            // virtual animation time (steps)
    this.sceneDepth = 0;
    this.segCount = 0;
 
    this.active = false;
    this.globalEnv = { 'RT': 2340 };
    this.onStatusChange = null;
    this.onStatsUpdate = null;
  }
 
  stop() {
    this.active = false;
    if (this.onStatusChange) this.onStatusChange("STOPPED");
  }
 
  // ---- PHASE 1: build the display list ------------------------------------
  startProcedure(name, argsMap) {
    const proc = this.procedures[name && name.toUpperCase()];
    if (!proc) return;
 
    this.trails = [];
    this.t = 0;
 
    const root = { type: 'root', pivot: { x: HOME_X, y: HOME_Y }, rate: 0, depth: 0, segments: [], children: [] };
    const turtle = { x: HOME_X, y: HOME_Y, heading: HOME_HEADING, penDown: true };
    const budget = { seg: 0 };
 
    const env = { global: this.globalEnv };
    proc.params.forEach((p) => { env[p] = (argsMap && argsMap[p] !== undefined) ? argsMap[p] : 0; });
 
    try {
      this._runProc(proc, env, turtle, root, budget);
    } catch (e) {
      if (!(e instanceof BudgetExceeded) && !(e instanceof RangeError) && e.name !== 'RangeError') throw e;
      // budget hit or stack exhausted: keep the partial (truncated) display list
    }
 
    this.scene = root;
    this.segCount = budget.seg;
    this.sceneDepth = this._treeDepth(root);
    this.active = true;
    if (this.onStatusChange) this.onStatusChange("RUNNING");
  }
 
  _runProc(proc, env, turtle, frame, budget) {
    try { this._runCmds(proc.body, env, turtle, frame, budget); }
    catch (e) { if (e === STOP_SIGNAL) return; throw e; }
  }
 
  // Runs a command sequence, threading the "current frame" (which SPIN/MOVE
  // reassign). Returns the final current frame. Used for procedure bodies AND
  // for IF branches, so a SPIN inside `IF ... THEN SPIN :S ELSE SPIN -:S`
  // correctly opens a frame for the rest of the sequence.
  _runCmds(cmds, env, turtle, frame, budget) {
    let cur = frame;
    for (let i = 0; i < cmds.length; i++) cur = this._exec(cmds[i], env, turtle, cur, budget);
    return cur;
  }
 
  _exec(cmd, env, turtle, cur, budget) {
    switch (cmd.type) {
      case 'penup':   turtle.penDown = false; return cur;
      case 'pendown': turtle.penDown = true;  return cur;
      case 'home':    turtle.x = HOME_X; turtle.y = HOME_Y; turtle.heading = HOME_HEADING; return cur;
      case 'rt': case 'right': turtle.heading += evalExpr(cmd.arg, env); return cur;
      case 'lt': case 'left':  turtle.heading -= evalExpr(cmd.arg, env); return cur;
 
      case 'fd': case 'forward': return this._draw(evalExpr(cmd.arg, env),  turtle, cur, budget);
      case 'bk': case 'back': case 'backward': return this._draw(-evalExpr(cmd.arg, env), turtle, cur, budget);
 
      case 'spin': {
        if (cur.depth >= this.maxDepth) throw new BudgetExceeded();
        const child = { type: 'spin', rate: evalExpr(cmd.arg, env),
                        pivot: { x: turtle.x, y: turtle.y }, depth: cur.depth + 1, segments: [], children: [] };
        cur.children.push(child);
        return child; // everything after rides on this plate
      }
      case 'move': {
        if (cur.depth >= this.maxDepth) throw new BudgetExceeded();
        const r = turtle.heading * Math.PI / 180;
        const child = { type: 'move', rate: evalExpr(cmd.arg, env),
                        dir: { cx: Math.cos(r), cy: Math.sin(r) },
                        pivot: { x: turtle.x, y: turtle.y }, depth: cur.depth + 1, segments: [], children: [] };
        cur.children.push(child);
        return child;
      }
 
      case 'make': this.globalEnv[String(evalExpr(cmd.varName, env)).toUpperCase()] = evalExpr(cmd.value, env); return cur;
      case 'stop': throw STOP_SIGNAL;
 
      case 'if': {
        const branch = evalExpr(cmd.cond, env) !== 0 ? cmd.thenPart : cmd.elsePart;
        return this._runCmds(branch || [], env, turtle, cur, budget);
      }
 
      case 'call': {
        const callee = this.procedures[cmd.name.toUpperCase()];
        if (!callee) return cur;
        const argv = cmd.args.map(a => evalExpr(a, env));
        const childEnv = { global: this.globalEnv };
 
        if (cmd.name.toUpperCase() === 'LIN') {
          // The 1979 source calls `LIN 40` with a single input. FD 0 would draw
          // nothing, so the simulator supplies pragmatic defaults to keep the
          // LINES demo visible. (Not in the original — flagged for Ken.)
          const s = argv.length >= 1 ? argv[0] : 0;
          childEnv[':S']  = s;
          childEnv[':S2'] = argv.length >= 2 ? argv[1] : -s;
          childEnv[':D1'] = argv.length >= 3 ? argv[2] : 50;
          childEnv[':D2'] = argv.length >= 4 ? argv[3] : 50;
        } else {
          callee.params.forEach((p, i) => { childEnv[p] = i < argv.length ? argv[i] : 0; });
        }
 
        // Callee INHERITS the caller's current frame. Its own SPIN/MOVE nest
        // beneath it; when it returns, the caller resumes with ITS frame
        // unchanged. This is what makes PAR nest deeply (its recursive call is
        // the last line, after SPIN has already opened a frame) while FAN's
        // successive LIN calls stay siblings instead of accumulating.
        this._runProc(callee, childEnv, turtle, cur, budget);
        return cur;
      }
      default: return cur;
    }
  }
 
  _draw(dist, turtle, cur, budget) {
    const r = turtle.heading * Math.PI / 180;
    const nx = turtle.x + dist * Math.cos(r);
    const ny = turtle.y + dist * Math.sin(r);
    if (turtle.penDown && dist !== 0) {
      cur.segments.push({ x1: turtle.x, y1: turtle.y, x2: nx, y2: ny });
      if (++budget.seg > this.maxSegments) { turtle.x = nx; turtle.y = ny; throw new BudgetExceeded(); }
    }
    turtle.x = nx; turtle.y = ny;
    return cur;
  }

  _treeDepth(node) {
    // iterative (the tree can be thousands deep for FOO)
    let max = 0;
    const stack = [node];
    while (stack.length) {
      const n = stack.pop();
      if (n.depth > max) max = n.depth;
      for (let i = 0; i < n.children.length; i++) stack.push(n.children[i]);
    }
    return max;
  }

  // ---- PHASE 2: advance virtual time + render -----------------------------
  // The loop calls step(speed) once per frame, advancing t by speed.
  step(dt = 1) {
    if (this.manualDrift) { this._stepManual(dt); return; }
    if (this.active && this.scene) {
      this.t += dt;
      this._emitStats({ x: this.x, y: this.y, heading: 0, v: 0, omega: 0, penDown: true, stackDepth: this.sceneDepth });
    }
  }

  // Manual freehand sandbox: a single dynaturtle pushed by the v/omega sliders.
  _stepManual(dt = 1) {
    const oldX = this.x, oldY = this.y;
    this.heading = ((this.heading + this.omega * dt + 180) % 360 + 360) % 360 - 180;
    const r = this.heading * Math.PI / 180;
    this.x += this.v * dt * Math.cos(r);
    this.y += this.v * dt * Math.sin(r);
    const w = this.canvas.width, h = this.canvas.height;
    let wrapped = false;
    if (this.x < 0) { this.x += w; wrapped = true; } else if (this.x > w) { this.x -= w; wrapped = true; }
    if (this.y < 0) { this.y += h; wrapped = true; } else if (this.y > h) { this.y -= h; wrapped = true; }
    if (this.penDown && !wrapped && (this.v !== 0 || this.omega !== 0)) {
      this.trails.push({ x1: oldX, y1: oldY, x2: this.x, y2: this.y });
      if (this.trails.length > 5000) this.trails.shift();
    }
    this._emitStats({ x: this.x, y: this.y, heading: this.heading, v: this.v, omega: this.omega, penDown: this.penDown, stackDepth: 0 });
  }

  _emitStats(s) { if (this.onStatsUpdate) this.onStatsUpdate(s); }
 
  draw() {
    const ctx = this.ctx, w = this.canvas.width, h = this.canvas.height;
 
    ctx.fillStyle = '#050b06';
    ctx.fillRect(0, 0, w, h);
 
    ctx.strokeStyle = 'rgba(57, 255, 20, 0.04)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = 0; x < w; x += 40) { ctx.moveTo(x, 0); ctx.lineTo(x, h); }
    for (let y = 0; y < h; y += 40) { ctx.moveTo(0, y); ctx.lineTo(w, y); }
    ctx.stroke();
 
    if (this.manualDrift) { this._drawManual(); return; }
    if (this.scene) this._renderScene(this.t);
  }
 
  // Iterative traversal (recursion would overflow on deep trees every frame).
  // All segments batched into one path: one stroke for the whole figure.
  _renderScene(t) {
    const ctx = this.ctx;
    ctx.save();
    ctx.strokeStyle = '#39ff14';
    ctx.lineWidth = 1.4;
    ctx.shadowBlur = 6;
    ctx.shadowColor = '#39ff14';
    ctx.beginPath();
 
    const stack = [{ f: this.scene, M: matIdentity() }];
    while (stack.length) {
      const { f, M } = stack.pop();
      const Mf = f.type === 'root' ? M : matMul(M, frameTransform(f, t));
      const segs = f.segments;
      for (let i = 0; i < segs.length; i++) {
        const s = segs[i];
        ctx.moveTo(matApplyX(Mf, s.x1, s.y1), matApplyY(Mf, s.x1, s.y1));
        ctx.lineTo(matApplyX(Mf, s.x2, s.y2), matApplyY(Mf, s.x2, s.y2));
      }
      const ch = f.children;
      for (let i = 0; i < ch.length; i++) stack.push({ f: ch[i], M: Mf });
    }
    ctx.stroke();
    ctx.restore();
  }
 
  _drawManual() {
    const ctx = this.ctx;
    ctx.save();
    ctx.strokeStyle = '#39ff14'; ctx.lineWidth = 1.5; ctx.shadowBlur = 6; ctx.shadowColor = '#39ff14';
    ctx.beginPath();
    this.trails.forEach(tr => { ctx.moveTo(tr.x1, tr.y1); ctx.lineTo(tr.x2, tr.y2); });
    ctx.stroke();
    ctx.restore();
 
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.heading * Math.PI / 180);
    ctx.fillStyle = '#ff6b6b'; ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1; ctx.shadowBlur = 4; ctx.shadowColor = '#ff6b6b';
    ctx.beginPath();
    ctx.moveTo(12, 0); ctx.lineTo(-8, -8); ctx.lineTo(-4, 0); ctx.lineTo(-8, 8); ctx.closePath();
    ctx.fill(); ctx.stroke();
    ctx.restore();
  }
}
 
const PROC_DEFAULTS = {
  'PAR':   [ { name: ':L', min: 1, max: 200, val: 80, step: 1 }, { name: ':S', min: -10, max: 10, val: 1.5, step: 0.1 }, { name: ':ANGLE', min: -180, max: 180, val: 80, step: 1 }, { name: ':COUNT', min: 1, max: 500, val: 150, step: 1 } ],
  'MSF':   [ { name: ':MV', min: -10, max: 10, val: 0.8, step: 0.1 }, { name: ':SP', min: -10, max: 10, val: 0.4, step: 0.1 }, { name: ':FD', min: 1, max: 100, val: 15, step: 1 }, { name: ':COUNT', min: 1, max: 500, val: 120, step: 1 }, { name: ':FD.INC', min: -5, max: 5, val: 0.5, step: 0.1 } ],
  'FACE':  [ { name: ':N', min: 1, max: 100, val: 12, step: 1 } ],
  'LIN':   [ { name: ':S', min: -20, max: 20, val: 4, step: 0.5 }, { name: ':S2', min: -20, max: 20, val: -4, step: 0.5 }, { name: ':D1', min: 1, max: 200, val: 60, step: 1 }, { name: ':D2', min: 1, max: 200, val: 60, step: 1 } ],
  'LINES': [ { name: ':RT', min: -180, max: 180, val: 40, step: 1 }, { name: ':I', min: -20, max: 20, val: 2, step: 0.5 }, { name: ':T', min: 1, max: 500, val: 120, step: 1 } ],
  'FOO':   [ { name: ':I', min: 1, max: 100, val: 5, step: 1 }, { name: ':INC', min: -5, max: 5, val: 1, step: 0.1 }, { name: ':SP', min: -5, max: 5, val: 0.5, step: 0.05 } ],
  'FAN':   [ { name: ':T', min: 1, max: 500, val: 45, step: 1 }, { name: ':R', min: -180, max: 180, val: 10, step: 1 }, { name: ':I', min: -20, max: 20, val: 5, step: 0.5 }, { name: ':S1', min: -20, max: 20, val: 4, step: 0.5 }, { name: ':S2', min: -20, max: 20, val: -4, step: 0.5 }, { name: ':D1', min: 1, max: 200, val: 60, step: 1 }, { name: ':D2', min: 1, max: 200, val: 60, step: 1 } ],
  'CLOCK': []
};
 
// Initialize Logo Simulator Widget & VM
function initLogoSimulator() {
  const canvas = document.getElementById('logo-canvas');

  const logoVM = new LogoVM(canvas);
  window.logoVMInstance = logoVM;

  const procSelect = document.getElementById('logo-proc-select');
  const codeEditor = document.getElementById('logo-code-editor');
  const codeTitle = document.getElementById('logo-code-title');
  const drawBtn = document.getElementById('btn-logo-draw');
  const stopBtn = document.getElementById('btn-logo-stop');
  const newBtn = document.getElementById('btn-logo-new');
  const resetBtn = document.getElementById('btn-logo-reset-all');
  const statusEl = document.getElementById('logo-status');
  const paramsContainer = document.getElementById('logo-parameters-container');
  
  const manualDriftToggle = document.getElementById('logo-manual-drift-toggle');
  const manualDriftContainer = document.getElementById('logo-manual-drift-container');
  const manualMoveRange = document.getElementById('logo-manual-move-range');
  const manualSpinRange = document.getElementById('logo-manual-spin-range');
  const manualMoveVal = document.getElementById('logo-manual-move-val');
  const manualSpinVal = document.getElementById('logo-manual-spin-val');
  const manualPenBtn = document.getElementById('btn-logo-manual-pen-toggle');
  const manualClearBtn = document.getElementById('btn-logo-manual-clear');
  
  const speedRange = document.getElementById('logo-speed-range');
  const speedVal = document.getElementById('logo-speed-val');

  // Stats Elements
  const statX = document.getElementById('logo-stat-x');
  const statY = document.getElementById('logo-stat-y');
  const statHeading = document.getElementById('logo-stat-heading');
  const statV = document.getElementById('logo-stat-v');
  const statOmega = document.getElementById('logo-stat-omega');
  const statPen = document.getElementById('logo-stat-pen');
  const statStack = document.getElementById('logo-stat-stack');

  // Register VM Listeners
  logoVM.onStatusChange = (status) => {
    statusEl.textContent = status;
    if (status === "RUNNING") {
      statusEl.style.backgroundColor = "var(--text-bright)";
      statusEl.style.color = "var(--text-dark)";
    } else if (status.startsWith("ERR:")) {
      statusEl.style.backgroundColor = "var(--text-bright)";
      statusEl.style.color = "#ff6b6b";
    } else {
      statusEl.style.backgroundColor = "var(--border-medium)";
      statusEl.style.color = "var(--text-primary)";
    }
  };

  logoVM.onStatsUpdate = (stats) => {
    if (statX) statX.textContent = stats.x.toFixed(1);
    if (statY) statY.textContent = stats.y.toFixed(1);
    if (statHeading) statHeading.textContent = `${Math.round(stats.heading)}°`;
    if (statV) statV.textContent = stats.v.toFixed(1);
    if (statOmega) statOmega.textContent = `${stats.omega.toFixed(1)}°/step`;
    if (statPen) statPen.textContent = stats.penDown ? "DOWN" : "UP";
    if (statStack) statStack.textContent = stats.stackDepth;
  };

  // Generate dynamic parameters
  function renderParameters(procName) {
    paramsContainer.innerHTML = '';
    const proc = logoVM.procedures[procName];
    if (!proc) return;

    let defs = PROC_DEFAULTS[procName];
    if (!defs) {
      defs = proc.params.map(paramName => {
        let step = 1;
        let min = -180;
        let max = 180;
        let val = 10;
        if (paramName.toUpperCase().includes('SP')) {
          step = 0.1; min = -10; max = 10; val = 1.0;
        } else if (paramName.toUpperCase().includes('MV') || paramName.toUpperCase().includes('INC') || paramName.toUpperCase().includes('S')) {
          step = 0.5; min = -20; max = 20; val = 2.0;
        } else if (paramName.toUpperCase().includes('COUNT') || paramName.toUpperCase().includes('T') || paramName.toUpperCase().includes('N')) {
          step = 1; min = 1; max = 100; val = 20;
        } else {
          step = 1; min = 1; max = 200; val = 60;
        }
        return { name: paramName, min, max, val, step };
      });
      PROC_DEFAULTS[procName] = defs;
    } else {
      const existingNames = defs.map(d => d.name);
      proc.params.forEach(paramName => {
        if (!existingNames.includes(paramName)) {
          let step = 1;
          let min = -180;
          let max = 180;
          let val = 10;
          if (paramName.toUpperCase().includes('SP')) {
            step = 0.1; min = -10; max = 10; val = 1.0;
          } else if (paramName.toUpperCase().includes('MV') || paramName.toUpperCase().includes('INC') || paramName.toUpperCase().includes('S')) {
            step = 0.5; min = -20; max = 20; val = 2.0;
          } else if (paramName.toUpperCase().includes('COUNT') || paramName.toUpperCase().includes('T') || paramName.toUpperCase().includes('N')) {
            step = 1; min = 1; max = 100; val = 20;
          } else {
            step = 1; min = 1; max = 200; val = 60;
          }
          defs.push({ name: paramName, min, max, val, step });
        }
      });
    }

    defs.forEach(p => {
      const row = document.createElement('div');
      row.className = 'slider-row';
      row.innerHTML = `
        <label>${p.name}:</label>
        <div>
          <input type="range" min="${p.min}" max="${p.max}" value="${p.val}" step="${p.step || 1}" data-param="${p.name}">
          <span style="color: var(--text-bright); width: 35px; text-align: right;">${p.val}</span>
        </div>
      `;
      const input = row.querySelector('input');
      const labelVal = row.querySelector('span');
      input.addEventListener('input', (e) => {
        labelVal.textContent = e.target.value;
        p.val = parseFloat(e.target.value);
      });
      paramsContainer.appendChild(row);
    });
  }

  function compileEditorCode() {
    const code = codeEditor.value;
    try {
      const parsed = parseLogoProcedures(code);
      const names = Object.keys(parsed);
      if (names.length === 0) {
        throw new Error("No procedure defined. Use TO name ... END format.");
      }
      
      let activeName = null;
      names.forEach(name => {
        logoVM.procedures[name] = parsed[name];
        if (activeName === null) activeName = name;
        
        let found = false;
        for (let i = 0; i < procSelect.options.length; i++) {
          if (procSelect.options[i].value === name) {
            found = true;
            break;
          }
        }
        if (!found) {
          const opt = document.createElement('option');
          opt.value = name;
          opt.textContent = `TO ${name} ${parsed[name].params.join(' ')}`;
          procSelect.appendChild(opt);
        } else {
          for (let i = 0; i < procSelect.options.length; i++) {
            if (procSelect.options[i].value === name) {
              procSelect.options[i].textContent = `TO ${name} ${parsed[name].params.join(' ')}`;
              break;
            }
          }
        }
      });
      
      if (activeName) {
        procSelect.value = activeName;
        codeTitle.textContent = `PROCEDURE: ${activeName}`;
        renderParameters(activeName);
      }
      return activeName;
    } catch (err) {
      console.error("Compilation error:", err);
      logoVM.onStatusChange("ERR: " + err.message.substring(0, 15));
      throw err;
    }
  }

  function updateCodeBlock(procName) {
    const proc = logoVM.procedures[procName];
    if (proc) {
      codeEditor.value = proc.rawLines.join('\n');
      codeTitle.textContent = `PROCEDURE: ${procName}`;
    }
  }

  // Dropdown Change Handler
  procSelect.addEventListener('change', (e) => {
    const procName = e.target.value;
    renderParameters(procName);
    updateCodeBlock(procName);
  });

  // Action: Draw
  drawBtn.addEventListener('click', () => {
    try {
      compileEditorCode();
    } catch (e) {
      return;
    }

    const procName = procSelect.value;
    const inputs = paramsContainer.querySelectorAll('input[data-param]');
    const argsMap = {};
    inputs.forEach(input => {
      argsMap[input.getAttribute('data-param')] = parseFloat(input.value);
    });

    logoVM.trails = [];
    logoVM.startProcedure(procName, argsMap);
  });

  // Action: Stop
  stopBtn.addEventListener('click', () => {
    logoVM.stop();
  });

  // Action: New
  newBtn.addEventListener('click', () => {
    let count = 1;
    let newName = "MYPATTERN";
    while (logoVM.procedures[newName]) {
      newName = `MYPATTERN${++count}`;
    }
    
    const template = `TO ${newName} :L :SP
10 FD :L
20 SPIN :SP
30 ${newName} :L * 0.98 :SP
END`;
    
    codeEditor.value = template;
    codeTitle.textContent = `PROCEDURE: ${newName}`;
    
    compileEditorCode();
    codeEditor.focus();
  });

  // Action: Reset
  resetBtn.addEventListener('click', () => {
    logoVM.reset();
    logoVM.onStatusChange("IDLE");
    if (manualDriftToggle.checked) {
      logoVM.manualDrift = true;
      logoVM.v = parseFloat(manualMoveRange.value);
      logoVM.omega = parseFloat(manualSpinRange.value);
    }
    manualPenBtn.textContent = logoVM.penDown ? "Pen: DOWN" : "Pen: UP";
  });

  // Action: Manual Drift Toggle
  manualDriftToggle.addEventListener('change', (e) => {
    const isManual = e.target.checked;
    logoVM.manualDrift = isManual;
    if (isManual) {
      paramsContainer.style.display = 'none';
      manualDriftContainer.style.display = 'flex';
      logoVM.v = parseFloat(manualMoveRange.value);
      logoVM.omega = parseFloat(manualSpinRange.value);
    } else {
      paramsContainer.style.display = 'flex';
      manualDriftContainer.style.display = 'none';
      logoVM.v = 0;
      logoVM.omega = 0;
    }
  });

  // Manual Drift Sliders
  manualMoveRange.addEventListener('input', (e) => {
    const val = parseFloat(e.target.value);
    manualMoveVal.textContent = val.toFixed(1);
    if (logoVM.manualDrift) logoVM.v = val;
  });

  // Spin Rate range
  manualSpinRange.addEventListener('input', (e) => {
    const val = parseFloat(e.target.value);
    manualSpinVal.textContent = `${val.toFixed(1)}°`;
    if (logoVM.manualDrift) logoVM.omega = val;
  });

  // Pen toggle
  manualPenBtn.addEventListener('click', () => {
    logoVM.penDown = !logoVM.penDown;
    manualPenBtn.textContent = logoVM.penDown ? "Pen: DOWN" : "Pen: UP";
  });

  // Clear trails
  manualClearBtn.addEventListener('click', () => {
    logoVM.trails = [];
  });

  // Speed range
  speedRange.addEventListener('input', (e) => {
    speedVal.textContent = parseFloat(e.target.value).toFixed(2);
  });

  // Initialize display
  const initialProc = procSelect.value;
  renderParameters(initialProc);
  updateCodeBlock(initialProc);
  logoVM.onStatusChange("IDLE");

  // Start the frame loop
  function logoLoop() {
    if (appState.activeTab === 'logo') {
      const speed = parseFloat(speedRange.value) || 1.0;
      logoVM.step(speed);
      logoVM.draw();
    }
    requestAnimationFrame(logoLoop);
  }
  requestAnimationFrame(logoLoop);
}
