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
            displayMessage("Not sure what to do what was pasted. Make sure it is correct code.\nPaste it into the chatbot and ask it.");
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
        displayMessage("An error while pasting occurred and has been placed on the clipboard.\nPlease go to your chatbot and paste the error so it can fix it.\nIf you don't know how to paste then ask it.", true);
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
        displayMessage("An error occurred while accessing the clipboard.\nThe error has been copied to the clipboard.\nPlease paste it to your chatbot for assistance.");
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
        finalHtml = finalHtml.replace('</head>', `<style>\n${cssCode}\n</style></head>`);
    }

    // Append jsCode to existing <script> or add new <script> element
    if (/<script[\s\S]*?>[\s\S]*?<\/script>/.test(htmlCode)) {
        finalHtml = finalHtml.replace(/(<script[\s\S]*?>[\s\S]*?)(<\/script>)/, `$1${jsCode}$2`);
    } else if (jsCode.trim() !== '') {
        finalHtml = finalHtml.replace('</body>', `<script>${jsCode}\n</script></body>`);
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

    if (isOnlyStyle || isOnlyScript) {
        handleSpecialElements(trimmedHTML, isOnlyStyle, isOnlyScript);
    } else {
        // Regular handling for HTML, CSS, and JavaScript
        handleRegularHtml(trimmedHTML);
    }

    // Try to substitute previously loaded media files
    replaceMediaPlaceholders();

    checkForPlaceholder(); // Check after updating HTML
    updateDownloadButtonState();
    displayMessage("Yay! Your web page is updated!");
}

function handleSpecialElements(html, isOnlyStyle, isOnlyScript) {
    if (isOnlyStyle) {
        let cssContent = html.match(/^<style.*?>([\s\S]*?)<\/style>$/i)[1].trim();
        mergeCSS(cssContent);
    } else if (isOnlyScript) {
        let scriptContent = html.match(/^<script\b[^>]*>([\s\S]*?)<\/script>$/i)[1].trim();
        if (!/src\s*=\s*['"]/.test(html)) {
            mergeJavaScript(scriptContent);
        }
    }
}

function handleRegularHtml(html) {
    // Remove <link rel="stylesheet" href=...> elements
    html = html.replace(/<link rel="stylesheet"[^>]*href="[^"]+"[^>]*>/gi, '');
    // Extract and keep CSS
    const cssRegex = /<style.*?>([\s\S]*?)<\/style>/gi;
    let extractedCSS = '';
    html = html.replace(cssRegex, function(match, css) {
        extractedCSS += css.trim() + '\n';
        return '';
    });
    mergeCSS(extractedCSS); // Merge extracted CSS

    // Extract JavaScript only if src is an external URL
    const jsRegex = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi;
    let extractedJS = '';
    html = html.replace(jsRegex, function(match, srcAttributes, js) {
        const srcMatch = /src\s*=\s*['"]([^'"]+)['"]/.exec(srcAttributes);
        const isExternalURL = srcMatch && /^https?:\/\//.test(srcMatch[1]);

        if (isExternalURL) {
            return match; // Keep the script tag if it's an external URL
        } else {
            extractedJS += js.trim() + '\n';
            return ''; // Remove the script tag if it's not external
        }
    });
    mergeJavaScript(extractedJS); // Merge extracted JavaScript

    // Append remaining HTML to the body
    appendToBody(html);
}

function appendToBody(snippet) {
    if (/\<body[^\>]*\>([\s\S]*)\<\/body\>/.test(htmlCode)) {
        htmlCode = htmlCode.replace(/\<\/body\>/, `${snippet}\n</body>`);
    } else {
        htmlCode += `\n${snippet}`;
    }
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
    // console.log("JavaScript before merge:", jsCode);
    // console.log("New JavaScript before merge:", newJS);
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
            let endLine = findEndOfVariableDeclaration(jsCode, startLine);
            linesToRemove.push({ start: startLine, end: endLine });
        }
    }

    // Sort lines to be removed in descending order of start line
    linesToRemove.sort((a, b) => b.start - a.start);

    // Remove lines
    linesToRemove.forEach(range => {
        jsCode = removeLines(jsCode, range.start, range.end);
    });

    // Append new functions and variables at the appropriate positions
    let mergedCode =  jsCode += '\n\n' + newJS;

    jsCode = reorganizeJavaScriptCode(mergedCode);
    displayMessage("Awesome! Your page can do new tricks now!");
    // console.log("Updated JavaScript after merge:", jsCode);
}

function reorganizeJavaScriptCode(jsCode) {
    const segments = extractSegments(jsCode);
    return reorderSegments(segments);
}

