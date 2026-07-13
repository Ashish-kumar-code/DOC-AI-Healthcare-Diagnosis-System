"""
Expand DOC-AI symptom dataset from ~120 rows to 1000 rows (125 per disease).
Generates medically plausible synthetic data with diverse symptom descriptions.
"""

import pandas as pd
import numpy as np
import random
import os

SEED = 42
random.seed(SEED)
np.random.seed(SEED)

TARGET_PER_DISEASE = 125
DISEASES = [
    "Common Cold", "Pneumonia", "Bronchitis", "Malaria",
    "Dengue", "Flu", "Allergy", "Typhoid",
]

DISEASE_CONFIG = {
    "Common Cold": {
        "temp_range": (98.0, 100.5),
        "pain_range": (1, 4),
        "duration_range": (3, 10),
        "severities": ["mild", "moderate"],
        "templates": [
            "I have a runny nose, sneezing, and a sore throat for {d} days.",
            "I've been sneezing a lot with nasal congestion and mild headache for {d} days.",
            "I have a mild cough, runny nose, and feel tired for the past {d} days.",
            "Experiencing congestion, watery eyes, and a scratchy throat for {d} days.",
            "I've had a sore throat and runny nose with occasional sneezing for {d} days.",
            "I have nasal congestion, mild headache, and fatigue for {d} days.",
            "My nose has been running constantly with sneezing and a mild cough for {d} days.",
            "I feel congested with a slight sore throat and watery eyes for {d} days.",
            "I've been dealing with sneezing fits, runny nose, and a headache for {d} days.",
            "I have congestion, mild body aches, and a sore throat for the past {d} days.",
            "I woke up with a stuffy nose, sneezing, and a mild fever {d} days ago.",
            "I have a scratchy throat with congestion and occasional coughing for {d} days.",
            "Experiencing watery eyes, constant sneezing, and nasal drip for {d} days.",
            "I've had a mild fever, runny nose, and feel fatigued for the last {d} days.",
            "I have a mild cough with sore throat and head congestion for {d} days.",
            "My throat feels raw and I have a blocked nose with sneezing for {d} days.",
            "I've been sneezing with a runny nose and mild body pain for about {d} days.",
            "Feeling tired with a stuffy nose, sore throat, and mild headache for {d} days.",
            "I have congestion, post-nasal drip, and sneezing since {d} days.",
            "I've had a mild cough, congestion, and watery eyes for {d} days now.",
            "I feel under the weather with sneezing, runny nose, and mild fatigue for {d} days.",
            "I have a low-grade fever with nasal congestion and throat irritation for {d} days.",
            "Sneezing constantly with a blocked nose and slight headache for the past {d} days.",
            "I've had a runny nose, mild cough, and body aches for about {d} days.",
            "I'm experiencing sore throat, nasal drip, and fatigue for {d} days.",
            "I have a head cold with sneezing, congestion, and watery eyes for {d} days.",
            "My nose is stuffy and I have a mild sore throat with tiredness for {d} days.",
            "I've been feeling congested with sneezing and a slight fever for {d} days.",
            "I have a mild cold with runny nose, headache, and fatigue lasting {d} days.",
            "Experiencing throat discomfort, congestion, and frequent sneezing for {d} days.",
            "I've had nasal congestion, a mild cough, and feel run down for {d} days.",
            "I have sneezing episodes with a runny nose and mild body aches for {d} days.",
        ],
    },
    "Pneumonia": {
        "temp_range": (100.5, 104.0),
        "pain_range": (4, 8),
        "duration_range": (5, 21),
        "severities": ["moderate", "severe"],
        "templates": [
            "I have severe cough, chest pain, and high fever for {d} days.",
            "I've been coughing up phlegm with chest tightness and difficulty breathing for {d} days.",
            "Experiencing high fever, chills, and a productive cough for the past {d} days.",
            "I have chest pain when I breathe, along with fever and fatigue for {d} days.",
            "I've had shortness of breath, persistent cough, and high fever for {d} days.",
            "I have a deep cough with greenish phlegm and chest discomfort for {d} days.",
            "Feeling very weak with high fever, chills, and coughing up mucus for {d} days.",
            "I have difficulty breathing, sharp chest pain, and a productive cough for {d} days.",
            "I've been running a high fever with severe cough and extreme tiredness for {d} days.",
            "My chest hurts when I cough and I have a high temperature for {d} days.",
            "I have fever with chills, cough with phlegm, and difficulty breathing for {d} days.",
            "Experiencing rapid breathing, chest pain, and persistent fever for {d} days.",
            "I've had a wet cough, high fever, and feel extremely fatigued for {d} days.",
            "I have sharp pain in my chest, shortness of breath, and fever for {d} days.",
            "I'm coughing constantly with thick mucus and have a high fever for {d} days.",
            "I have severe chest congestion, fever, and struggle to breathe for {d} days.",
            "Experiencing high fever, productive cough, and sweating at night for {d} days.",
            "I've been having trouble breathing with chest pain and high fever for {d} days.",
            "I have a persistent cough with blood-tinged phlegm and fever for {d} days.",
            "My chest feels heavy, I have a high fever, and I'm very weak for {d} days.",
            "I've had chest pain, difficulty breathing, and fever with chills for {d} days.",
            "I have a deep chest cough with yellow-green sputum and high fever for {d} days.",
            "Experiencing severe fatigue, high fever, and coughing with phlegm for {d} days.",
            "I can barely breathe and have a high fever with chest tightness for {d} days.",
            "I have shaking chills, high fever, and a painful cough for {d} days.",
            "My breathing is shallow and painful with a high fever for the last {d} days.",
            "I've been coughing up thick mucus, have chest pain, and a high fever for {d} days.",
            "I have a high fever that won't break, chest pain, and shortness of breath for {d} days.",
            "Experiencing labored breathing, persistent cough, and fever for {d} days.",
            "I've had stabbing chest pain, productive cough, and high fever for {d} days.",
            "I have chills, cough with phlegm, and it hurts to take deep breaths for {d} days.",
            "I feel extremely ill with chest pain, coughing, and a high temperature for {d} days.",
        ],
    },
    "Bronchitis": {
        "temp_range": (98.5, 101.5),
        "pain_range": (3, 6),
        "duration_range": (7, 21),
        "severities": ["mild", "moderate", "severe"],
        "templates": [
            "I have a persistent cough with mucus production and chest discomfort for {d} days.",
            "I've been coughing up mucus for {d} days with wheezing and tiredness.",
            "Experiencing a nagging cough, mild fever, and sore chest for {d} days.",
            "I have chest tightness, productive cough, and wheezing for the past {d} days.",
            "I've had a cough that won't go away with mucus and fatigue for {d} days.",
            "I have wheezing, a persistent cough, and mild fever for {d} days.",
            "My chest feels sore from constant coughing with mucus for {d} days.",
            "I've been coughing with thick mucus and feel short of breath for {d} days.",
            "Experiencing chest discomfort, cough with sputum, and tiredness for {d} days.",
            "I have a low-grade fever, persistent cough, and wheezing for {d} days.",
            "I've had a rattling cough with mucus and chest soreness for about {d} days.",
            "I have a deep cough producing clear mucus with mild chest pain for {d} days.",
            "My cough has been getting worse with wheezing and mild fever for {d} days.",
            "I have chest congestion, a productive cough, and fatigue for {d} days.",
            "I've been wheezing with a persistent cough and feel exhausted for {d} days.",
            "Experiencing a barking cough, mucus, and tightness in my chest for {d} days.",
            "I have a continuous cough with yellowish mucus and mild body aches for {d} days.",
            "I've had chest discomfort with coughing and shortness of breath for {d} days.",
            "My cough produces a lot of phlegm and I have a mild fever for {d} days.",
            "I have a lingering cough, sore chest, and feel run down for {d} days.",
            "I've been dealing with chest tightness, cough, and wheezing for {d} days.",
            "Experiencing persistent coughing, mucus production, and fatigue for {d} days.",
            "I have a hacking cough with mucus and my chest hurts for {d} days.",
            "I've had wheezing, a wet cough, and chest discomfort for about {d} days.",
            "My chest feels congested and I have a productive cough for {d} days.",
            "I have a chronic cough with clear sputum, wheezing, and tiredness for {d} days.",
            "I've been coughing non-stop with chest soreness and mild fever for {d} days.",
            "Experiencing mucus-producing cough, chest tightness, and fatigue for {d} days.",
            "I have a deep wet cough, wheezing, and feeling of heaviness in chest for {d} days.",
            "I've had a cough that worsens at night with mucus and chest pain for {d} days.",
            "I have difficulty breathing, persistent cough, and mild temperature for {d} days.",
            "I've been coughing heavily with mucus discharge and chest discomfort for {d} days.",
        ],
    },
    "Malaria": {
        "temp_range": (101.0, 105.0),
        "pain_range": (5, 9),
        "duration_range": (3, 14),
        "severities": ["moderate", "severe"],
        "templates": [
            "I have high fever with chills and shivering, along with headache for {d} days.",
            "I've been having cyclic fever, sweating, and extreme weakness for {d} days.",
            "Experiencing high fever, body aches, and nausea for the past {d} days.",
            "I have fever with chills and vomiting for {d} days.",
            "I've had recurring fever episodes with intense sweating and fatigue for {d} days.",
            "I have high fever, severe headache, and joint pain for {d} days.",
            "Experiencing intermittent fever with chills, body aches, and weakness for {d} days.",
            "I've been shivering with high fever and profuse sweating for {d} days.",
            "I have cyclical fever, nausea, vomiting, and extreme body pain for {d} days.",
            "My fever comes and goes with chills, headache, and fatigue for {d} days.",
            "I have high temperature with shaking chills and muscle aches for {d} days.",
            "I've been feeling very weak with recurring fever and sweating for {d} days.",
            "Experiencing fever spikes with chills, joint pain, and loss of appetite for {d} days.",
            "I have periodic high fever, nausea, and severe body aches for {d} days.",
            "I've had bouts of fever with sweating, headache, and vomiting for {d} days.",
            "I have high fever alternating with chills and extreme tiredness for {d} days.",
            "My fever keeps coming back with profuse sweating and body pain for {d} days.",
            "I've been experiencing chills followed by fever and severe weakness for {d} days.",
            "I have intense headache, high fever with chills, and nausea for {d} days.",
            "Experiencing high fever, cold sweats, and severe joint pain for {d} days.",
            "I've had relapsing fever, shivering, and can barely eat for {d} days.",
            "I have a very high temperature, body aches, and vomiting for {d} days.",
            "I've been having fever episodes every other day with chills for {d} days.",
            "I feel extremely weak with high fever, headache, and body pain for {d} days.",
            "Experiencing periodic fever with intense sweating and muscle aches for {d} days.",
            "I have fever that spikes suddenly with chills and nausea for {d} days.",
            "I've been vomiting with high fever and severe body aches for {d} days.",
            "I have alternating chills and fever with extreme fatigue for {d} days.",
            "My body aches terribly with high fever and cold sweats for {d} days.",
            "I've had high fever, rigors, and intense joint pain for {d} days.",
            "I have recurrent fever with nausea, sweating, and weakness for {d} days.",
            "Experiencing high fever episodes, severe headache, and body pain for {d} days.",
        ],
    },
    "Dengue": {
        "temp_range": (101.0, 104.5),
        "pain_range": (6, 10),
        "duration_range": (4, 14),
        "severities": ["moderate", "severe"],
        "templates": [
            "I have high fever, severe headache, and pain behind my eyes for {d} days.",
            "Experiencing sudden high fever, nausea, and severe body pain for {d} days.",
            "I have high fever with joint pain, muscle pain, and skin rash for {d} days.",
            "I've had intense headache behind my eyes, high fever, and fatigue for {d} days.",
            "I have severe joint and muscle pain with high fever for {d} days.",
            "Experiencing high fever, bleeding gums, and extreme body aches for {d} days.",
            "I've been having high fever, rash, and severe headache for the past {d} days.",
            "I have excruciating body pain, high fever, and pain behind eyes for {d} days.",
            "My joints ache terribly with high fever and skin rash for {d} days.",
            "I've had sudden onset of high fever with severe muscle pain for {d} days.",
            "I have high fever, eye pain, and red spots on my skin for {d} days.",
            "Experiencing extreme fatigue, high fever, and aching joints for {d} days.",
            "I have a high temperature, intense headache, and muscle soreness for {d} days.",
            "I've been running a high fever with severe body pain and rash for {d} days.",
            "I have fever, retro-orbital pain, and my joints are very painful for {d} days.",
            "Experiencing high fever, nausea, and pain all over my body for {d} days.",
            "I've had high fever with a rash on my torso and severe headache for {d} days.",
            "I have intense joint pain, high fever, and bleeding from gums for {d} days.",
            "My fever is very high with extreme body aches and eye pain for {d} days.",
            "I've been feeling terrible with high fever, joint pain, and fatigue for {d} days.",
            "I have a sudden high fever, severe headache, and muscle cramps for {d} days.",
            "Experiencing high fever, skin rash, and agonizing body pain for {d} days.",
            "I've had high fever, pain behind eyes, and petechial rash for {d} days.",
            "I have high fever, loss of appetite, and severe joint pain for {d} days.",
            "My body is aching severely with high fever and headache for {d} days.",
            "I've been having high fever, eye pain, and my muscles are very sore for {d} days.",
            "I have high fever with bruising easily and extreme tiredness for {d} days.",
            "Experiencing sudden high fever with severe body and joint pain for {d} days.",
            "I've had high fever, nosebleeds, and intense headache for {d} days.",
            "I have very high fever, rash, and pain in all my joints for {d} days.",
            "My eyes hurt badly with high fever and severe muscle aches for {d} days.",
            "I have high fever, extreme weakness, and pain behind both eyes for {d} days.",
        ],
    },
    "Flu": {
        "temp_range": (100.0, 103.5),
        "pain_range": (4, 7),
        "duration_range": (3, 10),
        "severities": ["moderate", "severe"],
        "templates": [
            "I have high fever, dry cough, severe body ache, and extreme fatigue for {d} days.",
            "I've had sudden high fever with body pain and weakness for {d} days.",
            "Experiencing chills, headache, muscle pain, and loss of appetite for {d} days.",
            "I have a high fever, sore throat, and extreme tiredness for {d} days.",
            "I've been having body aches, dry cough, and high fever for {d} days.",
            "I have sudden onset fever, chills, and severe muscle pain for {d} days.",
            "Experiencing extreme fatigue, high fever, and runny nose for {d} days.",
            "I've had a high fever with body aches, headache, and sore throat for {d} days.",
            "I have chills, aching muscles, and a persistent dry cough for {d} days.",
            "I feel extremely tired with high fever and body pain for the past {d} days.",
            "I've been shivering with fever, headache, and severe body aches for {d} days.",
            "I have a high temperature, dry cough, and can barely get out of bed for {d} days.",
            "Experiencing sudden fever, muscle soreness, and loss of energy for {d} days.",
            "I've had fever, sore throat, runny nose, and extreme weakness for {d} days.",
            "I have aching joints, high fever, and a dry cough that won't stop for {d} days.",
            "My whole body hurts with high fever and I feel completely exhausted for {d} days.",
            "I've been having chills and fever with severe headache and cough for {d} days.",
            "I have a sudden high fever, body aches, and I can't eat anything for {d} days.",
            "Experiencing high fever, nasal congestion, and extreme body pain for {d} days.",
            "I've had fever with chills, dry cough, and severe fatigue for {d} days.",
            "I have a high fever, aching muscles, and a very sore throat for {d} days.",
            "My fever started suddenly with chills, cough, and weakness for {d} days.",
            "I've been sick with high fever, body aches, and headache for {d} days.",
            "I have extreme tiredness, high fever, and muscle pain for {d} days.",
            "Experiencing fever, dry cough, sore throat, and body aches for {d} days.",
            "I've had a high temperature with chills, headache, and runny nose for {d} days.",
            "I have severe body aches, fever, and feel completely drained for {d} days.",
            "My fever hit suddenly with dry cough and extreme muscle soreness for {d} days.",
            "I've been feeling awful with high fever, chills, and cough for {d} days.",
            "I have fever, severe headache, body aches, and no appetite for {d} days.",
            "Experiencing high fever, aching body, sore throat, and fatigue for {d} days.",
            "I've had sudden chills, high fever, and intense body pain for {d} days.",
        ],
    },
    "Allergy": {
        "temp_range": (97.5, 99.5),
        "pain_range": (1, 3),
        "duration_range": (1, 30),
        "severities": ["mild", "moderate"],
        "templates": [
            "I have sneezing, itchy eyes, runny nose, and skin rash for {d} days.",
            "I've been having itchy eyes, nasal congestion, and hives for {d} days.",
            "Experiencing sneezing fits, watery eyes, and an itchy throat for {d} days.",
            "I have nasal congestion, watery eyes, and mild cough for {d} days.",
            "I've had itching and hives after exposure to dust for {d} days.",
            "I have a runny nose, sneezing, and itchy skin for the past {d} days.",
            "Experiencing skin rash, nasal congestion, and watery eyes for {d} days.",
            "I've been sneezing constantly with itchy, watery eyes for {d} days.",
            "I have hives on my skin, runny nose, and itchy throat for {d} days.",
            "My eyes are itchy and watery with constant sneezing for {d} days.",
            "I've had nasal drip, sneezing, and skin irritation for {d} days.",
            "I have an itchy throat, runny nose, and swollen eyes for {d} days.",
            "Experiencing persistent sneezing, congestion, and itchy skin for {d} days.",
            "I've been having skin rash with nasal congestion and watery eyes for {d} days.",
            "I have itchy, red eyes, frequent sneezing, and nasal drip for {d} days.",
            "My nose has been running with sneezing and skin hives for {d} days.",
            "I've had allergic reactions with sneezing, itching, and congestion for {d} days.",
            "I have swollen nasal passages, watery eyes, and skin rash for {d} days.",
            "Experiencing itchy eyes, blocked nose, and throat irritation for {d} days.",
            "I've been dealing with hives, sneezing, and runny nose for {d} days.",
            "I have congestion, itchy eyes, and a scratchy throat for {d} days.",
            "My skin has been itchy with sneezing and watery eyes for {d} days.",
            "I've had sneezing episodes, nasal congestion, and eye irritation for {d} days.",
            "I have a runny nose with itchy throat and mild skin rash for {d} days.",
            "Experiencing nasal drip, sneezing, and puffy eyes for {d} days.",
            "I've been sneezing with itchy skin and watery, red eyes for {d} days.",
            "I have blocked nose, watery eyes, and itching all over for {d} days.",
            "My allergies are acting up with sneezing, congestion, and hives for {d} days.",
            "I've had itchy, watery eyes, constant sneezing, and nasal congestion for {d} days.",
            "I have skin hives, runny nose, and throat itchiness for {d} days.",
            "Experiencing constant sneezing, itchy eyes, and mild congestion for {d} days.",
            "I've been having nasal irritation, watery eyes, and skin rash for {d} days.",
        ],
    },
    "Typhoid": {
        "temp_range": (101.0, 104.5),
        "pain_range": (4, 8),
        "duration_range": (7, 28),
        "severities": ["moderate", "severe"],
        "templates": [
            "I have sustained high fever, stomach pain, headache, and weakness for {d} days.",
            "I've been having persistent fever, loss of appetite, and abdominal pain for {d} days.",
            "Experiencing high fever, constipation, and extreme fatigue for {d} days.",
            "I have high fever with rose spots on my skin and weakness for {d} days.",
            "I've had sustained fever, diarrhea, and loss of appetite for {d} days.",
            "I have fever, stomach pain, headache, and feel very weak for {d} days.",
            "Experiencing prolonged high fever, abdominal discomfort, and fatigue for {d} days.",
            "I've been running a high fever with stomach pain and no appetite for {d} days.",
            "I have sustained fever, weakness, and diarrhea for {d} days.",
            "My fever has been continuous with stomach cramps and headache for {d} days.",
            "I've had high fever, loss of appetite, and constipation for {d} days.",
            "I have a persistent high fever with abdominal pain and extreme tiredness for {d} days.",
            "Experiencing steady fever, headache, and stomach pain for the past {d} days.",
            "I've been feeling very weak with sustained fever and poor appetite for {d} days.",
            "I have continuous high fever, loose stools, and body weakness for {d} days.",
            "My fever won't go down and I have stomach pain with headache for {d} days.",
            "I've had prolonged fever, abdominal discomfort, and constipation for {d} days.",
            "I have high fever, weakness, stomach cramps, and no desire to eat for {d} days.",
            "Experiencing sustained fever, diarrhea, and severe fatigue for {d} days.",
            "I've been sick with continuous fever, headache, and abdominal pain for {d} days.",
            "I have a step-ladder fever pattern with weakness and stomach pain for {d} days.",
            "My fever has been rising steadily with loss of appetite for {d} days.",
            "I've had high fever, abdominal bloating, and extreme weakness for {d} days.",
            "I have persistent high temperature, headache, and diarrhea for {d} days.",
            "Experiencing continuous fever, stomach discomfort, and fatigue for {d} days.",
            "I've been having sustained fever, poor appetite, and constipation for {d} days.",
            "I have high fever with coated tongue and abdominal tenderness for {d} days.",
            "My fever has been unremitting with stomach pain and weakness for {d} days.",
            "I've had continuous high fever, loose motions, and loss of energy for {d} days.",
            "I have prolonged fever, headache, and abdominal cramps for {d} days.",
            "Experiencing steady high fever, fatigue, and stomach pain for {d} days.",
            "I've been running a continuous fever with weakness and no appetite for {d} days.",
        ],
    },
}


