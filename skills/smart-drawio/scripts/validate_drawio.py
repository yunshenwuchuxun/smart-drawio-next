#!/usr/bin/env python3
"""Read-only, standard-library checks for uncompressed mxGraph XML.

This intentionally provides basic structure/reference checks, not rendering or
full parity with Smart Drawio MCP. No project imports or third-party packages.
"""

import argparse
import json
import math
from pathlib import Path
import re
import sys
import xml.etree.ElementTree as ET


MAX_BYTES = 2 * 1024 * 1024
LIMITATIONS = "Basic XML and per-page graph checks only; layout, styling and compressed pages are not validated."


def failure(code, message, **context):
    return {"valid": False, "code": code, "error": message,
            "diagnostics": [{"code": code, "message": message, **context}],
            "limitations": LIMITATIONS}


def has_direct_text(element):
    return bool((element.text or "").strip()) or any((child.tail or "").strip() for child in element)


def check_model(model, context):
    children = list(model)
    if len(children) != 1 or children[0].tag != "root" or has_direct_text(model):
        return failure("INVALID_GRAPH_ROOT", "Each mxGraphModel needs exactly one root element.", **context)
    root = children[0]
    if has_direct_text(root):
        return failure("INVALID_GRAPH_ROOT", "Graph root cannot contain text outside its cells.", **context)
    cells = {}
    for entry in root:
        wrapped = entry.tag in ("object", "UserObject")
        candidates = [child for child in entry if child.tag == "mxCell"] if wrapped else [entry]
        if len(candidates) != 1 or candidates[0].tag != "mxCell":
            return failure("INVALID_GRAPH_CELL", "Expected mxCell or an object wrapping one mxCell.", **context)
        cell = candidates[0]
        cell_id = cell.get("id")
        wrapper_id = entry.get("id") if wrapped else None
        if cell_id and wrapper_id and cell_id != wrapper_id:
            return failure("AMBIGUOUS_CELL_ID", "Wrapper and mxCell ids disagree.", **context)
        cell_id = cell_id or wrapper_id
        if not cell_id or not cell_id.strip():
            return failure("MISSING_CELL_ID", "Every cell needs an id.", **context)
        if cell_id in cells:
            return failure("DUPLICATE_CELL_ID", "Cell ids must be unique within each page.", cellId=cell_id, **context)
        cells[cell_id] = cell
    if sum(1 for _ in root.iter("mxCell")) != len(cells):
        return failure("INVALID_GRAPH_CELL", "Nested mxCell elements are unsupported.", **context)
    if ("0" not in cells or "1" not in cells or "parent" in cells["0"].attrib
            or cells["1"].get("parent") != "0"):
        return failure("INVALID_BASE_CELLS", "Page needs cell 0 without parent and cell 1 with parent=0.", **context)

    for cell_id, cell in cells.items():
        cell_context = {**context, "cellId": cell_id}
        if cell_id != "0" and not cell.get("parent"):
            return failure("MISSING_PARENT", "Cell needs a parent in its page.", **cell_context)
        for attribute in ("parent", "source", "target"):
            if attribute in cell.attrib and cell.get(attribute) not in cells:
                return failure("DANGLING_CELL_REFERENCE", "Reference does not resolve in this page.",
                               attribute=attribute, reference=cell.get(attribute), **cell_context)
        vertex = cell.get("vertex") == "1"
        edge = cell.get("edge") == "1"
        if vertex and edge:
            return failure("INVALID_CELL_TYPE", "A cell cannot be both a vertex and an edge.", **cell_context)
        geometries = [child for child in cell if child.tag == "mxGeometry"]
        if (vertex or edge) and (len(geometries) != 1 or geometries[0].get("as") != "geometry"):
            return failure("INVALID_CELL_GEOMETRY", "Visible cells need one mxGeometry with as=geometry.", **cell_context)
        for geometry in geometries:
            for attribute in ("x", "y", "width", "height"):
                if attribute not in geometry.attrib:
                    continue
                try:
                    number = float(geometry.get(attribute))
                except (TypeError, ValueError):
                    number = math.nan
                if not math.isfinite(number) or (attribute in ("width", "height") and number < 0):
                    return failure("INVALID_GEOMETRY_VALUE", "Geometry must use finite numeric coordinates and nonnegative dimensions.",
                                   attribute=attribute, **cell_context)

    visited = set()
    for cell_id in cells:
        path = set()
        current = cell_id
        while current and current not in visited:
            if current in path:
                return failure("CYCLIC_PARENT", "Parent references must not form a cycle.", cellId=cell_id, **context)
            path.add(current)
            current = cells[current].get("parent")
        visited.update(path)
    return {"valid": True, "cellCount": len(cells)}


