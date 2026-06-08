import { redirect } from 'next/navigation';
import { checkAuth } from '@/app/actions';
import LoginForm from './LoginForm';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Đăng nhập — Aizen World Admin',
  description: 'Trang đăng nhập hệ thống nội bộ Aizen World.',
};

export default async function LoginPage() {
  // Nếu đã xác thực → redirect thẳng vào dashboard
  const authenticated = await checkAuth();
  if (authenticated) {
    redirect('/admin');
  }

  return <LoginForm />;
}
