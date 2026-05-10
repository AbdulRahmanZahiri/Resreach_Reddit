# Methods Report
## Analytical Framework for Reddit Primary Care Discourse Analysis — Canada

**Project:** Reddit Primary Care Discourse Dashboard  
**Institution:** Memorial University of Newfoundland — Faculty of Medicine  
**Dataset:** 119,090 records · January 2021 – August 2025  

---

## 1. Data Collection

Reddit data was collected using **Google BigQuery**, which hosts Reddit's publicly available post and comment archive. The dataset was filtered using a targeted set of primary care keywords to isolate health-related discourse, including: *Family Doctor, Family Physician, Primary Care, Walk-In Clinic, Urgent Care, Waitlist, Nurse Practitioner, Referral, Follow-Up, Appointment,* and *Continuity*. Only posts and comments originating from Canadian subreddits or containing explicit references to Canadian provinces and cities were retained.

The final dataset comprises **119,090 records** (posts and comments combined) spanning **January 2021 to August 2025**, covering all major Canadian provinces and metropolitan areas including Ontario, British Columbia, Alberta, Nova Scotia, Manitoba, and Quebec.

---

## 2. Data Preprocessing and Geographic Tagging

Each record underwent the following preprocessing steps:

- **Text normalisation:** conversion to lowercase, removal of URLs, special characters, and Reddit-specific formatting (e.g. markdown syntax).
- **Geographic tagging:** each record was assigned a geographic label (province or city) based on the subreddit of origin and keyword extraction from post content. City-level tags (e.g. Toronto, Vancouver, Calgary) were mapped to their corresponding provinces using a standardised lookup table.
- **Record classification:** records were classified as either original posts (submissions) or comments, allowing separate analysis of authorial versus response discourse.

---

## 3. Sentiment Analysis: Four-Layer Machine Learning Ensemble

Sentiment classification was performed using a **four-layer ensemble pipeline** designed to address the limitations of any single approach, particularly in the domain-specific context of healthcare discourse.

### Layer 1 — VADER (Valence Aware Dictionary and Sentiment Reasoner)
VADER is a lexicon and rule-based sentiment analyser specifically attuned to social media language. It produces a compound sentiment score ranging from −1 (most negative) to +1 (most positive). While effective for general social media text, VADER has known limitations when applied to domain-specific content such as healthcare, where phrases like *"no family doctor"* may be incorrectly scored as neutral due to the absence of overtly emotional language.

### Layer 2 — Healthcare-Context Rule Layer
A custom rule layer was developed to address VADER's domain limitations. This layer applies healthcare-specific overrides:

- **Barrier phrases** (e.g. *"no family doctor," "doctor shortage," "not accepting new patients," "waitlist"*) force a **Negative** classification regardless of the raw VADER score, as these phrases unambiguously represent access failures in a primary care context.
- **Positive signal words** (e.g. *"helpful," "caring," "finally got," "grateful"*) reinforce a positive classification.
- **Mixed signal detection:** when both barrier language and positive words co-occur in the same record, the post is flagged as **Mixed**, reflecting the nuanced reality of patient experiences.

### Layer 3 — RoBERTa Transformer Model
The third layer applies `cardiffnlp/twitter-roberta-base-sentiment-latest`, a **RoBERTa** (Robustly Optimised BERT Pretraining Approach) transformer model fine-tuned on social media text. RoBERTa is a deep learning model with 125 million parameters trained to understand contextual relationships between words — a capability beyond both lexicon-based methods and simple rule systems. It assigns a probability distribution across Positive, Negative, and Neutral classes for each record.

> **Critically, this model was run entirely locally on the research machine using the HuggingFace Transformers library. No data was transmitted to any external server or API at any stage of this process.** The model weights were downloaded once to the local environment and all inference was performed offline. This ensures full data sovereignty — the dataset was never exposed to third-party cloud services, and carries no risk of being retained or used for future AI model training by any external party.

### Layer 4 — Ensemble Decision Logic
The outputs of all three layers were combined using a weighted ensemble rule:
- If the healthcare rule layer identifies a strong barrier phrase → **Negative** (overrides all)
- If RoBERTa and VADER agree → their shared label is adopted
- If they disagree → the record with the higher confidence score from RoBERTa takes precedence
- Posts with low confidence across all layers are flagged as **Review Needed**

The final output assigns each record one of four sentiment labels: **Positive, Negative, Mixed,** or **Neutral**.

---

## 4. Topic Modelling: BERTopic

To identify recurring themes in the discourse without imposing a predefined category system, **BERTopic** was applied to the full dataset. BERTopic is an unsupervised machine learning technique that combines:

1. **BERT sentence embeddings** — each post is converted into a high-dimensional numerical vector that captures its semantic meaning, using a pre-trained transformer model.
2. **HDBSCAN clustering** — a density-based clustering algorithm groups semantically similar posts together without requiring the number of clusters to be specified in advance.
3. **Class-based TF-IDF** — the most representative keywords for each cluster are extracted to generate interpretable topic labels.

