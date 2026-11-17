export default function TablaSeries({ series, unidad }) {
  return (
    <table className="w-full text-left font-mono text-sm">
      <thead>
        <tr className="text-[11px] uppercase tracking-wider text-neutral-400">
          <th scope="col" className="w-8 pb-1 font-bold">#</th>
          <th scope="col" className="pb-1 font-bold">{unidad}</th>
          <th scope="col" className="pb-1 font-bold">Reps</th>
          <th scope="col" className="pb-1 font-bold">RIR</th>
          <th scope="col" className="pb-1 font-bold">1RM est.</th>
          <th scope="col" className="w-8 pb-1"><span className="sr-only">Efectiva</span></th>
        </tr>
      </thead>
      <tbody>
        {series.map((s) => (
          <tr key={s.id} className={s.esCalentamiento ? 'text-neutral-500' : ''}>
            <td className="py-1.5">{s.esCalentamiento ? 'C' : s.numero}</td>
            <td className="py-1.5">{s.peso}</td>
            <td className="py-1.5">{s.reps}</td>
            <td className="py-1.5">{s.rir ?? '—'}</td>
            <td className="py-1.5 text-neutral-400">{s.esCalentamiento ? '—' : s.e1rm}</td>
            <td className="py-1.5">
              {s.esEfectiva && (
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primario text-sobre-primario">
                  <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor"
                       strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M5 12l5 5 9-10" />
                  </svg>
                  <span className="sr-only">Serie efectiva</span>
                </span>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}