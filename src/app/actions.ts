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
    let amount = 2700000; // Nhóm 2 người: 1.350.000đ/người -> 2.700.000đ
    if (packageType === 'Nhóm 4 người') {
      members = 4;
      amount = 4760000; // Nhóm 4 người: 1.190.000đ/người -> 4.760.000đ
    } else if (packageType === 'Early Bird') {
      members = 1;
      amount = 1190000; // Early Bird: 1.190.000đ
    } else if (packageType === '1 người') {
      members = 1;
      amount = 1590000; // Gói 1 người: 1.590.000đ
    }

    // Xử lý mã giảm giá
    const voucherCode = formData.get('voucher_code')?.toString().trim().toUpperCase() || '';
    let discountPercent = 0;
    if (voucherCode) {
      const nowUtc = new Date().toISOString().replace('T', ' ').substring(0, 19);
      const voucher = db.prepare('SELECT * FROM vouchers WHERE code = ?').get(voucherCode) as any;
      if (!voucher) {
        return { success: false, error: 'Mã giảm giá không tồn tại.' };
      }
      if (voucher.expires_at < nowUtc) {
        return { success: false, error: 'Mã giảm giá đã hết hạn sử dụng.' };
      }
      if (voucher.used_count >= voucher.max_uses) {
        return { success: false, error: 'Mã giảm giá đã được sử dụng.' };
      }
      if (voucher.applicable_package !== packageType) {
        return { success: false, error: `Mã giảm giá chỉ áp dụng cho gói "${voucher.applicable_package}".` };
      }
      discountPercent = voucher.discount_percent;
      amount = Math.round((amount * (100 - discountPercent)) / 100);
    }

    // Lấy thời gian hiện tại theo múi giờ Việt Nam (UTC+7)
    const now = new Date();
    const vietnamTime = new Date(now.getTime() + 7 * 60 * 60 * 1000)
      .toISOString()
      .replace('T', ' ')
      .substring(0, 19);

    // Tính tháng khai giảng (YYYY-MM) từ thời gian hiện tại
    const cohortDateObj = new Date(now.getTime() + 7 * 60 * 60 * 1000);
    const cohortMonth = cohortDateObj.toISOString().substring(0, 7); // YYYY-MM format

    // Tạo mã nội dung chuyển khoản với prefix theo gói + voucher (nếu có)
    const paymentContentSuffix = voucherCode ? `_${voucherCode}` : '';
    const paymentContent = generatePaymentContent(fullname, phone, packageType) + paymentContentSuffix;

    db.prepare(
      `INSERT INTO registrations 
       (fullname, phone, email, referral, role, company, payment_status, payment_content, amount, created_at, members, package_type, course, cohort_month, voucher_code) 
       VALUES (?, ?, ?, ?, ?, ?, 'UNPAID', ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).run(fullname, phone, email, referral, role, company, paymentContent, amount, vietnamTime, members, packageType, '', cohortMonth, voucherCode);

    // Cập nhật số lần dùng voucher
    if (voucherCode) {
      db.prepare('UPDATE vouchers SET used_count = used_count + 1 WHERE code = ?').run(voucherCode);
    }

    // Gửi thông báo sang Lark webhook
    try {
      const voucherLarkMsg = voucherCode ? `\nMã giảm giá: ${voucherCode} (Giảm ${discountPercent}%)` : '';
      const messageText = `🆕 Đăng ký mới!${voucherLarkMsg}\nHọ tên: ${fullname}\nĐiện thoại: ${phone}\nEmail: ${email}\nNguồn: ${referral}\nVai trò: ${role}\nCông ty: ${company}\nGói: ${packageType} (${members} người)\nSố tiền: ${amount.toLocaleString('vi-VN')}đ\nMã CK: ${paymentContent}\nThời gian: ${vietnamTime}`;
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
// Action: Kiểm tra mã giảm giá (Voucher)
// ─────────────────────────────────────────────
export async function validateVoucherAction(code: string, packageType: string): Promise<
  | { success: true; discountPercent: number; discountAmount: number; finalAmount: number }
  | { success: false; error: string }
> {
  try {
    if (!code) {
      return { success: false, error: 'Mã giảm giá không được để trống.' };
    }

    const cleanCode = code.trim().toUpperCase();
    const voucher = db.prepare('SELECT * FROM vouchers WHERE code = ?').get(cleanCode) as {
      code: string;
      discount_percent: number;
      max_uses: number;
      used_count: number;
      expires_at: string;
      applicable_package: string;
    } | undefined;

    if (!voucher) {
      return { success: false, error: 'Mã giảm giá không tồn tại.' };
    }

    const nowUtc = new Date().toISOString().replace('T', ' ').substring(0, 19);
    if (voucher.expires_at < nowUtc) {
      return { success: false, error: 'Mã giảm giá đã hết hạn sử dụng.' };
    }

    if (voucher.used_count >= voucher.max_uses) {
      return { success: false, error: 'Mã giảm giá đã được sử dụng.' };
    }

    if (voucher.applicable_package !== packageType) {
      return { success: false, error: `Mã giảm giá chỉ áp dụng cho gói "${voucher.applicable_package}".` };
    }

    // Xác định số tiền gốc theo packageType
    let baseAmount = 1590000; // Mặc định gói "1 người"
    if (packageType === 'Nhóm 2 người') {
      baseAmount = 2700000;
    } else if (packageType === 'Nhóm 4 người') {
      baseAmount = 4760000;
    } else if (packageType === 'Early Bird') {
      baseAmount = 1190000;
    }

    const discountAmount = Math.round((baseAmount * voucher.discount_percent) / 100);
    const finalAmount = baseAmount - discountAmount;

    return {
      success: true,
      discountPercent: voucher.discount_percent,
      discountAmount,
      finalAmount,
    };
  } catch (error) {
    console.error('Lỗi kiểm tra voucher:', error);
    return { success: false, error: 'Đã có lỗi xảy ra khi kiểm tra mã.' };
  }
}

// ─────────────────────────────────────────────
// Action: Đăng ký nhóm (nhiều người trên 1 form)
// ─────────────────────────────────────────────
export async function submitGroupRegistration(formData: FormData): Promise<
  | { success: true; message: string; packageType: string; amount: number; paymentContent: string }
  | { success: false; error: string }
> {
  try {
    const packageType = formData.get('package_type')?.toString().trim() || 'Nhóm 2 người';
    const honeypot = formData.get('website')?.toString();
    if (honeypot) return { success: false, error: 'Phát hiện hoạt động bất thường.' };

    let memberCount = 1;
    let amountPerPerson = 1590000;
    if (packageType === 'Nhóm 2 người') { memberCount = 2; amountPerPerson = 1350000; }
    else if (packageType === 'Nhóm 4 người') { memberCount = 4; amountPerPerson = 1190000; }
    else if (packageType === 'Early Bird') { memberCount = 1; amountPerPerson = 1190000; }
    else if (packageType === '1 người') { memberCount = 1; amountPerPerson = 1590000; }

    // Xử lý mã giảm giá (nếu có)
    const voucherCode = formData.get('voucher_code')?.toString().trim().toUpperCase() || '';
    let discountPercent = 0;
    if (voucherCode) {
      const nowUtc = new Date().toISOString().replace('T', ' ').substring(0, 19);
      const voucher = db.prepare('SELECT * FROM vouchers WHERE code = ?').get(voucherCode) as any;
      if (!voucher) {
        return { success: false, error: 'Mã giảm giá không tồn tại.' };
      }
      if (voucher.expires_at < nowUtc) {
        return { success: false, error: 'Mã giảm giá đã hết hạn sử dụng.' };
      }
      if (voucher.used_count >= voucher.max_uses) {
        return { success: false, error: 'Mã giảm giá đã được sử dụng.' };
      }
      if (voucher.applicable_package !== packageType) {
        return { success: false, error: `Mã giảm giá chỉ áp dụng cho gói "${voucher.applicable_package}".` };
      }
      discountPercent = voucher.discount_percent;
      amountPerPerson = Math.round((amountPerPerson * (100 - discountPercent)) / 100);
    }

    const primaryFullname = formData.get('fullname_1')?.toString().trim() || '';
    const primaryPhone = formData.get('phone_1')?.toString().trim() || '';
    const primaryEmail = formData.get('email_1')?.toString().trim() || '';
    const referral = formData.get('referral_1')?.toString().trim() || 'Website';

    if (!primaryFullname || !primaryPhone) {
      return { success: false, error: 'Vui lòng điền đầy đủ thông tin người đăng ký.' };
    }

    const now = new Date();
    const vietnamTime = new Date(now.getTime() + 7 * 60 * 60 * 1000)
      .toISOString().replace('T', ' ').substring(0, 19);

    // Nếu dùng voucher, thêm mã voucher vào nội dung chuyển khoản để nhận diện nhanh
    const paymentContentSuffix = voucherCode ? `_${voucherCode}` : '';
    const paymentContent = generatePaymentContent(primaryFullname, primaryPhone, packageType) + paymentContentSuffix;

    const insertStmt = db.prepare(
      `INSERT INTO registrations 
       (fullname, phone, email, referral, role, company, payment_status, payment_content, amount, created_at, members, package_type, voucher_code) 
       VALUES (?, ?, ?, ?, ?, ?, 'UNPAID', ?, ?, ?, ?, ?, ?)`
    );

    for (let i = 1; i <= memberCount; i++) {
      const fn = formData.get(`fullname_${i}`)?.toString().trim() || '';
      const ph = formData.get(`phone_${i}`)?.toString().trim() || '';
      const em = formData.get(`email_${i}`)?.toString().trim() || '';
      const comp = formData.get(`company_${i}`)?.toString().trim() || '';
      const rl = formData.get(`role_${i}`)?.toString().trim() || 'Học viên';
      const ref = formData.get(`referral_${i}`)?.toString().trim() || referral;

      if (!fn || !ph || !em || !rl || !ref) {
        return { success: false, error: `Vui lòng điền đầy đủ thông tin người ${i}.` };
      }

      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(em)) {
        return { success: false, error: `Email của người ${i} không hợp lệ.` };
      }

      // Phone validation
      const phoneRegex = /^(0|84)(3|5|7|8|9|1[2689])([0-9]{8})$/;
      if (!phoneRegex.test(ph.replace(/\s/g, ''))) {
        return { success: false, error: `Số điện thoại của người ${i} không hợp lệ.` };
      }

      insertStmt.run(fn, ph, em, ref, rl, comp, paymentContent, amountPerPerson, vietnamTime, memberCount, packageType, voucherCode);
    }

    // Cập nhật số lần sử dụng voucher
    if (voucherCode) {
      db.prepare('UPDATE vouchers SET used_count = used_count + 1 WHERE code = ?').run(voucherCode);
    }

    try {
      const names = Array.from({ length: memberCount }, (_, i) =>
        formData.get(`fullname_${i + 1}`)?.toString().trim() || ''
      ).join(', ');
      const voucherLarkMsg = voucherCode ? `\nMã giảm giá: ${voucherCode} (Giảm ${discountPercent}%)` : '';
      const messageText = `🆕 Đăng ký nhóm mới!${voucherLarkMsg}\nGói: ${packageType} (${memberCount} người)\nHọ tên: ${names}\nĐiện thoại: ${primaryPhone}\nEmail: ${primaryEmail}\nNguồn: ${referral}\nSố tiền: ${(amountPerPerson * memberCount).toLocaleString('vi-VN')}đ\nMã CK: ${paymentContent}\nThời gian: ${vietnamTime}`;
      await fetch(
        'https://open-sg.larksuite.com/anycross/trigger/callback/MDczOWJlNzg4NTc0MzliZjlhMDZhNDhiOWYyNGM5YzE4',
        { method: 'POST', headers: { 'Content-Type': 'text/plain; charset=utf-8' }, body: messageText }
      );
    } catch {}

    revalidatePath('/admin');
    return {
      success: true,
      message: 'Đăng ký thành công!',
      packageType,
      amount: amountPerPerson * memberCount,
      paymentContent,
    };
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
    const course = formData.get('course')?.toString().trim() || '';
    const cohortMonth = formData.get('cohort_month')?.toString().trim() || '';
    const amountRaw = formData.get('amount')?.toString().trim();
    const paymentStatus = formData.get('payment_status')?.toString() as 'PAID' | 'UNPAID';
    const packageType = formData.get('package_type')?.toString().trim() || 'Standard';
    const membersRaw = formData.get('members')?.toString().trim();
    const members = membersRaw ? parseInt(membersRaw, 10) : 1;
    const createdAtRaw = formData.get('created_at')?.toString().trim();
    const memberDetailsRaw = formData.get('memberDetails')?.toString().trim() || '[]';

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

    // Insert main registration
    const result = db.prepare(
      `INSERT INTO registrations 
       (fullname, phone, email, referral, role, company, payment_status, payment_content, amount, created_at, members, package_type, course, cohort_month) 
       VALUES (?, ?, ?, 'Thêm thủ công', 'Admin', ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
      course,
      cohortMonth,
    ) as { lastInsertRowid: number };

    const registrationId = result.lastInsertRowid;

    // Insert member details if provided
    try {
      const memberDetails = JSON.parse(memberDetailsRaw) as Array<{
        fullname: string;
        phone: string;
        email: string;
        role: string;
        company: string;
      }>;

      const insertMemberStmt = db.prepare(
        `INSERT INTO group_members (registration_id, member_index, fullname, phone, email, role, company, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      );

      memberDetails.forEach((member, idx) => {
        insertMemberStmt.run(
          registrationId,
          idx,
          member.fullname || '',
          member.phone || '',
          member.email || '',
          member.role || '',
          member.company || '',
          vietnamTime,
        );
      });
    } catch (parseError) {
      console.error('Lỗi khi parse member details:', parseError);
    }

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
    const course = formData.get('course')?.toString().trim() ?? '';
    const cohortMonth = formData.get('cohort_month')?.toString().trim() ?? '';
    const amountRaw = formData.get('amount')?.toString().trim();
    const paymentContent = formData.get('payment_content')?.toString().trim() ?? '';
    const packageType = formData.get('package_type')?.toString().trim() || 'Standard';
    const membersRaw = formData.get('members')?.toString().trim();
    const members = membersRaw ? parseInt(membersRaw, 10) : 1;
    const createdAtRaw = formData.get('created_at')?.toString().trim();
    const paymentStatus = formData.get('payment_status')?.toString() as 'PAID' | 'UNPAID';
    const voucherCode = formData.get('voucher_code')?.toString().trim().toUpperCase() ?? '';

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
      SET fullname = ?, phone = ?, email = ?, company = ?, amount = ?, payment_content = ?, package_type = ?, members = ?, created_at = ?, payment_status = ?, course = ?, cohort_month = ?, voucher_code = ?
      WHERE id = ?
    `).run(fullname, phone, email, company, amount, paymentContent, packageType, members, vietnamTime, paymentStatus, course, cohortMonth, voucherCode, id);

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

// ─────────────────────────────────────────────
// Courses Management Actions
// ─────────────────────────────────────────────

// Action: Thêm khóa học mới
export async function addCourse(formData: FormData) {
  try {
    const authenticated = await checkAuth();
    if (!authenticated) {
      return { success: false, error: 'Phiên đăng nhập không hợp lệ.' };
    }

    const name = formData.get('name')?.toString().trim();
    const month = formData.get('month')?.toString().trim();
    const implementationDate = formData.get('implementation_date')?.toString().trim();
    const location = formData.get('location')?.toString().trim();

    if (!name || !month || !implementationDate || !location) {
      return { success: false, error: 'Vui lòng điền đầy đủ thông tin khóa học.' };
    }

    db.prepare(`
      INSERT INTO courses (name, month, implementation_date, location)
      VALUES (?, ?, ?, ?)
    `).run(name, month, implementationDate, location);

    revalidatePath('/admin/courses');
    return { success: true, message: 'Khóa học đã được thêm thành công.' };
  } catch (error) {
    console.error('Lỗi khi thêm khóa học:', error);
    return { success: false, error: 'Đã có lỗi xảy ra khi thêm khóa học.' };
  }
}

// Action: Cập nhật khóa học
export async function updateCourse(id: number, formData: FormData) {
  try {
    const authenticated = await checkAuth();
    if (!authenticated) {
      return { success: false, error: 'Phiên đăng nhập không hợp lệ.' };
    }

    const name = formData.get('name')?.toString().trim();
    const month = formData.get('month')?.toString().trim();
    const implementationDate = formData.get('implementation_date')?.toString().trim();
    const location = formData.get('location')?.toString().trim();

    if (!name || !month || !implementationDate || !location) {
      return { success: false, error: 'Vui lòng điền đầy đủ thông tin khóa học.' };
    }

    db.prepare(`
      UPDATE courses
      SET name = ?, month = ?, implementation_date = ?, location = ?
      WHERE id = ?
    `).run(name, month, implementationDate, location, id);

    revalidatePath('/admin/courses');
    return { success: true, message: 'Khóa học đã được cập nhật thành công.' };
  } catch (error) {
    console.error('Lỗi khi cập nhật khóa học:', error);
    return { success: false, error: 'Đã có lỗi xảy ra khi cập nhật khóa học.' };
  }
}

// Action: Xóa khóa học
export async function deleteCourse(id: number) {
  try {
    const authenticated = await checkAuth();
    if (!authenticated) {
      return { success: false, error: 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn.' };
    }
    db.prepare('DELETE FROM courses WHERE id = ?').run(id);
    revalidatePath('/admin/courses');
    return { success: true };
  } catch (error) {
    console.error('Lỗi khi xóa khóa học:', error);
    return { success: false, error: 'Đã có lỗi xảy ra khi xóa khóa học.' };
  }
}

// ─────────────────────────────────────────────
// Vouchers Management Actions
// ─────────────────────────────────────────────

// Action: Thêm voucher mới
export async function addVoucher(formData: FormData) {
  try {
    const authenticated = await checkAuth();
    if (!authenticated) {
      return { success: false, error: 'Phiên đăng nhập không hợp lệ.' };
    }

    const code = formData.get('code')?.toString().trim().toUpperCase();
    const discountPercentRaw = formData.get('discount_percent')?.toString();
    const maxUsesRaw = formData.get('max_uses')?.toString();
    const expiresAtRaw = formData.get('expires_at')?.toString();
    const applicablePackage = formData.get('applicable_package')?.toString().trim() || '1 người';

    if (!code || !discountPercentRaw || !maxUsesRaw || !expiresAtRaw) {
      return { success: false, error: 'Vui lòng điền đầy đủ thông tin.' };
    }

    const discountPercent = parseInt(discountPercentRaw, 10);
    const maxUses = parseInt(maxUsesRaw, 10);
    if (isNaN(discountPercent) || discountPercent < 1 || discountPercent > 100) {
      return { success: false, error: 'Phần trăm giảm giá phải từ 1 đến 100.' };
    }
    if (isNaN(maxUses) || maxUses < 1) {
      return { success: false, error: 'Số lần sử dụng tối đa phải từ 1 trở lên.' };
    }

    // Format expiresAt to sqlite DATETIME format
    // datetime-local input is YYYY-MM-DDTHH:MM, we convert to YYYY-MM-DD HH:MM:00
    const expiresAt = expiresAtRaw.replace('T', ' ') + ':00';

    // Kiểm tra trùng mã
    const existing = db.prepare('SELECT code FROM vouchers WHERE code = ?').get(code);
    if (existing) {
      return { success: false, error: 'Mã giảm giá đã tồn tại.' };
    }

    db.prepare(`
      INSERT INTO vouchers (code, discount_percent, max_uses, used_count, expires_at, applicable_package)
      VALUES (?, ?, ?, 0, ?, ?)
    `).run(code, discountPercent, maxUses, expiresAt, applicablePackage);

    revalidatePath('/admin/vouchers');
    return { success: true, message: 'Voucher đã được thêm thành công.' };
  } catch (error) {
    console.error('Lỗi khi thêm voucher:', error);
    return { success: false, error: 'Đã có lỗi xảy ra khi thêm.' };
  }
}

// Action: Cập nhật voucher
export async function updateVoucher(originalCode: string, formData: FormData) {
  try {
    const authenticated = await checkAuth();
    if (!authenticated) {
      return { success: false, error: 'Phiên đăng nhập không hợp lệ.' };
    }

    const code = formData.get('code')?.toString().trim().toUpperCase();
    const discountPercentRaw = formData.get('discount_percent')?.toString();
    const maxUsesRaw = formData.get('max_uses')?.toString();
    const usedCountRaw = formData.get('used_count')?.toString();
    const expiresAtRaw = formData.get('expires_at')?.toString();
    const applicablePackage = formData.get('applicable_package')?.toString().trim() || '1 người';

    if (!code || !discountPercentRaw || !maxUsesRaw || !usedCountRaw || !expiresAtRaw) {
      return { success: false, error: 'Vui lòng điền đầy đủ thông tin.' };
    }

    const discountPercent = parseInt(discountPercentRaw, 10);
    const maxUses = parseInt(maxUsesRaw, 10);
    const usedCount = parseInt(usedCountRaw, 10);
    if (isNaN(discountPercent) || discountPercent < 1 || discountPercent > 100) {
      return { success: false, error: 'Phần trăm giảm giá phải từ 1 đến 100.' };
    }
    if (isNaN(maxUses) || maxUses < 1) {
      return { success: false, error: 'Số lần sử dụng tối đa phải từ 1 trở lên.' };
    }
    if (isNaN(usedCount) || usedCount < 0) {
      return { success: false, error: 'Số lần đã dùng không hợp lệ.' };
    }

    const expiresAt = expiresAtRaw.replace('T', ' ').substring(0, 19) + (expiresAtRaw.length === 16 ? ':00' : '');

    // Nếu thay đổi code, check trùng
    if (code !== originalCode) {
      const existing = db.prepare('SELECT code FROM vouchers WHERE code = ?').get(code);
      if (existing) {
        return { success: false, error: 'Mã giảm giá mới đã tồn tại.' };
      }
    }

    db.prepare(`
      UPDATE vouchers
      SET code = ?, discount_percent = ?, max_uses = ?, used_count = ?, expires_at = ?, applicable_package = ?
      WHERE code = ?
    `).run(code, discountPercent, maxUses, usedCount, expiresAt, applicablePackage, originalCode);

    revalidatePath('/admin/vouchers');
    return { success: true, message: 'Voucher đã được cập nhật thành công.' };
  } catch (error) {
    console.error('Lỗi khi cập nhật voucher:', error);
    return { success: false, error: 'Đã có lỗi xảy ra khi cập nhật.' };
  }
}

// Action: Xóa voucher
export async function deleteVoucher(code: string) {
  try {
    const authenticated = await checkAuth();
    if (!authenticated) {
      return { success: false, error: 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn.' };
    }
    db.prepare('DELETE FROM vouchers WHERE code = ?').run(code);
    revalidatePath('/admin/vouchers');
    return { success: true };
  } catch (error) {
    console.error('Lỗi khi xóa voucher:', error);
    return { success: false, error: 'Đã có lỗi xảy ra khi xóa.' };
  }
}
