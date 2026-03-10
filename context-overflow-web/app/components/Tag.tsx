export default function Tag({ name }: { name: string }) {
  return (
    <span className="inline-block rounded-md bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-400 transition hover:bg-amber-500/20">
      {name}
    </span>
  );
}
