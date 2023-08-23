function gcd(a, b) {
    if (b === BigInt(0)) return a;
    return gcd(b, a % b);
}


function toFraction(numerator, denominator) {
    const divisor = gcd(numerator, denominator);
    const simplifiedNumerator = numerator / divisor;
    const simplifiedDenominator = denominator / divisor;
    
    if (simplifiedNumerator === simplifiedDenominator) {
        return "1";
    }
    return `${simplifiedNumerator}/${simplifiedDenominator}`;
}

function toMixedNumber(numerator, denominator) {
    const whole = (numerator / denominator);
    numerator = (numerator - (whole * denominator));
    
    if (numerator === BigInt(0)) {
        return whole.toString();
    } else {
        const fractionalPart = toFraction(numerator, denominator);
        return `${whole} ${fractionalPart}`;
    }
}

function toDecimal(numerator, denominator, scale = 1) {
    const quotient = (numerator / denominator);
    let remainder = (numerator % denominator);
    let decimalPart = '';
    const seenRemainders = new Map();

    while (remainder !== BigInt(0) && !seenRemainders.has(remainder.toString())) {
        seenRemainders.set(remainder.toString(), decimalPart.length);
        remainder = (remainder * BigInt(10));
        const part = (remainder / denominator);
        decimalPart += part.toString().padStart(1, '0');
        remainder = (remainder % denominator);
    }

    let nonRepeating = decimalPart;
    let repeating = '';

    if (seenRemainders.has(remainder.toString())) {
        const startRepeatIndex = seenRemainders.get(remainder.toString());
        nonRepeating = decimalPart.substring(0, startRepeatIndex);
        repeating = decimalPart.substring(startRepeatIndex);
        repeating = simplifyRepeatingPart(repeating);  // Simplify the repeating sequence
    }   

    return {
        wholePart: quotient.toString(),
        nonRepeating: nonRepeating,
        repeating: repeating
    };
}

function simplifyRepeatingPart(repeatingPart) {
    for (let i = 1; i <= repeatingPart.length / 2; i++) {
        const candidate = repeatingPart.substring(0, i);
        const regex = new RegExp(candidate, 'g');
        if (repeatingPart.replace(regex, '') === '') {
            return candidate;
        }
    }
    return repeatingPart;
}

function calculate() {
    try {
        let num1 = BigInt(document.getElementById('num1').value);
        let num2 = BigInt(document.getElementById('num2').value);
        const operation = document.getElementById('operation').value;
        const displayFormat = document.getElementById('displayFormat').value;
        let result;

        const displayAsScientific = (n, d) => {
            const plainNumber = (n / d).toString();
            const resultBox = document.getElementById('result');
            resultBox.setAttribute('data-plain-result', plainNumber);
        
            const isInteger = (n % d === 0n);
            resultBox.setAttribute('data-is-integer', isInteger ? 'true' : 'false');
        
            if (displayFormat === 'scientific') {
                return toScientificNotation(n, d);
            } else if (displayFormat === "english") {
                return conwayNumberToWords(n, d);
            }
            return plainNumber;
        };

        switch (operation) {
            case '+':
                result = displayAsScientific(num1 + num2, 1n);
                break;
            case '-':
                result = displayAsScientific(num1 - num2, 1n);
                break;
            case '*':
                result = displayAsScientific(num1 * num2, 1n);
                break;
            case '/':
                if (num2 !== BigInt(0)) {
                    displayAsScientific(num1, num2); // Set attributes but ignore the result
                    if (displayFormat === 'decimal') {
                        result = toDecimal(num1, num2);
                    } else if (displayFormat === 'scientific') {
                        result = toScientificNotation(num1, num2);
                    } else if (displayFormat === 'english') {
                        // this conditional added manually
                        result = conwayNumberToWords(num1, num2);
                    } else {
                        result = toFraction(num1, num2);
                    }
                } else {
                    throw new Error('Cannot divide by zero!');
                }
                break;
            case '^':
                result = displayAsScientific(num1 ** num2, 1n);
                break;
        }
        displayResult(result);
        document.getElementById('error').innerText = '';
    } catch (error) {
        if (error instanceof RangeError && error.message.includes("Maximum BigInt size exceeded")) {
            document.getElementById('error').innerText = 'Error: Maximum BigInt size exceeded!';
        } else {
            document.getElementById('error').innerText = error.message;
            console.error(error);
        }
    }
}

