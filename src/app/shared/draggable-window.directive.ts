import { DOCUMENT } from '@angular/common';
import { Directive, ElementRef, HostBinding, HostListener, inject, input, signal } from '@angular/core';

interface DragPosition {
  x: number;
  y: number;
}

@Directive({
  selector: '[appDraggableWindow]',
  standalone: true
})
export class DraggableWindowDirective {
  private readonly elementRef = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly document = inject(DOCUMENT);
  private readonly position = signal<DragPosition | null>(null);

  readonly dragBounds = input({ top: 96, bottom: 64, margin: 16 });

  private dragging = false;
  private startPointer: DragPosition = { x: 0, y: 0 };
  private startPosition: DragPosition = { x: 0, y: 0 };

  @HostBinding('style.left.px')
  protected get left(): number | null {
    return this.position()?.x ?? null;
  }

  @HostBinding('style.position')
  protected get positionStyle(): string | null {
    return this.position() ? 'fixed' : null;
  }

  @HostBinding('style.top.px')
  protected get top(): number | null {
    return this.position()?.y ?? null;
  }

  @HostBinding('style.right')
  protected get right(): string | null {
    return this.position() ? 'auto' : null;
  }

  @HostBinding('style.bottom')
  protected get bottom(): string | null {
    return this.position() ? 'auto' : null;
  }

  @HostBinding('style.transform')
  protected get transform(): string | null {
    return this.position() ? 'none' : null;
  }

  @HostListener('pointerdown', ['$event'])
  protected onPointerDown(event: PointerEvent): void {
    if (event.button !== 0 || this.isInteractiveTarget(event.target)) {
      return;
    }

    const element = this.elementRef.nativeElement;
    const rect = element.getBoundingClientRect();
    this.dragging = true;
    this.startPointer = { x: event.clientX, y: event.clientY };
    this.startPosition = { x: rect.left, y: rect.top };
    this.position.set(this.clamp(rect.left, rect.top));
    element.setPointerCapture(event.pointerId);
  }

  @HostListener('pointermove', ['$event'])
  protected onPointerMove(event: PointerEvent): void {
    if (!this.dragging) {
      return;
    }

    event.preventDefault();
    const nextX = this.startPosition.x + event.clientX - this.startPointer.x;
    const nextY = this.startPosition.y + event.clientY - this.startPointer.y;
    this.position.set(this.clamp(nextX, nextY));
  }

  @HostListener('pointerup', ['$event'])
  @HostListener('pointercancel', ['$event'])
  protected onPointerEnd(event: PointerEvent): void {
    if (!this.dragging) {
      return;
    }

    this.dragging = false;
    this.elementRef.nativeElement.releasePointerCapture(event.pointerId);
  }

  @HostListener('window:resize')
  protected onResize(): void {
    const current = this.position();
    if (current) {
      this.position.set(this.clamp(current.x, current.y));
    }
  }

  private clamp(x: number, y: number): DragPosition {
    const element = this.elementRef.nativeElement;
    const rect = element.getBoundingClientRect();
    const bounds = this.dragBounds();
    const viewportWidth = this.document.defaultView?.innerWidth ?? rect.right;
    const viewportHeight = this.document.defaultView?.innerHeight ?? rect.bottom;
    const maxX = Math.max(bounds.margin, viewportWidth - rect.width - bounds.margin);
    const maxY = Math.max(bounds.top, viewportHeight - rect.height - bounds.bottom);

    return {
      x: Math.min(Math.max(x, bounds.margin), maxX),
      y: Math.min(Math.max(y, bounds.top), maxY)
    };
  }

  private isInteractiveTarget(target: EventTarget | null): boolean {
    return target instanceof HTMLElement && Boolean(target.closest('button, input, textarea, select, label, a, ngx-monaco-editor'));
  }
}
