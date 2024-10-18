function convertNumber() {
    const numberInput = document.getElementById('numberInput').value;
    const resultElement = document.getElementById('result');

    try {
        const number = BigInt(numberInput);
        const words = numberToWords(number);
        resultElement.textContent = `"${numberInput}" en français est : ${words}`;
    } catch (error) {
        resultElement.textContent = 'Veuillez entrer un nombre valide.';
    }
}

function numberToWords(number) {
    if (number === 0n) return 'zéro';

    const ones = ['', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf'];
    const teens = ['dix', 'onze', 'douze', 'treize', 'quatorze', 'quinze', 'seize', 'dix-sept', 'dix-huit', 'dix-neuf'];
    const tens = ['', 'dix', 'vingt', 'trente', 'quarante', 'cinquante', 'soixante', 'soixante', 'quatre-vingt', 'quatre-vingt'];
    const baseScales = ['', 'mille', 'million', 'milliard', 'billion', 'billiard', 'trillion', 'trilliard', 'quadrillion', 'quadrilliard'];
    const largeScalePrefixes = ['quint', 'sext', 'sept', 'oct', 'non', 'dec', 'undec', 'duodec', 'tredec', 'quattuordec', 'quindec'];

    function chunkToWords(chunk) {
        let words = '';
        if (chunk >= 100n) {
            if (chunk >= 200n) {
                words += ones[Number(chunk / 100n)] + ' cent ';
            } else {
                words += 'cent ';
            }
            chunk %= 100n;
        }
        if (chunk >= 20n) {
            const tenIndex = Number(chunk / 10n);
            words += tens[tenIndex];
            chunk %= 10n;
            if (chunk > 0n) {
                if (tenIndex === 7 || tenIndex === 9) {
                    words += '-' + teens[Number(chunk)];
                } else if (tenIndex === 8 && chunk === 1n) {
                    words += '-un';
                } else {
                    words += (tenIndex === 1 ? ' et ' : '-') + ones[Number(chunk)];
                }
            } else if (tenIndex === 8) {
                words += 's';
            }
        } else if (chunk >= 10n) {
            words += teens[Number(chunk - 10n)];
        } else if (chunk > 0n) {
            words += ones[Number(chunk)];
        }
        return words.trim();
    }

    function getScaleName(index, value) {
        if (index === 0) return '';
        if (index === 1) return 'mille';
        
        const scaleIndex = index - 2;
        const isIllion = scaleIndex % 2 === 0;
        const prefixIndex = Math.floor(scaleIndex / 2);
        
        let prefix = '';
        if (prefixIndex < baseScales.length - 2) {
            prefix = baseScales[prefixIndex + 2].slice(0, -3);
        } else if (prefixIndex - (baseScales.length - 2) < largeScalePrefixes.length) {
            prefix = largeScalePrefixes[prefixIndex - (baseScales.length - 2)];
        } else {
            return ''; // For extremely large numbers beyond our defined scales
        }
        
        const suffix = isIllion ? 'illion' : 'illiard';
        return prefix + suffix + (value > 1n && index !== 1 ? 's' : '');
    }

    let words = '';
    let chunkIndex = 0;
    while (number > 0n) {
        const chunk = number % 1000n;
        if (chunk > 0n) {
            const chunkWords = chunkToWords(chunk);
            const scaleName = getScaleName(chunkIndex, chunk);
            if (chunkIndex === 1 && chunk === 1n) {
                words = 'mille ' + words;
            } else {
                words = chunkWords + (scaleName ? ' ' + scaleName : '') + (words ? ' ' + words : '');
            }
        }
        number /= 1000n;
        chunkIndex++;
    }

    return words.trim();
}