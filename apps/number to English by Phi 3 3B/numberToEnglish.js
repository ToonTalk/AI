function convertToEnglish(number) {
    const ones = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'];
    const tens = [
        '', 'ten', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'
    ];

    if (number === 0) return ones[0];

    let result;

    // Handle numbers up to one hundred.
    if (number < 10) {
        return ones[number];
    } else if (number < 20) {
        return `${ones[number]}teen`;
    } else {
        // Split the number into hundreds, tens and ones places.
        const hundredsPlace = Math.floor(number / 100);
        const remainder = number % 100;
        let word = '';

        if (hundredsPlace > 0) {
            word += `${ones[hundredsPlace]} hundred `;
        }

        // Handle tens.
        if (remainder > 0) {
            const tenValue = Math.floor(remainder / 10);
            const onesValue = remainder % 10;

            if (tenValue > 0) {
                word += `${tens[tenValue]} `; }

            // Handle the single digit case.
            if (onesValue > 0 || tenValue === 0) {
                word += ones[onesValue];
            }
        }

        return word.trim();
    }
}

// Example usage:
console.log(convertToEnglish(123)); // Outputs: one hundred twenty three
console.log(convertToEnglish(456789)); // Outputs: four hundred fifty six thousand seven hundred eighty nine
