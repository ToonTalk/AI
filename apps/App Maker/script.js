let htmlCode = '', cssCode = '', jsCode = '';

function detectAndProcessCode(clipboardText) {
    if (clipboardText.includes("```")) {
        // Split text by lines
        const lines = clipboardText.split("\n");
        let currentType = null;
        let currentCode = [];

        lines.forEach(line => {
            if (line.startsWith("```")) {
                // Process the previous code block if any
                if (currentType && currentCode.length > 0) {
                    processCodeBlock(currentType, currentCode.join("\n"));
                }

                // Identify the new block type
                currentType = line.substring(3).trim().toLowerCase();
                currentCode = [];
            } else if (currentType) {
                // Add line to current code block
                currentCode.push(line);
            }
        });

        // Process the last code block if any
        if (currentType && currentCode.length > 0) {
            processCodeBlock(currentType, currentCode.join("\n"));
        }
    } else {
        // Fallback to original detection method for text without triple back quotes
        const codeType = detectCodeType(clipboardText);
        processCodeBlock(codeType, clipboardText);
    }
}

function processCodeBlock(type, code) {
    switch (type) {
        case 'html':
            updateHTML(code);
            break;
        case 'css':
            mergeCSS(code);
            break;
        case 'javascript':
            mergeJavaScript(code);
            break;
        case 'bad_javascript':
            displayMessage("Not sure what to do what was pasted. Here's what it was:\n" + code);
            break;
        default:
            console.log("Unrecognized code type: " + type);
            break;
    }
}

document.getElementById('pasteBtn').addEventListener('click', async function() {
    try {
        const clipboardText = await navigator.clipboard.readText();
        detectAndProcessCode(clipboardText);
    } catch (err) {
        displayMessage('An error occurred: ' + err.message, true);
        console.error('Failed to read clipboard contents: ', err);
    }
});

document.getElementById('downloadBtn').addEventListener('click', function() {
    // Remove redundant <head> and <body> tags from htmlCode
    let cleanedHtmlCode = htmlCode.replace(/<\/?head>/g, '').replace(/<\/?body>/g, '').trim();

    // Construct the complete HTML code
    const completeCode = `<html><head><style>${cssCode}</style></head><body>${cleanedHtmlCode}<script>${jsCode}</script></body></html>`;

    download("my_project.html", completeCode);
});