function copyResultToNum1() {
    const resultBox = document.getElementById('result');
    const isInteger = resultBox.getAttribute('data-is-integer') === 'true';
    const errorElement = document.getElementById('error');
    if (isInteger) {
        document.getElementById('num1').value = resultBox.getAttribute('data-plain-result');
        errorElement.innerText = ''; // Clear any previous messages
    } else {
        errorElement.innerText = 'The result is not an integer, so it cannot be copied.';
    }
}

function copyResultToNum2() {
    const resultBox = document.getElementById('result');
    const isInteger = resultBox.getAttribute('data-is-integer') === 'true';
    const errorElement = document.getElementById('error');
    if (isInteger) {
        document.getElementById('num2').value = resultBox.getAttribute('data-plain-result');
        errorElement.innerText = ''; // Clear any previous messages
    } else {
        errorElement.innerText = 'The result is not an integer, so it cannot be copied.';
    }
}

function displayResult(result) {
    const copyButtons = document.querySelectorAll('.copy-result-btn');
    copyButtons.forEach(button => button.style.display = 'inline');
    const resultBox = document.getElementById('result');

    // Check if the result is an object and convert it to a string if necessary
    let resultStr;
    if (typeof result === 'object') {
        resultStr = `${result.wholePart}.${result.nonRepeating}<span class="repeating">${result.repeating}</span>`;
    } else {
        resultStr = result;
    }

    const encodedResult = encodeURIComponent(resultStr); // Encode the HTML

    // Create a plain text version of the result for length checking
    const plainResult = resultStr.replace(/<\/?[^>]+(>|$)/g, "");

    // Use the length of plainResult for the check
    if (plainResult.length > 30) {
        resultBox.innerHTML = `<a href="#" onclick="openResultInNewTab(decodeURIComponent('${encodedResult}')); return false;">Click to view the full result</a>`;
    } else {
        resultBox.innerHTML = resultStr;  // Use innerHTML to maintain HTML formatting
    }
}

// Function to calculate base^exponent as BigInt
function bigIntPow(base, exponent) {
    let result = BigInt(1);
    let bigBase = BigInt(base);
    for (let i = 0; i < exponent; i++) {
        result *= bigBase;
    }
    return result;
}

function toScientificNotation(numerator, denominator) {
    numerator = BigInt(numerator);
    denominator = BigInt(denominator);
    
    // Handle whole numbers
    if (numerator % denominator === 0n) {
        let wholeNumber = numerator / denominator;
        let exponent = 0n;
        let removedDigits = [];
        while (wholeNumber >= 10n) {
            removedDigits.unshift(wholeNumber % 10n);
            wholeNumber /= 10n;
            exponent++;
        }
        // Simplify the mantissa if possible
        let mantissa = removedDigits.length ? wholeNumber.toString() + '.' + removedDigits.join('') : wholeNumber.toString();
        mantissa = simplifyMantissa(mantissa);
        return mantissa + ' &times; 10<sup>' + exponent.toString() + '</sup>';
    }

    // Normalize the fraction
    const divisor = gcd(numerator, denominator);
    numerator /= divisor;
    denominator /= divisor;

    // Initialize variables
    let repeatingDecimalStr = '';
    let exponent = 0n;

    // Adjust numerator and denominator to ensure mantissa will be between 1 and 10
    while (numerator < denominator) {
        numerator *= 10n;
        exponent--;
    }
    while (numerator >= 10n * denominator) {
        denominator *= 10n;
        exponent++;
    }

    // Calculate the repeating decimal expansion for the fractional part
    let remainders = [];
    let decimals = [];
    let integralPart = numerator / denominator;
    numerator %= denominator;
    repeatingDecimalStr += integralPart.toString();

    while (numerator > 0n) {
        let index = remainders.indexOf(numerator);
        if (index !== -1) {
            decimals.splice(index, 0, '(');
            decimals.push(')');
            break;
        }
        remainders.push(numerator);
        numerator *= 10n;
        let decimalPart = numerator / denominator;
        decimals.push(decimalPart.toString());
        numerator %= denominator;
    }

    // Concatenate the repeating decimal expansion
    repeatingDecimalStr += '.' + decimals.join('');

    // Detect repeating part
    let repeatingPart = null;
    if (repeatingDecimalStr.includes('(')) {
        repeatingPart = repeatingDecimalStr.split('(')[1].split(')')[0];
        if (repeatingPart) {
            repeatingDecimalStr = repeatingDecimalStr.replace('(' + repeatingPart + ')', '<span style="text-decoration:overline;">' + repeatingPart + '</span>');
        }
    }

    // Construct the HTML for the scientific notation
    return repeatingDecimalStr + ' &times; 10<sup>' + exponent.toString() + '</sup>';
}

