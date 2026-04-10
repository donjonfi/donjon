import { LocationStrategy } from '@angular/common';
import { Injectable } from '@angular/core';

/**
 * Stratégie de navigation sans manipulation de l'historique navigateur.
 * Utilisée pour le build standalone (file://) où pushState/replaceState
 * sont bloqués par les navigateurs (origine null).
 */
@Injectable()
export class NoopLocationStrategy extends LocationStrategy {
  private _popStateHandlers: (() => void)[] = [];

  path(_includeHash?: boolean): string { return ''; }
  prepareExternalUrl(internal: string): string { return internal; }
  pushState(_state: any, _title: string, _url: string, _queryParams: string): void {}
  replaceState(_state: any, _title: string, _url: string, _queryParams: string): void {}
  forward(): void {}
  back(): void {}
  historyGo(_relativePosition?: number): void {}
  onPopState(fn: () => void): void { this._popStateHandlers.push(fn); }
  getBaseHref(): string { return ''; }
}