def generate_row(disease: str, config: dict) -> dict:
    """Generate one synthetic row for the given disease."""
    temp_lo, temp_hi = config["temp_range"]
    pain_lo, pain_hi = config["pain_range"]
    dur_lo, dur_hi = config["duration_range"]

    duration = random.randint(dur_lo, dur_hi)
    template = random.choice(config["templates"])

    return {
        "age": random.randint(18, 80),
        "gender": random.choice(["male", "female"]),
        "duration_days": duration,
        "severity": random.choice(config["severities"]),
        "temperature": round(random.uniform(temp_lo, temp_hi), 1),
        "pain_level": random.randint(pain_lo, pain_hi),
        "disease": disease,
        "symptom_text": template.format(d=duration),
    }


def main():
    dataset_path = os.path.join(
        os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
        "datasets",
        "symptom_dataset.csv",
    )

    print(f"Reading existing dataset from: {dataset_path}")
    df_existing = pd.read_csv(dataset_path)
    print(f"Existing rows: {len(df_existing)}")
    print(f"Existing distribution:\n{df_existing['disease'].value_counts().to_string()}\n")

    new_rows = []
    for disease in DISEASES:
        config = DISEASE_CONFIG[disease]
        existing_count = len(df_existing[df_existing["disease"] == disease])
        needed = TARGET_PER_DISEASE - existing_count

        if needed <= 0:
            print(f"  {disease}: already has {existing_count} rows, skipping.")
            continue

        print(f"  {disease}: {existing_count} existing, generating {needed} new rows...")
        for _ in range(needed):
            new_rows.append(generate_row(disease, config))

    df_new = pd.DataFrame(new_rows)
    df_expanded = pd.concat([df_existing, df_new], ignore_index=True)

    # Shuffle the dataset
    df_expanded = df_expanded.sample(frac=1, random_state=SEED).reset_index(drop=True)

    df_expanded.to_csv(dataset_path, index=False)
    print(f"\nExpanded dataset saved to: {dataset_path}")
    print(f"Total rows: {len(df_expanded)}")
    print(f"\nFinal distribution:\n{df_expanded['disease'].value_counts().to_string()}")
    print(f"\nColumn dtypes:\n{df_expanded.dtypes.to_string()}")


if __name__ == "__main__":
    main()
