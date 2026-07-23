import { NextRequest } from 'next/server';
import { supabaseAdmin, verifyAdmin, successResponse, errorResponse } from '@/lib/portal/supabase-server';
import { adjustCourseStatus, sortCoursesSmart } from '@/lib/portal/utils/course';
import { invalidateCoursesServerCache } from '@/lib/portal/server-data';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const search = searchParams.get('search');
    const status = searchParams.get('status');
    const category = searchParams.get('category');
    const year = searchParams.get('year');
    const page = Number(searchParams.get('page') || 1);
    const limit = Number(searchParams.get('limit') || 9);
    const offset = (page - 1) * limit;

    let builder = supabaseAdmin
      .from('courses')
      .select('*');

    if (search) {
      builder = builder.ilike('title', `%${search}%`);
    }

    const today = new Date(new Date().getTime() + 7 * 60 * 60 * 1000).toISOString().slice(0, 10);
    if (status === 'upcoming') {
      builder = builder.eq('status', 'upcoming').or(`start_date.gte.${today},start_date.is.null`);
    } else if (status === 'completed') {
      builder = builder.or(`status.eq.completed,start_date.lt.${today}`);
    } else if (status) {
      builder = builder.eq('status', status);
    }

    if (category) {
      builder = builder.eq('category', category);
    }
    if (year) {
      builder = builder.like('start_date', `${year}%`);
    }

    const { data, error } = await builder;

    if (error) throw error;

    const mappedData = (data || []).map((c) => adjustCourseStatus(c));
    const sorted = sortCoursesSmart(mappedData);
    const paginatedItems = sorted.slice(offset, offset + limit);

    return successResponse({
      items: paginatedItems,
      pagination: {
        total: sorted.length,
        page,
        limit,
        totalPages: Math.ceil(sorted.length / limit),
      },
    });
  } catch (err) {
    console.error('GET /api/courses error:', err);
    return errorResponse(err instanceof Error ? err.message : 'Internal Server Error', 500, req.nextUrl.pathname);
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await verifyAdmin(req);
    if (!admin) {
      return errorResponse('Quyền truy cập bị từ chối', 403, req.nextUrl.pathname);
    }

    const body = await req.json();

    let { data, error } = await supabaseAdmin
      .from('courses')
      .insert([body])
      .select()
      .single();

    if (error && error.code === 'PGRST204') {
      console.warn('[POST /api/courses] Schema column missing (PGRST204), falling back to plans_config._meta:', error.message);

      const extraMeta: Record<string, any> = {};
      const retryBody: Record<string, any> = { ...body };

      ['schedule_time', 'location', 'location_url'].forEach((field) => {
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
        .insert([retryBody])
        .select()
        .single();

      data = retryRes.data;
      error = retryRes.error;
    }

    if (error) throw error;

    invalidateCoursesServerCache();
    return successResponse(adjustCourseStatus(data), 201);
  } catch (err) {
    console.error('POST /api/courses error:', err);
    return errorResponse(err instanceof Error ? err.message : 'Internal Server Error', 500, req.nextUrl.pathname);
  }
}
