import { Prisma } from "../app/generated/prisma/client";
import prisma from "../lib/prisma";

const getPlaceholderImage = (index: number, width = 1200, height = 800) => {
  return `https://picsum.photos/seed/project-${index}/${width}/${height}`;
};

const projectData: Prisma.ProjectCreateInput[] = [
  {
    slug: 'narrow-house',
    title: 'NARROW HOUSE',
    category: 'Architecture',
    type: 'Nhà phố',
    location: 'TP. Hồ Chí Minh',
    area: '58 m²',
    year: '2018',
    heroImage: getPlaceholderImage(1),
    content: '<p>Ngôi nhà phố hẹp với thiết kế tối ưu không gian, tận dụng ánh sáng tự nhiên và thông gió tốt.</p>',
    gallery: [getPlaceholderImage(11, 800, 600), getPlaceholderImage(21, 800, 600), getPlaceholderImage(31, 800, 600)],
  },
  {
    slug: 'minimalist-villa',
    title: 'MINIMALIST VILLA',
    category: 'Architecture',
    type: 'Biệt thự',
    location: 'Đà Lạt',
    area: '350 m²',
    year: '2019',
    heroImage: getPlaceholderImage(2),
    content: '<p>Biệt thự phong cách tối giản, hòa hợp với thiên nhiên, tạo không gian sống thanh bình.</p>',
    gallery: [getPlaceholderImage(12, 800, 600), getPlaceholderImage(22, 800, 600)],
  },
  {
    slug: 'urban-loft',
    title: 'URBAN LOFT',
    category: 'Interior & Construction',
    type: 'Căn hộ',
    location: 'Hà Nội',
    area: '120 m²',
    year: '2020',
    heroImage: getPlaceholderImage(3),
    content: '<p>Căn hộ loft hiện đại với không gian mở, phù hợp cho giới trẻ năng động.</p>',
    gallery: [getPlaceholderImage(13, 800, 600), getPlaceholderImage(23, 800, 600), getPlaceholderImage(33, 800, 600), getPlaceholderImage(43, 800, 600)],
  },
  {
    slug: 'garden-house',
    title: 'GARDEN HOUSE',
    category: 'Architecture',
    type: 'Nhà vườn',
    location: 'Cần Thơ',
    area: '280 m²',
    year: '2017',
    heroImage: getPlaceholderImage(4),
    content: '<p>Ngôi nhà vườn với không gian xanh, kết nối trong ngoài một cách tự nhiên.</p>',
    gallery: [getPlaceholderImage(14, 800, 600), getPlaceholderImage(24, 800, 600)],
  },
  {
    slug: 'coastal-resort',
    title: 'COASTAL RESORT',
    category: 'Architecture',
    type: 'Resort',
    location: 'Nha Trang',
    area: '500 m²',
    year: '2021',
    heroImage: getPlaceholderImage(5),
    content: '<p>Resort ven biển với view đẹp, thiết kế hiện đại và tiện nghi cao cấp.</p>',
    gallery: [getPlaceholderImage(15, 800, 600), getPlaceholderImage(25, 800, 600), getPlaceholderImage(35, 800, 600)],
  },
  {
    slug: 'mountain-retreat',
    title: 'MOUNTAIN RETREAT',
    category: 'Architecture',
    type: 'Nhà nghỉ dưỡng',
    location: 'Sapa',
    area: '200 m²',
    year: '2019',
    heroImage: getPlaceholderImage(6),
    content: '<p>Nhà nghỉ dưỡng trên núi, tận hưởng không khí trong lành và cảnh quan núi rừng.</p>',
    gallery: [getPlaceholderImage(16, 800, 600), getPlaceholderImage(26, 800, 600)],
  },
  {
    slug: 'modern-townhouse',
    title: 'MODERN TOWNHOUSE',
    category: 'Architecture',
    type: 'Nhà phố',
    location: 'Đà Nẵng',
    area: '180 m²',
    year: '2020',
    heroImage: getPlaceholderImage(7),
    content: '<p>Nhà phố hiện đại với thiết kế thông minh, tối ưu công năng sử dụng.</p>',
    gallery: [getPlaceholderImage(17, 800, 600), getPlaceholderImage(27, 800, 600), getPlaceholderImage(37, 800, 600)],
  },
  {
    slug: 'luxury-penthouse',
    title: 'LUXURY PENTHOUSE',
    category: 'Interior & Construction',
    type: 'Penthouse',
    location: 'TP. Hồ Chí Minh',
    area: '250 m²',
    year: '2022',
    heroImage: getPlaceholderImage(8),
    content: '<p>Penthouse cao cấp với view toàn thành phố, nội thất sang trọng và đẳng cấp.</p>',
    gallery: [getPlaceholderImage(18, 800, 600), getPlaceholderImage(28, 800, 600), getPlaceholderImage(38, 800, 600), getPlaceholderImage(48, 800, 600)],
  },
  {
    slug: 'eco-cabin',
    title: 'ECO CABIN',
    category: 'Architecture',
    type: 'Cabin',
    location: 'Mai Châu',
    area: '80 m²',
    year: '2018',
    heroImage: getPlaceholderImage(9),
    content: '<p>Cabin sinh thái thân thiện môi trường, sử dụng vật liệu tự nhiên.</p>',
    gallery: [getPlaceholderImage(19, 800, 600), getPlaceholderImage(29, 800, 600)],
  },
  {
    slug: 'industrial-warehouse',
    title: 'INDUSTRIAL WAREHOUSE',
    category: 'Interior & Construction',
    type: 'Không gian làm việc',
    location: 'TP. Hồ Chí Minh',
    area: '400 m²',
    year: '2021',
    heroImage: getPlaceholderImage(10),
    content: '<p>Không gian làm việc phong cách industrial, sáng tạo và năng động.</p>',
    gallery: [getPlaceholderImage(20, 800, 600), getPlaceholderImage(30, 800, 600), getPlaceholderImage(40, 800, 600)],
  },
  {
    slug: 'tropical-bungalow',
    title: 'TROPICAL BUNGALOW',
    category: 'Architecture',
    type: 'Bungalow',
    location: 'Phú Quốc',
    area: '150 m²',
    year: '2020',
    heroImage: getPlaceholderImage(11),
    content: '<p>Bungalow nhiệt đới với kiến trúc mở, tận hưởng gió biển và ánh nắng.</p>',
    gallery: [getPlaceholderImage(21, 800, 600), getPlaceholderImage(31, 800, 600)],
  },
  {
    slug: 'sky-villa',
    title: 'SKY VILLA',
    category: 'Architecture',
    type: 'Biệt thự',
    location: 'Hà Nội',
    area: '420 m²',
    year: '2022',
    heroImage: getPlaceholderImage(12),
    content: '<p>Biệt thự trên cao với thiết kế độc đáo, view panorama và không gian sống sang trọng.</p>',
    gallery: [getPlaceholderImage(22, 800, 600), getPlaceholderImage(32, 800, 600), getPlaceholderImage(42, 800, 600)],
  },
  {
    slug: 'bamboo-house',
    title: 'BAMBOO HOUSE',
    category: 'Architecture',
    type: 'Nhà tre',
    location: 'Hội An',
    area: '100 m²',
    year: '2019',
    heroImage: getPlaceholderImage(13),
    content: '<p>Ngôi nhà tre truyền thống với kiến trúc hiện đại, thân thiện môi trường.</p>',
    gallery: [getPlaceholderImage(23, 800, 600), getPlaceholderImage(33, 800, 600)],
  },
  {
    slug: 'waterfront-house',
    title: 'WATERFRONT HOUSE',
    category: 'Architecture',
    type: 'Nhà phố',
    location: 'Cần Thơ',
    area: '220 m²',
    year: '2021',
    heroImage: getPlaceholderImage(14),
    content: '<p>Nhà phố mặt tiền sông, tận dụng view sông nước và không gian mở.</p>',
    gallery: [getPlaceholderImage(24, 800, 600), getPlaceholderImage(34, 800, 600), getPlaceholderImage(44, 800, 600)],
  },
  {
    slug: 'zen-apartment',
    title: 'ZEN APARTMENT',
    category: 'Interior & Construction',
    type: 'Căn hộ',
    location: 'Đà Lạt',
    area: '95 m²',
    year: '2020',
    heroImage: getPlaceholderImage(15),
    content: '<p>Căn hộ phong cách zen, không gian tĩnh lặng và cân bằng.</p>',
    gallery: [getPlaceholderImage(25, 800, 600), getPlaceholderImage(35, 800, 600)],
  },
  {
    slug: 'heritage-renovation',
    title: 'HERITAGE RENOVATION',
    category: 'Architecture',
    type: 'Nhà cổ',
    location: 'Hà Nội',
    area: '180 m²',
    year: '2018',
    heroImage: getPlaceholderImage(16),
    content: '<p>Cải tạo nhà cổ, giữ gìn giá trị lịch sử kết hợp tiện nghi hiện đại.</p>',
    gallery: [getPlaceholderImage(26, 800, 600), getPlaceholderImage(36, 800, 600), getPlaceholderImage(46, 800, 600)],
  },
  {
    slug: 'smart-home',
    title: 'SMART HOME',
    category: 'Architecture',
    type: 'Nhà thông minh',
    location: 'TP. Hồ Chí Minh',
    area: '300 m²',
    year: '2022',
    heroImage: getPlaceholderImage(17),
    content: '<p>Ngôi nhà thông minh với hệ thống tự động hóa, tiết kiệm năng lượng và tiện nghi.</p>',
    gallery: [getPlaceholderImage(27, 800, 600), getPlaceholderImage(37, 800, 600), getPlaceholderImage(47, 800, 600), getPlaceholderImage(57, 800, 600)],
  },
  {
    slug: 'floating-house',
    title: 'FLOATING HOUSE',
    category: 'Architecture',
    type: 'Nhà nổi',
    location: 'Cà Mau',
    area: '160 m²',
    year: '2021',
    heroImage: getPlaceholderImage(18),
    content: '<p>Nhà nổi độc đáo, thích ứng với môi trường sông nước miền Tây.</p>',
    gallery: [getPlaceholderImage(28, 800, 600), getPlaceholderImage(38, 800, 600)],
  },
];

export async function main() {
  console.log('Starting seed...');

  for (const project of projectData) {
    try {
      const existing = await prisma.project.findUnique({
        where: { slug: project.slug },
      });

      if (existing) {
        console.log(`Project ${project.slug} already exists, skipping...`);
        continue;
      }

      await prisma.project.create({
        data: project,
      });

      console.log(`✓ Created project: ${project.title}`);
    } catch (error) {
      console.error(`✗ Error creating project ${project.slug}:`, error instanceof Error ? error.message : String(error));
    }
  }

  console.log('Seed completed!');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

