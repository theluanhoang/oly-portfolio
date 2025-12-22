import { PrismaClient } from "../app/generated/prisma/client";

const PRODUCT_THUMBNAIL =
  "https://picsum.photos/seed/oly-product-thumb/600/600";

export const productData: {
  slug: string;
  category: string;
  material: string;
  year: string;
  thumbnail: string;
  descriptions: string[];
  content: string;
}[] = [
  {
    slug: "residential-shelf-01",
    category: "Residential",
    material: "Laminated wood, powder-coated steel",
    year: "2021",
    thumbnail: PRODUCT_THUMBNAIL,
    descriptions: [
      "Kệ trang trí cho không gian nhà ở hiện đại, phù hợp phòng khách và phòng làm việc.",
      "Thiết kế tối giản, nhấn mạnh vào đường cong mềm mại và mặt phẳng thanh mảnh.",
    ],
    content:
      "<p>Kệ trang trí với cấu trúc kim loại vững chắc kết hợp bề mặt gỗ phủ laminate mịn, tạo nên điểm nhấn tinh tế cho không gian sống.</p><p>Sản phẩm được thiết kế để dễ dàng phối hợp với nhiều phong cách nội thất khác nhau, từ tối giản đến hiện đại.</p>",
  },
  {
    slug: "residential-shelf-02",
    category: "Residential",
    material: "Solid oak, metal frame",
    year: "2020",
    thumbnail: PRODUCT_THUMBNAIL,
    descriptions: [
      "Phiên bản kệ gỗ sồi với sắc độ ấm, tạo cảm giác gần gũi và sang trọng.",
      "Phù hợp cho các không gian chung cư, nhà phố với diện tích vừa và nhỏ.",
    ],
    content:
      "<p>Kệ sử dụng gỗ sồi tự nhiên xử lý chống cong vênh, bề mặt phủ dầu giữ vân gỗ chân thật.</p><p>Khung kim loại mảnh giúp tổng thể vẫn nhẹ nhàng nhưng vẫn đảm bảo độ chắc chắn khi sử dụng.</p>",
  },
  {
    slug: "residential-shelf-03",
    category: "Residential",
    material: "MDF phủ veneer, khung thép sơn tĩnh điện",
    year: "2022",
    thumbnail: PRODUCT_THUMBNAIL,
    descriptions: [
      "Thiết kế tập trung vào các mặt phẳng ngang, tối ưu cho việc trưng bày sách và phụ kiện.",
      "Tông màu trung tính, dễ dàng kết hợp với đa số bảng màu nội thất hiện nay.",
    ],
    content:
      "<p>Bề mặt Veneer mang lại cảm giác gỗ tự nhiên nhưng vẫn đảm bảo độ ổn định về màu sắc theo thời gian.</p><p>Kết cấu nhiều tầng giúp người dùng linh hoạt bố trí vật dụng theo chiều dọc.</p>",
  },
  {
    slug: "residential-shelf-04",
    category: "Residential",
    material: "Gỗ công nghiệp chống ẩm, thép sơn đen mờ",
    year: "2019",
    thumbnail: PRODUCT_THUMBNAIL,
    descriptions: [
      "Giải pháp lưu trữ nhỏ gọn cho các góc tường hoặc khu vực dưới cầu thang.",
      "Bề mặt chống ẩm phù hợp với khí hậu nóng ẩm, hạn chế cong vênh.",
    ],
    content:
      "<p>Các module được tính toán kích thước vừa đủ để tối ưu tính ứng dụng mà không gây nặng nề cho không gian.</p><p>Tông đen mờ của khung thép tạo đường viền rõ ràng, định hình khối cho sản phẩm.</p>",
  },
  {
    slug: "residential-shelf-05",
    category: "Residential",
    material: "Gỗ ash, chi tiết kim loại mạ",
    year: "2023",
    thumbnail: PRODUCT_THUMBNAIL,
    descriptions: [
      "Thiết kế hướng đến nhóm khách hàng yêu thích chi tiết tinh tế, nhẹ nhàng.",
      "Phù hợp đặt cạnh sofa, khu vực đọc sách hoặc góc thư giãn.",
    ],
    content:
      "<p>Sự kết hợp giữa gỗ ash sáng màu và chi tiết kim loại mạ giúp sản phẩm vừa hiện đại vừa giữ được cảm giác tự nhiên.</p><p>Các cạnh đều được bo tròn, đảm bảo an toàn khi sử dụng trong gia đình có trẻ nhỏ.</p>",
  },
  {
    slug: "residential-shelf-06",
    category: "Residential",
    material: "Composite, kim loại sơn tĩnh điện",
    year: "2021",
    thumbnail: PRODUCT_THUMBNAIL,
    descriptions: [
      "Đường cong liên tục tạo thành hình khối điêu khắc trong không gian.",
      "Thích hợp cho các dự án căn hộ mẫu, homestay hoặc studio sáng tạo.",
    ],
    content:
      "<p>Thân kệ được đúc từ vật liệu composite, cho phép tạo hình mềm mại mà vẫn đảm bảo độ cứng cần thiết.</p><p>Màu sắc có thể tuỳ chọn theo bảng màu chuẩn của thương hiệu hoặc dự án.</p>",
  },
  {
    slug: "residential-shelf-07",
    category: "Residential",
    material: "Plywood phủ melamine, chân thép mảnh",
    year: "2020",
    thumbnail: PRODUCT_THUMBNAIL,
    descriptions: [
      "Tập trung vào tính linh hoạt, có thể đặt sát tường hoặc làm vách ngăn nhẹ.",
      "Cấu trúc đơn giản, dễ dàng tháo lắp và vận chuyển.",
    ],
    content:
      "<p>Các tầng kệ có chiều cao khác nhau, phù hợp cho sách, lọ hoa và vật trang trí nhỏ.</p><p>Bề mặt melamine chống trầy xước, dễ lau chùi trong quá trình sử dụng hằng ngày.</p>",
  },
  {
    slug: "residential-shelf-08",
    category: "Residential",
    material: "Gỗ óc chó, kim loại đen",
    year: "2022",
    thumbnail: PRODUCT_THUMBNAIL,
    descriptions: [
      "Phiên bản cao cấp với gỗ óc chó, phù hợp biệt thự và căn hộ hạng sang.",
      "Tông màu trầm tạo chiều sâu, làm nền cho các vật trưng bày nổi bật hơn.",
    ],
    content:
      "<p>Vân gỗ óc chó tự nhiên kết hợp với khung kim loại đen tạo nên độ tương phản tinh tế.</p><p>Sản phẩm thường được sử dụng trong các dự án nội thất có yêu cầu cao về thẩm mỹ và chi tiết hoàn thiện.</p>",
  },
  {
    slug: "residential-shelf-09",
    category: "Residential",
    material: "Gỗ công nghiệp phủ sơn mờ",
    year: "2018",
    thumbnail: PRODUCT_THUMBNAIL,
    descriptions: [
      "Thiết kế ưu tiên chi phí hợp lý nhưng vẫn đảm bảo tỉ lệ và đường nét chuẩn.",
      "Phù hợp cho căn hộ cho thuê, căn hộ dịch vụ hoặc các dự án số lượng lớn.",
    ],
    content:
      "<p>Cấu trúc kệ tối giản, hạn chế chi tiết dư thừa giúp tối ưu thời gian thi công.</p><p>Lớp sơn mờ giúp bề mặt ít bám vân tay và dễ bảo trì.</p>",
  },
  {
    slug: "residential-shelf-10",
    category: "Residential",
    material: "Gỗ sơn màu, khung kim loại trắng",
    year: "2021",
    thumbnail: PRODUCT_THUMBNAIL,
    descriptions: [
      "Hướng đến các không gian trẻ trung với bảng màu tươi sáng.",
      "Có thể phối màu theo concept thương hiệu hoặc concept của từng dự án.",
    ],
    content:
      "<p>Sự tương phản giữa khung trắng và mặt kệ màu giúp sản phẩm trở thành điểm nhấn trong không gian.</p><p>Thiết kế cũng cho phép thay thế mặt kệ dễ dàng khi cần thay đổi màu sắc.</p>",
  },
  {
    slug: "residential-shelf-11",
    category: "Residential",
    material: "Gỗ ép định hình, sơn bóng",
    year: "2019",
    thumbnail: PRODUCT_THUMBNAIL,
    descriptions: [
      "Đường cong mạnh mẽ tạo cảm giác động, phù hợp cho không gian trưng bày.",
      "Bề mặt sơn bóng giúp phản chiếu ánh sáng, làm không gian rộng hơn.",
    ],
    content:
      "<p>Các lớp gỗ ép được uốn theo khuôn, tạo ra hình khối liên tục, liền mạch.</p><p>Lớp sơn hoàn thiện nhiều lớp cho bề mặt sâu và bền màu theo thời gian.</p>",
  },
  {
    slug: "residential-shelf-12",
    category: "Residential",
    material: "Gỗ + kính, khung thép mảnh",
    year: "2023",
    thumbnail: PRODUCT_THUMBNAIL,
    descriptions: [
      "Biến thể với mặt kệ kính cho cảm giác nhẹ, phù hợp các không gian có nhiều ánh sáng.",
      "Thích hợp trưng bày vật phẩm sưu tầm, mô hình hoặc các vật trang trí nhỏ.",
    ],
    content:
      "<p>Mặt kính cường lực dày, kết hợp với khung thép chắc chắn để đảm bảo an toàn khi sử dụng.</p><p>Các chi tiết liên kết được giấu kín, giữ cho tổng thể sản phẩm gọn gàng, tinh tế.</p>",
  },
];

export async function seedProducts(prisma: PrismaClient) {
  console.log("Starting product seed...");

  const prismaWithProduct = prisma as unknown as {
    product: {
      findUnique(args: { where: { slug: string } }): Promise<{ slug: string } | null>;
      create(args: { data: (typeof productData)[number] }): Promise<unknown>;
    };
  };

  for (const product of productData) {
    try {
      const existing = await prismaWithProduct.product.findUnique({
        where: { slug: product.slug },
      });

      if (existing) {
        console.log(`Product ${product.slug} already exists, skipping...`);
        continue;
      }

      await prismaWithProduct.product.create({
        data: product,
      });

      console.log(`✓ Created product: ${product.slug}`);
    } catch (error) {
      console.error(
        `✗ Error creating product ${product.slug}:`,
        error instanceof Error ? error.message : String(error)
      );
    }
  }

  console.log("Product seed completed!");
}

