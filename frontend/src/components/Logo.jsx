export default function Logo({ claro = true, subtitulo = 'Estacionamiento inteligente' }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-electrico text-lg font-extrabold text-white">P</span>
      <div className="leading-tight">
        <p className={`text-lg font-bold ${claro ? 'text-white' : 'text-tinta'}`}>SmartPark</p>
        <p className={`text-[10px] font-semibold uppercase tracking-wider ${claro ? 'text-blue-200' : 'text-slate-500'}`}>{subtitulo}</p>
      </div>
    </div>
  );
}
