export class Conjugaison {

  public static getVerbe(verbe: string): Map<string, string> {
    switch (verbe) {
      case "être":
      case "s’être":
      case "s'être":
        return Conjugaison.etre;

      case "avoir":
        return Conjugaison.avoir;

      case "ouvrir":
      case "s’ouvrir":
      case "s'ouvrir":
        return Conjugaison.ouvrir;

      case "fermer":
      case "se fermer":
        return Conjugaison.fermer;

      case "vivre":
        return Conjugaison.vivre;

      default:
        return null;
    }
  }

  private static etre = new Map<string, string>([
    // INDICATIF
    // - PRÉSENT
    // -- singulier
    ['ipr 3ps', 'est'],
    // -- pluriel
    ['ipr 3pp', 'sont'],
    // - PASSÉ COMPOSÉ
    // -- singulier
    ['ipac 3ps', 'a été'],
    // -- pluriel
    ['ipac 3pp', 'ont été'],
    // - IMPARFAIT
    // -- singulier
    ['iimp 3ps', 'était'],
    // -- pluriel
    ['iimp 3pp', 'étaient'],
    // - PLUS-QUE-PARFAIT
    // -- singulier
    ['ipqp 3ps', 'avait été'],
    // -- pluriel
    ['ipqp 3pp', 'avaient été'],
    // - PASSÉ SIMPLE
    // -- singulier
    ['ipas 3ps', 'fut'],
    // -- pluriel
    ['ipas 3pp', 'furent'],
    // - PASSÉ ANTÉRIEUR
    // -- singulier
    ['ipaa 3ps', 'eut été'],
    // -- pluriel
    ['ipaa 3pp', 'eurent été'],

    // - FUTUR SIMPLE
    // -- singulier
    ['ifus 3ps', 'sera'],
    // -- pluriel
    ['ifus 3pp', 'seront'],
    // - PASSÉ ANTÉRIEUR
    // -- singulier
    ['ifua 3ps', 'aura été'],
    // -- pluriel
    ['ifua 3pp', 'auront été'],

    // CONDITIONNEL
    // - PRÉSENT
    // -- singulier
    ['cpr 3ps', 'serait'],
    // -- pluriel
    ['cpr 3pp', 'seraient'],
    // - PASSÉ
    // -- singulier
    ['cpa 3ps', 'aurait été'],
    // -- pluriel
    ['cpa 3pp', 'auraient été'],

    // SUBJONCTIF
    // - PRÉSENT
    // -- singulier
    ['spr 3ps', 'soit'],
    // -- pluriel
    ['spr 3pp', 'soient'],
    // - PASSÉ
    // -- singulier
    ['spa 3ps', 'ait été'],
    // -- pluriel
    ['spa 3pp', 'aient été'],
    // - IMPARFAIT
    // -- singulier
    ['simp 3ps', 'fût'],
    // -- pluriel
    ['simp 3pp', 'fussent'],
    // - PLUS-QUE-PARFAIT
    // -- singulier
    ['spqp 3ps', 'eût été'],
    // -- pluriel
    ['spqp 3pp', 'eussent été'],
  ]);

  private static avoir = new Map<string, string>([
    // INDICATIF
    // - PRÉSENT
    // -- singulier
    ['ipr 3ps', 'a'],
    // -- pluriel
    ['ipr 3pp', 'ont'],
    // - PASSÉ COMPOSÉ
    // -- singulier
    ['ipac 3ps', 'a eu'],
    // -- pluriel
    ['ipac 3pp', 'ont eu'],
    // - IMPARFAIT
    // -- singulier
    ['iimp 3ps', 'avait'],
    // -- pluriel
    ['iimp 3pp', 'avaient'],
    // - PLUS-QUE-PARFAIT
    // -- singulier
    ['ipqp 3ps', 'avait eu'],
    // -- pluriel
    ['ipqp 3pp', 'avaient eu'],
    // - PASSÉ SIMPLE
    // -- singulier
    ['ipas 3ps', 'eut'],
    // -- pluriel
    ['ipas 3pp', 'eurent'],
    // - PASSÉ ANTÉRIEUR
    // -- singulier
    ['ipaa 3ps', 'eut eu'],
    // -- pluriel
    ['ipaa 3pp', 'eurent eu'],
    // - FUTUR SIMPLE
    // -- singulier
    ['ifus 3ps', 'aura'],
    // -- pluriel
    ['ifus 3pp', 'auront'],
    // - PASSÉ ANTÉRIEUR
    // -- singulier
    ['ifua 3ps', 'aura eu'],
    // -- pluriel
    ['ifua 3pp', 'auront eu'],

    // CONDITIONNEL
    // - PRÉSENT
    // -- singulier
    ['cpr 3ps', 'aurait'],
    // -- pluriel
    ['cpr 3pp', 'auraient'],
    // - PASSÉ
    // -- singulier
    ['cpa 3ps', 'aurait eu'],
    // -- pluriel
    ['cpa 3pp', 'auraient eu'],

    // SUBJONCTIF
    // - PRÉSENT
    // -- singulier
    ['spr 3ps', 'ait'],
    // -- pluriel
    ['spr 3pp', 'aient'],
    // - PASSÉ
    // -- singulier
    ['spa 3ps', 'ait eu'],
    // -- pluriel
    ['spa 3pp', 'aient eu'],
    // - IMPARFAIT
    // -- singulier
    ['simp 3ps', 'eût'],
    // -- pluriel
    ['simp 3pp', 'eussent'],
    // - PLUS-QUE-PARFAIT
    // -- singulier
    ['spqp 3ps', 'eût eu'],
    // -- pluriel
    ['spqp 3pp', 'eussent eu'],
  ]);

