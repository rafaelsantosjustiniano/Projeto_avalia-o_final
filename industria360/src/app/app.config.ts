import { ApplicationConfig, LOCALE_ID, provideZoneChangeDetection } from '@angular/core';
import { provideRouter, withComponentInputBinding, withHashLocation, withInMemoryScrolling } from '@angular/router';
import { registerLocaleData } from '@angular/common';
import localePt from '@angular/common/locales/pt';
import { routes } from './app.routes';

registerLocaleData(localePt);

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    // Hash location: permite publicar em qualquer servidor estático sem regras de rewrite
    provideRouter(routes, withComponentInputBinding(), withHashLocation(), withInMemoryScrolling({ scrollPositionRestoration: 'top' })),
    { provide: LOCALE_ID, useValue: 'pt-BR' },
  ],
};
