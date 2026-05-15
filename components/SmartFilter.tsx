'use client';
// ============================================================
// components/SmartFilter.tsx
// Filtro en cascada:
//   Paso 1: Comprar / Alquilar
//   Paso 2: Tipo directo (Departamentos, Casas, Cocheras…)
//   Paso 3: Sub-filtro específico (solo donde aplica)
// ============================================================
import { useState, useEffect, useRef, useCallback } from 'react';
import { PropertyFilters, PROPERTY_TYPE_IDS, OPERATION_TYPE_IDS } from '@/lib/tokko';

interface SmartFilterProps {
  filters: PropertyFilters;
  onFilterChange: (filters: PropertyFilters) => void;
  resultCount: number;
}

type OperationId = 'comprar' | 'alquilar';

interface SubFilter {
  label: string;
  filter: Partial<PropertyFilters>;
}

interface PropertyTypeOption {
  id: string;
  label: string;
  emoji: string;
  typeIds: number[];
  subFilters?: SubFilter[];
}

const PROPERTY_TYPES: PropertyTypeOption[] = [
  {
    id: 'departamentos', label: 'Departamentos', emoji: '🏢',
    typeIds: [PROPERTY_TYPE_IDS.Departamento],
    subFilters: [
      { label: 'Monoambiente',  filter: { rooms: 1 } },
      { label: '1 Dormitorio',  filter: { rooms: 2 } },
      { label: '2 Dormitorios', filter: { rooms: 3 } },
      { label: '3 Dorm. o más', filter: { rooms_min: 4 } },
    ],
  },
  {
    id: 'casas', label: 'Casas', emoji: '🏠',
    typeIds: [PROPERTY_TYPE_IDS.Casa],
    subFilters: [
      { label: 'Todas',   filter: {} },
      { label: 'Pasillo', filter: { sub_type: 'pasillo' } },
    ],
  },
  { id: 'cocheras', label: 'Cocheras', emoji: '🚗', typeIds: [PROPERTY_TYPE_IDS.Cochera] },
  {
    id: 'terrenos', label: 'Terrenos', emoji: '📐',
    typeIds: [PROPERTY_TYPE_IDS.Lote, PROPERTY_TYPE_IDS['Barrio Cerrado']],
    subFilters: [
      { label: 'Barrio Abierto',  filter: { property_types: [PROPERTY_TYPE_IDS.Lote] } },
      { label: 'Barrio Cerrado',  filter: { property_types: [PROPERTY_TYPE_IDS['Barrio Cerrado']] } },
    ],
  },
  {
    id: 'emprendimientos', label: 'Emprendimientos', emoji: '🏗',
    typeIds: [PROPERTY_TYPE_IDS.Emprendimiento],
    subFilters: [
      { label: 'Loteos',    filter: { sub_type: 'loteo' } },
      { label: 'Edificios', filter: { sub_type: 'edificio' } },
    ],
  },
  { id: 'locales', label: 'Locales', emoji: '🏪', typeIds: [PROPERTY_TYPE_IDS.Local] },
  { id: 'campos', label: 'Campos', emoji: '🌾', typeIds: [PROPERTY_TYPE_IDS.Campo] },
  { id: 'depositos', label: 'Depósitos / Naves', emoji: '🏭', typeIds: [PROPERTY_TYPE_IDS['Depósito']] },
  { id: 'oficinas', label: 'Oficinas', emoji: '💼', typeIds: [PROPERTY_TYPE_IDS.Oficina] },
];

// ── Helpers (fuera del componente — sin closures) ────────────
function _getOpFilter(op: OperationId): number[] {
  return [op === 'comprar' ? OPERATION_TYPE_IDS.Venta : OPERATION_TYPE_IDS.Alquiler];
}