  private static vivre = new Map<string, string>([
    // INDICATIF
    // - PRÉSENT
    // -- singulier
    ['ipr 3ps', 'vit'],
    // -- pluriel
    ['ipr 3pp', 'vivent'],
    // - PASSÉ COMPOSÉ
    // -- singulier
    ['ipac 3ps', 'a vécu'],
    // -- pluriel
    ['ipac 3pp', 'ont vécu'],
    // - IMPARFAIT
    // -- singulier
    ['iimp 3ps', 'vivait'],
    // -- pluriel
    ['iimp 3pp', 'vivaient'],
    // - PLUS-QUE-PARFAIT
    // -- singulier
    ['ipqp 3ps', 'avait vécu'],
    // -- pluriel
    ['ipqp 3pp', 'avaient vécu'],
    // - PASSÉ SIMPLE
    // -- singulier
    ['ipas 3ps', 'vécut'],
    // -- pluriel
    ['ipas 3pp', 'vécurent'],
    // - PASSÉ ANTÉRIEUR
    // -- singulier
    ['ipaa 3ps', 'eut vécu'],
    // -- pluriel
    ['ipaa 3pp', 'eurent vécu'],
    // - FUTUR SIMPLE
    // -- singulier
    ['ifus 3ps', 'vivra'],
    // -- pluriel
    ['ifus 3pp', 'vivront'],
    // - PASSÉ ANTÉRIEUR
    // -- singulier
    ['ifua 3ps', 'aura vécu'],
    // -- pluriel
    ['ifua 3pp', 'auront vécu'],

    // CONDITIONNEL
    // - PRÉSENT
    // -- singulier
    ['cpr 3ps', 'vivrait'],
    // -- pluriel
    ['cpr 3pp', 'vivraient'],
    // - PASSÉ
    // -- singulier
    ['cpa 3ps', 'aurait eu'],
    // -- pluriel
    ['cpa 3pp', 'auraient eu'],

    // SUBJONCTIF
    // - PRÉSENT
    // -- singulier
    ['spr 3ps', 'vive'],
    // -- pluriel
    ['spr 3pp', 'vivent'],
    // - PASSÉ
    // -- singulier
    ['spa 3ps', 'ait vécu'],
    // -- pluriel
    ['spa 3pp', 'aient vécu'],
    // - IMPARFAIT
    // -- singulier
    ['simp 3ps', 'vécût'],
    // -- pluriel
    ['simp 3pp', 'vécussent'],
    // - PLUS-QUE-PARFAIT
    // -- singulier
    ['spqp 3ps', 'eût vécu'],
    // -- pluriel
    ['spqp 3pp', 'eussent vécu'],
  ]);