function detectCodeType(text) {
    // Trim leading whitespace and check the first character
    const firstChar = text.trim().charAt(0);

    // Check for HTML
    if (firstChar === '<') {
        return 'html';
    }

    // Check for CSS
    // CSS typically has selectors followed by properties in curly braces
    const cssPattern = /[#.]*[a-zA-Z0-9_-]+\s*\{[\s\S]*?\}/;
    if (cssPattern.test(text)) {
        return 'css';
    }

    // Check for JavaScript syntax errors
    if (hasSyntaxError(text)) {
        return 'bad_javascript';
    }

    // Default to JavaScript
    return 'javascript';
}

function hasSyntaxError(code) {
    try {
        new Function(code);
        return false; // No syntax error
    } catch (e) {
        return true; // Syntax error detected
    }
}

function download(filename, text) {
    var element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
    element.setAttribute('download', filename);

    element.style.display = 'none';
    document.body.appendChild(element);

    element.click();

    document.body.removeChild(element);
}
function updateDownloadButtonState() {
    const downloadButton = document.getElementById('downloadBtn');
    if (htmlCode.trim() === '') {
        downloadButton.disabled = true;
    } else {
        downloadButton.disabled = false;
    }
}

function updateHTML(newHTML) {
    // console.log("Original HTML:", newHTML);

    // Extract and remove CSS
    const cssRegex = /<style.*?>([\s\S]*?)<\/style>/gi;
    let extractedCSS = '';
    newHTML = newHTML.replace(cssRegex, function(match, css) {
        extractedCSS += css.trim() + '\n';
        return '';
    });
    // console.log("Extracted CSS:", extractedCSS);
    mergeCSS(extractedCSS);

    // Extract and remove JavaScript
    const jsRegex = /<script.*?>([\s\S]*?)<\/script>/gi;
    let extractedJS = '';
    newHTML = newHTML.replace(jsRegex, function(match, js) {
        extractedJS += js.trim() + '\n';
        return '';
    });
    // console.log("Extracted JavaScript:", extractedJS);
    mergeJavaScript(extractedJS);

    // Update the HTML code
    htmlCode = newHTML.trim();
    // console.log("Updated HTML:", htmlCode);
    checkForPlaceholder(); // Check after updating HTML
    // Call this function at the end of your script to set the initial state of the button
    updateDownloadButtonState();
    displayMessage("Yay! Your web page is updated!");
}

function displayMessage(message, isError = false) {
    const messageArea = document.getElementById('messageArea');
    messageArea.innerText = message;
    if (isError) {
        messageArea.style.color = 'red';
    } else {
        messageArea.style.color = '#0066cc'; // or any default color
    }
}

function mergeCSS(newCSS) {
    // console.log("Existing CSS before merge:", cssCode);
    // console.log("New CSS to merge:", newCSS);

    let existingStyles = cssCode.split('}').map(s => s.trim()).filter(Boolean);
    let newStyles = newCSS.split('}').map(s => s.trim()).filter(Boolean);

    newStyles.forEach(newStyle => {
        let selector = newStyle.split('{')[0].trim();
        let existingIndex = existingStyles.findIndex(style => style.startsWith(selector + " {"));

        if (existingIndex !== -1) {
            // Replace existing style
            existingStyles[existingIndex] = newStyle;
        } else {
            // Add new style
            existingStyles.push(newStyle);
        }
    });

    // Reconstruct CSS
    cssCode = existingStyles.join(' }') + (existingStyles.length > 0 ? ' }' : '');

    // console.log("Updated CSS after merge:", cssCode);
    displayMessage("Great! Your page's style just got cooler!");
}

function mergeJavaScript(newJS) {
    let existingFunctions = extractFunctions(jsCode);
    let newFunctions = extractFunctions(newJS);
    let existingVariables = extractGlobalVariables(jsCode);
    let newVariables = extractGlobalVariables(newJS);

    // Collect lines to be removed
    let linesToRemove = [];

    // Add function lines to be removed
    for (let funcName in newFunctions) {
        if (existingFunctions.hasOwnProperty(funcName)) {
            let startLine = existingFunctions[funcName].line;
            let endLine = findEndLine(jsCode, startLine);
            linesToRemove.push({ start: startLine, end: endLine });
        }
    }

    // Add variable lines to be removed
    for (let varName in newVariables) {
        if (existingVariables.hasOwnProperty(varName)) {
            let startLine = existingVariables[varName].line;
            let endLine = findEndLine(jsCode, startLine); // Using findEndLine for variables too
            linesToRemove.push({ start: startLine, end: endLine });
        }
    }

    // Sort lines to be removed in descending order of start line
    linesToRemove.sort((a, b) => b.start - a.start);

    // Remove lines
    linesToRemove.forEach(range => {
        jsCode = removeLines(jsCode, range.start, range.end);
    });

    // Append new JS
    jsCode += '\n' + newJS;
    displayMessage("Awesome! Your page can do new tricks now!");
    console.log("Updated JavaScript after merge:", jsCode);
}

function removeFunction(jsCode, functionInfo) {
    let lines = jsCode.split('\n');
    lines.splice(functionInfo.line, functionInfo.endLine - functionInfo.line + 1);
    return lines.join('\n');
}

function removeVariable(jsCode, variableInfo) {
    let lines = jsCode.split('\n');
    lines.splice(variableInfo.line, variableInfo.endLine - variableInfo.line + 1);
    return lines.join('\n');
}

// Helper function to find the end line of a function
function findEndLine(jsCode, startLine) {
    let lines = jsCode.split('\n');
    let endLine = startLine;

    // Increment endLine until an empty line or end of code is reached
    while (endLine < lines.length && lines[endLine].trim() !== '') {
        endLine++;
    }

    return endLine;
}

// Helper function to remove lines from code
function removeLines(jsCode, startLine, endLine) {
    let lines = jsCode.split('\n');
    lines.splice(startLine, endLine - startLine + 1);
    console.log("Removed lines:", startLine, endLine);
    return lines.join('\n');
}

function extractGlobalVariables(jsCode) {
    let globalVars = {};
    // Match variable declarations at the top level
    let varPattern = /^(var|let|const)\s+([a-zA-Z0-9_]+)/;
    let functionPattern = /function\s+[a-zA-Z0-9_]+\s*\(/;
    let lines = jsCode.split('\n');

    let inGlobalScope = true;

    lines.forEach((line, index) => {
        // Check if we are entering a function
        if (functionPattern.test(line.trim())) {
            inGlobalScope = false;
        }

        // If we are in the global scope, check for variable declarations
        if (inGlobalScope && varPattern.test(line.trim())) {
            let match = varPattern.exec(line.trim());
            if (match) {
                let varName = match[2];
                globalVars[varName] = { line: index };
            }
        }

        // Check if we are exiting a function or block
        if (line.trim() === '}' || line.trim() === '};') {
            inGlobalScope = true;
        }
    });

    console.log("Extracted global variables with line numbers:", globalVars);
    return globalVars;
}

function combineAndDeduplicateCode(existingFunctions, existingVariables, newFunctions, newVariables) {
    let combinedCode = jsCode;
    let linesToRemove = [];

    // Add lines to remove for existing functions that are redefined
    for (let funcName in newFunctions) {
        if (existingFunctions.hasOwnProperty(funcName)) {
            linesToRemove.push(existingFunctions[funcName].line);
        }
    }

    // Add lines to remove for existing variables that are redeclared
    for (let varName in newVariables) {
        if (existingVariables.hasOwnProperty(varName)) {
            linesToRemove.push(existingVariables[varName].line);
        }
    }

    // Sort line numbers in descending order to avoid conflicts during removal
    linesToRemove.sort((a, b) => b - a);

    // Remove lines from the largest line number to the smallest
    linesToRemove.forEach(lineNumber => {
        combinedCode = removeLine(combinedCode, lineNumber);
    });

    return combinedCode;
}

function removeLine(code, lineNumber) {
    let lines = code.split('\n');
    lines.splice(lineNumber, 1); // Remove the specific line
    return lines.join('\n');
}

function removeCodeBlock(lineNumber) {
    let jsLines = jsCode.split('\n');
    let endIndex = lineNumber;
    while (endIndex < jsLines.length && jsLines[endIndex].trim() !== '') {
        endIndex++;
    }
    jsLines.splice(lineNumber, endIndex - lineNumber + 1);
    jsCode = jsLines.join('\n');
}

function removeCodeBlock(startIndex) {
    let jsLines = jsCode.split('\n');
    let endIndex = startIndex;
    while (endIndex < jsLines.length && jsLines[endIndex].trim() !== '') {
        endIndex++;
    }
    jsLines.splice(startIndex, endIndex - startIndex + 1);
    jsCode = jsLines.join('\n');
}

function extractFunctions(jsCode) {
    let functions = {};
    let functionPattern = /function\s+([a-zA-Z0-9_]+)\s*\(([^)]*)\)\s*\{([\s\S]*?)\}/gm;
    let match;

    // Apply the regex to the entire JavaScript code
    while ((match = functionPattern.exec(jsCode)) !== null) {
        let [fullMatch, functionName] = match;
        // Calculate the line number for the start of the match
        let line = jsCode.substring(0, match.index).split('\n').length;
        functions[functionName] = { code: fullMatch, line: line - 1 };
    }

    console.log("Extracted functions with line numbers:", functions);
    return functions;
}

document.getElementById('uploadArea').addEventListener('click', function() {
    document.getElementById('fileInput').click();  // Trigger file input when uploadArea is clicked
});

document.getElementById('uploadArea').addEventListener('drop', function(event) {
    event.preventDefault();
    handleFile(event.dataTransfer.files[0]);  // Handle file drop
});

document.addEventListener('dragover', function(event) {
    event.preventDefault();  // Required for drop to work
});

document.addEventListener('drop', function(event) {
    event.preventDefault(); // Prevent default behavior
    const files = event.dataTransfer.files;
    if (files && files.length > 0) {
        handleFile(files[0]);  // Handle the first file in the drop
    }
});

document.getElementById('uploadArea').addEventListener('drop', function(event) {
    event.preventDefault();
    handleFile(event.dataTransfer.files[0]);  // Handle file drop
});

document.getElementById('uploadArea').addEventListener('dragover', function(event) {
    event.preventDefault();  // Required for drop to work
});

function showPlaceholderSelectionUI(placeholders, fileType, file) {
    const modal = document.getElementById('placeholderModal');
    const optionsContainer = document.getElementById('placeholderOptions');

    // Clear previous options
    optionsContainer.innerHTML = '';

    placeholders.forEach((placeholder, index) => {
        const altTextMatch = placeholder.match(/alt="([^"]*)"/);
        const altText = altTextMatch ? altTextMatch[1] : `Spot ${index + 1}`;
        const option = document.createElement('button');
        option.textContent = `Choose ${altText}`;
        option.onclick = () => {
            replacePlaceholder(file, placeholder, fileType);
            modal.style.display = 'none';
        };
        optionsContainer.appendChild(option);
    });

    modal.style.display = 'block';
}

