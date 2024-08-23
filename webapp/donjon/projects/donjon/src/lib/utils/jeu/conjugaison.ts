export class Conjugaison {

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
    ['décevoir', 'déçu'],
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
  public static getConjugaigonVerbeRegulier(infinitifSansSe: string, temps: string, forme: string, verbePronominal: boolean): string {

    let verbeConjugue: string;

    // TEMPS AVEC AUXILIAIRE
    if (Conjugaison.tempsAvecAuxiliaire(temps)) {

      const auxiliaireEtre = Conjugaison.verbeAvecAuxiliaireEtre(infinitifSansSe, verbePronominal);
      // récupérer l’auxiliaire conjugué
      const auxiliaireConjugue = Conjugaison.getAuxiliaireConjugue(auxiliaireEtre, temps, forme);

      verbeConjugue = auxiliaireConjugue + " " + Conjugaison.getParticipePasse(infinitifSansSe);

      // TEMPS SANS AUXILIAIRE
    } else {
      const groupe = Conjugaison.getGroupe(infinitifSansSe);
      const radical = Conjugaison.getRadical(infinitifSansSe, groupe, temps, forme);
      if (radical) {
        verbeConjugue = radical + Conjugaison.getTerminaisonVerbe2eGroupe(temps, forme);
      } else {
        verbeConjugue = "(forme pas prise en charge : verbe " + infinitifSansSe + " : " + temps + " " + forme + ")";
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

  public static tempsAvecAuxiliaire(temps): boolean {
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
    // voix pronominale et pronominaux
    if (verbePronominal || /^(se |s’|s')(.+)$/.test(infinitif)) {
      return true;
      // autres
    } else {
      return ( // DR & MRS P. VANDERTRAMP
        /^(devenir|revenir|mourir|retourner|sortir|partir|venir|aller|naître|descendre|entrer|rentrer|tomber|rester|arriver|monter|passer)$/.test(infinitif)
        || /^(décéder|échoir|repartir|retomber|advenir|intervenir|parvenir|provenir|survenir|ressortir|)$/.test(infinitif)
      );
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

  public static getParticipePasse(infinitifSansSe: string) {

    let participePasse: string;
    const groupe = Conjugaison.getGroupe(infinitifSansSe);
    const radical = Conjugaison.getRadical(infinitifSansSe, groupe, "pp", "1ps")

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
        if (Conjugaison.pp.has(infinitifSansSe)) {
          participePasse = Conjugaison.pp.get(infinitifSansSe);
          // irréguliers non connus => on se base sur les règles de base
        } else {
          // ir => i
          if (infinitifSansSe.endsWith('ir')) {
            participePasse = radical;
            // re => u
          } else if (infinitifSansSe.endsWith('re')) {
            participePasse = radical + 'u';
            // er => é
          } else if (infinitifSansSe.endsWith('er')) {
            participePasse = radical + 'é';
          }
        }
    }

    return participePasse;

  }

  public static getGroupe(infinitifSansSe: string) {
    if (infinitifSansSe.endsWith('er') && infinitifSansSe != 'aller') {
      return 1;
    } else if (infinitifSansSe.endsWith('ir') && Conjugaison.verbeDans2eGroupe(infinitifSansSe)) {
      return 2;
    } else {
      return 3;
    }
  }

  public static getRadical(infinitifSansSe: string, groupe: number, temps: string, forme: string): string {

    let radical: string;

    switch (groupe) {
      case 1:
        /** VERBES DU PREMIER GROUPE (ER) */
        /** verbe en GER */
        if (infinitifSansSe.endsWith("ger")) {
          radical = infinitifSansSe.slice(0, infinitifSansSe.length - 2);
          if (forme == '1pp') {
            radical += "e";
          }
          /** verbe en YER */
        } else if (infinitifSansSe.endsWith("yer")) {
          radical = infinitifSansSe.slice(0, infinitifSansSe.length - 3);
          if (forme == '1pp' || forme == '2pp') {
            radical += "y";
          } else {
            radical += "i";
          }
          /** verbe en CER */
        } else if (infinitifSansSe.endsWith("cer")) {
          radical = infinitifSansSe.slice(0, infinitifSansSe.length - 3);
          if (forme == '1pp') {
            radical += "ç";
          } else {
            radical += "c";
          }
          /** verbe en ELER */
        } else if (infinitifSansSe.endsWith("eler")) {
          // verbes irrégulier => èl
          if (/^(agneler|(re)?(dé)?celer|ciseler|démanteler|écarteler|encasteler|(dé)?(con)?(sur)?geler|marteler|modeler|peler)$/.test(infinitifSansSe)) {
            radical = infinitifSansSe.slice(0, infinitifSansSe.length - 4);
            if (forme != '1pp' && forme != '2pp') {
              radical += "èl";
            } else {
              radical += "el"
            }
            // verbes réguliers => ell
          } else {
            radical = infinitifSansSe.slice(0, infinitifSansSe.length - 2);
            if (forme != '1pp' && forme != '2pp') {
              radical += "l";
            }
          }
          /** verbe en ETER */
        } else if (infinitifSansSe.endsWith("eter")) {
          // verbes irrégulier => èt
          if (/^(acheter|racheter|bégueter|corseter|crocheter|fileter|fureter|haleter)$/.test(infinitifSansSe)) {
            radical = infinitifSansSe.slice(0, infinitifSansSe.length - 4);
            if (forme != '1pp' && forme != '2pp') {
              radical += "èt";
            } else {
              radical += "et"
            }
            // verbes réguliers => ett
          } else {
            radical = infinitifSansSe.slice(0, infinitifSansSe.length - 2);
            if (forme != '1pp' && forme != '2pp') {
              radical += "t";
            }
          }
          /** autre verbe en ER */
        } else {
          radical = infinitifSansSe.slice(0, infinitifSansSe.length - 2);
        }
        break;

      /** VERBES DU DEUXIÈME GROUPE (IR réguliers) */
      case 2:
        // subjonctif imparfait 3e pers du sing.
        if (temps == 'simp' && forme == '3ps') {
          radical = infinitifSansSe.slice(0, Notification.length - 2) + 'î';
          // autres
        } else {
          radical = infinitifSansSe.slice(0, Notification.length - 1);
        }
        break;

      case 3:
        // if (Conjugaison.rad.has(infinitif)) {
        //   radical = Conjugaison.rad.get(infinitif);
        //   // irréguliers non connus => on se base sur les règles de base
        // } else {
        // on retire la terminaison au cas où ça passe...
        radical = infinitifSansSe.slice(0, infinitifSansSe.length - 2);
        // }
        break;

      default:
        radical = null;
        break;
    }

    return radical;
  }

  public static getVerbeIrregulier(verbe: string): Map<string, string> {
    switch (verbe) {
      case "avoir":
        return Conjugaison.avoir;
      case "être":
      case "s’être":
      case "s'être":
        return Conjugaison.etre;
      case "aller":
        return Conjugaison.aller;
      case "attendre":
      case "s’attendre":
      case "s'attendre":
        return Conjugaison.attendre;
      case "se contenir":
      case "contenir":
        return Conjugaison.contenir;
      case "couvrir":
      case "se couvrir":
        return Conjugaison.couvrir;
      case "disparaitre":
      case "disparaître":
        return Conjugaison.disparaitre;
      case "ouvrir":
      case "s’ouvrir":
      case "s'ouvrir":
        return Conjugaison.ouvrir;
      case "pouvoir":
        return Conjugaison.pouvoir;
      case "vivre":
        return Conjugaison.vivre;

      default:
        return null;
    }
  }


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

  private static aller = new Map<string, string>([
    // INDICATIF
    // - PRÉSENT
    // -- singulier
    ['ipr 3ps', 'va'],
    // -- pluriel
    ['ipr 3pp', 'vont'],
    // - IMPARFAIT
    // -- singulier
    ['iimp 3ps', 'allait'],
    // -- pluriel
    ['iimp 3pp', 'allaient'],
    // - PASSÉ SIMPLE
    // -- singulier
    ['ipas 3ps', 'alla'],
    // -- pluriel
    ['ipas 3pp', 'allèrent'],
    // - FUTUR SIMPLE
    // -- singulier
    ['ifus 3ps', 'ira'],
    // -- pluriel
    ['ifus 3pp', 'iront'],

    // CONDITIONNEL
    // - PRÉSENT
    // -- singulier
    ['cpr 3ps', 'irait'],
    // -- pluriel
    ['cpr 3pp', 'iraient'],

    // SUBJONCTIF
    // - PRÉSENT
    // -- singulier
    ['spr 3ps', 'aille'],
    // -- pluriel
    ['spr 3pp', 'aillent'],
    // - IMPARFAIT
    // -- singulier
    ['simp 3ps', 'allât'],
    // -- pluriel
    ['simp 3pp', 'allassent'],
  ]);


  private static attendre = new Map<string, string>([
    // INDICATIF
    // - PRÉSENT
    // -- singulier
    ['ipr 3ps', 'attend'],
    // -- pluriel
    ['ipr 3pp', 'attendent'],
    // - IMPARFAIT
    // -- singulier
    ['iimp 3ps', 'attendait'],
    // -- pluriel
    ['iimp 3pp', 'attendaient'],
    // - PASSÉ SIMPLE
    // -- singulier
    ['ipas 3ps', 'attendit'],
    // -- pluriel
    ['ipas 3pp', 'attendirent'],
    // - FUTUR SIMPLE
    // -- singulier
    ['ifus 3ps', 'attendra'],
    // -- pluriel
    ['ifus 3pp', 'attendront'],

    // CONDITIONNEL
    // - PRÉSENT
    // -- singulier
    ['cpr 3ps', 'attendrait'],
    // -- pluriel
    ['cpr 3pp', 'attendraient'],

    // SUBJONCTIF
    // - PRÉSENT
    // -- singulier
    ['spr 3ps', 'attende'],
    // -- pluriel
    ['spr 3pp', 'attendent'],
    // - IMPARFAIT
    // -- singulier
    ['simp 3ps', 'attendît'],
    // -- pluriel
    ['simp 3pp', 'attendissent'],
  ]);

  private static contenir = new Map<string, string>([
    // INDICATIF
    // - PRÉSENT
    // -- singulier
    ['ipr 3ps', 'contient'],
    // -- pluriel
    ['ipr 3pp', 'contiennent'],
    // - IMPARFAIT
    // -- singulier
    ['iimp 3ps', 'contenait'],
    // -- pluriel
    ['iimp 3pp', 'contenaient'],
    // - PASSÉ SIMPLE
    // -- singulier
    ['ipas 3ps', 'contint'],
    // -- pluriel
    ['ipas 3pp', 'continrent'],
    // - FUTUR SIMPLE
    // -- singulier
    ['ifus 3ps', 'contiendra'],
    // -- pluriel
    ['ifus 3pp', 'contiendront'],

    // CONDITIONNEL
    // - PRÉSENT
    // -- singulier
    ['cpr 3ps', 'contiendrait'],
    // -- pluriel
    ['cpr 3pp', 'contiendraient'],

    // SUBJONCTIF
    // - PRÉSENT
    // -- singulier
    ['spr 3ps', 'contienne'],
    // -- pluriel
    ['spr 3pp', 'contiennent'],
    // - IMPARFAIT
    // -- singulier
    ['simp 3ps', 'contînt'],
    // -- pluriel
    ['simp 3pp', 'continssent'],
  ]);


  private static couvrir = new Map<string, string>([
    // INDICATIF
    // - PRÉSENT
    // -- singulier
    ['ipr 3ps', 'couvre'],
    // -- pluriel
    ['ipr 3pp', 'couvrent'],
    // - IMPARFAIT
    // -- singulier
    ['iimp 3ps', 'couvrait'],
    // -- pluriel
    ['iimp 3pp', 'couvraient'],
    // - PASSÉ SIMPLE
    // -- singulier
    ['ipas 3ps', 'couvrit'],
    // -- pluriel
    ['ipas 3pp', 'couvrirent'],
    // - FUTUR SIMPLE
    // -- singulier
    ['ifus 3ps', 'couvrira'],
    // -- pluriel
    ['ifus 3pp', 'couvriront'],

    // CONDITIONNEL
    // - PRÉSENT
    // -- singulier
    ['cpr 3ps', 'couvrirait'],
    // -- pluriel
    ['cpr 3pp', 'couvriraient'],

    // SUBJONCTIF
    // - PRÉSENT
    // -- singulier
    ['spr 3ps', 'couvre'],
    // -- pluriel
    ['spr 3pp', 'couvrent'],
    // - IMPARFAIT
    // -- singulier
    ['simp 3ps', 'couvrît'],
    // -- pluriel
    ['simp 3pp', 'couvrissent'],
  ]);

  private static disparaitre = new Map<string, string>([
    // INDICATIF
    // - PRÉSENT
    // -- singulier
    ['ipr 3ps', 'disparaît'],
    // -- pluriel
    ['ipr 3pp', 'disparaissent'],
    // - IMPARFAIT
    // -- singulier
    ['iimp 3ps', 'disparaissait'],
    // -- pluriel
    ['iimp 3pp', 'disparaissaient'],
    // - PASSÉ SIMPLE
    // -- singulier
    ['ipas 3ps', 'disparut'],
    // -- pluriel
    ['ipas 3pp', 'disparurent'],
    // - FUTUR SIMPLE
    // -- singulier
    ['ifus 3ps', 'disparaîtra'],
    // -- pluriel
    ['ifus 3pp', 'disparaîtront'],

    // CONDITIONNEL
    // - PRÉSENT
    // -- singulier
    ['cpr 3ps', 'disparaîtrait'],
    // -- pluriel
    ['cpr 3pp', 'disparaîtraient'],

    // SUBJONCTIF
    // - PRÉSENT
    // -- singulier
    ['spr 3ps', 'disparaisse'],
    // -- pluriel
    ['spr 3pp', 'disparaissent'],
    // - IMPARFAIT
    // -- singulier
    ['simp 3ps', 'disparût'],
    // -- pluriel
    ['simp 3pp', 'disparussent'],
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



}
