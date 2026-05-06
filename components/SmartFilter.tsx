'use client';
// ============================================================
// components/SmartFilter.tsx
// Filtro en cascada:
//   Paso 1: Comprar / Alquilar
//   Paso 2: Categoría (Vivienda, Comercial, Terrenos…)
//   Paso 3: Tipo específico (Casa, Dpto, Oficina…)
//   Paso 4 (solo Comprar): Estado (Usado, A estrenar, Pozo…)
// ============================================================
import { useState, useEffect, useRef } from 'react';
import { PropertyFilters, PROPERTY_TYPE_IDS, OPERATION_TYPE_IDS } from '@/lib/tokko';

interface SmartFilterProps {
  filters: PropertyFilters;
  onFilterChange: (filters: PropertyFilters) => void;
  resultCount: number;
}

// ── Estructura del filtro en cascada ────────────────────────

type OperationId = 'comprar' | 'alquilar';
type CategoryId = 'vivienda' | 'comercial' | 'terrenos' | 'emprendimiento';

interface Category {
  id: CategoryId;
  label: string;
  emoji: string;
  types: Array<{ label: string; id: number }>;
  /** Solo Comprar tiene estado de condición */
  conditions?: Array<{ label: string; value: string }>;
}

// Condiciones de compra (usado/estrenar/pozo/etc.)
const BUY_CONDITIONS = [
  { label: 'Usado',        value: 'used' },
  { label: 'A estrenar',   value: 'new' },
  { label: 'En ejecución', value: 'construction' },
  { label: 'Pozo',         value: 'launch' },
];

const CATEGORIES: Record<OperationId, Category[]> = {
  comprar: [
    {
      id: 'vivienda',
      label: 'Vivienda',
      emoji: '🏠',
      types: [
        { label: 'Departamento',   id: PROPERTY_TYPE_IDS.Departamento },
        { label: 'Casa',           id: PROPERTY_TYPE_IDS.Casa },
        { label: 'Barrio Cerrado', id: PROPERTY_TYPE_IDS['Barrio Cerrado'] },
      ],
      conditions: BUY_CONDITIONS,
    },
    {
      id: 'comercial',
      label: 'Comercial',
      emoji: '🏢',
      types: [
        { label: 'Oficina', id: PROPERTY_TYPE_IDS.Oficina },
        { label: 'Local',   id: PROPERTY_TYPE_IDS.Local },
      ],
    },
    {
      id: 'terrenos',
      label: 'Terrenos',
      emoji: '📐',
      types: [
        { label: 'Lote', id: PROPERTY_TYPE_IDS.Lote },
      ],
    },
    {
      id: 'emprendimiento',
      label: 'Emprendimiento',
      emoji: '🏗',
      types: [
        { label: 'Emprendimiento', id: PROPERTY_TYPE_IDS.Emprendimiento },
      ],
      conditions: [
        { label: 'Lanzamiento',        value: 'launch' },
        { label: 'En ejecución',       value: 'construction' },
        { label: 'Próximo a entregar', value: 'almost_complete' },
        { label: 'Terminados',         value: 'complete' },
      ],
    },
  ],
  alquilar: [
    {
      id: 'vivienda',
      label: 'Vivienda',
      emoji: '🏠',
      types: [
        { label: 'Departamento', id: PROPERTY_TYPE_IDS.Departamento },
        { label: 'Casa',         id: PROPERTY_TYPE_IDS.Casa },
      ],
    },
    {
      id: 'comercial',
      label: 'Comercial',
      emoji: '🏢',
      types: [
        { label: 'Oficina', id: PROPERTY_TYPE_IDS.Oficina },
        { label: 'Local',   id: PROPERTY_TYPE_IDS.Local },
      ],
    },
  ],
};

