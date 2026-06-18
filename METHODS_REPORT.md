# Project Report
## Reddit Primary Care Discourse Analysis — Canada
### An Interactive NLP Dashboard

| | |
|---|---|
| **Institution** | Memorial University of Newfoundland — Faculty of Medicine |
| **Dataset** | 89,398 healthcare-relevant records (filtered from 119,090 collected) · January 2021 – August 2025 |
| **Research Team** | Prof. Maisam Najafizada (PI) · Terrence Tricco · Elhamy Samak · Steve Slade · Abdul Rahman Zahiri · Peizhong (Peter) Wang · Jacob Power · Hashim Rawab |

---

## 1. Project Overview

This project set out to answer a straightforward research question: **how are Canadians actually talking about primary care on the internet, and what are they saying?**

Rather than relying on surveys or clinical data, we turned to Reddit — one of the most active discussion platforms in Canada — as a real-time, unfiltered window into public experience with the healthcare system. We collected 119,090 posts and comments from 32 Canadian subreddits spanning January 2021 to August 2025, then applied a two-stage healthcare-relevance labeling pass to confirm topical relevance, retaining **89,398 healthcare-relevant records**. We applied a series of machine learning and natural language processing (NLP) techniques to classify sentiment and topics on this refined dataset, and built an interactive web dashboard that allows researchers to explore the results by year, province, and post type.

The project is divided into two distinct parts that work in sequence: a **Python analysis pipeline** that processes the raw data, and a **Next.js web dashboard** that presents the results interactively.

---

## 2. Data Collection

Data was collected from **Google BigQuery**, which hosts Reddit's publicly available archive of all posts and comments. We wrote structured queries to pull records from 32 Canadian subreddits, including province-level communities (r/ontario, r/alberta, r/britishcolumbia, r/novascotia, r/newfoundland, r/saskatchewan, r/manitoba, r/newbrunswick) and city-level communities (r/toronto, r/vancouver, r/ottawa, r/calgary, r/edmonton, r/halifax, r/winnipeg). We also included r/canada and r/askcanada to capture national-level discourse.

To ensure relevance to primary care, we filtered results to only those records containing at least one of the following keywords: *family doctor, family physician, primary care, walk-in clinic, urgent care, waitlist, nurse practitioner, referral, follow-up, appointment, GP, health card,* and *continuity.* Records that did not mention any of these terms were excluded.

This initial keyword-filtered collection contained 119,090 records. A subsequent healthcare-relevance labeling pass (Section 2.1) refined this down to **89,398 records** — 41,567 original posts and 47,831 comments — spanning four and a half years across all major Canadian provinces.

### 2.1 Healthcare Relevance Filtering

The BigQuery keyword filter above is intentionally broad, so a second, more rigorous relevance-labeling pass was run on the full 119,090-record collection before any sentiment or topic analysis took place. The pass had two stages:

1. **Keyword engine (deterministic, auditable).** STRONG keywords — specific, unambiguous phrases such as "family doctor," "psychiatrist," "telehealth," "ultrasound" — counted as healthcare-relevant on their own. WEAK, generic words (e.g., "waitlist," "patient," "doctor," "clinic," "referral," "specialist," "appointment," "nurse," "hospital," "er") are ambiguous in isolation — "be patient," "vet clinic," "Doctor Who," and "referral code" are real non-health uses found in the data — so a weak word only counted if corroborated by a STRONG keyword nearby, a different weak keyword nearby, or the same weak word repeating twice or more in the post, and was excluded if the post matched a known non-health idiom for that word with no other health signal present.
2. **Semantic rescue.** Records with zero keyword matches after stage 1 were embedded with a local `sentence-transformers` model (`all-MiniLM-L6-v2`, CPU-only, no API cost) and compared by cosine similarity against example sentences for primary care, general healthcare, and non-healthcare content. A sufficiently confident match promoted the record.

Each record received a 3-way label (`Primary healthcare` / `Healthcare (general)` / `Not healthcare`) and a 2-way collapse (`Healthcare` / `Not healthcare`). No rows were deleted — every original record retained a label — but only the **89,398 records labeled `Healthcare`** were carried forward into the rest of the pipeline below. The excluded 29,692 records were predominantly off-topic discussion that had matched the broad collection keywords incidentally without actually concerning healthcare.

---

## 3. Geographic Tagging