function checkForPlaceholder() {
    let imagePlaceholderFound = /<img src="THIS WILL BE REPLACED BY A DATA URL"/.test(htmlCode);

    // Updated regex to handle multiline and various attribute orders
    let audioPlaceholderRegex = /<audio[^>]*src\s*=\s*"THIS WILL BE REPLACED BY A DATA URL"[^>]*>([\s\S]*?)<\/audio>/;
    let audioPlaceholderFound = audioPlaceholderRegex.test(htmlCode);

    document.getElementById('uploadArea').style.display = imagePlaceholderFound || audioPlaceholderFound ? 'block' : 'none';
}

let imageDictionary = {};

function handleFile(file) {
    const fileType = file.type.startsWith('image/') ? 'image' : 'audio';
    const placeholders = findPlaceholders(fileType);

    if (placeholders.length > 1) {
        showPlaceholderSelectionUI(placeholders, fileType, file);
    } else if (placeholders.length === 1) {
        replacePlaceholder(file, placeholders[0], fileType);
    } else {
        displayMessage("No placeholders found for this type of file.");
    }
}

function findPlaceholders(fileType) {
    let placeholderRegex;
    if (fileType === 'image') {
        placeholderRegex = /<img src="THIS WILL BE REPLACED BY A DATA URL"/g;
    } else { // fileType === 'audio'
        placeholderRegex = /<audio[^>]*src\s*=\s*"THIS WILL BE REPLACED BY A DATA URL"/g;
    }
    return htmlCode.match(placeholderRegex) || [];
}

