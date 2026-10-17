#!/usr/bin/env python3
"""Render reviewed catalog JSON into a static HTML shell. No installation actions."""
import argparse
import json
from pathlib import Path


def render(catalog, template):
    data = json.loads(catalog)
    if not isinstance(data.get('entries'), list):
        raise ValueError('entries must be an array')
    ids = [row['id'] for row in data['entries']]
    if len(ids) != len(set(ids)):
        raise ValueError('duplicate catalog IDs')
    if template.count('__DATA__') != 1:
        raise ValueError('template must contain exactly one __DATA__ marker')
    safe = json.dumps(data, ensure_ascii=False).replace('<', '\\u003c').replace('>', '\\u003e').replace('&', '\\u0026')
    return template.replace('__DATA__', safe)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--catalog', required=True, type=Path)
    parser.add_argument('--template', required=True, type=Path)
    parser.add_argument('--output', required=True, type=Path)
    args = parser.parse_args()
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(render(args.catalog.read_text(), args.template.read_text()))


if __name__ == '__main__':
    main()
