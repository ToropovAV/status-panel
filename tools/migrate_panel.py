#!/usr/bin/env python3
"""
migrate_panel.py — migrates Grafana status-panel JSON from old plugin to new.

Supports both old plugin type IDs:
  - serrrios-statusoverview-panel  (original)
  - status-panel                     (new, already migrated panels are skipped)

Usage:
    # Single file
    python migrate_panel.py -i panel.json -o panel_migrated.json

    # Folder → folder (processes all .json files)
    python migrate_panel.py -i /path/to/input_folder -o /path/to/output_folder

    # Windows paths — always wrap in double quotes!
    python migrate_panel.py -i "Z:\Python\input" -o "Z:\Python\output"

    # In-place (overwrites originals — make a backup first!)
    python migrate_panel.py -i /path/to/folder -o /path/to/folder
"""

import argparse
import copy
import json
import uuid
from pathlib import Path


# ── Constants ─────────────────────────────────────────────────────────────────

OLD_PLUGIN_TYPE = "serrrios-statusoverview-panel"
NEW_PLUGIN_TYPE = "toropovav-status-panel"

THRESHOLD_KEYS = ("information", "warning", "average", "high", "disaster")

# Old Color* option keys → (new camelCase key, default hex value)
COLOR_MAP = {
    "ColorOK":          ("colorOK",          "#2cda01"),
    "ColorInformation": ("colorInformation",  "#5794F2"),
    "ColorWarning":     ("colorWarning",      "#faf82a"),
    "ColorAverage":     ("colorAverage",      "#ffa230"),
    "ColorHigh":        ("colorHigh",         "#fa6400fc"),
    "ColorDisaster":    ("colorDisaster",     "#ff0000"),
    "ColorDisable":     ("colorDisable",      "#6E6E6E"),
    "ColorNa":          ("colorNa",           "#B0B0B0"),
}

# New option fields added in rewrite — set to safe defaults if absent
NEW_OPTION_DEFAULTS = {
    "switchToNaOnError": True,
    "dataErrorMessage": "",
    "fontSizeTitle": 18,
    "fontSizeMetrics": 12,
    "cornerRadius": 20,
    "colorizeMetrics": True,
    "showTimestamp": True,
    "timestampFormat": "relative",
    "iconType": "none",
    "iconBuiltin": "",
    "iconUrl": "",
    "iconSize": 20,
    "blinkDuration": 10,
    "soundEnabled": True,
    "soundSettings": {
        "volume": 70,
        "soundConfig": {
            "information": {"mode": "builtin", "customUrl": ""},
            "warning":     {"mode": "builtin", "customUrl": ""},
            "average":     {"mode": "builtin", "customUrl": ""},
            "high":        {"mode": "builtin", "customUrl": ""},
            "disaster":    {"mode": "custom",  "customUrl": "https://storage.yandexcloud.net/alfaleasing/Grafana/Kaspersky_pig.mp3"},
        },
    },
    "textColorEnabled": True,
    "textColor": "#000000",
}

# Old rule-level fields to remove
RULE_FIELDS_TO_REMOVE = {
    "revers",
    "clickThrough",
    "clickThroughOpenNewTab",
    "clickThroughSanitize",
    "label",
    "shortAlias",
    "showMembers",
    "isTemplated",
    "enabled",
}

# Stale ruleConfig root keys to remove
RULE_CONFIG_KEYS_TO_REMOVE = {"animationSpeed", "enabled", "rule"}

# Old top-level Color* option keys to remove after migration
OLD_OPTION_KEYS_TO_REMOVE = set(COLOR_MAP.keys())


# ── Rule migration ─────────────────────────────────────────────────────────────

def normalize_unit(value) -> str:
    """Empty string and 'None' → 'none'; everything else kept as-is."""
    if value is None or str(value).strip() in ("", "None"):
        return "none"
    return str(value)


def migrate_rule(old: dict) -> dict:
    rule = copy.deepcopy(old)

    # 1. revers → reverseLogic
    if "reverseLogic" not in rule:
        rule["reverseLogic"] = bool(rule.get("revers", False))

    # 2. clickThrough → metricURL (only if metricURL absent or empty)
    if not rule.get("metricURL") and rule.get("clickThrough"):
        rule["metricURL"] = rule["clickThrough"]

    # 3. Ensure metricURL key always present
    rule.setdefault("metricURL", "")

    # 4. unit normalisation: '' and 'None' → 'none'
    rule["unit"] = normalize_unit(rule.get("unit"))

    # 5. Ensure id exists
    if not rule.get("id"):
        rule["id"] = str(uuid.uuid4())

    # 6. Ensure alias exists
    rule.setdefault("alias", "")

    # 7. Ensure threshold dicts have all keys
    for th_key in ("numberThreshold", "stringThreshold"):
        if th_key not in rule or not isinstance(rule[th_key], dict):
            rule[th_key] = {k: "" for k in THRESHOLD_KEYS}
        else:
            for k in THRESHOLD_KEYS:
                rule[th_key].setdefault(k, "")

    # 8. Remove legacy fields
    for field in RULE_FIELDS_TO_REMOVE:
        rule.pop(field, None)

    return rule


