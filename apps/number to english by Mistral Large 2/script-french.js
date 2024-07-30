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
    const tens = ['', '', 'vingt', 'trente', 'quarante', 'cinquante', 'soixante', 'soixante', 'quatre-vingt', 'quatre-vingt'];
    const baseThousands = ['', 'mille', 'million', 'milliard', 'billion', 'trillion', 'quadrillion', 'quintillion', 'sextillion', 'septillion', 'octillion', 'nonillion', 'décillion'];
    const latinPrefixes = ['', 'un', 'duo', 'tre', 'quattuor', 'quin', 'sex', 'septen', 'octo', 'novem'];
    const latinSuffixes = ['', 'dec', 'vigint', 'trigint', 'quadragint', 'quinquagint', 'sexagint', 'septuagint', 'octogint', 'nonagint', 'cent'];

    function chunkToWords(chunk) {
        let words = '';
        if (chunk >= 100n) {
            words += ones[Number(chunk / 100n)] + ' cent';
            chunk %= 100n;
            if (chunk > 0n) words += ' ';
        }
        if (chunk >= 20n) {
            words += tens[Number(chunk / 10n)];
            chunk %= 10n;
            if (chunk > 0n && chunk < 10n) words += '-';
        }
        if (chunk >= 10n && chunk < 20n) {
            words += teens[Number(chunk - 10n)];
        } else if (chunk > 0n) {
            words += ones[Number(chunk)];
        }
        return words.trim();
    }

    function getScaleName(index) {
        if (index < baseThousands.length) {
            return baseThousands[index];
        }

        // For indices beyond the base set, generate scale names systematically
        const baseIndex = index % 10;
        const multiplier = Math.floor(index / 10);
        const prefix = latinPrefixes[baseIndex];
        const suffix = latinSuffixes[multiplier];
        return prefix + suffix + 'illion';
    }

    let words = '';
    let chunkIndex = 0;
    while (number > 0n) {
        const chunk = number % 1000n;
        if (chunk > 0n) {
            const scaleName = getScaleName(chunkIndex);
            words = chunkToWords(chunk) + (scaleName ? ' ' + scaleName : '') + (words ? ' ' + words : '');
        }
        number /= 1000n;
        chunkIndex++;
    }

    return words.trim();
}