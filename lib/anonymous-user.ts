const animals = [
  "Panda 🐼",
  "Fox 🦊",
  "Owl 🦉",
  "Cat 🐱",
  "Bear 🐻",
  "Rabbit 🐰",
  "Wolf 🐺",
  "Tiger 🐯",
];

export function generateAnonymousName() {
  const animal =
    animals[Math.floor(Math.random() * animals.length)];

  return `Anonymous ${animal}`;
}