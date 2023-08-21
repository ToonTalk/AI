function gcd(a, b) {
    if (b.isZero()) return a;
    return gcd(b, a.mod(b));
}

function toFraction(numerator, denominator) {
    const divisor = gcd(numerator, denominator);
    return `${numerator.divide(divisor)}/${denominator.divide(divisor)}`;
}

function toMixedNumber(numerator, denominator) {
    const whole = numerator.divide(denominator);
    numerator = numerator.minus(whole.multiply(denominator));
    return `${whole} ${toFraction(numerator, denominator)}`;
}

function toDecimal(numerator, denominator) {
    const quotient = numerator.divide(denominator);
    let remainder = numerator.mod(denominator);
    let decimalPart = '';
    const seenRemainders = new Map();

    while (!remainder.isZero() && !seenRemainders.has(remainder.toString())) {
        seenRemainders.set(remainder.toString(), decimalPart.length);
        remainder = remainder.multiply(100);
        const part = remainder.divide(denominator);
        decimalPart += part.toString().padStart(2, '0');
        remainder = remainder.mod(denominator);
    }

    if (seenRemainders.has(remainder.toString())) {
        const startRepeatIndex = seenRemainders.get(remainder.toString());
        const nonRepeating = decimalPart.substring(0, startRepeatIndex);
        const repeating = decimalPart.substring(startRepeatIndex);
        return `${quotient}.${nonRepeating}<span class="repeating">${repeating}</span>`;
    }

    return `${quotient}.${decimalPart}`;
}

function calculate() {
    try {
        let num1 = bigInt(document.getElementById('num1').value);
        let num2 = bigInt(document.getElementById('num2').value);
        const operation = document.getElementById('operation').value;
        const displayFormat = document.getElementById('displayFormat').value;
        let result;

        switch (operation) {
            case '+':
                result = num1.add(num2).toString();
                break;
            case '-':
                result = num1.minus(num2).toString();
                break;
            case '*':
                result = num1.multiply(num2).toString();
                break;
            case '/':
                if (!num2.isZero()) {
                    if (displayFormat === 'decimal') {
                        result = toDecimal(num1, num2);
                    } else {
                        result = toFraction(num1, num2);
                    }
                } else {
                    throw new Error('Cannot divide by zero!');
                }
                break;
        }

        if (displayFormat === 'mixed' && result.includes('/')) {
            const [num, den] = result.split('/').map(bigInt);
            result = toMixedNumber(num, den);
        }

        document.getElementById('result').innerHTML = result;
        document.getElementById('error').innerText = '';
    } catch (error) {
        document.getElementById('error').innerText = error.message;
    }
}