def validate_xml(xml):
    if not isinstance(xml, str) or not xml.strip():
        return failure("EMPTY_XML", "XML input is empty.")
    if len(xml.encode("utf-8")) > MAX_BYTES:
        return failure("INPUT_TOO_LARGE", "Input exceeds the fallback validator's 2 MiB limit.")
    # Reject declarations before ElementTree can expand internal entities.
    # Predefined XML entities and numeric character references remain supported.
    if re.search(r"<!\s*(?:DOCTYPE|ENTITY)\b", xml, re.IGNORECASE):
        return failure("UNSUPPORTED_DECLARATION", "DOCTYPE and custom entity declarations are not supported.")
    try:
        document = ET.fromstring(xml)
    except (ET.ParseError, ValueError) as error:
        return failure("XML_PARSE_ERROR", str(error))
    if document.tag == "mxGraphModel":
        pages = [(document, {"pageIndex": 0})]
    elif document.tag == "mxfile":
        diagrams = list(document)
        if not diagrams or any(child.tag != "diagram" for child in diagrams) or has_direct_text(document):
            return failure("INVALID_DIAGRAMS", "mxfile needs one or more diagram elements.")
        pages = []
        for index, diagram in enumerate(diagrams):
            context = {"pageIndex": index, "pageId": diagram.get("id")}
            children = list(diagram)
            if not children and (diagram.text or "").strip():
                return failure("UNSUPPORTED_COMPRESSED_DIAGRAM", "Compressed pages are unsupported; export uncompressed XML first.", **context)
            if len(children) != 1 or children[0].tag != "mxGraphModel" or has_direct_text(diagram):
                return failure("INVALID_DIAGRAM_MODEL", "Each diagram needs one uncompressed mxGraphModel.", **context)
            pages.append((children[0], context))
    else:
        return failure("INVALID_DOCUMENT_ROOT", "Expected mxfile or mxGraphModel; namespaced and other formats are unsupported.")

    cell_count = 0
    for model, context in pages:
        result = check_model(model, context)
        if not result["valid"]:
            return result
        cell_count += result["cellCount"]
    return {"valid": True, "code": "VALID", "error": None, "diagnostics": [],
            "pageCount": len(pages), "cellCount": cell_count, "limitations": LIMITATIONS}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("path", nargs="?", default="-", help="UTF-8 .drawio file, or - for stdin (default)")
    args = parser.parse_args()
    try:
        if args.path == "-":
            raw = sys.stdin.buffer.read(MAX_BYTES + 1)
        else:
            with Path(args.path).open("rb") as source:
                raw = source.read(MAX_BYTES + 1)
        result = failure("INPUT_TOO_LARGE", "Input exceeds 2 MiB.") if len(raw) > MAX_BYTES else validate_xml(raw.decode("utf-8-sig"))
    except (OSError, UnicodeError) as error:
        result = failure("INPUT_READ_ERROR", str(error))
    print(json.dumps(result, ensure_ascii=False))
    if result["valid"]:
        return 0
    return 2 if result["code"].startswith("UNSUPPORTED_") or result["code"] in ("INPUT_READ_ERROR", "INPUT_TOO_LARGE") else 1


if __name__ == "__main__":
    sys.exit(main())
