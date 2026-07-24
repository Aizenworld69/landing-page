import { NextRequest } from 'next/server';
import { supabaseAdmin, verifyAdmin, successResponse, errorResponse } from '@/lib/portal/supabase-server';
import { adjustCourseStatus } from '@/lib/portal/utils/course';
import { invalidateCoursesServerCache } from '@/lib/portal/server-data';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ idOrSlug: string }> }
) {
  try {
    const { idOrSlug } = await params;
    const isUuid = UUID_REGEX.test(idOrSlug);

    const query = supabaseAdmin
      .from('courses')
      .select(`
        *,
        course_modules (
          id,
          title,
          subtitle,
          description,
          duration_minutes,
          order_index,
          start_time,
          item_type
        ),
        instructors (id, name, title, avatar_url, bio)
      `)
      .order('order_index', { referencedTable: 'course_modules', ascending: true });

    let { data, error } = isUuid
      ? await query.eq('id', idOrSlug).single()
      : await query.eq('slug', idOrSlug).single();

    if (error || !data) {
      if (error?.code === 'PGRST116' || !data) {
        // Fallback: try querying without joins in case join relation is missing
        const simpleQuery = supabaseAdmin.from('courses').select('*');
        const simpleRes = isUuid
          ? await simpleQuery.eq('id', idOrSlug).single()
          : await simpleQuery.eq('slug', idOrSlug).single();

        if (simpleRes.data) {
          data = { ...simpleRes.data, course_modules: [], instructors: null };
        } else {
          return errorResponse('Khóa học không tồn tại', 404, req.nextUrl.pathname);
        }
      } else {
        throw error;
      }
    }

    return successResponse(adjustCourseStatus(data));
  } catch (err) {
    console.error('GET /api/courses/[idOrSlug] error:', err);
    return errorResponse(err instanceof Error ? err.message : 'Internal Server Error', 500, req.nextUrl.pathname);
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ idOrSlug: string }> }
) {
  try {
    const admin = await verifyAdmin(req);
    if (!admin) {
      return errorResponse('Quyền truy cập bị từ chối', 403, req.nextUrl.pathname);
    }

    const { idOrSlug } = await params;
    const isUuid = UUID_REGEX.test(idOrSlug);

    if (!isUuid) {
      return errorResponse('ID khóa học không hợp lệ', 400, req.nextUrl.pathname);
    }

    const body = await req.json();

    // Strip non-column/read-only/computed properties before updating Supabase
    const {
      id: _id,
      created_at: _created_at,
      instructors: _instructors,
      course_modules: _course_modules,
      ...cleanBody
    } = body;

    let { data, error } = await supabaseAdmin
      .from('courses')
      .update(cleanBody)
      .eq('id', idOrSlug)
      .select()
      .single();

    // If Supabase schema cache lacks new columns (PGRST204), fallback by moving new fields to plans_config._meta
    if (error && error.code === 'PGRST204') {
      console.warn('[PATCH /api/courses] Schema column missing (PGRST204), falling back to plans_config._meta:', error.message);

      const extraMeta: Record<string, any> = {};
      const retryBody: Record<string, any> = { ...cleanBody };

      // Extract specific missing column if present in error message
      const match = error.message.match(/Could not find the '([^']+)' column/i);
      if (match && match[1] && match[1] in retryBody) {
        extraMeta[match[1]] = retryBody[match[1]];
        delete retryBody[match[1]];
      }

      ['schedule_time', 'location', 'location_url', 'end_date', 'early_bird_deadline'].forEach((field) => {
        if (field in retryBody) {
          extraMeta[field] = retryBody[field];
          delete retryBody[field];
        }
      });

      if (Object.keys(extraMeta).length > 0) {
        retryBody.plans_config = {
          ...(retryBody.plans_config || {}),
          _meta: {
            ...(retryBody.plans_config?._meta || {}),
            ...extraMeta,
          },
        };
      }

      const retryRes = await supabaseAdmin
        .from('courses')
        .update(retryBody)
        .eq('id', idOrSlug)
        .select()
        .single();

      data = retryRes.data;
      error = retryRes.error;
    }

    if (error) {
      if (error.code === 'PGRST116') {
        return errorResponse('Không tìm thấy khóa học', 404, req.nextUrl.pathname);
      }
      throw error;
    }

    invalidateCoursesServerCache();
    return successResponse(adjustCourseStatus(data));
  } catch (err) {
    console.error('PATCH /api/courses/[idOrSlug] error:', err);
    return errorResponse(err instanceof Error ? err.message : 'Internal Server Error', 500, req.nextUrl.pathname);
  }
}

export { PATCH as PUT };

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ idOrSlug: string }> }
) {
  try {
    const admin = await verifyAdmin(req);
    if (!admin) {
      return errorResponse('Quyền truy cập bị từ chối', 403, req.nextUrl.pathname);
    }

    const { idOrSlug } = await params;
    const isUuid = UUID_REGEX.test(idOrSlug);

    if (!isUuid) {
      return errorResponse('ID khóa học không hợp lệ', 400, req.nextUrl.pathname);
    }

    const { data, error } = await supabaseAdmin
      .from('courses')
      .delete()
      .eq('id', idOrSlug)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return errorResponse('Không tìm thấy khóa học', 404, req.nextUrl.pathname);
      }
      throw error;
    }

    invalidateCoursesServerCache();
    return successResponse(adjustCourseStatus(data));
  } catch (err) {
    console.error('DELETE /api/courses/[idOrSlug] error:', err);
    return errorResponse(err instanceof Error ? err.message : 'Internal Server Error', 500, req.nextUrl.pathname);
  }
}
