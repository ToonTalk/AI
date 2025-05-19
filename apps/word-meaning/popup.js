document.addEventListener('DOMContentLoaded', function() {
  const checkButton = document.getElementById('check-ai');
  const statusElement = document.getElementById('status');
  const pageWarning = document.getElementById('page-warning');
  
  // Check if we're on a restricted page
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    const currentUrl = tabs[0].url;
    if (currentUrl.startsWith('chrome://') || 
        currentUrl.startsWith('chrome-extension://') || 
        currentUrl === 'about:blank' || 
        currentUrl.includes('chrome.google.com/webstore')) {
      
      pageWarning.textContent = 'This extension cannot work on this page. Please try it on a regular website like google.com or wikipedia.org.';
      pageWarning.style.display = 'block';
    } else {
      pageWarning.style.display = 'none';
    }
  });
  
  // Reset badge when popup opens
  chrome.action.setBadgeText({text: ''});
  
  checkButton.addEventListener('click', async () => {
    statusElement.textContent = "Checking AI availability...";
    statusElement.className = "";
    
    try {
      // Execute a content script to check AI availability
      chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        const currentUrl = tabs[0].url;
        
        if (currentUrl.startsWith('chrome://') || 
            currentUrl.startsWith('chrome-extension://') || 
            currentUrl === 'about:blank' || 
            currentUrl.includes('chrome.google.com/webstore')) {
          
          statusElement.textContent = "Cannot check AI API on this page. Please try on a regular website.";
          statusElement.className = "error";
          return;
        }
        
        chrome.scripting.executeScript({
          target: {tabId: tabs[0].id},
          func: exploreAIObject
        }, (results) => {
          if (chrome.runtime.lastError) {
            statusElement.textContent = `Error: ${chrome.runtime.lastError.message}`;
            statusElement.className = "error";
            return;
          }
          
          if (!results || results.length === 0) {
            statusElement.textContent = "Error: Could not check AI availability";
            statusElement.className = "error";
            return;
          }
          
          const result = results[0].result;
          
          if (result.available) {
            statusElement.innerHTML = `<div class="success">AI is available! Method: ${result.method}</div>`;
            
            if (result.structure) {
              statusElement.innerHTML += `<pre style="background:#f5f5f5;padding:8px;margin-top:10px;overflow:auto;max-height:150px;font-size:12px;">${result.structure}</pre>`;
            }
          } else {
            statusElement.innerHTML = `<div class="error">${result.message || "AI is not available"}</div>`;
            
            if (result.structure) {
              statusElement.innerHTML += `<pre style="background:#f5f5f5;padding:8px;margin-top:10px;overflow:auto;max-height:150px;font-size:12px;">${result.structure}</pre>`;
            }
          }
        });
      });
    } catch (error) {
      statusElement.textContent = `Error: ${error.message}`;
      statusElement.className = "error";
    }
  });
});

// Function to deeply explore the AI object structure
function exploreAIObject() {
  try {
    // Check if AI object exists
    if (typeof ai === 'undefined') {
      return { 
        available: false, 
        message: "AI API is not available in this browser" 
      };
    }
    
    // Explore the AI object structure
    const structure = exploreObject(ai, 2);
    
    // Standard patterns to check
    if (ai.assistant && typeof ai.assistant.create === 'function') {
      return { 
        available: true, 
        method: "ai.assistant.create",
        structure: structure
      };
    } 
    
    if (ai.languageModel && typeof ai.languageModel.create === 'function') {
      return { 
        available: true, 
        method: "ai.languageModel.create",
        structure: structure
      };
    }
    
    if (typeof ai.createSession === 'function') {
      return { 
        available: true, 
        method: "ai.createSession",
        structure: structure 
      };
    }
    
    if (ai.gemini && typeof ai.gemini.createSession === 'function') {
      return { 
        available: true, 
        method: "ai.gemini.createSession",
        structure: structure
      };
    }
    
    if (typeof ai.generateText === 'function') {
      return { 
        available: true, 
        method: "ai.generateText",
        structure: structure
      };
    }
    
    // Look for any prompt or model functions
    const aiMethods = getAllFunctionNames(ai);
    const promptMethods = aiMethods.filter(m => 
      m.toLowerCase().includes('prompt') || 
      m.toLowerCase().includes('model') ||
      m.toLowerCase().includes('text') ||
      m.toLowerCase().includes('ai') ||
      m.toLowerCase().includes('generate') ||
      m.toLowerCase().includes('create') ||
      m.toLowerCase().includes('session')
    );
    
    if (promptMethods.length > 0) {
      return {
        available: true,
        method: "Custom: " + promptMethods.join(", "),
        structure: structure
      };
    }
    
    // If we got here, the AI object exists but no usable methods were found
    return { 
      available: false, 
      message: "AI object exists but no usable methods were found",
      methods: aiMethods.join(", "),
      structure: structure
    };
    
  } catch (error) {
    return { 
      available: false, 
      message: `Error checking AI: ${error.message}` 
    };
  }
}

// Helper function to get all function names
function getAllFunctionNames(obj) {
  const methods = [];
  
  for (const prop in obj) {
    try {
      if (typeof obj[prop] === 'function') {
        methods.push(prop);
      }
    } catch (e) {}
  }
  
  return methods;
}

// Helper function to explore an object structure
function exploreObject(obj, depth, path = "ai") {
  if (!obj || depth <= 0) return "";
  
  let result = "";
  
  try {
    for (const prop in obj) {
      try {
        const value = obj[prop];
        const type = typeof value;
        const currentPath = `${path}.${prop}`;
        
        if (type === 'function') {
          result += `${currentPath}: function\n`;
        } else if (type === 'object' && value !== null) {
          result += `${currentPath}: object\n`;
          if (depth > 1) {
            result += exploreObject(value, depth - 1, currentPath);
          }
        } else {
          result += `${currentPath}: ${type} = ${JSON.stringify(value).substring(0, 30)}\n`;
        }
      } catch (e) {
        result += `${path}.${prop}: [Error: ${e.message}]\n`;
      }
    }
  } catch (e) {
    result += `Error exploring ${path}: ${e.message}\n`;
  }
  
  return result;
}