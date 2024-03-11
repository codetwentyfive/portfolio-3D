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
  snapgram,
  summiz,
  tailwindcss,
  threads,
  passau,
  typescript,
  python,
  odin,
  caretaker,
  lmu,
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
    iconBg: "azure",
    date: "September 2022 - now",
    points: [
      "Taking care of my father who suffers from broken spine injuries and needs help with everyday tasks",
    ],
  },
  {
    title: "Student",
    company_name: "The Odin Project & co.",
    icon: odin,
    iconBg: "grey",
    date: "February 2020 - now",
    points: ["Learned about how to design and maintain a website from creation to deployment","Learned Javascript fundamentals","React frameworks","Node.js"],
  },
  {
    title: "Student",
    company_name: "University of Passau -Cultural Business Studies",
    icon: passau,
    iconBg: "white",
    date: "February 2016 - September 2019",
    points: [""],
  },
  {
    title: "Student",
    company_name: "Ludwig-Maximilians-Universität -Jurisprudence",
    icon: lmu,
    iconBg: "white",
    date: "February 2013 - September 2016",
    points: [""],
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
    iconUrl: pricewise,
    theme: "btn-back-red",
    name: "Amazon Price Tracker",
    description:
      "Developed a web application that tracks and notifies users of price changes for products on Amazon, helping users find the best deals.",
    link: "https://github.com/adrianhajdin/pricewise",
  },
  {
    iconUrl: threads,
    theme: "btn-back-green",
    name: "Full Stack Threads Clone",
    description:
      'Created a full-stack replica of the popular discussion platform "Threads," enabling users to post and engage in threaded conversations.',
    link: "https://github.com/adrianhajdin/threads",
  },
  {
    iconUrl: car,
    theme: "btn-back-blue",
    name: "Car Finding App",
    description:
      "Designed and built a mobile app for finding and comparing cars on the market, streamlining the car-buying process.",
    link: "https://github.com/adrianhajdin/project_next13_car_showcase",
  },
  {
    iconUrl: snapgram,
    theme: "btn-back-pink",
    name: "Full Stack Instagram Clone",
    description:
      "Built a complete clone of Instagram, allowing users to share photos and connect with friends in a familiar social media environment.",
    link: "https://github.com/adrianhajdin/social_media_app",
  },
  {
    iconUrl: estate,
    theme: "btn-back-black",
    name: "Real-Estate Application",
    description:
      "Developed a web application for real estate listings, facilitating property searches and connecting buyers with sellers.",
    link: "https://github.com/adrianhajdin/projects_realestate",
  },
  {
    iconUrl: summiz,
    theme: "btn-back-yellow",
    name: "AI Summarizer Application",
    description:
      "App that leverages AI to automatically generate concise & informative summaries from lengthy text content, or blogs.",
    link: "https://github.com/adrianhajdin/project_ai_summarizer",
  },
];