// ── Pill label ───────────────────────────────────────────────
function getActiveLabel(filters: PropertyFilters): string {
  const isAlq = filters.operation_types?.includes(OPERATION_TYPE_IDS.Alquiler);
  const isVen = filters.operation_types?.includes(OPERATION_TYPE_IDS.Venta);
  const typeName = Object.entries(PROPERTY_TYPE_IDS).find(([, id]) =>
    filters.property_types?.includes(id)
  )?.[0];
  if (isAlq) return typeName ? `Alquilar · ${typeName}` : 'Alquilar';
  if (isVen) return typeName ? `Comprar · ${typeName}` : 'Comprar';
  return 'Explorá propiedades';
}

// ── Chip button reutilizable ─────────────────────────────────
function Chip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={[
        'px-3.5 py-2 rounded-xl text-sm font-medium transition-all active:scale-[0.97] border whitespace-nowrap',
        active
          ? 'bg-[#0041CE] text-white border-[#0041CE]'
          : 'bg-gray-50 dark:bg-[#21262d] text-gray-700 dark:text-gray-300 border-gray-100 dark:border-[#30363d] hover:border-[#0041CE] dark:hover:border-[#0061FB]',
      ].join(' ')}
    >
      {label}
    </button>
  );
}

// ── Sección con título ───────────────────────────────────────
function FilterSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider px-0.5">
        {title}
      </p>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

