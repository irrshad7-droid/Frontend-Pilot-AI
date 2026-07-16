import os
import sys
import json
from dataclasses import dataclass
from typing import List, Dict, Any, Optional

import tree_sitter
import tree_sitter_typescript

# Add core to path if running standalone
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
from core.schemas import SourceSnapshot, CandidateFile, CandidateComponent, CandidateNode

TARGET_APP_SRC = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "target-app", "src"))

class SourceMapper:
    def __init__(self, src_dir: str = TARGET_APP_SRC):
        self.src_dir = src_dir
        # Initialize modern tree-sitter parser
        self.language = tree_sitter.Language(tree_sitter_typescript.language_tsx())
        self.parser = tree_sitter.Parser(self.language)
        self.index: Dict[str, Any] = {}

    def _walk_files(self) -> List[str]:
        tsx_files = []
        for root, _, files in os.walk(self.src_dir):
            for file in files:
                if file.endswith('.tsx') or file.endswith('.ts'):
                    tsx_files.append(os.path.join(root, file))
        return tsx_files

    def _extract_text(self, node: tree_sitter.Node, source_bytes: bytes) -> str:
        return source_bytes[node.start_byte:node.end_byte].decode('utf-8')

    def _find_parent_component(self, node: tree_sitter.Node, source_bytes: bytes) -> str:
        current = node
        while current:
            if current.type in ['function_declaration', 'arrow_function', 'variable_declarator']:
                # For function declarations
                if current.type == 'function_declaration':
                    id_node = current.child_by_field_name('name')
                    if id_node:
                        return self._extract_text(id_node, source_bytes)
                # For arrow functions assigned to variables
                if current.type == 'variable_declarator':
                    id_node = current.child_by_field_name('name')
                    if id_node:
                        return self._extract_text(id_node, source_bytes)
            current = current.parent
        return "UnknownComponent"

    def find_candidates(self, target_label: str, target_element_type: str = None) -> SourceSnapshot:
        files = self._walk_files()
        candidate_files_map = {}

        query_label_lower = target_label.lower() if target_label else ""

        for file_path in files:
            with open(file_path, 'r', encoding='utf-8') as f:
                source_code = f.read()
            source_bytes = source_code.encode('utf-8')
            
            tree = self.parser.parse(source_bytes)
            
            # Find JSX elements
            # A simple recursive traversal to inspect JSX tags and their attributes/text
            def walk_ast(node: tree_sitter.Node):
                nodes_found = []
                
                # Check for JSX elements
                if node.type in ['jsx_element', 'jsx_self_closing_element']:
                    is_match = False
                    match_reason = ""
                    confidence = 0.0
                    
                    snippet = self._extract_text(node, source_bytes)
                    snippet_lower = snippet.lower()
                    
                    tag_name_node = None
                    if node.type == 'jsx_element':
                        open_tag = node.child_by_field_name('open_tag')
                        if open_tag:
                            tag_name_node = open_tag.child_by_field_name('name')
                    else:
                        tag_name_node = node.child_by_field_name('name')
                        
                    tag_name = self._extract_text(tag_name_node, source_bytes) if tag_name_node else "unknown"
                    
                    # Heuristics
                    # 1. Exact or partial text match in the JSX content
                    if query_label_lower and query_label_lower in snippet_lower:
                        # 2. Type matches exactly (e.g. searching for button and tag is button)
                        if target_element_type and target_element_type.lower() == tag_name.lower():
                            is_match = True
                            confidence = 0.9
                            match_reason = f"Exact element type '{tag_name}' and text match for '{target_label}'"
                        else:
                            is_match = True
                            confidence = 0.5
                            match_reason = f"Partial text match for '{target_label}' inside element '{tag_name}'"
                            
                    if is_match:
                        comp_name = self._find_parent_component(node, source_bytes)
                        nodes_found.append({
                            'component': comp_name,
                            'node': CandidateNode(
                                node_type=node.type,
                                line_start=node.start_point[0] + 1,
                                line_end=node.end_point[0] + 1,
                                snippet=snippet,
                                match_reason=match_reason,
                                heuristic_confidence=confidence
                            )
                        })

                for child in node.children:
                    nodes_found.extend(walk_ast(child))
                return nodes_found

            file_matches = walk_ast(tree.root_node)
            
            if file_matches:
                comps_map = {}
                for fm in file_matches:
                    cname = fm['component']
                    if cname not in comps_map:
                        comps_map[cname] = []
                    comps_map[cname].append(fm['node'])
                
                candidate_components = []
                file_highest_conf = 0.0
                
                for cname, nodes in comps_map.items():
                    comp_conf = max(n.heuristic_confidence for n in nodes)
                    file_highest_conf = max(file_highest_conf, comp_conf)
                    candidate_components.append(CandidateComponent(
                        component_name=cname,
                        matching_nodes=nodes,
                        heuristic_confidence=comp_conf
                    ))
                
                candidate_files_map[file_path] = CandidateFile(
                    file_path=file_path,
                    components=candidate_components,
                    heuristic_confidence=file_highest_conf
                )
                
        # Sort files by confidence
        sorted_files = sorted(candidate_files_map.values(), key=lambda x: x.heuristic_confidence, reverse=True)
        
        return SourceSnapshot(
            target_observation=f"Element type: {target_element_type}, Label: {target_label}",
            candidate_files=sorted_files
        )

if __name__ == "__main__":
    mapper = SourceMapper()
    
    # Simulating an Explorer observation
    print("Testing Source Mapper against Target App...")
    snapshot = mapper.find_candidates(target_label="Clear completed", target_element_type="button")
    
    print("\n" + "="*40)
    print("Source Mapping Output")
    print("="*40)
    print(snapshot.model_dump_json(indent=2))
