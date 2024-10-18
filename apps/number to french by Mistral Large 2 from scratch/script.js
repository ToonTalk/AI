function convertToFrench() {
    const numberInput = document.getElementById('numberInput').value;
    const resultElement = document.getElementById('result');

    try {
        const number = BigInt(numberInput);
        const frenchNumber = convertNumberToFrench(number);
        resultElement.textContent = `French: ${frenchNumber}`;
    } catch (error) {
        resultElement.textContent = 'Please enter a valid number.';
    }
}

function convertNumberToFrench(number) {
    const units = ['zéro', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf'];
    const teens = ['dix', 'onze', 'douze', 'treize', 'quatorze', 'quinze', 'seize', 'dix-sept', 'dix-huit', 'dix-neuf'];
    const tens = ['', 'dix', 'vingt', 'trente', 'quarante', 'cinquante', 'soixante', 'soixante-dix', 'quatre-vingt', 'quatre-vingt-dix'];
    const hundreds = ['', 'cent', 'deux cents', 'trois cents', 'quatre cents', 'cinq cents', 'six cents', 'sept cents', 'huit cents', 'neuf cents'];

    function convertChunk(chunk) {
        if (chunk === 0n) return '';
        let result = '';
        if (chunk >= 100n) {
            result += hundreds[Number(chunk / 100n)] + ' ';
            chunk %= 100n;
        }
        if (chunk >= 20n) {
            result += tens[Number(chunk / 10n)] + ' ';
            chunk %= 10n;
            if (chunk > 0n && chunk < 10n) {
                result += units[Number(chunk)] + ' ';
            }
        } else if (chunk >= 10n) {
            result += teens[Number(chunk - 10n)] + ' ';
        } else if (chunk > 0n) {
            result += units[Number(chunk)] + ' ';
        }
        return result.trim();
    }

    if (number === 0n) return units[0];

    let result = '';
    let chunks = [];
    while (number > 0n) {
        chunks.push(number % 1000n);
        number /= 1000n;
    }

    const magnitudes = ['', 'mille', 'million', 'milliard', 'billion', 'billiard', 'trillion', 'trilliard'];
    for (let i = 0; i < chunks.length; i++) {
        if (chunks[i] > 0n) {
            result = convertChunk(chunks[i]) + ' ' + magnitudes[i] + ' ' + result;
        }
    }

    return result.trim();
}