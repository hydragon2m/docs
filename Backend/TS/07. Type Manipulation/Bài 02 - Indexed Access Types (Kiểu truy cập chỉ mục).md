## 1. Indexed Access Types là gì?
Trong JavaScript, bạn truy cập giá trị của thuộc tính bằng dấu ngoặc vuông: `obj["property"]`. 

Trong TypeScript, **Indexed Access Types** (Kiểu truy cập chỉ mục) cho phép bạn thực hiện thao tác tương tự **ngay ở tầng kiểu dữ liệu** để trích xuất kiểu của một thuộc tính cụ thể từ một kiểu đối tượng khác.

---

## 2. Cú pháp cơ bản

Chúng ta sử dụng tên kiểu dữ liệu đối tượng, theo sau là cặp ngoặc vuông `[]` chứa tên thuộc tính dạng chuỗi literal:

```typescript
interface User {
  id: number;
  name: string;
  address: {
    street: string;
    city: string;
  };
}

// Trích xuất kiểu của thuộc tính 'address'
type UserAddress = User["address"]; 
/*
  UserAddress tương đương với:
  {
    street: string;
    city: string;
  }
*/

// Truy cập nhiều tầng lồng nhau:
type UserCity = User["address"]["city"]; // Kiểu: string
```

---

## 3. Các khía cạnh nâng cao và Ứng dụng thực tế

### a. Sử dụng Union Types để trích xuất nhiều thuộc tính cùng lúc
Bạn có thể truyền một Union Type các key vào trong dấu ngoặc vuông để lấy ra một Union các kiểu dữ liệu tương ứng:

```typescript
type IdOrName = User["id" | "name"]; // Kiểu: number | string
```

### b. Trích xuất kiểu phần tử từ Mảng (Sử dụng `number` index)
Đây là một kỹ thuật cực kỳ hữu ích khi bạn có một mảng các đối tượng, và muốn lấy ra kiểu dữ liệu của một phần tử đơn lẻ bên trong mảng đó. Chúng ta sử dụng từ khóa **`number`** làm chỉ mục truy cập:

```typescript
const products = [
  { id: 1, name: "Keyboard", price: 1200000 },
  { id: 2, name: "Mouse", price: 500000 }
];

// Bước 1: Lấy kiểu mảng bằng typeof -> typeof products (trả về kiểu: { id: number, name: string, price: number }[])
// Bước 2: Dùng [number] để bóc tách kiểu của phần tử đơn lẻ trong mảng
type Product = (typeof products)[number];
/*
  Product tương đương kiểu đối tượng:
  {
    id: number;
    name: string;
    price: number;
  }
*/
```

---

## 4. Các lưu ý quan trọng

> [!CAUTION]
> ### Không được dùng biến JavaScript làm chỉ mục truy cập kiểu
> Bạn bắt buộc phải truyền **Kiểu dữ liệu** (Type/Literal) vào trong dấu ngoặc vuông `[]`, không được truyền các biến JavaScript thông thường chạy ở runtime.
>
> ```typescript
> let key = "name";
> // type NameType = User[key]; // ❌ Lỗi compile: 'key' refers to a value, but is being used as a type here. Did you mean 'typeof key'?
> 
> // ✅ Hợp lệ:
> type NameType = User["name"];
> ```
