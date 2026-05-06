import { NextRequest, NextResponse } from 'next/server';
import { getProperties, PropertyFilters } from '@/lib/tokko';

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const offset = parseInt(searchParams.get('offset') ?? '0');
  const limit = parseInt(searchParams.get('limit') ?? '20');
  const filtersRaw = searchParams.get('filters');
  let filters: PropertyFilters = {};
  try { if (filtersRaw) filters = JSON.parse(decodeURIComponent(filtersRaw)); } catch { /* noop */ }

  try {
    const result = await getProperties(filters, offset, limit);
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ objects: [], meta: { total_count: 0, limit, offset, next: null, previous: null } }, { status: 500 });
  }
}
