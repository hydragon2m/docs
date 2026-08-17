## 1. Vấn đề của các hàm kiểm tra boolean thông thường
Đôi khi bạn muốn tách biệt logic kiểm tra kiểu dữ liệu ra một hàm riêng để tái sử dụng. Tuy nhiên, nếu bạn chỉ trả về kiểu `boolean` thông thường, TypeScript sẽ **không thể** tự động thu hẹp kiểu cho bạn sau khi gọi hàm đó.

### Ví dụ vấn đề:
```typescript
type Fish = { swim: () => void };
type Bird = { fly: () => void };

// Hàm kiểm tra trả về boolean thông thường
function isFishCheck(pet: Fish | Bird): boolean {
  return (pet as Fish).swim !== undefined;
}

function move(pet: Fish | Bird) {
  if (isFishCheck(pet)) {
    // ❌ TypeScript vẫn KHÔNG THỂ thu hẹp kiểu của pet về Fish!
    // Vì kiểu trả về của isFishCheck chỉ là boolean đơn thuần.
    // pet ở đây vẫn là 'Fish | Bird'.
    // pet.swim(); // ❌ Lỗi compile
  }
}
```

Để giải quyết vấn đề này, TypeScript giới thiệu cú pháp **Type Predicates (Vị ngữ kiểu)**.

---

## 2. Cú pháp Type Predicates (`parameterName is Type`)
Thay vì khai báo hàm trả về kiểu `boolean`, bạn sẽ viết kiểu trả về là: **`tên_tham_số is Kiểu_Dữ_Liệu`**.

```typescript
function isFish(pet: Fish | Bird): pet is Fish {
  return (pet as Fish).swim !== undefined;
}
```
*Ý nghĩa:* Nếu hàm `isFish` trả về `true` khi chạy, TypeScript sẽ tự động tin tưởng và thu hẹp kiểu của đối số truyền vào thành kiểu `Fish` ở nhánh điều kiện tương ứng.

### Áp dụng vào thực tế:
```typescript
function move(pet: Fish | Bird) {
  if (isFish(pet)) {
    // ✅ Hợp lệ! pet đã được thu hẹp về kiểu Fish thành công.
    pet.swim(); 
  } else {
    // ✅ Hợp lệ! pet chắc chắn là kiểu Bird.
    pet.fly();
  }
}
```

---

## 3. Kiến thức thực tế nâng cao: Ứng dụng với `Array.prototype.filter`

Một trong những ứng dụng mạnh mẽ nhất của Type Predicates là giúp lọc phần tử của mảng và tự động ép kiểu cho mảng kết quả.

Nếu không dùng Type Predicates:
```typescript
const zoo: (Fish | Bird)[] = [/* danh sách thú */];

// Mảng filteredZoo vẫn có kiểu là (Fish | Bird)[] chứ không phải Fish[]
const filteredZoo = zoo.filter(animal => {
  return "swim" in animal;
}); 
```

Nếu sử dụng hàm Type Predicates làm callback lọc:
```typescript
const zoo: (Fish | Bird)[] = [/* danh sách thú */];

// ✅ TypeScript tự động hiểu filteredZoo có kiểu chính xác là Fish[] !
const filteredZoo: Fish[] = zoo.filter(isFish); 
```
*Mẹo: Việc này giúp loại bỏ hoàn toàn các dòng ép kiểu thủ công `as Fish[]` rườm rà và mất an toàn.*
