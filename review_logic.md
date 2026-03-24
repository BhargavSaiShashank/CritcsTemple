# 🏛️ The Critic's Temple: Review Scoring Logic

The application uses a weighted multi-category system to calculate the **Divine Overall Rating (0-10)** and its corresponding **Verdict**.

---

## 🛰️ 1. Category Breakdown & Weights

The overall score is derived from **21 cinematic aspects** grouped into five thematic categories.

| Category | Weight | Included Aspects |
| :--- | :--- | :--- |
| **🧠 Narrative** | **40%** | Story, Screenplay, Originality, Opening, Climax, Themes & Depth |
| **⚡ Direction** | **25%** | Direction, Acting, Blocking & Staging |
| **🎥 Visuals** | **15%** | Cinematography, Editing, Production Design, VFX, Visual Storytelling |
| **🎧 Audio** | **10%** | Background Score, Music, Sound Design |
| **❤️ Soul** | **10%** | Pacing, Emotional Impact, Rewatch Value, Immersion |

---

## ⚙️ 2. Automated Scoring Adjustments

After calculating the weighted average, the system applies the following "Divine Refinements":

### 🔻 Penalties (Deductions)
- **Foundation Penalty**: 
    - `-0.10` if **Narrative** average is < 6.5.
    - `-0.05` if **Direction** average is < 6.5.
- **Soul Penalty**: `-0.05` if **Soul** average is < 6.0.
- **Variance Penalty**: 
    - `-0.10` if the difference between the highest and lowest category average is ≥ 3.0.
    - `-0.05` if the difference is ≥ 2.0.

### 🌟 Boosts (Bonuses)
- **Greatness Boost**: 
    - `+0.10` if **EVERY** category average is ≥ 8.5.
    - `+0.05` if at least **3** categories are ≥ 8.3.

---

## ⚖️ 3. Verdict Scale

The final score determines the archival verdict:

| Score | Verdict |
| :--- | :--- |
| **9.6 – 10.0** | LEGENDARY |
| **9.2 – 9.5** | MASTERPIECE |
| **8.8 – 9.1** | ESSENTIAL |
| **8.4 – 8.7** | ELITE |
| **8.0 – 8.3** | GREAT |
| **7.5 – 7.9** | GOOD |
| **7.0 – 7.4** | DECENT |
| **6.0 – 6.9** | AVERAGE |
| **5.0 – 5.9** | MEDIOCRE |
| **< 5.0** | (Various Poorer Verdicts) |