function extractSegments(jsCode) {
    const lines = jsCode.split('\n');
    let braceCount = 0;
    let isInMultilineVarOrFunc = false;
    let currentSegment = [];
    let segments = [];

    lines.forEach((line, index) => {
        const trimmedLine = line.trim();

        // Update brace count
        braceCount += (trimmedLine.match(/{/g) || []).length;
        braceCount -= (trimmedLine.match(/}/g) || []).length;

        // console.log(`Line ${index}: '${line}'`);
        // console.log(`  Brace count: ${braceCount}, isInMultilineVarOrFunc: ${isInMultilineVarOrFunc}`);

        // Detect the start of a multiline declaration or function
        if (!isInMultilineVarOrFunc && braceCount > 0 && 
            (trimmedLine.startsWith('const ') || trimmedLine.startsWith('let ') || 
             trimmedLine.startsWith('var ') || trimmedLine.startsWith('function'))) {
            isInMultilineVarOrFunc = true;
        }

        // Detect the end of a multiline declaration or function
        if (isInMultilineVarOrFunc && braceCount === 0) {
            isInMultilineVarOrFunc = false;
        }

        // Add line to the current segment
        currentSegment.push(line);

        // Determine if the current segment has ended
        if (!isInMultilineVarOrFunc && braceCount === 0 && 
            (trimmedLine === '' || index === lines.length - 1)) {
            if (currentSegment.some(l => l.trim() !== '')) {
                segments.push({
                    type: currentSegment.some(l => l.trim().startsWith('function') || l.trim().startsWith('const ') || 
                                              l.trim().startsWith('let ') || l.trim().startsWith('var ')) ? 'declaration' : 'topLevel',
                    code: currentSegment.join('\n')
                });
            }
            currentSegment = [];
        }
    });

    // Removing earlier occurrences of identical segments
    let uniqueSegments = [];
    segments.forEach((segment, index) => {
        if (!segments.slice(index + 1).some(s => s.code.trim() === segment.code.trim())) {
            uniqueSegments.push(segment);
        }
    });

    // console.log('Unique Segments:', uniqueSegments);
    return uniqueSegments;
}

function reorderSegments(segments) {
    const declarations = segments.filter(segment => segment.type === 'declaration').map(segment => segment.code);
    const topLevelCode = segments.filter(segment => segment.type === 'topLevel').map(segment => segment.code);

    return [...declarations, ...topLevelCode].join('\n\n').trim();
}


function removeFunction(jsCode, functionInfo) {
    let lines = jsCode.split('\n');
    // Remove from the start line to the end line of the function
    lines.splice(functionInfo.line, functionInfo.endLine - functionInfo.line + 1);
    console.log("Removed function:", functionInfo);
    return lines.join('\n');
}

function extractFunctions(jsCode) {
    let functions = {};
    let functionPattern = /function\s+([a-zA-Z0-9_]+)\s*\(([^)]*)\)\s*\{([\s\S]*?\n)\}/gm;
    let match;

    while ((match = functionPattern.exec(jsCode)) !== null) {
        let functionName = match[1];
        let functionCode = match[0]; // Capture the entire function code
        let line = jsCode.substring(0, match.index).split('\n').length - 1;
        let endLine = findEndLine(jsCode, line);

        functions[functionName] = { code: functionCode, line: line, endLine: endLine };
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

document.getElementById('uploadFileBtn').addEventListener('click', function() {
    document.getElementById('fileInput').click();  // Trigger file input when button is clicked
});

function handleFileUpload(event) {
    handleFile(event.target.files[0]);  // Handle file selection
}

function handleFile(file) {
    const fileType = file.type;

    if (fileType.startsWith('image/')) {
        // Handle image files
        processMediaFile(file, 'image');
    } else if (fileType.startsWith('audio/')) {
        // Handle audio files
        processMediaFile(file, 'audio');
    } else if (fileType === 'text/html') {
        // Handle HTML files
        processHtmlFile(file);
    } else {
        displayMessage("Unsupported file type.");
    }
}

function processMediaFile(file, mediaType) {
    const reader = new FileReader();
    reader.onload = function(e) {
        const dataUrl = e.target.result;
        const placeholders = findPlaceholders(mediaType);
        if (placeholders.length > 0) {
            replacePlaceholder(file, placeholders[0], mediaType);
        } else {
            displayMessage("No placeholders found for this type of file.");
        }
    };
    reader.readAsDataURL(file);
}

function processHtmlFile(file) {
    const reader = new FileReader();
    reader.onload = function(e) {
        const htmlContent = e.target.result;
        updateHTML(htmlContent);
    };
    reader.readAsText(file);
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

// Call this function initially and whenever HTML code is updated
checkForPlaceholder();

updateDownloadButtonState();
