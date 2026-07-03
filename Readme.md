# 🌿 Green Threat — Invasive Plants Atlas

An interactive web application for identifying and learning about invasive plant species worldwide. Built with pure HTML, CSS, and vanilla JavaScript.

![Green Threat](https://img.shields.io/badge/Green%20Threat-Invasive%20Plants%20Atlas-2a5934?style=for-the-badge)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## ✨ Features

- **Species Catalog** — Browse 18 invasive plant species with search and filtering by type (trees, shrubs, herbs, vines) and danger level
- **Plant Identifier** — Step-by-step wizard that helps identify plants based on type, season, location, and visual features using a scoring algorithm
- **Detailed Species Info** — Modal popups with origin, ecosystem impact, danger to humans, spread pathways, and control methods
- **Take Action Guides** — Practical guidance for dealing with invasive plants on your property, in your community, or in the wild
- **Native Alternatives** — Suggestions for safe native plant replacements
- **Dark/Light Theme** — Full theme support with system preference detection and localStorage persistence
- **Responsive Design** — Fully responsive layout that works on desktop, tablet, and mobile

## 🛠 Tech Stack

| Technology | Purpose |
|---|---|
| HTML5 | Semantic markup |
| CSS3 | Custom properties, animations, responsive design |
| Vanilla JavaScript | SPA navigation, dynamic rendering, identification algorithm |
| JSON | Plant species database |
| Font Awesome | Icon library |
| Google Fonts | Inter + Cormorant Garamond typography |

## 🚀 Getting Started

No build tools or dependencies required. Just open `index.html` in a browser, or serve with any static file server:

```bash
# Using Python
python -m http.server 8000

# Using Node.js
npx serve .
```

## 📁 Project Structure

```
├── index.html      # Main HTML (SPA with 5 sections)
├── style.css       # All styles with CSS custom properties for theming
├── script.js       # Application logic and UI interactions
├── data.json       # Plant species database (18 species)
├── LICENSE         # MIT License
├── .gitignore      # Git ignore rules
└── README.md       # This file
```

## 🌱 Contributing

Contributions are welcome! You can help by:
- Adding new plant species to the database
- Improving identification accuracy
- Fixing bugs and suggesting features
- Translating to other languages

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

## ⚠️ Disclaimer

The information provided in this project is for **educational and informational purposes only**. It is not a substitute for professional environmental, botanical, or legal advice.

- **Herbicides**: Always follow manufacturer instructions and applicable local regulations when using chemical control methods.
- **Disposal methods**: Burning or other disposal methods must comply with local laws and regulations.
- **Plant identification**: Identification results should be verified with qualified professionals before taking action.
- **Regional variation**: Invasive status and control methods may vary by region. Consult your local environmental agency for region-specific guidance.

## 🖼️ Image Credits

All plant images are sourced from **Wikimedia Commons** under Creative Commons and Public Domain licenses. See individual file metadata for specific attribution details.

---

Made by [strangepelmen](https://github.com/strangepelmen)
