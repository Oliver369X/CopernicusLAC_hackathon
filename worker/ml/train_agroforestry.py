#!/usr/bin/env python3
"""Multitemporal RF baseline for coffee/cacao agroforestry (shared pipeline)."""
import argparse
import json
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split

FEATURES = ["ndvi", "ndre", "dpRvi", "sarContrast", "sarHomogeneity", "ndviSlope7d"]
CLASSES = ["full_sun", "shaded", "young", "uncertain"]


def synth(n=600, seed=7):
    rng = np.random.default_rng(seed)
    X, y = [], []
    for _ in range(n):
        cls = rng.choice(CLASSES)
        if cls == "full_sun":
            row = [rng.uniform(0.72, 0.88), rng.uniform(0.4, 0.55), rng.uniform(0.2, 0.35),
                   rng.uniform(0.1, 0.3), rng.uniform(0.55, 0.8), rng.uniform(-0.02, 0.03)]
        elif cls == "shaded":
            row = [rng.uniform(0.55, 0.72), rng.uniform(0.32, 0.45), rng.uniform(0.15, 0.28),
                   rng.uniform(0.35, 0.65), rng.uniform(0.35, 0.55), rng.uniform(-0.03, 0.02)]
        elif cls == "young":
            row = [rng.uniform(0.35, 0.52), rng.uniform(0.22, 0.35), rng.uniform(0.06, 0.15),
                   rng.uniform(0.2, 0.5), rng.uniform(0.4, 0.7), rng.uniform(0.01, 0.06)]
        else:
            row = [rng.uniform(0.45, 0.65), rng.uniform(0.28, 0.4), rng.uniform(0.1, 0.22),
                   rng.uniform(0.25, 0.55), rng.uniform(0.4, 0.65), rng.uniform(-0.04, 0.04)]
        X.append(row)
        y.append(cls)
    return np.array(X), np.array(y)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--crop", default="coffee", choices=["coffee", "cacao"])
    parser.add_argument("--output", default="models/agroforestry_rf_v1.json")
    args = parser.parse_args()

    X, y = synth()
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=7)
    clf = RandomForestClassifier(n_estimators=80, random_state=7)
    clf.fit(X_train, y_train)
    print(f"{args.crop} accuracy: {clf.score(X_test, y_test):.3f}")

    out = {
        "crop": args.crop,
        "version": "1.0.0",
        "productionClasses": CLASSES,
        "featureImportances": dict(zip(FEATURES, clf.feature_importances_.tolist())),
    }
    with open(args.output, "w", encoding="utf-8") as f:
        json.dump(out, f, indent=2)
    print(f"Wrote {args.output}")


if __name__ == "__main__":
    main()
