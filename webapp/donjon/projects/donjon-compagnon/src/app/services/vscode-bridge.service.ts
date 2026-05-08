import { Injectable, NgZone } from '@angular/core';
import { Subject, Observable } from 'rxjs';

interface VsCodeApi {
  postMessage(msg: any): void;
  getState(): any;
  setState(state: any): void;
}

export interface LineMapEntry {
  ligneFinale: number;
  ligneOrigine: number;
  nomFichier: string;
}

declare global {
  interface Window {
    __vscodeApi__?: VsCodeApi;
    __djnScenario__?: string;
    __djnActions__?: string;
    __djnLineMap__?: LineMapEntry[];
    __djnExtensionVersion__?: string;
  }
}

@Injectable({ providedIn: 'root' })
export class VsCodeBridgeService {
  private readonly _api: VsCodeApi | null;
  private readonly _messages = new Subject<any>();

  constructor(private zone: NgZone) {
    this._api = (window as any).__vscodeApi__ ?? null;

    window.addEventListener('message', (event) => {
      this.zone.run(() => this._messages.next(event.data));
    });
  }

  get isInVsCode(): boolean {
    return this._api !== null;
  }

  postMessage(msg: any): void {
    if (this._api) {
      this._api.postMessage(msg);
    } else {
      console.debug('[VsCodeBridge] postMessage (no host):', msg);
    }
  }

  onMessage(): Observable<any> {
    return this._messages.asObservable();
  }
}
