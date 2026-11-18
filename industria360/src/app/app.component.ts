import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ToastContainerComponent } from './shared/components';
import { ConfiguracaoService } from './core/services';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, ToastContainerComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent {
  // Instancia a configuração na inicialização para aplicar o tema salvo
  private readonly config = inject(ConfiguracaoService);
}
