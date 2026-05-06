import { BalisesHtml } from "../../public-api";

describe('Balises HTML > retirerBalisesHtml', () => {


  it('[F014-T001] retirer balises <p> <u> <b> <span>', () => {

    const texteNettoye = BalisesHtml.retirerBalisesHtml(
      '<p>'
      + '<u><b>Le salon</b></u>'
      + '<br>Vous êtes dans un salon.'
      + '<br>Un magazine traîne sur le sol.'
      + '<br>Vous apercevez une table basse. Dessus, il y a une pomme.</p>'
      + '<p><span class="t-commande"> &gt; nombre mots</span>'
      + '<a href="http://example.com">lien</a>'
      + '</p>'
    );

    expect(texteNettoye).toEqual(
      'Le salon'
      + 'Vous êtes dans un salon.'
      + 'Un magazine traîne sur le sol.'
      + 'Vous apercevez une table basse. Dessus, il y a une pomme.'
      + ' &gt; nombre mots'
      + 'lien'
    )

  });

});