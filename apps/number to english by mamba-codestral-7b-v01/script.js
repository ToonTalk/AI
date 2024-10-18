function convertNumber() {
  const numberInput = document.getElementById("number").value;
  const resultElement = document.getElementById("result");

  try {
    const number = BigInt(numberInput);
    const english = convertToEnglish(number);
    resultElement.textContent = english;
  } catch (error) {
    resultElement.textContent = "Invalid number";
  }
}

function convertToEnglish(number) {
  const units = [
    "",
    "thousand",
    "million",
    "billion",
    "trillion",
    "quadrillion",
    "quintillion",
    "sextillion",
    "septillion",
    "octillion",
    "nonillion",
    "decillion",
    "undecillion",
    "duodecillion",
    "tredecillion",
    "quattuordecillion",
    "quindecillion",
    "sexdecillion",
    "septendecillion",
    "octodecillion",
    "nondecillion",
    "vigintillion"
  ];

  const ones = [
    "",
    "one",
    "two",
    "three",
    "four",
    "five",
    "six",
    "seven",
    "eight",
    "nine"
  ];

  const tens = [
    "",
    "",
    "twenty",
    "thirty",
    "forty",
    "fifty",
    "sixty",
    "seventy",
    "eighty",
    "ninety"
  ];

  const teens = [
    "ten",
    "eleven",
    "twelve",
    "thirteen",
    "fourteen",
    "fifteen",
    "sixteen",
    "seventeen",
    "eighteen",
    "nineteen"
  ];

  if (number === 0n) {
    return "zero";
  }

  if (number < 0n) {
    return "minus " + convertToEnglish(-number);
  }

  if (number < 10n) {
    return ones[number];
  }

  if (number < 20n) {
    return teens[number - 10n];
  }

  if (number < 100n) {
    return tens[Math.floor(number / 10n)] + " " + ones[number % 10n];
  }

  if (number < 1000n) {
    return ones[Math.floor(number / 100n)] + " hundred " + convertToEnglish(number % 100n);
  }

  let result = "";
  let suffixIndex = 0;

  while (number > 0n) {
    const remainder = number % 1000n;
    number = Math.floor(number / 1000n);

    if (remainder > 0n) {
      const chunk = convertToEnglish(remainder);
      result = chunk + " " + units[suffixIndex] + " " + result;
    }

    suffixIndex++;
  }

  return result.trim();
}
