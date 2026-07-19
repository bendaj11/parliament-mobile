export function HostLayout() {
  return (
    <>
      <div data-atlas-host-status />
      <header>
        <strong>Atlas</strong>
        <div data-atlas-slot="header" />
      </header>
      <nav data-atlas-navigation aria-label="Application" />
      <main data-atlas-route-outlet />
    </>
  );
}
