import { NextResponse } from 'next/server';
import { getDevelopments, developmentToProperty } from '@/lib/tokko';

export async function GET() {
  try {
    const devs = await getDevelopments(50);
    // Normalizamos a Property para que page.tsx los trate igual que propiedades
    const objects = devs.map(developmentToProperty);
    return NextResponse.json({ objects, meta: { total_count: objects.length } });
  } catch {
    return NextResponse.json({ objects: [], meta: { total_count: 0 } }, { status: 500 });
  }
}
