export type ProphylaxisStep = {
  day: number;
  type: "Vaccin" | "Prévention" | "Traitement";
  title: string;
  description: string;
}

export const ProphylaxisService = {
  getProtocolsForBreed(breed: string): ProphylaxisStep[] {
    const commonEarly: ProphylaxisStep[] = [
      { day: 1, type: "Prévention", title: "Eau Sucrée + Vinaigre cidre", description: "Posologie: 50g de sucre/Litre (énergie) + 15ml (1 c.à.s) de Vinaigre de cidre pour nettoyer l'intestin." },
      { day: 3, type: "Prévention", title: "Complexe Vitaminé", description: "Posologie: 1g ou 1ml par Litre d'eau de boisson (Anti-stress) pendant 3 jours." },
      { day: 6, type: "Vaccin", title: "Newcastle (HB1)", description: "Posologie: 1 dose/sujet dans l'eau non chlorée. Soif préalable de 2h requise." },
      { day: 10, type: "Prévention", title: "Cure de Moringa", description: "Posologie: 15g de poudre (1 c.à.s) pour 1 kg d'aliment pour doper les vitamines, pdt 3j." },
      { day: 12, type: "Vaccin", title: "Gumboro (1ère dose)", description: "Posologie: 1 dose/sujet dans l'eau de boisson (soif préalable de 2h)." },
      { day: 15, type: "Prévention", title: "Ail (Démarrage)", description: "Posologie: 1 grosse gousse (5g) écrasée dans 1L d'eau, macérer 12h. Donner pdt 3j (Antibiotique naturel)." },
      { day: 22, type: "Vaccin", title: "Gumboro (Rappel)", description: "Posologie: 1 dose/sujet. Rappel essentiel pour la protection immunitaire." },
      { day: 26, type: "Vaccin", title: "Newcastle (LaSota)", description: "Posologie: 1 dose/sujet. Rappel vaccin anti-maladie de Newcastle dans l'eau." },
    ];

    const normalizedBreed = breed.toLowerCase();

    if(normalizedBreed === 'caille') {
      return [
         { day: 1, type: "Prévention", title: "Anti-stress + Vinaigre cidre", description: "Posologie: 1c/L de vinaigre + vitamines énergisantes." },
         { day: 7, type: "Vaccin", title: "Newcastle / Bronchite", description: "Posologie: 1 dose/sujet. Optionnel si environnement sécurisé." },
         { day: 15, type: "Prévention", title: "Vitamines + Ail", description: "Posologie: 1 gousse/L pdt 3 jours pour booster l'immunité." }
      ]
    }

    if(normalizedBreed === 'lapin') {
      return [
         { day: 15, type: "Prévention", title: "Anti-coccidiose (Amprolium)", description: "Posologie: 1g/L pdt 5j pour éviter les diarrhées." },
         { day: 35, type: "Vaccin", title: "VHD (Maladie Hémorragique)", description: "Posologie: 0.5ml en sous-cutanée (Sujet de > 500g)." },
         { day: 42, type: "Vaccin", title: "Myxomatose", description: "Posologie: 1 dose par sujet (ou combiné VHD-Myxo)." },
         { day: 60, type: "Prévention", title: "Vermifuge (Leva 200)", description: "Posologie: 1g pour 2 litres d'eau pendant 24h." }
      ]
    }

    if(normalizedBreed === 'pigeon') {
      return [
         { day: 14, type: "Vaccin", title: "Paramyxovirose", description: "Posologie: 0.2ml par sujet en sous-cutané (nuque)." },
         { day: 21, type: "Vaccin", title: "Variole colombaire", description: "Posologie: Méthode par transfixion alaire (aile)." },
         { day: 35, type: "Prévention", title: "Trichomonose (Muguet)", description: "Posologie: 1g/L d'eau de boisson (Dimétridazole/Ronidazole)." },
         { day: 60, type: "Prévention", title: "Vermifuge complet", description: "Posologie: 1 goutte individuelle sur le bec ou dans l'eau." }
      ]
    }

    if(normalizedBreed.includes('chair')) {
      return [
        ...commonEarly,
        { day: 35, type: "Prévention", title: "Vitamines de Finition", description: "Posologie: 1g/L d'eau. Booster pour optimiser le poids." },
        { day: 42, type: "Prévention", title: "Anti-stress pré-vente", description: "Posologie: Vitamine C (1g/L) 2j avant le transport." }
      ]
    }

    if(normalizedBreed.includes('pondeuse')) {
      return [
        ...commonEarly,
        { day: 35, type: "Vaccin", title: "Variole aviaire", description: "Posologie: Application par transfixion alaire (transpercer l'aile)." },
        { day: 42, type: "Vaccin", title: "Coryza Aviaire", description: "Posologie: 0.5ml en injection sous-cutanée (1ère dose)." },
        { day: 49, type: "Vaccin", title: "Typhose Aviaire", description: "Posologie: Injection sous-cutanée selon dosage labo." },
        { day: 60, type: "Prévention", title: "Vermifuge (Leva 200)", description: "Posologie: 1.5g/L d'eau pendant un jour complet." },
        { day: 70, type: "Vaccin", title: "Rappel Newcastle (Lasota)", description: "Posologie: 1 dose/sujet dans l'eau de boisson." },
        { day: 112, type: "Vaccin", title: "Corymune 7K", description: "Posologie: Injection intramusculaire (0.5ml). Protection ponte longue." }
      ]
    }

    // Default for poultry variations
    return [
      ...commonEarly,
      { day: 30, type: "Prévention", title: "Anti-Coccidien", description: "Posologie: 1g Amprolium/Litre pendant 5 jours consécutifs." },
      { day: 45, type: "Prévention", title: "Vermifuge (Decaris/Leva)", description: "Posologie: 1g pour 2 Litres d'eau (A jeun le matin)." },
      { day: 60, type: "Prévention", title: "Vitamines de Croissance", description: "Posologie: Booster minéraux/calcium dans l'aliment." },
      { day: 90, type: "Vaccin", title: "Rappel Newcastle", description: "Posologie: 1 dose/sujet pour sujets à cycle long." },
      { day: 112, type: "Vaccin", title: "Corymune 7K", description: "Posologie: Injection 0.5ml pour protection géniteurs." }
    ]
  }
}
