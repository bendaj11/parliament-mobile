import { Component } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';

@Component({
  selector: 'atlas-login-root',
  standalone: true,
  imports: [RouterLink, RouterOutlet],
  template: `
    <section>
      <h1>Login</h1>
      <nav>
        <a routerLink="/">Home</a>
        <a routerLink="details/42">Details</a>
      </nav>
      <router-outlet />
    </section>
  `,
})
export class AppComponent {}
