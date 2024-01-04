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
                console.error('Failed to read clipboard contents: ', err);
            }
        });

document.getElementById('downloadBtn').addEventListener('click', function() {
    const completeCode = `<html><head><style>${cssCode}</style></head><body>${htmlCode}<script>${jsCode}</script></body></html>`;
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

function updateHTML(newHTML) {
    console.log("Original HTML:", newHTML);

    // Extract and remove CSS
    const cssRegex = /<style.*?>([\s\S]*?)<\/style>/gi;
    let extractedCSS = '';
    newHTML = newHTML.replace(cssRegex, function(match, css) {
        extractedCSS += css.trim() + '\n';
        return '';
    });
    console.log("Extracted CSS:", extractedCSS);
    mergeCSS(extractedCSS);

    // Extract and remove JavaScript
    const jsRegex = /<script.*?>([\s\S]*?)<\/script>/gi;
    let extractedJS = '';
    newHTML = newHTML.replace(jsRegex, function(match, js) {
        extractedJS += js.trim() + '\n';
        return '';
    });
    console.log("Extracted JavaScript:", extractedJS);
    mergeJavaScript(extractedJS);

    // Update the HTML code
    htmlCode = newHTML.trim();
    console.log("Updated HTML:", htmlCode);
    displayMessage("HTML updated successfully.");
}

function displayMessage(message) {
    document.getElementById('messageArea').innerText = message;
}

function mergeCSS(newCSS) {
    // console.log("Existing CSS before merge:", cssCode);
    // console.log("New CSS to merge:", newCSS);
    // This is a simplified approach and might not work for complex CSS
    let existingStyles = cssCode.split('}');
    let newStyles = newCSS.split('}');

    newStyles.forEach(style => {
        let selector = style.split('{')[0].trim();
        if (selector && !cssCode.includes(selector + " {")) {
            cssCode += style + '}';
        }
    });

    // Remove empty lines and trim
    cssCode = cssCode.split('\n').filter(Boolean).join('\n').trim();
    // console.log("Updated CSS after merge:", cssCode);
    displayMessage("CSS merged successfully.");
}   

function mergeJavaScript(newJS) {
    // console.log("Existing JavaScript before merge:", jsCode);
    // console.log("New JavaScript to merge:", newJS);

    // Split existing and new JavaScript into lines for comparison
    let existingLines = jsCode.split('\n');
    let newLines = newJS.split('\n');

    newLines.forEach(newLine => {
        newLine = newLine.trim();
        if (newLine.startsWith("function")) {
            let functionName = newLine.split(' ')[1].split('(')[0]; // Extract function name
            // Check if this function is already defined
            if (!existingLines.some(existingLine => existingLine.includes("function " + functionName))) {
                jsCode += '\n' + newLine;
            }
        } else {
            jsCode += '\n' + newLine;
        }
    });
    displayMessage("JavaScript merged successfully.");
    // console.log("Updated JavaScript after merge:", jsCode);
}



