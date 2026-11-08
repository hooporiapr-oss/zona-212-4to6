# Zona 2-1-2 · 4 a 6 años

A game that teaches kids ages 4 to 6 their first idea of team defense: the 2-1-2 zone.

Five friends, each with a house on the court in the 2-1-2 shape. Two rules:

- **Cuida tu casa** (guard your house)
- **Muévete hacia la bola** (move toward the ball): the closest friend goes, the rest take a step toward it

## Three levels

1. **Encuentra tu casa** (find your house): a friend appears; the child taps its house.
2. **¿Quién va?** (who goes?): the ball appears; the child taps the friend who goes.
3. **La bola viaja** (the ball travels): the ball moves two or three times; the child repeats who went, in order.

## How it plays

- No words on the child's screen. A face at the top shows what to do.
- A voice says each instruction. The teacher can turn the voice off.
- Opens in Spanish, with a Spanish voice. The EN button switches to English.
- A miss never ends the game: the right friend glows and the child tries again.
- Nothing is saved and nothing is sent. No names, no accounts, no code to get in.

## Files

- `index.html`: the whole game in one page; serve it at the site's root.
- `prueba-zona.js`: the test. It plays all three levels on a phone, with misses on purpose.

## Running the test

```
npm install playwright
npx playwright install chromium
node prueba-zona.js
```

It ends with `ALL PASS` when everything works.

© 2026 Gostar Digital LLC
