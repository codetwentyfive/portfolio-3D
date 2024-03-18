import {
  car,
  contact,
  css,
  estate,
  git,
  github,
  html,
  javascript,
  linkedin,
  mongodb,
  nodejs,
  pricewise,
  react,
  sass,
  cv,
  snapgram,
  summiz,
  weather,
  tailwindcss,
  threads,
  passau,
  typescript,
  python,
  odin,
  caretaker,
  mountain,
  lmu,
  sketch,
  puzzle,
} from "../assets/icons";

export const skills = [
  {
    imageUrl: css,
    name: "CSS",
    type: "Frontend",
  },

  {
    imageUrl: html,
    name: "HTML",
    type: "Frontend",
  },
  {
    imageUrl: javascript,
    name: "JavaScript",
    type: "Frontend",
  },
  {
    imageUrl: typescript,
    name: "TypeScript",
    type: "Frontend",
  },
  {
    imageUrl: python,
    name: "Python",
    type: "Frontend",
  },
  {
    imageUrl: react,
    name: "React",
    type: "Frontend",
  },
  {
    imageUrl: git,
    name: "Git",
    type: "Version Control",
  },
  {
    imageUrl: tailwindcss,
    name: "Tailwind CSS",
    type: "Frontend",
  },
  {
    imageUrl: github,
    name: "GitHub",
    type: "Version Control",
  },
  {
    imageUrl: mongodb,
    name: "MongoDB",
    type: "Database",
  },

  {
    imageUrl: nodejs,
    name: "Node.js",
    type: "Backend",
  },

  {
    imageUrl: sass,
    name: "Sass",
    type: "Frontend",
  },
];

export const experiences = [
  {
    title: "Caretaker",
    company_name: "Home",
    icon: caretaker,
    iconBg: "#2a3988",
    date: "September 2022 - now",
    points: [
      "Taking care of my father who suffers from broken spine injuries and needs help with everyday tasks",
    ],
  },
  {
    title: "Student",
    company_name: "The Odin Project & co.",
    icon: odin,
    iconBg: "#d44b56",
    date: "February 2020 - now",
    points: [
      "Learned about how to design and maintain a website from creation to deployment",
      "Learned Javascript fundamentals",
      "React frameworks",
      "Node.js",
    ],
  },
  {
    title: "Student - Cultural Business Studies",
    company_name: "University of Passau ",
    icon: passau,
    iconBg: "#fbc98a",
    date: "February 2016 - September 2019",
    points: [],
  },
  {
    title: "Student - Jurisprudence",
    company_name: "Ludwig-Maximilians-Universität",
    icon: lmu,
    iconBg: "#00883a",
    date: "February 2013 - September 2016",
    points: [],
  },
];

export const socialLinks = [
  {
    name: "Contact",
    iconUrl: contact,
    link: "/contact",
  },
  {
    name: "GitHub",
    iconUrl: github,
    link: "https://github.com/codetwentyfive",
  },
  {
    name: "LinkedIn",
    iconUrl: linkedin,
    link: "https://www.linkedin.com/in/chingis-enkhbaatar/",
  },
];

export const projects = [
  {
    iconUrl: puzzle,
    theme: "btn-back-pink",
    name: "Yu-Gi-Oh Memory Game",
    description:
      "A game made with react, and python to fetch the card images from the Yu-Gi-Oh! API, currated a collection of the most iconic and also funniest cards!",
    link: "https://github.com/codetwentyfive/memory-card",
  },
  {
    iconUrl: mountain,
    theme: "btn-back-green",
    name: "Altan Mountain",
    description:
      "Created a working version of an e-commerce store, with a modern approach towards product displays that pop out the screen and are interactive as well as a theme switcher ",
    link: "https://github.com/codetwentyfive/shopping-cart",
  },
  {
    iconUrl: weather,
    theme: "btn-back-blue",
    name: "Weather App",
    description:
      "Designed and built a weather app, which not only displays the wanted weather information, but also fetches the users current location and automatically displays the current weather, using OpenCage Data API. ",
    link: "https://github.com/codetwentyfive/Weather-App",
  },
  {
    iconUrl: cv,
    theme: "btn-back-yellow",
    name: "CV-App",
    description:
      "Developed a web application for making inputing CVs more appealing,instantly see the changes to the CV as you type them.",
    link: "https://github.com/codetwentyfive/cv-application",
  },
  {
    iconUrl: sketch,
    theme: "btn-back-red",
    name: "Etch-A-Sketch",
    description:
      "Build a canvas modeled after the nostalgic child-toy, with an adjustable canvas size,editing tools,as well as a save function i was very proud of back when i figured it out ",
    link: "https://github.com/codetwentyfive/Etch-A-Sketch?tab=readme-ov-file",
  },
];
