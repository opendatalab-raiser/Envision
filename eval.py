import json
import os
import base64
import re
import argparse
import openai
import concurrent.futures
import math
from pathlib import Path
from typing import Dict, Any, List, Tuple
from datetime import datetime

# 按照 4:4:2 的比例定义权重（调整后）
DIMENSION_WEIGHTS = {
    "consistency": 0.4,      # 40% (4/10)
    "physicality": 0.4,      # 40% (4/10)  
    "aesthetic": 0.2         # 20% (2/10)
}

# 各子维度在父维度内的权重（等权重，调整后）
SUB_DIMENSION_WEIGHTS = {
    "consistency": {
        "semantic_consistency": 0.33,
        "factual_consistency": 0.33,
        "spatial_temporal_consistency": 0.34
    },
    "aesthetic": {
        "expressiveness": 0.33,
        "artistic_quality": 0.33,
        "authenticity": 0.34
    },
    "physicality": {
        "basic_properties": 0.33,
        "dynamics_interactivity": 0.33,
        "physical_reliability": 0.34
    }
}

def parse_arguments():
    parser = argparse.ArgumentParser(description='Sequential Image Quality Assessment Tool')
    parser.add_argument('--json_path', required=True, help='Path to the JSON file containing prompts and sequences')
    parser.add_argument('--image_dir', required=True, help='Root directory containing index folders with step images')
    parser.add_argument('--output_dir', required=True, help='Directory to save evaluation results')
    parser.add_argument('--api_key', required=True, help='OpenAI API key')
    parser.add_argument('--model', required=True, help='Model name for evaluation')
    parser.add_argument('--result_full', required=True, help='Output JSON file for full results')
    parser.add_argument('--result_scores', required=True, help='Output JSONL file for scores')
    parser.add_argument('--api_base', default=None, type=str, help='OpenAI API base URL (optional)')
    parser.add_argument('--max_workers', type=int, default=5, help='Maximum number of concurrent workers')
    return parser.parse_args()

def get_config(args):
    return {
        "json_path": args.json_path,
        "image_dir": args.image_dir,
        "output_dir": args.output_dir,
        "api_key": args.api_key,
        "api_base": args.api_base,
        "model": args.model,
        "result_files": {"full": args.result_full, "scores": args.result_scores},
        "max_workers": args.max_workers,
    }

def load_jsonl(path: str) -> Dict[str, Dict]:
    """Load existing results from JSONL file."""
    if not os.path.isfile(path) or os.path.getsize(path) == 0:
        return {}
    records = {}
    with open(path, 'r', encoding='utf-8') as f:
        for line in f:
            obj = json.loads(line)
            records[obj["index"]] = obj
    return records

