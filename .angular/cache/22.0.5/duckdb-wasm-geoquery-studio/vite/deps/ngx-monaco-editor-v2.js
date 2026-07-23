import {
  NG_VALUE_ACCESSOR
} from "./chunk-33PYFODP.js";
import {
  CommonModule
} from "./chunk-63IHVQOV.js";
import {
  ChangeDetectionStrategy,
  Component,
  InjectionToken,
  Input,
  NgModule,
  NgZone,
  Output,
  ViewChild,
  effect,
  forwardRef,
  fromEvent,
  inject,
  input,
  makeEnvironmentProviders,
  output,
  setClassMetadata,
  viewChild,
  ɵɵInheritDefinitionFeature,
  ɵɵProvidersFeature,
  ɵɵdefineComponent,
  ɵɵdefineInjector,
  ɵɵdefineNgModule,
  ɵɵdomElement,
  ɵɵqueryAdvance,
  ɵɵviewQuerySignal
} from "./chunk-HIDBO2PB.js";
import "./chunk-C46DD3QN.js";
import {
  __spreadValues
} from "./chunk-KWSTWQNB.js";

// node_modules/ngx-monaco-editor-v2/fesm2022/ngx-monaco-editor-v2.mjs
var _c0 = ["editorContainer"];
var _c1 = "[_nghost-%COMP%]{display:block;height:200px}.editor-container[_ngcontent-%COMP%]{width:100%;height:98%}";
var NGX_MONACO_EDITOR_CONFIG = new InjectionToken("NGX_MONACO_EDITOR_CONFIG");
var loadedMonaco = false;
var loadPromise;
var BaseEditor = class _BaseEditor {
  constructor() {
    this.config = inject(NGX_MONACO_EDITOR_CONFIG);
    this.insideNg = input(
      false,
      ...ngDevMode ? [{
        debugName: "insideNg"
      }] : (
        /* istanbul ignore next */
        []
      )
    );
    this.onInit = output();
    this.editorContainer = viewChild.required("editorContainer");
    this._models = [];
    this._listeners = [];
    effect(() => {
      this.insideNg();
      if (this._editor) {
        this.reinit();
      }
    });
  }
  ngAfterViewInit() {
    if (loadedMonaco) {
      loadPromise.then(() => {
        this.initMonaco();
      });
    } else {
      loadedMonaco = true;
      loadPromise = new Promise((resolve) => {
        let baseUrl = this.config.baseUrl;
        if (baseUrl === "assets" || !baseUrl) {
          baseUrl = "./assets/monaco/min/vs";
        }
        if (typeof window.monaco === "object") {
          this.initMonaco();
          resolve();
          return;
        }
        const onGotAmdLoader = (require2) => {
          let usedRequire = require2 || window.require;
          let requireConfig = {
            paths: {
              vs: `${baseUrl}`
            }
          };
          Object.assign(requireConfig, this.config.requireConfig || {});
          usedRequire.config(requireConfig);
          usedRequire([`vs/editor/editor.main`], () => {
            if (typeof this.config.onMonacoLoad === "function") {
              this.config.onMonacoLoad();
            }
            this.initMonaco();
            resolve();
          });
        };
        if (this.config.monacoRequire) {
          onGotAmdLoader(this.config.monacoRequire);
        } else if (!window.require) {
          const loaderScript = document.createElement("script");
          loaderScript.type = "text/javascript";
          loaderScript.src = `${baseUrl}/loader.js`;
          loaderScript.addEventListener("load", () => {
            onGotAmdLoader();
          });
          document.body.appendChild(loaderScript);
        } else if (!window.require.config) {
          var src = `${baseUrl}/loader.js`;
          var loaderRequest = new XMLHttpRequest();
          loaderRequest.addEventListener("load", () => {
            let scriptElem = document.createElement("script");
            scriptElem.type = "text/javascript";
            scriptElem.text = [
              // Monaco uses a custom amd loader that over-rides node's require.
              // Keep a reference to node's require so we can restore it after executing the amd loader file.
              "var nodeRequire = require;",
              loaderRequest.responseText.replace('"use strict";', ""),
              // Save Monaco's amd require and restore Node's require
              "var monacoAmdRequire = require;",
              "require = nodeRequire;",
              "require.nodeRequire = require;"
            ].join("\n");
            document.body.appendChild(scriptElem);
            onGotAmdLoader(window.monacoAmdRequire);
          });
          loaderRequest.open("GET", src);
          loaderRequest.send();
        } else {
          onGotAmdLoader();
        }
      });
    }
  }
  /** Tear down the current editor and create a fresh one. */
  reinit() {
    this.disposeEditor();
    this.initMonaco();
  }
  /** Dispose the editor and every resource it owns (listeners, models, subscriptions). */
  disposeEditor() {
    this._windowResizeSubscription?.unsubscribe();
    this._windowResizeSubscription = void 0;
    this._listeners.forEach((listener) => listener.dispose());
    this._listeners = [];
    this._editor?.dispose();
    this._editor = void 0;
    this._models.forEach((model) => model.dispose());
    this._models = [];
  }
  ngOnDestroy() {
    this.disposeEditor();
  }
  static {
    this.ɵfac = function BaseEditor_Factory(__ngFactoryType__) {
      return new (__ngFactoryType__ || _BaseEditor)();
    };
  }
  static {
    this.ɵcmp = ɵɵdefineComponent({
      type: _BaseEditor,
      selectors: [["ng-component"]],
      viewQuery: function BaseEditor_Query(rf, ctx) {
        if (rf & 1) {
          ɵɵviewQuerySignal(ctx.editorContainer, _c0, 5);
        }
        if (rf & 2) {
          ɵɵqueryAdvance();
        }
      },
      inputs: {
        insideNg: [1, "insideNg"]
      },
      outputs: {
        onInit: "onInit"
      },
      standalone: false,
      decls: 0,
      vars: 0,
      template: function BaseEditor_Template(rf, ctx) {
      },
      encapsulation: 2,
      changeDetection: 1
    });
  }
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(BaseEditor, [{
    type: Component,
    args: [{
      template: "",
      changeDetection: ChangeDetectionStrategy.Eager,
      standalone: false
    }]
  }], () => [], {
    insideNg: [{
      type: Input,
      args: [{
        isSignal: true,
        alias: "insideNg",
        required: false
      }]
    }],
    onInit: [{
      type: Output,
      args: ["onInit"]
    }],
    editorContainer: [{
      type: ViewChild,
      args: ["editorContainer", {
        isSignal: true
      }]
    }]
  });
})();
var EditorComponent = class _EditorComponent extends BaseEditor {
  constructor() {
    super();
    this.zone = inject(NgZone);
    this._value = "";
    this._disabled = false;
    this.options = input(
      {},
      ...ngDevMode ? [{
        debugName: "options"
      }] : (
        /* istanbul ignore next */
        []
      )
    );
    this.model = input(
      ...ngDevMode ? [void 0, {
        debugName: "model"
      }] : (
        /* istanbul ignore next */
        []
      )
    );
    this.propagateChange = (_) => {
    };
    this.onTouched = () => {
    };
    effect(() => {
      this.options();
      this.model();
      if (this._editor) {
        this.reinit();
      }
    });
  }
  writeValue(value) {
    this._value = value || "";
    setTimeout(() => {
      if (this._editor && !this.model()) {
        this._editor.setValue(this._value);
      }
    });
  }
  registerOnChange(fn) {
    this.propagateChange = fn;
  }
  registerOnTouched(fn) {
    this.onTouched = fn;
  }
  setDisabledState(isDisabled) {
    this._disabled = isDisabled;
    this._editor?.updateOptions({
      readOnly: isDisabled || !!this.options().readOnly
    });
  }
  /** Change the global monaco theme (e.g. `'vs-dark'`). */
  setTheme(themeName) {
    monaco.editor.setTheme(themeName);
  }
  initMonaco() {
    const options = __spreadValues(__spreadValues({}, this.config.defaultOptions), this.options());
    if (this._disabled) {
      options.readOnly = true;
    }
    const modelInput = this.model();
    if (modelInput) {
      const existing = modelInput.uri ? monaco.editor.getModel(modelInput.uri) : null;
      if (existing) {
        existing.setValue(this._value);
        options.model = existing;
      } else {
        const created = monaco.editor.createModel(modelInput.value, modelInput.language, modelInput.uri);
        this._models.push(created);
        options.model = created;
      }
    }
    const container = this.editorContainer().nativeElement;
    if (this.insideNg()) {
      this._editor = monaco.editor.create(container, options);
    } else {
      this.zone.runOutsideAngular(() => {
        this._editor = monaco.editor.create(container, options);
      });
    }
    if (!options.model) {
      this._editor.setValue(this._value);
    }
    this._listeners.push(this._editor.onDidChangeModelContent(() => {
      const value = this._editor.getValue();
      this.zone.run(() => {
        this.propagateChange(value);
        this._value = value;
      });
    }));
    this._listeners.push(this._editor.onDidBlurEditorWidget(() => {
      this.onTouched();
    }));
    this._windowResizeSubscription = fromEvent(window, "resize").subscribe(() => this._editor.layout());
    this.onInit.emit(this._editor);
  }
  static {
    this.ɵfac = function EditorComponent_Factory(__ngFactoryType__) {
      return new (__ngFactoryType__ || _EditorComponent)();
    };
  }
  static {
    this.ɵcmp = ɵɵdefineComponent({
      type: _EditorComponent,
      selectors: [["ngx-monaco-editor"]],
      inputs: {
        options: [1, "options"],
        model: [1, "model"]
      },
      features: [ɵɵProvidersFeature([{
        provide: NG_VALUE_ACCESSOR,
        useExisting: forwardRef(() => _EditorComponent),
        multi: true
      }]), ɵɵInheritDefinitionFeature],
      decls: 2,
      vars: 0,
      consts: [["editorContainer", ""], [1, "editor-container"]],
      template: function EditorComponent_Template(rf, ctx) {
        if (rf & 1) {
          ɵɵdomElement(0, "div", 1, 0);
        }
      },
      styles: ["[_nghost-%COMP%]{display:block;height:200px}.editor-container[_ngcontent-%COMP%]{width:100%;height:98%}"]
    });
  }
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(EditorComponent, [{
    type: Component,
    args: [{
      standalone: true,
      selector: "ngx-monaco-editor",
      template: '<div class="editor-container" #editorContainer></div>',
      changeDetection: ChangeDetectionStrategy.OnPush,
      providers: [{
        provide: NG_VALUE_ACCESSOR,
        useExisting: forwardRef(() => EditorComponent),
        multi: true
      }],
      styles: [":host{display:block;height:200px}.editor-container{width:100%;height:98%}\n"]
    }]
  }], () => [], {
    options: [{
      type: Input,
      args: [{
        isSignal: true,
        alias: "options",
        required: false
      }]
    }],
    model: [{
      type: Input,
      args: [{
        isSignal: true,
        alias: "model",
        required: false
      }]
    }]
  });
})();
var DiffEditorComponent = class _DiffEditorComponent extends BaseEditor {
  constructor() {
    super();
    this.zone = inject(NgZone);
    this.options = input(
      {},
      ...ngDevMode ? [{
        debugName: "options"
      }] : (
        /* istanbul ignore next */
        []
      )
    );
    this.originalModel = input(
      ...ngDevMode ? [void 0, {
        debugName: "originalModel"
      }] : (
        /* istanbul ignore next */
        []
      )
    );
    this.modifiedModel = input(
      ...ngDevMode ? [void 0, {
        debugName: "modifiedModel"
      }] : (
        /* istanbul ignore next */
        []
      )
    );
    effect(() => {
      this.options();
      this.originalModel();
      this.modifiedModel();
      if (this._editor) {
        this.reinit();
      }
    });
  }
  initMonaco() {
    const original = this.originalModel();
    const modified = this.modifiedModel();
    if (!original || !modified) {
      throw new Error("originalModel or modifiedModel not found for ngx-monaco-diff-editor");
    }
    const options = __spreadValues(__spreadValues({}, this.config.defaultOptions), this.options());
    const originalModel = monaco.editor.createModel(original.code, original.language || options.language);
    const modifiedModel = monaco.editor.createModel(modified.code, modified.language || options.language);
    this._models.push(originalModel, modifiedModel);
    const container = this.editorContainer().nativeElement;
    container.innerHTML = "";
    if (this.insideNg()) {
      this._editor = monaco.editor.createDiffEditor(container, options);
    } else {
      this.zone.runOutsideAngular(() => {
        this._editor = monaco.editor.createDiffEditor(container, options);
      });
    }
    this._editor.setModel({
      original: originalModel,
      modified: modifiedModel
    });
    this._windowResizeSubscription = fromEvent(window, "resize").subscribe(() => this._editor.layout());
    this.onInit.emit(this._editor);
  }
  static {
    this.ɵfac = function DiffEditorComponent_Factory(__ngFactoryType__) {
      return new (__ngFactoryType__ || _DiffEditorComponent)();
    };
  }
  static {
    this.ɵcmp = ɵɵdefineComponent({
      type: _DiffEditorComponent,
      selectors: [["ngx-monaco-diff-editor"]],
      inputs: {
        options: [1, "options"],
        originalModel: [1, "originalModel"],
        modifiedModel: [1, "modifiedModel"]
      },
      features: [ɵɵInheritDefinitionFeature],
      decls: 2,
      vars: 0,
      consts: [["editorContainer", ""], [1, "editor-container"]],
      template: function DiffEditorComponent_Template(rf, ctx) {
        if (rf & 1) {
          ɵɵdomElement(0, "div", 1, 0);
        }
      },
      styles: [_c1]
    });
  }
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(DiffEditorComponent, [{
    type: Component,
    args: [{
      standalone: true,
      selector: "ngx-monaco-diff-editor",
      template: '<div class="editor-container" #editorContainer></div>',
      changeDetection: ChangeDetectionStrategy.OnPush,
      styles: [":host{display:block;height:200px}.editor-container{width:100%;height:98%}\n"]
    }]
  }], () => [], {
    options: [{
      type: Input,
      args: [{
        isSignal: true,
        alias: "options",
        required: false
      }]
    }],
    originalModel: [{
      type: Input,
      args: [{
        isSignal: true,
        alias: "originalModel",
        required: false
      }]
    }],
    modifiedModel: [{
      type: Input,
      args: [{
        isSignal: true,
        alias: "modifiedModel",
        required: false
      }]
    }]
  });
})();
var MonacoEditorModule = class _MonacoEditorModule {
  static forRoot(config = {}) {
    return {
      ngModule: _MonacoEditorModule,
      providers: [{
        provide: NGX_MONACO_EDITOR_CONFIG,
        useValue: config
      }]
    };
  }
  static {
    this.ɵfac = function MonacoEditorModule_Factory(__ngFactoryType__) {
      return new (__ngFactoryType__ || _MonacoEditorModule)();
    };
  }
  static {
    this.ɵmod = ɵɵdefineNgModule({
      type: _MonacoEditorModule,
      imports: [CommonModule, EditorComponent, DiffEditorComponent],
      exports: [EditorComponent, DiffEditorComponent]
    });
  }
  static {
    this.ɵinj = ɵɵdefineInjector({
      imports: [CommonModule]
    });
  }
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(MonacoEditorModule, [{
    type: NgModule,
    args: [{
      imports: [CommonModule, EditorComponent, DiffEditorComponent],
      exports: [EditorComponent, DiffEditorComponent]
    }]
  }], null, null);
})();
function provideMonacoEditor(config = {}) {
  return makeEnvironmentProviders([{
    provide: NGX_MONACO_EDITOR_CONFIG,
    useValue: config
  }]);
}
export {
  DiffEditorComponent,
  EditorComponent,
  MonacoEditorModule,
  NGX_MONACO_EDITOR_CONFIG,
  provideMonacoEditor
};
//# sourceMappingURL=ngx-monaco-editor-v2.js.map
