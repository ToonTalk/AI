function convertToFrench() {
    const numberInput = document.getElementById('numberInput').value;
    let number;

    try {
        number = BigInt(numberInput);
    } catch (e) {
        document.getElementById('result').textContent = 'Please enter a valid number.';
        return;
    }

    const resultElement = document.getElementById('result');
    const frenchWords = convertNumberToFrench(number);
    resultElement.textContent = `French: ${frenchWords}`;
}

function convertNumberToFrench(number) {
    const units = ['zéro', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf'];
    const teens = ['dix', 'onze', 'douze', 'treize', 'quatorze', 'quinze', 'seize', 'dix-sept', 'dix-huit', 'dix-neuf'];
    const tens = ['', 'dix', 'vingt', 'trente', 'quarante', 'cinquante', 'soixante', 'soixante', 'quatre-vingt', 'quatre-vingt'];
    const specialTens = ['soixante-dix', 'quatre-vingt-dix'];

    if (number === 0n) return units[0];

    let result = '';
    let numStr = number.toString();

    if (numStr.length > 3) {
        result += convertNumberToFrench(BigInt(numStr.slice(0, -3))) + ' mille ';
        numStr = numStr.slice(-3);
    }

    if (numStr.length === 3) {
        if (numStr[0] !== '0') {
            result += units[Number(numStr[0])] + ' cent ';
        }
        numStr = numStr.slice(1);
    }

    if (numStr.length === 2) {
        if (numStr[0] === '1') {
            result += teens[Number(numStr[1])] + ' ';
        } else if (numStr[0] === '7' || numStr[0] === '9') {
            result += specialTens[Number(numStr[0]) - 7] + '-' + units[Number(numStr[1])] + ' ';
        } else {
            result += tens[Number(numStr[0])] + ' ' + units[Number(numStr[1])] + ' ';
        }
    } else if (numStr.length === 1) {
        result += units[Number(numStr[0])] + ' ';
    }

    return result.trim();
}