def load_json(path: str) -> Dict[str, Dict]:
    """Load existing full results from JSON file."""
    if not os.path.isfile(path) or os.path.getsize(path) == 0:
        return {}
    with open(path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    return {item["index"]: item for item in data}

def extract_scores(txt: str) -> Dict[str, float]:
    """Extract scores from evaluation text using comprehensive patterns."""
    patterns = [
        # 一致性维度
        (r"\*{0,2}Semantic Consistency\*{0,2}\s*[::]?\s*(\d)", "semantic_consistency"),
        (r"\*{0,2}Factual Consistency\*{0,2}\s*[::]?\s*(\d)", "factual_consistency"),
        (r"\*{0,2}Spatial-Temporal Consistency\*{0,2}\s*[::]?\s*(\d)", "spatial_temporal_consistency"),
        
        # 美学维度（更新）
        (r"\*{0,2}Expressiveness\*{0,2}\s*[::]?\s*(\d)", "expressiveness"),
        (r"\*{0,2}Artistic Quality\*{0,2}\s*[::]?\s*(\d)", "artistic_quality"),
        (r"\*{0,2}Authenticity\*{0,2}\s*[::]?\s*(\d)", "authenticity"),
        
        # 物理性维度
        (r"\*{0,2}Basic Properties\*{0,2}\s*[::]?\s*(\d)", "basic_properties"),
        (r"\*{0,2}Dynamics and Interactivity\*{0,2}\s*[::]?\s*(\d)", "dynamics_interactivity"),
        (r"\*{0,2}Physical Reliability\*{0,2}\s*[::]?\s*(\d)", "physical_reliability"),
        
        # 宽松匹配模式（更新）
        (r"(?i)(Semantic Consistency|Factual Consistency|Spatial-Temporal Consistency|Expressiveness|Artistic Quality|Authenticity|Basic Properties|Dynamics and Interactivity|Physical Reliability)\s*[:：]?\s*(\d)", "flexible_match")
    ]
    
    out = {}
    for pattern, score_type in patterns:
        matches = re.findall(pattern, txt, re.IGNORECASE)
        for match in matches:
            if score_type == "flexible_match":
                if len(match) == 2:
                    key = match[0].lower().replace(" ", "_").replace("-", "_")
                    value = match[1]
                else:
                    continue
            else:
                key = score_type
                value = match[0] if isinstance(match, tuple) else match
            
            try:
                score = float(value)
                if 0 <= score <= 5:
                    out[key] = score
            except ValueError:
                continue
    
    return out

def encode_image(path: str) -> str:
    """Encode image to base64."""
    try:
        with open(path, "rb") as f:
            return base64.b64encode(f.read()).decode()
    except Exception as e:
        print(f"[ERROR] Failed to encode image {path}: {e}")
        return ""

def load_sequences(path: str) -> Dict[str, Dict[str, Any]]:
    """Load sequence data from JSON file."""
    try:
        with open(path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        print(f"Successfully loaded {len(data)} sequences from {path}")
        return {item["index"]: item for item in data}
    except Exception as e:
        print(f"[ERROR] Failed to load sequences from {path}: {e}")
        return {}

def find_image_paths(index: str, image_dir: str, steps: List[int]) -> Dict[int, str]:
    """Find image paths for all steps in a sequence with flexible path resolution."""
    image_paths = {}
    
    # Convert index to string and handle zero-padding
    index_str = str(index)
    
    # 尝试多种可能的目录结构
    possible_dirs = [
        os.path.join(image_dir, f"index_{index_str.zfill(4)}"),
        os.path.join(image_dir, f"index_{index_str}"),
        os.path.join(image_dir, index_str),
        image_dir  # 直接在当前目录查找
    ]
    
    target_dir = None
    for possible_dir in possible_dirs:
        if os.path.exists(possible_dir):
            target_dir = possible_dir
            break
    
    if not target_dir:
        print(f"[WARN] No directory found for index {index_str} in {image_dir}")
        return image_paths
    
    for step in steps:
        # 尝试多种可能的文件名模式
        possible_filenames = [
            f"index_{index_str.zfill(4)}_step_{step}.png",
            f"index_{index_str}_step_{step}.png",
            f"{index_str}_step_{step}.png",
            f"step_{step}.png",
            f"{step}.png"
        ]
        
        image_found = False
        for filename in possible_filenames:
            image_path = os.path.join(target_dir, filename)
            if os.path.exists(image_path):
                image_paths[step] = image_path
                image_found = True
                break
        
        if not image_found:
            print(f"[WARN] Missing image for index {index_str}, step {step} in {target_dir}")
    
    return image_paths

def get_grade(score: float) -> str:
    """根据分数返回等级"""
    if score >= 4.5:
        return "Excellent"
    elif score >= 4.0:
        return "Very Good"
    elif score >= 3.5:
        return "Good"
    elif score >= 3.0:
        return "Fair"
    elif score >= 2.0:
        return "Poor"
    else:
        return "Very Poor"

def calculate_comprehensive_scores(individual_scores: Dict) -> Dict:
    """计算综合评分 - 按照4:4:2权重"""
    
    # 提取各维度分数
    consistency_scores = {
        "semantic_consistency": individual_scores.get("semantic_consistency", 0),
        "factual_consistency": individual_scores.get("factual_consistency", 0),
        "spatial_temporal_consistency": individual_scores.get("spatial_temporal_consistency", 0)
    }
    
    aesthetic_scores = {
        "expressiveness": individual_scores.get("expressiveness", 0),
        "artistic_quality": individual_scores.get("artistic_quality", 0),
        "authenticity": individual_scores.get("authenticity", 0)
    }
    
    physicality_scores = {
        "basic_properties": individual_scores.get("basic_properties", 0),
        "dynamics_interactivity": individual_scores.get("dynamics_interactivity", 0),
        "physical_reliability": individual_scores.get("physical_reliability", 0)
    }
    
    # 计算维度平均分（加权）
    consistency_avg = sum(
        consistency_scores[dim] * SUB_DIMENSION_WEIGHTS["consistency"][dim] 
        for dim in consistency_scores
    )
    
    aesthetic_avg = sum(
        aesthetic_scores[dim] * SUB_DIMENSION_WEIGHTS["aesthetic"][dim] 
        for dim in aesthetic_scores
    )
    
    physicality_avg = sum(
        physicality_scores[dim] * SUB_DIMENSION_WEIGHTS["physicality"][dim] 
        for dim in physicality_scores
    )
    
    # 计算总体分数（按照4:4:2权重）
    overall_score = (
        consistency_avg * DIMENSION_WEIGHTS["consistency"] +
        physicality_avg * DIMENSION_WEIGHTS["physicality"] +
        aesthetic_avg * DIMENSION_WEIGHTS["aesthetic"]
    )
    
    return {
        # 原始分数
        **individual_scores,
        
        # 维度平均分
        "consistency_score": round(consistency_avg, 2),
        "aesthetic_score": round(aesthetic_avg, 2),
        "physicality_score": round(physicality_avg, 2),
        "overall_score": round(overall_score, 2),
        
        # 权重信息
        "weight_info": {
            "consistency_weight": DIMENSION_WEIGHTS["consistency"],
            "physicality_weight": DIMENSION_WEIGHTS["physicality"], 
            "aesthetic_weight": DIMENSION_WEIGHTS["aesthetic"],
            "total_weight": sum(DIMENSION_WEIGHTS.values())
        },
        
        # 简单平均分（不加权，用于对比）
        "consistency_avg_simple": round(sum(consistency_scores.values()) / len(consistency_scores), 2),
        "aesthetic_avg_simple": round(sum(aesthetic_scores.values()) / len(aesthetic_scores), 2),
        "physicality_avg_simple": round(sum(physicality_scores.values()) / len(physicality_scores), 2),
        "overall_avg_simple": round(sum(individual_scores.values()) / len(individual_scores), 2),
        
        # 通过率统计
        "pass_rate_3": round(sum(1 for score in individual_scores.values() if score >= 3) / len(individual_scores), 2),
        "pass_rate_4": round(sum(1 for score in individual_scores.values() if score >= 4) / len(individual_scores), 2),
        
        # 等级评定
        "overall_grade": get_grade(overall_score),
        "consistency_grade": get_grade(consistency_avg),
        "aesthetic_grade": get_grade(aesthetic_avg),
        "physicality_grade": get_grade(physicality_avg)
    }

def build_sequence_evaluation_messages(sequence_data: Dict, image_base64_list: List[str]) -> list:
    """Build messages for sequence evaluation."""
    
    # Build step descriptions
    step_descriptions = []
    for i, step_data in enumerate(sequence_data["prompts"]):
        step_descriptions.append(
            f"Step {step_data['step']}:\n"
            f"  Prompt: {step_data['prompt']}\n"
            f"  Explanation: {step_data['explanation']}\n"
        )
    
    steps_text = "\n".join(step_descriptions)
    
    # Build image content with proper formatting
    image_contents = []
    for i, image_base64 in enumerate(image_base64_list):
        if image_base64:  # 只添加成功编码的图像
            image_contents.append({
                "type": "image_url",
                "image_url": {
                    "url": f"data:image/png;base64,{image_base64}"
                }
            })
    
    return [
        {
            "role": "system",
            "content": [
                {
                    "type": "text",
                    "text": "You are a professional Vincennes sequential image quality audit expert. Evaluate the image sequence quality strictly according to the protocol, considering the progression across all 4 steps."
                }
            ]
        },
        {
            "role": "user",
            "content": [
                {
                    "type": "text",
                    "text": f"""Please evaluate this 4-step image sequence strictly and return ONLY the nine scores as requested.

# SEQUENTIAL Image Quality Evaluation Protocol

## System Instruction
You are an AI quality auditor for sequential text-to-image generation. Apply these rules with ABSOLUTE RUTHLESSNESS. Only sequences meeting the HIGHEST standards should receive top scores.

**Sequence Information**
- INDEX: {sequence_data['index']}
- CATEGORY: {sequence_data['category']}
- PROCESS TYPE: {sequence_data['process_type']}

**Step-by-Step Sequence Description:**
{steps_text}

---

## SCORING CRITERIA (0-5 scale with exhaustive rubrics)

**CONSISTENCY DIMENSION** - Evaluate across the entire 4-step sequence

**Semantic Consistency (0-5):** Alignment between visual representation and conceptual meaning throughout the sequence, considering both explicit and implicit elements.
* 0 (Rejected): Visual representation completely contradicts the core concept; the subject matter is wrong or misrepresented; the intended meaning is entirely lost or reversed; major misunderstanding of the explanation.
* 1 (Very Poor): Core theme is present but significantly distorted; key elements are misinterpreted or omitted; contradictory elements disrupt understanding; the overall narrative is unclear or misleading.
* 2 (Poor): Basic concept is recognizable but flawed in key details; the main idea is conveyed but with significant errors; some elements align with the intended meaning while others are incorrectly represented or confusing.
* 3 (Fair): Core concept is accurately captured, and the meaning is mostly clear; most elements align with the intended idea, but some minor semantic inconsistencies or unclear representations persist.
* 4 (Good): Both explicit and implicit meanings are captured well; a nuanced understanding of the concept is conveyed, and even subtle or abstract aspects are represented accurately; rich semantic content with few inconsistencies.
* 5 (Excellent): Every conceptual nuance is perfectly expressed; the visual representation fully aligns with the intended meaning, conveying deep understanding of all semantic layers; flawless conceptual execution with no distortions.

**Factual Consistency (0-5):** Adherence to empirical facts, scientific knowledge, and logical relationships, ensuring the representation is grounded in reality and subject to coherent reasoning.
* 0 (Rejected): Violates fundamental physical laws or scientific principles; contains logical contradictions; depicts completely impossible scenarios; misrepresents core historical or factual knowledge.
* 1 (Very Poor): Core factual relationships are incorrect or distorted; frequent contradictions with known facts or logical reasoning; significant inaccuracies in science, history, or other factual domains; implausible scenarios that undermine credibility.
* 2 (Poor): While most factual relationships are generally correct, there are notable inaccuracies or misrepresentations; the core facts are plausible but some details are wrong or incomplete; minor factual errors that don't severely affect the overall portrayal.
* 3 (Fair): Majority of factual elements are accurate, and logical relationships are well-maintained; only minor inaccuracies in specific domains or specialized knowledge; generally plausible depiction with slight factual discrepancies.
* 4 (Good): The depiction shows a high level of factual accuracy; complex relationships are correctly represented; specialized knowledge is precisely applied, with only minor technical inaccuracies or inconsistencies.
* 5 (Excellent): Complete empirical accuracy; there are no detectable factual errors or logical contradictions; every aspect aligns perfectly with the relevant knowledge domains, demonstrating exemplary research and execution.

**Spatial-Temporal Consistency (0-5):** Coherence in spatial evolution and temporal progression across the sequence, considering both short-term and long-term changes in the context of a causal narrative.
* 0 (Rejected): Spatial and temporal evolution is entirely incoherent; there are no logical relationships between the states; abrupt, random shifts with no narrative consistency; objects or environments teleport without any narrative justification.
* 1 (Very Poor): Significant spatial and temporal inconsistencies that hinder narrative flow; poor understanding of progression and transitions; movement and positioning are illogical, with abrupt and unmotivated changes that disrupt continuity.
* 2 (Poor): Some logical progression is present, but spatial evolution and temporal transitions are often unclear or inconsistent; movements are somewhat plausible but lack cohesion in complex scenarios or fail to respect causal logic.
* 3 (Fair):  Spatial and temporal transitions are mostly logical and plausible, with smooth progression overall; occasional disruptions or inconsistencies in movement or timing, but the general evolution remains coherent and the causal narrative holds.
* 4 (Good): Complex spatial evolution and temporal changes are well-executed; transitions are smooth and consistent; sophisticated understanding of causal relationships is applied with few minor inconsistencies that do not disrupt the overall flow.
* 5 (Excellent): Spatial and temporal evolution is flawlessly consistent with the narrative's causal logic; all changes in position, movement, and timing align with the story's progression and adhere to both immediate and long-term narrative consistency; impeccable execution of spatial-temporal relationships throughout the sequence.

**AESTHETIC DIMENSION** - Evaluate overall aesthetic quality across the sequence

**Expressiveness (0-5):** The emotional impact and visual storytelling conveyed through the arrangement of visual elements, balance, and flow across the sequence.
* 0 (Rejected): No emotional depth or clear visual narrative; elements lack cohesion or meaning; chaotic and incoherent design with no emotional connection.
* 1 (Very Poor): Minimal emotional expression; poorly communicated visual narrative; conflicting elements and arrangement that detract from the intended message.
* 2 (Poor): Simple visual arrangement with limited emotional expression; some effort at narrative is apparent, but the flow feels basic or incomplete; uneven balance in visual elements.
* 3 (Fair): Clear and effective emotional expression; visual flow supports the intended narrative; balanced elements that guide the viewer's attention with good use of space and composition.
* 4 (Good): Strong emotional engagement; dynamic arrangement that supports a compelling visual narrative; sophisticated design choices that enhance emotional tone and storytelling.
* 5 (Excellent): Exceptional emotional resonance; perfectly executed visual narrative that captures and amplifies the theme; masterful expressiveness in the arrangement of elements that tells a compelling story.

**Artistic Quality (0-5):** Overall aesthetic appeal, style coherence, and artistic merit across the sequence.
* 0 (Rejected): No coherent style; elements clash severely; visually painful to view; complete lack of artistic consideration.
* 1 (Very Poor): Inappropriate style choices; poor visual appeal; unbalanced aesthetic elements; amateurish execution; distracting aesthetic flaws.
* 2 (Poor): Functional but unrefined aesthetic; adequate visual appeal; simple style application; limited artistic effectiveness.
* 3 (Fair): Coherent style with good aesthetic relationships; appropriate emotional tone; technically sound artistic execution; generally pleasing appearance.
* 4 (Good): Sophisticated artistic execution; strong emotional impact through style; complex aesthetic relationships handled well; professional artistic quality.
* 5 (Excellent): Perfect aesthetic harmony throughout; innovative and emotionally resonant style; flawless artistic execution; exemplary aesthetic storytelling; world-class artistic design.

**Authenticity (0-5):** The believability and naturalness of the elements, ensuring that the sequence aligns with the intended reality or narrative.
* 0 (Rejected): The sequence looks completely artificial and lacks any attempt at realism; obvious digital artifacts; cartoonish appearance with no connection to reality.
* 1 (Very Poor): Major unrealistic elements dominate the sequence; obvious digital artifacts; unnatural lighting, textures, or distortions; the image feels clearly synthetic.
* 2 (Poor): Generally believable but with noticeable artificial elements; some aspects appear unnatural or inconsistent in realism, but the overall image is somewhat convincing.
* 3 (Fair): Good level of realism with only minor artificial elements; generally convincing depiction of reality; some minor issues in complex areas (lighting, texture, etc.).
* 4 (Good): Very believable image approaching photographic quality; subtle details enhance realism, and artificial elements are barely detectable.
* 5 (Excellent): Indistinguishable from real photography; perfect realism in all aspects; flawless material representation and expert-level rendering that conveys authenticity seamlessly.

**PHYSICALITY DIMENSION** - Evaluate physical properties and dynamics across the sequence

**Basic Properties (0-5):** Accuracy in fundamental scene properties including object quantities, basic shapes, geometric relationships, and size proportions across the sequence.
* 0 (Rejected): Wrong number of major objects; impossible geometric relationships; completely unrealistic proportions; no understanding of basic spatial organization.
* 1 (Very Poor): Significant errors in object counts (>30% wrong); major shape distortions; poor geometric understanding; clearly wrong size relationships.
* 2 (Poor): Approximate object counts generally correct within 20%; recognizable but imperfect shapes; basic geometric relationships mostly maintained; roughly plausible proportions.
* 3 (Fair): Object counts within 15% of intended; shapes accurately represented with minor flaws; good geometric consistency; generally correct size relationships.
* 4 (Good): Precise object quantities; well-defined shapes; sophisticated geometric relationships; excellent proportional accuracy; professional-level spatial organization.
* 5 (Excellent): Perfect object counts and distributions; mathematically precise shapes and forms; flawless geometric relationships; exact proportional accuracy throughout.

**Dynamics and Interactivity (0-5):** Realism in physical dynamics including motion trajectories, force interactions, fluid/rigid body behaviors, and object interactions across the sequence.
* 0 (Rejected): Motion trajectories completely unrealistic; impossible force interactions; no understanding of dynamics; objects interact in physically impossible ways; fluid/rigid body behaviors completely wrong.
* 1 (Very Poor): Major motion trajectory errors; unrealistic force applications; poor understanding of dynamics; clearly wrong interaction patterns; fluid behaviors significantly distorted.
* 2 (Poor): Basic motion trajectories generally plausible; simple force interactions mostly correct; adequate but imperfect dynamics; generally believable interactions with noticeable flaws.
* 3 (Fair): Good motion trajectory realism; proper force applications; technically sound dynamics; convincing interaction patterns with minor flaws; fluid/rigid body behaviors mostly correct.
* 4 (Good): Sophisticated motion trajectories; complex force interactions handled well; professional-level dynamics; realistic and nuanced object interactions; accurate fluid/rigid body simulations.
* 5 (Excellent): Perfect motion physics throughout; flawless force interactions; exemplary dynamics in all aspects; indistinguishable from real physical interactions; professional-grade fluid/rigid body behaviors.

**Physical Reliability (0-5):** Adherence to fundamental physical laws across the sequence.
* 0 (Rejected): Spatial evolution is completely illogical or random; objects appear, disappear, or teleport without cause; no discernible progression; chaotic and physically impossible movements.
* 1 (Very Poor): Major inconsistencies in object movement or scene evolution; poor understanding of physical progression; frequent illogical transitions; severe continuity errors in position or timing.
* 2 (Poor): Basic spatial progression is generally logical but contains noticeable flaws; some object movements or transitions lack smoothness; plausible overall but with clear inconsistencies in complex actions.
* 3 (Fair): Spatial evolution is mostly logical and coherent; object movements show reasonable continuity; minor issues in timing or complex transitions; generally smooth but not fully polished.
* 4 (Good): Spatial progression is consistently logical and well-executed; complex movements and transitions are handled adeptly; strong temporal coherence with only subtle imperfections.
* 5 (Excellent): Spatial-temporal evolution is perfectly logical, fluid, and physically plausible; all movements and transitions demonstrate flawless continuity and natural progression; exemplary understanding of spatiotemporal dynamics.

---

## Output Format

**Do not include any other text, explanations, or labels.** You must return only nine lines of text, each containing a metric and the corresponding score, for example:

**Example Output:**
Semantic Consistency: 3
Factual Consistency: 5
Spatial-Temporal Consistency: 2
Expressiveness: 4
Artistic Quality: 3
Authenticity: 4
Basic Properties: 5
Dynamics and Interactivity: 3
Physical Reliability: 5

---

**IMPORTANT Enforcement:**

Be EXTREMELY strict in your evaluation. A score of '5' should be exceedingly rare and reserved only for sequences that truly excel and meet the highest possible standards in each metric. If there is any doubt, downgrade the score.

Evaluate the ENTIRE 4-step sequence as a cohesive unit, considering progression, continuity, and evolution across all steps.

Each dimension has specific, exhaustive criteria that must be followed precisely. Do not generalize or make assumptions beyond what is explicitly stated in the rubrics.

Please strictly adhere to the scoring criteria and follow the template format when providing your results."""
                },
                *image_contents
            ]
        }
    ]

def evaluate_sequence(index: str, sequence_data: Dict, cfg: Dict) -> Tuple[Dict, Dict]:
    """Evaluate a complete 4-step sequence."""
    try:
        print(f"Evaluating sequence {index} ...")
        
        # Get all step numbers
        steps = [prompt["step"] for prompt in sequence_data["prompts"]]
        if len(steps) != 4:
            print(f"[WARN] Sequence {index} has {len(steps)} steps, expected 4")
        
        # Get image paths for all steps
        image_paths = find_image_paths(index, cfg["image_dir"], steps)
        if len(image_paths) != len(steps):
            print(f"[WARN] Sequence {index} has {len(image_paths)}/{len(steps)} images")
            return None
        
        # Encode all images in step order
        image_base64_list = []
        for step in sorted(steps):
            if step in image_paths:
                encoded = encode_image(image_paths[step])
                if encoded:
                    image_base64_list.append(encoded)
                else:
                    print(f"[ERROR] Failed to encode image for step {step}")
                    return None
        
        # Build evaluation messages
        msgs = build_sequence_evaluation_messages(sequence_data, image_base64_list)
        
        # Initialize OpenAI client
        client = openai.OpenAI(
            api_key=cfg["api_key"],
            base_url=cfg["api_base"] if cfg["api_base"] else None
        )
        
        # Call API
        resp = client.chat.completions.create(
            model=cfg["model"],
            messages=msgs,
            temperature=0.3,
            max_tokens=2000
        )
        eval_txt = resp.choices[0].message.content
        scores = extract_scores(eval_txt)

        print(f"\n--- Sequence {index} ---\n{eval_txt}\nScores: {scores}\n--------------\n")

        # 计算综合分数
        comprehensive_scores = calculate_comprehensive_scores(scores)

        # Build step information for full record
        step_info = []
        for step_data in sequence_data["prompts"]:
            step = step_data["step"]
            step_info.append({
                "step": step,
                "prompt": step_data["prompt"],
                "explanation": step_data["explanation"],
                "image_path": image_paths.get(step, "")
            })

        return (
            {  # full record
                "index": index,
                "category": sequence_data["category"],
                "process_type": sequence_data["process_type"],
                "steps": step_info,
                "evaluation": eval_txt,
                "individual_scores": scores,
                "comprehensive_scores": comprehensive_scores
            },
            {  # score record (简化版，用于分析)
                "index": index,
                "category": sequence_data["category"],
                "process_type": sequence_data["process_type"],
                # 原始分数
                **scores,
                # 综合分数
                "consistency_score": comprehensive_scores["consistency_score"],
                "aesthetic_score": comprehensive_scores["aesthetic_score"],
                "physicality_score": comprehensive_scores["physicality_score"],
                "overall_score": comprehensive_scores["overall_score"],
                "overall_grade": comprehensive_scores["overall_grade"],
                "pass_rate_3": comprehensive_scores["pass_rate_3"],
                "pass_rate_4": comprehensive_scores["pass_rate_4"]
            }
        )
    except Exception as e:
        print(f"[ERR] Sequence {index}: {e}")
        import traceback
        traceback.print_exc()
        return None

def calculate_std(scores: List[float]) -> float:
    """计算标准差"""
    if len(scores) <= 1:
        return 0.0
    mean = sum(scores) / len(scores)
    variance = sum((x - mean) ** 2 for x in scores) / (len(scores) - 1)
    return math.sqrt(variance)

def analyze_comprehensive_results(all_scores: List[Dict]) -> Dict:
    """分析综合评分结果"""
    
    if not all_scores:
        return {}
    
    analysis = {
        "dimension_performance": {},
        "score_distribution": {},
        "ranking": {},
        "summary": {}
    }
    
    # 收集所有综合分数
    consistency_scores = [s.get("consistency_score", 0) for s in all_scores]
    aesthetic_scores = [s.get("aesthetic_score", 0) for s in all_scores]
    physicality_scores = [s.get("physicality_score", 0) for s in all_scores]
    overall_scores = [s.get("overall_score", 0) for s in all_scores]
    
    # 维度性能分析
    for dim_name, scores in [
        ("consistency", consistency_scores),
        ("aesthetic", aesthetic_scores),
        ("physicality", physicality_scores),
        ("overall", overall_scores)
    ]:
        analysis["dimension_performance"][dim_name] = {
            "mean": round(sum(scores) / len(scores), 2),
            "max": round(max(scores), 2),
            "min": round(min(scores), 2),
            "std": round(calculate_std(scores), 2)
        }
    
    # 按总体分数排序
    sorted_indices = sorted(
        [(i, s["overall_score"]) for i, s in enumerate(all_scores)],
        key=lambda x: x[1],
        reverse=True
    )
    
    analysis["ranking"] = {
        "top_5": [{"index": all_scores[i]["index"], "score": all_scores[i]["overall_score"]} for i, _ in sorted_indices[:5]],
        "bottom_5": [{"index": all_scores[i]["index"], "score": all_scores[i]["overall_score"]} for i, _ in sorted_indices[-5:]]
    }
    
    # 总体统计
    analysis["summary"] = {
        "total_sequences": len(all_scores),
        "weight_ratio": "Consistency:Physicality:Aesthetic = 4:4:2",
        "average_overall_score": round(sum(overall_scores) / len(overall_scores), 2),
        "excellent_sequences": sum(1 for s in overall_scores if s >= 4.5),
        "good_sequences": sum(1 for s in overall_scores if 3.5 <= s < 4.5),
        "fair_sequences": sum(1 for s in overall_scores if 3.0 <= s < 3.5),
        "poor_sequences": sum(1 for s in overall_scores if s < 3.0)
    }
    
    return analysis

def save_results(data: List[Dict], filename: str, cfg: Dict):
    """Save results to file."""
    path = os.path.join(cfg["output_dir"], filename)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    
    if filename.endswith('.jsonl'):
        with open(path, 'w', encoding='utf-8') as f:
            for item in data:
                f.write(json.dumps(item, ensure_ascii=False) + '\n')
    else:
        with open(path, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
    print(f"[SAVE] {path} - {len(data)} records")

def main():
    args = parse_arguments()
    cfg = get_config(args)
    
    # Create output directory
    Path(cfg["output_dir"]).mkdir(parents=True, exist_ok=True)
    print(f"Output directory: {cfg['output_dir']}")

    # Load sequence data
    sequences = load_sequences(cfg["json_path"])
    if not sequences:
        print("No sequences loaded. Exiting.")
        return

    # Load existing results
    exist_scores = load_jsonl(os.path.join(cfg["output_dir"], cfg["result_files"]["scores"]))
    exist_full = load_json(os.path.join(cfg["output_dir"], cfg["result_files"]["full"]))
    done_indices = set(exist_scores.keys())

    print(f"Found {len(done_indices)} already evaluated sequences")

    # Prepare tasks for unevaluated sequences
    tasks = []
    for index, sequence_data in sequences.items():
        if index in done_indices:
            print(f"[SKIP] Sequence {index}: Already evaluated")
            continue
        
        # Check if all images exist
        steps = [prompt["step"] for prompt in sequence_data["prompts"]]
        image_paths = find_image_paths(index, cfg["image_dir"], steps)
        
        if len(image_paths) == len(steps):
            tasks.append((index, sequence_data))
            print(f"[QUEUE] Sequence {index}: Ready for evaluation")
        else:
            print(f"[SKIP] Sequence {index}: Missing images ({len(image_paths)}/{len(steps)})")

    print(f"Prepared {len(tasks)} sequences for evaluation")

    # Multi-threaded evaluation
    if tasks:
        with concurrent.futures.ThreadPoolExecutor(max_workers=cfg["max_workers"]) as executor:
            future_to_index = {
                executor.submit(evaluate_sequence, index, seq_data, cfg): index 
                for index, seq_data in tasks
            }
            
            for future in concurrent.futures.as_completed(future_to_index):
                index = future_to_index[future]
                try:
                    result = future.result()
                    if result is not None:
                        full_rec, score_rec = result
                        exist_full[index] = full_rec
                        exist_scores[index] = score_rec
                        print(f"[SUCCESS] Completed evaluation for sequence {index}")
                    else:
                        print(f"[FAILED] Evaluation failed for sequence {index}")
                except Exception as e:
                    print(f"[ERR] Failed to evaluate sequence {index}: {e}")
    else:
        print("No tasks to process.")

    # Sort and save results
    full_sorted = [exist_full[k] for k in sorted(exist_full.keys())]
    score_sorted = [exist_scores[k] for k in sorted(exist_scores.keys())]

    save_results(full_sorted, cfg["result_files"]["full"], cfg)
    save_results(score_sorted, cfg["result_files"]["scores"], cfg)

    # 生成分析报告
    if score_sorted:
        analysis = analyze_comprehensive_results(score_sorted)
        analysis_path = os.path.join(cfg["output_dir"], "analysis_report.json")
        with open(analysis_path, 'w', encoding='utf-8') as f:
            json.dump({
                "analysis": analysis,
                "timestamp": datetime.now().isoformat(),
                "total_sequences": len(score_sorted)
            }, f, ensure_ascii=False, indent=2)
        print(f"Analysis report saved to: {analysis_path}")
        
        # 打印简要报告
        print("\n=== EVALUATION SUMMARY ===")
        print(f"Total sequences evaluated: {analysis['summary']['total_sequences']}")
        print(f"Overall average score: {analysis['summary']['average_overall_score']}")
        print(f"Weight ratio: {analysis['summary']['weight_ratio']}")
        print(f"Excellent sequences (≥4.5): {analysis['summary']['excellent_sequences']}")
        print(f"Good sequences (3.5-4.5): {analysis['summary']['good_sequences']}")
        print(f"Fair sequences (3.0-3.5): {analysis['summary']['fair_sequences']}")
        print(f"Poor sequences (<3.0): {analysis['summary']['poor_sequences']}")

    print(f"Evaluation completed. Total sequences: {len(full_sorted)}")

if __name__ == "__main__":
    main()