import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZoneChangeDetection } from '@angular/core';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideMonacoEditor } from 'ngx-monaco-editor-v2';
import { provideMappiaLucideIcons } from './shared/icon/lucide-icons';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideAnimations(),
    provideMappiaLucideIcons(),
    provideMonacoEditor({
      baseUrl: 'assets/monaco/min/vs',
      defaultOptions: {
        theme: 'vs-dark',
        automaticLayout: true,
        minimap: { enabled: false },
        fontSize: 13,
        scrollBeyondLastLine: false
      }
    })
  ]
};
