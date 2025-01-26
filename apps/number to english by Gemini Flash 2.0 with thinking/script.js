document.addEventListener('DOMContentLoaded', () => {
    const expressionInput = document.getElementById('expression');
    const convertButton = document.getElementById('convertButton');
    const numericalResultDisplay = document.getElementById('numericalResult');
    const englishResultDisplay = document.getElementById('englishResult');
    const errorArea = document.getElementById('errorArea');

    convertButton.addEventListener('click', () => {
        errorArea.textContent = ''; // Clear previous errors
        numericalResultDisplay.textContent = '';
        englishResultDisplay.textContent = '';

        const expression = expressionInput.value;

        try {
            // Evaluate expression using BigInt if possible, otherwise default to Number for basic ops
            let result;
            try {
                result = eval(expression); // First try standard eval (for numbers and basic ops)
                if (typeof result === 'number' && !Number.isFinite(result)) {
                    throw new Error("Result is not a finite number"); // Catch Infinity and NaN from regular eval
                }
                if (typeof result === 'bigint') {
                    // BigInt result - all good
                } else if (typeof result === 'number') {
                    if (!Number.isInteger(result) && Math.abs(result - Math.round(result)) > Number.EPSILON) {
                        result = Math.round(result); // Round to integer if very close
                    }
                    result = BigInt(result); // Convert number result to BigInt for consistent handling
                } else {
                    throw new Error("Expression did not evaluate to a number or BigInt");
                }

            } catch (evalError) {
                // If standard eval fails (e.g., BigInt operations directly in eval might cause issues in some environments)
                // We will try a more basic approach. For robust BigInt expression parsing, a dedicated library is recommended.
                try {
                    // Simple attempt to parse and evaluate basic integer expressions with BigInt.
                    // For real-world complex expressions with BigInt, use a dedicated BigInt math library and parser.
                    const basicMathOps = ['+', '-', '*', '**']; // Supported basic operations
                    let parts = expression.split(/([+\-*\/()\s]+)/).filter(p => p.trim() !== ''); // Basic split for operators and operands
                    let bigIntExpression = '';

                    for (const part of parts) {
                        if (basicMathOps.includes(part.trim())) {
                            bigIntExpression += part;
                        } else if (!isNaN(part)) { // Check if it's a number (string representation)
                            bigIntExpression += `BigInt("${part}")`; // Wrap number in BigInt() constructor
                        } else {
                            throw new Error("Unsupported expression for BigInt evaluation.");
                        }
                    }

                    try {
                        result = eval(bigIntExpression); // Evaluate the constructed BigInt expression
                        if (typeof result !== 'bigint') {
                            throw new Error("BigInt expression did not evaluate to a BigInt.");
                        }
                    } catch (bigIntEvalError) {
                        throw new Error("Error evaluating BigInt expression: " + bigIntEvalError.message);
                    }


                } catch (fallbackError) {
                    throw new Error("Error evaluating expression: " + fallbackError.message + ".  For complex BigInt expressions, consider using a dedicated library.");
                }
            }


            numericalResultDisplay.textContent = result.toLocaleString('en-US'); // BigInt should stringify nicely
            englishResultDisplay.textContent = convertNumberToWords(result);


        } catch (error) {
            console.error("Error evaluating expression:", error);
            errorArea.textContent = "Error: " + error.message + " Please enter a valid mathematical expression using integers and basic operations (+, -, *, **).";
        }
    });

    function convertNumberToWords(number) {
        if (isNaN(Number(number))) {
            return "Invalid Number";
        }
        if (number === 0n || number === 0) {
            return "zero";
        }
        if (number < 0) {
            return "negative " + convertNumberToWords(BigInt(-number));
        }

        const ones = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'];
        const tens = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
        const teens = ['ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];

        const latinPrefixes = ["", "un", "duo", "tre", "quattuor", "quin", "sex", "septen", "octo", "novem", "decem", "undecim", "duodecim", "tredecim", "quattuordecim", "quindecim", "sexdecim", "septendecim", "octodecim", "novendecim", "viginti"];

        function generateLatinScaleNames(count) {
            const scales = ["thousand", "million", "billion", "trillion"]; // Start with standard names
            for (let i = 0; i < count; i++) {
                let prefixIndex = i + 1; // Start prefix index from 1 ("un") for scales beyond trillion
                let prefix = "";
                if (prefixIndex < latinPrefixes.length) {
                    prefix = latinPrefixes[prefixIndex];
                } else {
                    prefix = "latinPrefix" + prefixIndex; // Fallback for very large numbers if needed
                }
                scales.push(prefix + "illion");
            }
            return scales;
        }

        // Generate more scale names - you can adjust the count as needed.
        const thousandsScales = generateLatinScaleNames(25); // Generate standard names + 25 latin-derived beyond trillion

        function convertLessThanThousand(num) {
            if (num === 0n) {
                return '';
            }

            const numVal = Number(num); // Convert BigInt to Number once for comparisons and array indexing

            if (numVal < 10) {
                return ones[numVal];
            } else if (numVal < 20) {
                return teens[numVal - 10];
            } else if (numVal < 100) {
                const tensDigit = Math.floor(numVal / 10);
                const onesDigitBigInt = num % 10n; // Keep ones digit calculation as BigInt for modulo
                const onesDigitNum = Number(onesDigitBigInt); // Convert back to Number for array index
                return tens[tensDigit] + (onesDigitNum !== 0 ? ' ' + ones[onesDigitNum] : '');
            } else { // numVal >= 100
                const hundredsDigit = Math.floor(numVal / 100);
                const remainderBigInt = num % 100n; // Keep remainder as BigInt for modulo
                return ones[hundredsDigit] + ' hundred' + (remainderBigInt !== 0n ? ' and ' + convertLessThanThousand(remainderBigInt) : '');
            }
        }


        let numStr = String(number);


        let resultWords = '';
        let groupIndex = 0;
        const groupSize = 3;

        while (numStr.length > 0) {
            let groupStr = numStr.slice(-groupSize);
            numStr = numStr.slice(0, -groupSize);
            let group = BigInt(groupStr); // Parse group as BigInt

            if (group !== 0n) {
                let groupWords = convertLessThanThousand(group);
                let scaleName = ""; // Initialize as empty string
                if (groupIndex > 0) {
                    scaleName = thousandsScales[groupIndex - 1] || "scale-" + groupIndex; // Use generated scale name or fallback
                }
                if (scaleName) {
                    groupWords += ' ' + scaleName;
                }
                resultWords = groupWords + (resultWords ? ', ' + resultWords : '');
            }
            groupIndex++;
        }

        return resultWords.replace(/,\s*$/, '');
    }
});