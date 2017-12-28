// app/index.js
function sum (arr) {
  return arr.reduce(function(a, b) { 
    return a + b
  }, 0)
}

const numbersToAdd = [
  3,
  4,
  10,
  2
]

const result = sum(numbersToAdd)
console.log(`The result is: ${result}`)