Each of the 89,398 records was tagged to a geographic location based on which subreddit it came from. A post from r/toronto is tagged as **Toronto**, which is then mapped to **Ontario**. A post from r/alberta is tagged directly as **Alberta**. Posts from r/canada and r/askcanada are tagged as **Canada (General)** because the specific province of the poster cannot be determined.

We maintained a lookup table mapping every city subreddit to its parent province. This meant that when viewing the Sentiment by Province chart, Toronto's posts are rolled up into Ontario's total — so the province figure accurately represents all discussion from that province, not just the provincial subreddit alone.

Of the 89,398 total records, **49,764 have an identified province or city**, and **39,634 come from national subreddits or have an unidentifiable location**. Both groups are counted in all overall totals; only the geographic breakdowns exclude the unidentifiable group.

---

## 4. Sentiment Analysis — Four-Layer Machine Learning Ensemble

Classifying sentiment in healthcare text is more difficult than general social media sentiment analysis. A phrase like "no family doctor" contains no overtly emotional words, yet it clearly represents a negative experience. To handle this, we built a **four-layer ensemble** where each layer compensates for the weaknesses of the previous one.

### Layer 1 — VADER

VADER (Valence Aware Dictionary and Sentiment Reasoner) is a rule-based sentiment tool built specifically for social media. It scores each post on a scale from −1 (most negative) to +1 (most positive) based on a dictionary of words with known emotional weights. It handles things like capitalization, exclamation marks, and common internet slang well. However, it struggles with domain-specific language — healthcare phrases that are clearly negative can score as neutral.

### Layer 2 — Healthcare-Specific Rule Layer

We wrote a custom rule layer to correct VADER's healthcare blindspots. This layer checks for specific phrases that unambiguously indicate a negative primary care experience: *"no family doctor," "not accepting new patients," "doctor shortage," "been waiting months," "can't get an appointment,"* and similar expressions. When these phrases are found, the sentiment is forced to Negative regardless of VADER's score. Conversely, phrases like *"finally got a doctor," "grateful for my GP,"* and *"really helpful"* reinforce a positive label. When both negative and positive signals appear in the same post, the record is classified as Mixed.

### Layer 3 — RoBERTa Transformer Model

The third layer uses **RoBERTa** (Robustly Optimised BERT Pretraining Approach), a deep learning language model with 125 million parameters. Unlike VADER which scores individual words, RoBERTa reads the entire sentence and understands context — it knows that "I waited three hours and still didn't see a doctor" is negative even though no individual word in that sentence is inherently negative. We used the `cardiffnlp/twitter-roberta-base-sentiment-latest` model, which was fine-tuned on social media text, making it particularly suited to Reddit's informal writing style.

**This model ran entirely on our local computer using the HuggingFace Transformers library. No post, comment, or piece of text was ever sent to an external server or AI service.**

### Layer 4 — Ensemble Decision

The outputs of all three layers are combined using a weighted decision process:
- If Layer 2 (healthcare rules) identifies a strong barrier phrase → **Negative** (this overrides everything)
- If RoBERTa and VADER agree on a label → that shared label is used
- If they disagree → RoBERTa's label is used, as it has the deeper contextual understanding
- If confidence is low across all layers → the post is flagged as **Review Needed**

The 22,549 records flagged as Review Needed were resolved using an adjusted sentiment score from the pipeline, ensuring they are properly counted in the charts rather than discarded or incorrectly assigned.

**Final sentiment distribution across all 89,398 healthcare-relevant records:**
- Negative: 33,763 (37.8%)
- Positive: 22,567 (25.2%)
- Neutral: 18,328 (20.5%)
- Mixed: 14,740 (16.5%)

---

## 5. Primary Care Framework Classification — The 4C Model

To place the Reddit discourse within an established academic framework, every post was classified according to **Starfield's 4C Model of Primary Care** (Starfield, 1994). This framework defines the four core functions that high-quality primary care must fulfill:

| Dimension | What It Covers |
|---|---|
| **Contact / Access** | Whether patients can reach a doctor when they need one — family doctor shortages, waitlists, walk-in access, appointment availability |
| **Continuity** | Whether patients see the same provider over time and have an ongoing relationship with their doctor |
| **Coordination** | Whether care is coordinated between providers — referrals to specialists, test results, inter-provider communication |
| **Comprehensiveness** | Whether care covers the full range of needs — mental health, chronic conditions, preventive care, whole-person health |

