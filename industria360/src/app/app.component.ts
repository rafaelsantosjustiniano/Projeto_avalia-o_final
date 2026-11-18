import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { IconComponent, ToastContainerComponent } from './shared/components';
import { ApiService, ConfiguracaoService } from './core/services';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, ToastContainerComponent, IconComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent {
  readonly api = inject(ApiService);
  // Instancia a configuração na inicialização para aplicar o tema salvo
  private readonly config = inject(ConfiguracaoService);

  recarregar() {
    window.location.reload();
  }
}