# ── Options migration ─────────────────────────────────────────────────────────

def migrate_options(old_opts: dict) -> dict:
    opts = copy.deepcopy(old_opts)

    # 1. Migrate Color* → color* (camelCase), always use new plugin defaults
    for old_key, (new_key, default_hex) in COLOR_MAP.items():
        opts[new_key] = default_hex

    # 2. Remove old Color* keys
    for old_key in OLD_OPTION_KEYS_TO_REMOVE:
        opts.pop(old_key, None)

    # 3. Add missing new-plugin option fields with defaults
    for key, default in NEW_OPTION_DEFAULTS.items():
        if key not in opts:
            opts[key] = copy.deepcopy(default)

    # 4. Clean up stale ruleConfig root keys and migrate rules
    rc = opts.get("ruleConfig", {})
    for key in RULE_CONFIG_KEYS_TO_REMOVE:
        rc.pop(key, None)
    rc["rules"] = [migrate_rule(r) for r in rc.get("rules", [])]
    opts["ruleConfig"] = rc

    return opts


# ── Panel migration ───────────────────────────────────────────────────────────

def migrate_panel(panel: dict) -> tuple[dict, int]:
    panel = copy.deepcopy(panel)
    panel["options"] = migrate_options(panel.get("options", {}))
    # Update plugin type to new ID
    panel["type"] = NEW_PLUGIN_TYPE
    count = len(panel["options"].get("ruleConfig", {}).get("rules", []))
    return panel, count


# ── JSON traversal ────────────────────────────────────────────────────────────

def process_json(data: dict) -> tuple[dict, int]:
    """Recursively finds all old-type status panels and migrates them."""
    total = 0

    def walk(obj):
        nonlocal total
        if isinstance(obj, list):
            for item in obj:
                walk(item)
        elif isinstance(obj, dict):
            if obj.get("type") == OLD_PLUGIN_TYPE and "options" in obj:
                migrated, count = migrate_panel(obj)
                obj.clear()
                obj.update(migrated)
                total += count
                print(f"    ✓ Panel id={obj.get('id', '?')} "
                      f"'{obj.get('title', '')}' — {count} rules migrated")
            else:
                for v in obj.values():
                    if isinstance(v, (dict, list)):
                        walk(v)

    walk(data)
    return data, total


# ── File processing ───────────────────────────────────────────────────────────

def process_file(input_path: Path, output_path: Path) -> int:
    with open(input_path, encoding="utf-8") as f:
        data = json.load(f)

    data, total = process_json(data)

    output_path.parent.mkdir(parents=True, exist_ok=True)
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    return total


# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(
        description="Migrate Grafana status-panel JSON from old plugin format to new."
    )
    parser.add_argument("-i", "--input",  required=True,
                        help="Input JSON file or folder with JSON files")
    parser.add_argument("-o", "--output", required=True,
                        help="Output JSON file or folder")
    args = parser.parse_args()

    # Normalize path separators for cross-platform compatibility
    input_path  = Path(args.input.replace('\\', '/'))
    output_path = Path(args.output.replace('\\', '/'))

    if not input_path.exists():
        print(f"Error: input path not found: {input_path}")
        print()
        print("Tip: on Windows wrap paths in double quotes:")
        print(r'  python migrate_panel.py -i "Z:\Python\1" -o "Z:\Python\2"')
        raise SystemExit(1)

    # ── Folder mode ───────────────────────────────────────────────────────────
    if input_path.is_dir():
        json_files = sorted(input_path.glob("*.json"))
        if not json_files:
            print(f"No .json files found in: {input_path}")
            raise SystemExit(0)

        print(f"Input folder:  {input_path}  ({len(json_files)} files)")
        print(f"Output folder: {output_path}\n")

        grand_total = 0
        for src in json_files:
            dst = output_path / src.name
            print(f"  {src.name}")
            try:
                count = process_file(src, dst)
                grand_total += count
            except Exception as e:
                print(f"    ✗ Error: {e}")

        print(f"\nDone. Total rules migrated across all files: {grand_total}")

    # ── Single file mode ──────────────────────────────────────────────────────
    else:
        print(f"Input:  {input_path}")
        print(f"Output: {output_path}\n")
        count = process_file(input_path, output_path)
        print(f"\nDone. Total rules migrated: {count}")


if __name__ == "__main__":
    main()