function _buildFilters(op: OperationId, typeOpt: PropertyTypeOption, subFilter?: Partial<PropertyFilters>): PropertyFilters {
  const f: PropertyFilters = { operation_types: _getOpFilter(op) };
  if (subFilter?.property_types) {
    f.property_types = subFilter.property_types;
  } else {
    f.property_types = typeOpt.typeIds;
  }
  if (subFilter) {
    if (subFilter.rooms) f.rooms = subFilter.rooms;
    if (subFilter.rooms_min) f.rooms_min = subFilter.rooms_min;
    if (subFilter.sub_type) f.sub_type = subFilter.sub_type;
  }
  return f;
}

// ── Pill label ───────────────────────────────────────────────
function getActiveLabel(filters: PropertyFilters): string {
  const isAlq = filters.operation_types?.includes(OPERATION_TYPE_IDS.Alquiler);
  const isVen = filters.operation_types?.includes(OPERATION_TYPE_IDS.Venta);
  const activeType = PROPERTY_TYPES.find((pt) =>
    filters.property_types?.length && pt.typeIds.some((id) => filters.property_types!.includes(id))
  );
  let subLabel = '';
  if (activeType?.subFilters) {
    if (filters.rooms) {
      const s = activeType.subFilters.find((sf) => sf.filter.rooms === filters.rooms);
      if (s) subLabel = ` · ${s.label}`;
    } else if (filters.rooms_min) {
      const s = activeType.subFilters.find((sf) => sf.filter.rooms_min === filters.rooms_min);
      if (s) subLabel = ` · ${s.label}`;
    } else if (filters.sub_type) {
      const s = activeType.subFilters.find((sf) => sf.filter.sub_type === filters.sub_type);
      if (s) subLabel = ` · ${s.label}`;
    } else if (filters.property_types?.length === 1) {
      const s = activeType.subFilters.find(
        (sf) => sf.filter.property_types?.length === 1 && sf.filter.property_types[0] === filters.property_types![0]
      );
      if (s) subLabel = ` · ${s.label}`;
    }
  }
  const tn = activeType?.label ?? '';
  if (isAlq) return tn ? `Alquilar · ${tn}${subLabel}` : 'Alquilar';
  if (isVen) return tn ? `Comprar · ${tn}${subLabel}` : 'Comprar';
  return 'Explorá propiedades';
}

