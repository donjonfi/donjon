export enum LienCondition {
  /** aucun lien */
  aucun = "-",
  /** lien « et » (p1) */
  et = "et",
  /** lien « ou » (ou inclusif) (p2) */
  ou = "ou",
  /** lien « ni » (et non) (p3) */
  ni = "ni",
  /** lien « soit » (ou exclusif) (p4) */
  soit = "soit",
  /** lien « ainsi que » (et) (p5) */
  ainsiQue = "ainsi que",
  /** lien « mais pas » (et non) (p5) */
  maisPas = "mais pas",
  /** lien « mais bien » (et) (p5) */
  maisBien = "mais bien",
  /** lien « mais ni » (et non) (p5) */
  maisNi = "mais ni",
  /** lien « et si » (et) (p6) */
  etSi = "et si",
  /** lien « ou si » (ou inclusif) (p7) */
  ouSi = "ou si",
}

