import importlib.util
import json
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile
import unittest


SKILL = Path(__file__).resolve().parents[2] / "skills" / "smart-drawio"
spec = importlib.util.spec_from_file_location("drawio_validator", SKILL / "scripts" / "validate_drawio.py")
validator = importlib.util.module_from_spec(spec)
spec.loader.exec_module(validator)

BASE = '<mxCell id="0"/><mxCell id="1" parent="0"/>'


def vertex(cell_id, parent="1"):
    return f'<mxCell id="{cell_id}" value="中文参数 &amp; α" vertex="1" parent="{parent}"><mxGeometry width="120" height="60" as="geometry"/></mxCell>'


def page(page_id, cells=""):
    return f'<diagram id="{page_id}"><mxGraphModel><root>{BASE}{cells}</root></mxGraphModel></diagram>'


class ValidatorTests(unittest.TestCase):
    def test_templates_are_valid_without_project_dependencies(self):
        for template in SKILL.joinpath("assets").glob("*.drawio"):
            with self.subTest(template=template.name):
                self.assertTrue(validator.validate_xml(template.read_text(encoding="utf-8"))["valid"])

    def test_unicode_rich_text_and_numeric_entities(self):
        xml = '<mxfile>' + page("中文", vertex("node").replace('value="中文参数 &amp; α"', 'value="&lt;b&gt;中文 &amp; &#945;&lt;/b&gt;"')) + '</mxfile>'
        self.assertTrue(validator.validate_xml(xml)["valid"])

    def test_multiple_pages_use_separate_ids(self):
        xml = '<mxfile>' + page("a", vertex("node")) + page("b", vertex("node")) + '</mxfile>'
        self.assertEqual(validator.validate_xml(xml)["pageCount"], 2)

    def test_duplicate_ids_inside_one_page_fail(self):
        xml = '<mxfile>' + page("a", vertex("node") + vertex("node")) + '</mxfile>'
        self.assertEqual(validator.validate_xml(xml)["code"], "DUPLICATE_CELL_ID")

    def test_references_cannot_cross_pages(self):
        for attribute in ("parent", "source", "target"):
            with self.subTest(attribute=attribute):
                cell = vertex("local", "remote") if attribute == "parent" else f'<mxCell id="edge" edge="1" parent="1" {attribute}="remote"><mxGeometry relative="1" as="geometry"/></mxCell>'
                xml = '<mxfile>' + page("a", cell) + page("b", vertex("remote")) + '</mxfile>'
                result = validator.validate_xml(xml)
                self.assertEqual(result["code"], "DANGLING_CELL_REFERENCE")
                self.assertEqual(result["diagnostics"][0]["pageIndex"], 0)

    def test_cyclic_parents_fail_but_graph_self_loops_pass(self):
        cycle = '<mxfile>' + page("a", vertex("a", "b") + vertex("b", "a")) + '</mxfile>'
        self.assertEqual(validator.validate_xml(cycle)["code"], "CYCLIC_PARENT")
        loop = '<mxCell id="loop" edge="1" parent="1" source="node" target="node"><mxGeometry relative="1" as="geometry"/></mxCell>'
        self.assertTrue(validator.validate_xml('<mxfile>' + page("a", vertex("node") + loop) + '</mxfile>')["valid"])

    def test_syntax_entities_and_doctype_fail(self):
        for xml in ('<mxfile><diagram></mxfile>', '<mxfile label="A & B"/>',
                    '<mxfile label="NUL\x00"/>', '<mxfile label="&undefined;"/>',
                    '<!DOCTYPE mxfile [<!ENTITY e "test">]><mxfile/>', '<!ENTITY e SYSTEM "file:///private">'):
            with self.subTest(xml=xml):
                self.assertFalse(validator.validate_xml(xml)["valid"])

    def test_compressed_pages_are_explicitly_unsupported(self):
        self.assertEqual(validator.validate_xml('<mxfile><diagram id="p">eJzLz0...</diagram></mxfile>')["code"], "UNSUPPORTED_COMPRESSED_DIAGRAM")

    def test_geometry_and_base_cells(self):
        bad = '<mxfile>' + page("a", vertex("node").replace('width="120"', 'width="NaN"')) + '</mxfile>'
        self.assertEqual(validator.validate_xml(bad)["code"], "INVALID_GEOMETRY_VALUE")
        self.assertEqual(validator.validate_xml('<mxGraphModel><root><mxCell id="0"/></root></mxGraphModel>')["code"], "INVALID_BASE_CELLS")

    def test_object_wrappers(self):
        cell = '<object id="node" label="标签"><mxCell vertex="1" parent="1"><mxGeometry width="120" height="60" as="geometry"/></mxCell></object>'
        self.assertTrue(validator.validate_xml('<mxfile>' + page("a", cell) + '</mxfile>')["valid"])

    def test_clean_install_copy_file_and_stdin(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            copied = Path(temp_dir) / "installed-skill"
            shutil.copytree(SKILL, copied)
            script = copied / "scripts" / "validate_drawio.py"
            template = copied / "assets" / "research-architecture.drawio"
            original = template.read_bytes()
            result = subprocess.run([sys.executable, "-I", str(script), str(template)], cwd=temp_dir, capture_output=True, text=True)
            self.assertEqual(result.returncode, 0, result.stderr)
            self.assertTrue(json.loads(result.stdout)["valid"])
            self.assertEqual(template.read_bytes(), original)
            invalid = subprocess.run([sys.executable, "-I", str(script), "-"], input='<mxfile><diagram>', cwd=temp_dir, capture_output=True, text=True)
            self.assertEqual(invalid.returncode, 1)
            self.assertFalse(json.loads(invalid.stdout)["valid"])
            unsupported = subprocess.run([sys.executable, "-I", str(script), "-"], input='<mxfile><diagram>compressed</diagram></mxfile>', cwd=temp_dir, capture_output=True, text=True)
            self.assertEqual(unsupported.returncode, 2)


if __name__ == "__main__":
    unittest.main()
