'use client';

import { useState } from 'react';
import { Input, Select, Textarea } from '@/components/forms';
import { GoogleMap, ContactHero } from '@/components/contact';
import Button from '@/components/ui/Button';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    customerName: '',
    email: '',
    phone: '',
    category: '',
    location: '',
    area: '',
    budget: '',
    notes: '',
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log('Form submitted:', formData);
  };

  const categoryOptions = [
    { value: '', label: 'Chọn thể loại' },
    { value: 'residential', label: 'Nhà ở' },
    { value: 'commercial', label: 'Thương mại' },
    { value: 'office', label: 'Văn phòng' },
    { value: 'other', label: 'Khác' },
  ];

  return (
    <div className="min-h-screen bg-white">
      <ContactHero />
      <div className="sm:mt-[62px] mt-[23px]">
        <div className="">
          <h1 className="text-3xl sm:text-4xl font-normal md:mb-[124px] mb-8 tracking-wide">
            CONTACT
          </h1>

          <div className="flex flex-col lg:flex-row lg:justify-between gap-8 lg:gap-[107px] mb-12">
            <div className="w-full lg:flex-1">
              <form onSubmit={handleSubmit} className="space-y-4 lg:space-y-6">
                <Input
                  label="Tên khách hàng"
                  name="customerName"
                  value={formData.customerName}
                  onChange={handleChange}
                  required
                />

                <Input
                  label="Email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />

                <Input
                  label="Số điện thoại"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                />

                <Select
                  label="Thể loại"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  options={categoryOptions}
                  required
                />

                <Input
                  label="Vị trí"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                />

                <Input
                  label="Diện tích"
                  name="area"
                  value={formData.area}
                  onChange={handleChange}
                />

                <Input
                  label="Ngân sách dự tính"
                  name="budget"
                  value={formData.budget}
                  onChange={handleChange}
                />

                <Textarea
                  label="Ghi chú cho chúng tôi"
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  rows={6}
                />

                <div className="pt-2 flex justify-end">
                  <Button
                    type="submit"
                    className="w-[113px] h-6 flex p-0! pt-[4px]! justify-center items-center gap-[10px] capitalize! bg-white text-black! border-black border-[0.5px] text-center font-gayathri text-[10px] font-normal leading-[20px] tracking-[1.4px]"
                  >
                    Gửi
                  </Button>
                </div>
              </form>
            </div>

            <div className="w-full lg:flex-1 h-[500px] lg:h-[663px] lg:mt-8">
              <GoogleMap className="w-full h-full rounded-sm" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-12 pt-8 border-t border-[#e0e0e0]">
            <div>
              <p className="text-xs text-[#666] mb-1 uppercase tracking-wide">Email</p>
              <a
                href="mailto:info@olgatudio.vn"
                className="text-base text-[#333] hover:text-black transition-colors"
              >
                info@olgatudio.vn
              </a>
            </div>
            <div>
              <p className="text-xs text-[#666] mb-1 uppercase tracking-wide">Hotline</p>
              <a
                href="tel:0900000000"
                className="text-base text-[#333] hover:text-black transition-colors"
              >
                0900 000 000
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

