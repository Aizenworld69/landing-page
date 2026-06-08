'use server';

import db from '@/lib/db';
import bcrypt from 'bcryptjs';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

// ─────────────────────────────────────────────
// Helper: tạo mã nội dung chuyển khoản từ họ tên + gói
// Ví dụ: package 'Early Bird' → prefix 'CL01', 'Nhóm 2 người' → 'CL02', 'Nhóm 4 người' → 'CL03'
// Kết quả: 'CL01_NORMALIZED_NAME_PHONEDIGITS'
// ─────────────────────────────────────────────
function generatePaymentContent(fullname: string, phone?: string, packageType?: string): string {
  // Xác định prefix theo gói đăng ký
  let prefix = 'CL01'; // Default: Early Bird
  if (packageType === 'Nhóm 2 người') {
    prefix = 'CL02';
  } else if (packageType === 'Nhóm 4 người') {
    prefix = 'CL03';
  }

  // Normalize name: remove diacritics, convert đ->d, uppercase, remove extra spaces
  const normalized = fullname
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/gi, 'd')
    .toUpperCase()
    .trim()
    .replace(/\s+/g, '');

  const phoneDigits = (phone || '').replace(/\D/g, '');
  return `${prefix}_${normalized}_${phoneDigits}`;
}

// ─────────────────────────────────────────────
// Helper: kiểm tra auth bằng session token trong DB
// ─────────────────────────────────────────────
export async function checkAuth(): Promise<boolean> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('admin_session')?.value;
    if (!token) return false;

    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const session = db
      .prepare('SELECT id FROM sessions WHERE token = ? AND expires_at > ?')
      .get(token, now);

    return !!session;
  } catch (error) {
    console.error('Lỗi khi kiểm tra auth:', error);
    return false;
  }
}

// ─────────────────────────────────────────────
// Action: Đăng ký tham gia (public)
// ─────────────────────────────────────────────
export async function submitRegistration(formData: FormData): Promise<
  | { success: true; message: string; paymentContent: string; amount: number; packageType: string }
  | { success: false; error: string }
> {
  try {
    const fullname = formData.get('fullname')?.toString().trim();
    const phone = formData.get('phone')?.toString().trim();
    const email = formData.get('email')?.toString().trim();
    const referral = formData.get('referral')?.toString().trim();
    const role = formData.get('role')?.toString().trim();
    const company = formData.get('company')?.toString().trim() || '';
    const honeypot = formData.get('website')?.toString();
    const packageType = formData.get('package_type')?.toString().trim() || 'Nhóm 2 người';

    // Chống spam: Bot thường điền vào trường honeypot ẩn
    if (honeypot) {
      return { success: false, error: 'Phát hiện hoạt động bất thường.' };
    }

    if (!fullname || !phone || !email || !referral || !role) {
      return { success: false, error: 'Vui lòng điền đầy đủ các thông tin bắt buộc.' };
    }

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return { success: false, error: 'Email không hợp lệ. Vui lòng kiểm tra lại.' };
    }

    // Validate số điện thoại Việt Nam
    const phoneRegex = /^(0|84)(3|5|7|8|9|1[2689])([0-9]{8})$/;
    if (!phoneRegex.test(phone.replace(/\s/g, ''))) {
      return { success: false, error: 'Số điện thoại không đúng định dạng Việt Nam.' };
    }

    // Xác định số lượng thành viên và số tiền theo gói đăng ký
    let members = 2;
    let amount = 2200000; // Nhóm 2 người: 1.100.000đ/học viên -> 2.200.000đ
    if (packageType === 'Nhóm 4 người') {
      members = 4;
      amount = 3960000; // Nhóm 4 người: 990.000đ/học viên -> 3.960.000đ
    } else if (packageType === 'Early Bird') {
      members = 1;
      amount = 1300000; // Early Bird: 1.300.000đ
    }

    // Lấy thời gian hiện tại theo múi giờ Việt Nam (UTC+7)
    const now = new Date();
    const vietnamTime = new Date(now.getTime() + 7 * 60 * 60 * 1000)
      .toISOString()
      .replace('T', ' ')
      .substring(0, 19);

    // Tạo mã nội dung chuyển khoản với prefix theo gói
    const paymentContent = generatePaymentContent(fullname, phone, packageType);

    db.prepare(
      `INSERT INTO registrations 
       (fullname, phone, email, referral, role, company, payment_status, payment_content, amount, created_at, members, package_type) 
       VALUES (?, ?, ?, ?, ?, ?, 'UNPAID', ?, ?, ?, ?, ?)`,
    ).run(fullname, phone, email, referral, role, company, paymentContent, amount, vietnamTime, members, packageType);

    // Gửi thông báo sang Lark webhook
    try {
      const messageText = `🆕 Đăng ký mới!\nHọ tên: ${fullname}\nĐiện thoại: ${phone}\nEmail: ${email}\nNguồn: ${referral}\nVai trò: ${role}\nCông ty: ${company}\nGói: ${packageType} (${members} người)\nSố tiền: ${amount.toLocaleString('vi-VN')}đ\nMã CK: ${paymentContent}\nThời gian: ${vietnamTime}`;
      await fetch(
        'https://open-sg.larksuite.com/anycross/trigger/callback/MDczOWJlNzg4NTc0MzliZjlhMDZhNDhiOWYyNGM5YzE4',
        {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain; charset=utf-8' },
          body: messageText,
        },
      );
    } catch (webhookError) {
      console.error('Lỗi khi gửi thông báo sang Lark:', webhookError);
    }

    revalidatePath('/admin');
    return {
      success: true,
      message: 'Đăng ký tham gia thành công! Chúng tôi sẽ liên hệ sớm.',
      paymentContent,
      amount,
      packageType,
    };
  } catch (error) {
    console.error('Lỗi khi lưu đăng ký:', error);
    return { success: false, error: 'Đã có lỗi xảy ra. Xin vui lòng thử lại sau.' };
  }
}

