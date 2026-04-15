// src/BabsFarmerDemo.tsx
import React from "react";
import {
  AbsoluteFill,
  Img,
  interpolate,
  Sequence,
  staticFile,
  Audio,
  useCurrentFrame,
  useVideoConfig,
  Easing,
} from "remotion";

// Durée d'affichage d'un écran (en frames)
const DURATION_PER_SCREEN = 90; // 3s si 30 fps
const TRANSITION = 15; // 0.5s de fondu/slide

type Screen = {
  src: string;
  title: string;
  subtitle?: string;
  description?: string;
};

const SCREENS: Screen[] = [
  {
    src: "/IMG_2002.jpeg",
    title: "Accès Sécurisé",
    subtitle: "Votre ferme à portée de main",
    description: "Une interface simple pour accéder à votre exploitation d'un seul geste."
  },
  {
    src: "/IMG_2003.jpeg",
    title: "Connexion Éleveur",
    subtitle: "Sécurité et confidentialité",
    description: "Vos données sont synchronisées en temps réel sur le cloud pour ne rien perdre."
  },
  {
    src: "/IMG_2005.jpeg",
    title: "Type d'Élevage",
    subtitle: "Configuration sur mesure",
    description: "Sélectionnez votre spécialité pour adapter les outils de gestion."
  },
  {
    src: "/IMG_2006.jpeg",
    title: "Gestion des Races",
    subtitle: "Une bibliothèque complète",
    description: "Choisissez parmi des dizaines de races de chair, pondeuses ou d'ornement."
  },
  {
    src: "/IMG_2007.jpeg",
    title: "Fiche Technique",
    subtitle: "Informations essentielles",
    description: "Consultez les caractéristiques de vos sujets avant de démarrer un lot."
  },
  {
    src: "/IMG_2008.jpeg",
    title: "Tableau de Bord",
    subtitle: "Vue à 360 degrés",
    description: "Suivez d'un coup d'œil l'état global de votre cheptel et de vos ressources."
  },
  {
    src: "/IMG_2009.jpeg",
    title: "Inventaire Actif",
    subtitle: "Contrôle précis",
    description: "Gérez vos effectifs, les entrées et les sorties de chaque lot."
  },
  {
    src: "/IMG_2010.jpeg",
    title: "Nouveau Lot",
    subtitle: "Enregistrement rapide",
    description: "Ajoutez vos poussins ou sujets en quelques secondes avec leurs bagues."
  },
  {
    src: "/IMG_2011.jpeg",
    title: "Suivi de Santé",
    subtitle: "Zéro Perte",
    description: "Anticipez les maladies avec un programme de prévention intelligente."
  },
  {
    src: "/IMG_2012.jpeg",
    title: "Vaccination Automatisée",
    subtitle: "Rappels et dates clés",
    description: "Le système génère automatiquement votre calendrier vaccinal complet."
  },
  {
    src: "/IMG_2013.jpeg",
    title: "Bibliothèque Bio",
    subtitle: "Solutions naturelles",
    description: "Accédez à des remèdes locaux (Ail, Moringa, Gombo) avec posologie."
  },
  {
    src: "/IMG_2014.jpeg",
    title: "Collecte d'Œufs",
    subtitle: "Suivi de ponte",
    description: "Enregistrez vos pontes quotidiennes pour calculer votre taux de productivité."
  },
  {
    src: "/IMG_2015.jpeg",
    title: "Statistiques de Ponte",
    subtitle: "Analyse de performance",
    description: "Identifiez les baisses de production pour réagir rapidement."
  },
  {
    src: "/IMG_2016.jpeg",
    title: "Gestion Alimentaire",
    subtitle: "Économies & Efficacité",
    description: "Maîtrisez votre stock et évitez le gaspillage d'aliment."
  },
  {
    src: "/IMG_2017.jpeg",
    title: "Formulation Maison",
    subtitle: "Réduisez vos coûts",
    description: "Apprenez à fabriquer votre propre aliment avec les matières locales."
  },
  {
    src: "/IMG_2018.jpeg",
    title: "Optimiseur Nutrition",
    subtitle: "Rations équilibrées",
    description: "Calculez le taux de protéine exact pour une croissance optimale."
  },
  {
    src: "/IMG_2019.jpeg",
    title: "Comptabilité",
    subtitle: "Rentabilité réelle",
    description: "Analysez vos dépenses et vos recettes pour maximiser vos bénéfices."
  },
  {
    src: "/IMG_2020.jpeg",
    title: "Expertise Avicole",
    subtitle: "Progressez chaque jour",
    description: "Tous les outils dont un éleveur moderne a besoin dans une seule application."
  },
];



