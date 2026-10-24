// Tests de la lib : zone.js comme dans les apps (fakeAsync, détection des changements par zone).
// La cible de build de la lib (ng-packagr) n’a pas de polyfills : on les charge ici.
import 'zone.js';
import 'zone.js/testing';

// Comme Jasmine : les spies sont restaurés après chaque test.
afterEach(() => {
  vi.restoreAllMocks();
});
