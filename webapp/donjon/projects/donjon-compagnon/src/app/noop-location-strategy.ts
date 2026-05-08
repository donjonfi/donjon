import { LocationChangeListener, LocationStrategy } from '@angular/common';
import { Injectable } from '@angular/core';

@Injectable()
export class NoopLocationStrategy extends LocationStrategy {
  override path(_includeHash?: boolean): string { return ''; }
  override prepareExternalUrl(internal: string): string { return internal; }
  override getState(): unknown { return null; }
  override pushState(_state: any, _title: string, _url: string, _queryParams: string): void {}
  override replaceState(_state: any, _title: string, _url: string, _queryParams: string): void {}
  override forward(): void {}
  override back(): void {}
  override historyGo(_relativePosition?: number): void {}
  override onPopState(_fn: LocationChangeListener): void {}
  override getBaseHref(): string { return ''; }
}