// ─────────────────────────────────────────────
// Action: Đăng ký nhóm (nhiều người trên 1 form)
// ─────────────────────────────────────────────
export async function submitGroupRegistration(formData: FormData): Promise<
  | { success: true; message: string; packageType: string }
  | { success: false; error: string }
> {
  try {
    const packageType = formData.get('package_type')?.toString().trim() || 'Nhóm 2 người';
    const honeypot = formData.get('website')?.toString();
    if (honeypot) return { success: false, error: 'Phát hiện hoạt động bất thường.' };

    let memberCount = 1;
    let amountPerPerson = 1300000;
    if (packageType === 'Nhóm 2 người') { memberCount = 2; amountPerPerson = 1100000; }
    else if (packageType === 'Nhóm 4 người') { memberCount = 4; amountPerPerson = 990000; }
    else if (packageType === 'Early Bird') { memberCount = 1; amountPerPerson = 950000; }

    const primaryFullname = formData.get('fullname_1')?.toString().trim() || '';
    const primaryPhone = formData.get('phone_1')?.toString().trim() || '';
    const primaryEmail = formData.get('email_1')?.toString().trim() || '';
    const referral = formData.get('referral')?.toString().trim() || 'Website';

    if (!primaryFullname || !primaryPhone) {
      return { success: false, error: 'Vui lòng điền đầy đủ thông tin người đăng ký.' };
    }

    const now = new Date();
    const vietnamTime = new Date(now.getTime() + 7 * 60 * 60 * 1000)
      .toISOString().replace('T', ' ').substring(0, 19);

    const paymentContent = generatePaymentContent(primaryFullname, primaryPhone, packageType);

    const insertStmt = db.prepare(
      `INSERT INTO registrations 
       (fullname, phone, email, referral, role, company, payment_status, payment_content, amount, created_at, members, package_type) 
       VALUES (?, ?, ?, ?, 'Học viên', '', 'UNPAID', ?, ?, ?, ?, ?)`
    );

    for (let i = 1; i <= memberCount; i++) {
      const fn = formData.get(`fullname_${i}`)?.toString().trim() || '';
      const ph = formData.get(`phone_${i}`)?.toString().trim() || '';
      const em = formData.get(`email_${i}`)?.toString().trim() || '';
      if (!fn || !ph) return { success: false, error: `Vui lòng điền đầy đủ thông tin người ${i}.` };
      insertStmt.run(fn, ph, em, referral, paymentContent, amountPerPerson, vietnamTime, memberCount, packageType);
    }

    try {
      const names = Array.from({ length: memberCount }, (_, i) =>
        formData.get(`fullname_${i + 1}`)?.toString().trim() || ''
      ).join(', ');
      const messageText = `🆕 Đăng ký nhóm mới!\nGói: ${packageType} (${memberCount} người)\nHọ tên: ${names}\nĐiện thoại: ${primaryPhone}\nEmail: ${primaryEmail}\nNguồn: ${referral}\nSố tiền: ${(amountPerPerson * memberCount).toLocaleString('vi-VN')}đ\nMã CK: ${paymentContent}\nThời gian: ${vietnamTime}`;
      await fetch(
        'https://open-sg.larksuite.com/anycross/trigger/callback/MDczOWJlNzg4NTc0MzliZjlhMDZhNDhiOWYyNGM5YzE4',
        { method: 'POST', headers: { 'Content-Type': 'text/plain; charset=utf-8' }, body: messageText }
      );
    } catch {}

    revalidatePath('/admin');
    return { success: true, message: 'Đăng ký thành công!', packageType };
  } catch (error) {
    console.error('Lỗi đăng ký nhóm:', error);
    return { success: false, error: 'Đã có lỗi xảy ra. Vui lòng thử lại.' };
  }
}



