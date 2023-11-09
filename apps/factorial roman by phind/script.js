function calculateFactorial() {
  var number = BigInt(document.getElementById('number').value);
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



