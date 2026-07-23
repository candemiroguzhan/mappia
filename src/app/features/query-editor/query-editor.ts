import { Component, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import type { editor } from 'monaco-editor';
import { MonacoEditorModule } from 'ngx-monaco-editor-v2';
import { IconComponent } from '../../shared/icon/icon.component';
import { TranslatePipe } from '../../shared/translate.pipe';

@Component({
  selector: 'app-query-editor',
  standalone: true,
  imports: [FormsModule, IconComponent, MonacoEditorModule, TranslatePipe],
  templateUrl: './query-editor.html',
  styleUrl: './query-editor.scss'
})
export class QueryEditorComponent {
  readonly sql = input.required<string>();
  readonly busy = input(false);
  readonly history = input<string[]>([]);
  readonly sqlChange = output<string>();
  readonly run = output<void>();

  protected readonly editorOptions: editor.IStandaloneEditorConstructionOptions = {
    language: 'sql',
    theme: 'vs-dark',
    automaticLayout: true,
    minimap: { enabled: false },
    fontSize: 13,
    lineNumbersMinChars: 3,
    scrollBeyondLastLine: false,
    wordWrap: 'on'
  };

  protected onHistoryChange(event: Event): void {
    const select = event.target as HTMLSelectElement | null;
    if (select?.value) {
      this.sqlChange.emit(select.value);
    }
  }

  protected onEditorInit(editor: { addCommand: (keybinding: number, handler: () => void) => void }): void {
    const monacoApi = (globalThis as typeof globalThis & { monaco?: { KeyMod: { CtrlCmd: number }; KeyCode: { Enter: number } } }).monaco;
    if (!monacoApi) {
      return;
    }

    editor.addCommand(monacoApi.KeyMod.CtrlCmd | monacoApi.KeyCode.Enter, () => this.run.emit());
  }
}
