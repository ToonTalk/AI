const units = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'];
const tens = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
const teens = ['ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
const groupNames = ['', 'thousand', 'million', 'billion', 'trillion', 'quadrillion', 'quintillion', 'sextillion', 'septillion', 'octillion', 'nonillion', 'decillion'];

function convertThreeDigits(str) {
    let num = str.padStart(3, '0');
    let hundred = units[num[0]] + (num[0] > '0' ? ' hundred' : '');
    let lastTwo = num.substring(1);
    let tensPart;

    let lastTwoNum = parseInt(lastTwo, 10);
    if (lastTwoNum < 10) {
        tensPart = units[lastTwoNum];
    } else if (lastTwoNum < 20) {
        tensPart = teens[lastTwoNum - 10];
    } else {
        let tensDigit = tens[lastTwo[0]];
        let unitsDigit = units[lastTwo[1]];
        tensPart = tensDigit + (unitsDigit ? ' ' + unitsDigit : '');
    }

    let words = [];
    if (hundred) words.push(hundred);
    if (tensPart) words.push(tensPart);
    return words.join(' ');
}

function numberToWords(numStr) {
    if (numStr === '0') {
        return 'zero';
    }

    numStr = numStr.replace(/^0+/, '');
    if (numStr === '') {
        return 'zero';
    }

    let reversed = numStr.split('').reverse().join('');
    let chunks = [];
    for (let i = 0; i < reversed.length; i += 3) {
        chunks.push(reversed.substring(i, i + 3).split('').reverse().join(''));
    }

    // chunks.reverse();
    let words = [];

    for (let i = 0; i < chunks.length; i++) {
        let chunk = chunks[i];
        if (chunk !== '000') {
            let chunkWords = convertThreeDigits(chunk);
            let groupName = groupNames[i];
            if (groupName) {
                words.push(chunkWords + ' ' + groupName);
            } else {
                let defaultGroupName = generateLargeGroupName(i);
                words.push(chunkWords + ' ' + defaultGroupName);
            }
        }
    }

    return words.reverse().join(' ');
}

function generateLargeGroupName(index) {
    if (index < groupNames.length) {
        return groupNames[index];
    }
    let prefix;
    let n = index - (groupNames.length - 1);
    switch (n) {
        case 1: prefix = 'un'; break;
        case 2: prefix = 'duo'; break;
        case 3: prefix = 'tre'; break;
        case 4: prefix = 'quattuor'; break;
        case 5: prefix = 'quin'; break;
        case 6: prefix = 'sex'; break;
        case 7: prefix = 'sept'; break;
        case 8: prefix = 'oct'; break;
        case 9: prefix = 'novem'; break;
        case 10: prefix = 'dec'; break;
        case 11: prefix = 'undec'; break;
        case 12: prefix = 'duodec'; break;
        case 13: prefix = 'tredec'; break;
        case 14: prefix = 'quattuordec'; break;
        case 15: prefix = 'quindec'; break;
        case 16: prefix = 'sexdec'; break;
        case 17: prefix = 'septendec'; break;
        case 18: prefix = 'octodec'; break;
        case 19: prefix = 'novemdec'; break;
        case 20: prefix = 'vigint'; break;
        default:
            return 'unidentified large number';
    }
    return prefix + 'illion';
}

function convertNumber() {
    let numStr = document.getElementById('numberInput').value;
    if (!/^\d+$/.test(numStr)) {
        document.getElementById('errorMessage').innerText = 'Please enter a valid non-negative integer.';
        document.getElementById('result').innerText = '';
        return;
    }
    let words = numberToWords(numStr);
    document.getElementById('errorMessage').innerText = '';
    document.getElementById('result').innerText = words;
}