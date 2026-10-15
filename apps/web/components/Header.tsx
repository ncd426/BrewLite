export function Header() {
  return (
    <header className="mb-6 flex items-center justify-between border-b border-amber-100 p-4">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-amber-700">BrewLite</p>
        <h1 className="text-2xl font-bold">Coffee ordering</h1>
      </div>
      <nav className="flex gap-4 text-sm">
        <a href="/">Menu</a>
        <a href="/cart">Cart</a>
        <a href="/login">Login</a>
      </nav>
    </header>
  );
}
