let htmlCode = '', cssCode = '', jsCode = '';

document.getElementById('pasteBtn').addEventListener('click', async function() {
    try {
        const clipboardText = await navigator.clipboard.readText();
        const codeType = detectCodeType(clipboardText);

        switch (codeType) {
            case 'html':
                updateHTML(clipboardText);
                break;
            case 'css':
                mergeCSS(clipboardText);
                break;
            case 'js':
                mergeJavaScript(clipboardText);
                break;
                    default:
                        alert("Could not detect the code type. Please try again.");
                        break;
                }
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

    // Default to JavaScript
    return 'js';
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
    displayMessage("HTML updated successfully.");
}

function displayMessage(message, isError = false) {
    const messageArea = document.getElementById('messageArea');
    messageArea.innerText = message;
    if (isError) {
        messageArea.style.color = 'red';
    } else {
        messageArea.style.color = 'black'; // or any default color
    }
}

function mergeCSS(newCSS) {
    console.log("Existing CSS before merge:", cssCode);
    console.log("New CSS to merge:", newCSS);

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

    console.log("Updated CSS after merge:", cssCode);
    displayMessage("CSS merged successfully.");
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
            let endLine = existingVariables[varName].endLine; // Ensure we use the endLine
            console.log(`Removing lines for variable ${varName} from ${startLine} to ${endLine}`);
            jsCode = removeLines(jsCode, startLine, endLine);
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
    displayMessage("JavaScript merged successfully.");
    console.log("Updated JavaScript after merge:", jsCode);
}

// Helper function to find the end line of a function
function findEndLine(jsCode, startLine) {
    let lines = jsCode.split('\n');
    let endLine = startLine;
    while (endLine < lines.length && lines[endLine].trim() !== '}') {
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
    // Adjust the regex to match variables that start a declaration (potentially multi-line)
    let varPattern = /^\s*(var|let|const)\s+([a-zA-Z0-9_]+)/;
    let functionPattern = /function\s+([a-zA-Z0-9_]+)\s*\(([^)]*)\)\s*\{|{/;
    let endDeclarationPattern = /[;}]/;
    let lines = jsCode.split('\n');

    let inFunction = 0;
    let currentVarName = '';
    let startLine = 0;

    for (let i = 0; i < lines.length; i++) {
        if (functionPattern.test(lines[i])) {
            inFunction++;
        } else if (endDeclarationPattern.test(lines[i]) && inFunction > 0) {
            inFunction--;
        } else if (inFunction === 0 && varPattern.test(lines[i])) {
            let match = varPattern.exec(lines[i]);
            if (match) {
                currentVarName = match[2];
                startLine = i;

                // Look ahead for the end of the declaration
                let j = i;
                while (j < lines.length && !endDeclarationPattern.test(lines[j])) {
                    j++;
                }

                globalVars[currentVarName] = { line: startLine, endLine: j };
                i = j; // Skip to the end of the declaration
            }
        }
    }

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

document.getElementById('uploadArea').addEventListener('dragover', function(event) {
    event.preventDefault();  // Required for drop to work
});

function handleFileUpload(event) {
    handleFile(event.target.files[0]);  // Handle file selection
}

function handleFile(file) {
    if (file && (file.type.startsWith('image/') || file.type.startsWith('audio/'))) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const dataUrl = e.target.result;
            replacePlaceholder(dataUrl);
        };
        reader.readAsDataURL(file);
    } else {
        displayMessage("Please upload an image or sound file.");
    }
}

function replacePlaceholder(dataUrl) {
    const placeholder = "THIS WILL BE REPLACED BY A DATA URL";
    if (htmlCode.includes(placeholder)) {
        htmlCode = htmlCode.replace(placeholder, dataUrl);
        displayMessage("Placeholder in HTML replaced successfully.");
    } else if (jsCode.includes(placeholder)) {
        jsCode = jsCode.replace(placeholder, dataUrl);
        displayMessage("Placeholder in JavaScript replaced successfully.");
    } else {
        displayMessage("No placeholder found for replacement.");
    }
}

function checkForPlaceholder() {
    const placeholder = "THIS WILL BE REPLACED BY A DATA URL";
    if (htmlCode.includes(placeholder) || jsCode.includes(placeholder)) {
        document.getElementById('uploadArea').style.display = 'block';
    } else {
        document.getElementById('uploadArea').style.display = 'none';
    }
}

// Call this at the end of your JavaScript to set the initial state of the upload area
checkForPlaceholder();
updateDownloadButtonState();
