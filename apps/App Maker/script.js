let htmlCode = '', cssCode = '', jsCode = '';

let mediaDictionary = {};

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
        const { type: codeType, text: modifiedText } = detectCodeType(clipboardText);
        processCodeBlock(codeType, modifiedText);
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
            displayMessage("Not sure what to do what was pasted. Make sure it is correct code. Paste it into the chatbot and ask it.");
            break;
        default:
            console.log("Unrecognized code type: " + type);
            break;
    }
}

function handlePasteContent(clipboardContent) {
    try {
        if (typeof clipboardContent === 'string' || clipboardContent instanceof String) {
            detectAndProcessCode(clipboardContent);
        } else {
            handleFile(clipboardContent); // Assuming handleFile is a function to handle files
        }
    } catch (err) {
        // If an error occurs, copy error information to the clipboard
        copyTextToClipboard(`Error while pasting: ${err}\n\nPasted Content:\n${clipboardContent}`);
        // Display user-friendly error message
        displayMessage("An error while pasting occurred and has been placed on the clipboard. Please go to your chatbot and paste the error so it can fix it. If you don't know how to paste then ask it.", true);
    }
}

function copyTextToClipboard(text) {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand('copy');
    document.body.removeChild(textArea);
}

document.getElementById('pasteBtn').addEventListener('click', async function() {
    try {
        const clipboardText = await navigator.clipboard.readText();
        handlePasteContent(clipboardText);
    } catch (err) {
        copyTextToClipboard(`Error while accessing clipboard: ${err}`);
        alert("An error occurred while accessing the clipboard. The error has been copied to the clipboard. Please paste it to your chatbot for assistance.");
    }
});

// If you have a specific handler for Ctrl+V/Cmd+V, call handlePasteContent in it
// For example:
document.addEventListener('paste', function(event) {
    let clipboardData = event.clipboardData || window.clipboardData;
    if (clipboardData) {
        const clipboardItems = clipboardData.items;
        for (let item of clipboardItems) {
            if (item.type.indexOf('image') === 0) {
                let file = item.getAsFile();
                handlePasteContent(file);
                break;
            } else if (item.type === 'text/plain') {
                let text = clipboardData.getData('text/plain');
                handlePasteContent(text);
                break;
            }
        }
    }
});

// Function to assemble the final HTML
function assembleFinalHtml(htmlCode, cssCode, jsCode) {
    let finalHtml = htmlCode;

    // Append cssCode to existing <style> or add new <style> element
    if (/<style[\s\S]*?>[\s\S]*?<\/style>/.test(htmlCode)) {
        finalHtml = finalHtml.replace(/(<style[\s\S]*?>[\s\S]*?)(<\/style>)/, `$1${cssCode}$2`);
    } else if (cssCode.trim() !== '') {
        finalHtml = finalHtml.replace('</head>', `<style>${cssCode}</style></head>`);
    }

    // Append jsCode to existing <script> or add new <script> element
    if (/<script[\s\S]*?>[\s\S]*?<\/script>/.test(htmlCode)) {
        finalHtml = finalHtml.replace(/(<script[\s\S]*?>[\s\S]*?)(<\/script>)/, `$1${jsCode}$2`);
    } else if (jsCode.trim() !== '') {
        finalHtml = finalHtml.replace('</body>', `<script>${jsCode}</script></body>`);
    }

    return finalHtml;
}

document.getElementById('downloadBtn').addEventListener('click', function() {
    // Construct the complete HTML code
    const completeCode = assembleFinalHtml(htmlCode, cssCode, jsCode);

    download("my_project.html", completeCode);
});

document.getElementById('runBtn').addEventListener('click', function() {
    // Construct the complete HTML code
    const completeCode = assembleFinalHtml(htmlCode, cssCode, jsCode);

    // Create a Blob from the HTML String
    const blob = new Blob([completeCode], { type: 'text/html' });

    // Create a URL for the Blob
    const blobUrl = URL.createObjectURL(blob);

    // Open the Blob URL in a new tab
    window.open(blobUrl, '_blank');
});