const ScreenSlide: React.FC<{
  screen: Screen;
  index: number;
}> = ({ screen, index }) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();

  const start = index * DURATION_PER_SCREEN;
  const localFrame = frame - start;

  const opacity = interpolate(
    localFrame,
    [0, TRANSITION, DURATION_PER_SCREEN - TRANSITION, DURATION_PER_SCREEN],
    [0, 1, 1, 0],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }
  );

  const scale = interpolate(
    localFrame,
    [0, DURATION_PER_SCREEN],
    [1.02, 1],
    {
      easing: Easing.ease,
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }
  );

  const translateY = interpolate(
    localFrame,
    [0, DURATION_PER_SCREEN],
    [10, -10],
    {
      easing: Easing.inOut(Easing.ease),
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }
  );

  const titleTranslateY = interpolate(
    localFrame,
    [0, TRANSITION, DURATION_PER_SCREEN - TRANSITION, DURATION_PER_SCREEN],
    [40, 0, 0, 40],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }
  );

  const descOpacity = interpolate(
    localFrame,
    [TRANSITION, TRANSITION + 10, DURATION_PER_SCREEN - TRANSITION - 10, DURATION_PER_SCREEN - TRANSITION],
    [0, 1, 1, 0],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }
  );

  return (
    <Sequence from={start} durationInFrames={DURATION_PER_SCREEN}>
      {/* Petit son de transition à chaque écran (si présent) */}
      {/* <Audio src={staticFile("pop.mp3")} volume={0.4} /> */}

      <AbsoluteFill
        style={{
          backgroundColor: "#020617",
          justifyContent: "center",
          alignItems: "center",
          opacity,
        }}
      >
        {/* L'appli en plein écran */}
        <div
          style={{
            width: "100%",
            height: "100%",
            transform: `scale(${scale}) translateY(${translateY}px)`,
          }}
        >
          <Img
            src={staticFile(screen.src)}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover", // Remplit tout l'écran
            }}
          />
        </div>

        {/* Overlay sombre léger pour faire ressortir les textes si besoin */}
        <AbsoluteFill style={{ 
          background: "linear-gradient(to bottom, rgba(2,6,23,0.4) 0%, transparent 15%, transparent 85%, rgba(2,6,23,0.6) 100%)",
          pointerEvents: "none"
        }} />

        {/* Bandeau de titre en haut */}
        <div
          style={{
            position: "absolute",
            top: 100, // Un peu plus bas pour l'encoche/dynamic island
            left: 0,
            right: 0,
            display: "flex",
            justifyContent: "center",
            pointerEvents: "none",
          }}
        >
          <div
            style={{
              transform: `translateY(${titleTranslateY}px)`,
            }}
          >
            <div
              style={{
                padding: "10px 20px",
                borderRadius: 999,
                background:
                  "linear-gradient(135deg, rgba(15,23,42,0.96), rgba(30,64,175,0.9))",
                boxShadow: "0 18px 40px rgba(15,23,42,0.75)",
                display: "inline-flex",
                alignItems: "center",
                gap: 10,
                border: "1px solid rgba(148,163,184,0.5)",
              }}
            >
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 999,
                  background:
                    "linear-gradient(135deg, #f97316, #fb923c, #facc15)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "white",
                  fontSize: 16,
                  fontWeight: 700,
                }}
              >
                {index + 1}
              </div>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <span
                  style={{
                    fontSize: 18,
                    fontWeight: 700,
                    color: "white",
                    letterSpacing: 0.3,
                  }}
                >
                  {screen.title}
                </span>
                {screen.subtitle && (
                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: 500,
                      color: "#e5e7eb",
                    }}
                  >
                    {screen.subtitle}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Bandeau d'explication pédagogique en bas */}
        {screen.description && (
          <div
            style={{
              position: "absolute",
              bottom: 120, // Plus haut pour éviter la barre de navigation iPhone
              left: 40,
              right: 40,
              opacity: descOpacity,
              display: "flex",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                background: "rgba(15, 23, 42, 0.9)",
                backdropFilter: "blur(12px)",
                padding: "24px 40px",
                borderRadius: 28,
                border: "1px solid rgba(255, 255, 255, 0.15)",
                boxShadow: "0 25px 60px rgba(0, 0, 0, 0.6)",
                maxWidth: 900,
                textAlign: "center",
                position: "relative",
                overflow: "hidden"
              }}
            >
              <div style={{
                position: "absolute",
                bottom: 0,
                left: 0,
                right: 0,
                height: 4,
                background: "linear-gradient(90deg, #f97316, #facc15)"
              }} />
              <p
                style={{
                  color: "white",
                  fontSize: 26,
                  fontWeight: 600,
                  lineHeight: 1.3,
                  margin: 0,
                  letterSpacing: -0.2,
                }}
              >
                {screen.description}
              </p>
            </div>
          </div>
        )}
      </AbsoluteFill>
    </Sequence>
  );
};

export const BabsFarmerDemo: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: "#020617" }}>
      {/* Musique de fond globale (ajoutez un fichier music.mp3 dans your public folder) */}
      {/* <Audio src={staticFile("music.mp3")} volume={0.5} /> */}
      
      {SCREENS.map((screen, index) => (
        <ScreenSlide key={index} screen={screen} index={index} />
      ))}
    </AbsoluteFill>
  );
};
