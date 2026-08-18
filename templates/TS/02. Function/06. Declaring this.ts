// Bài tập 06: Declaring this (Khai báo đối tượng this)
// Yêu cầu: Khai báo kiểu cho ngữ cảnh `this` của hàm.

// Định nghĩa interface `IUIElement` mô tả một phần tử giao diện:
// - addClickListener(onclick: (this: void, e: Event) => void): void;
//
// Định nghĩa một class `Handler` chứa thuộc tính `info` (string) và phương thức `onClickBad` 
// dùng để lắng nghe click. Hãy cấu trúc phương thức này sao cho nó nhận diện đúng ngữ cảnh `this` 
// của lớp `Handler` thay vì bị nhận diện thành `void`.
class Handler {
  info: string = "Handler class";
  
  onClick(this: Handler, e: Event) {
    console.log(this.info);
  }
}
