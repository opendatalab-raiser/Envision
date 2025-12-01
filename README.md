# Envision

Envision is a comprehensive benchmark designed for evaluating the unified understanding and sequential generation capabilities of multimodal models, specifically focusing on the modeling of **causal world processes**. The benchmark assesses a model's ability to generate coherent, physically plausible, and aesthetically pleasing sequences of images that follow a complex, step-by-step causal narrative.

---

## 🌟 Overview
<img width="1826" height="420" alt="0a81c3cc7a4309091f488e64f47da22b" src="https://github.com/user-attachments/assets/a988b158-e95f-47dd-93ec-7d0afb94f041" />

---

## ⬇️ Download Dataset

You can download the Envision dataset, which contains the sequence prompts and ground-truth process descriptions, using the following Git command:

```bash
git clone [https://huggingface.co/datasets/opendatalab-raiser/Envision](https://huggingface.co/datasets/opendatalab-raiser/Envision)
````

-----

## 📐 Evaluation

The evaluation of generated sequential images is managed by the `eval.py` script, which automates the quality assessment using a commercial LLM (e.g., OpenAI models) as the judge. The scoring adheres to a strict hierarchical protocol.

### 1\. Evaluation Dimensions and Weights

The comprehensive quality score ($\text{Overall Score}$) is calculated based on three primary dimensions with predefined weights, following a 4:4:2 ratio:

| Dimension | Weight ($\mathbf{W}$) | Sub-Dimensions |
| :--- | :--- | :--- |
| **Consistency** | 40% (0.4) | Semantic Consistency, Factual Consistency, Spatial-Temporal Consistency |
| **Physicality** | 40% (0.4) | Basic Properties, Dynamics and Interactivity, Physical Reliability |
| **Aesthetic** | 20% (0.2) | Expressiveness, Artistic Quality, Authenticity |

The final $\text{Overall Score}$ is a weighted average:

$$\text{Overall Score} = \sum_{D \in \{\text{Cons, Phys, Aes}\}} \mathbf{W}_D \times \text{MeanScore}_D$$

### 2\. Sub-Dimension Weights

Within each main dimension, the sub-dimensions are weighted nearly equally, with weights set to approximately $0.33$, $0.33$, and $0.34$, as defined in the `DIMENSION_WEIGHTS` and `SUB_DIMENSION_WEIGHTS` variables in `eval.py`:

  * **Consistency:**
      * Semantic Consistency: 0.33
      * Factual Consistency: 0.33
      * Spatial-Temporal Consistency: 0.34
  * **Physicality:**
      * Basic Properties: 0.33
      * Dynamics and Interactivity: 0.33
      * Physical Reliability: 0.34
  * **Aesthetic:**
      * Expressiveness: 0.33
      * Artistic Quality: 0.33
      * Authenticity: 0.34

### 3\. Running the Evaluation

The `eval.py` script utilizes multi-threaded execution and requires the following arguments to run the evaluation against your generated image sequences:

```bash
python eval.py \
    --json_path /path/to/your/sequences.json \
    --image_dir /path/to/your/generated/images \
    --output_dir /path/to/save/results \
    --api_key YOUR_OPENAI_API_KEY \
    --model gpt-4o \
    --result_full full_results.json \
    --result_scores scores.jsonl \
    --max_workers 5
```

| Argument | Description |
| :--- | :--- |
| `--json_path` | Path to the JSON file containing the sequence prompts and details. |
| `--image_dir` | Root directory containing the index folders with step images. |
| `--output_dir` | Directory to save evaluation results. |
| `--api_key` | OpenAI API key for calling the evaluation model. |
| `--model` | The LLM model name for evaluation (e.g., `gpt-4o`). |
| `--result_full` | Output JSON file for full results. |
| `--result_scores` | Output JSONL file for scores. |
| `--max_workers` | Maximum number of concurrent workers for evaluation. |

-----

## 🏆 Leaderboard

For the latest official results and model rankings on the Envision benchmark, please visit our dedicated leaderboard website:

**[https://opendatalab-raiser.github.io/Envision/](https://opendatalab-raiser.github.io/Envision/)**

-----

## ✍️ Citation

If you use the Envision dataset or benchmark in your research, please cite the following paper:

```bibtex
@article{wei2025ggbench,
  title={Envision: Benchmarking Unified Understanding & Generation for Causal World Process Insights},
  author={Juanxi Tian, Siyuan Li, He, Conghui and Wu, Lijun and Tan, Cheng},
  journal={arXiv preprint arXiv:},
  year={2025}
}
```
