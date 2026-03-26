# 🔍 Protocol V7.2: Critical System Analysis

This document outlines structural "negatives" in the current scoring algorithm and proposes technical solutions to evolve the system toward **Protocol V8.0**.

---

## 1. The "Penalty Cliff" Effect
**Negative**: Current penalties use a binary threshold (e.g., `-0.15` if Narrative < 6.5). This means a movie with **6.4** is treated significantly worse than a movie with **6.5**, despite a negligible difference in quality.

*   **Impact**: Significant (Inconsistent calibration)
*   **Proposed Solution**: **Gradient Penalties**. Replace fixed deductions with a sliding scale.
    *   *Algorithm*: `Deduction = max(0, 6.5 - current_score) * Factor`
    *   *Result*: A 6.4 movie gets a tiny penalty, while a 4.0 movie gets a massive one.

---

## 2. Weight Redistribution Bias
**Negative**: When a category is skipped (e.g., "Visuals" in a podcast/radio play review), its 15% weight is redistributed. This accidentally "overpowers" categories like Narrative, making the score less comparable across different content types.

*   **Impact**: Moderate (Cross-review inconsistency)
*   **Proposed Solution**: **Static Anchor Weights**.
    *   *Algorithm*: Instead of redistributing to 0-10, allow the "Max Possible Score" to drop if categories are exempt. 
    *   *Result*: A "Pure Dialogue" review might be out of 8.5 instead of 10, preserving the original weight of the Narrative pillar.

---

## 3. Pillar Aspect Dilution
**Negative**: All aspects within a pillar (e.g., the 5 aspects of Narrative) are averaged equally. This treats "Opening" with the same importance as "Story" or "Screenplay."

*   **Impact**: Moderate (Strategic inaccuracy)
*   **Proposed Solution**: **Intra-Pillar Weighting**.
    *   *Algorithm*: Assign weights *within* the category keys in `utils.py`.
    *   *Example*: Narrative Pillar (35%) -> Story (50%), Screenplay (30%), Others (20%).

---

## 4. The "Cold Masterpiece" Logic (Soul Gate)
**Negative**: The "Soul Gate" hard caps a review at 8.5 if the Soul average is < 7.0. While on-brand for the Temple, it can be mathematically frustrating for high-concept technical achievements that intentionally avoid "emotional impact."

*   **Impact**: Conceptual (User frustration)
*   **Proposed Solution**: **Dual-Track Scoring**.
    *   *Algorithm*: Allow the score to reach its natural peak (e.g., 9.2) but apply an **"Architectural Badge"** instead of the "Masterpiece" verdict.
    *   *Result*: The movie is recognized as 9.2 but flagged as "Technically Elite / Emotionally Void."

---

## 5. Metadata Blindness
**Negative**: The system calculates the same way regardless of the reviewer's confidence or the movie's genre.

*   **Impact**: Low (Missing depth)
*   **Proposed Solution**: **Confidence Multiplexing**.
    *   *Feature*: Allow a 0-100% "Confidence" slider for the review.
    *   *Result*: Low-confidence scores are "dampened" toward the global average (7.0), while high-confidence scores are allowed to reach extremes.
