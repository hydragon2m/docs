// Bài tập 02: libuv & Event Loop
// Yêu cầu: Viết code kiểm chứng thứ tự chạy của Event Loop, Next Tick Queue và Microtask Queue.

// Hãy tự chạy và đoán thứ tự in ra của đoạn code sau bằng cách ghi comment bên cạnh mỗi dòng console.log.
// Sau đó chạy bằng lệnh `node "02. libuv & Event Loop.js"` để đối chiếu kết quả thực tế.

console.log("A");

setTimeout(() => {
  console.log("B");
}, 0);

Promise.resolve().then(() => {
  console.log("C");
});

process.nextTick(() => {
  console.log("D");
});

setImmediate(() => {
  console.log("E");
});

console.log("F");