// ─────────────────────────────────────────────
// Action: Cập nhật trạng thái thanh toán (admin)
// ─────────────────────────────────────────────
export async function updatePaymentStatus(id: number, status: 'PAID' | 'UNPAID') {
  try {
    const authenticated = await checkAuth();
    if (!authenticated) {
      return { success: false, error: 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn.' };
    }

    db.prepare('UPDATE registrations SET payment_status = ? WHERE id = ?').run(status, id);
    revalidatePath('/admin');
    return { success: true };
  } catch (error) {
    console.error('Lỗi khi cập nhật trạng thái thanh toán:', error);
    return { success: false, error: 'Đã có lỗi xảy ra.' };
  }
}

// ─────────────────────────────────────────────
// Action: Thêm đăng ký thủ công (admin)
// ─────────────────────────────────────────────
export async function addManualRegistration(formData: FormData) {
  try {
    const authenticated = await checkAuth();
    if (!authenticated) {
      return { success: false, error: 'Phiên đăng nhập không hợp lệ.' };
    }

    const fullname = formData.get('fullname')?.toString().trim();
    const phone = formData.get('phone')?.toString().trim();
    const email = formData.get('email')?.toString().trim() || '';
    const company = formData.get('company')?.toString().trim() || '';
    const amountRaw = formData.get('amount')?.toString().trim();
    const paymentStatus = formData.get('payment_status')?.toString() as 'PAID' | 'UNPAID';
    const packageType = formData.get('package_type')?.toString().trim() || 'Standard';
    const membersRaw = formData.get('members')?.toString().trim();
    const members = membersRaw ? parseInt(membersRaw, 10) : 1;
    const createdAtRaw = formData.get('created_at')?.toString().trim();

    if (!fullname || !phone) {
      return { success: false, error: 'Họ tên và SĐT là bắt buộc.' };
    }

    const amount = amountRaw ? parseInt(amountRaw.replace(/\D/g, ''), 10) : 150000;

    const finalPaymentContent = generatePaymentContent(fullname, phone, packageType);

    let vietnamTime = '';
    if (createdAtRaw) {
      vietnamTime = createdAtRaw.replace('T', ' ');
      if (vietnamTime.length === 16) {
        vietnamTime += ':00';
      }
    } else {
      const now = new Date();
      vietnamTime = new Date(now.getTime() + 7 * 60 * 60 * 1000)
        .toISOString()
        .replace('T', ' ')
        .substring(0, 19);
    }

    db.prepare(
      `INSERT INTO registrations 
       (fullname, phone, email, referral, role, company, payment_status, payment_content, amount, created_at, members, package_type) 
       VALUES (?, ?, ?, 'Thêm thủ công', 'Admin', ?, ?, ?, ?, ?, ?, ?)`,
    ).run(
      fullname,
      phone,
      email,
      company,
      paymentStatus || 'UNPAID',
      finalPaymentContent,
      amount,
      vietnamTime,
      members,
      packageType,
    );

    revalidatePath('/admin');
    return { success: true };
  } catch (error) {
    console.error('Lỗi khi thêm đăng ký thủ công:', error);
    return { success: false, error: 'Đã có lỗi xảy ra.' };
  }
}

// ─────────────────────────────────────────────
// Action: Đăng nhập admin
// ─────────────────────────────────────────────
export async function loginAdmin(
  formData: FormData,
): Promise<{ success: false; error: string } | never> {
  const username = formData.get('username')?.toString().trim() ?? '';
  const password = formData.get('password')?.toString() ?? '';

  try {
    const admin = db
      .prepare('SELECT id, password FROM admins WHERE username = ?')
      .get(username) as { id: number; password: string } | undefined;

    if (!admin) {
      return { success: false, error: 'Sai thông tin đăng nhập.' };
    }

    const match = await bcrypt.compare(password, admin.password);
    if (!match) {
      return { success: false, error: 'Sai thông tin đăng nhập.' };
    }

    // Tạo session token ngẫu nhiên
    const token = crypto.randomUUID() + crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 8 * 60 * 60 * 1000)
      .toISOString()
      .replace('T', ' ')
      .substring(0, 19);
    const nowUtc = new Date().toISOString().replace('T', ' ').substring(0, 19);

    // Xóa sessions hết hạn trước khi tạo mới
    db.prepare('DELETE FROM sessions WHERE admin_id = ? AND expires_at <= ?').run(
      admin.id,
      nowUtc,
    );

    db.prepare('INSERT INTO sessions (token, admin_id, expires_at) VALUES (?, ?, ?)').run(
      token,
      admin.id,
      expiresAt,
    );

    const cookieStore = await cookies();
    cookieStore.set('admin_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 28800,
    });
  } catch (error) {
    console.error('Lỗi khi đăng nhập admin:', error);
    return { success: false, error: 'Đã có lỗi hệ thống. Vui lòng thử lại.' };
  }

  redirect('/admin');
}