// ── Componente principal ─────────────────────────────────────
export default function SmartFilter({ filters, onFilterChange, resultCount }: SmartFilterProps) {
  const [isOpen,    setIsOpen]    = useState(false);
  const [operation, setOperation] = useState<OperationId | null>(null);
  const [category,  setCategory]  = useState<CategoryId | null>(null);
  const [typeId,    setTypeId]    = useState<number | null>(null);
  const [condition, setCondition] = useState<string | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const activeLabel = getActiveLabel(filters);
  const hasFilters  = !!(filters.operation_types?.length || filters.property_types?.length);

  // Sincronizar estado local con filtros externos (al limpiar)
  useEffect(() => {
    if (!filters.operation_types?.length && !filters.property_types?.length) {
      setOperation(null); setCategory(null); setTypeId(null); setCondition(null);
    }
  }, [filters]);

  // Cerrar al clickar fuera
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setIsOpen(false);
    }
    if (isOpen) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isOpen]);

  // ── Selección de operación ────────────────────────────────
  function selectOperation(op: OperationId) {
    setOperation(op);
    setCategory(null);
    setTypeId(null);
    setCondition(null);
    // Aplicar filtro base inmediatamente
    onFilterChange({
      operation_types: [op === 'comprar' ? OPERATION_TYPE_IDS.Venta : OPERATION_TYPE_IDS.Alquiler],
    });
  }

  // ── Selección de categoría ────────────────────────────────
  function selectCategory(cat: CategoryId) {
    setCategory(cat);
    setTypeId(null);
    setCondition(null);
    if (!operation) return;
    // Si la categoría solo tiene un tipo, lo aplicamos directamente
    const cats = CATEGORIES[operation];
    const found = cats.find((c) => c.id === cat);
    if (found && found.types.length === 1) {
      applyFilters(operation, found.types[0].id, null);
      setTypeId(found.types[0].id);
    } else {
      onFilterChange({
        operation_types: [operation === 'comprar' ? OPERATION_TYPE_IDS.Venta : OPERATION_TYPE_IDS.Alquiler],
      });
    }
  }

  // ── Selección de tipo específico ──────────────────────────
  function selectType(id: number) {
    setTypeId(id);
    setCondition(null);
    applyFilters(operation!, id, null);
  }

  // ── Selección de condición ────────────────────────────────
  function selectCondition(val: string) {
    const next = condition === val ? null : val;
    setCondition(next);
    applyFilters(operation!, typeId, next);
  }

  function applyFilters(op: OperationId | null, tid: number | null, cond: string | null) {
    if (!op) return;
    const f: PropertyFilters = {
      operation_types: [op === 'comprar' ? OPERATION_TYPE_IDS.Venta : OPERATION_TYPE_IDS.Alquiler],
    };
    if (tid) f.property_types = [tid];
    if (cond) f.development_status = cond;
    onFilterChange(f);
  }

  function clearAll() {
    setOperation(null); setCategory(null); setTypeId(null); setCondition(null);
    onFilterChange({});
    setIsOpen(false);
  }

  // ── Categoría activa ──────────────────────────────────────
  const activeCats = operation ? CATEGORIES[operation] : [];
  const activeCat  = activeCats.find((c) => c.id === category);

  // Paso actual para el header del panel
  const stepLabel = !operation
    ? '¿Qué querés hacer?'
    : !category
    ? '¿Qué tipo de propiedad?'
    : activeCat && activeCat.types.length > 1 && !typeId
    ? `${activeCat.emoji} ${activeCat.label}`
    : '¿Algún detalle más?';

  // ── Render ────────────────────────────────────────────────
  return (
    <>
      <div
        ref={panelRef}
        className="fixed top-[66px] left-1/2 -translate-x-1/2 z-[200] w-full max-w-sm px-4 flex flex-col items-center gap-2"
      >
        {/* Pill */}
        <button
          onClick={() => setIsOpen((o) => !o)}
          className={[
            'flex items-center gap-2.5 pl-4 pr-3 py-2.5 rounded-full shadow-lg',
            'text-sm font-semibold transition-all duration-200 active:scale-[0.97] select-none ring-1',
            hasFilters
              ? 'bg-[#0041CE] text-white ring-[#0041CE] shadow-[#0041CE]/20'
              : 'bg-white dark:bg-[#161b22] text-gray-800 dark:text-gray-100 ring-gray-200 dark:ring-[#30363d] hover:ring-gray-400 dark:hover:ring-[#0061FB]',
          ].join(' ')}
        >
          <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 01-.659 1.591l-5.432 5.432a2.25 2.25 0 00-.659 1.591v2.927a2.25 2.25 0 01-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 00-.659-1.591L3.659 7.409A2.25 2.25 0 013 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0112 3z" />
          </svg>
          <span className="truncate max-w-[190px]">{activeLabel}</span>
          {hasFilters && (
            <span className="text-[11px] font-bold bg-white/20 px-1.5 py-0.5 rounded-full shrink-0">
              {resultCount}
            </span>
          )}
          <svg
            className={`w-4 h-4 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* Panel */}
        <div
          className={[
            'w-full bg-white dark:bg-[#161b22] rounded-2xl shadow-2xl',
            'border border-gray-100 dark:border-[#30363d] overflow-hidden',
            'transition-all duration-300 ease-out origin-top',
            isOpen
              ? 'opacity-100 scale-y-100 translate-y-0'
              : 'opacity-0 scale-y-95 -translate-y-2 pointer-events-none',
          ].join(' ')}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-gray-100 dark:border-[#21262d]">
            <p className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
              {stepLabel}
            </p>
            {operation && (
              <button
                onClick={() => {
                  if (typeId)      { setTypeId(null); setCondition(null); applyFilters(operation, null, null); }
                  else if (category) { setCategory(null); setTypeId(null); setCondition(null); applyFilters(operation, null, null); }
                  else              { setOperation(null); onFilterChange({}); }
                }}
                className="text-[12px] text-gray-400 dark:text-gray-500 hover:text-gray-800 dark:hover:text-gray-100 transition flex items-center gap-1"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                </svg>
                Volver
              </button>
            )}
          </div>

          <div className="p-4 space-y-4">
            {/* ── Paso 1: Comprar / Alquilar ─────────────── */}
            {!operation && (
              <div className="grid grid-cols-2 gap-3">
                {([
                  { id: 'comprar'  as OperationId, label: 'Comprar',  emoji: '🔑', desc: 'Propiedades en venta' },
                  { id: 'alquilar' as OperationId, label: 'Alquilar', emoji: '🏠', desc: 'Propiedades en alquiler' },
                ] as const).map((op) => (
                  <button
                    key={op.id}
                    onClick={() => selectOperation(op.id)}
                    className="flex flex-col items-start gap-2 p-4 rounded-xl border border-gray-100 dark:border-[#21262d] hover:border-[#0041CE] dark:hover:border-[#0061FB] hover:bg-blue-50/60 dark:hover:bg-blue-900/10 transition-all active:scale-[0.97] text-left"
                  >
                    <span className="text-2xl">{op.emoji}</span>
                    <div>
                      <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{op.label}</p>
                      <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">{op.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* ── Paso 2: Categorías ─────────────────────── */}
            {operation && !category && (
              <FilterSection title="Categoría">
                {activeCats.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => selectCategory(cat.id)}
                    className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium border border-gray-100 dark:border-[#30363d] bg-gray-50 dark:bg-[#21262d] text-gray-700 dark:text-gray-300 hover:border-[#0041CE] dark:hover:border-[#0061FB] hover:bg-blue-50/60 dark:hover:bg-blue-900/10 transition-all active:scale-[0.97]"
                  >
                    <span>{cat.emoji}</span>
                    {cat.label}
                  </button>
                ))}
              </FilterSection>
            )}

            {/* ── Paso 3: Tipo específico ────────────────── */}
            {operation && category && activeCat && activeCat.types.length > 1 && !typeId && (
              <FilterSection title="Tipo">
                {activeCat.types.map((t) => (
                  <Chip key={t.id} label={t.label} active={typeId === t.id} onClick={() => selectType(t.id)} />
                ))}
              </FilterSection>
            )}

            {/* ── Paso 4: Condición (si la categoría la tiene) */}
            {operation && category && activeCat?.conditions && (typeId || activeCat.types.length === 1) && (
              <FilterSection title={activeCat.id === 'emprendimiento' ? 'Estado del proyecto' : 'Condición'}>
                {activeCat.conditions.map((c) => (
                  <Chip
                    key={c.value}
                    label={c.label}
                    active={condition === c.value}
                    onClick={() => selectCondition(c.value)}
                  />
                ))}
              </FilterSection>
            )}

            {/* Indicador de breadcrumb cuando hay filtros activos */}
            {operation && (
              <div className="flex items-center gap-1.5 text-[11px] text-gray-400 dark:text-gray-500 flex-wrap">
                <span
                  className="cursor-pointer hover:text-[#0041CE] transition font-medium"
                  onClick={() => { setOperation(null); setCategory(null); setTypeId(null); setCondition(null); onFilterChange({}); }}
                >
                  {operation === 'comprar' ? 'Comprar' : 'Alquilar'}
                </span>
                {category && (
                  <>
                    <span>›</span>
                    <span
                      className="cursor-pointer hover:text-[#0041CE] transition font-medium"
                      onClick={() => { setCategory(null); setTypeId(null); setCondition(null); applyFilters(operation, null, null); }}
                    >
                      {activeCat?.label}
                    </span>
                  </>
                )}
                {typeId && activeCat && (
                  <>
                    <span>›</span>
                    <span className="font-medium text-gray-600 dark:text-gray-300">
                      {activeCat.types.find((t) => t.id === typeId)?.label}
                    </span>
                  </>
                )}
                {condition && activeCat?.conditions && (
                  <>
                    <span>›</span>
                    <span className="font-medium text-[#0041CE] dark:text-[#0061FB]">
                      {activeCat.conditions.find((c) => c.value === condition)?.label}
                    </span>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          {hasFilters && (
            <div className="flex gap-2 px-4 pb-4 pt-2 border-t border-gray-100 dark:border-[#21262d]">
              <button
                onClick={clearAll}
                className="flex-1 py-2.5 text-sm font-medium text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-[#30363d] rounded-xl hover:bg-gray-50 dark:hover:bg-[#21262d] transition active:scale-[0.98]"
              >
                Limpiar
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="flex-[2] py-2.5 text-sm font-semibold bg-[#0041CE] hover:bg-[#0034a8] text-white rounded-xl transition active:scale-[0.98] flex items-center justify-center gap-2"
              >
                Ver propiedades
                {resultCount > 0 && (
                  <span className="bg-white/20 text-xs font-bold px-2 py-0.5 rounded-full">
                    {resultCount}
                  </span>
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Backdrop mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 z-[199] md:hidden bg-black/10 dark:bg-black/30"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}
