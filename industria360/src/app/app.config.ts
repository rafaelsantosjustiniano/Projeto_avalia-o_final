import { APP_INITIALIZER, ApplicationConfig, inject, LOCALE_ID, provideZoneChangeDetection } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter, withComponentInputBinding, withHashLocation, withInMemoryScrolling } from '@angular/router';
import { registerLocaleData } from '@angular/common';
import localePt from '@angular/common/locales/pt';
import { routes } from './app.routes';
import { ApiService } from './core/services/api.service';

registerLocaleData(localePt);

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    // Hash location: permite publicar em qualquer servidor estático sem regras de rewrite
    provideRouter(routes, withComponentInputBinding(), withHashLocation(), withInMemoryScrolling({ scrollPositionRestoration: 'top' })),
    provideHttpClient(),
    // Carrega todos os dados do banco (via API) antes de abrir o site
    {
      provide: APP_INITIALIZER,
      multi: true,
      useFactory: () => {
        const api = inject(ApiService);
        return () => api.carregar();
      },
    },
    { provide: LOCALE_ID, useValue: 'pt-BR' },
  ],
};