// ── Componente principal ─────────────────────────────────────
export default function SmartFilter({ filters, onFilterChange, resultCount }: SmartFilterProps) {
  const [isOpen,       setIsOpen]       = useState(false);
  const [operation,    setOperation]    = useState<OperationId | null>(null);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [subFilterIdx, setSubFilterIdx] = useState<number | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // ── REFS para popstate handler (evita closures stale) ─────
  const isOpenRef    = useRef(false);
  const opRef        = useRef<OperationId | null>(null);
  const typeRef      = useRef<string | null>(null);
  const subRef       = useRef<number | null>(null);
  const fcRef        = useRef(onFilterChange);
  const sfHistCount  = useRef(0); // cuántas entries nuestras hay en el history stack

  useEffect(() => { isOpenRef.current = isOpen; }, [isOpen]);
  useEffect(() => { opRef.current = operation; }, [operation]);
  useEffect(() => { typeRef.current = selectedType; }, [selectedType]);
  useEffect(() => { subRef.current = subFilterIdx; }, [subFilterIdx]);
  useEffect(() => { fcRef.current = onFilterChange; }, [onFilterChange]);

  const activeLabel = getActiveLabel(filters);
  const hasFilters  = !!(filters.operation_types?.length || filters.property_types?.length);

  // Sincronizar estado local con filtros externos
  useEffect(() => {
    if (!filters.operation_types?.length && !filters.property_types?.length) {
      setOperation(null); setSelectedType(null); setSubFilterIdx(null);
    }
  }, [filters]);

  // ── Acciones ──────────────────────────────────────────────
  function selectOperation(op: OperationId) {
    setOperation(op);
    setSelectedType(null);
    setSubFilterIdx(null);
    onFilterChange({ operation_types: _getOpFilter(op) });
    sfHistCount.current++;
    history.pushState({ type: 'sf' }, '');
  }

  function selectType(typeId: string) {
    const typeOpt = PROPERTY_TYPES.find((t) => t.id === typeId);
    if (!typeOpt || !operation) return;
    setSelectedType(typeId);
    setSubFilterIdx(null);
    onFilterChange(_buildFilters(operation, typeOpt));
    sfHistCount.current++;
    history.pushState({ type: 'sf' }, '');
  }

  function selectSubFilter(idx: number) {
    const typeOpt = PROPERTY_TYPES.find((t) => t.id === selectedType);
    if (!typeOpt?.subFilters || !operation) return;
    setSubFilterIdx(idx);
    onFilterChange(_buildFilters(operation, typeOpt, typeOpt.subFilters[idx].filter));
    sfHistCount.current++;
    history.pushState({ type: 'sf' }, '');
  }

  function openPanel() {
    setIsOpen(true);
    sfHistCount.current++;
    history.pushState({ type: 'sf' }, '');
  }

  function closePanel() {
    setIsOpen(false);
  }

  function clearAll() {
    setOperation(null); setSelectedType(null); setSubFilterIdx(null);
    onFilterChange({});
    setIsOpen(false);
    // Limpiar todas nuestras entries del historial
    if (sfHistCount.current > 0) {
      const n = sfHistCount.current;
      sfHistCount.current = 0;
      history.go(-n);
    }
  }

  // ── Popstate handler (UNA sola instancia, lee refs) ───────
  useEffect(() => {
    function handler() {
      // Ignorar si otro componente ya consumió este evento
      if ((window as any).__popConsumed) {
        (window as any).__popConsumed = false;
        return;
      }
      // Si no tenemos entries, no nos incumbe
      if (sfHistCount.current <= 0) return;
      sfHistCount.current--;

      const curSub  = subRef.current;
      const curType = typeRef.current;
      const curOp   = opRef.current;
      const wasOpen = isOpenRef.current;
      const fc      = fcRef.current;

      if (curSub !== null) {
        // Paso 3 → Paso 2 (quitar sub-filtro, mostrar lista de sub-filtros)
        setSubFilterIdx(null);
        const typeOpt = PROPERTY_TYPES.find(t => t.id === curType);
        if (curOp && typeOpt) fc(_buildFilters(curOp, typeOpt));
        if (!wasOpen) setIsOpen(true);
      } else if (curType !== null) {
        // Paso 2 → Paso 1 (quitar tipo, mostrar grid de tipos)
        setSelectedType(null);
        setSubFilterIdx(null);
        if (curOp) fc({ operation_types: _getOpFilter(curOp) });
        if (!wasOpen) setIsOpen(true);
      } else if (curOp !== null) {
        // Paso 1 → Inicio (quitar operación)
        setOperation(null);
        fc({});
        if (!wasOpen) setIsOpen(true);
      } else if (wasOpen) {
        // Panel abierto sin filtros → cerrar
        setIsOpen(false);
      }
    }
    window.addEventListener('popstate', handler);
    return () => window.removeEventListener('popstate', handler);
  }, []); // Empty deps! Lee todo de refs

  // Cerrar al clickar fuera
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setIsOpen(false);
    }
    if (isOpen) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isOpen]);

  // ── Info del tipo activo ──────────────────────────────────
  const activeTypeOpt = PROPERTY_TYPES.find((t) => t.id === selectedType);
  const hasSubFilters = activeTypeOpt?.subFilters && activeTypeOpt.subFilters.length > 0;

  const stepLabel = !operation
    ? '¿Qué querés hacer?'
    : !selectedType
    ? '¿Qué tipo de propiedad?'
    : hasSubFilters && subFilterIdx === null
    ? `${activeTypeOpt!.emoji} ${activeTypeOpt!.label}`
    : 'Filtro aplicado';

  // UI "Volver" button — simplemente hace history.back()
  function goBack() {
    if (sfHistCount.current > 0) history.back();
  }

  // ── Render ────────────────────────────────────────────────
  return (
    <>
      <div
        ref={panelRef}
        className="fixed top-[66px] left-1/2 -translate-x-1/2 z-[200] w-full max-w-sm px-4 flex flex-col items-center gap-2 pointer-events-none"
      >
        {/* Pill */}
        <button
          onClick={() => { if (isOpen) closePanel(); else openPanel(); }}
          className={[
            'flex items-center gap-2.5 pl-4 pr-3 py-2.5 rounded-full shadow-lg pointer-events-auto',
            'text-sm font-semibold transition-all duration-200 active:scale-[0.97] select-none ring-1',
            hasFilters
              ? 'bg-[#0041CE] text-white ring-[#0041CE] shadow-[#0041CE]/20'
              : 'bg-white dark:bg-[#161b22] text-gray-800 dark:text-gray-100 ring-gray-200 dark:ring-[#30363d] hover:ring-gray-400 dark:hover:ring-[#0061FB]',
          ].join(' ')}
        >
          <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 01-.659 1.591l-5.432 5.432a2.25 2.25 0 00-.659 1.591v2.927a2.25 2.25 0 01-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 00-.659-1.591L3.659 7.409A2.25 2.25 0 013 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0112 3z" />
          </svg>
          <span className="truncate max-w-[220px]">{activeLabel}</span>
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
              ? 'opacity-100 scale-y-100 translate-y-0 pointer-events-auto'
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
                onClick={goBack}
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
            {/* Paso 1: Comprar / Alquilar */}
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

            {/* Paso 2: Tipos de propiedad */}
            {operation && !selectedType && (
              <div className="grid grid-cols-3 gap-2">
                {PROPERTY_TYPES.map((pt) => (
                  <button
                    key={pt.id}
                    onClick={() => selectType(pt.id)}
                    className="flex flex-col items-center gap-1.5 p-3 rounded-xl border border-gray-100 dark:border-[#30363d] bg-gray-50/50 dark:bg-[#21262d]/50 text-center hover:border-[#0041CE] dark:hover:border-[#0061FB] hover:bg-blue-50/60 dark:hover:bg-blue-900/10 transition-all active:scale-[0.97]"
                  >
                    <span className="text-xl">{pt.emoji}</span>
                    <span className="text-[11px] font-semibold text-gray-700 dark:text-gray-300 leading-tight">{pt.label}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Paso 3: Sub-filtros */}
            {operation && selectedType && hasSubFilters && (
              <div className="space-y-2">
                <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider px-0.5">
                  Filtrar por
                </p>
                <div className="flex flex-wrap gap-2">
                  {activeTypeOpt!.subFilters!.map((sf, idx) => (
                    <button
                      key={idx}
                      onClick={() => selectSubFilter(idx)}
                      className={[
                        'px-3.5 py-2 rounded-xl text-sm font-medium transition-all active:scale-[0.97] border whitespace-nowrap',
                        subFilterIdx === idx
                          ? 'bg-[#0041CE] text-white border-[#0041CE]'
                          : 'bg-gray-50 dark:bg-[#21262d] text-gray-700 dark:text-gray-300 border-gray-100 dark:border-[#30363d] hover:border-[#0041CE] dark:hover:border-[#0061FB]',
                      ].join(' ')}
                    >
                      {sf.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Breadcrumb */}
            {operation && (
              <div className="flex items-center gap-1.5 text-[11px] text-gray-400 dark:text-gray-500 flex-wrap">
                <span className="cursor-pointer hover:text-[#0041CE] transition font-medium" onClick={goBack}>
                  {operation === 'comprar' ? 'Comprar' : 'Alquilar'}
                </span>
                {selectedType && activeTypeOpt && (
                  <>
                    <span>›</span>
                    <span className="cursor-pointer hover:text-[#0041CE] transition font-medium" onClick={goBack}>
                      {activeTypeOpt.label}
                    </span>
                  </>
                )}
                {subFilterIdx !== null && activeTypeOpt?.subFilters && (
                  <>
                    <span>›</span>
                    <span className="font-medium text-gray-600 dark:text-gray-300">
                      {activeTypeOpt.subFilters[subFilterIdx].label}
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
                onClick={closePanel}
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
          onClick={closePanel}
        />
      )}
    </>
  );
}
