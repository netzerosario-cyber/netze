'use client';
// ============================================================
// components/FilterBar.tsx
// Al seleccionar "Emprendimiento" → aparecen sub-filtros de estado
// ============================================================
import { useEffect } from 'react';
import { PropertyFilters, PROPERTY_TYPE_IDS, OPERATION_TYPE_IDS, DEVELOPMENT_STATUS_IDS } from '@/lib/tokko';

interface FilterBarProps {
  filters: PropertyFilters;
  onFilterChange: (filters: PropertyFilters) => void;
}

const PROP_TYPES = Object.entries(PROPERTY_TYPE_IDS).map(([label, id]) => ({ label, id }));
const OP_TYPES   = [
  { label: 'Venta',    id: OPERATION_TYPE_IDS.Venta },
  { label: 'Alquiler', id: OPERATION_TYPE_IDS.Alquiler },
];
const DEV_STATUS = Object.entries(DEVELOPMENT_STATUS_IDS).map(([label, value]) => ({ label, value }));

const EMPRENDIMIENTO_ID = PROPERTY_TYPE_IDS.Emprendimiento;

export default function FilterBar({ filters, onFilterChange }: FilterBarProps) {
  const activePropertyTypes = filters.property_types ?? [];
  const isEmprendimientoActive = activePropertyTypes.includes(EMPRENDIMIENTO_ID);

  // Si se desactiva Emprendimiento, limpiar development_status automáticamente
  useEffect(() => {
    if (!isEmprendimientoActive && filters.development_status) {
      onFilterChange({ ...filters, development_status: undefined });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEmprendimientoActive]);

  function togglePropertyType(id: number) {
    const cur = filters.property_types ?? [];
    const next = cur.includes(id) ? [] : [id];
    const update: PropertyFilters = { ...filters, property_types: next };
    // Si salimos de Emprendimiento, limpiar estado de desarrollo
    if (id === EMPRENDIMIENTO_ID && cur.includes(id)) {
      update.development_status = undefined;
    }
    onFilterChange(update);
  }

  function toggleOperationType(id: number) {
    const cur = filters.operation_types ?? [];
    onFilterChange({ ...filters, operation_types: cur.includes(id) ? [] : [id] });
  }

  function toggleDevStatus(value: string) {
    onFilterChange({
      ...filters,
      development_status: filters.development_status === value ? undefined : value,
    });
  }

  function clearAll() { onFilterChange({}); }

  const hasActiveFilters =
    activePropertyTypes.length > 0 ||
    (filters.operation_types ?? []).length > 0 ||
    !!filters.development_status;

  // ── Chip ────────────────────────────────────────────────
  function Chip({ label, active, onClick, accent = false }: {
    label: string; active: boolean; onClick: () => void; accent?: boolean;
  }) {
    return (
      <button
        onClick={onClick}
        className={`shrink-0 px-3.5 py-1.5 text-[13px] font-medium rounded-full border transition-all whitespace-nowrap select-none active:scale-95 ${
          active
            ? accent
              ? 'bg-rose-600 text-white border-rose-600'
              : 'bg-gray-900 text-white border-gray-900'
            : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400 hover:text-gray-900'
        }`}
      >
        {label}
      </button>
    );
  }

  return (
    <div className="shrink-0 bg-white border-b border-gray-100 shadow-sm">
      {/* ── Fila 1: Tipo de propiedad + Operación ─────── */}
      <div
        className="flex items-center gap-2 px-4 py-2.5 overflow-x-auto"
        style={{ scrollbarWidth: 'none' }}
      >
        <span className="shrink-0 text-[11px] font-semibold text-gray-400 uppercase tracking-widest pr-1">
          Tipo
        </span>

        {PROP_TYPES.map(({ label, id }) => (
          <Chip
            key={id}
            label={label}
            active={activePropertyTypes.includes(id)}
            onClick={() => togglePropertyType(id)}
            accent={id === EMPRENDIMIENTO_ID && isEmprendimientoActive}
          />
        ))}

        <span className="shrink-0 w-px h-5 bg-gray-200 mx-1" />
        <span className="shrink-0 text-[11px] font-semibold text-gray-400 uppercase tracking-widest pr-1">
          Op.
        </span>

        {OP_TYPES.map(({ label, id }) => (
          <Chip
            key={id}
            label={label}
            active={(filters.operation_types ?? []).includes(id)}
            onClick={() => toggleOperationType(id)}
          />
        ))}

        {hasActiveFilters && (
          <>
            <span className="shrink-0 w-px h-5 bg-gray-200 mx-1" />
            <button
              onClick={clearAll}
              className="shrink-0 flex items-center gap-1 px-3 py-1.5 text-[13px] font-medium text-rose-500 border border-rose-200 rounded-full hover:bg-rose-50 transition active:scale-95"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
              Limpiar
            </button>
          </>
        )}
      </div>

      {/* ── Fila 2: Sub-filtros de Emprendimiento ─────── */}
      {/* Aparece con animación solo cuando Emprendimiento está activo */}
      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          isEmprendimientoActive ? 'max-h-16 opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div
          className="flex items-center gap-2 px-4 pb-2.5 overflow-x-auto border-t border-gray-100 pt-2"
          style={{ scrollbarWidth: 'none' }}
        >
          <span className="shrink-0 text-[11px] font-semibold text-rose-500 uppercase tracking-widest pr-1 flex items-center gap-1">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Estado
          </span>
          {DEV_STATUS.map(({ label, value }) => (
            <button
              key={value}
              onClick={() => toggleDevStatus(value)}
              className={`shrink-0 px-3.5 py-1.5 text-[13px] font-medium rounded-full border transition-all whitespace-nowrap select-none active:scale-95 ${
                filters.development_status === value
                  ? 'bg-rose-600 text-white border-rose-600'
                  : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
