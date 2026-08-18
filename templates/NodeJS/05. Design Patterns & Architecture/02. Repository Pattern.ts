// Bài tập 02: Repository Pattern & Data Mapper
// Yêu cầu: Viết Repository giả lập lưu trữ dữ liệu trong bộ nhớ In-Memory, che giấu chi tiết lưu trữ bằng Interface.

// 1. Định nghĩa Entity:
class Product {
  constructor(public id: number, public name: string, public price: number) {}
}

// 2. Định nghĩa Interface:
interface IProductRepository {
  findById(id: number): Promise<Product | null>;
  save(product: Product): Promise<void>;
  deleteById(id: number): Promise<void>;
}

// Yêu cầu: Hãy hoàn thành Class `InMemoryProductRepository` kế thừa từ `IProductRepository`
// Sử dụng một mảng private `products: Product[] = []` để lưu giữ trạng thái dữ liệu trong bộ nhớ.
// Viết các phương thức findById, save, và deleteById xử lý bất đồng bộ (Promise).

class InMemoryProductRepository implements IProductRepository {
  private products: Product[] = [];

  async findById(id: number): Promise<Product | null> {
    // Hoàn thành tại đây
    return null;
  }

  async save(product: Product): Promise<void> {
    // Hoàn thành tại đây
  }

  async deleteById(id: number): Promise<void> {
    // Hoàn thành tại đây
  }
}
