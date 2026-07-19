import { Link, Outlet } from 'react-router-dom';
import '../styles.css';

export function App() {
  return (
    <section>
      <h1>Rmap</h1>
      <nav>
        <Link to="/">Home</Link>
        <Link to="details/42">Details</Link>
      </nav>
      <Outlet />
    </section>
  );
}