function detectCodeType(text) {
    // Trim leading and trailing whitespace
    let cleanedText = text.trim();

    // Remove HTML comments
    cleanedText = cleanedText.replace(/<!--[\s\S]*?-->/g, '').trim();

    // Check for CSS wrapped in <style> tags
    if (cleanedText.startsWith('<style>') && cleanedText.endsWith('</style>')) {
        cleanedText = cleanedText.slice('<style>'.length, -'</style>'.length).trim();
        return { type: 'css', text: cleanedText };
    }

    // Check for JavaScript wrapped in <script> tags
    if (cleanedText.startsWith('<script>') && cleanedText.endsWith('</script>')) {
        cleanedText = cleanedText.slice('<script>'.length, -'</script>'.length).trim();
        return { type: 'javascript', text: cleanedText };
    }

    // Check for HTML
    if (cleanedText.charAt(0) === '<') {
        return { type: 'html', text: cleanedText };
    }

    // Check for CSS pattern
    const cssPattern = /[#.][a-zA-Z0-9_-]+\s*\{[\s\S]+?\}/gm;
    if (cssPattern.test(cleanedText)) {
        return { type: 'css', text: cleanedText };
    }

    // Check for JavaScript syntax errors
    if (hasSyntaxError(cleanedText)) {
        return { type: 'bad_javascript', text: cleanedText };
    }

    // Default to JavaScript
    return { type: 'javascript', text: cleanedText };
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
    const runButton = document.getElementById('runBtn');
    if (htmlCode.trim() === '') {
        downloadButton.disabled = true;
        runButton.disabled = true;
    } else {
        downloadButton.disabled = false;
        runButton.disabled = false;
    }
}

function updateHTML(newHTML) {
    // Check if the entire HTML is just a <style> or <script> element
    const trimmedHTML = newHTML.trim();
    const isOnlyStyle = /^<style.*?>[\s\S]*<\/style>$/i.test(trimmedHTML);
    const isOnlyScript = /^<script\b[^>]*>[\s\S]*<\/script>$/i.test(trimmedHTML);

    if (isOnlyStyle) {
        let match = trimmedHTML.match(/^<style.*?>([\s\S]*?)<\/style>$/i);
        if (match) {
            mergeCSS(match[1].trim());
        }
    } else if (isOnlyScript) {
        let match = trimmedHTML.match(/^<script\b[^>]*>([\s\S]*?)<\/script>$/i);
        if (match && !/src\s*=\s*['"]/.test(match[0])) {
            mergeJavaScript(match[1].trim());
        }
    } else {
        // Regular handling for HTML, CSS, and JavaScript

        // Extract and keep CSS
        const cssRegex = /<style.*?>([\s\S]*?)<\/style>/gi;
        let extractedCSS = '';
        newHTML = newHTML.replace(cssRegex, function(match, css) {
            extractedCSS += css.trim() + '\n';
            return '';
        });
        mergeCSS(extractedCSS); // Merge extracted CSS

        // Extract and keep JavaScript without src attribute
        const jsRegex = /<script\b[^>]*>([\s\S]*?)<\/script>/gi;
        let extractedJS = '';
        newHTML = newHTML.replace(jsRegex, function(match, js) {
            if (!/src\s*=\s*['"]/.test(match)) {
                extractedJS += js.trim() + '\n';
                return '';
            }
            return match; // Keep the script tag with 'src' attribute
        });
        mergeJavaScript(extractedJS); // Merge extracted JavaScript

        // Update the HTML code
        htmlCode = newHTML.trim();
    }

    // Try to substitute previously loaded media files
    replaceMediaPlaceholders();

    checkForPlaceholder(); // Check after updating HTML
    updateDownloadButtonState();
    displayMessage("Yay! Your web page is updated!");
}

function replacePlaceholdersInHTML(fileType, dataUrl, placeholderToReplace) {
    if (fileType === 'image') {
        // Find image placeholders and update the dictionary
        htmlCode = htmlCode.replace(/<img ([^>]*)src="THIS WILL BE REPLACED BY A DATA URL" alt="([^"]+)"([^>]*)>/g, function(match, preId, altText, postId) {
            if (altText === placeholderToReplace) {
                mediaDictionary[altText] = dataUrl; // Update the dictionary
                return `<img ${preId}src="${dataUrl}" alt="${altText}"${postId}>`;
            }
            return match;
        });
    } else if (fileType === 'audio') {
        // Find audio placeholders and update the dictionary
        htmlCode = htmlCode.replace(/<audio ([^>]*)src="THIS WILL BE REPLACED BY A DATA URL"([^>]*)alt="([^"]+)"([^>]*)>/g, function(match, preSrc, postSrc, altText, postAlt) {
            if (altText === placeholderToReplace) {
                mediaDictionary[altText] = dataUrl; // Update the dictionary
                return `<audio ${preSrc}src="${dataUrl}"${postSrc}alt="${altText}"${postAlt}></audio>`;
            }
            return match;
        });
    }

    displayMessage("Placeholder replaced successfully.");
    checkForPlaceholder();
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

    // Split existing and new CSS by empty lines
    let existingStyles = cssCode.trim().split(/\n\s*\n/).filter(Boolean);
    let newStyles = newCSS.trim().split(/\n\s*\n/).filter(Boolean);

    // Convert existing styles to a map for easy lookup
    let existingStylesMap = new Map();
    existingStyles.forEach(style => {
        let selector = style.split('{')[0].trim();
        existingStylesMap.set(selector, style);
    });

    // Process new styles
    newStyles.forEach(newStyle => {
        let selector = newStyle.split('{')[0].trim();
        // Replace existing style or add new style
        existingStylesMap.set(selector, newStyle);
    });

    // Convert the map back to a string
    cssCode = Array.from(existingStylesMap.values()).join('\n\n');

    // console.log("Updated CSS after merge:", cssCode);
    displayMessage("Your page's style is updated!");
}

