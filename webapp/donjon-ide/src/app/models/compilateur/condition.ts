export enum LienCondition {
    aucun = "-",
    et = "et",
    ou = "ou",
}

export class Condition {
    constructor(
        public typeLien: LienCondition,
        public determinant: string,
        public sujet: string,
        public verbe: string,
        public complement: string
    ) { }

    lien: Condition;
}