// ─────────────────────────────────────────────
// Action: Đăng xuất admin
// ─────────────────────────────────────────────
export async function logoutAdmin() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('admin_session')?.value;
    if (token) {
      db.prepare('DELETE FROM sessions WHERE token = ?').run(token);
    }
    cookieStore.delete('admin_session');
    redirect('/admin/login');
  } catch (error) {
    console.error('Lỗi khi đăng xuất:', error);
  }
}

// ─────────────────────────────────────────────
// Action: Chỉnh sửa thông tin đăng ký (admin)
// ─────────────────────────────────────────────
export async function updateRegistration(id: number, formData: FormData) {
  try {
    const authenticated = await checkAuth();
    if (!authenticated) {
      return { success: false, error: 'Phiên đăng nhập không hợp lệ.' };
    }

    const fullname = formData.get('fullname')?.toString().trim();
    const phone = formData.get('phone')?.toString().trim();
    const email = formData.get('email')?.toString().trim() ?? '';
    const company = formData.get('company')?.toString().trim() ?? '';
    const amountRaw = formData.get('amount')?.toString().trim();
    const paymentContent = formData.get('payment_content')?.toString().trim() ?? '';
    const packageType = formData.get('package_type')?.toString().trim() || 'Standard';
    const membersRaw = formData.get('members')?.toString().trim();
    const members = membersRaw ? parseInt(membersRaw, 10) : 1;
    const createdAtRaw = formData.get('created_at')?.toString().trim();
    const paymentStatus = formData.get('payment_status')?.toString() as 'PAID' | 'UNPAID';

    if (!fullname || !phone) {
      return { success: false, error: 'Họ tên và SĐT là bắt buộc.' };
    }

    const amount = amountRaw ? parseInt(amountRaw.replace(/\D/g, ''), 10) : 150000;

    let vietnamTime = '';
    if (createdAtRaw) {
      vietnamTime = createdAtRaw.replace('T', ' ');
      if (vietnamTime.length === 16) {
        vietnamTime += ':00';
      }
    } else {
      const now = new Date();
      vietnamTime = new Date(now.getTime() + 7 * 60 * 60 * 1000)
        .toISOString()
        .replace('T', ' ')
        .substring(0, 19);
    }

    db.prepare(`
      UPDATE registrations
      SET fullname = ?, phone = ?, email = ?, company = ?, amount = ?, payment_content = ?, package_type = ?, members = ?, created_at = ?, payment_status = ?
      WHERE id = ?
    `).run(fullname, phone, email, company, amount, paymentContent, packageType, members, vietnamTime, paymentStatus, id);

    revalidatePath('/admin');
    return { success: true };
  } catch (error) {
    console.error('Lỗi khi cập nhật thông tin đăng ký:', error);
    return { success: false, error: 'Đã có lỗi xảy ra khi cập nhật.' };
  }
}

// ─────────────────────────────────────────────
// Action: Xóa đăng ký (yêu cầu auth)
// ─────────────────────────────────────────────
export async function deleteRegistration(id: number) {
  try {
    const authenticated = await checkAuth();
    if (!authenticated) {
      return { success: false, error: 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn.' };
    }
    db.prepare('DELETE FROM registrations WHERE id = ?').run(id);
    revalidatePath('/admin');
    return { success: true };
  } catch (error) {
    console.error('Lỗi khi xóa đăng ký:', error);
    return { success: false, error: 'Đã có lỗi xảy ra khi xóa.' };
  }
}