// Parse CSS string into an object
function parseCss(cssString) {
    let stylesObject = {};
    let rules = cssString.split('}').map(s => s.trim()).filter(Boolean);

    rules.forEach(rule => {
        let [selector, properties] = rule.split('{').map(s => s.trim());
        stylesObject[selector] = properties;
    });

    return stylesObject;
}

// Construct CSS string from an object
function constructCssFromObject(stylesObject) {
    let cssString = '';
    for (let selector in stylesObject) {
        cssString += `${selector} { ${stylesObject[selector]} }\n`;
    }
    return cssString.trim();
}

function mergeJavaScript(newJS) {
    console.log("JavaScript before merge:", jsCode);
    console.log("New JavaScript before merge:", newJS);
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
            let endLine = findEndOfVariableDeclaration(jsCode, startLine); // New function for finding the end of a variable declaration
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

function extractFunctions(jsCode) {
    let functions = {};
    let functionPattern = /function\s+([a-zA-Z0-9_]+)\s*\(([^)]*)\)\s*\{([\s\S]*?)\}/gm;
    let match;

    // Apply the regex to the entire JavaScript code
    while ((match = functionPattern.exec(jsCode)) !== null) {
        let functionName = match[1];
        // Calculate the line number for the start of the match
        let line = jsCode.substring(0, match.index).split('\n').length - 1; // Subtract 1 for zero-based indexing
        let endLine = findEndLine(jsCode, line);
        functions[functionName] = { line: line, endLine: endLine };
    }

    console.log("Extracted functions with line numbers:", functions);
    return functions;
}

