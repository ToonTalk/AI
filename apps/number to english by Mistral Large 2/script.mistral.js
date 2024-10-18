function convertNumber() {
    const numberInput = document.getElementById('numberInput').value;
    const resultElement = document.getElementById('result');

    try {
        const number = BigInt(numberInput);
        const words = numberToWords(number);
        resultElement.textContent = `"${numberInput}" in English is: ${words}`;
    } catch (error) {
        resultElement.textContent = 'Please enter a valid number.';
    }
}

function numberToWords(number) {
    if (number === 0n) return 'zero';

    const ones = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'];
    const teens = ['ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
    const tens = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
    const baseThousands = ['', 'thousand', 'million', 'billion', 'trillion', 'quadrillion', 'quintillion', 'sextillion', 'septillion', 'octillion', 'nonillion', 'decillion'];
    const latinPrefixes = ['', 'un', 'duo', 'tre', 'quattuor', 'quin', 'sex', 'sept', 'octo', 'novem'];
    const latinSuffixes = ['', 'dec', 'vigint', 'trigint', 'quadragint', 'quinquagint', 'sexagint', 'septuagint', 'octogint', 'nonagint'];

    function chunkToWords(chunk) {
        let words = '';
        if (chunk >= 100n) {
            words += ones[Number(chunk / 100n)] + ' hundred';
            chunk %= 100n;
            if (chunk > 0n) words += ' and ';
        }
        if (chunk >= 20n) {
            words += tens[Number(chunk / 10n)];
            chunk %= 10n;
            if (chunk > 0n) words += '-';
        }
        if (chunk >= 10n && chunk < 20n) {
            words += teens[Number(chunk - 10n)];
        } else if (chunk > 0n) {
            words += ones[Number(chunk)];
        }
        return words;
    }

    function getScaleName(index) {
        console.log(`getScaleName called with index: ${index}`);
        if (index < baseThousands.length) {
            console.log(`Returning baseThousands[${index}]: ${baseThousands[index]}`);
            return baseThousands[index];
        }

        // For indices beyond the base set, generate scale names systematically
        const baseIndex = index % baseThousands.length;
        const multiplier = Math.floor(index / baseThousands.length);
        const prefix = latinPrefixes[multiplier % 10] || 'viginti'; // Fallback for very large numbers
        const suffix = latinSuffixes[Math.floor(multiplier / 10)] || '';
        const scaleName = prefix + suffix + (baseIndex === 0 ? 'illion' : baseThousands[baseIndex]);
        console.log(`Generated scale name: ${scaleName}`);
        return scaleName;
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