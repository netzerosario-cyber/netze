// ============================================================
// app/api/admin/analytics/route.ts — Datos de analytics
// ============================================================
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

export async function GET() {
  const supabase = getSupabase();
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase no configurado' }, { status: 500 });
  }

  try {
    // Top 10 más vistas
    const { data: topViews } = await supabase
      .from('property_events')
      .select('property_id, property_title, property_address')
      .eq('event_type', 'view')
      .order('created_at', { ascending: false });

    // Top 10 más WhatsApp
    const { data: topWa } = await supabase
      .from('property_events')
      .select('property_id, property_title, property_address')
      .eq('event_type', 'whatsapp_click')
      .order('created_at', { ascending: false });

    // Top 10 map clicks
    const { data: topMap } = await supabase
      .from('property_events')
      .select('property_id, property_title, property_address')
      .eq('event_type', 'map_click')
      .order('created_at', { ascending: false });

    // Totales
    const { count: totalViews } = await supabase
      .from('property_events')
      .select('*', { count: 'exact', head: true })
      .eq('event_type', 'view');

    const { count: totalWa } = await supabase
      .from('property_events')
      .select('*', { count: 'exact', head: true })
      .eq('event_type', 'whatsapp_click');

    const { count: totalMapClicks } = await supabase
      .from('property_events')
      .select('*', { count: 'exact', head: true })
      .eq('event_type', 'map_click');

    // Últimos 7 días por día
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data: recentEvents } = await supabase
      .from('property_events')
      .select('event_type, created_at')
      .gte('created_at', sevenDaysAgo.toISOString())
      .order('created_at', { ascending: true });

    // Agrupar por propiedad para ranking
    function rankByProperty(events: { property_id: string; property_title: string | null; property_address: string | null }[] | null) {
      if (!events) return [];
      const map = new Map<string, { id: string; title: string; address: string; count: number }>();
      events.forEach(e => {
        const existing = map.get(e.property_id);
        if (existing) {
          existing.count++;
        } else {
          map.set(e.property_id, {
            id: e.property_id,
            title: e.property_title || `Propiedad #${e.property_id}`,
            address: e.property_address || '',
            count: 1,
          });
        }
      });
      return Array.from(map.values()).sort((a, b) => b.count - a.count).slice(0, 10);
    }

    // Agrupar por día para gráfico
    function groupByDay(events: { event_type: string; created_at: string }[] | null) {
      if (!events) return [];
      const days = new Map<string, { views: number; whatsapp: number; map: number }>();
      events.forEach(e => {
        const day = e.created_at.slice(0, 10);
        const existing = days.get(day) || { views: 0, whatsapp: 0, map: 0 };
        if (e.event_type === 'view') existing.views++;
        else if (e.event_type === 'whatsapp_click') existing.whatsapp++;
        else if (e.event_type === 'map_click') existing.map++;
        days.set(day, existing);
      });
      return Array.from(days.entries()).map(([date, counts]) => ({ date, ...counts }));
    }

    return NextResponse.json({
      totals: {
        views: totalViews ?? 0,
        whatsapp_clicks: totalWa ?? 0,
        map_clicks: totalMapClicks ?? 0,
      },
      topViews: rankByProperty(topViews),
      topWhatsApp: rankByProperty(topWa),
      topMapClicks: rankByProperty(topMap),
      dailyTrend: groupByDay(recentEvents),
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
