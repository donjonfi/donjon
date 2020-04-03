import { Auditeur } from '../models/jouer/auditeur';

export class Declancheur {

    auditeurs: Auditeur[];

    definirAuditeurs(auditeurs: Auditeur[]) {
        this.auditeurs = auditeurs;
        
    }
    
}