Classification used a **three-tier keyword scoring system**:
- **Tier 1 (weight ×3):** high-specificity phrases (*"no family doctor," "walk-in clinic," "referral delayed"*)
- **Tier 2 (weight ×2):** pairs of co-occurring terms that together indicate a care dimension
- **Tier 3 (weight ×1):** individual indicator words (*"waitlist," "continuity," "appointment"*)

Each record was assigned to the dimension with the highest cumulative score. Records with no meaningful keyword signal were classified as *unclear or other*.

**Final 4C distribution across all 89,398 healthcare-relevant records:**
- Contact / Access: 71,427 (79.9%)
- Unclear / Other: 13,101 (14.7%)
- Comprehensiveness: 2,155 (2.4%)
- Coordination: 1,980 (2.2%)
- Continuity: 735 (0.8%)

The dominance of Contact / Access (80%) reflects the severity of the family doctor shortage in Canada over this period.

---

## 6. Topic Modelling — BERTopic

In addition to the 4C classification, we applied **BERTopic** to discover sub-themes within the data without imposing any predetermined categories. BERTopic is an unsupervised machine learning method that works in three stages:

1. **Sentence embeddings:** each post is converted into a numerical vector using a pre-trained BERT transformer model. Posts with similar meanings end up close together in this high-dimensional space.
2. **HDBSCAN clustering:** posts that cluster together in the embedding space are grouped as a topic. The algorithm decides how many topics to create — we do not specify this in advance.
3. **Keyword extraction:** the most representative words for each cluster are extracted using a technique called class-based TF-IDF, producing human-readable topic labels.

BERTopic was run on a representative sample of 30,000 records — standard practice because the model requires significant memory for embedding computation. It identified sub-themes within each 4C category, such as "Appointment & Urgent Care Access" and "Waitlists & Wait Times" within Contact / Access, or "Referrals & Walk-In Clinics" within Coordination.

**Like all other models in this project, BERTopic ran entirely locally. No data was transmitted externally.**

---

## 7. The Python Analysis Pipeline

All analysis was performed by a set of Python scripts running on the research computer. The key libraries used were:

- **pandas** — data loading, cleaning, and transformation
- **NLTK / VADER** — rule-based sentiment scoring
- **HuggingFace Transformers** — RoBERTa inference, running locally
- **BERTopic, sentence-transformers, UMAP, HDBSCAN** — topic modelling, running locally
- **scikit-learn** — supporting machine learning utilities

The final step of the Python pipeline is a script called `rebuild_data_json.py`. This script reads all 119,090 collected records from the CSV, filters them down to the 89,398 confirmed healthcare-relevant records, and pre-calculates every aggregation needed by the website — monthly record counts, sentiment breakdowns by province and year, 4C distributions, keyword frequencies, topic volumes, engagement statistics, and geographic counts. All of this is written into a single structured file called `data.json` (approximately 1 megabyte). This file is the connection point between the Python analysis and the web dashboard.

---

## 8. The Interactive Web Dashboard

The dashboard was built using **Next.js 15** with React 19 and TypeScript. It is a fully client-side application — meaning once loaded in the browser, it requires no server and makes no further network requests.

### How It Works Technically

When a user opens the website:
1. The browser downloads the Next.js application and the `data.json` file once
2. All 89,398 healthcare-relevant records — pre-summarized into aggregations — are loaded into browser memory
3. Every filter interaction (changing the year, switching between posts and comments, selecting a province) triggers a client-side recalculation using the in-memory data
4. Charts are redrawn instantly using **Plotly.js**, a professional-grade data visualization library

There is no database, no server-side computation, and no API calls during normal use. All filtering logic runs in the browser in milliseconds.

### Dashboard Structure

The dashboard has six tabs:

| Tab | What It Shows |
|---|---|
| **Overview** | Key metrics, Canada map with geographic bubble sizes, monthly volume trend, cumulative growth, word cloud, sentiment trend |
| **Topics & Themes** | BERTopic sunburst hierarchy, province-by-topic heatmap, 4C framework stat cards, bubble chart (volume vs. frustration), radar chart, sentiment per dimension |
| **Sentiment Analysis** | Monthly sentiment trend, overall distribution, keyword sentiment breakdown, sentiment flow (Sankey), sentiment by province and city |
| **Geographic** | Province and city ranking, engagement scores, 4C breakdown by province |
| **Engagement** | Post score distributions, upvote ratios, comment volumes, engagement by geography |
| **About & Methods** | Research team, research questions, data pipeline, tools, ethical statement |

