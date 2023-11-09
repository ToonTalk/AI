function calculateFactorial() {
  var input = document.getElementById('number').value;
  var number = isNaN(input) ? romanToDecimal(input.toUpperCase()) : BigInt(input);
  var factorial = BigInt(1);
  for (var i = BigInt(2); i <= number; i = i + BigInt(1)) {
    factorial *= i;
  }
  var romanFactorial = toRoman(factorial.toString());
  document.getElementById('result').innerHTML = 'Factorial (in Roman numerals): ' + romanFactorial;
}

function toRoman(num) {
  var lookup = new Map([
    ['V_', 5000],
    ['IV_', 4000],
    ['M', 1000],
    ['CM', 900],
    ['D', 500],
    ['CD', 400],
    ['C', 100],
    ['XC', 90],
    ['L', 50],
    ['XL', 40],
    ['X', 10],
    ['IX', 9],
    ['V', 5],
    ['IV', 4],
    ['I', 1]
  ]);
  var roman = '';
  for (var [key, value] of lookup) {
    while (num >= value) {
      if (key.includes('_')) {
        roman += '<span class="overline">' + key.slice(0, -1) + '</span>';
      } else {
        roman += key;
      }
      num -= value;
    }
  }
  return roman;
}

function romanToDecimal(roman) {
  const romanNumerals = { I: 1, V: 5, X: 10, L: 50, C: 100, D: 500, M: 1000 };
  let decimal = 0;

  for (let i = 0; i < roman.length; i++) {
    let currentNumeral = romanNumerals[roman[i]];
    let nextNumeral = romanNumerals[roman[i + 1]];

    if (nextNumeral && currentNumeral < nextNumeral) {
      decimal += nextNumeral - currentNumeral;
      i++; // Skip next numeral since it's part of this one
    } else {
      decimal += currentNumeral;
    }
  }

  return decimal;
}