function simplifyMantissa(mantissa) {
    // Remove trailing zeros in the decimal part
    while (mantissa.includes('.') && (mantissa.endsWith('0') || mantissa.endsWith('.'))) {
        mantissa = mantissa.slice(0, -1);
    }
    // If the mantissa is an integer, ensure it's in integer form
    return mantissa === '' ? '1' : mantissa;
}

// function openResultInNewTab(result) {
//     const blob = new Blob([result], { type: 'text/plain' });
//     const url = URL.createObjectURL(blob);
//     window.open(url, '_blank');
// }
function openResultInNewTab(encodedResult) {
    const result = decodeURIComponent(encodedResult);  // Decode the HTML
    const newWindow = window.open("", "_blank");
    newWindow.document.write('<html><head>');
    newWindow.document.write('<style>#result .repeating {text-decoration: overline;}</style>');  // Add your CSS here
    newWindow.document.write('</head><body>');
    newWindow.document.write('<div id="result">');  // Add an element with id "result"
    newWindow.document.write(result);  // Insert the HTML result into the new tab
    newWindow.document.write('</div>');  // Close the div
    newWindow.document.write('</body></html>');
}

function displayFractionResult(numerator, denominator) {
    if (denominator === BigInt(1)) {
        return numerator.toString();
    }
    return numerator + "/" + denominator;
}

function getConwayPrefix(position) {
    let units = ["", "un", "duo", "tre", "quattuor", "quin", "sex", "septen", "octo", "novem"];
    let tens = ["", "", "deci", "viginti", "triginta", "quadraginta", "quinquaginta", "sexaginta", "septuaginta", "octoginta", "nonaginta"];
    let hundreds = ["", "centi", "ducenti", "trecenti", "quadringenti", "quingenti", "sescenti", "septingenti", "octingenti", "nongenti"];
    
    position -= 1;  // 0-based indexing
    let unitsVal = position % 10;
    let tensVal = Math.floor(position / 10) % 10;
    let hundredsVal = Math.floor(position / 100) % 10;
    
    return hundreds[hundredsVal] + tens[tensVal] + units[unitsVal];
}

function threeDigitsToWords(num) {
    let ones = ["", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine"];
    let teens = ["", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen"];
    let tens = ["", "ten", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"];
    
    if (1 <= num && num < 10) {
        return ones[num];
    } else if (11 <= num && num < 20) {
        return teens[num - 10];
    } else if (10 <= num && num < 100) {
        return tens[Math.floor(num / 10)] + (num % 10 === 0 ? "" : "-" + ones[num % 10]);
    } else {
        return ones[Math.floor(num / 100)] + " hundred" + (num % 100 === 0 ? "" : " " + threeDigitsToWords(num % 100));
    }
}

function conwayNumberToWords(num, denominator) {
    // 'demonimator' and the following conditional was added manually
    if (denominator !== 1n) {
        // Normalize the fraction
        const divisor = gcd(num, denominator);
        num /= divisor;
        denominator /= divisor;
        // normalize code copied from generated code in toScientificNotation
        return conwayNumberToWords(num, 1n) + " over " + conwayNumberToWords(denominator, 1n);
    }
 
    let baseNames = ["", "thousand", "million", "billion", "trillion", "quadrillion", "quintillion", "sextillion", "septillion", "octillion", "nonillion", "decillion"];
    let numStr = num.toString();
    let exponent = numStr.length - 1;
    let position = Math.floor(exponent / 3);
    
    if (numStr === "1" + "0".repeat(numStr.length - 1)) {
        if (position < baseNames.length) {
            return "one " + baseNames[position];
        } else {
            let prefix = getConwayPrefix(position);
            return "one " + prefix + "illion";
        }
    }
    
    let chunks = [];
    while (num > 0) {
        chunks.push(num % 1000n);
        num /= 1000n;
    }

    let words = [];
    for (let idx = 0; idx < chunks.length; idx++) {
        let chunk = chunks[idx];
        if (chunk) {
            let chunkWords = threeDigitsToWords(Number(chunk));
            if (idx < baseNames.length) {
                words.push(chunkWords + (baseNames[idx] ? " " + baseNames[idx] : ""));
            } else {
                let prefix = getConwayPrefix(idx + 1);
                words.push(chunkWords + " " + prefix + "illion");
            }
        }
    }
    
    return words.reverse().join(" ").trim();
}