### Filters

The sidebar provides three filters that apply globally across all tabs simultaneously:
- **Year** — select one or more years from 2021 to 2025
- **Post Type** — all records / posts only / comments only
- **Location** — all of Canada / specific province or city

All chart calculations respect the active filter state.

---

## 9. The Two-Part Architecture

The Python pipeline and the Next.js dashboard are kept **completely separate by design**. The only thing that connects them is the `data.json` file.

This separation has several advantages:
- The analysis can be re-run with updated data at any time by running the Python script and replacing the JSON file. The website code does not change.
- A collaborator with web development skills can work on the dashboard without needing Python installed.
- A data scientist can update the analysis without touching the website.
- The website is fast and simple because it only reads pre-calculated numbers — it does not perform any computation itself beyond filtering and charting.

---

## 10. Data Privacy and Ethics

All machine learning inference in this project was performed **locally**, using models downloaded from HuggingFace and executed on the research computer. The following guarantees apply:

- No post or comment text was sent to any external AI service, cloud API, or third-party server
- The raw CSV data never leaves the research environment
- The GitHub repository contains only the Next.js source code and the aggregated JSON summary — no individual posts, no usernames, no personal information
- All Reddit data is publicly posted by users in public subreddits, accessed through Reddit's official public dataset on Google BigQuery, in accordance with Reddit's terms of service for academic research
- No personally identifiable information (usernames, account details, IP addresses) was collected or retained at any stage

This approach is equivalent to downloading a statistical software package and running it on data locally — the tool operates entirely within the researcher's own environment.

---

## 11. Summary of Tools and Technologies

| Component | Tool / Library | Where It Runs |
|---|---|---|
| Data collection | Google BigQuery | Cloud (public Reddit archive) |
| Text cleaning | Python, pandas, re | Local |
| Sentiment — Layer 1 | VADER (NLTK) | Local |
| Sentiment — Layer 2 | Custom healthcare rule engine | Local |
| Sentiment — Layer 3 | RoBERTa (HuggingFace Transformers) | **Local — no data transmitted** |
| Topic modelling | BERTopic, UMAP, HDBSCAN | **Local — no data transmitted** |
| 4C classification | Custom keyword scoring system | Local |
| Data aggregation | Python, pandas | Local |
| Web framework | Next.js 15, React 19, TypeScript | Client-side browser |
| Charts | Plotly.js | Client-side browser |
| Styling | Tailwind CSS | Client-side browser |
| Hosting | GitHub | Static files only |

---

## 12. Key Findings

1. **Access is the dominant concern.** 68.2% of all primary care discussion on Reddit falls under the Contact / Access dimension of the 4C framework — reflecting the severity of Canada's family doctor shortage.

2. **Sentiment is predominantly negative.** 38.8% of posts express negative sentiment, compared to 25.4% positive. The most negative discussions involve family doctor shortages, waitlists, and urgent care access.

3. **Ontario and British Columbia drive the most discussion.** These two provinces account for the largest share of geo-tagged records, with Ontario topping both volume and engagement metrics.

4. **Discussion is growing.** Record counts have increased year-over-year from 14,835 in 2021 to 35,755 in 2024, suggesting growing public concern and engagement with primary care issues.

5. **Mental health and chronic conditions are discussed far less than access.** Comprehensiveness represents only 1.9% of records, indicating that public Reddit discourse focuses heavily on getting into the system rather than the quality or breadth of care once inside.

---

## References

Starfield, B. (1994). Is primary care essential? *The Lancet, 344*(8930), 1129–1133. https://doi.org/10.1016/S0140-6736(94)90634-3

Hutto, C., & Gilbert, E. (2014). VADER: A parsimonious rule-based model for sentiment analysis of social media text. *Proceedings of the 8th International Conference on Weblogs and Social Media (ICWSM-14).*

Grootendorst, M. (2022). BERTopic: Neural topic modeling with a class-based TF-IDF procedure. *arXiv preprint arXiv:2203.05794.* https://doi.org/10.48550/arXiv.2203.05794

Liu, Y., Ott, M., Goyal, N., Du, J., Joshi, M., Chen, D., Levy, O., Lewis, M., Zettlemoyer, L., & Stoyanov, V. (2019). RoBERTa: A robustly optimized BERT pretraining approach. *arXiv preprint arXiv:1907.11692.* https://doi.org/10.48550/arXiv.1907.11692
