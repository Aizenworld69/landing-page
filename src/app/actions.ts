'use server';

import db from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';

export async function submitRegistration(formData: FormData) {
  try {
    const fullname = formData.get('fullname')?.toString().trim();
    const phone = formData.get('phone')?.toString().trim();
    const email = formData.get('email')?.toString().trim();
    const referral = formData.get('referral')?.toString().trim();
    const role = formData.get('role')?.toString().trim();
    const company = formData.get('company')?.toString().trim() || '';
    const honeypot = formData.get('website')?.toString();

    // 1. Chống Spam: Kiểm tra Honeypot (Bot thường sẽ điền vào trường này)
    if (honeypot) {
      return { success: false, error: 'Phát hiện hoạt động bất thường.' };
    }

    if (!fullname || !phone || !email || !referral || !role) {
      return { success: false, error: 'Vui lòng điền đầy đủ các thông tin bắt buộc.' };
    }

    // 2. Validate Email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return { success: false, error: 'Email không hợp lệ. Vui lòng kiểm tra lại.' };
    }

    // 3. Validate Số điện thoại (Định dạng Việt Nam: 0 hoặc 84 + 9 chữ số)
    const phoneRegex = /^(0|84)(3|5|7|8|9|1[2689])([0-9]{8})$/;
    if (!phoneRegex.test(phone.replace(/\s/g, ''))) {
      return { success: false, error: 'Số điện thoại không đúng định dạng Việt Nam.' };
    }

    // 4. Lấy thời gian hiện tại theo múi giờ Việt Nam (UTC+7)
    const now = new Date();
    // Chuyển sang chuỗi ISO nhưng bù thêm 7 giờ để khớp múi giờ địa phương
    const vietnamTime = new Date(now.getTime() + (7 * 60 * 60 * 1000)).toISOString().replace('T', ' ').substring(0, 19);

    const stmt = db.prepare('INSERT INTO registrations (fullname, phone, email, referral, role, company, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)');
    stmt.run(fullname, phone, email, referral, role, company, vietnamTime);

    // 5. Gửi thông báo sang Lark (AnyCross/Webhook) dạng Text
    try {
      const messageText = `Họ tên: ${fullname}
Điện thoại: ${phone}
Email: ${email}
Nguồn: ${referral}
Vai trò: ${role}
Công ty: ${company}
Thời gian: ${vietnamTime}`;

      await fetch('https://open-sg.larksuite.com/anycross/trigger/callback/MDczOWJlNzg4NTc0MzliZjlhMDZhNDhiOWYyNGM5YzE4', {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
        },
        body: messageText,
      });
    } catch (webhookError) {
      console.error('Lỗi khi gửi thông báo sang Lark:', webhookError);
    }

    // Revalidate the admin path to update list
    revalidatePath('/admin');

    return { success: true, message: 'Đăng ký tham gia thành công! Chúng tôi sẽ liên hệ sớm.' };
  } catch (error) {
    console.error('Lỗi khi lưu đăng ký:', error);
    return { success: false, error: 'Đã có lỗi xảy ra. Xin vui lòng thử lại sau.' };
  }
}

export async function loginAdmin(formData: FormData) {
  const username = formData.get('username') as string;
  const password = formData.get('password') as string;

  const admin = db.prepare('SELECT * FROM admins WHERE username = ? AND password = ?').get(username, password);

  if (admin) {
    const cookieStore = await cookies();
    cookieStore.set('admin_auth', 'true', { httpOnly: true, secure: process.env.NODE_ENV === 'production', path: '/' });
    return { success: true };
  }
  return { success: false, error: 'Tên đăng nhập hoặc mật khẩu không chính xác.' };
}

export async function logoutAdmin() {
  const cookieStore = await cookies();
  cookieStore.delete('admin_auth');
  revalidatePath('/admin');
}

export async function deleteRegistration(id: number) {
  try {
    const cookieStore = await cookies();
    const isAuthenticated = cookieStore.get('admin_auth')?.value === 'true';
    if (!isAuthenticated) return { success: false, error: 'Chưa xác thực.' };

    db.prepare('DELETE FROM registrations WHERE id = ?').run(id);
    revalidatePath('/admin');
    return { success: true };
  } catch (error) {
    console.error('Lỗi khi xóa đăng ký:', error);
    return { success: false, error: 'Đã có lỗi xảy ra khi xóa.' };
  }
}
