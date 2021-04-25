export class ExprReg {

  // Caractères réservés:
  // Ƶ et ƶ − commentaire
  static readonly caractereDebutTexte = 'Ƶ';
  static readonly caractereFinTexte = 'ƶ';
  static readonly xCaracteresCommentaire = /Ƶ|ƶ/g;
  static readonly xCaractereDebutCommentaire = /Ƶ/g;
  static readonly xCaractereFinCommentaire = /ƶ/g;
  //   Ʒ − retour à la ligne
  static readonly caractereRetourLigne = 'Ʒ';
  static readonly xCaractereRetourLigne = /Ʒ/g;
  //   ʔ − virgule dans les comentaires
  static readonly caractereVirgule = 'ʔ';
  static readonly xCaractereVirgule = /ʔ/g;
  //   ʖ − point virgule dans les commentaires
  static readonly caracterePointVirgule = 'ʖ';
  static readonly xCaracterePointVirgule = /ʖ/g;


  /**
   * Verbe à l’infinitif.
   * - Découpage :
   *     - verbe(1)
   * - Exemples :
   *     - marcher
   *     - partir
   *     - boire
   *     - se brosser
   *     - s’égosiller
   * - Tests unitaires :
   *     - marcher
   *     - partir
   *     - boire
   *     - se brosser
   *     - s’égosiller
   *     - s'éveiller
   *     - 💥 oiseau
   *     - 💥 un boucher
   */
  static readonly xVerbeInfinitif = /^((?:se |s’|s')?\S+(?:ir|er|re))$/i;

  /**
   * Groupe nominal.
   * - Découpage :
   *     - Déterminant(1), Nom(2), Épithète(3)
   * - Exemples :
   *     - la(1) pomme de terre(2) pourrie(3)
   *     - la(1) canne à pèche(2)
   *     - le(1) chapeau(2) gris(3)
   *     - chapeau(2)
   *     - le(1) chapeau(2)
   * - Tests unitaires :
   *     - La pomme de terre pourrie
   *     - la canne à pèche
   *     - le chapeau gris
   *     - l’arracheur de dents dorrées
   *     - Bruxelles-Capitale
   */
  static readonly xGroupeNominal = /^(le |la |l(?:’|')|les )?(\S+?|(?:\S+? (?:à |en |au(?:x)? |de (?:la |l'|l’)?|du |des |d'|d’)\S+?))(?:(?: )(?!\(|ne |n’|n'|d’|d'|et |un |de )(\S+))?$/i;


  // ================================================================================================
  //  DÉFINITIONS DES ÉLÉMENTS DU MONDE
  // ================================================================================================

  /** élément générique simple
 * - ex1: Le (1) champignon des bois (2) odorant (3) (champignons des bois)(4) est un légume(5) mangeable(6).
 * - => Déterminant(1), Nom(2), Épithète(3), Féminin et autre forme(4), Classe(5), Attribut(6).
 * - Tests unitaires :
 *     - Paris est un lieu
 *     - La table basse est un objet
 *     - L'apprentie sorcière (f) est une personne fatiguée
 */
  static readonly xDefinitionElementAvecType = /^(?!un |une |elle |il |elles |ils |sa |son |ses |si |avant |après |dire |changer )(le |(?:de )?(?:la |l’|l')|les |du )?(\S+?|(?:\S+? (?:à |en |au(?:x)? |de (?:la |l'|l’)?|du |des |d'|d’)\S+?))(?:(?: )((?!d'|d’|\()\S+))?(?:(?: )(\(.+\))?)? (?:est|sont) (?:un|une|des) (\S+)(?:(?: )(?!(?:au|à|dans) )(.+))?$/i;

  /** élément générique positionné par rapport à complément
   * - Découpage :
   *     - determinant(1), nom(2), épithète(3) féminin?(4), type(5), attributs(6), position(7), complément(8)
   * - Exemples :
   *     - La (1) {pomme de terre}(2) pourrie(3) (pommes de terre)(4) est un légume(5) pourri(6) {dans le}(7) jardin(8).
   *     - Les(1) {torches en bois}(2) enflamées(3) (f)(4) sont des objets(5) maudits(6) {dans le}(7) jardin(8).
   *     - L’allée(1) (f)(4) est un lieu(5) {au sud du}(7) départ(8)
   * - Tests unitaires
   *     - Les torches en bois enflamées sont des objets maudits dans le jardin
   *     - La pomme de terre (pommes de terre) est un légume pourri dans la grange encorcelée
   *     - L’allée principale (f) est un lieu au sud du départ
   *     - La gare est un lieu dans Lisbonne
   */
  static readonly xPositionElementGeneriqueDefini = /^(?!un |une |elle |il |elles |ils |sa |son |ses )(le |(?:de )?(?:la |l’|l')|les |du )?(\S+?|(?:\S+? (?:à |en |au(?:x)? |de (?:la |l'|l’)?|du |des |d'|d’)\S+?))(?:(?: )((?!d'|d’|\()\S+))?(?:(?: )(\(.+\))?)? (?:est|sont|se trouve(?:nt)?) (?:|(?:un|une|des) (\S+?)(?:(?: )(?!hors)(\S+?))? )?((?:(?:(?:à l(?:’|')(?:intérieur|interieur|extérieur|exterieur|est|ouest))|hors|en (?:haut|bas|dessous)|au(?: |\-)(?:dessus|dessous|nord|sud)) (?:du |de (?:la |l’|l')?|des ))|(?:(?:dans|sur|sous) (?:la |le |l(?:’|')|les |un | une )?|de (?:la |l(?:’|'))|du ))(.+)/i;

  /** élément générique positionné par rapport à complément :
   * - Découpage :
   *     - Formulation A : déterminant(1), nom (2), épithète (3), féminin+autre forme(4), position(9), complément(10)
   *     - Formulation B : déterminant(5), nom (6), épithète (7), féminin+autre forme(8), position(9), complément(10)
   * - Exemples :
   *     - Formulation A : Il y a des pommes de terre anciennes (f, pomme de terre) dans le champ. 
   *     - Formulation B : Une canne à pèche neuve (cannes à pèche) est sur le bord du lac.
   * - Tests unitaires :
   *     - 
   *     - 
   *     - 
   *     - 
   *     - 
   */
  static readonly xPositionElementGeneriqueIndefini = /^(?:(?:il y a (un |une |des |du |de la |de l(?:’|')|[1-9]\d* )(\S+|(?:\S+ (?:à |en |au(?:x)? |de (?:la |l'|l’)?|du |des |d'|d’)\S+?))(?:(?: )((?!d'|d’|\()\S+?))?(?:(?: )(\(.+\))?)?)|(?:(un |une |des |du |de l(?:’|'))(\S+|(?:\S+ (?:à|en|de(?: la)?|du|des) \S+))(?:(?: )(?!hors)(\S+))?(?:(?: )(\(.+\))?)? (?:est|sont))) ((?:(?:à l(?:’|')(?:intérieur|interieur|extérieur|exterieur|est|ouest)|hors|en (?:haut|bas|dessous)|au(?: |\-)(?:dessus|dessous|nord|sud)) (?:du |de (?:la |l’|l')?|des ))|(?:(?:dans|sur|sous) (?:la |le |l(?:’|')?|les |un |une )?))(.+)/i;

  /** pronom personnel position -> position(1), complément(2) */
  static readonly xPronomPersonnelPosition = /^(?:(?:(?:il|elle|celui-ci|celle-ci) est)|(?:(?:ils|elles|celles-ci|ceux-ci) sont)) (?:(?:(à l(?:’|')intérieur|à l(?:’|')extérieur|hors|au sud|au nord|à l(?:’|')est|à l(?:’|')ouest|en haut|en bas) (?:du |de (?:la |l’|l')?|des ))|(?:(?:dans|sur|sous) (?:la |le |les |l(?:’|')|un |une )|de (?:la |l(?:’|'))|du ))(.+)/i;


  /** pronom démonstratif
   * - (C’est/Ce sont un/des)(1), type(2), [attributs(3)]
   * - Ex: C’est une personne fachée.
  */
  static readonly xPronomDemonstratifTypeAttributs = /^((?:c(?:’|')est (?:un|une))|(?:ce sont des)) (\S+)( .+)?/i;

  /** pronom personnel
   * - attributs(1)
   * - Ex: Il est faché, grand et fort.
   * - Ex: Celui-ci grand.
   */
  static readonly xPronomPersonnelAttribut = /^(?:(?:(?:il|elle|celui-ci|celle-ci) est)|(?:(?:ils|elles|celles-ci|ceux-ci) sont))((?!une |un |des ) (?:.+[^,])(?:$| et (?:.+[^,])|(?:, .+[^,])+ et (?:.+[^,])))/i;

  /** Propriété
   * - Découpage :
   *     - son|sa propriété(1) est|vaut(6) valeur(7)
   *     - la|le|l' proriété(2) du|de la|de l' complément(3) est|vaut(6) valeur(7)
   *     - sa réaction(1) (concernant le)(4) sujet(5) est|vaut(6) valeur(7)
   *     - la réaction(2) du|de la|de l' complément(3) (au sujet du|de la)(4) sujet(5) est|vaut(6) valeur(7)
   * - Exemples :
   *     - Sa réaction est "Je viens avec vous.".
   *     - La description du bateau est "C’est un fameux rafio.".
   *     - Sa réaction à propos de la pomme ou des poires est "C’est bon pour la santé.".
   *     - Sa réaction concernant la pomme est : changer le joueur possède la pomme; dire "Je vous la donne !".
   *     - La réaction du capitaine concernant les pirates est "Aïe aïe aïe…".
   *     - La réaction du capitaine concernant les pirates, les méchants hargneux ou les malfrats est "Aïe aïe aïe…"
   *     - La réaction du schérif rouge à propos des pirates, des méchants ou des malfrats est "nrstnrstnrst".
   * - Tests unitaires :
   *     - Son texte est "Voici ce qui est écrit"
   *     - Sa valeur vaut 3
   *     - La description du bateau est "C’est un fameux rafio"
   *     - La réaction du capitaine du bateau concernant le trésor est "Vous ne l’aurez pas !"
   *     - La réaction de la cavalière hantée au sujet des bois, de la prairie ou des fleurs est dire "C’est naturel"; dire "Quoi d’autre ?"
   *     - Sa réaction concernant la pomme est : changer le joueur possède la pomme; dire "Je vous la donne !"
   */
  static readonly xProprieteReaction = /^(?:(?:(?:son|sa|leur) (\S+?))|(?:(?:la |le |l(?:’|'))(\S+?) (?:du |de (?:la |l’|l')|des )(.+?))) (?:(à propos|au sujet|concernant) (?:du |de la |des |la |le |les |l’|l'|un |une |)((?:.+?)(?:(?:,|ou) (?:du |de la |des |la |le |les |l’|l'|un |une |).+?)*) )?(est|vaut)(?:(?: )?\:(?: )?)?(?: (.+))?$/i;

  /** capacité -> verbe(1) complément(2) */
  static readonly xCapacite = /^(?:(?:(?:il|elle) permet)|(?:(?:ils|elles) permettent)) (?:de |d(?:’|'))(se \S+|\S+)( .+|)/i;

  /** élément générique ->
   * - Découpage :
   *     - Déterminant(1) nom(2) épithète(3) [(f, autre forme)]\(4) est/sont attributs(5).
   * - Exemples :
   *     - Les pommes de terre pourries (f, pomme de terre) sont mauves, odorantes et humides.
   * - Tests unitaires :
   *     - Le bateau est vieux et troué
   *     - Julien est grand
   *     - L’aliance du lac rouge (f) est petite, fragile, vieille et dorée
   *     - Les pommes de terre pourries (f, pomme de terre) sont mauves, odorantes et humides
   */
  static readonly xElementSimpleAttribut = /^(?!un |une |elle |il |elles |ils |sa |son |ses )(le |la |l(?:’|')|les )?(\S+|(?:\S+ (?:à |en |au(?:x)? |de (?:la |l'|l’)?|du |des |d'|d’)\S+))(?:(?: )((?!d'|d’)\S+))?(?:(?: )(\(.+\))?)? (?:est|sont) ((?!une |un |des |au |à |dans )(?:.+[^,])(?:$| et (?:.+[^,]$)|(?:, .+[^,])+ et (?:.+[^,]$)))/i;

  /**
   * Synonymes
   * - Découpage :
   *     - interpréter (synonymeA[[, synonymeBCD] et synonymeE])(1) comme original(2)
   * - Tests unitaires :
   *     - interpréter Alain comme le capitaine
   *     - interpréter Alain et le marin comme l’apprenti du village
   *     - interpréter le marin, Alain et le boss comme le capitaine crochet
   *     - Interpréter marcher comme se déplacer
   *     - interpréter marcher, courrir, sauter, s’étirer et danser comme s’exercer
   *     (- 💥 interpréter courir comme le pied de bois)
   */
  static readonly xSynonymes = /^interpréter ((?:.+?)(?:(?:, (?:.+?))*(?: et (?:.+?)))?) comme (.+)$/i;

  /**
   * Activer / Désactiver un paramètre
   * - Découpage :
   *     - activer/désactiver(1) paramètre(2)
   */
  static readonly xActiverDesactiver = /^(activer|désactiver) (.+)$/i;

  // ================================================================================================
  //  TYPES
  // ================================================================================================

  /**
   * Nouveau type d’élément.
   * - Découpage :
   *     - un/une(1) nouveauType(2) est un/une typeParent(3) {attributs}(4)
   * - Exemples :
   *     - Un meuble est un objet.
   *     - Un fruit est un objet mangeable, léger et périssable.
   *     - Un lutin est une personne.
   * - Tests unitaires :
   *     - Un meuble est un objet
   *     - Un fruit est un objet mangeable, léger et périssable
   *     - un lutin est une personne bavarde
   *     - 💥 Le lutin est une personne bavarde
   *     - 💥 Un meuble est fixé
   */
  static readonly xNouveauType = /^(un(?:e)?) (\S+) est (?:un(?:e)?) (\S+)(?: ((?:.+?)(?:(?:, (?:.+?))*(?: et (?:.+?)))?))?$/i;

  /**
   * Précision pour un type d’élément.
   * - Découpage :
   *     - un/une(1) type(2) est attributs(3)
   * - Exemples :
   *     - Un meuble est fixé.
   *     - Un lutin est bavard, peureux et farceur.
   * - Tests unitaires
   *     - Un meuble est fixé
   *     - un chien est affectueux et poilu
   *     - Un lutin est bavard, peureux et farceur
   *     - 💥 Un meuble est un objet
   *     - 💥 Un fruit est un objet mangeable, léger et périssable
   *     - 💥 Un lutin est une personne bavarde
   *     - 💥 Le meuble est fixé
   */
  static readonly xPrecisionType = /^(un(?:e)?) (\S+) est (?!un |une )(?:((?:.+?)(?:(?:, (?:.+?))*(?: et (?:.+?)))?))$/i;

  // ================================================================================================
  //  ACTIONS
  // ================================================================================================

  /** nouvelle action
   * - verbe(1) [[à/de/…]\(2) ceci(3)[[ à/de/sur/…]\(4) cela(5)]] est une action[ qui concerne un|une|deux(6) typeObjetA(7) attributObjetA(8) [et un|une(9) typeObjetB(10) attributObjetB(11)]]
   * - ex: Jeter est une action qui concerne un objet possédé.
   * - ex: Examiner est une action qui concerne un objet visible.
   */
  static readonly xAction = /^((?:se |s’|s')?\S+(?:ir|er|re))(?:(?: (\S+))? (ceci)(?:(?: (\S+))? (cela))?)? est une action(?: qui concerne (un|une|deux|la|le) (\S+)(?: (\S+))?(?: et (un|une|la|le) (\S+)(?: (\S+))?)?)?$/i;

  /** Le joueur peut verbe(1) [déterminant(2) nom(3) epithete(4)]: instructions(5) */
  static readonly xActionSimple = /^Le joueur peut ((?:se |s’|s')?\S+(?:ir|er|re))(?: (le |la |les |l(?:’|')|des |de l(?:’|')|de la |du )(\S+|(?:\S+ (?:à |en |de(?: la)? |du |des |d'|d’)\S+))(?:(?: )((?!d'|d’)\S+))?)?(?: )?:(.+)?$/i;

  /** Description d'une action => [refuser|exécuter|terminer]\(1) verbe(2) [ceci(3) [(avec|et|vers) cela(4)]]: instructions(5) */
  static readonly xDescriptionAction = /^(refuser|exécuter|terminer) ((?:se |s’|s')?\S+(?:ir|er|re))(?:(?: \S+)? (ceci)(?:(?: \S+)? (cela))?)?\s?:(.+)$/i;

  /** condition -> si(1) {condition}(2), {conséquence}(3) */
  static readonly rRefuser = /^(si) (.+)(?:,)(.+)/i;

  // ================================================================================================
  //  RÈGLES
  // ================================================================================================

  /** condition/événement -> avant|après|remplacer\(1) {évènements}(2): {conséquences}(3) 
   * - avant(1) (aller au nord, aller au sud ou sortir)(2):( pata pata)(3)
   * - avant commencer le jeu : pata pata
   * - avant aller au nord, aller au sud ou sortir: pata pata
   */
  // static readonly rAvantApresRemplacerSi = /^(avant|après|apres|remplacer|si) (.+?)(?:(?: )?)(.+)/i;
  static readonly rAvantApresRemplacer = /^(avant|après|apres|remplacer) ((?:.+?)(?:(?:, (?:.+?))*(?: ou (?:.+?)))?)(?: )?:(.+)$/i;

  // ================================================================================================
  //  COMMANDES
  // ================================================================================================

  /** 
   * Généralement, une commande est composée d’un verbe à l’infinitf
   * parfois suivit puis d’un groupe nominal:
   * - aller au nord
   * - aller nord
   * - prendre la chemise rouge
   * - prendre sac
   * - effacer
   * - utiliser la clé rouge avec la porte
   * - utiliser la clé rouge avec la porte verte
   * - donner la pièce au pirate
   * - jeter l’épée
   * - => utiliser(1) la(2) clé(3) rouge(4) \[sur(6) la(7) porte(8) verte(9)](5)
   */
  static readonly xCommandeInfinitif = /^(\S+(?:ir|er|re))(?:(?: (?:avec|sur|sous|au|aux|à|au|vers|dans|hors|pour|en))? (le |la |les |l'|l’|du |de (?:la |l'|l’)|des |un |une |au |à (?:la |l'|l’)|à |mon |ma |mes |se |me )?(\S+?|(?:\S+? (?:à |en |au(?:x)? |de (?:la |l'|l’)?|du |des |d'|d’)\S+?)|(?:objets (?:dans|sous|sur) \S+))(?:(?: )((?!d'|d’)\S+?))?( (avec|sur|au|à|au|vers|dans|pour|sous) (le |la |les |l'|l’|du |de la|des |un |une |au |à l'|à l’|à la |à |mon |ma |mes |se |me )?(\S+?|(?:\S+? (?:à |en |de(?: la)? |du |des |d'|d’)\S+?))(?:(?: )((?!d'|d’)\S+?))?)?)?$/i;

  // -------------------------------------------
  //  PARLER, INTERROGER, MONTRER, DEMANDER , …
  // -------------------------------------------

  /**
   * 1) PARLER DE SUJET AVEC INTERLOCUTEUR (formulation qui évite les ambiguïtés avec les noms composés)
   * - => parler(1) de la(2) table à manger(3) abimée(4) avec(5) le(6) comte du bois(7) énervé(8)
   * - parler du baton avec le fermier
   * - parler du poisson rouge avec le pécheur énervé
   * - parler de la couronne magique avec le sorcier enflammé
   * - discuter de la table à manger avec le comte du bois
   */
  static readonly xCommandeParlerSujetAvecInterlocuteur = /^(parler|discuter) (du |de (?:la |l(?:’|'))?|des |d(?:’|')(?:un |une )?)(\S+?|(?:\S+? (?:à |en |au(?:x)? |de (?:la |l'|l’)?|du |des |d'|d’)\S+?))(?:(?: )(?!\(|ne |n’|n'|d’|d'|et |un |de )(\S+))? (avec) (le |la |l(?:’|')|les )?(\S+?|(?:\S+? (?:à |en |au(?:x)? |de (?:la |l'|l’)?|du |des |d'|d’)\S+?))(?:(?: )(?!\(|ne |n’|n'|d’|d'|et |un |de )(\S+))?$/i;

  /**
   * 2) PARLER AVEC INTERLOCUTEUR CONCERNANT SUJET (formulation qui évite les ambiguïtés avec les noms composés)
   * => discuter(1) avec le(2) capitaine du bateau(3) endormi(4) concernant(5) la(6) cabine de navigation(7) ensanglantée(8)
   * - parler au marchand ambulant concernant l’argent perdu
   * - discuter avec le coq au vin à propos de l’assaisonement
   * - parler à pigeon intelligent concernant miettes de pain rassies
   * - parler avec le capitaine à propos de carte aux trésors
   * - discuter avec le capitaine du bateau endormi concernant la cabine de navigation ensanglantée
   */
  static readonly xCommandeParlerAvecInterlocuteurConcernantSujet = /^(parler|discuter) (avec (?:la |le |les |l’|l')?|à (?:la |l’|l')?|au(?:x)? )(\S+?|(?:\S+? (?:à |en |au(?:x)? |de (?:la |l'|l’)?|du |des |d'|d’)\S+?))(?:(?: )(?!d’|d'|et |un |de |des |à |au |aux )(\S+))? (?:(à propos(?:| d’| d')?|concernant|sur) (les |un |une |du |des |(?:de )?(?:la |le |l’|l')?)?)(\S+?|(?:\S+? (?:à |en |au(?:x)? |de (?:la |l'|l’)?|du |des |d'|d’)\S+?))(?:(?: )(?!\(|ne |n’|n'|d’|d'|et |un |de )(\S+))?$/i;

  /**
   * 3) INTERROGER INTERLOCUTEUR CONCERNANT SUJET (formulation qui évite les ambiguïtés avec les noms composés)
   * - => interroger(1) le(2) comte du bois(3) sauvage(4) sur(5) les(6) elfs aux pouvoirs(7) maléfiques(8)
   * - interroger le fermier concernant la poule
   * - questionner le fermier géant à propos de la poule rousse
   * - questionner le boulanger sur de la farine grise
   * - questionner le marchand d’armes concernant une épée magique
   * - interroger elf sur de l’eau douce
   * - interroger le comte du bois sauvage sur les elfs aux pouvoirs maléfiques
   * - questionner les lutins concernant du bois à brûler
   * - interroger Dracula à propos d’une fiole
   */
  static readonly xCommandeQuestionnerInterlocuteurConcernantSujet = /^(interroger|questionner) (le |la |l(?:’|')|les )?(\S+?|(?:\S+? (?:à |en |au(?:x)? |de (?:la |l'|l’)?|du |des |d'|d’)\S+?))(?:(?: )(?!\(|ne |n’|n'|d’|d'|et |un |de )(\S+))? (?:(à propos(?:| d’| d')?|concernant|sur) (les |un |une |du |des |(?:de )?(?:la |le |l’|l')?)?)(\S+?|(?:\S+? (?:à |en |au(?:x)? |de (?:la |l'|l’)?|du |des |d'|d’)\S+?))(?:(?: )(?!\(|ne |n’|n'|d’|d'|et |un |de )(\S+))?$/i;

  /**
   * 4a) DEMANDER/DONNER/MONTRER SUJET À INTERLOCUTEUR
   * - => donner(1) la(2) pièce du trésor(3) maudit(4) (à la(6))(5) princesse aux souhaits(7) énervée(8)
   * - montrer poisson au chat
   * - donner la pièce du trésor maudit à la princesse aux souhaits énervée
   * - donner une pièce à la princesse
   * - demander de la nourriture à l’aubergiste
   * - demander poison à vendeur embulant
   * - parler du somnifère au magicien
   * - parler d’une fiole de poison au magicien maléfique
   * - donner saucisse à griller à vendeur
   * - montrer saucisse à griller à vendeur à viande
   * - parler de manger à l’aubergiste
   * - demander à boire à l’aubergiste
   */
  static readonly xCommandeDemanderSujetAInterlocuteur = /^(montrer|demander|donner|parler) (les |(?:d(?:’|'))?(?:un |une )|du |des |(?:de )?(?:la |le |l’|l')?)?((?:\S+? (?:à |en |au(?:x)? |de (?:la |l'|l’)?|du |des |d'|d’)\S+?)|\S+?|)(?:(?: )(?!à |au |aux )(\S+))? (au(?:x)? |à (la |l’|l')?)(\S+?|(?:\S+? (?:à |en |au(?:x)? |de (?:la |l'|l’)?|du |des |d'|d’)\S+?))(?:(?: )(?!\(|ne |n’|n'|d’|d'|et |un |de )(\S+))?$/i;

  /**
   * 4b) DEMANDER/DONNER À VERBE À INTERLOCUTEUR
   * - => demander(1)( )(2)(à dormir)(3) longtemps(4) (à l’(6))(5)aubergiste(7) cupide(8)
   * - demander à boire au tavernier
   * - demander à dormir longtemps à l’aubergiste cupide
   * - demander à l’aubergiste à dormir => pas pris en compte car pas un verbe
   */
  static readonly xCommandeDemanderAVerbeAInterlocuteur = /^(demander|donner) (à \S+(?:ir|er|re))(?:(?: )(?!à |au |aux )(\S+))? (au(?:x)? |à (la |l’|l')?)(\S+?|(?:\S+? (?:à |en |au(?:x)? |de (?:la |l'|l’)?|du |des |d'|d’)\S+?))(?:(?: )(?!\(|ne |n’|n'|d’|d'|et |un |de )(\S+))?$/i;

  /**
   * 5) PARLER AVEC INTERLOCUTEUR DE SUJET (formulation qui peut poser des soucis avec les noms composés)
   * - => discuter(1) (avec le)(2) comte(3) Dracula(4) (de la(6))(5) tournure(7) inatendue(8)
   * - parler à mousse de mat
   * - parler avec la magicienne étourdie du sort raté
   * - discuter avec Jean-Paul de Jason
   * - parler au magicien de la potion de vie
   * - parler au magicien du bois de la potion magique (=> souci)
   * - discuter avec le comte Dracula de la tournure inatendue
   */
  static readonly xCommandeParlerAvecInterlocuteurDeSujet = /^(parler|discuter) (du |de (?:la |l(?:’|'))?|des |d(?:’|')(?:un |une )?)(\S+?|(?:\S+? (?:à |en |au(?:x)? |de (?:la |l'|l’)?|du |des |d'|d’)\S+?))(?:(?: )(?!\(|ne |n’|n'|d’|d'|et |un |de )(\S+))? (avec) (le |la |l(?:’|')|les )?(\S+?|(?:\S+? (?:à |en |au(?:x)? |de (?:la |l'|l’)?|du |des |d'|d’)\S+?))(?:(?: )(?!\(|ne |n’|n'|d’|d'|et |un |de )(\S+))?$/i;

  /**
   * 6) MONTRER/DEMANDER/DONNER À INTERLOCUTEUR SUJET (formulation à déconseiller, on privilégie infinitif + compl. direct + compl. indirect)
   * - => donner(1) au(2) marquis(3) énervé(4)( )(5)une(6) potion de relaxation(7) magique(8)
   * - demander à magicien chemin
   * - donner au marquis énervé une potion de relaxation magique
   * - montrer à la tortue le chemin de la victoire
   */
  static readonly xCommandeDemanderAInterlocuteurSujet = /^(parler|discuter) (du |de (?:la |l(?:’|'))?|des |d(?:’|')(?:un |une )?)(\S+?|(?:\S+? (?:à |en |au(?:x)? |de (?:la |l'|l’)?|du |des |d'|d’)\S+?))(?:(?: )(?!\(|ne |n’|n'|d’|d'|et |un |de )(\S+))? (avec) (le |la |l(?:’|')|les )?(\S+?|(?:\S+? (?:à |en |au(?:x)? |de (?:la |l'|l’)?|du |des |d'|d’)\S+?))(?:(?: )(?!\(|ne |n’|n'|d’|d'|et |un |de )(\S+))?$/i;

  /** 
   * il y a aussi des commandes spéciales:
   * - position
   * - sorties
   * - inventaire
   * - aide
   * - aide parler
   */
  static readonly xCommandeSpeciale = /^(position|sorties|inventaire|aide)(?: (\S+))?$/i;

  // ================================================================================================
  //  CONDITIONS
  // ================================================================================================


  /**
   * [si] (le|la|les|...(2) xxx(3) yyy(4))|(ceci|cela))(1) verbe(5) [pas|plus(6)] complément(7)
   */
  static readonly xCondition = /^(?:si )?((?:(le |la |l(?:’|')|les )(\S+|(?:\S+ (?:à |en |au(?:x)? |de (?:la |l'|l’)?|du |des |d'|d’)\S+))(?:(?: )((?!d'|d’|ne|n'|n’)\S+))?)|ceci|cela|ici) (?:(?:n(?:'|’)|ne )?((?:se \S+)|est|vaut|possède|porte|contient|commence|réagit)(?: (pas|plus))?)(?: (.+))?$/i;

  /**
   * [si] la(1) porte(2) vers(3) (ceci|cela|[le ]nord(5))(4) [n’]est(6) pas(7) ouverte(8)
   * - si la sortie vers le nord est obstruée
   * - si la sortie vers l’ouest est innaccessible
   * - si la porte vers l’ouest est verrouillée
   * - si la porte vers ceci n’est pas ouverte
   */
  static readonly xConditionLaSortieVers = /^(?:si )?(la )(sortie|porte) (vers) (ceci|cela|(?:(?:le |l’|l')?(ouest|est|nord|sud|haut|bas|dedans|dehors|intérieur|extérieur))) (?:n’|n')?(est) (?:(pas|plus) )?(\S+)$/i;


  /**
   * [si] (le|la|les|…(2) xxx(3) yyy(4)|(ceci|cela))(1) (ne|n’) verbe(5) (ni|soit)(6) complément1(7) (ni|soit)(8) complément2(9) [(ni|soit) complément3(10)] [(ni|soit) complément3(11)]
   * - le joueur ne possède ni le chat ni le chien ni l’autruche ni la poule
   */
  static readonly xConditionNiSoit = /^(?:si )?((?:(le |la |les |l'|l’|du |de (?:la|l’|l')|des |un |une )(\S+)( (?!ne )\S+?)?)|ceci|cela) (?:n(?:'|’)|ne )?(est|vaut|possède|porte|contient)(?: (ni|soit) )(?:(.+?))(?: (\6) )(.+?)(?:(?: \6 )(.+?))?(?:(?: \6 )(.+?))?$/i;

  /**
   *  [si] (le|la|les|…(2) xxx(3) yyy(4)|(ceci|cela))(1) verbe(5)( pas| )(6)complément1(7) (et|ou)(8) complément2(9) [(et|ou) complément3(10)]  [(et|ou) complément3(11)]
   */
  static readonly xConditionOuEt = /^(?:si )?((?:(le |la |les |l'|l’|du |de (?:la|l’|l')|des |un |une )(\S+)( (?!ne )\S+?)?)|ceci|cela) (?:n(?:'|’)|ne )?(est|vaut|possède|porte|contient) (pas(?: ))?(.+?)(?: (et|ou) )(.+?)(?:(?: \8 )(.+?))?(?:(?: \8 )(.+?))?$/i;

  /**
   * [si] (le|la|les|…(2) xxx(3) yyy(4)|(ceci|cela))(1) verbe(5) [pas]\(6) complément1(7) (ainsi que|ou bien|(mais pas|plus|bien))(8) complément2(9)
   * - Si le joueur ne possède pas le jouet mais bien la trompette
   * - le seau contient la mèche mais pas le briquet
   * - Si ceci est vivant mais pas une personne
   * - le joueur possède la mèche ou le briquet
   * - Si l’inventaire contient le sucre et la farine
   * - le joueur possède le chat ou le chien ou l’autruche ou la poule
   */
  static readonly xConditionMaisPasEtOu = /^(?:si )?((?:(le |la |les |l'|l’|du |de (?:la|l’|l')|des |un |une )?(\S+)( (?!ne )\S+?)?)|ceci|cela) (?:n(?:'|’)|ne )?(est|vaut|possède|porte|contient)(?: (pas))? (?:(.+?)) (et|ou|mais (?:pas|plus|bien)) (.+?)$/i;

  // /**
  //  * si (le|la|les|...(2) xxx(3) yyy(4))|(ceci|cela)(1) verbe(5) pas(6) complément(7) (:|,) conséquences(8)
  //  */
  // static readonly xSiConditionConsequences = /^(?:si )((le |la |les |l'|l’|du |de la|des |un |une )(\S+)( \S+)?|ceci|cela) (?:(?:n(?:'|’)|ne )?((?:se \S+)|est|possède|contient|commence|réagit)(?: (pas|plus))?)(?: (.+))?(?: )?(?:,|:)(.+)$/i;

  /** 
   * si aucun(1) complément(2) attribut(3) (pour|vers)(4) (le|la|les|...(6) xxx(7) yyy(8))|(ceci|cela|ici)(5)
   */
  static readonly xConditionExistePourVers = /^(?:si )?((?:auc)?un(?:e)?) (\S+)(?: (?!n’|n'|existe)(\S+))? (?:(?:n’|n')?existe )?(pour|vers) ((le |la |les |l'|l’|du |de la|des |un |une )(\S+)(?:(?: )(\S+))?|ceci|cela|ici)$/i;

  /**
   * si (condition)(1) (:|,)(2) (consequences)(3)
   */
  static readonly xSeparerSiConditionConsequences = /^si (.+?)(?: )?(:|alors|,)(?: )?(.+)$/i;

  /**
   * (sinonsi|sinon)(1) :|, ({condition}consequences)(2)
   */
  static readonly xSeparerSinonConsequences = /^(sinonsi|sinon)(?: )?(?::|,)?(?: )?(.+)$/i;

  // ================================================================================================
  //  INSTRUCTIONS
  // ================================================================================================

  /**
   * Instruction : verbe + complément
   * - Dire '.......'
   * - Remplacer ....... par .....
   * - Changer ..........
   * 
   * - Tests unitaires :
   *     - continuer l’action
   *     - changer le joueur possède la canne à pèche
   *     - dire 
   *     - dire "Bonjour !"
   *     - 💥 la pomme est verte
   */
  static readonly xInstruction = /^(\S+(?:ir|er|re)) (.+)?$/i;

  /**
   * Phrase simple avec un verbe conjugé.
   * [le|la|les|...]\(1) (nom|ceci|cela)\(2) [attribut]\(3) [ne|n’|n'] ([se] verbe conjugé)(4) [pas|plus]\(5) complément(6).
   * - la porte secrète n’est plus fermée
   * - la canne à pèche rouge est ouverte
   * - ceci n’est plus vide
   * - cela se trouve dans le jardin
   * - les chauves-souris ne sont pas fixées
   * - la porte close est ouverte
   * 
   * - Tests unitaires :
   *     - la porte secrète n’est plus fermée
   *     - la canne à pèche rouge est ouverte
   *     - ceci n’est plus vide
   *     - 💥 l’action
   */
  static readonly xSuiteInstructionPhraseAvecVerbeConjugue = /^(le |la |l(?:’|')|les )?(\S+?|(?:\S+? (?:à |en |au(?:x)? |de (?:la |l'|l’)?|du |des |d'|d’)\S+?))(?:(?: )(?!ne|n’|n')(\S+))? (?:ne |n(?:'|’))?(?!vers)((?:se (?:trouve(?:nt)?))|(?:est|sont|vaut|valent|porte(?:nt)?|contien(?:nen)?t|possède(?:nt)?))(?: (pas|plus))?(?: (.+))?$/i;

  /**
   * - Manger tomate(2).
   * - Déplacer le(1) trésor(2) vers(4) le(5) joueur(6).
   * - Utiliser l’(1)arc à flèches(2) rouillé(3) avec(4) la(5) flèche(6) rouge(7).
   * - => déterminant(1) nom(2) épithète(3) préposition(4) déterminant(5) nom(6) épithète(7).
   * 
   * - Tests unitaires :
   *     - l'action
   *     - tomate
   *     - le trésor vers le joueur
   *     - l’arc à flèches rouillé avec la flèche rouge
   *     - 💥 manger le biscuit
   */
  static readonly xComplementInstruction1ou2elements = /^(le |la |l(?:’|')|les )?(\S+?|(?:\S+? (?:à |en |au(?:x)? |de (?:la |l'|l’)?|du |des |d'|d’)\S+?)|(?:objets (?:dans|sous|sur) \S+))(?:(?: )(\S+))?(?: (vers|avec|sur|sous|dans) (le |la |l(?:’|')|les )?(\S+|(?:\S+ (?:à |en |de(?: la)? |du |des |d'|d’)\S+))(?:(?: )(\S+))?)?$/i;

  // ================================================================================================
  //  DIVERS
  // ================================================================================================

  /**
   * Son(1) sac(2) est(3) ouvert(4)
   */
  static readonly xPhraseSimplePronom = /^(son |sa |ses )(\S+) ((?:se \S+)|\S+)( .+|)$/i;

  /** Tester s'il s'agit d'une section: partie/chapitre/scène du livre. 
   * - ex: Partie "Description du donjon".
   * - ex: Scène "Dans la cuisine".
   */
  static readonly xSection = /^( *)(partie|chapitre|scène)( ?)$/i;


  /** L'aide pour l'action manger(1) est  */
  static readonly xAide = /^L(?:'|’)aide pour (?:la commande|l(?:'|’)action) ((?:se |s'|s’)?.+) est(?: *)/i;

}