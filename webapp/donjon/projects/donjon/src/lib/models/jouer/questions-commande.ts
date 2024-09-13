import { Choix } from "../compilateur/choix";

export class QuestionsCommande {
    QcmInfinitif: QuestionCommande | null = null;
    QcmDecoupe: QuestionCommande | null = null;
    QcmCeci: QuestionCommande | null = null;
    QcmCela: QuestionCommande | null = null;
    QcmCeciEtCela: QuestionCommande | null = null;
}

export class QuestionCommande {
    Question: string;
    Choix: Choix[];
    Reponse: string | null = null;
    constructor(question: string) {
        this.Question = question;
    }
}