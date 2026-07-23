import { NextRequest } from 'next/server';
import { supabaseAdmin, verifyAdmin, successResponse, errorResponse } from '@/lib/portal/supabase-server';
import fs from 'fs';
import path from 'path';

const ALLOWED_IMAGE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_UPLOAD_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

export async function POST(req: NextRequest) {
  try {
    const admin = await verifyAdmin(req);
    if (!admin) {
      return errorResponse('Quyền truy cập bị từ chối', 403, req.nextUrl.pathname);
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return errorResponse('Không tìm thấy file để upload', 400, req.nextUrl.pathname);
    }

    if (!ALLOWED_IMAGE_MIME_TYPES.includes(file.type)) {
      return errorResponse('Chỉ chấp nhận file ảnh định dạng JPG, PNG, WEBP hoặc GIF', 400, req.nextUrl.pathname);
    }

    if (file.size > MAX_UPLOAD_SIZE_BYTES) {
      return errorResponse('File size exceeds the 5MB limit', 400, req.nextUrl.pathname);
    }

    const requestedBucket = (formData.get('bucket') as string) || 'courses';
    const targetBucket = ['courses', 'blogs'].includes(requestedBucket) ? requestedBucket : 'courses';

    const cleanFileName = file.name
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9.-]/g, '_');
    const fileName = `${Date.now()}_${cleanFileName}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    // 1. Tải lên Supabase Storage bằng service_role key (bypass RLS)
    try {
      const { error } = await supabaseAdmin.storage
        .from(targetBucket)
        .upload(fileName, buffer, {
          contentType: file.type,
          cacheControl: '3600',
          upsert: true,
        });

      if (!error) {
        const { data: { publicUrl } } = supabaseAdmin.storage
          .from(targetBucket)
          .getPublicUrl(fileName);

        if (publicUrl) {
          return successResponse(publicUrl, 201);
        }
      } else {
        console.warn(`Supabase Storage warning (${targetBucket}): ${error.message}`);
      }
    } catch (supaErr) {
      console.warn('Supabase Storage error:', supaErr);
    }

    // 2. Fallback: chỉ dùng local filesystem ở môi trường dev/test
    //    Production (Docker/Vercel) không hỗ trợ persistent local storage
    if (process.env.NODE_ENV === 'production') {
      console.error('Supabase upload failed in production — no local fallback available');
      return errorResponse('Tải ảnh lên thất bại. Vui lòng kiểm tra cấu hình Supabase Storage.', 500, req.nextUrl.pathname);
    }

    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', targetBucket);
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    const localFilePath = path.join(uploadsDir, fileName);
    fs.writeFileSync(localFilePath, buffer);

    const localPublicUrl = `/uploads/${targetBucket}/${fileName}`;
    return successResponse(localPublicUrl, 201);
  } catch (err) {
    console.error('POST /api/courses/upload error:', err);
    return errorResponse(err instanceof Error ? err.message : 'Internal Server Error', 500, req.nextUrl.pathname);
  }
}
