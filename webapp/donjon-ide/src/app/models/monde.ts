import { ElementGenerique } from './element-generique';
import { Salle } from './salle';

export class Monde {

    salles: Salle[] = [];
    decors: ElementGenerique[] = [];
    contenants: ElementGenerique[] = [];
    portes: ElementGenerique[] = [];
    cles: ElementGenerique[] = [];
    animaux: ElementGenerique[] = [];
    objets: ElementGenerique[] = [];
    aucuns: ElementGenerique[] = [];

}