function replacePlaceholder(file, placeholder, fileType) {
    const reader = new FileReader();
    reader.onload = function(e) {
        const dataUrl = e.target.result;
        replacePlaceholdersInHTML(fileType, dataUrl, placeholder);
    };
    reader.readAsDataURL(file);
}

function replacePlaceholdersInHTML(fileType, dataUrl, placeholderToReplace) {
    if (fileType === 'image') {
        // Simplified regex to match any img tag with the placeholder in the src attribute
        let regex = /<img [^>]*src="THIS WILL BE REPLACED BY A DATA URL"[^>]*>/g;
        
        // Perform the replacement
        htmlCode = htmlCode.replace(regex, function(match) {
            return match.replace('THIS WILL BE REPLACED BY A DATA URL', dataUrl);
        });
    } else { // fileType === 'audio'
        // Existing logic for audio files
        htmlCode = htmlCode.replace(/(<audio [^>]*src=")THIS WILL BE REPLACED BY A DATA URL(" [^>]*>)/g, `$1${dataUrl}$2`);
    }

    displayMessage("Placeholder replaced successfully.");
    checkForPlaceholder();
}


function handleFileUpload(event) {
    handleFile(event.target.files[0]);  // Handle file selection
}

// Call this function initially and whenever HTML code is updated
checkForPlaceholder();

updateDownloadButtonState();
