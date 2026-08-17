// Bài tập 01: Unit Testing với Jest
// Yêu cầu: Viết Unit Test cho class Calculator.

class Calculator {
  add(a, b) {
    return a + b;
  }
  
  divide(a, b) {
    if (b === 0) {
      throw new Error("Cannot divide by zero");
    }
    return a / b;
  }
}

module.exports = Calculator;

// Yêu cầu: Hãy giả lập viết một test file `Calculator.test.js` sử dụng Jest:
// - Viết describe block cho Calculator.
// - Viết test case kiểm tra hàm add cộng 2 số dương, số âm.
// - Viết test case kiểm tra divide chia 2 số bình thường.
// - Viết test case kiểm tra divide ném ra lỗi nếu chia cho số 0 (sử dụng expect().toThrow()).
