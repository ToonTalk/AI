// Define the maps outside of any function for global access
const unitsMap = ["Zero", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine"];
const teensMap = ["Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
const tensMap = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
const thousandsMap = ["", "Thousand", "Million", "Billion", "Trillion", "Quadrillion", "Quintillion", "Sextillion", "Septillion", "Octillion", "Nonillion", "Decillion", "Undecillion", "Duodecillion", "Tredecillion", "Quattuordecillion", "Quindecillion", "Sexdecillion", "Septendecillion", "Octodecillion", "Novemdecillion", "Vigintillion"];

function numberToWords(n) {
    if (typeof n === 'bigint') {
        n = Number(n); // Convert BigInt to Number for our current implementation
    }

    if (n === 0) {
        return unitsMap[n];
    }

    let result = "";
    let i = 0;
    while (n > 0) {
        if (n % 1000 !== 0) {
            result = ` ${convertLessThanThousand(n % 1000)} ${thousandsMap[i]}` + result;
        }
        n = Math.floor(n / 1000);
        i++;
    }

    return result.trim();
}

function convertLessThanThousand(n) {
    if (n === 0) {
        return "";
    }
    if (n < 10) {
        return unitsMap[n];
    }
    if (n < 20) {
        return teensMap[n - 10];
    }
    if (n < 100) {
        return `${tensMap[Math.floor(n / 10)]} ${convertLessThanThousand(n % 10)}`.trim();
    }
    return `${unitsMap[Math.floor(n / 100)]} Hundred ${convertLessThanThousand(n % 100)}`.trim();
}

function convertNumber() {
    const input = document.getElementById('numberInput').value;
    const result = numberToWords(input);
    document.getElementById('result').textContent = result;
}

function runTestCases() {
    const testCases = [1n, 10n, 15n, 20n, 27n, 100n, 101n, 123n, 1000n, 1001n, 1234n, 10000n, 10001n, 12345n, 100000n, 100001n, 123456n, 1000000n, 1000001n, 1234567n, 10000000n, 10000001n, 12345678n, 100000000n, 100000001n, 123456789n];
    const results = testCases.map(test => numberToWords(test));
    document.getElementById('testResults').innerHTML = testCases.map((test, index) => `<p>${test}: ${results[index]}</p>`).join('');
}

