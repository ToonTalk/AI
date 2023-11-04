function calculateFibonacci() {
  let inputNum = document.getElementById("inputNum").value;
  let num = BigInt(inputNum);
  let a = 0n;
  let b = 1n;
  let temp;

  for (let i = 0n; i < num; i++) {
    temp = a;
    a = b;
    b = temp + b;
  }

  document.getElementById("result").textContent = `The Fibonacci number at position ${inputNum} is ${a.toString()}`;
}
