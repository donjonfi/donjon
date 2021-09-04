export class Conjugaison {

  public static getVerbeIrregulier(verbe: string): Map<string, string> {
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

      case "pouvoir":
        return Conjugaison.pouvoir;

      default:
        return null;
    }
  }

  private static auxEtre = new Map<string, string>([
    // INDICATIF
    // - PASSÉ COMPOSÉ
    // -- singulier
    ['ipac 3ps', 'est'],
    // -- pluriel
    ['ipac 3pp', 'sont'],
    // - PLUS-QUE-PARFAIT
    // -- singulier
    ['ipqp 3ps', 'était'],
    // -- pluriel
    ['ipqp 3pp', 'étaient'],
    // - PASSÉ ANTÉRIEUR
    // -- singulier
    ['ipaa 3ps', 'fut'],
    // -- pluriel
    ['ipaa 3pp', 'furent'],
    // - FUTUR ANTÉRIEUR
    // -- singulier
    ['ifua 3ps', 'sera'],
    // -- pluriel
    ['ifua 3pp', 'seront'],

    // CONDITIONNEL
    // - PASSÉ
    // -- singulier
    ['cpa 3ps', 'serait'],
    // -- pluriel
    ['cpa 3pp', 'seraient'],

    // SUBJONCTIF
    // - PASSÉ
    // -- singulier
    ['spa 3ps', 'soit'],
    // -- pluriel
    ['spa 3pp', 'soient'],
    // - PLUS-QUE-PARFAIT
    // -- singulier
    ['spqp 3ps', 'fût'],
    // -- pluriel
    ['spqp 3pp', 'fussent'],
  ]);

  private static auxAvoir = new Map<string, string>([
    // INDICATIF
    // - PASSÉ COMPOSÉ
    // -- singulier
    ['ipac 3ps', 'a'],
    // -- pluriel
    ['ipac 3pp', 'ont'],
    // - PLUS-QUE-PARFAIT
    // -- singulier
    ['ipqp 3ps', 'avait'],
    // -- pluriel
    ['ipqp 3pp', 'avaient'],
    // - PASSÉ ANTÉRIEUR
    // -- singulier
    ['ipaa 3ps', 'eut'],
    // -- pluriel
    ['ipaa 3pp', 'eurent'],
    // - FUTUR ANTÉRIEUR
    // -- singulier
    ['ifua 3ps', 'aura'],
    // -- pluriel
    ['ifua 3pp', 'auront'],

    // CONDITIONNEL
    // - PASSÉ
    // -- singulier
    ['cpa 3ps', 'aurait'],
    // -- pluriel
    ['cpa 3pp', 'auraient'],

    // SUBJONCTIF
    // - PASSÉ
    // -- singulier
    ['spa 3ps', 'ait'],
    // -- pluriel
    ['spa 3pp', 'aient'],
    // - PLUS-QUE-PARFAIT
    // -- singulier
    ['spqp 3ps', 'eût'],
    // -- pluriel
    ['spqp 3pp', 'eussent'],
  ]);

  private static etre = new Map<string, string>([
    // INDICATIF
    // - PRÉSENT
    // -- singulier
    ['ipr 3ps', 'est'],
    // -- pluriel
    ['ipr 3pp', 'sont'],
    // - IMPARFAIT
    // -- singulier
    ['iimp 3ps', 'était'],
    // -- pluriel
    ['iimp 3pp', 'étaient'],
    // - PASSÉ SIMPLE
    // -- singulier
    ['ipas 3ps', 'fut'],
    // -- pluriel
    ['ipas 3pp', 'furent'],

    // - FUTUR SIMPLE
    // -- singulier
    ['ifus 3ps', 'sera'],
    // -- pluriel
    ['ifus 3pp', 'seront'],

    // CONDITIONNEL
    // - PRÉSENT
    // -- singulier
    ['cpr 3ps', 'serait'],
    // -- pluriel
    ['cpr 3pp', 'seraient'],

    // SUBJONCTIF
    // - PRÉSENT
    // -- singulier
    ['spr 3ps', 'soit'],
    // -- pluriel
    ['spr 3pp', 'soient'],
    // - IMPARFAIT
    // -- singulier
    ['simp 3ps', 'fût'],
    // -- pluriel
    ['simp 3pp', 'fussent'],
  ]);

  private static avoir = new Map<string, string>([
    // INDICATIF
    // - PRÉSENT
    // -- singulier
    ['ipr 3ps', 'a'],
    // -- pluriel
    ['ipr 3pp', 'ont'],
    // - IMPARFAIT
    // -- singulier
    ['iimp 3ps', 'avait'],
    // -- pluriel
    ['iimp 3pp', 'avaient'],
    // - PASSÉ SIMPLE
    // -- singulier
    ['ipas 3ps', 'eut'],
    // -- pluriel
    ['ipas 3pp', 'eurent'],
    // - FUTUR SIMPLE
    // -- singulier
    ['ifus 3ps', 'aura'],
    // -- pluriel
    ['ifus 3pp', 'auront'],

    // CONDITIONNEL
    // - PRÉSENT
    // -- singulier
    ['cpr 3ps', 'aurait'],
    // -- pluriel
    ['cpr 3pp', 'auraient'],

    // SUBJONCTIF
    // - PRÉSENT
    // -- singulier
    ['spr 3ps', 'ait'],
    // -- pluriel
    ['spr 3pp', 'aient'],
    // - IMPARFAIT
    // -- singulier
    ['simp 3ps', 'eût'],
    // -- pluriel
    ['simp 3pp', 'eussent'],
  ]);

  private static vivre = new Map<string, string>([
    // INDICATIF
    // - PRÉSENT
    // -- singulier
    ['ipr 3ps', 'vit'],
    // -- pluriel
    ['ipr 3pp', 'vivent'],
    // - IMPARFAIT
    // -- singulier
    ['iimp 3ps', 'vivait'],
    // -- pluriel
    ['iimp 3pp', 'vivaient'],
    // - PASSÉ SIMPLE
    // -- singulier
    ['ipas 3ps', 'vécut'],
    // -- pluriel
    ['ipas 3pp', 'vécurent'],
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

    // SUBJONCTIF
    // - PRÉSENT
    // -- singulier
    ['spr 3ps', 'vive'],
    // -- pluriel
    ['spr 3pp', 'vivent'],
    // - IMPARFAIT
    // -- singulier
    ['simp 3ps', 'vécût'],
    // -- pluriel
    ['simp 3pp', 'vécussent'],
  ]);

  private static ouvrir = new Map<string, string>([
    // INDICATIF
    // - PRÉSENT
    // -- singulier
    ['ipr 3ps', 'ouvre'],
    // -- pluriel
    ['ipr 3pp', 'ouvrent'],
    // - IMPARFAIT
    // -- singulier
    ['iimp 3ps', 'ouvrait'],
    // -- pluriel
    ['iimp 3pp', 'ouvraient'],
    // - PASSÉ SIMPLE
    // -- singulier
    ['ipas 3ps', 'ouvrit'],
    // -- pluriel
    ['ipas 3pp', 'ouvrirent'],
    // - FUTUR SIMPLE
    // -- singulier
    ['ifus 3ps', 'ouvrira'],
    // -- pluriel
    ['ifus 3pp', 'ouvriront'],

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
    // - IMPARFAIT
    // -- singulier
    ['simp 3ps', 'ouvrît'],
    // -- pluriel
    ['simp 3pp', 'ouvrissent'],
  ]);

  private static fermer = new Map<string, string>([
    // INDICATIF
    // - PRÉSENT
    // -- singulier
    ['ipr 3ps', 'ferme'],
    // -- pluriel
    ['ipr 3pp', 'ferment'],
    // - IMPARFAIT
    // -- singulier
    ['iimp 3ps', 'fermait'],
    // -- pluriel
    ['iimp 3pp', 'fermaient'],
    // - PASSÉ SIMPLE
    // -- singulier
    ['ipas 3ps', 'ferma'],
    // -- pluriel
    ['ipas 3pp', 'fermèrent'],
    // - FUTUR SIMPLE
    // -- singulier
    ['ifus 3ps', 'fermera'],
    // -- pluriel
    ['ifus 3pp', 'fermeront'],

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
    // - IMPARFAIT
    // -- singulier
    ['simp 3ps', 'fermât'],
    // -- pluriel
    ['simp 3pp', 'fermassent'],
  ]);

  private static pouvoir = new Map<string, string>([
    // INDICATIF
    // - PRÉSENT
    // -- singulier
    ['ipr 3ps', 'peut'],
    // -- pluriel
    ['ipr 3pp', 'peuvent'],
    // - IMPARFAIT
    // -- singulier
    ['iimp 3ps', 'pouvait'],
    // -- pluriel
    ['iimp 3pp', 'pouvaient'],
    // - PASSÉ SIMPLE
    // -- singulier
    ['ipas 3ps', 'put'],
    // -- pluriel
    ['ipas 3pp', 'purent'],
    // - FUTUR SIMPLE
    // -- singulier
    ['ifus 3ps', 'pourra'],
    // -- pluriel
    ['ifus 3pp', 'pourront'],

    // CONDITIONNEL
    // - PRÉSENT
    // -- singulier
    ['cpr 3ps', 'pourrait'],
    // -- pluriel
    ['cpr 3pp', 'pourraient'],

    // SUBJONCTIF
    // - PRÉSENT
    // -- singulier
    ['spr 3ps', 'puisse'],
    // -- pluriel
    ['spr 3pp', 'puissent'],
    // - IMPARFAIT
    // -- singulier
    ['simp 3ps', 'pût'],
    // -- pluriel
    ['simp 3pp', 'pussent'],
  ]);

  private static er = new Map<string, string>([
    // INDICATIF
    // - PRÉSENT
    // -- singulier
    ['ipr 3ps', 'e'],
    // -- pluriel
    ['ipr 3pp', 'ent'],
    // - IMPARFAIT
    // -- singulier
    ['iimp 3ps', 'ait'],
    // -- pluriel
    ['iimp 3pp', 'aient'],
    // - PASSÉ SIMPLE
    // -- singulier
    ['ipas 3ps', 'a'],
    // -- pluriel
    ['ipas 3pp', 'èrent'],
    // - FUTUR SIMPLE
    // -- singulier
    ['ifus 3ps', 'era'],
    // -- pluriel
    ['ifus 3pp', 'eront'],

    // CONDITIONNEL
    // - PRÉSENT
    // -- singulier
    ['cpr 3ps', 'erait'],
    // -- pluriel
    ['cpr 3pp', 'eraient'],

    // SUBJONCTIF
    // - PRÉSENT
    // -- singulier
    ['spr 3ps', 'e'],
    // -- pluriel
    ['spr 3pp', 'ent'],
    // - IMPARFAIT
    // -- singulier
    ['simp 3ps', 'ât'],
    // -- pluriel
    ['simp 3pp', 'assent'],
  ]);

  private static ir = new Map<string, string>([
    // INDICATIF
    // - PRÉSENT
    // -- singulier
    ['ipr 3ps', 't'],
    // -- pluriel
    ['ipr 3pp', 'ssent'],
    // - IMPARFAIT
    // -- singulier
    ['iimp 3ps', 'ssait'],
    // -- pluriel
    ['iimp 3pp', 'ssaient'],
    // - PASSÉ SIMPLE
    // -- singulier
    ['ipas 3ps', 'it'],
    // -- pluriel
    ['ipas 3pp', 'irent'],
    // - FUTUR SIMPLE
    // -- singulier
    ['ifus 3ps', 'ra'],
    // -- pluriel
    ['ifus 3pp', 'ront'],

    // CONDITIONNEL
    // - PRÉSENT
    // -- singulier
    ['cpr 3ps', 'rait'],
    // -- pluriel
    ['cpr 3pp', 'raient'],

    // SUBJONCTIF
    // - PRÉSENT
    // -- singulier
    ['spr 3ps', 'sse'],
    // -- pluriel
    ['spr 3pp', 'ssent'],
    // - IMPARFAIT
    // -- singulier
    ['simp 3ps', 't'],
    // -- pluriel
    ['simp 3pp', 'ssent'],
  ]);

  /** Liste des participes passés pré-encodés */
  private static pp = new Map<string, string>([
    ['courir', 'couru'],
    ['accourir', 'accouru'],
    ['concourir', 'concouru'],
    ['parcourir', 'parcouru'],
    ['tenir', 'tenu'],
    ['appartenir', 'appartenu'],
    ['contenir', 'contenu'],
    ['entretenir', 'entretenu'],
    ['maintenir', 'maintenu'],
    ['obtenir', 'obtenu'],
    ['retenir', 'retenu'],
    ['soutenir', 'soutenu'],
    ['venir', 'venu'],
    ['convenir', 'convenu'],
    ['devenir', 'devenu'],
    ['parvenir', 'parvenu'],
    ['prévenir', 'prévenu'],
    ['revenir', 'revenu'],
    ['souvenir', 'souvenu'],
    ['vêtir', 'vêtu'],
    ['asseoir', 'assis'],
    ['avoir', 'eu'],
    ['boire', 'bu'],
    ['croire', 'cru'],
    ['conclure', 'conclu'],
    ['conduire', 'conduit'],
    ['construire', 'construit'],
    ['cuire', 'cuit'],
    ['détruire', 'détruit'],
    ['instruire', 'instruit'],
    ['introduire', 'introduit'],
    ['produire', 'produit'],
    ['réduire', 'réduit'],
    ['séduire', 'séduit'],
    ['traduire', 'traduit'],
    ['reconnaître', 'reconnu'],
    ['apparaître', 'apparu'],
    ['disparaître', 'disparu'],
    ['paraître', 'paru'],
    ['coudre', 'cousu'],
    ['moudre', 'moulu'],
    ['résoudre', 'résolu'],
    ['craindre', 'craint'],
    ['atteindre', 'atteint'],
    ['contraindre', 'contraint'],
    ['éteindre', 'éteint'],
    ['feindre', 'feint'],
    ['peindre', 'peint'],
    ['plaindre', 'plaint'],
    ['teindre', 'teint'],
    ['décevoir', 'deçu'],
    ['apercevoir', 'aperçu'],
    ['concevoir', 'conçu'],
    ['recevoir', 'reçu'],
    ['devoir', 'dû'], // (due, dus, dues)
    ['mouvoir', 'mû'], // (mue, mus, mues)
    ['rire', 'ri'],
    ['sourire', 'souri'],
    ['suffire', 'suffi'],
    ['joindre', 'joint'],
    ['rejoindre', 'rejoint'],
    ['acquérir', 'acquis'],
    ['conquérir', 'conquis'],
    ['dire', 'dit'],
    ['contredire', 'contredit'],
    ['écrire', 'écrit'],
    ['interdire', 'interdit'],
    ['maudire', 'maudit'],
    ['médire', 'médit'],
    ['prédire', 'prédit'],
    ['être', 'été'],
    ['faire', 'fait'],
    ['satisfaire', 'satisfait'],
    ['falloir', 'fallu'],
    ['valoir', 'valu'],
    ['vouloir', 'voulu'],
    ['lire', 'lu'],
    ['élire', 'élu'],
    ['mettre', 'mis'],
    ['admettre', 'admis'],
    ['omettre', 'omis'],
    ['permettre', 'permis'],
    ['promettre', 'promis'],
    ['mourir', 'mort'],
    ['naître', 'né'],
    ['ouvrir', 'ouvert'],
    ['couvrir', 'couvert'],
    ['découvrir', 'découvert'],
    ['offrir', 'offert'],
    ['souffrir', 'souffert'],
    ['plaire', 'plu'],
    ['taire', 'tu'],
    ['pleuvoir', 'plu'],
    ['pouvoir', 'pu'],
    ['savoir', 'su'],
    ['voir', 'vu'],
    ['entrevoir', 'entrevu'],
    ['revoir', 'revu'],
    ['prendre', 'pris'],
    ['apprendre', 'appris'],
    ['comprendre', 'compris'],
    ['entreprendre', 'entrepris'],
    ['surprendre', 'surpris'],
    ['suivre', 'suivi'],
    ['poursuivre', 'poursuivi'],
    ['luire', 'lui'],
    ['vivre', 'vécu'],
    ['survivre', 'survécu']
  ]);

  /**
   * Récupérer la conjugaison d’un verbe régulier
   */
  getConjugaigonVerbeRegulier(infinitif: string, temps: string, forme: string, verbePronominal: boolean): string {

    let verbeConjugue: string;

    // TEMPS AVEC AUXILIAIRE
    if (Conjugaison.tempsAvecAuxiliaire(temps)) {

      const auxiliaireEtre = Conjugaison.verbeAvecAuxiliaireEtre(infinitif, verbePronominal);
      // récupérer l’auxiliaire conjugué
      const auxiliaireConjugue = Conjugaison.getAuxiliaireConjugue(auxiliaireEtre, temps, forme);

      verbeConjugue = auxiliaireConjugue + " " + Conjugaison.getParticipePasse(infinitif);

      // TEMPS SANS AUXILIAIRE
    } else {
      const groupe = Conjugaison.getGroupe(infinitif);
      const radical = Conjugaison.getRadical(infinitif, groupe, temps, forme);
      if (radical) {
        verbeConjugue = radical + Conjugaison.getTerminaisonVerbe2eGroupe(temps, forme);
      } else {
        verbeConjugue = "(forme pas prise en charge : verbe " + infinitif + " : " + temps + " " + forme + ")";
      }
    }

    return verbeConjugue;

  }

  /** Le verbe spécifié fait-il partie de la liste des verbes du 2e groupe ? */
  public static verbeDans2eGroupe(infinitif: string): boolean {
    if (infinitif) {
      // comparer le verbe avec la liste des verbes du 2e groupe
      return (/^(abasourdir|abâtardir|abêtir|ablatir|abolir|abonnir|aboutir|abréagir|abrutir|accomplir|accourcir|adoucir|affadir|affaiblir|affermir|affranchir|agir|agonir|agrandir|aguerrir|ahurir|aigrir|alanguir|alentir|allégir|alourdir|alunir|amaigrir|amatir|amerrir|ameublir|amincir|amoindrir|amollir|amortir|anéantir|anoblir|anordir|aplanir|aplatir|appauvrir|appesantir|applaudir|appointir|approfondir|arrondir|assagir|assainir|asservir|assombrir|assortir|assoupir|assouplir|assourdir|assouvir|assujettir|attendrir|atterrir|attiédir|avachir|avertir|aveulir|avilir|bannir|barrir|bâtir|bénir|blanchir|blêmir|blettir|bleuir|blondir|bondir|bouffir|brandir|bruir|brunir|calmir|candir|catir|chancir|chauvir|chérir|choisir|clapir|compatir|cônir|convertir|cotir|crépir|croupir|débâtir|débleuir|décatir|décrépir|définir|défléchir|défleurir|défraîchir|dégarnir|dégauchir|déglutir|dégourdir|dégrossir|déguerpir|déjaunir|démaigrir|démolir|démunir|dénantir|dépérir|dépolir|déraidir|dérougir|désemplir|désenlaidir|désépaissir|désétablir|désinvestir|désobéir|dessaisir|dessertir|désunir|déverdir|dévernir|divertir|doucir|durcir|ébahir|éblouir|ébroudir|écatir|échampir|éclaircir|écrouir|effleurir|élargir|élégir|embellir|emboutir|embrunir|emplir|empuantir|enchérir|endolorir|endurcir|enforcir|enfouir|engloutir|engourdir|enhardir|enlaidir|ennoblir|enrichir|ensevelir|envahir|épaissir|épanouir|époutir|équarrir|estourbir|établir|étourdir|étrécir|faiblir|farcir|finir|fléchir|flétrir|fleurir|forcir|fouir|fourbir|fournir|fraîchir|franchir|frémir|froidir|garantir|garnir|gauchir|gémir|glapir|glatir|grandir|gravir|grossir|guérir|haïr|havir|hennir|honnir|hourdir|huir|infléchir|interagir|intervertir|invertir|investir|jaillir|jaunir|jouir|languir|lotir|louchir|maigrir|matir|mégir|meurtrir|mincir|moisir|moitir|mollir|mugir|munir|mûrir|nantir|noircir|nordir|nourrir|obéir|obscurcir|ourdir|pâlir|pâtir|périr|pervertir|pétrir|polir|pourrir|préétablir|prémunir|punir|rabonnir|rabougrir|raccourcir|racornir|radoucir|raffermir|rafraîchir|ragaillardir|raidir|rajeunir|ralentir|ramollir|rancir|raplatir|rapointir|rappointir|rassortir|ravilir|ravir|réagir|réassortir|rebâtir|reblanchir|rebondir|rechampir|reconvertir|recrépir|redéfinir|redémolir|réfléchir|refleurir|refroidir|regarnir|régir|regrossir|réinvestir|rejaillir|réjouir|rélargir|rembrunir|remplir|renchérir|renformir|repolir|resalir|resplendir|ressaisir|ressurgir|resurgir|rétablir|retentir|rétrécir|rétroagir|réunir|réussir|reverdir|revernir|roidir|rondir|rosir|rôtir|rougir|rouir|roussir|roustir|rugir|saisir|salir|saurir|serfouir|sertir|sévir|subir|subvertir|superfinir|surenchérir|surgir|surir|tarir|tartir|ternir|terrir|tiédir|trahir|transir|travestir|unir|vagir|verdir|vernir|vieillir|vioquir|vomir|vrombir)$/.test(infinitif));
    } else {
      return false;
    }
  }

  private static tempsAvecAuxiliaire(temps): boolean {
    return /^(ipac|ipqp|ipaa|ifua|cpa|spa|spqp)$/.test(temps);
  }

  private static getAuxiliaireConjugue(auxiliaireEtre: boolean, temps: string, forme: string) {
    let auxiliaireConjugue: string;
    // vérifier si ce temps nécessite un auxiliaire
    const cle = temps + " " + forme;
    let verbe: Map<string, string>;
    // auxiliaire être
    if (auxiliaireEtre) {
      verbe = Conjugaison.auxEtre;
      // auxiliaire avoir
    } else {
      verbe = Conjugaison.auxAvoir;
    }
    // forme trouvée
    if (verbe.has(cle)) {
      auxiliaireConjugue = verbe.get(cle);
      // forme pas trouvée
    } else {
      auxiliaireConjugue = "(forme pas prise en charge : auxiliaire être/avoir : " + cle + ")";
    }
    return auxiliaireConjugue;
  }

  public static verbeAvecAuxiliaireEtre(infinitif: string, verbePronominal: boolean) {
    if (verbePronominal || infinitif.match(/^(se |s’|s')(.+)$/)) {
      return true;
    } else {
      // DR & MRS P. VANDERTRAMP
      return /^(devenir|revenir|mourir|retourner|sortir|partir|venir|aller|naître|descendre|entrer|rentrer|tomber|rester|arriver|monter|passer)$/.test(infinitif);
    }
  }

  private static getTerminaisonVerbe2eGroupe(temps: string, forme: string) {
    const cle = temps + " " + forme;
    const tabTerminaison = Conjugaison.er;
    let terminaison: string;
    if (tabTerminaison.has(cle)) {
      terminaison = tabTerminaison.get(cle);
      // forme pas trouvée
    } else {
      terminaison = "(forme pas prise en charge : terminaison 2e groupe : " + cle + ")";
    }
    return terminaison;
  }

  public static getParticipePasse(infinitif: string) {

    let participePasse: string;
    const groupe = Conjugaison.getGroupe(infinitif);
    const radical = Conjugaison.getRadical(infinitif, groupe, "pp", "1ps")

    switch (groupe) {
      // Groupe 1 (ER sauf aller)
      case 1:
        participePasse = radical + "é";
        break;
      // Groupe 2 (certains verbes en IR)
      case 2:
        participePasse = radical + "i";
        break;

      // Groupe 3 : irréguliers
      case 3:
        // irréguliers connus
        if (Conjugaison.pp.has(infinitif)) {
          participePasse = Conjugaison.pp.get(infinitif);
          // irréguliers non connus => on se base sur les règles de base
        } else {
          // ir => i
        } if (infinitif.endsWith('ir')) {
          participePasse = radical;
          // re => u
        } else if (infinitif.endsWith('re')) {
          participePasse = radical + 'u';
          // er => é
        } else if (infinitif.endsWith('er')) {
          participePasse = radical + 'é';
        }
    }

    return participePasse;

  }

  public static getGroupe(infinitif) {
    if (infinitif.endsWith('er') && infinitif != 'aller') {
      return 1;
    } else if (infinitif.endsWith('ir') && Conjugaison.verbeDans2eGroupe(infinitif)) {
      return 2;
    } else {
      return 3;
    }
  }

  public static getRadical(infinitif: string, groupe: number, temps: string, forme: string): string {

    let radical: string;

    switch (groupe) {
      case 1:
        /** VERBES DU PREMIER GROUPE (ER) */
        /** verbe en GER */
        if (infinitif.endsWith("ger")) {
          radical = infinitif.slice(0, infinitif.length - 2);
          if (forme == '1pp') {
            radical += "e";
          }
          /** verbe en YER */
        } else if (infinitif.endsWith("yer")) {
          radical = infinitif.slice(0, infinitif.length - 3);
          if (forme == '1pp' || forme == '2pp') {
            radical += "y";
          } else {
            radical += "i";
          }
          /** verbe en CER */
        } else if (infinitif.endsWith("cer")) {
          radical = infinitif.slice(0, infinitif.length - 3);
          if (forme == '1pp') {
            radical += "ç";
          } else {
            radical += "c";
          }
          /** verbe en ELER */
        } else if (infinitif.endsWith("eler")) {
          // verbes irrégulier => èl
          if (infinitif.match('^(agneler|(re)?(dé)?celer|ciseler|démanteler|écarteler|encasteler|(dé)?(con)?(sur)?geler|marteler|modeler|peler)$')) {
            radical = infinitif.slice(0, infinitif.length - 4);
            if (forme != '1pp' && forme != '2pp') {
              radical += "èl";
            } else {
              radical += "el"
            }
            // verbes réguliers => ell
          } else {
            radical = infinitif.slice(0, infinitif.length - 2);
            if (forme != '1pp' && forme != '2pp') {
              radical += "l";
            }
          }
          /** verbe en ETER */
        } else if (infinitif.endsWith("eter")) {
          // verbes irrégulier => èt
          if (infinitif.match('/^(acheter|racheter|bégueter|corseter|crocheter|fileter|fureter|haleter)$')) {
            radical = infinitif.slice(0, infinitif.length - 4);
            if (forme != '1pp' && forme != '2pp') {
              radical += "èt";
            } else {
              radical += "et"
            }
            // verbes réguliers => ett
          } else {
            radical = infinitif.slice(0, infinitif.length - 2);
            if (forme != '1pp' && forme != '2pp') {
              radical += "t";
            }
          }
          /** autre verbe en ER */
        } else {
          radical = infinitif.slice(0, infinitif.length - 2);
        }
        break;

      /** VERBES DU DEUXIÈME GROUPE (IR réguliers) */
      case 2:
        // subjonctif imparfait 3e pers du sing.
        if (temps == 'simp' && forme == '3ps') {
          radical = infinitif.slice(0, Notification.length - 2) + 'î';
          // autres
        } else {
          radical = infinitif.slice(0, Notification.length - 1);
        }
        break;

      default:
        radical = null;
        break;
    }

    return radical;
  }

}
