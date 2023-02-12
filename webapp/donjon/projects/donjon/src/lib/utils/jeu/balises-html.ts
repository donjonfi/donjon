export class BalisesHtml {

  /**
   * Retirer les balises HTML du texte et convertir les balises Donjon en balises HTML.
   */
  public static convertirEnHtml(texte: string, dossierRessourcesComplet: string): string {
    texte = BalisesHtml.retirerBalisesHtml(texte);
    texte = BalisesHtml.ajouterBalisesHtml(texte, dossierRessourcesComplet);
    return texte;
  }

  /**
   * Retirer les tags html du texte.
   */
  public static retirerBalisesHtml(texte: string): string {
    const retVal = texte.replace(/<[^>]*>/g, '');
    return retVal;
  }

  /**
   * Ajouter des tags HTML à la place des tags Donjon.
   * @argument dossierRessources chaine vide ou bien "/jeu.sousDossier"
   */
  private static ajouterBalisesHtml(texte: string, dossierRessources: string): string {

    let retVal = texte;

    // balises image
    retVal = retVal.replace(/@@image:([\w\-\.]*[\w]+)@@/g, '<img src="' + dossierRessources + '/images/$1" alt="$1" class="img-fluid rounded">');

    retVal = retVal.replace(/@@tester audio@@/g, '<a id="tester-audio" class="tester-audio">Cliquez ici</a> pour tester l’audio.');

    // italique: texte avec une partie en {/italique/} et le reste normal.
    retVal = retVal.replace(/\{\//g, '<i>');
    retVal = retVal.replace(/\/\}/g, '</i>');
    // gras: texte avec une partie en {*gras*} et le reste normal.
    retVal = retVal.replace(/\{\*/g, '<b>');
    retVal = retVal.replace(/\*\}/g, '</b>');
    // souligner. texte avec une partie {_soulignée_} et le reste normal.
    retVal = retVal.replace(/\{_/g, '<u>');
    retVal = retVal.replace(/_\}/g, '</u>');
    // texte IMPORTANT {+texte+}
    retVal = retVal.replace(/\{\+/g, '<span class="t-important">');
    retVal = retVal.replace(/\+\}/g, '</span>');
    // texte COMMANDE {-texte-}
    retVal = retVal.replace(/\{-/g, '<span class="t-commande">');
    retVal = retVal.replace(/-\}/g, '</span>');
    // italique: CODE {@code@}
    retVal = retVal.replace(/\{@/g, '<span class="t-code-couleur">');
    retVal = retVal.replace(/@\}/g, '</span>');

    // font
    // - 0) sans-serif (police par défaut)
    retVal = retVal.replace(/\{0/g, '');
    retVal = retVal.replace(/0\}/g, '');
    // - 1)
    retVal = retVal.replace(/\{1/g, '<span class="font-1">');
    retVal = retVal.replace(/1\}/g, '</span>');
    // - 2)
    retVal = retVal.replace(/\{2/g, '<span class="font-2">');
    retVal = retVal.replace(/2\}/g, '</span>');
    // - 3)
    retVal = retVal.replace(/\{3/g, '<span class="font-3">');
    retVal = retVal.replace(/3\}/g, '</span>');
    // - 4)
    retVal = retVal.replace(/\{4/g, '<span class="font-4">');
    retVal = retVal.replace(/4\}/g, '</span>');
    // - 5)
    retVal = retVal.replace(/\{5/g, '<span class="font-5">');
    retVal = retVal.replace(/5\}/g, '</span>');
    // - 6)
    retVal = retVal.replace(/\{6/g, '<span class="font-6">');
    retVal = retVal.replace(/6\}/g, '</span>');
    // - 7)
    retVal = retVal.replace(/\{7/g, '<span class="font-7">');
    retVal = retVal.replace(/7\}/g, '</span>');

    // retrait {r} ou {t} (tabulation)
    retVal = retVal.replace(/\{r\}/g, '&nbsp;&nbsp;&nbsp;&nbsp;');
    retVal = retVal.replace(/\{t\}/g, '&nbsp;&nbsp;&nbsp;&nbsp;');

    // suppression espaces avant {<}
    // // (on a préalablement remplacé {<} par {«})
    retVal = retVal.replace(/((?: )*\{<\})/g, '');

    // suppression espaces après {>}
    // // (on a préalablement remplacé {>} par {»})
    retVal = retVal.replace(/(\{>\}(?: )*)/g, '');

    // espace {e}
    retVal = retVal.replace(/\{e\}/g, ' ');
    // espace insécable {i}
    retVal = retVal.replace(/\{i\}/g, '&nbsp;');


    // nouvelle ligne ou paragraphe, si pas vide ({N}, {U} et {P})
    // - si débute par {N}, {P} ou {U}, ne pas en tenir compte
    while (retVal.startsWith("{N}") || retVal.startsWith("{U}") || retVal.startsWith("{P}")) {
      retVal = retVal.slice(3);
    }
    // - si termine par {N}, {U} ou {P}, ne pas en tenir compte
    while (retVal.endsWith("{N}") || retVal.endsWith("{U}") || retVal.endsWith("{P}")) {
      retVal = retVal.slice(0, retVal.length - 3);
    }

    // - remplacer les {N}{P} restants par un {p}
    retVal = retVal.replace(/\{N\}\{P\}/g, '{p}');
    // remplacerles {P} et {p} restants par </p><p> (nouveau paragraphe)
    retVal = retVal.replace(/\{P\}/gi, '</p><p>');

    // - remplacer les {N} et {n} restants par un \n
    retVal = retVal.replace(/\{N\}/gi, '\n');

    // - remplacer les {U} restants par un {u}
    retVal = retVal.replace(/\{U\}/g, '{u}');

    // remplacer nouvelle ligne {l} par un \n (pas documenté mais supporté)
    retVal = retVal.replace(/\{l\}/g, '\n');

    // nouvelle ligne unique {u}
    // > \n{u} => \n (même si espaces entre les 2)
    retVal = retVal.replace(/\n( )*\{u\}/g, '\n');
    // > {u}\n => \n (même si espaces entre les 2)
    retVal = retVal.replace(/\{u\}( )*\n/g, '\n');
    // > {u}{u}… => \n
    retVal = retVal.replace(/(\{u\})+/g, '\n');

    // nouvelle ligne (\n) => <br>
    retVal = retVal.replace(/\n/g, '<br>');


    // convertir " :" en " :" (demi espace insécable)
    retVal = retVal.replace(/ :(?!\w)/g, ' :');

    return retVal;
  }

}