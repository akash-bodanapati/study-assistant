/**
 * mockData.js
 * Hardcoded sample study set used during M1 scaffolding to test the full render
 * pipeline before the real AI backend is wired up. Matches the exact JSON contract.
 */
export const MOCK_STUDY_SET = {
  topic: "The Solar System",
  flashcards: [
    {
      id: "fc-1",
      front: "What is the largest planet in our Solar System?",
      back: "Jupiter — it's so large that all other planets could fit inside it."
    },
    {
      id: "fc-2",
      front: "How long does it take light to travel from the Sun to Earth?",
      back: "About 8 minutes and 20 seconds."
    },
    {
      id: "fc-3",
      front: "What are the four inner (rocky) planets?",
      back: "Mercury, Venus, Earth, and Mars — also called the terrestrial planets."
    },
    {
      id: "fc-4",
      front: "What is a dwarf planet?",
      back: "A celestial body that orbits the Sun, has enough mass for a near-spherical shape, but has NOT cleared the neighbourhood around its orbit. Pluto is an example."
    },
    {
      id: "fc-5",
      front: "What is the Kuiper Belt?",
      back: "A region beyond Neptune's orbit containing many icy bodies, dwarf planets (like Pluto), and the source of most short-period comets."
    },
    {
      id: "fc-6",
      front: "What causes the seasons on Earth?",
      back: "The axial tilt (~23.5°) of the Earth — not its distance from the Sun."
    },
    {
      id: "fc-7",
      front: "Which planet has the most moons?",
      back: "Saturn, with over 140 confirmed moons (as of 2024), edging out Jupiter."
    },
    {
      id: "fc-8",
      front: "What is the Great Red Spot on Jupiter?",
      back: "A persistent high-pressure storm system larger than Earth that has raged for at least 350 years."
    }
  ],
  quiz: [
    {
      id: "q-1",
      question: "Which is the closest planet to the Sun?",
      options: ["Venus", "Mercury", "Earth", "Mars"],
      correctIndex: 1,
      explanation: "Mercury is the innermost planet, though Venus is the hottest due to its thick atmosphere."
    },
    {
      id: "q-2",
      question: "What is the name of Earth's natural satellite?",
      options: ["Titan", "Io", "The Moon", "Europa"],
      correctIndex: 2,
      explanation: "Earth has one natural satellite simply called the Moon (or Luna)."
    },
    {
      id: "q-3",
      question: "Which planet is known as the Red Planet?",
      options: ["Jupiter", "Saturn", "Venus", "Mars"],
      correctIndex: 3,
      explanation: "Mars gets its reddish appearance from iron oxide (rust) on its surface."
    },
    {
      id: "q-4",
      question: "How many planets are in our Solar System (IAU definition)?",
      options: ["7", "8", "9", "10"],
      correctIndex: 1,
      explanation: "The IAU recognizes 8 planets. Pluto was reclassified as a dwarf planet in 2006."
    },
    {
      id: "q-5",
      question: "Which planet has prominent rings visible from Earth?",
      options: ["Uranus", "Neptune", "Saturn", "Jupiter"],
      correctIndex: 2,
      explanation: "Saturn's rings are made of ice and rock and are easily visible with a small telescope."
    },
    {
      id: "q-6",
      question: "What force keeps planets in orbit around the Sun?",
      options: ["Magnetism", "Dark energy", "Nuclear force", "Gravity"],
      correctIndex: 3,
      explanation: "Gravity is the attractive force between masses. The Sun's gravity keeps planets in their orbits."
    }
  ]
};