function extractGlobalVariables(jsCode) {
    let globalVars = {};
    let varPattern = /^(var|let|const)\s+([a-zA-Z0-9_]+)/;
    let braceCount = 0; // Counter for curly braces

    jsCode.split('\n').forEach((line, index) => {
        // Update brace count
        if (!line.trim().startsWith('//')) { // Ignore single line comments
            let inString = false;
            for (let char of line) {
                if (char === '"' || char === "'") {
                    inString = !inString; // Toggle inString status when a quote is encountered
                }
                if (!inString && char === '{') {
                    braceCount++;
                } else if (!inString && char === '}') {
                    braceCount--;
                }
            }
        }

        // Check for variable declarations at the top level
        if (braceCount === 0 && varPattern.test(line.trim())) {
            let match = varPattern.exec(line.trim());
            if (match) {
                let varName = match[2];
                globalVars[varName] = { line: index };
            }
        }
    });

    console.log("Extracted global variables with line numbers:", globalVars);
    return globalVars;
}

// Helper function to find the end line of a function
function findEndLine(jsCode, startLine) {
    let lines = jsCode.split('\n');
    let braceCount = 0;
    let endLine = startLine;

    for (let i = startLine; i < lines.length; i++) {
        let line = lines[i].trim();
        if (!line.startsWith('//')) { // Ignore single line comments
            let inString = false;
            for (let char of line) {
                if (char === '"' || char === "'") {
                    inString = !inString; // Toggle inString status when a quote is encountered
                }
                if (!inString && char === '{') {
                    braceCount++;
                } else if (!inString && char === '}') {
                    braceCount--;
                }
            }
        }

        if (braceCount === 0) {
            endLine = i;
            break;
        }
    }

    return endLine;
}

function findEndOfVariableDeclaration(jsCode, startLine) {
    let lines = jsCode.split('\n');
    let endLine = startLine;

    for (let i = startLine; i < lines.length; i++) {
        if (lines[i].includes(';')) {
            endLine = i;
            break;
        }
    }

    return endLine;
}

// Helper function to remove lines from code
function removeLines(jsCode, startLine, endLine) {
    let lines = jsCode.split('\n');
    lines.splice(startLine, endLine - startLine + 1);
    // console.log("Removed lines:", startLine, endLine);
    return lines.join('\n');
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
    let placeholders = [];

    if (fileType === 'image') {
        placeholderRegex = /<img [^>]*src="THIS WILL BE REPLACED BY A DATA URL"[^>]*alt="([^"]+)"[^>]*>/g;
    } else { // fileType === 'audio'
        placeholderRegex = /<audio [^>]*src="THIS WILL BE REPLACED BY A DATA URL"[^>]*alt="([^"]+)"[^>]*>/g;
    }

    let match;
    while ((match = placeholderRegex.exec(htmlCode)) !== null) {
        placeholders.push(match[1]); // match[1] contains the captured alt attribute
    }

    return placeholders;
}

function replacePlaceholder(file, placeholder, fileType) {
    const reader = new FileReader();
    reader.onload = function(e) {
        const dataUrl = e.target.result;
        replacePlaceholdersInHTML(fileType, dataUrl, placeholder);
    };
    reader.readAsDataURL(file);
}

function replaceMediaPlaceholders() {
    // Replace image placeholders
    htmlCode = htmlCode.replace(/<img [^>]*src="THIS WILL BE REPLACED BY A DATA URL" alt="([^"]+)"[^>]*>/g, function(match, altText) {
        if (mediaDictionary[altText]) {
            return `<img src="${mediaDictionary[altText]}" alt="${altText}">`;
        }
        return match;
    });

    // Replace audio placeholders
    htmlCode = htmlCode.replace(/<audio[^>]*src="THIS WILL BE REPLACED BY A DATA URL" id="([^"]+)"[^>]*>([\s\S]*?)<\/audio>/g, function(match, id) {
        if (mediaDictionary[id]) {
            return `<audio src="${mediaDictionary[id]}" id="${id}">${match.match(/<audio[^>]*>([\s\S]*?)<\/audio>/)[1]}</audio>`;
        }
        return match;
    });

    // After replacing placeholders, update the display or other necessary elements
    checkForPlaceholder();
}

function handleFileUpload(event) {
    handleFile(event.target.files[0]);  // Handle file selection
}

// Call this function initially and whenever HTML code is updated
checkForPlaceholder();

updateDownloadButtonState();
