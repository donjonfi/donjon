
export const actions = `
-- Titre: "Actions de base pour Donjon FI".
-- Version: 2025-03-06-30207
-- Auteur: Jonathan Claes (https://donjon.fi)
-- Licence: Ce fichier est offert sous licence
--   "Creative Commons Attribution 4.0 International License".
--   Plus d'infos: https://creativecommons.org/licenses/by/4.0/

désactiver les actions de base.

-- =========================================
--   AFFICHER (AIDE, INVENTAIRE et SORTIES)
-- =========================================

action afficher ceci:

  définitions:
    Ceci est un intitulé.

  phase exécution:
    si ceci est l’aide:
      dire "{_Quelques commandes utiles_}
        {e}- {-aide {/parler/}-} : afficher l’aide d’une commande
        {e}- {-aller {/nord/}-} : aller vers le nord
        {e}- {-regarder-} : regarder autour de vous
        {e}- {-examiner {/table/}-} : examiner un élément pour trouver des objets ou des informations
        {e}- {-prendre {/épée/}-} : prendre un objet
        {e}- {-inventaire-} : afficher le contenu de votre inventaire
        {e}- {-parler à {/magicienne/}-} : parler à un personnage
        {e}- {-interroger {/couturier/} concernant {/tissu/}-} : faire parler un personnage concernant un sujet spécifique
        {e}- {-ouvrir {/porte/} avec {/clé dorée/}-} : ouvrir la porte à l’aide de la clé dorée".
    sinonsi ceci est l’inventaire:
      dire "Votre inventaire [si l’inventaire contient un objet]contient : [lister objets inventaire][sinon]est vide.[fin si]".
    sinonsi ceci est les sorties ou la sortie:
      dire "[sorties ici]".
    sinonsi ceci est le nombre de mots ou le nombre mots ou le nombre de caractères ou le nombre caractères:
      dire "@statistiques@".
    fin si

  phase épilogue:
    si ceci n’est 
      ni l’aide 
      ni l’inventaire 
      ni la sortie ni les sorties 
      ni le nombre de mots ni le nombre mots ni le nombre de caractères ni le nombre caractères, 
    dire "Je peux afficher l’aide, votre inventaire, les sorties ou le nombre de mots.".

fin action

action afficher ceci pour cela:

  définitions:
    ceci est un intitulé.
    cela est un intitulé.

  phase exécution:
    si ceci est l’aide, dire "[aide cela]".

  phase épilogue:
    si ceci n’est pas l’aide, dire "Je peux afficher l’aide d’une commande.{n}Ex: {-aide parler-}".

fin action

L'aide pour l'action afficher est "{*Afficher*}
  Permet d’afficher certains éléments du jeu.
  {+exemples+} :
  > {-afficher {/aide/}-}
  > {-afficher {/sorties/}-}
  > {-afficher {/inventaire/}-}
  {+raccourcis+} : {-aide-}, {-sor-}, {-i-}".

-- ================================
--   ALLER (vers direction)
-- ================================

action aller vers ceci:

  définitions:
    ceci est une direction.
    Le joueur est déplacé vers ceci.
    L’action déplace le joueur vers ceci.

  phase prérequis:
    si ceci est un lieu mais pas adjacent, refuser "[Intitulé ceci] [v être ipr pas ceci] adjacent[es ceci] à ma position actuelle.".
    si ceci n’est ni une direction ni un lieu, refuser "Je peux aller vers une direction ou un lieu adjacent. Ex: « nord » pour aller vers le nord.".
    si aucune sortie n’existe vers ceci, refuser "Je ne peux pas aller par là.".
    si aucune sortie accessible n’existe vers ceci, refuser "[obstacle vers ceci] Je ne peux pas y aller.".

  phase exécution:
    déplacer le joueur vers ceci.

  phase épilogue:
    exécuter l’action regarder.

fin action

-- ================================
--   ALLER (vers lieu)
-- ================================

action aller vers ceci:

  définitions:
    ceci est un lieu.
    Le joueur est déplacé vers ceci.
    L’action déplace le joueur vers ceci.

  phase prérequis:
    si le joueur se trouve dans ceci, refuser "Vous y êtes déjà.".
    si ceci est un lieu mais pas adjacent, refuser "[Intitulé ceci] [v être ipr pas ceci] adjacent[es ceci] à ma position actuelle.".
    si ceci n’est ni une direction ni un lieu, refuser "Je peux aller vers une direction ou un lieu adjacent. Ex: « nord » pour aller vers le nord.".
    si aucune sortie n’existe vers ceci, refuser "Je ne peux pas aller par là.".
    si aucune sortie accessible n’existe vers ceci, refuser "[obstacle vers ceci] Je ne peux pas y aller.".

  phase exécution:
    déplacer le joueur vers ceci.

  phase épilogue:
    exécuter l’action regarder.

fin action

L'aide pour l'action aller est "{*Aller*}
  Permet de d’aller vers la direction indiquée.
  {+exemples+} :
  > {-aller vers {/le nord/}-}
  > {-sud-}
  > {-monter-}
  > {-entrer dans {/la cabane/}-}
  {+raccourci+} : {-n-}, {-s-}, {-o-}, {-e-}, {-mo-}, {-de-}, {-h-}, {-b-}, {-en-}, {-so-}".

-- ============
--   ANNULER
-- ============

action annuler:

  phase exécution:
    annuler 1 tour.

fin action


-- ============
--   ASSOMMER
-- ============

action assommer ceci:

  phase prérequis:
    si ceci est le joueur, refuser "Il doit y avoir un autre moyen de résoudre votre problème.".
    si ceci n’est pas un vivant, refuser "[Pronom ceci] [v vivre ipr pas ceci].".

  phase épilogue:
    dire "Je suis contre la violence.".

fin action

-- ============
--   ATTENDRE
-- ============

action attendre:

  phase épilogue:
    dire "Vous attendez.".

fin action

-- ============
--   BOIRE
-- ============

action boire ceci:

  définitions:
    Ceci est prioritairement possédé.

  phase prérequis:
    si ceci est un vivant mais pas buvable, refuser "Vous avez de drôles d’idées.".
    si ceci est liquide mais pas buvable, refuser "Je ne boirais pas ça si j’étais vous.".
    si ceci n’est pas buvable, refuser "Ça ne se boit pas voyons !".
      -- on veut en manger 0…
    si quantitéCeci vaut 0, refuser "Je n’en bois donc aucun[e ceci].".
    -- si ceci n’est pas illimité et qu’on en demande plus que la quantité disponible
    si la quantité de ceci atteint 0 mais pas quantitéCeci, refuser "Il n’y en a pas autant !".

  phase exécution:
    -- diminuer la quantité de ceci en fonction de ce qu’on a bu.
    -- rem: si la quantité atteint 0, l’objet est automatiquement supprimé
    changer la quantité de ceci diminue de quantitéCeci.

  phase épilogue:
    si ceci est unique:
      dire "Je [l’ ceci]ai bu[es ceci]. Maintenant je ne [l’ ceci]ai plus.".
    sinon
      dire "J’ai bu [intitulé quantitéCeci].".
    fin si.

fin action

L'aide pour l'action boire est "{*Boire*}
  Permet d’ingérer un liquide.
  {+exemples+} :
  > {-boire {/la potion/}-}
  {+raccourci+} : {-bo-}".

  -- ===========
  --   BRÛLER
  -- ===========

action brûler ceci:

  phase prérequis:
    si ceci est le joueur, refuser "Ça ne va pas ?".
    si ceci est un vivant, refuser "Vous avez de drôles d’idées.".  

  phase épilogue:
    dire "Ça peut encore servir.".
    
fin action

-- ===========
--   CASSER
-- ===========

action casser ceci:

  phase prérequis:
    si ceci est le joueur, refuser "Ça ne va pas ?".
    si ceci est un vivant, refuser "Vous avez de drôles d’idées.".

  phase épilogue:
    dire "Ça peut encore servir.".

fin action

-- ===========
--   CHANTER
-- ===========
action chanter:
  dire "Vous entonnez une chanson joyeuse.".
fin action.

-- ======================
--   COMMENCER (jeu, nouvelle partie)
-- ======================
action commencer ceci:

  définitions:
    ceci est un intitulé.
    
  phase prérequis:
    si ceci n’est ni le jeu ni la nouvelle partie, refuser "Je peux seulement commencer le jeu.".
    si ceci est le jeu et si le jeu est commencé, refuser "Le jeu a déjà commencé.".
    
  phase exécution:
    -- début du jeu
    si ceci vaut le jeu:
      -- déplacer le joueur pour provoquer la mise à jour de 
      -- la présence des objets et de l’adjacence des lieux
      changer le joueur se trouve dans ici.
      -- afficher ce que voit le joueur.
      exécuter la commande "regarder".
    -- commencer une nouvelle partie (après la fin du jeu par exemple)
    sinonsi ceci vaut une nouvelle partie:
      exécuter la commande "recommencer".
    fin si
    
fin action

-- ======================
--   CONTINUER (le jeu)
-- ======================
action continuer ceci:

  définitions:
    ceci est un intitulé.
    
  phase prérequis:
    si ceci n’est pas le jeu, refuser "Je peux seulement continuer le jeu.".
    si ceci est le jeu et si le jeu n’est pas commencé, refuser "Le jeu n’a pas encore commencé.".
    
  phase exécution:
    si ceci est le jeu:
      dire "{/{+(reprise de la partie)+}/}{N}".
      -- afficher ce que voit le joueur.
      exécuter la commande "regarder".
    fin si
    
fin action

-- ============
--   CRIER
-- ============
action crier:
  phase épilogue:
    dire "Vous criez un bon coup.".
fin action

action crier sur ceci:
  phase prérequis:
    si ceci est le joueur, refuser "Vous vous criez dessus. (Ça va passer…)".
  phase épilogue:
    dire "Vous criez sur [intitulé ceci]. (Ça ne sert à rien.)".
fin action

-- ===========
--   DANSER
-- ===========
action danser:
  phase épilogue:
    dire "Vous réalisez une petite danse.".
fin action

-- ==============
--   DEMANDER
-- ==============

action demander ceci:
  définitions:
    ceci est un intitulé prioritairement mentionné.
  phase épilogue:
    dire "Je sais demander mais il faut me dire quoi et à qui.".
fin action

action demander ceci à cela:
  définitions:
    Ceci est un intitulé prioritairement mentionné.
    Cela est un objet vu et visible.
  phase prérequis:
    si cela n'est ni une personne ni parlant ou si cela est muet, refuser "[Intitulé ceci] ne parle pas.".
  phase exécution:
    si cela réagit, exécuter réaction de cela concernant ceci.
  phase épilogue:
    si cela ne réagit pas, dire "(Aucune réponse satisfaisante.)".
fin action

L'aide pour l'action demander est "{*Demander*}
Permet de demander quelque chose à une personne.
{+exemples+} :
> {-demander {/une chambre/} à {/l'aubergiste/}-}
> {-demander {/à manger/} au {/cuisinier/}-}
{+Voir également+} : {-parler-}, {-questionner-}, {-montrer-} et {-donner-}.
{+raccourci+} : {-dem-}".

-- =================
--   DÉVERROUILLER
-- =================
action déverrouiller ceci avec cela:
  phase épilogue:
    dire "Ça n’a pas fonctionné.".
fin action

-- ===========
--   DORMIR
-- ===========
action dormir:
  phase épilogue:
    dire "Vous prenez un repos bien mérité, quoi qu’un peu inconfortable.".
fin action

action dormir sur ceci:
  phase prérequis:
    si ceci est le joueur, refuser "Pardon ?".
    si ceci n’est pas un support, refuser "Je ne sais pas me coucher dessus.".
  phase épilogue:
    dire "Vous prenez un repos bien mérité.".
fin action

-- ==================
--   EFFACER (écran)
-- ==================
action effacer:
  phase exécution:
    effacer l’écran.
  phase épilogue:
    exécuter l’action regarder.
fin action

action effacer ceci:
  définitions:
    ceci est un intitulé.
  phase prérequis:
    si ceci n’est pas l’écran, refuser "Je peux uniquement effacer l’écran.".
  phase exécution:
    effacer l’écran.
  phase épilogue:
    exécuter l’action regarder.
fin action
  
L'aide pour l'action effacer est "{*Effacer*}
Permet d’effacer l’écran
{+exemples+} :l
> {-effacer-}
> {-effacer {/l’écran/}-}
{+raccourci+} : {-ef-}".

-- ===========
--   DÉPLACER
-- ===========
action déplacer ceci:
  phase prérequis:
    si ceci est le joueur, refuser "La commande {-aller-} devrait vous convenir.".
    si ceci est fixé, refuser "[Pronom ceci] [v être ipr ceci] fixé[es ceci].".
    si ceci est liquide ou gazeux, refuser "Je ne sais déplacer que les objets solides.".
  phase exécution:
    changer ceci est déplacé.
  phase épilogue:
    dire "Ça n’a rien donné.".
fin action


-- ==========
--   DONNER
-- ==========
action donner ceci à cela:

  définitions:
    Ceci est un objet visible, accessible et possédé.
    Cela est un vivant vu et visible.

  phase prérequis:
    si ceci est le joueur, refuser "Ça ne va pas ?".
    si cela n'est pas une personne, refuser "Je préfère donner ça à quelqu'un.".
    -- on veut en jeter 0…
    si quantitéCeci vaut 0, refuser "Je n’en donne donc aucun.".
    -- si ceci n’est pas illimité et qu’on en demande plus que la quantité disponible
    si la quantité de ceci atteint 0 mais pas quantitéCeci, refuser "Il n’y en a pas autant !".

  phase exécution:
    déplacer quantitéCeci ceci vers cela.

  phase épilogue:
    dire "[Pronom cela] [v avoir ipr cela] reçu [intitulé quantitéCeci].".

fin action

L'aide pour l'action donner est "{*Donner*}
Permet de donner un objet que vous possédez à quelqu'un.
{+exemples+} :
> {-donner {/la poudre magique/} à {/la magicienne/}-}
> {-donner {/la pomme/} au {/nain/}-}
{+raccourci+} : {-do-}".

-- ===========
--   ÉCOUTER
-- ===========
action écouter:
  phase épilogue:
    dire "Vous prenez le temps d’écouter les sons qui vous entourent.".
fin action

action écouter ceci:
  définitions:
    ceci est un objet présent.
  phase prérequis:
    si ceci est le joueur, refuser "Vous prenez le temps de vous écouter. Hein ?".
  phase épilogue:
    dire "Vous prenez le temps d’écouter [intitulé ceci].".
fin action

-- =============
--   EMBRASSER
-- =============
action embrasser:
  phase prérequis:
    si ceci est le joueur, refuser "Pardon ?".
    si ceci n’est pas un vivant, refuser "Vous avez de drôles d’idées.".
  phase épilogue:
    dire "Vous lui avez demandé son avis ?".
fin action

-- ============
--   ÉNERVER
-- ============
action énerver ceci:
  définitions:
    ceci est un objet vu et visible.
  phase prérequis:
    si ceci est le joueur, refuser "Vous vous énervez un bon coup.".
    si ceci n’est pas un vivant, refuser "Rien à faire, [pronom ceci] reste impassible.".
  phase épilogue:
    dire "Vous essayez d’énerver [intitulé ceci] sans succès.".
fin action

-- ============
--   ENLACER
-- ============
action enlacer ceci:
  phase prérequis:
    si ceci est le joueur, refuser "Vous vous faites un gros câlin.".
    si ceci n’est pas un vivant, refuser "Vous avez de drôles d’idées.".
  phase épilogue:
    dire "Vous lui avez demandé son avis ?".
fin action

-- ===========
--   ENLEVER
-- ===========
action enlever ceci:
  définitions:
    ceci est prioritairement porté.
  phase prérequis:
    si ceci est portable mais pas porté, refuser "Vous ne portez pas [intitulé ceci].".
    si ceci est le joueur, refuser "Vous organisez votre enlèvement... et votre sauvetage.".
    si ceci est fixé, refuser "[Pronom ceci] [v être ipr ceci] fixé[es ceci].".
  phase exécution:
    changer le joueur ne porte plus ceci.
  phase épilogue:
    si ceci est portable:
      dire "Vous ne portez plus [intitulé ceci].".
    sinon
      dire "Essayons autre chose.".
    fin si
fin action


-- ============
--   EXAMINER
-- ============

action examiner ceci:

  définitions:
    Ceci est une direction.

  phase prérequis:
    si ceci n’est pas une direction, refuser "Je ne comprends pas ce que vous voulez examiner.".

  phase exécution:
    -- s’il n’y a rien dans cette direction
    si aucune sortie n’existe vers ceci:
      dire "Il n’y a rien dans cette direction.".
    -- s’il y a un lieu avec un aperçu dans cette direction
    sinonsi un aperçu existe pour ceci:
      dire "[aperçu ceci]".
    -- s’il y a un lieu sans aperçu dans cette direction
    sinon
      dire "Le mieux est de se rendre vers [intitulé ceci].".
    fin si
fin action

action examiner ceci:

  définitions:
    Ceci est un lieu prioritairement visible et mentionné.

  phase exécution:
    -- > lieu actuel
    si le joueur se trouve dans ceci:
      exécuter l’action regarder.
    -- > lieu adjacent
    sinon
      -- >> avec aperçu
      si un aperçu existe pour ceci:
        dire "[aperçu ceci]".
      -- >> sans aperçu, déjà visité
      sinonsi ceci est visité:
        dire "Il faudrait y retourner.".
      -- >> sans aperçu, pas encore visité
      sinon
        dire "Pour en savoir plus, il faut s’y rendre.".
      fin si
    fin si
fin action

action examiner ceci:

  définitions:
    Ceci est un objet prioritairement visible et mentionné.

  phase prérequis:
    si ceci n’est ni un élément ni une direction, refuser "Je ne comprends pas ce que vous voulez examiner.".
    si ceci n’est ni visible ni l’inventaire ni adjacent ni une direction, refuser "Je ne [le ceci] vois pas actuellement.".
    si ceci est un objet et visible mais pas vu, refuser "Je ne [l’ ceci]ai pas encore vu[es ceci].".
    si ceci est une personne, refuser "Pas sûr qu'[pronom ceci] [v avoir spr ceci] envie de jouer au docteur.".

  phase exécution:
      changer ceci est familier.
      changer ceci n’est plus discret.
      changer ceci n’est plus intact.
    -- objet
    si ceci est un objet:
      -- sous l’objet
      si la préposition de ceci est sous:
        dire "[décrire objets sous ceci]".
      -- autre préposition ou absence de préposition
      sinon
      -- > description de l’objet
        dire "[description ceci]".
        -- > statut de l’objet
        si ceci est une porte ou un contenant,
          dire "[statut ceci]".
        -- > contenu de l’objet
        -- >> contenant ouvert
        si ceci est un contenant et ouvert :
          dire "[décrire objets dans ceci]".
        -- >> contenant fermé mais transparent
        sinonsi ceci est un contenant et fermé et transparent :
          dire "[décrire objets dans ceci]".
        -- >> support
        sinonsi ceci est un support :
            dire "[décrire objets sur ceci]".
        fin si
      fin si
      -- >> objet pas accessible
      si ceci n'est pas accessible, 
        dire " [Pronom ceci] [v être ipr pas ceci] accessible[s ceci].".
    -- lieu
    sinonsi ceci est un lieu :
     
    -- direction
    sinonsi ceci est une direction:
   
    -- inconnu
    sinon
      dire "Hum ceci [intitulé ceci] n’est ni un objet ni un lieu. Je ne connais pas.".
    fin si    
fin action

action examiner ceci:
  définitions:
    Ceci est un spécial.
  
  phase prérequis:
    si ceci n’est pas l’inventaire, refuser "Je ne comprends pas ce que vous voulez examiner.".

  phase exécution:
    exécuter la commande "afficher l’inventaire".
fin action

L'aide pour l'action examiner est "{*Examiner*}
  Permet d'examiner un élément du jeu pour avoir des détails ou trouver un objet.
  {+exemples+} :
  > {-examiner {/l'arbre/}-}
  > {-examiner {/l'épée/}}
  {+raccourci+} : {-x-}, {-ex-}".

-- ==========
--   FAIRE
-- ==========
action faire ceci:
  définitions:
    ceci est un intitulé.

  phase prérequis:
    si ceci ne vaut pas une pause, refuser "Je sais seulement faire une pause.".

  phase exécution:
    si ceci vaut une pause:
      interrompre la partie.
      dire "{/Partie interrompue./}".
      afficher l’écran temporaire.
      dire "Jeu en pause.".
      attendre une touche.
      continuer la partie.
      afficher l’écran précédent.
      dire "{/Reprise de la partie./}".
    fin si
fin action

-- ==========
--   FERMER
-- ==========
action fermer ceci:
  
  définitions:
    ceci est prioritairement ouvert et ouvrable.

  phase prérequis:
    si ceci est le joueur, refuser "Pardon ?".
    si ceci n'est pas ouvrable, refuser "[Pronom ceci] [v se fermer ipr pas ceci].".
    si ceci est verrouillé, refuser "[Pronom ceci] [v être ipr ceci] verrouillé[es ceci].".
    
  phase exécution:
    changer ceci est fermé.
    changer ceci n’est plus intact.
    
  phase épilogue:
    dire "[Pronom ceci] [v être ipr ceci] fermé[es ceci].".

fin action

L'aide pour l'action fermer est "{*Fermer*}
Permet de fermer un objet, une porte, une trappe, ...
{+exemples+} :
> {-fermer {/la grille/}-}
> {-fermer {/la boite/}-}
{+raccourci+} : {-fe-}".

-- ===========
--   FRAPPER
-- ===========
action frapper ceci:
  phase prérequis:
    si ceci est le joueur, refuser "Ça ne va pas ?".
  phase épilogue:
    dire "Je suis contre la violence.".
fin action

-- ===========
--   GÉNÉRER
-- ===========
action générer solution:
  dire "@générer-solution@".
fin action

-- ============
--   INSULTER
-- ============
action insulter ceci:
  définitions:
    Ceci est un concept mentionné.
  phase prérequis:
    si ceci est le joueur, refuser "Vous vous insultez copieusement. (Ça va passer…)".
  phase épilogue:
    dire "Vous insultez copieusement [intitulé ceci].".
fin action

-- ===========================
--   INTERROGER (questionner)
-- ===========================
action interroger ceci:
  définitions:
    ceci est prioritairement parlant.
  phase prérequis:
    si ceci n'est ni une personne ni parlant ou si ceci est muet, refuser "[Intitulé ceci] ne parle pas.".
    si ceci est le joueur, refuser "Je connais déjà la réponse.".
  phase exécution:
    si ceci réagit, exécuter réaction de ceci.
  phase épilogue:
    si ceci ne réagit pas, dire "(Et ils eurent une conversation peu intéressante.)".
fin action

action interroger ceci concernant cela:
  définitions:
    ceci est un objet vu, visible et accessible prioritairement parlant.
    cela est un intitulé prioritairement mentionné.
  phase prérequis:
    si ceci n'est ni une personne ni parlant ou si ceci est muet, refuser "[Intitulé ceci] ne parle pas.".
  phase exécution:
    si ceci réagit, exécuter réaction de ceci concernant cela.
  phase épilogue:
    si ceci ne réagit pas, dire "(Aucune réponse satisfaisante.)".
fin action

L'aide pour l'action interroger est "{*Interroger*}
  Permet d'interroger une personne sur un sujet spécifique.
  {+exemples+} :
  > {-interroger {/l'aubergiste/} concernant {/le menu/}-}
  > {-interroger {/le villageois/} à propos de {/la fête/}-}
  > {-interroger {/roi/} sur {/tournois/}-}
  {+Voir également+} : {-parler-}, {-demander-}, {-montrer-} et {-donner-}.
  {+raccourci+} : {-int-}".


-- =========
--   JETER
-- =========
action jeter ceci:
  définitions:
    ceci est prioritairement possédé.
  phase prérequis:
    si ceci est fixé, refuser "[Pronom ceci] [v être ipr ceci] fixé[es ceci].".
    si ceci est le joueur, refuser "Je préfère ne pas me jeter. Drôle d'idée.".
    si ceci est un vivant, refuser "Je suis contre la violence.".
    si ceci est liquide ou gazeux, refuser "Je ne sais jeter que les objets solides.".
    -- on veut en jeter 0…
    si quantitéCeci vaut 0, refuser "Je n’en jette donc aucun.".
    -- si ceci n’est pas illimité et qu’on en demande plus que la quantité disponible
    si la quantité de ceci atteint 0 mais pas quantitéCeci, refuser "Il n’y en a pas autant !".
  phase exécution:
    déplacer quantitéCeci ceci vers ici.
  phase épilogue:
    dire "Je [l' quantitéCeci]ai jeté[es quantitéCeci].".
fin action

action jeter ceci vers cela:
  définitions:
    ceci est prioritairement possédé.
    cela est un objet vu et visible.
  phase prérequis:
    si ceci n'est pas accessible, refuser "[Intitulé ceci] [v être ipr pas ceci] accessible[s ceci].".
    si ceci est le joueur, refuser "Je préfère ne pas me jeter. Drôle d'idée.".
    si cela est un vivant, refuser "Je suis contre la violence.".
    si ceci est liquide ou gazeux, refuser "Je ne sais jeter que les objets solides.".
    -- on veut en jeter 0…
    si quantitéCeci vaut 0, refuser "Je n’en jette donc aucun.".
    -- si ceci n’est pas illimité et qu’on en demande plus que la quantité disponible
    si la quantité de ceci atteint 0 mais pas quantitéCeci, refuser "Il n’y en a pas autant !".
  phase exécution:
    -- jeter vers un support -> arrive sur le support
    si cela est un support :
      déplacer quantitéCeci ceci vers cela.
    -- jeter vers autre chose -> arrive par terre
    sinon
      déplacer quantitéCeci ceci vers ici.
    fin si.
  phase épilogue:
    dire "Je [l' quantitéCeci]ai jeté[es quantitéCeci].".
fin action


L'aide pour l'action jeter est "{*Jeter*}
  Permet de jeter un objet que vous possédez sur le sol.
  {+exemple+} :
  > {-jeter {/la fleur/}-}
  {+raccourci+} : {-j-}, {-je-}".

-- ===========
--    LÂCHER
-- ===========
action lâcher ceci:
  définitions:
    ceci est un objet visible, accessible et possédé.
  phase prérequis:
    -- on veut en jeter 0…
    si quantitéCeci vaut 0, refuser "Je n’en lâche donc aucun.".
    -- si ceci n’est pas illimité et qu’on en demande plus que la quantité disponible
    si la quantité de ceci atteint 0 mais pas quantitéCeci, refuser "Il n’y en a pas autant !".
  phase exécution:
    déplacer quantitéCeci ceci vers ici.
  phase épilogue:
    dire "Je [l' quantitéCeci]ai lâché[accord quantitéCeci].".
fin action

-- ===========
--    LIRE
-- ===========
action lire ceci:
  définitions:
    ceci est un objet vu et visible prioritairement lisible.
  phase prérequis:
    si ceci est le joueur, refuser "Vous lisez en vous. Hein ?".
    si aucun texte pour ceci, refuser "Je ne vois rien à lire.".
  phase exécution:
    changer ceci est lu.  
  phase épilogue:
    dire "[texte ceci]".
fin action

-- ===========
--   MANGER
-- ===========
action manger ceci:
  définitions:
    Ceci est prioritairement possédé.
  phase prérequis:
    si ceci est un vivant mais pas mangeable, refuser "Vous avez de drôles d’idées.".
    si ceci n’est pas mangeable, refuser "Ça ne se mange pas voyons !".
    -- on veut en manger 0…
    si quantitéCeci vaut 0, refuser "Je n’en mange donc aucun[e ceci].".
    -- si ceci n’est pas illimité et qu’on en demande plus que la quantité disponible
    si la quantité de ceci atteint 0 mais pas quantitéCeci, refuser "Il n’y en a pas autant !".
  phase exécution:
    -- diminuer la quantité de ceci en fonction de ce qu’on a mangé.
    -- rem: si la quantité atteint 0, l’objet est automatiquement supprimé
    changer la quantité de ceci diminue de quantitéCeci.
  phase épilogue:
    si ceci est unique:
      dire "Je [l’ ceci]ai mangé[es ceci]. Maintenant je ne [l’ ceci]ai plus.".
    sinon
      dire "J’ai mangé [intitulé quantitéCeci].".
    fin si.
fin action

L'aide pour l'action manger est "{*Manger*}
  Permet d’absorber un aliment.
  {+exemples+} :
  > {-manger {/la pomme/}-}
  {+raccourci+} : {-ma-}".

-- ===========
--   METTRE
-- ===========

-- mettre ceci (sur moi)
action mettre ceci:
  définitions:
    ceci est prioritairement portable, enfilable, équipable ou chaussable.
  phase prérequis:
    si ceci est le joueur, refuser "Vous avez de drôles d'idées.".
    si ceci n'est ni portable ni enfilable ni équipable ni chaussable, refuser "Je ne peux pas mettre [intitulé ceci] sur moi.".
    si ceci est fixé, refuser "[Intitulé ceci] [v être ipr ceci] fixé[es ceci].".
  phase exécution:
    changer le joueur porte ceci.
  phase épilogue:
    si ceci est enfilé:
      dire "Vous avez enfilé [intitulé ceci].".
    sinonsi ceci est chaussé:
      dire "Vous avec chaussé [intitulé ceci].".
    sinonsi ceci est équipé:
      dire "Vous avez équipé [intitulé ceci].".
    sinon:
      dire "Vous portez [intitulé ceci].".
    fin si.
fin action

-- mettre ceci sur/dans cela
action mettre ceci dans cela:
  définitions:
    
  phase prérequis:
    si ceci est fixé, refuser "[Intitulé ceci] [v être ipr ceci] fixé[es ceci].".
    si cela n'est ni un support ni un contenant ni un vivant, refuser "[Intitulé cela] n’est ni un contenant ni un support ni le joueur.".
    si cela est un contenant et fermé, refuser "[Intitulé cela] [v être ipr cela] fermé[es cela].".
    si ceci est liquide et si cela est un contenant et perméable, refuser "Ça va passer à travers.".
    si ceci est liquide et si cela est un support, refuser "Ça va couler.".
    si ceci est gazeux et si cela est un contenant ou un support, refuser "Ça va s'évaporer.".

  phase exécution:
    si cela est un support:
      déplacer quantitéCeci ceci sur cela.
    sinonsi cela est un contenant:
      déplacer quantitéCeci ceci dans cela.
    sinonsi cela est un vivant mais pas le joueur:
      déplacer quantitéCeci ceci sur cela.
    sinonsi cela est le joueur:
      exécuter l’action mettre ceci.
    fin si.

  phase épilogue:
    si (cela est un support ou un contenant) ou que (cela est vivant mais pas le joueur):
      dire "C’est fait.".
    fin si.
fin action

L'aide pour l'action mettre est "{*Mettre / Poser / Tenir / Enfiler / Chausser*}
  Permet de poser un objet sur un support ou de le mettre dans un contenant.
  {+exemples+} :
  > {-mettre {/la pomme/} dans {/le panier/}-}
  > {-poser {/l'épée/} sur {/la table/}-}
  > {-tenir {/le bouclier/}-}
  > {-enfiler {/la tunique/}-}
  > {-chausser {/les bottes/}-}
  {+raccourci+} : {-me-}, {-po-}, {-te-}, {-enf-}, {-ch-}".

-- ===========
--   MONTRER
-- ===========

action montrer ceci à cela:
  définitions:
    ceci est un objet vu et visible prioritairement possédé.
    cela est un vivant vu et visible.
  phase prérequis:
    si cela est le joueur, refuser "Je pense qu'[pronom cela] me voit déjà.".
  phase exécution:
    si cela réagit, exécuter réaction de cela concernant ceci.
  phase épilogue:
    si cela ne réagit pas, dire "(Aucune réaction satisfaisante.)".
fin action

L'aide pour l'action montrer est "{*Montrer*}
  Permet de montrer un objet à une personne.
  {+exemples+} :
  > {-montrer {/la baguette/} à {/la fée/}-}
  > {-montrer {/chaussette/} au {/lutin/}-}
  {+Voir également+} : {-parler-}, {-questionner-}, {-demander-} et {-donner-}.
  {+raccourci+} : {-mon-}".

-- ==========
--   OUVRIR
-- ==========
-- ouvrir ceci
action ouvrir ceci:
  définitions:
    ceci est prioritairement ouvrable.
  phase prérequis:
    si ceci est le joueur, refuser "Pardon ?".
    si ceci n'est pas ouvrable, refuser "[Pronom ceci] [v s’ouvrir ipr pas ceci].".
    si ceci est verrouillé, refuser "[Pronom ceci] [v être ipr ceci] verrouillé[es ceci].".
  phase exécution:
    changer ceci est ouvert.
    changer ceci n’est plus intact.
  phase épilogue:
    dire "[Pronom ceci] [v être ipr ceci] ouvert[es ceci].".
    si ceci est un contenant, dire "[décrire objets dans ceci]".
fin action

-- ouvrir ceci avec cela
action ouvrir ceci avec cela:
  définitions:
    ceci est prioritairement ouvrable.
  phase prérequis:
    refuser "Ça n'a pas fonctionné.".
fin action

L'aide pour l'action ouvrir est "{*Ouvrir*}
  Permet d'ouvrir un objet, une porte, une trappe, ...
  {+exemples+} :
  > {-ouvrir {/la porte rouge/}-}
  > {-ouvrir {/le coffre/}-}
  > {-ouvrir {/le coffre/} avec {/la clé rouge/}-}
  {+raccourci+} : {-ou-}".

-- =====================
--   PARLER (discuter)
-- =====================
-- parler avec ceci
action parler avec ceci:
  définitions:
    ceci est un objet vu et visible prioritairement parlant.
  phase prérequis:
    si ceci n'est ni une personne ni parlant ou si ceci est muet, refuser "[Intitulé ceci] ne parle pas.".
    si ceci est le joueur, refuser "Vous entamez un monologue.".
  phase exécution:
    si ceci réagit, exécuter réaction de ceci.
  phase épilogue:
    si ceci ne réagit pas, dire "(Et ils eurent une conversation peu intéressante.)".
fin action

action parler avec ceci concernant cela:
  définitions:
    ceci est un objet vu et visible prioritairement parlant.
    cela est un intitulé prioritairement mentionné.
  phase prérequis:
    si ceci n'est ni une personne ni parlant ou si ceci est muet, refuser "[Intitulé ceci] ne parle pas.".
    si ceci est le joueur, refuser "Je connais déjà la réponse.".
  phase exécution:
    si ceci réagit, exécuter réaction de ceci concernant cela.
  phase épilogue:
    si ceci ne réagit pas, dire "(Aucune réponse satisfaisante.)".
fin action

L'aide pour l'action parler est "{*Parler*}
  Permet de parler avec une personne. Il est possible de préciser un sujet spécifique.
  {+exemples+} :
  > {-parler avec {/la magicienne/}-}
  > {-parler avec {/le pirate/} concernant {/la carte/}-}
  > {-parler de {/mine/} avec {/nain jaune/} -}
  > {-parler du {/temps/} avec {/l'aubergiste/}-}
  Voir également {-demander-}, {-interroger-}, {-montrer-} et {-donner-}.
  {+raccourci+} : {-par-}".

-- ============
--    PENSER
-- ============
-- On peut penser à un élément du jeu ou bien à un concept.
-- crédit: action basée sur celle proposée par KrisDoC.
action penser à ceci:
  définitions:
    ceci est un intitulé prioritairement mentionné.
  phase exécution:
    si ceci est un concept et si une pensée existe pour ceci:
        dire "[p pensée ceci]".
        changer ceci est évoqué.
    sinon
        dire "Ça ne m’évoque rien.".
    fin si
fin action

-- ===========
--    PÉTER
-- ===========
action péter:
  phase épilogue:
    dire "Vous faites un bruit malpoli.".
fin action

-- ===========
--   POSER
-- ===========
-- poser ceci
action poser ceci:
  définitions:
    ceci est un objet visible, accessible et possédé.
  phase prérequis:
    si ceci est liquide ou gazeux, refuser "Je ne sais poser que les objets solides.".
    -- on veut en jeter 0…
    si quantitéCeci vaut 0, refuser "Je n’en pose donc aucun.".
    -- si ceci n’est pas illimité et qu’on en demande plus que la quantité disponible
    si la quantité de ceci atteint 0 mais pas quantitéCeci, refuser "Il n’y en a pas autant !".
  phase exécution:
    -- todo: mettre sur le sol
    déplacer quantitéCeci ceci vers ici.
  phase épilogue:
    dire "Je [l' quantitéCeci]ai posé[es quantitéCeci].".
fin action

-- poser ceci sur cela
action poser ceci sur cela:
  définitions:
    ceci est un objet visible, accessible et possédé.
    cela est un support.
  phase prérequis:
    si ceci est liquide ou gazeux, refuser "Je ne sais poser que les objets solides.".
    -- on veut en jeter 0…
    si quantitéCeci vaut 0, refuser "Je n’en pose donc aucun.".
    -- si ceci n’est pas illimité et qu’on en demande plus que la quantité disponible
    si la quantité de ceci atteint 0 mais pas quantitéCeci, refuser "Il n’y en a pas autant !".
  phase exécution:
    exécuter la commande "mettre [intitulé ceci] sur [intitulé cela]".
fin action

-- ===========
--   POUSSER
-- ===========
action pousser ceci:
  phase prérequis:
    si ceci est le joueur, refuser "Je suis dans le chemin ?".
    si ceci est liquide ou gazeux, refuser "Je ne sais pousser que les objets solides.".
  phase exécution:
    changer ceci est déplacé.
  phase épilogue:
    dire "Je [l’ ceci]ai poussé[es ceci] mais ça semble n’avoir rien déclenché.".
fin action

-- ===========
--   PRENDRE
-- ===========
action prendre ceci:
  définitions:
    ceci est prioritairement disponible.
  phase prérequis:
    si ceci est possédé, refuser "Vous [l’ ceci]avez déjà.".
    si ceci est le joueur, refuser "Pardon ?".
    si ceci est une personne ou un animal, refuser "Ça ne me parait pas très prudent.".
    si ceci est un décor ou décoratif, refuser "Je préfère ne pas m’encombrer avec ça.".
    si ceci est fixé, refuser "[Pronom ceci] [v être ipr ceci] fixé[es ceci].".
    si ceci est liquide et que l’inventaire est perméable, refuser "Je ne sais pas [le ceci] mettre directement dans l’inventaire.".
    si ceci est gazeux, refuser "Ça va s’évaporer".
    -- on veut en prendre 0…
    si quantitéCeci vaut 0, refuser "Je n’en prends donc aucun.".
    -- si ceci n’est pas illimité et qu’on en demande plus que la quantité disponible
    si la quantité de ceci atteint 0 mais pas quantitéCeci, refuser "Il n’y en a pas autant !".

  phase exécution:
    -- unique => déplacement
    si ceci est unique:
      déplacer ceci vers joueur.
    -- multiple limité => déplacement
    sinonsi ceci est multiple mais pas illimité:
      déplacer quantitéCeci ceci vers joueur.
    -- multiple illimité => copie
    sinon
      copier quantitéCeci ceci vers joueur.
    fin si

  phase épilogue:
    --  si ceci est illimité et dénombrable:
    --    dire "[Singulier ceci] a été ajouté[e ceci] à votre inventaire.".
    --  sinon
    --    dire "[Intitulé ceci] [v être ipac ceci] ajouté[es ceci] à votre inventaire.".
    --  fin si.
    dire "[Intitulé quantitéCeci] [v être ipac quantitéCeci] ajouté[es quantitéCeci] à votre inventaire.".

fin action

L'aide pour l'action prendre est "{*Prendre*}
  Permet de prendre un objet accessible pour le mettre dans votre inventaire.
  {+exemples+} :
  > {-prendre {/l'épée/}-}
  > {-prendre {/le bouquet de fleurs/}-}
  {+raccourci+} : {-p-}, {-pr-}".

-- ===========
--   PRIER
-- ===========
action prier:
  phase épilogue:
    dire "Vous priez.".
fin action

action prier ceci:
  définitions:
    ceci est un intitulé prioritairement mentionné.
  phase prérequis:
    si ceci est le joueur, refuser "Vous vous appréciez beaucoup. C'est bien.".
  phase épilogue:
    dire "Vous priez [intitulé ceci].".
fin action

-- ============
--   RACONTER
-- ============
action raconter:
  phase épilogue:
    exécuter la commande "raconter une blague".
fin action

action raconter ceci:
  définitions:
    ceci est un intitulé.
  phase épilogue:
    dire "{/Voici une blague :/}".
    dire "{n}[au hasard]Que fait Platon quand ça le démange ?@@attendre touche@@{/Il Socrate./}[ou]Qu’est-ce qu’un rat avec la queue coupée ?@@attendre touche@@{/Un raccourci./}[ou]Comment savoir qu'un rat est content ?@@attendre touche@@{/Il souris./}[ou]Un geek ne s’ennuie pas…@@attendre touche@@Il se fichier.[ou]Que demande un footballeur à son coiffeur ?@@attendre touche@@{/La coupe du monde s’il vous plaît./}[ou]C’est l’histoire d’une fleur qui court, qui court…@@attendre touche@@{/Et qui se plante./}[fin choix]".
fin action

action raconter ceci à cela:
  définitions:
    ceci est un intitulé.
    cela est un objet.
  phase épilogue:
    exécuter la commande "raconter une blague".
fin action

-- ===============
--   RECOMMENCER
-- ===============
action recommencer:
  phase exécution:
    -- jeu terminé
    si le jeu est terminé:
      commencer nouvelle partie.
    -- jeu en cours : confirmation
    sinon
      dire "Commencer une nouvelle partie ?".
      choisir 
        choix "oui":
          commencer nouvelle partie.
        choix "non":
      fin choisir
    fin si
fin action

-- ============
--   REGARDER
-- ============
-- a) regarder
action regarder:
  phase exécution:
    dire "{_{*[titre ici]*}_}".
    si l'infinitif de l'action est examiner:
      dire "{n}[description ici][décrire objets ici]".
    sinon
      dire "{n}[description ici][décrire objets ici sauf cachés]".
    fin si.
  phase épilogue:
    dire "{P}[sorties ici]".
fin action
    
-- b) regarder ceci
action regarder ceci:
  définitions:
    ceci est un intitulé prioritairement mentionné.
  phase prérequis:
    si ceci n’est ni un élément ni une direction, refuser "Je ne comprends pas ce que vous voulez regarder.".
    si ceci n’est ni visible ni l’inventaire ni adjacent ni une direction, refuser "Je ne [le ceci] vois pas actuellement.".
    si ceci est un objet et visible mais pas vu, refuser "Je ne [l’ ceci]ai pas encore vu[es ceci].".
  phase exécution:
    si ceci est une personne:
      dire "[description ceci]".
    sinon
      exécuter la commande "examiner [préposition ceci] [intitulé ceci]".
    fin si
fin action
  
L'aide pour l'action regarder est "{*Regarder*}
  Permet de regarder autour de vous pour en savoir plus sur le lieu où vous vous trouvez.
  {+exemple+} :
  > {-regarder-}
  {+raccourci+} : {-r-}, {-re-}".
  
-- ============
--   RÉPÉTER
-- ============

action répéter ceci:

  définitions:
    ceci est un intitulé.

  phase exécution:
    si ceci est la commande ou la dernière commande:
      exécuter la dernière commande.
    fin si

  phase épilogue:
    si ceci n’est ni la commande ni la dernière commande, dire "Je sais seulement répéter la dernière commande".

fin action

-- ===========
--   SAUTER
-- ===========
-- sauter sur place
action sauter:
  phase épilogue:
    dire "Vous sautez sur place.".
fin action

-- sauter sur quelque chose
action sauter sur ceci:
  phase épilogue:
    dire "J’ai peur de me blesser.".
fin action

-- ===========
--   SECOUER
-- ===========
action secouer ceci:
  phase prérequis:
    si ceci est le joueur, refuser "Rien de tel pour se réveiller.".
    si ceci est un vivant, refuser "Je suis contre la violence.".
  phase exécution:
    changer ceci n’est plus intact.
  phase épilogue:
    dire "Je [l’ ceci]ai secoué[es ceci].".
fin action
-- ================
--   TESTER AUDIO
-- ================
action tester l’audio:
  tester l’audio.
fin action

-- ===========
--   TIRER
-- ===========
action tirer ceci:
  phase prérequis:
    si ceci est le joueur, refuser "Pardon ?".
    si ceci est un vivant, refuser "Vous lui avez demandé son avis ?".
  phase exécution:
    changer ceci est déplacé.
  phase épilogue:
    dire "Ça n’a rien donné.".
fin action

-- ===========
--   TOUCHER
-- ===========
action toucher ceci:
  phase prérequis:
    si ceci est le joueur, refuser "Non vous ne rêvez pas.".
    si ceci est un vivant, refuser "Vous lui avez demandé son avis ?".
  phase exécution:
    changer ceci n’est plus intact.
  phase épilogue:
    dire "Je [l’ ceci]ai touché[es ceci].".
fin action

-- ========
--   TUER
-- ========
action tuer ceci:
  phase prérequis:
    si ceci n’est pas un vivant, refuser "[Pronom ceci] [v vivre ipr pas ceci].".
    si ceci est le joueur, refuser "Ça ne va pas ?".

  phase épilogue:
    dire "Je suis contre la violence.".
fin action

-- ============
--   UTILISER
-- ============
-- 1) utiliser ceci
action utiliser ceci:
  définitions:
    ceci est prioritairement possédé.
  phase épilogue:
    dire "Ça n’a rien donné.".
fin action

-- 2) utiliser ceci sur cela
action utiliser ceci sur cela:
  définitions:
    ceci est prioritairement possédé.
  phase épilogue:
    dire "Ça n’a rien donné.".
fin action

-- =================
--   VERROUILLER
-- =================
action verrouiller ceci avec cela:
  définitions:
    ceci est prioritairement verrouillable.
  phase épilogue:
    dire "Ça n’a pas fonctionné.".
fin action

-- =============
--   SYNONYMES
-- =============
interpréter déchirer et détruire comme casser.
interpréter bouger comme déplacer.
interpréter retirer comme enlever.
interpréter fouiller comme examiner.
interpréter questionner comme interroger.
interpréter lancer comme jeter.
interpréter engloutir, ingérer et avaler comme manger.
interpréter enfiler, chausser, porter, équiper et tenir comme mettre.
interpréter discuter comme parler.
interpréter observer comme regarder.
interpréter roter comme péter.
interpréter appuyer et enfoncer comme pousser.
interpréter ramasser comme prendre.
interpréter pincer comme toucher.
interpréter actionner comme utiliser.

`;