> Like the sentiment model, BERTopic runs entirely locally using the HuggingFace Transformers and BERTopic Python libraries. No data left the research environment.

Five distinct topic clusters emerged from the data:

| Topic | Description |
|---|---|
| Access Barriers | Difficulty finding a family doctor, long waitlists, system failures |
| Care Navigation | Understanding how to move through the healthcare system |
| Provider & Team | Discussion of family physicians, nurse practitioners, and care teams |
| Care Continuity | Experiences with ongoing and consistent care relationships |
| General Discussion | Broader commentary on the Canadian primary care landscape |

---

## 5. Primary Care Framework Classification: The 4C Model

To situate the Reddit discourse within an established academic framework, each post was classified according to **Starfield's 4C Model of Primary Care** (Starfield, 1994), which defines the four core functions of high-quality primary care:

| Dimension | Definition |
|---|---|
| **Contact / Access** | The ability of patients to reach and obtain care when needed |
| **Continuity** | An ongoing, sustained relationship between patient and provider |
| **Coordination** | Effective management of referrals, specialist communication, and follow-up |
| **Comprehensiveness** | Coverage of the full spectrum of care needs including mental health, prevention, and chronic disease |

Classification was performed using a **three-tier keyword scoring system**:
- **Tier 1 — Exact phrases** (score weight ×3): multi-word phrases with high specificity (e.g. *"walk-in clinic," "no family doctor," "referral delayed"*)
- **Tier 2 — Keyword pairs** (score weight ×2): co-occurring terms that together indicate a care dimension
- **Tier 3 — Single keywords** (score weight ×1): individual indicator words (e.g. *"waitlist," "continuity," "referral"*)

Each record was assigned the 4C dimension with the highest cumulative score. Records with insufficient keyword signal were classified as *unclear or other* and excluded from framework-level analysis.

---

## 6. Data Privacy and Ethical Considerations

A central concern in computational social science research is the handling of data when AI tools are involved. In this study, all machine learning inference was performed using **locally executed models**:

- No post or comment text was transmitted to any external API, cloud service, or AI platform.
- RoBERTa and BERTopic models were downloaded as static weights and executed entirely within the local computing environment.
- The Reddit data used is **publicly available** under Reddit's terms of service for academic research and was accessed through the official Google BigQuery public dataset programme.
- No personally identifiable information was collected or stored. Usernames were not retained in the analytical dataset.

This approach is equivalent to running statistical software locally — the analytical tool operates on the data within the researcher's own environment, with no data egress.

---

## 7. Visualisation and Dashboard

Analytical outputs were compiled into a structured JSON data file and visualised through a custom interactive dashboard built with **Next.js 15** (React 19, TypeScript) and **Plotly.js**. The dashboard provides:

- Temporal trend analysis (monthly sentiment and topic volume)
- Geographic breakdown by province and city
- 4C framework distribution and sentiment by care dimension
- Keyword frequency and sentiment profiling
- Engagement metrics (post scores, comment volume)

All chart interactions — including filtering by year, geography, and post type — are computed client-side from the pre-processed JSON file, requiring no server infrastructure beyond static file hosting.

---

## 8. Summary of Tools and Technologies

| Component | Tool / Library | Execution |
|---|---|---|
| Data collection | Google BigQuery | Cloud (public data) |
| Text preprocessing | Python (pandas, re) | Local |
| Sentiment — Layer 1 | VADER (nltk) | Local |
| Sentiment — Layer 2 | Custom rule engine | Local |
| Sentiment — Layer 3 | RoBERTa (HuggingFace Transformers) | **Local — no data transmitted** |
| Topic modelling | BERTopic | **Local — no data transmitted** |
| 4C classification | Custom keyword scorer | Local |
| Visualisation | Next.js, Plotly.js, TypeScript | Client-side |

---

## References

Starfield, B. (1994). Is primary care essential? *The Lancet, 344*(8930), 1129–1133. https://doi.org/10.1016/S0140-6736(94)90634-3

Hutto, C., & Gilbert, E. (2014). VADER: A parsimonious rule-based model for sentiment analysis of social media text. *Proceedings of the 8th International Conference on Weblogs and Social Media (ICWSM-14).*

Grootendorst, M. (2022). BERTopic: Neural topic modeling with a class-based TF-IDF procedure. *arXiv preprint arXiv:2203.05794.* https://doi.org/10.48550/arXiv.2203.05794

Liu, Y., Ott, M., Goyal, N., Du, J., Joshi, M., Chen, D., Levy, O., Lewis, M., Zettlemoyer, L., & Stoyanov, V. (2019). RoBERTa: A robustly optimized BERT pretraining approach. *arXiv preprint arXiv:1907.11692.* https://doi.org/10.48550/arXiv.1907.11692