  private static ouvrir = new Map<string, string>([
    // INDICATIF
    // - PRÉSENT
    // -- singulier
    ['ipr 3ps', 'ouvre'],
    // -- pluriel
    ['ipr 3pp', 'ouvrent'],
    // - PASSÉ COMPOSÉ
    // -- singulier
    ['ipac 3ps', 'a ouvert'],
    // -- pluriel
    ['ipac 3pp', 'ont ouvert'],
    // - IMPARFAIT
    // -- singulier
    ['iimp 3ps', 'ouvrait'],
    // -- pluriel
    ['iimp 3pp', 'ouvraient'],
    // - PLUS-QUE-PARFAIT
    // -- singulier
    ['ipqp 3ps', 'avait ouvert'],
    // -- pluriel
    ['ipqp 3pp', 'avaient ouvert'],
    // - PASSÉ SIMPLE
    // -- singulier
    ['ipas 3ps', 'ouvrit'],
    // -- pluriel
    ['ipas 3pp', 'ouvrirent'],
    // - PASSÉ ANTÉRIEUR
    // -- singulier
    ['ipaa 3ps', 'eut ouvert'],
    // -- pluriel
    ['ipaa 3pp', 'eurent ouvert'],
    // - FUTUR SIMPLE
    // -- singulier
    ['ifus 3ps', 'ouvrira'],
    // -- pluriel
    ['ifus 3pp', 'ouvriront'],
    // - PASSÉ ANTÉRIEUR
    // -- singulier
    ['ifua 3ps', 'aura ouvert'],
    // -- pluriel
    ['ifua 3pp', 'auront ouvert'],

    // CONDITIONNEL
    // - PRÉSENT
    // -- singulier
    ['cpr 3ps', 'ouvrirait'],
    // -- pluriel
    ['cpr 3pp', 'ouvriraient'],
    // - PASSÉ
    // -- singulier
    ['cpa 3ps', 'aurait eu'],
    // -- pluriel
    ['cpa 3pp', 'auraient eu'],

    // SUBJONCTIF
    // - PRÉSENT
    // -- singulier
    ['spr 3ps', 'ouvre'],
    // -- pluriel
    ['spr 3pp', 'ouvrent'],
    // - PASSÉ
    // -- singulier
    ['spa 3ps', 'ait ouvert'],
    // -- pluriel
    ['spa 3pp', 'aient ouvert'],
    // - IMPARFAIT
    // -- singulier
    ['simp 3ps', 'ouvrît'],
    // -- pluriel
    ['simp 3pp', 'ouvrissent'],
    // - PLUS-QUE-PARFAIT
    // -- singulier
    ['spqp 3ps', 'eût ouvert'],
    // -- pluriel
    ['spqp 3pp', 'eussent ouvert'],
  ]);

  private static fermer = new Map<string, string>([
    // INDICATIF
    // - PRÉSENT
    // -- singulier
    ['ipr 3ps', 'ferme'],
    // -- pluriel
    ['ipr 3pp', 'ferment'],
    // - PASSÉ COMPOSÉ
    // -- singulier
    ['ipac 3ps', 'a ouvert'],
    // -- pluriel
    ['ipac 3pp', 'ont ouvert'],
    // - IMPARFAIT
    // -- singulier
    ['iimp 3ps', 'fermait'],
    // -- pluriel
    ['iimp 3pp', 'fermaient'],
    // - PLUS-QUE-PARFAIT
    // -- singulier
    ['ipqp 3ps', 'avait ouvert'],
    // -- pluriel
    ['ipqp 3pp', 'avaient ouvert'],
    // - PASSÉ SIMPLE
    // -- singulier
    ['ipas 3ps', 'ferma'],
    // -- pluriel
    ['ipas 3pp', 'fermèrent'],
    // - PASSÉ ANTÉRIEUR
    // -- singulier
    ['ipaa 3ps', 'eut ouvert'],
    // -- pluriel
    ['ipaa 3pp', 'eurent ouvert'],
    // - FUTUR SIMPLE
    // -- singulier
    ['ifus 3ps', 'fermera'],
    // -- pluriel
    ['ifus 3pp', 'fermeront'],
    // - PASSÉ ANTÉRIEUR
    // -- singulier
    ['ifua 3ps', 'aura ouvert'],
    // -- pluriel
    ['ifua 3pp', 'auront ouvert'],

    // CONDITIONNEL
    // - PRÉSENT
    // -- singulier
    ['cpr 3ps', 'fermerait'],
    // -- pluriel
    ['cpr 3pp', 'fermeraient'],
    // - PASSÉ
    // -- singulier
    ['cpa 3ps', 'aurait eu'],
    // -- pluriel
    ['cpa 3pp', 'auraient eu'],

    // SUBJONCTIF
    // - PRÉSENT
    // -- singulier
    ['spr 3ps', 'ferme'],
    // -- pluriel
    ['spr 3pp', 'ferment'],
    // - PASSÉ
    // -- singulier
    ['spa 3ps', 'ait ouvert'],
    // -- pluriel
    ['spa 3pp', 'aient ouvert'],
    // - IMPARFAIT
    // -- singulier
    ['simp 3ps', 'fermât'],
    // -- pluriel
    ['simp 3pp', 'fermassent'],
    // - PLUS-QUE-PARFAIT
    // -- singulier
    ['spqp 3ps', 'eût ouvert'],
    // -- pluriel
    ['spqp 3pp', 'eussent ouvert'],
  ]);

}
