#!/usr/bin/env python3
"""Train Random Forest baseline for soybean health (Doctor Soya Science Lab)."""
import argparse
import json
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split

FEATURES = [
    "ndvi", "ndre", "evi", "lswi", "msi", "dpRvi", "rvi",
    "ndviSlope7d", "ndreSlope7d", "daysFromPlanting", "lst",
]
LABELS = ["excellent", "good", "warning", "critical"]


def synth_dataset(n=800, seed=42):
    rng = np.random.default_rng(seed)
    X, y = [], []
    for _ in range(n):
        ndvi = rng.uniform(0.35, 0.85)
        ndre = ndvi * rng.uniform(0.75, 0.95) - rng.uniform(0, 0.08)
        msi = rng.uniform(0.8, 2.2)
        dp = rng.uniform(0.08, 0.35)
        row = [
            ndvi, ndre, rng.uniform(0.3, 0.7), rng.uniform(-0.1, 0.3),
            msi, dp, rng.uniform(0.3, 0.8),
            rng.uniform(-0.06, 0.04), rng.uniform(-0.05, 0.03),
            rng.integers(30, 110), rng.uniform(24, 36),
        ]
        if ndre < 0.28 or msi > 1.8:
            label = rng.choice(["warning", "critical"], p=[0.6, 0.4])
        elif ndvi > 0.7 and ndre > 0.35:
            label = rng.choice(["excellent", "good"], p=[0.5, 0.5])
        else:
            label = "good"
        X.append(row)
        y.append(label)
    return np.array(X), np.array(y)


def export_rules(model, output_path):
    """Export v2 JSON compatible with lib/science/ml/model-registry.ts."""
    payload = {
        "crop": "soybean",
        "version": "1.1.0",
        "inferenceFormat": "ruleSurrogate",
        "featureOrder": FEATURES,
        "baseScores": {k: 0.25 for k in LABELS},
        "sklearnClasses": model.classes_.tolist(),
        "featureImportances": dict(zip(FEATURES, model.feature_importances_.tolist())),
        "rules": [
            {"feature": "ndre", "op": "lt", "threshold": 0.28,
             "classDelta": {"excellent": -0.2, "good": -0.1, "warning": 0.15, "critical": 0.15}},
            {"feature": "ndreSlope7d", "op": "lt", "threshold": -0.03,
             "classDelta": {"excellent": -0.15, "good": -0.05, "warning": 0.1, "critical": 0.1}},
            {"feature": "dpRvi", "op": "lt", "threshold": 0.12,
             "classDelta": {"excellent": -0.1, "good": 0, "warning": 0.05, "critical": 0.05}},
            {"feature": "msi", "op": "gt", "threshold": 1.8,
             "classDelta": {"excellent": -0.1, "good": 0, "warning": 0.1, "critical": 0}},
            {"feature": "lst", "op": "gt", "threshold": 34,
             "classDelta": {"excellent": -0.1, "good": -0.05, "warning": 0.1, "critical": 0.05}},
        ],
    }
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(payload, f, indent=2)
    print(f"Wrote {output_path}")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", default="models/soybean_rf_v1.json")
    args = parser.parse_args()

    X, y = synth_dataset()
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    clf = RandomForestClassifier(n_estimators=100, max_depth=8, random_state=42)
    clf.fit(X_train, y_train)
    acc = clf.score(X_test, y_test)
    print(f"Test accuracy: {acc:.3f}")
    export_rules(clf, args.output)


if __name__ == "__main__":
    main()
